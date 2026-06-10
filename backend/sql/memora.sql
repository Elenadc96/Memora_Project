-- =====================================================
-- DATABASE CREATION
-- =====================================================

CREATE DATABASE IF NOT EXISTS memora_project
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE memora_project;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS user_badge;
DROP TABLE IF EXISTS points;
DROP TABLE IF EXISTS sessioni;
DROP TABLE IF EXISTS flashcard_lesson;
DROP TABLE IF EXISTS flashcard;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS subject;
DROP TABLE IF EXISTS badge;
DROP TABLE IF EXISTS utenti;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- TABLE: UTENTI
-- =====================================================

CREATE TABLE utenti (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    settings JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: SUBJECT
-- =====================================================

CREATE TABLE subject (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subjectName VARCHAR(150) NOT NULL,
    description TEXT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#5FA8D3',   /* colore hex per la UI (es. pallino sidebar) */
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_subject_user_id (user_id),

    CONSTRAINT fk_subject_user
        FOREIGN KEY (user_id) REFERENCES utenti(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: LESSONS
-- =====================================================

CREATE TABLE lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    subject_id INT NOT NULL,
    status INT DEFAULT 0,
    last_study TIMESTAMP NULL,
    last_lesson_duration INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_lessons_subject_id (subject_id),

    CONSTRAINT fk_lessons_subject
        FOREIGN KEY (subject_id) REFERENCES subject(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: FLASHCARD
-- =====================================================

CREATE TABLE flashcard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content JSON NOT NULL,
    difficult INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE flashcard_lesson (
    flashcard_id INT NOT NULL,
    lesson_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (flashcard_id, lesson_id),

    INDEX idx_flashcard_lesson_lesson_id (lesson_id),

    CONSTRAINT fk_flashcard_lesson_flashcard
        FOREIGN KEY (flashcard_id) REFERENCES flashcard(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_flashcard_lesson_lesson
        FOREIGN KEY (lesson_id) REFERENCES lessons(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: SESSIONI
-- =====================================================

CREATE TABLE sessioni (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject_id INT NOT NULL,
    result JSON DEFAULT NULL,
    last_usage_date TIMESTAMP NULL,
    session_duration INT DEFAULT 0,
    completed TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_sessioni_user_id (user_id),
    INDEX idx_sessioni_subject_id (subject_id),

    CONSTRAINT fk_sessioni_user
        FOREIGN KEY (user_id) REFERENCES utenti(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_sessioni_subject
        FOREIGN KEY (subject_id) REFERENCES subject(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: BADGE
-- =====================================================

CREATE TABLE badge (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    icon VARCHAR(100) NULL,
    type INT NOT NULL,
    goal INT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE user_badge (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    badge_id INT NOT NULL,
    progress INT DEFAULT 0,
    unlocked BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_user_badge (user_id, badge_id),
    INDEX idx_user_badge_user_id (user_id),
    INDEX idx_user_badge_badge_id (badge_id),

    CONSTRAINT fk_user_badge_user
        FOREIGN KEY (user_id) REFERENCES utenti(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_user_badge_badge
        FOREIGN KEY (badge_id) REFERENCES badge(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: POINTS
-- =====================================================

CREATE TABLE points (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_point INT DEFAULT 0,
    streak_days INT DEFAULT 0,
    last_streak_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_points_user (user_id),

    CONSTRAINT fk_points_user
        FOREIGN KEY (user_id) REFERENCES utenti(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

INSERT INTO badge (name, description, icon, type, goal) VALUES
('Principiante', 'Completa 10 flashcard', 'star', 1, 10),
('Studente Dedicato', 'Streak 7 giorni', 'flame', 2, 7),
('Maestro del Quiz', 'Completa 100 flashcard', 'book', 1, 100),
('Velocista', '20 carte < 5 min', 'bolt', 3, 20),
('Perfezionista', 'Accuracy 100%', 'target', 4, 100),
('Maratoneta', 'Streak 30 giorni', 'medal', 2, 30),
('Leggenda', '500 flashcard', 'crown', 1, 500),
('Nottambulo', 'Studia dopo mezzanotte', 'clock', 3, 1);

INSERT INTO utenti (name, lastName, email, password_hash, settings)
VALUES ('Mario', 'Rossi', 'mario@example.com', 'hashed_password_here', '{"theme":"dark"}');

INSERT INTO subject (user_id, subjectName, description, color) VALUES
(1, 'Matematica', 'Studio della matematica di base', '#5FA8D3'),
(1, 'Fisica',     'Fondamenti di fisica',            '#62B6CB'),
(1, 'Storia',     'Storia mondiale e italiana',      '#1B4965');

INSERT INTO lessons (name, description, subject_id, last_study, last_lesson_duration) VALUES
('Pitagora', 'Teorema di Pitagora', 1, CURRENT_TIMESTAMP, 20),
('Leggi di Newton', 'Prima legge di Newton', 2, CURRENT_TIMESTAMP, 15),
('Rinascimento', 'Storia del Rinascimento italiano', 3, CURRENT_TIMESTAMP, 25);

INSERT INTO flashcard (content, difficult) VALUES
('{"question":"Quanto fa 2+2?", "answer":"4"}', 1),
('{"question":"Chi ha formulato la legge di gravitazione?", "answer":"Isaac Newton"}', 2),
('{"question":"Quando è iniziato il Rinascimento?", "answer":"14° secolo"}', 1);

INSERT INTO flashcard_lesson (flashcard_id, lesson_id) VALUES
(1, 1),
(2, 2),
(3, 3);

INSERT INTO sessioni (user_id, subject_id, result, last_usage_date, session_duration, completed) VALUES
(1, 1, '{"score":10,"total":10}', CURRENT_TIMESTAMP, 15, 1),
(1, 2, '{"score":8,"total":10}', CURRENT_TIMESTAMP, 20, 1);

INSERT INTO points (user_id, total_point, streak_days, last_streak_date) VALUES
(1, 150, 3, CURRENT_TIMESTAMP);

INSERT INTO user_badge (user_id, badge_id, progress, unlocked, unlocked_at) VALUES
(1, 1, 10, TRUE, CURRENT_TIMESTAMP),
(1, 2, 3, FALSE, NULL);