const db = require('../config/db');

// Controlli di ownership anti-IDOR condivisi dalle rotte.
//
// Lezioni e flashcard non hanno un proprio user_id: l'appartenenza si
// verifica risalendo la catena subject.user_id → lessons.subject_id →
// flashcard_lesson → flashcard.id. Ogni rotta che tocca una lezione o una
// flashcard per id DEVE passare da qui (o replicare lo stesso join) prima di
// leggere/scrivere — vedi il commento esteso in routes/lessons.js.
//
// Le funzioni restituiscono true/false; è la rotta a decidere la risposta
// (per convenzione 404 con codice *_NOT_FOUND, mai 403, per non confermare
// a un estraneo che l'id esiste).

// La lezione appartiene all'utente? Con subjectId opzionale verifica anche
// che la lezione stia in QUELLA materia (usato da POST /api/sessions, dove
// entrambi gli id arrivano dal body).
async function userOwnsLesson(userId, lessonId, subjectId = null) {
  const [rows] = await db.query(
    `SELECT l.id FROM lessons l
     JOIN subject s ON s.id = l.subject_id
     WHERE l.id = ? AND s.user_id = ?${subjectId != null ? ' AND l.subject_id = ?' : ''}`,
    subjectId != null ? [lessonId, userId, subjectId] : [lessonId, userId]
  );
  return rows.length > 0;
}

async function userOwnsFlashcard(userId, flashcardId) {
  const [rows] = await db.query(
    `SELECT f.id FROM flashcard f
     JOIN flashcard_lesson fl ON fl.flashcard_id = f.id
     JOIN lessons l           ON l.id = fl.lesson_id
     JOIN subject s           ON s.id = l.subject_id
     WHERE f.id = ? AND s.user_id = ?`,
    [flashcardId, userId]
  );
  return rows.length > 0;
}

module.exports = { userOwnsLesson, userOwnsFlashcard };
