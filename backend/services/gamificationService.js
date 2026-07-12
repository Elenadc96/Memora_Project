const { evaluateAndUpdateBadges } = require('./badgeService');

// Formula punti: 50 per giorno di streak, 2 per flashcard completata,
// 100 per sessione perfetta. Ricalcolato da zero (non incrementale) ad ogni
// sessione: è una funzione pura dei tre contatori, quindi è più semplice e
// robusto rispetto a sommare delta.
function computeTotalPoints({ streakDays, cardsCompleted, perfectSessions }) {
  return streakDays * 50 + cardsCompleted * 2 + perfectSessions * 100;
}

// Aggiorna streak_days confrontando l'ultima data di streak con oggi.
// A differenza dello spec (che valuta lo streak PRIMA di contare la
// sessione odierna, azzerandolo a 0 in caso di gap), qui la sessione
// corrente è già completata: un gap riparte quindi da 1 (oggi conta),
// non da 0.
function nextStreak(lastStreakDate, currentStreak) {
  if (!lastStreakDate) return 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = new Date(lastStreakDate);
  last.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today.getTime() - last.getTime()) / 86400000);
  if (diffDays === 0) return currentStreak; // già studiato oggi
  if (diffDays === 1) return currentStreak + 1; // studiato ieri → incrementa
  return 1; // gap → riparte da oggi
}

// Restituisce la streak effettiva da mostrare all'utente: se l'ultima sessione
// è più vecchia di ieri la streak è scaduta e vale 0, anche se il DB conserva
// ancora il valore precedente (che verrà sovrascritto alla prossima sessione).
function effectiveStreak(streakDays, lastStreakDate) {
  if (!lastStreakDate || !streakDays) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = new Date(lastStreakDate);
  last.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - last.getTime()) / 86400000);
  return diffDays <= 1 ? streakDays : 0;
}

// Chiamata a fine sessione di studio: aggiorna streak, punti e i contatori
// usati per lo sblocco dei badge, poi rivaluta i badge dell'utente.
//
// IMPORTANTE: il primo parametro è `conn`, la connessione al database aperta
// e già dentro una transazione da chi chiama questa funzione (routes/api.js).
// Non si usa il pool generico qui dentro perché questa funzione fa parte di
// un'operazione più grande — "salva una sessione di studio" — che deve
// riuscire o fallire TUTTA INSIEME: sessione, stato delle flashcard, punti/
// streak e badge. Se ognuno di questi passaggi scrivesse per conto proprio
// (come succedeva prima) e uno degli ultimi fallisse, i primi resterebbero
// comunque salvati nel database anche se l'utente ha ricevuto un errore —
// un disallineamento silenzioso tra "cosa pensa l'utente sia successo" e
// "cosa è davvero salvato". Condividendo la stessa connessione/transazione,
// se questa funzione (o qualcosa dentro di essa, come i badge) fallisce, chi
// chiama può annullare (rollback) anche i passaggi già eseguiti prima.
async function recordSessionCompletion(conn, userId, { cardsInSession, knew, durationSeconds }) {
  const [rows] = await conn.query(
    `SELECT total_point, streak_days, last_streak_date, cards_completed,
            perfect_sessions, is_speedster, is_night_owl
     FROM points WHERE user_id = ?`,
    [userId]
  );

  const current = rows[0] ?? {
    total_point: 0, streak_days: 0, last_streak_date: null,
    cards_completed: 0, perfect_sessions: 0, is_speedster: 0, is_night_owl: 0,
  };

  const streakDays = nextStreak(current.last_streak_date, current.streak_days);
  const cardsCompleted = current.cards_completed + cardsInSession;
  const isPerfectSession = cardsInSession > 0 && knew === cardsInSession;
  const perfectSessions = current.perfect_sessions + (isPerfectSession ? 1 : 0);
  const isSpeedster = !!current.is_speedster || (cardsInSession >= 20 && durationSeconds < 300);
  const nowHour = new Date().getHours();
  const isNightOwl = !!current.is_night_owl || (nowHour >= 0 && nowHour < 5);

  const totalPoints = computeTotalPoints({ streakDays, cardsCompleted, perfectSessions });

  await conn.query(
    `INSERT INTO points (user_id, total_point, streak_days, last_streak_date,
                          cards_completed, perfect_sessions, is_speedster, is_night_owl)
     VALUES (?, ?, ?, CURDATE(), ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       total_point = VALUES(total_point),
       streak_days = VALUES(streak_days),
       last_streak_date = VALUES(last_streak_date),
       cards_completed = VALUES(cards_completed),
       perfect_sessions = VALUES(perfect_sessions),
       is_speedster = VALUES(is_speedster),
       is_night_owl = VALUES(is_night_owl)`,
    [userId, totalPoints, streakDays, cardsCompleted, perfectSessions, isSpeedster, isNightOwl]
  );

  // Stessa connessione/transazione passata più sotto: se lo sblocco dei
  // badge fallisse, deve poter far annullare anche l'aggiornamento dei punti
  // appena fatto qui sopra.
  await evaluateAndUpdateBadges(conn, userId, {
    cards_completed: cardsCompleted,
    streak_days: streakDays,
    perfect_sessions: perfectSessions,
    is_speedster: isSpeedster,
    is_night_owl: isNightOwl,
  });
}

module.exports = { recordSessionCompletion, effectiveStreak };
