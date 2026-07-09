const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { recordSessionCompletion } = require('../services/gamificationService');

// Montato in app.js su /api/sessions con verifyToken a livello di mount.
//
// I campi { error: 'CODICE' } sono codici stabili tradotti dal frontend
// ($t('errors.<codice>')) — vedi il commento in routes/subjects.js.

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
router.post('/', async (req, res) => {
  const userId = req.user.id;
  const { subjectId, lessonId, duration = 0, results = [] } = req.body;
  if (!subjectId || !lessonId) return res.status(400).json({ error: 'SESSION_FIELDS_REQUIRED' });

  // subjectId/lessonId arrivano dal body: senza questo controllo un utente
  // potrebbe salvare una sessione (e far scattare punti/streak/badge) su una
  // lezione di un altro utente semplicemente inviando il suo id numerico.
  const [own] = await db.query(
    `SELECT l.id FROM lessons l
     JOIN subject s ON s.id = l.subject_id
     WHERE l.id = ? AND l.subject_id = ? AND s.user_id = ?`,
    [lessonId, subjectId, userId]
  );
  if (!own.length) return res.status(404).json({ error: 'LESSON_NOT_FOUND' });

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
    res.status(500).json({ error: 'SERVER_ERROR' });
  } finally {
    conn.release();
  }
});

module.exports = router;
