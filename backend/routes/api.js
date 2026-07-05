const express     = require('express');
const router      = express.Router();
const db          = require('../config/db');
const verifyToken = require('../middleware/auth');
const { recordSessionCompletion } = require('../services/gamificationService');

// ── Health check ──────────────────────────────────────────────────────────
router.get('/status', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', message: 'Backend operativo', timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database non raggiungibile' });
  }
});

// ── Subjects ──────────────────────────────────────────────────────────────

// GET /api/subjects — lista materie dell'utente autenticato con conteggio flashcard e mastered
router.get('/subjects', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.id, s.subjectName, s.description, s.color, s.emoji,
             COUNT(DISTINCT fl.flashcard_id)                AS cardCount,
             SUM(fl.status = 'mastered')                   AS masteredCount
      FROM subject s
      LEFT JOIN lessons l           ON l.subject_id  = s.id
      LEFT JOIN flashcard_lesson fl ON fl.lesson_id  = l.id
      WHERE s.user_id = ?
      GROUP BY s.id, s.subjectName, s.description, s.color, s.emoji
      ORDER BY s.subjectName ASC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/subjects:', err);
    res.status(500).json({ error: 'Errore nel recupero delle materie' });
  }
});

// POST /api/subjects — crea nuova materia per l'utente autenticato
router.post('/subjects', verifyToken, async (req, res) => {
  try {
    const { subjectName, description, color, emoji } = req.body;
    if (!subjectName?.trim()) {
      return res.status(400).json({ error: 'Il nome della materia è obbligatorio' });
    }
    const [result] = await db.query(
      'INSERT INTO subject (user_id, subjectName, description, color, emoji) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, subjectName.trim(), description?.trim() || null, color || '#2563EB', emoji || '📚']
    );
    res.status(201).json({
      id: result.insertId,
      user_id: req.user.id,
      subjectName: subjectName.trim(),
      description: description?.trim() || '',
      color: color || '#2563EB',
      emoji: emoji || '📚',
      cardCount: 0,
    });
  } catch (err) {
    console.error('POST /api/subjects:', err);
    res.status(500).json({ error: 'Errore nella creazione della materia' });
  }
});

// PUT /api/subjects/:id — modifica materia
router.put('/subjects/:id', verifyToken, async (req, res) => {
  try {
    const { subjectName, description, color, emoji } = req.body;
    if (!subjectName?.trim()) {
      return res.status(400).json({ error: 'Il nome della materia è obbligatorio' });
    }
    const [result] = await db.query(
      'UPDATE subject SET subjectName = ?, description = ?, color = ?, emoji = ? WHERE id = ? AND user_id = ?',
      [subjectName.trim(), description?.trim() || null, color || '#2563EB', emoji || '📚', req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Materia non trovata' });
    res.json({ id: Number(req.params.id), subjectName: subjectName.trim(), description: description?.trim() || '', color: color || '#2563EB', emoji: emoji || '📚' });
  } catch (err) {
    console.error('PUT /api/subjects/:id:', err);
    res.status(500).json({ error: 'Errore nella modifica della materia' });
  }
});

// DELETE /api/subjects/:id — elimina materia e tutto il suo contenuto (CASCADE nel DB)
router.delete('/subjects/:id', verifyToken, async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM subject WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Materia non trovata' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/subjects/:id:', err);
    res.status(500).json({ error: 'Errore nell\'eliminazione della materia' });
  }
});

