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
    color VARCHAR(7) NOT NULL DEFAULT '#2563EB',
    emoji VARCHAR(10) NOT NULL DEFAULT '📚',
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
    status ENUM('learning', 'mastered', 'review') DEFAULT 'learning',
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
    lesson_id INT NULL,
    result JSON DEFAULT NULL,
    last_usage_date TIMESTAMP NULL,
    session_duration INT DEFAULT 0,
    completed TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_sessioni_user_id (user_id),
    INDEX idx_sessioni_subject_id (subject_id),
    INDEX idx_sessioni_lesson_id (lesson_id),

    CONSTRAINT fk_sessioni_user
        FOREIGN KEY (user_id) REFERENCES utenti(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_sessioni_subject
        FOREIGN KEY (subject_id) REFERENCES subject(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_sessioni_lesson
        FOREIGN KEY (lesson_id) REFERENCES lessons(id)
        ON DELETE SET NULL
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
    -- Contatori di gamification: registrati come flag/counter a fine sessione
    -- (vedi backend/services/gamificationService.js) per evitare di riparsare
    -- sessioni.result ad ogni richiesta di classifica/badge.
    cards_completed INT DEFAULT 0,
    perfect_sessions INT DEFAULT 0,
    is_speedster BOOLEAN DEFAULT FALSE,
    is_night_owl BOOLEAN DEFAULT FALSE,
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

-- goal = soglia da raggiungere sulla metrica indicata da `type`:
--   1 = cards_completed, 2 = streak_days, 4 = perfect_sessions,
--   3 = flag booleano (is_speedster per Velocista, is_night_owl per Nottambulo)
-- Velocista e Perfezionista hanno goal=1 perché sono condizioni booleane
-- (il conteggio "20 carte in <5 min" e "100% accuratezza" avviene a fine
-- sessione in gamificationService.js, non qui).
INSERT INTO badge (name, description, icon, type, goal) VALUES
('Principiante', 'Completa 10 flashcard', 'star', 1, 10),
('Studente Dedicato', 'Streak 7 giorni', 'flame', 2, 7),
('Maestro del Quiz', 'Completa 100 flashcard', 'book', 1, 100),
('Velocista', '20 carte < 5 min', 'bolt', 3, 1),
('Perfezionista', 'Accuracy 100%', 'target', 4, 1),
('Maratoneta', 'Streak 30 giorni', 'medal', 2, 30),
('Leggenda', '500 flashcard', 'crown', 1, 500),
('Nottambulo', 'Studia dopo mezzanotte', 'clock', 3, 1);

INSERT INTO utenti (name, lastName, email, password_hash, settings)
VALUES ('Mario', 'Rossi', 'mario@example.com', 'hashed_password_here', '{"theme":"dark"}');

INSERT INTO subject (user_id, subjectName, description, color, emoji) VALUES
(1, 'Matematica', 'Studio della matematica di base', '#2563EB', '📐'),
(1, 'Fisica',     'Fondamenti di fisica',            '#06B6D4', '🔬'),
(1, 'Storia',     'Storia mondiale e italiana',      '#8B5CF6', '🏛️');

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

-- =====================================================
-- SEED DATA: Elena Di Cicco (utente demo, user_id = 2)
-- =====================================================
-- Password di test: Elena123!  (hash bcrypt sotto — l'account seedato NON
-- corrisponde a un account registrato dal vivo: usa questa password per
-- fare login dopo un import da zero).
--
-- subject_id 4 e lesson_id 6 non vengono usati di proposito: sono id
-- "consumati" da materie/lezioni create e poi cancellate dall'app dal vivo
-- durante lo sviluppo — MySQL non riusa gli id AUTO_INCREMENT, quindi
-- lasciarli vuoti è corretto e non richiede di ricrearli.

INSERT INTO utenti (id, name, lastName, email, password_hash, settings) VALUES
(2, 'Elena', 'Di Cicco', 'elena.di.cicco96@gmail.com', '$2b$10$rQ45FPsr9xQl1.noV6xas.P6MV9FSP2TLD1hktXsNaELmaFDEeCvu', '{"theme":"light","language":"it"}');

-- ── Materie di Elena ─────────────────────────────────────────
-- id 5/6/7 ricostruiti (materie "storiche", create prima del resto del seed)
-- id 8/9/10 = materie aggiunte più di recente
INSERT INTO subject (id, user_id, subjectName, description, color, emoji, created_at) VALUES
(5,  2, 'Matematica', 'Algebra e analisi',                    '#3B82F6', '📐', '2026-06-05 09:00:00'),
(6,  2, 'Storia',     'Storia moderna e contemporanea',       '#8B5CF6', '🏛️', '2026-06-05 09:00:00'),
(7,  2, 'Geografia',  'Geografia fisica e politica',          '#06B6D4', '🌍', '2026-06-05 09:00:00'),
(8,  2, 'Inglese',    'Grammatica e vocabolario inglese',     '#10B981', '📖', '2026-06-10 10:00:00'),
(9,  2, 'Biologia',   'Scienze biologiche e vita cellulare',  '#EF4444', '🧬', '2026-06-10 10:00:00'),
(10, 2, 'Chimica',    'Chimica generale e organica',          '#F59E0B', '🧪', '2026-06-10 10:00:00');

-- ── Lezioni "storiche" (id 4 e 5, ricostruite) ──────────────
INSERT INTO lessons (id, name, description, subject_id, status, last_study, last_lesson_duration, created_at) VALUES
(4, 'Seconda guerra mondiale', 'Cause, eventi principali e conseguenze del secondo conflitto mondiale', 6, 1, '2026-06-28 10:30:00', 22, '2026-06-06 09:00:00'),
(5, 'Fiumi d''Italia',         'Principali fiumi italiani e loro caratteristiche',                     7, 1, '2026-06-29 09:30:00', 15, '2026-06-06 09:00:00');

-- ── Lezioni nuove ────────────────────────────────────────────
INSERT INTO lessons (id, name, description, subject_id, status, last_study, last_lesson_duration, created_at) VALUES
(7,  'Equazioni di 2° grado', 'Formula quadratica e discriminante',       5, 2, '2026-06-30 09:30:00', 20, '2026-06-10 10:00:00'),
(8,  'Derivate',              'Derivata di funzioni elementari',           5, 1, '2026-06-27 07:30:00', 18, '2026-06-10 10:00:00'),
(9,  'Integrali',             'Integrale indefinito e definito',           5, 1, '2026-06-28 07:30:00', 16, '2026-06-10 10:00:00'),
(10, 'Prima guerra mondiale', 'Cause e dinamiche del conflitto 1914-1918', 6, 2, '2026-06-30 08:30:00', 20, '2026-06-10 10:00:00'),
(11, 'Rinascimento italiano', 'Arte e cultura del Rinascimento',           6, 1, '2026-06-27 11:00:00', 18, '2026-06-10 10:00:00'),
(12, 'Capitali d''Europa',    'Capitali e stati europei',                  7, 1, '2026-06-25 10:30:00', 15, '2026-06-10 10:00:00'),
(13, 'Present Perfect',       'Uso e formazione del Present Perfect',      8, 2, '2026-06-29 07:00:00', 18, '2026-06-10 10:00:00'),
(14, 'Conditional Sentences', 'First, Second e Third Conditional',         8, 2, '2026-06-30 08:30:00', 16, '2026-06-10 10:00:00'),
(15, 'Irregular Verbs',       'I 100 verbi irregolari più comuni',         8, 1, '2026-06-27 10:00:00', 28, '2026-06-10 10:00:00'),
(16, 'La Cellula',            'Struttura e funzioni della cellula',        9, 1, '2026-06-29 09:30:00', 16, '2026-06-10 10:00:00'),
(17, 'Genetica di base',      'DNA, geni e ereditarietà',                  9, 1, '2026-06-27 09:00:00', 18, '2026-06-10 10:00:00'),
(18, 'Fotosintesi',           'Processo fotosintetico nelle piante',       9, 0, '2026-06-29 11:00:00', 14, '2026-06-10 10:00:00'),
(19, 'Tavola Periodica',      'Elementi, periodi e gruppi',                10, 0, '2026-06-26 07:30:00', 20, '2026-06-10 10:00:00'),
(20, 'Legami Chimici',        'Legame ionico, covalente e metallico',      10, 0, '2026-06-28 09:00:00', 16, '2026-06-10 10:00:00');

-- ── Flashcard "storiche" (id 4/5/6, ricostruite) ────────────
INSERT INTO flashcard (id, content, difficult, created_at) VALUES
(4, '{"question":"Quando iniziò la Seconda guerra mondiale?","answer":"Il 1° settembre 1939, con l\'invasione della Polonia da parte della Germania nazista."}', 1, '2026-06-06 09:00:00'),
(5, '{"question":"Qual è il fiume più lungo che sfocia nel Mar Tirreno?","answer":"Il Tevere."}', 2, '2026-06-06 09:00:00'),
(6, '{"question":"Quando finì la Seconda guerra mondiale in Europa?","answer":"L\'8 maggio 1945, con la resa della Germania nazista (V-E Day)."}', 1, '2026-06-06 09:00:00');

-- ── Flashcard nuove ──────────────────────────────────────────
INSERT INTO flashcard (id, content, difficult, created_at) VALUES

-- Lesson 7: Equazioni di 2° grado
(7,  '{"question":"Qual è la formula quadratica per risolvere ax²+bx+c=0?","answer":"x = (-b ± √(b²-4ac)) / 2a"}', 2, '2026-06-10 10:00:00'),
(8,  '{"question":"Cos\'è il discriminante Δ e cosa indica il suo segno?","answer":"Δ = b²-4ac. Se Δ>0 due soluzioni reali distinte; Δ=0 una soluzione doppia; Δ<0 nessuna soluzione reale."}', 2, '2026-06-10 10:00:00'),
(9,  '{"question":"Come si fattorizza x²-5x+6?","answer":"(x-2)(x-3), poiché le radici sono x=2 e x=3"}', 1, '2026-06-10 10:00:00'),
(10, '{"question":"Relazioni di Viète: qual è la somma e il prodotto delle radici di ax²+bx+c=0?","answer":"Somma = -b/a · Prodotto = c/a"}', 3, '2026-06-10 10:00:00'),

-- Lesson 8: Derivate
(11, '{"question":"Qual è la derivata di xⁿ?","answer":"n·xⁿ⁻¹"}', 1, '2026-06-10 10:00:00'),
(12, '{"question":"Qual è la derivata di sin(x)?","answer":"cos(x)"}', 1, '2026-06-10 10:00:00'),
(13, '{"question":"Enuncia la regola della catena (chain rule).","answer":"Se y=f(g(x)), allora y\' = f\'(g(x)) · g\'(x)"}', 2, '2026-06-10 10:00:00'),

-- Lesson 9: Integrali
(14, '{"question":"Qual è l\'integrale di xⁿ (con n≠-1)?","answer":"xⁿ⁺¹/(n+1) + C"}', 2, '2026-06-10 10:00:00'),
(15, '{"question":"Cosa afferma il Teorema Fondamentale del Calcolo?","answer":"Se F\' = f continua su [a,b], allora ∫(a→b) f(x)dx = F(b) − F(a)"}', 3, '2026-06-10 10:00:00'),
(16, '{"question":"Qual è l\'integrale di 1/x?","answer":"ln|x| + C"}', 1, '2026-06-10 10:00:00'),

-- Lesson 10: Prima guerra mondiale
(17, '{"question":"Quando e perché è scoppiata la Prima guerra mondiale?","answer":"28 luglio 1914: l\'Austria-Ungheria dichiarò guerra alla Serbia dopo l\'assassinio dell\'arciduca Francesco Ferdinando a Sarajevo (28 giugno 1914)."}', 1, '2026-06-10 10:00:00'),
(18, '{"question":"Cos\'è la guerra di trincea?","answer":"Tattica difensiva in cui i soldati combattevano da trincee scavate nel suolo. Caratteristica del fronte occidentale 1914-1918, causò enormi perdite umane senza spostamenti significativi."}', 2, '2026-06-10 10:00:00'),
(19, '{"question":"Chi erano le potenze della Triplice Intesa e della Triplice Alleanza?","answer":"Triplice Intesa: Francia, Russia, Gran Bretagna. Triplice Alleanza: Germania, Austria-Ungheria, Italia (che rimase neutrale poi passò all\'Intesa nel 1915)."}', 2, '2026-06-10 10:00:00'),
(20, '{"question":"Quando e come si concluse la Prima guerra mondiale?","answer":"11 novembre 1918 con l\'armistizio di Compiègne. I trattati di pace (Versailles, 1919) imposero pesanti sanzioni alla Germania."}', 1, '2026-06-10 10:00:00'),

-- Lesson 11: Rinascimento italiano
(21, '{"question":"In quale periodo si colloca il Rinascimento italiano?","answer":"XIV-XVI secolo, con epicentro nel Quattrocento (1400) e Cinquecento (1500), prima a Firenze poi in tutta Italia."}', 1, '2026-06-10 10:00:00'),
(22, '{"question":"Chi sono i \'Tre Grandi\' del Rinascimento?","answer":"Leonardo da Vinci, Michelangelo Buonarroti e Raffaello Sanzio."}', 1, '2026-06-10 10:00:00'),
(23, '{"question":"Cos\'è la prospettiva lineare nella pittura rinascimentale?","answer":"Tecnica di rappresentazione dello spazio che usa linee convergenti verso uno o più punti di fuga, creando l\'illusione della profondità su una superficie piana."}', 2, '2026-06-10 10:00:00'),

-- Lesson 12: Capitali d'Europa
(24, '{"question":"Qual è la capitale della Germania?","answer":"Berlino"}', 1, '2026-06-10 10:00:00'),
(25, '{"question":"Qual è la capitale della Spagna?","answer":"Madrid"}', 1, '2026-06-10 10:00:00'),
(26, '{"question":"Qual è la capitale della Polonia?","answer":"Varsavia"}', 1, '2026-06-10 10:00:00'),
(27, '{"question":"Qual è la capitale della Romania?","answer":"Bucarest"}', 2, '2026-06-10 10:00:00'),

-- Lesson 13: Present Perfect
(28, '{"question":"Come si forma il Present Perfect in inglese?","answer":"Subject + have/has + past participle. Es: I have eaten. She has gone."}', 1, '2026-06-10 10:00:00'),
(29, '{"question":"Qual è la differenza tra Present Perfect e Simple Past?","answer":"Present Perfect: azione con rilevanza nel presente (I have lost my keys). Simple Past: azione conclusa in un momento preciso del passato (I lost my keys yesterday)."}', 2, '2026-06-10 10:00:00'),
(30, '{"question":"Come si usa \'already\' con il Present Perfect?","answer":"Indica che un\'azione è avvenuta prima del previsto; si mette tra have e il participio. Es: I have already finished my homework."}', 2, '2026-06-10 10:00:00'),
(31, '{"question":"Come si usa \'yet\' con il Present Perfect?","answer":"Si usa in frasi negative e interrogative per un\'azione attesa ma non ancora avvenuta. Es: I haven\'t eaten yet. Have you finished yet?"}', 2, '2026-06-10 10:00:00'),

-- Lesson 14: Conditional Sentences
(32, '{"question":"Struttura e uso del First Conditional?","answer":"If + Simple Present, will + infinitive. Situazione reale e probabile nel futuro. Es: If it rains, I will stay home."}', 1, '2026-06-10 10:00:00'),
(33, '{"question":"Struttura e uso del Second Conditional?","answer":"If + Simple Past, would + infinitive. Situazione ipotetica o improbabile nel presente/futuro. Es: If I had a car, I would drive to work."}', 2, '2026-06-10 10:00:00'),
(34, '{"question":"Struttura e uso del Third Conditional?","answer":"If + Past Perfect, would have + past participle. Ipotesi impossibile nel passato. Es: If I had studied, I would have passed the exam."}', 2, '2026-06-10 10:00:00'),

-- Lesson 15: Irregular Verbs
(35, '{"question":"Passato semplice e participio passato di \'go\'?","answer":"went / gone"}', 1, '2026-06-10 10:00:00'),
(36, '{"question":"Passato semplice e participio passato di \'write\'?","answer":"wrote / written"}', 1, '2026-06-10 10:00:00'),
(37, '{"question":"Passato semplice e participio passato di \'take\'?","answer":"took / taken"}', 1, '2026-06-10 10:00:00'),
(38, '{"question":"Passato semplice e participio passato di \'know\'?","answer":"knew / known"}', 2, '2026-06-10 10:00:00'),

-- Lesson 16: La Cellula
(39, '{"question":"Qual è la differenza tra cellula procariotica ed eucariotica?","answer":"Procariota: nessun nucleo membranato, più semplice (es. batteri). Eucariota: nucleo con membrana nucleare, più complessa (animali, piante, funghi)."}', 2, '2026-06-10 10:00:00'),
(40, '{"question":"Cosa sono i mitocondri e qual è la loro funzione?","answer":"Organelli cellulari che producono energia (ATP) attraverso la respirazione aerobica. Detti \'centrali energetiche\' della cellula; hanno un proprio DNA."}', 1, '2026-06-10 10:00:00'),
(41, '{"question":"Qual è la funzione del nucleo cellulare?","answer":"Contiene il DNA (cromatina/cromosomi) e dirige tutte le attività cellulari, incluse replicazione del DNA e trascrizione in RNA."}', 1, '2026-06-10 10:00:00'),

-- Lesson 17: Genetica di base
(42, '{"question":"Cosa sono i cromosomi?","answer":"Strutture nel nucleo composte da DNA avvolto intorno a proteine (istoni). L\'uomo ha 46 cromosomi (23 coppie). Portano le informazioni genetiche."}', 1, '2026-06-10 10:00:00'),
(43, '{"question":"Cosa afferma la Prima Legge di Mendel (segregazione)?","answer":"Ogni individuo possiede due alleli per ogni carattere; durante la formazione dei gameti i due alleli si separano e ciascun gamete ne riceve uno solo."}', 2, '2026-06-10 10:00:00'),
(44, '{"question":"Cos\'è una mutazione genetica?","answer":"Un cambiamento permanente nella sequenza nucleotidica del DNA. Può essere puntiforme, per delezione o inserzione. Può essere spontanea o indotta da mutageni (radiazioni, sostanze chimiche)."}', 2, '2026-06-10 10:00:00'),

-- Lesson 18: Fotosintesi
(45, '{"question":"Scrivi l\'equazione generale della fotosintesi clorofilliana.","answer":"6CO₂ + 6H₂O + energia luminosa → C₆H₁₂O₆ + 6O₂"}', 2, '2026-06-10 10:00:00'),
(46, '{"question":"In quale organello avviene la fotosintesi e perché?","answer":"Nei cloroplasti, organelli delle cellule vegetali contenenti clorofilla, il pigmento verde che assorbe la luce solare e la converte in energia chimica."}', 1, '2026-06-10 10:00:00'),
(47, '{"question":"Cosa avviene nella fase luminosa della fotosintesi?","answer":"Nei tilacoidi: la luce scinde l\'acqua (fotolisi), rilasciando O₂ e producendo ATP e NADPH, che verranno usati nel ciclo di Calvin (fase oscura)."}', 3, '2026-06-10 10:00:00'),

-- Lesson 19: Tavola Periodica
(48, '{"question":"Chi ha ideato la tavola periodica degli elementi e quando?","answer":"Dmitrij Mendeleev nel 1869, ordinando gli elementi per massa atomica crescente e proprietà chimiche ricorrenti (periodicità)."}', 1, '2026-06-10 10:00:00'),
(49, '{"question":"Cosa indica il numero atomico di un elemento?","answer":"Il numero di protoni nel nucleo. In un atomo neutro è uguale al numero di elettroni. Determina l\'identità chimica dell\'elemento."}', 1, '2026-06-10 10:00:00'),
(50, '{"question":"Cosa distingue metalli e non metalli nella tavola periodica?","answer":"Metalli (sinistra/centro): conducono calore ed elettricità, sono lucenti, malleabili, duttili. Non metalli (destra): generalmente gassosi o fragili, cattivi conduttori."}', 2, '2026-06-10 10:00:00'),

-- Lesson 20: Legami Chimici
(51, '{"question":"Cos\'è un legame ionico e come si forma?","answer":"Trasferimento di uno o più elettroni da un metallo a un non metallo, formando ioni con cariche opposte che si attraggono elettrostaticamente. Es: NaCl (Na⁺ + Cl⁻)."}', 2, '2026-06-10 10:00:00'),
(52, '{"question":"Cos\'è un legame covalente?","answer":"Condivisione di una o più coppie di elettroni tra due non metalli. Può essere semplice (H-H), doppio (O=O) o triplo (N≡N). Es: H₂O ha due legami covalenti O-H."}', 2, '2026-06-10 10:00:00'),
(53, '{"question":"Cos\'è un legame a idrogeno?","answer":"Interazione intermolecolare debole tra un atomo H legato a N, O o F e un altro atomo elettronegativo vicino. È responsabile dell\'alto punto di ebollizione dell\'acqua e della struttura del DNA."}', 3, '2026-06-10 10:00:00'),

-- Flashcard extra per le lezioni "storiche" 4 e 5
(54, '{"question":"Cos\'è stato il Patto Molotov-Ribbentrop?","answer":"Accordo di non aggressione firmato il 23 agosto 1939 tra URSS e Germania nazista, con protocollo segreto per la spartizione dell\'Europa orientale (Polonia, Paesi Baltici)."}', 2, '2026-06-10 10:00:00'),
(55, '{"question":"Cos\'è stato l\'Olocausto?","answer":"Lo sterminio sistematico di circa 6 milioni di ebrei e milioni di altri perseguitati (Rom, disabili, omosessuali, oppositori politici) da parte del regime nazista tra il 1941 e il 1945."}', 2, '2026-06-10 10:00:00'),
(56, '{"question":"Quando è avvenuto lo sbarco in Normandia e perché è importante?","answer":"6 giugno 1944 (D-Day): la più grande operazione anfibia della storia. Gli Alleati aprirono un secondo fronte in Europa occidentale, accelerando la sconfitta della Germania nazista."}', 1, '2026-06-10 10:00:00'),
(57, '{"question":"Qual è il fiume più lungo d\'Italia e dove sfocia?","answer":"Il Po (652 km): nasce dal Monviso in Piemonte e sfocia nel Mar Adriatico con un ampio delta a sud di Venezia."}', 1, '2026-06-10 10:00:00'),
(58, '{"question":"Quale fiume attraversa Roma?","answer":"Il Tevere (405 km), terzo fiume d\'Italia per lunghezza. Sfocia nel Mar Tirreno a Ostia."}', 1, '2026-06-10 10:00:00'),
(59, '{"question":"Quale fiume attraversa Firenze ed è famoso per i suoi ponti storici?","answer":"L\'Arno (241 km). Su di esso si trovano il celebre Ponte Vecchio e altri ponti storici del centro città."}', 1, '2026-06-10 10:00:00');

-- ── Flashcard_lesson (status attuale) ────────────────────────
INSERT INTO flashcard_lesson (flashcard_id, lesson_id, status, created_at) VALUES
-- Lesson 4 Seconda guerra mondiale: 3 mastered, 1 review, 1 learning (ricostruite + extra)
(4,  4, 'mastered', '2026-06-06 09:00:00'),
(6,  4, 'mastered', '2026-06-06 09:00:00'),
(54, 4, 'mastered', '2026-06-10 10:00:00'),
(55, 4, 'review',   '2026-06-10 10:00:00'),
(56, 4, 'learning', '2026-06-10 10:00:00'),
-- Lesson 5 Fiumi d'Italia: 2 mastered, 1 review, 1 learning (ricostruita + extra)
(5,  5, 'mastered', '2026-06-06 09:00:00'),
(57, 5, 'mastered', '2026-06-10 10:00:00'),
(58, 5, 'review',   '2026-06-10 10:00:00'),
(59, 5, 'learning', '2026-06-10 10:00:00'),
-- Lesson 7 Matematica: 3 mastered, 1 learning (75%)
(7,  7, 'mastered', '2026-06-10 10:00:00'),
(8,  7, 'mastered', '2026-06-10 10:00:00'),
(9,  7, 'mastered', '2026-06-10 10:00:00'),
(10, 7, 'learning', '2026-06-10 10:00:00'),
-- Lesson 8 Matematica: 2 mastered, 1 review (67%)
(11, 8, 'mastered', '2026-06-10 10:00:00'),
(12, 8, 'mastered', '2026-06-10 10:00:00'),
(13, 8, 'review',   '2026-06-10 10:00:00'),
-- Lesson 9 Matematica: 2 mastered, 1 learning (67%)
(14, 9, 'mastered', '2026-06-10 10:00:00'),
(15, 9, 'mastered', '2026-06-10 10:00:00'),
(16, 9, 'learning', '2026-06-10 10:00:00'),
-- Lesson 10 Storia: 3 mastered, 1 review (75%)
(17, 10, 'mastered', '2026-06-10 10:00:00'),
(18, 10, 'mastered', '2026-06-10 10:00:00'),
(19, 10, 'mastered', '2026-06-10 10:00:00'),
(20, 10, 'review',   '2026-06-10 10:00:00'),
-- Lesson 11 Storia: 1 mastered, 2 learning (33%)
(21, 11, 'mastered', '2026-06-10 10:00:00'),
(22, 11, 'learning', '2026-06-10 10:00:00'),
(23, 11, 'learning', '2026-06-10 10:00:00'),
-- Lesson 12 Geografia: 2 mastered, 1 review, 1 learning (50%)
(24, 12, 'mastered', '2026-06-10 10:00:00'),
(25, 12, 'mastered', '2026-06-10 10:00:00'),
(26, 12, 'review',   '2026-06-10 10:00:00'),
(27, 12, 'learning', '2026-06-10 10:00:00'),
-- Lesson 13 Inglese: 4 mastered (100%)
(28, 13, 'mastered', '2026-06-10 10:00:00'),
(29, 13, 'mastered', '2026-06-10 10:00:00'),
(30, 13, 'mastered', '2026-06-10 10:00:00'),
(31, 13, 'mastered', '2026-06-10 10:00:00'),
-- Lesson 14 Inglese: 3 mastered (100%)
(32, 14, 'mastered', '2026-06-10 10:00:00'),
(33, 14, 'mastered', '2026-06-10 10:00:00'),
(34, 14, 'mastered', '2026-06-10 10:00:00'),
-- Lesson 15 Inglese: 3 mastered, 1 review (75%)
(35, 15, 'mastered', '2026-06-10 10:00:00'),
(36, 15, 'mastered', '2026-06-10 10:00:00'),
(37, 15, 'mastered', '2026-06-10 10:00:00'),
(38, 15, 'review',   '2026-06-10 10:00:00'),
-- Lesson 16 Biologia: 2 mastered, 1 review (67%)
(39, 16, 'mastered', '2026-06-10 10:00:00'),
(40, 16, 'mastered', '2026-06-10 10:00:00'),
(41, 16, 'review',   '2026-06-10 10:00:00'),
-- Lesson 17 Biologia: 1 mastered, 2 learning (33%)
(42, 17, 'mastered', '2026-06-10 10:00:00'),
(43, 17, 'learning', '2026-06-10 10:00:00'),
(44, 17, 'learning', '2026-06-10 10:00:00'),
-- Lesson 18 Biologia: 0 mastered, 3 learning (0%)
(45, 18, 'learning', '2026-06-10 10:00:00'),
(46, 18, 'learning', '2026-06-10 10:00:00'),
(47, 18, 'learning', '2026-06-10 10:00:00'),
-- Lesson 19 Chimica: 1 mastered, 2 learning (33%)
(48, 19, 'mastered', '2026-06-10 10:00:00'),
(49, 19, 'learning', '2026-06-10 10:00:00'),
(50, 19, 'learning', '2026-06-10 10:00:00'),
-- Lesson 20 Chimica: 0 mastered, 3 learning (0%)
(51, 20, 'learning', '2026-06-10 10:00:00'),
(52, 20, 'learning', '2026-06-10 10:00:00'),
(53, 20, 'learning', '2026-06-10 10:00:00');

-- ── Sessioni ultimi 7 giorni (user_id=2) ─────────────────────
INSERT INTO sessioni (id, user_id, subject_id, lesson_id, result, last_usage_date, session_duration, completed, created_at) VALUES
-- Mercoledì 24 giugno
(4,  2, 8, 13, '{"knew":3,"almost":1,"forgot":0,"cards":[{"cardId":"28","rating":"knew"},{"cardId":"29","rating":"knew"},{"cardId":"30","rating":"knew"},{"cardId":"31","rating":"almost"}]}',  '2026-06-24 07:30:00', 18, 1, '2026-06-24 07:30:00'),
(5,  2, 5,  7, '{"knew":3,"almost":1,"forgot":0,"cards":[{"cardId":"7","rating":"knew"},{"cardId":"8","rating":"knew"},{"cardId":"9","rating":"knew"},{"cardId":"10","rating":"almost"}]}',     '2026-06-24 09:00:00', 20, 1, '2026-06-24 09:00:00'),
-- Giovedì 25 giugno
(6,  2, 9, 16, '{"knew":2,"almost":1,"forgot":0,"cards":[{"cardId":"39","rating":"knew"},{"cardId":"40","rating":"knew"},{"cardId":"41","rating":"almost"}]}',                                  '2026-06-25 07:30:00', 16, 1, '2026-06-25 07:30:00'),
(7,  2, 6, 10, '{"knew":3,"almost":1,"forgot":0,"cards":[{"cardId":"17","rating":"knew"},{"cardId":"18","rating":"knew"},{"cardId":"19","rating":"knew"},{"cardId":"20","rating":"almost"}]}',  '2026-06-25 09:00:00', 20, 1, '2026-06-25 09:00:00'),
(8,  2, 7, 12, '{"knew":3,"almost":1,"forgot":0,"cards":[{"cardId":"24","rating":"knew"},{"cardId":"25","rating":"knew"},{"cardId":"26","rating":"almost"},{"cardId":"27","rating":"knew"}]}',  '2026-06-25 10:30:00', 15, 1, '2026-06-25 10:30:00'),
-- Venerdì 26 giugno
(9,  2, 10, 19, '{"knew":1,"almost":1,"forgot":1,"cards":[{"cardId":"48","rating":"knew"},{"cardId":"49","rating":"almost"},{"cardId":"50","rating":"forgot"}]}',                               '2026-06-26 07:30:00', 20, 0, '2026-06-26 07:30:00'),
(10, 2,  8, 14, '{"knew":3,"almost":0,"forgot":0,"cards":[{"cardId":"32","rating":"knew"},{"cardId":"33","rating":"knew"},{"cardId":"34","rating":"knew"}]}',                                   '2026-06-26 09:00:00', 16, 1, '2026-06-26 09:00:00'),
-- Sabato 27 giugno
(11, 2,  5,  8, '{"knew":2,"almost":1,"forgot":0,"cards":[{"cardId":"11","rating":"knew"},{"cardId":"12","rating":"knew"},{"cardId":"13","rating":"almost"}]}',                                 '2026-06-27 07:30:00', 18, 1, '2026-06-27 07:30:00'),
(12, 2,  9, 17, '{"knew":2,"almost":1,"forgot":0,"cards":[{"cardId":"42","rating":"knew"},{"cardId":"43","rating":"almost"},{"cardId":"44","rating":"knew"}]}',                                 '2026-06-27 09:00:00', 18, 1, '2026-06-27 09:00:00'),
(13, 2,  8, 15, '{"knew":4,"almost":0,"forgot":0,"cards":[{"cardId":"35","rating":"knew"},{"cardId":"36","rating":"knew"},{"cardId":"37","rating":"knew"},{"cardId":"38","rating":"knew"}]}',   '2026-06-27 10:00:00', 28, 1, '2026-06-27 10:00:00'),
(14, 2,  6, 11, '{"knew":2,"almost":1,"forgot":0,"cards":[{"cardId":"21","rating":"knew"},{"cardId":"22","rating":"almost"},{"cardId":"23","rating":"knew"}]}',                                 '2026-06-27 11:00:00', 18, 1, '2026-06-27 11:00:00'),
-- Domenica 28 giugno
(15, 2,  5,  9, '{"knew":2,"almost":1,"forgot":0,"cards":[{"cardId":"14","rating":"knew"},{"cardId":"15","rating":"knew"},{"cardId":"16","rating":"almost"}]}',                                 '2026-06-28 07:30:00', 16, 1, '2026-06-28 07:30:00'),
(16, 2, 10, 20, '{"knew":1,"almost":1,"forgot":1,"cards":[{"cardId":"51","rating":"knew"},{"cardId":"52","rating":"almost"},{"cardId":"53","rating":"forgot"}]}',                               '2026-06-28 09:00:00', 16, 0, '2026-06-28 09:00:00'),
(17, 2,  6,  4, '{"knew":4,"almost":1,"forgot":0,"cards":[{"cardId":"4","rating":"knew"},{"cardId":"6","rating":"knew"},{"cardId":"54","rating":"knew"},{"cardId":"55","rating":"almost"},{"cardId":"56","rating":"knew"}]}', '2026-06-28 10:30:00', 22, 1, '2026-06-28 10:30:00'),
-- Lunedì 29 giugno
(18, 2,  8, 13, '{"knew":4,"almost":0,"forgot":0,"cards":[{"cardId":"28","rating":"knew"},{"cardId":"29","rating":"knew"},{"cardId":"30","rating":"knew"},{"cardId":"31","rating":"knew"}]}',   '2026-06-29 07:00:00', 18, 1, '2026-06-29 07:00:00'),
(19, 2,  9, 18, '{"knew":2,"almost":1,"forgot":0,"cards":[{"cardId":"45","rating":"knew"},{"cardId":"46","rating":"knew"},{"cardId":"47","rating":"almost"}]}',                                 '2026-06-29 08:30:00', 14, 1, '2026-06-29 08:30:00'),
(20, 2,  7,  5, '{"knew":3,"almost":1,"forgot":0,"cards":[{"cardId":"5","rating":"knew"},{"cardId":"57","rating":"knew"},{"cardId":"58","rating":"almost"},{"cardId":"59","rating":"knew"}]}',  '2026-06-29 09:30:00', 15, 1, '2026-06-29 09:30:00'),
(21, 2,  9, 16, '{"knew":2,"almost":1,"forgot":0,"cards":[{"cardId":"39","rating":"knew"},{"cardId":"40","rating":"knew"},{"cardId":"41","rating":"almost"}]}',                                 '2026-06-29 11:00:00', 16, 1, '2026-06-29 11:00:00'),
-- Martedì 30 giugno (oggi) — 54 minuti totali di studio
(22, 2,  6, 10, '{"knew":3,"almost":1,"forgot":0,"cards":[{"cardId":"17","rating":"knew"},{"cardId":"18","rating":"knew"},{"cardId":"19","rating":"knew"},{"cardId":"20","rating":"almost"}]}',  '2026-06-30 07:30:00', 20, 1, '2026-06-30 07:30:00'),
(23, 2,  8, 14, '{"knew":3,"almost":0,"forgot":0,"cards":[{"cardId":"32","rating":"knew"},{"cardId":"33","rating":"knew"},{"cardId":"34","rating":"knew"}]}',                                    '2026-06-30 08:30:00', 16, 1, '2026-06-30 08:30:00'),
(24, 2,  5,  7, '{"knew":3,"almost":1,"forgot":0,"cards":[{"cardId":"7","rating":"knew"},{"cardId":"8","rating":"knew"},{"cardId":"9","rating":"knew"},{"cardId":"10","rating":"almost"}]}',    '2026-06-30 09:30:00', 18, 1, '2026-06-30 09:30:00');

-- ── Punti e streak per Elena ──────────────────────────────────
-- cards_completed (74) e perfect_sessions (4) ricalcolati sommando le carte
-- e le sessioni al 100% di accuratezza (knew==totale) dalle sessioni sopra;
-- total_point ricalcolato con la formula reale: streak*50 + carte*2 + perfette*100
-- = 7*50 + 74*2 + 4*100 = 898.
INSERT INTO points (id, user_id, total_point, streak_days, last_streak_date, cards_completed, perfect_sessions, is_speedster, is_night_owl, created_at, updated_at) VALUES
(2, 2, 898, 7, '2026-06-30 09:30:00', 74, 4, FALSE, FALSE, '2026-06-10 10:00:00', '2026-06-30 09:30:00');

-- ── Badge di Elena ────────────────────────────────────────────
INSERT INTO user_badge (id, user_id, badge_id, progress, unlocked, unlocked_at, created_at) VALUES
(3, 2, 1, 10, TRUE,  '2026-06-15 10:00:00', '2026-06-10 10:00:00'), -- Principiante (10 carte) ✓
(4, 2, 2,  7, TRUE,  '2026-06-30 09:30:00', '2026-06-10 10:00:00'), -- Studente Dedicato (streak 7gg) ✓
(5, 2, 3, 74, FALSE, NULL,                  '2026-06-10 10:00:00'), -- Maestro del Quiz (100 carte) in corso
(6, 2, 5,  1, TRUE,  '2026-06-26 09:00:00', '2026-06-10 10:00:00'), -- Perfezionista (sessione 100%) ✓
(7, 2, 6,  7, FALSE, NULL,                  '2026-06-10 10:00:00'), -- Maratoneta (streak 30gg) in corso
(8, 2, 7, 74, FALSE, NULL,                  '2026-06-10 10:00:00'); -- Leggenda (500 carte) in corso