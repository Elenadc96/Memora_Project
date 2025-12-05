-- =====================================================
-- DATABASE CREATION
-- =====================================================

CREATE DATABASE IF NOT EXISTS memora_project;
USE memora_project;

-- =====================================================
-- TABLE: UTENTI
-- =====================================================

CREATE TABLE utenti (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- hashed password
    settings JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: SUBJECT
-- =====================================================

CREATE TABLE subject (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subjectName VARCHAR(150) NOT NULL,
    description TEXT,
    
    FOREIGN KEY (user_id) REFERENCES utenti(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =====================================================
-- TABLE: LESSONS
-- =====================================================

CREATE TABLE lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    subject_id INT NOT NULL,
    status INT DEFAULT 0,
    last_study TIMESTAMP NULL,
    last_lesson_duration INT DEFAULT 0, -- seconds

    FOREIGN KEY (subject_id) REFERENCES subject(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =====================================================
-- TABLE: FLASHCARD
-- =====================================================

CREATE TABLE flashcard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content JSON NOT NULL,
    lesson_id JSON NOT NULL,  -- array of lesson IDs
    difficult INT DEFAULT 0,

    -- Optionally you can create an index on JSON array if needed
    -- FULLTEXT (content) -- if text searching required
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: SESSIONI
-- =====================================================

CREATE TABLE sessioni (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject_id INT NOT NULL,
    result JSON,
    last_usage_date TIMESTAMP NULL,
    session_duration INT DEFAULT 0,
    completed TINYINT(1) DEFAULT 0,

    FOREIGN KEY (user_id) REFERENCES utenti(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (subject_id) REFERENCES subject(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =====================================================
-- TABLE: BADGE
-- =====================================================

CREATE TABLE badge (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT, -- URL to image (recommended option)
    type INT NOT NULL,
    goal JSON DEFAULT NULL
);

-- =====================================================
-- TABLE: POINTS
-- =====================================================

CREATE TABLE points (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    badges JSON DEFAULT NULL,
    total_point INT DEFAULT 0,
    stick_days INT DEFAULT 0,
    last_day_stick TIMESTAMP NULL,

    FOREIGN KEY (user_id) REFERENCES utenti(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =====================================================
-- OPTIONAL TEST DATA
-- =====================================================

INSERT INTO utenti (name, lastName, email, password, settings)
VALUES ('Mario', 'Rossi', 'mario@example.com', 'hashed_password_here', '{"theme":"dark"}');