// GET /api/subjects/:id — dettaglio singola materia
router.get('/subjects/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.id, s.subjectName, s.description, s.color, s.emoji,
             COUNT(DISTINCT l.id)           AS lessonCount,
             COUNT(DISTINCT fl.flashcard_id) AS cardCount
      FROM subject s
      LEFT JOIN lessons l           ON l.subject_id  = s.id
      LEFT JOIN flashcard_lesson fl ON fl.lesson_id  = l.id
      WHERE s.id = ? AND s.user_id = ?
      GROUP BY s.id
    `, [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Materia non trovata' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/subjects/:id:', err);
    res.status(500).json({ error: 'Errore nel recupero della materia' });
  }
});

// ── Lessons ───────────────────────────────────────────────────────────────
//
// Le lezioni non hanno un proprio user_id: appartengono a una subject, che a
// sua volta appartiene a un utente (utenti → subject → lessons → flashcard).
// Per questo ogni rotta qui sotto è protetta da verifyToken E fa sempre un
// controllo di ownership che risale la catena fino a subject.user_id, prima
// di leggere/scrivere qualunque cosa — altrimenti chiunque autenticato (o,
// se manca pure verifyToken, chiunque punto) potrebbe leggere/modificare/
// cancellare le lezioni e le flashcard di un altro utente semplicemente
// indovinando un id numerico (IDOR). Quando il controllo fallisce si
// risponde 404 "non trovata" invece di 403 "non tua", per non confermare a
// un estraneo che quell'id esiste ma appartiene a qualcun altro.

// GET /api/subjects/:id/lessons — lezioni con conteggio flashcard e progresso
router.get('/subjects/:id/lessons', verifyToken, async (req, res) => {
  try {
    const [subjectRows] = await db.query(
      'SELECT id FROM subject WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!subjectRows.length) return res.status(404).json({ error: 'Materia non trovata' });

    const [rows] = await db.query(`
      SELECT l.id, l.name, l.description, l.subject_id,
             l.status, l.last_study, l.last_lesson_duration, l.created_at,
             COUNT(fl.flashcard_id)                                          AS flashcardCount,
             SUM(fl.status = 'mastered')                                     AS mastered_count,
             SUM(fl.status IN ('review', 'learning'))                         AS review_count
      FROM lessons l
      LEFT JOIN flashcard_lesson fl ON fl.lesson_id = l.id
      WHERE l.subject_id = ?
      GROUP BY l.id
      ORDER BY l.created_at ASC
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/subjects/:id/lessons:', err);
    res.status(500).json({ error: 'Errore nel recupero delle lezioni' });
  }
});

