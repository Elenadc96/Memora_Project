// Ricava la metrica da confrontare col goal del badge in base al `type`:
// 1 = flashcard completate, 2 = streak, 4 = sessioni perfette,
// 3 = flag booleano (Velocista → is_speedster, Nottambulo → is_night_owl).
// Il type 3 non basta da solo a distinguere i due badge booleani, quindi
// per quel caso si usa il nome (gli unici due badge con type 3 nel seed).
function metricForBadge(badge, stats) {
  switch (badge.type) {
    case 1: return stats.cards_completed;
    case 2: return stats.streak_days;
    case 4: return stats.perfect_sessions;
    case 3: return badge.name === 'Velocista'
      ? (stats.is_speedster ? 1 : 0)
      : (stats.is_night_owl ? 1 : 0);
    default: return 0;
  }
}

// Ricalcola progress/unlocked di tutti i badge per un utente e li salva in
// user_badge. `unlocked_at` viene impostato una sola volta, al momento dello
// sblocco (mai sovrascritto in seguito, anche se le metriche non possono
// comunque decrescere).
//
// IMPORTANTE: riceve `conn` (una connessione già aperta) invece di usare il
// pool `db` esportato in cima al file. Il pool andrebbe bene se questa
// funzione vivesse da sola, ma viene sempre chiamata come ULTIMO passo del
// salvataggio di una sessione (vedi routes/api.js), dentro la stessa
// transazione della sessione stessa: se qui qualcosa fallisse, deve poter
// far annullare anche i passi precedenti (sessione salvata, stato delle
// flashcard aggiornato). Questo è possibile solo se tutti i passi condividono
// la stessa connessione — per questo `conn` viene passato dal chiamante
// invece di essere preso da `db` internamente.
//
// Per lo stesso motivo i badge vengono valutati uno alla volta con un ciclo
// `for...of` invece che in parallelo con `Promise.all`: una singola
// connessione MySQL può eseguire un solo comando alla volta, quindi lanciare
// più query insieme sulla stessa connessione non le farebbe girare più
// velocemente, andrebbero comunque in coda. Con 8 badge il costo è
// trascurabile.
async function evaluateAndUpdateBadges(conn, userId, stats) {
  const [badges] = await conn.query('SELECT id, name, type, goal FROM badge');

  for (const badge of badges) {
    const metric = metricForBadge(badge, stats);
    const progress = Math.min(metric, badge.goal);
    const unlocked = metric >= badge.goal ? 1 : 0;

    await conn.query(
      `INSERT INTO user_badge (user_id, badge_id, progress, unlocked, unlocked_at)
       VALUES (?, ?, ?, ?, IF(?, NOW(), NULL))
       ON DUPLICATE KEY UPDATE
         progress    = VALUES(progress),
         unlocked_at = IF(unlocked = 0 AND VALUES(unlocked) = 1, NOW(), unlocked_at),
         unlocked    = GREATEST(unlocked, VALUES(unlocked))`,
      [userId, badge.id, progress, unlocked, unlocked]
    );
  }
}

module.exports = { evaluateAndUpdateBadges };