// POST /api/subjects/:id/lessons — crea nuova lezione
router.post('/subjects/:id/lessons', verifyToken, async (req, res) => {
  try {
    const [subjectRows] = await db.query(
      'SELECT id FROM subject WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!subjectRows.length) return res.status(404).json({ error: 'Materia non trovata' });

    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Il nome della lezione è obbligatorio' });
    const [result] = await db.query(
      'INSERT INTO lessons (name, description, subject_id) VALUES (?, ?, ?)',
      [name.trim(), description?.trim() || null, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM lessons WHERE id = ?', [result.insertId]);
    res.status(201).json({ ...rows[0], flashcardCount: 0 });
  } catch (err) {
    console.error('POST /api/subjects/:id/lessons:', err);
    res.status(500).json({ error: 'Errore nella creazione della lezione' });
  }
});

// PATCH /api/lessons/:id — aggiorna status/last_study/last_lesson_duration dopo una sessione
router.patch('/lessons/:id', verifyToken, async (req, res) => {
  try {
    // Risale da lesson a subject per verificare che la lezione sia dell'utente loggato
    const [own] = await db.query(
      `SELECT l.id FROM lessons l
       JOIN subject s ON s.id = l.subject_id
       WHERE l.id = ? AND s.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!own.length) return res.status(404).json({ error: 'Lezione non trovata' });

    const { status, last_study, last_lesson_duration } = req.body;
    await db.query(
      `UPDATE lessons SET
         status = COALESCE(?, status),
         last_study = COALESCE(?, last_study),
         last_lesson_duration = COALESCE(?, last_lesson_duration)
       WHERE id = ?`,
      [status ?? null, last_study ?? null, last_lesson_duration ?? null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/lessons/:id:', err);
    res.status(500).json({ error: "Errore nell'aggiornamento della lezione" });
  }
});

// DELETE /api/lessons/:id — elimina lezione + tutte le sue flashcard.
//
// Il CASCADE dello schema rimuove automaticamente le righe in flashcard_lesson
// quando si cancella una lesson, ma NON tocca la tabella flashcard stessa
// (le flashcard diventerebbero orfane). Per questo:
// 1. Si recuperano gli id delle flashcard legate a questa lezione
// 2. Si cancella la lezione (il CASCADE pulisce flashcard_lesson)
// 3. Si cancellano le flashcard orfane con quei id
router.delete('/lessons/:id', verifyToken, async (req, res) => {
  try {
    const [own] = await db.query(
      `SELECT l.id FROM lessons l
       JOIN subject s ON s.id = l.subject_id
       WHERE l.id = ? AND s.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!own.length) return res.status(404).json({ error: 'Lezione non trovata' });

    // 1. Trova le flashcard della lezione prima che il CASCADE le scolleghi
    const [fcRows] = await db.query(
      'SELECT flashcard_id FROM flashcard_lesson WHERE lesson_id = ?',
      [req.params.id]
    );
    const flashcardIds = fcRows.map(r => r.flashcard_id);

    // 2. Elimina la lezione → CASCADE rimuove le righe in flashcard_lesson
    await db.query('DELETE FROM lessons WHERE id = ?', [req.params.id]);

    // 3. Elimina le flashcard ora orfane
    if (flashcardIds.length > 0) {
      await db.query('DELETE FROM flashcard WHERE id IN (?)', [flashcardIds]);
    }

    res.json({ success: true, deletedFlashcards: flashcardIds.length });
  } catch (err) {
    console.error('DELETE /api/lessons/:id:', err);
    res.status(500).json({ error: 'Errore nell\'eliminazione della lezione' });
  }
});

// ── Flashcards ────────────────────────────────────────────────────────────
//
// Stessa logica delle lezioni: una flashcard non ha user_id proprio, quindi
// l'ownership si verifica risalendo flashcard → flashcard_lesson → lessons →
// subject.user_id.

// GET /api/lessons/:id/flashcards — flashcard di una lezione
// Il campo content (JSON) viene spacchettato in question/answer per il frontend
router.get('/lessons/:id/flashcards', verifyToken, async (req, res) => {
  try {
    const [own] = await db.query(
      `SELECT l.id FROM lessons l
       JOIN subject s ON s.id = l.subject_id
       WHERE l.id = ? AND s.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!own.length) return res.status(404).json({ error: 'Lezione non trovata' });

    const [rows] = await db.query(`
      SELECT f.id, f.content, f.difficult, f.created_at, fl.status
      FROM flashcard f
      JOIN flashcard_lesson fl ON fl.flashcard_id = f.id
      WHERE fl.lesson_id = ?
      ORDER BY f.created_at ASC
    `, [req.params.id]);
    // mysql2 restituisce le colonne JSON come stringa grezza → va parsata
    const parsed = rows.map(r => {
      const c = typeof r.content === 'string' ? JSON.parse(r.content) : (r.content ?? {});
      return {
        ...r,
        content:  c,
        question: c.question ?? '',
        answer:   c.answer   ?? '',
        status:   r.status ?? 'learning',
      };
    });
    res.json(parsed);
  } catch (err) {
    console.error('GET /api/lessons/:id/flashcards:', err);
    res.status(500).json({ error: 'Errore nel recupero delle flashcard' });
  }
});

// POST /api/lessons/:id/flashcards — crea flashcard in una lezione
router.post('/lessons/:id/flashcards', verifyToken, async (req, res) => {
  try {
    const [own] = await db.query(
      `SELECT l.id FROM lessons l
       JOIN subject s ON s.id = l.subject_id
       WHERE l.id = ? AND s.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!own.length) return res.status(404).json({ error: 'Lezione non trovata' });

    const { question, answer, difficult = 0 } = req.body;
    if (!question?.trim() || !answer?.trim()) {
      return res.status(400).json({ error: 'Domanda e risposta sono obbligatorie' });
    }
    const content = JSON.stringify({ question: question.trim(), answer: answer.trim() });
    const [fcResult] = await db.query(
      'INSERT INTO flashcard (content, difficult) VALUES (?, ?)',
      [content, difficult]
    );
    await db.query(
      'INSERT INTO flashcard_lesson (flashcard_id, lesson_id) VALUES (?, ?)',
      [fcResult.insertId, req.params.id]
    );
    res.status(201).json({
      id: fcResult.insertId,
      content: { question: question.trim(), answer: answer.trim() },
      question: question.trim(),
      answer:   answer.trim(),
      difficult,
    });
  } catch (err) {
    console.error('POST /api/lessons/:id/flashcards:', err);
    res.status(500).json({ error: 'Errore nella creazione della flashcard' });
  }
});

// ── Sessioni ──────────────────────────────────────────────────────────────

// POST /api/sessions — salva i risultati di una sessione, aggiorna lo status
// per card e i contatori di gamification (streak/punti/badge) dell'utente
// Body: { subjectId, lessonId, duration, results: [{cardId, rating}] }
//
// TRANSAZIONE: questo endpoint fa 4 scritture diverse sul database (sessione,
// stato delle flashcard, punti/streak, badge). Sono scritture "collegate":
// dal punto di vista dell'utente sono un unico gesto ("ho finito di
// studiare"), quindi devono comportarsi come un'unica operazione indivisibile
// — o vanno a buon fine TUTTE, o non ne va a buon fine NESSUNA. Senza questa
// garanzia, se ad esempio la scrittura dei badge fallisse per un problema
// imprevisto, la sessione e lo stato delle flashcard resterebbero comunque
// salvati mentre l'utente riceverebbe un errore: un disallineamento
// silenzioso tra "cosa è stato salvato davvero" e "cosa l'utente crede sia
// stato salvato" (l'utente vedrebbe un errore e magari riproverebbe,
// duplicando la sessione).
//
// Per ottenere questa garanzia si usa una transazione SQL:
// 1. si prende "in prestito" UNA connessione dedicata dal pool di database
//    (invece di lasciare che ogni query prenda una connessione diversa, come
//    succede normalmente con `db.query`);
// 2. si dice al database "da qui in poi, tieni in sospeso tutto quello che
//    scrivo" (beginTransaction);
// 3. se TUTTO va a buon fine, si dice "conferma, rendi definitivo tutto
//    quello che ho scritto" (commit);
// 4. se QUALSIASI cosa lancia un errore lungo il percorso, si dice "annulla,
//    fai finta che non sia successo nulla" (rollback) — riportando il
//    database esattamente allo stato precedente alla richiesta;
// 5. in ogni caso (successo o errore) si restituisce la connessione presa in
//    prestito al pool, così può essere riutilizzata da altre richieste
//    (`finally` → `release`).
router.post('/sessions', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { subjectId, lessonId, duration = 0, results = [] } = req.body;
  if (!subjectId || !lessonId) return res.status(400).json({ error: 'subjectId e lessonId obbligatori' });

  // subjectId/lessonId arrivano dal body: senza questo controllo un utente
  // potrebbe salvare una sessione (e far scattare punti/streak/badge) su una
  // lezione di un altro utente semplicemente inviando il suo id numerico.
  const [own] = await db.query(
    `SELECT l.id FROM lessons l
     JOIN subject s ON s.id = l.subject_id
     WHERE l.id = ? AND l.subject_id = ? AND s.user_id = ?`,
    [lessonId, subjectId, userId]
  );
  if (!own.length) return res.status(404).json({ error: 'Lezione non trovata' });

  const knew   = results.filter(r => r.rating === 'knew').length;
  const almost = results.filter(r => r.rating === 'almost').length;
  const forgot = results.filter(r => r.rating === 'forgot').length;
  const completed = results.length > 0 && forgot === 0 ? 1 : 0;
  const resultJson = JSON.stringify({ knew, almost, forgot, cards: results });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [row] = await conn.query(
      `INSERT INTO sessioni (user_id, subject_id, lesson_id, result, last_usage_date, session_duration, completed)
       VALUES (?, ?, ?, ?, NOW(), ?, ?)`,
      [userId, subjectId, lessonId, resultJson, duration, completed]
    );

    // Aggiorna lo status per ogni card in flashcard_lesson.
    // Eseguite in sequenza (non con Promise.all) perché condividono la
    // stessa connessione `conn`: una connessione MySQL esegue un comando
    // alla volta, quindi lanciarle "in parallelo" non le farebbe girare più
    // velocemente, andrebbero comunque in coda una dietro l'altra.
    if (results.length > 0) {
      const statusMap = { knew: 'mastered', almost: 'learning', forgot: 'review' };
      for (const r of results) {
        await conn.query(
          'UPDATE flashcard_lesson SET status = ? WHERE flashcard_id = ? AND lesson_id = ?',
          [statusMap[r.rating] ?? 'learning', r.cardId, lessonId]
        );
      }

      // duration arriva in secondi da StudySession.vue (elapsed incrementato ogni 1000ms)
      await recordSessionCompletion(conn, userId, { cardsInSession: results.length, knew, durationSeconds: duration });
    }

    await conn.commit();
    res.status(201).json({ id: row.insertId, knew, almost, forgot, completed });
  } catch (err) {
    await conn.rollback();
    console.error('POST /api/sessions:', err);
    res.status(500).json({ error: 'Errore nel salvataggio della sessione' });
  } finally {
    conn.release();
  }
});

// ── Ranking ───────────────────────────────────────────────────────────────

// GET /api/ranking — classifica globale ordinata per punti totali (top 50)
// A parità di punti vince chi è stato attivo più di recente (last_streak_date);
// u.id resta come ultimo spareggio deterministico se anche quella coincide.
router.get('/ranking', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id AS userId, u.name, u.lastName,
             COALESCE(p.total_point, 0) AS points,
             COALESCE(p.streak_days, 0) AS streak
      FROM utenti u
      JOIN points p ON p.user_id = u.id
      ORDER BY p.total_point DESC, p.last_streak_date DESC, u.id ASC
      LIMIT 50
    `);

    const ranking = rows.map((r, i) => ({
      rank: i + 1,
      userId: r.userId,
      name: `${r.name} ${r.lastName}`,
      points: Number(r.points),
      streak: Number(r.streak),
      isCurrentUser: r.userId === req.user.id,
    }));

    res.json(ranking);
  } catch (err) {
    console.error('GET /api/ranking:', err);
    res.status(500).json({ error: 'Errore nel recupero della classifica' });
  }
});

// PUT /api/flashcards/:id — modifica domanda, risposta e difficoltà di una flashcard
router.put('/flashcards/:id', verifyToken, async (req, res) => {
  try {
    // Una flashcard non ha subject_id/user_id diretto: l'ownership si
    // verifica risalendo alla lezione (via flashcard_lesson) e da lì alla
    // materia dell'utente loggato.
    const [own] = await db.query(
      `SELECT f.id FROM flashcard f
       JOIN flashcard_lesson fl ON fl.flashcard_id = f.id
       JOIN lessons l           ON l.id = fl.lesson_id
       JOIN subject s           ON s.id = l.subject_id
       WHERE f.id = ? AND s.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!own.length) return res.status(404).json({ error: 'Flashcard non trovata' });

    const { question, answer, difficult } = req.body;
    if (!question?.trim() || !answer?.trim()) {
      return res.status(400).json({ error: 'Domanda e risposta sono obbligatorie' });
    }
    const content = JSON.stringify({ question: question.trim(), answer: answer.trim() });
    await db.query(
      'UPDATE flashcard SET content = ?, difficult = ? WHERE id = ?',
      [content, difficult ?? 1, req.params.id]
    );
    res.json({
      id: Number(req.params.id),
      question: question.trim(),
      answer: answer.trim(),
      difficult: difficult ?? 1,
    });
  } catch (err) {
    console.error('PUT /api/flashcards/:id:', err);
    res.status(500).json({ error: 'Errore nella modifica della flashcard' });
  }
});

// DELETE /api/flashcards/:id — elimina flashcard
router.delete('/flashcards/:id', verifyToken, async (req, res) => {
  try {
    const [own] = await db.query(
      `SELECT f.id FROM flashcard f
       JOIN flashcard_lesson fl ON fl.flashcard_id = f.id
       JOIN lessons l           ON l.id = fl.lesson_id
       JOIN subject s           ON s.id = l.subject_id
       WHERE f.id = ? AND s.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!own.length) return res.status(404).json({ error: 'Flashcard non trovata' });

    await db.query('DELETE FROM flashcard WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/flashcards/:id:', err);
    res.status(500).json({ error: 'Errore nell\'eliminazione della flashcard' });
  }
});

// ── Dashboard ─────────────────────────────────────────────────────────────

// GET /api/dashboard — aggregato per la dashboard: stat cards, grafico settimanale
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Totale flashcard dell'utente
    const [[{ totalFlashcards }]] = await db.query(`
      SELECT COUNT(DISTINCT fl.flashcard_id) AS totalFlashcards
      FROM flashcard_lesson fl
      JOIN lessons l ON l.id = fl.lesson_id
      JOIN subject s ON s.id = l.subject_id
      WHERE s.user_id = ?
    `, [userId]);

    // Flashcard studiate oggi e tempo di studio odierno
    const [[todayRow]] = await db.query(`
      SELECT
        COALESCE(SUM(
          JSON_EXTRACT(result, '$.knew') +
          JSON_EXTRACT(result, '$.almost') +
          JSON_EXTRACT(result, '$.forgot')
        ), 0) AS studiedToday,
        COALESCE(SUM(session_duration), 0) AS studyTimeMinutes
      FROM sessioni
      WHERE user_id = ? AND DATE(created_at) = CURDATE() AND result IS NOT NULL
    `, [userId]);

    // Tasso di successo: 30gg e storico in un'unica query
    // AVG ignora i NULL, quindi il CASE filtra efficacemente per finestra temporale
    const [[rateRow]] = await db.query(`
      SELECT
        ROUND(AVG(CASE
          WHEN (JSON_EXTRACT(result, '$.knew') + JSON_EXTRACT(result, '$.almost') + JSON_EXTRACT(result, '$.forgot')) > 0
          THEN JSON_EXTRACT(result, '$.knew') /
               (JSON_EXTRACT(result, '$.knew') + JSON_EXTRACT(result, '$.almost') + JSON_EXTRACT(result, '$.forgot')) * 100
        END)) AS successRateAll,
        ROUND(AVG(CASE
          WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            AND (JSON_EXTRACT(result, '$.knew') + JSON_EXTRACT(result, '$.almost') + JSON_EXTRACT(result, '$.forgot')) > 0
          THEN JSON_EXTRACT(result, '$.knew') /
               (JSON_EXTRACT(result, '$.knew') + JSON_EXTRACT(result, '$.almost') + JSON_EXTRACT(result, '$.forgot')) * 100
        END)) AS successRate30d
      FROM sessioni
      WHERE user_id = ? AND result IS NOT NULL
    `, [userId]);

    // Streak dall'utente
    const [[pointsRow]] = await db.query(`
      SELECT COALESCE(streak_days, 0) AS streak FROM points WHERE user_id = ?
    `, [userId]);

    // Attività settimanale: ultimi 7 giorni raggruppati per data
    const [weekRows] = await db.query(`
      SELECT
        DATE(created_at) AS day,
        COALESCE(SUM(
          JSON_EXTRACT(result, '$.knew') +
          JSON_EXTRACT(result, '$.almost') +
          JSON_EXTRACT(result, '$.forgot')
        ), 0) AS studied,
        COALESCE(SUM(JSON_EXTRACT(result, '$.knew')), 0) AS correct
      FROM sessioni
      WHERE user_id = ?
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        AND result IS NOT NULL
      GROUP BY DATE(created_at)
    `, [userId]);

    // Costruisce array 7 giorni riempiendo i buchi con 0
    //
    // NOTA sul confronto delle date: qui NON si può usare toISOString() per
    // trasformare una data in stringa "YYYY-MM-DD", perché toISOString()
    // converte sempre in UTC. mysql2 restituisce le colonne DATE (come
    // `day` qui sotto) come oggetti Date che rappresentano la MEZZANOTTE
    // LOCALE di quel giorno — e con un fuso avanti rispetto a UTC (es.
    // Europe/Berlin, +2h d'estate), la mezzanotte locale corrisponde alle
    // 22:00 del giorno UTC precedente. toISOString() la riporterebbe quindi
    // al giorno prima, facendo "scivolare indietro" ogni sessione di un
    // giorno rispetto a "oggi" (calcolato invece con l'orario locale reale,
    // non di mezzanotte, che raramente attraversa quel confine). Per questo
    // si leggono sempre i componenti locali della data (getFullYear/
    // getMonth/getDate), mai la rappresentazione UTC.
    const toLocalDateStr = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = toLocalDateStr(d);
      const found = weekRows.find(r => {
        const rDate = r.day instanceof Date ? toLocalDateStr(r.day) : String(r.day).slice(0, 10);
        return rDate === dateStr;
      });
      weeklyActivity.push({
        day: dayNames[d.getDay()],
        studied: found ? Number(found.studied) : 0,
        correct: found ? Number(found.correct) : 0,
      });
    }

    res.json({
      totalFlashcards:  Number(totalFlashcards),
      studiedToday:     Number(todayRow.studiedToday),
      studyTimeMinutes: Number(todayRow.studyTimeMinutes),
      successRate30d:   rateRow.successRate30d  != null ? Number(rateRow.successRate30d)  : null,
      successRateAll:   rateRow.successRateAll  != null ? Number(rateRow.successRateAll)  : null,
      streak:           pointsRow ? Number(pointsRow.streak) : 0,
      weeklyActivity,
    });
  } catch (err) {
    console.error('GET /api/dashboard:', err);
    res.status(500).json({ error: 'Errore nel recupero dei dati della dashboard' });
  }
});

module.exports = router;
