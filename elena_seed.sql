-- ============================================================
-- SEED DATA: Elena Di Cicco (user_id = 2)
-- Da importare su phpMyAdmin DOPO memora_project.sql
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ── Nuove materie ────────────────────────────────────────────
INSERT INTO `subject` (`id`, `user_id`, `subjectName`, `description`, `color`, `emoji`, `created_at`) VALUES
(8,  2, 'Inglese',  'Grammatica e vocabolario inglese',    '#10B981', '📖', '2026-06-10 10:00:00'),
(9,  2, 'Biologia', 'Scienze biologiche e vita cellulare', '#EF4444', '🧬', '2026-06-10 10:00:00'),
(10, 2, 'Chimica',  'Chimica generale e organica',         '#F59E0B', '🧪', '2026-06-10 10:00:00');

-- ── Lezioni ──────────────────────────────────────────────────
INSERT INTO `lessons` (`id`, `name`, `description`, `subject_id`, `status`, `last_study`, `last_lesson_duration`, `created_at`) VALUES
-- Matematica (subject 5)
(7,  'Equazioni di 2° grado', 'Formula quadratica e discriminante',       5, 2, '2026-06-30 09:30:00', 20, '2026-06-10 10:00:00'),
(8,  'Derivate',              'Derivata di funzioni elementari',           5, 1, '2026-06-27 07:30:00', 18, '2026-06-10 10:00:00'),
(9,  'Integrali',             'Integrale indefinito e definito',           5, 1, '2026-06-28 07:30:00', 16, '2026-06-10 10:00:00'),
-- Storia (subject 6)
(10, 'Prima guerra mondiale', 'Cause e dinamiche del conflitto 1914-1918', 6, 2, '2026-06-30 08:30:00', 20, '2026-06-10 10:00:00'),
(11, 'Rinascimento italiano', 'Arte e cultura del Rinascimento',           6, 1, '2026-06-27 11:00:00', 18, '2026-06-10 10:00:00'),
-- Geografia (subject 7)
(12, 'Capitali d\'Europa',   'Capitali e stati europei',                  7, 1, '2026-06-25 10:30:00', 15, '2026-06-10 10:00:00'),
-- Inglese (subject 8)
(13, 'Present Perfect',       'Uso e formazione del Present Perfect',      8, 2, '2026-06-29 07:00:00', 18, '2026-06-10 10:00:00'),
(14, 'Conditional Sentences', 'First, Second e Third Conditional',         8, 2, '2026-06-30 08:30:00', 16, '2026-06-10 10:00:00'),
(15, 'Irregular Verbs',       'I 100 verbi irregolari più comuni',         8, 1, '2026-06-27 10:00:00', 28, '2026-06-10 10:00:00'),
-- Biologia (subject 9)
(16, 'La Cellula',            'Struttura e funzioni della cellula',         9, 1, '2026-06-29 09:30:00', 16, '2026-06-10 10:00:00'),
(17, 'Genetica di base',      'DNA, geni e ereditarietà',                  9, 1, '2026-06-27 09:00:00', 18, '2026-06-10 10:00:00'),
(18, 'Fotosintesi',           'Processo fotosintetico nelle piante',        9, 0, '2026-06-29 11:00:00', 14, '2026-06-10 10:00:00'),
-- Chimica (subject 10)
(19, 'Tavola Periodica',      'Elementi, periodi e gruppi',                10, 0, '2026-06-26 07:30:00', 20, '2026-06-10 10:00:00'),
(20, 'Legami Chimici',        'Legame ionico, covalente e metallico',      10, 0, '2026-06-28 09:00:00', 16, '2026-06-10 10:00:00');

-- ── Flashcard ─────────────────────────────────────────────────
INSERT INTO `flashcard` (`id`, `content`, `difficult`, `created_at`) VALUES

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

-- Lesson 4: Seconda guerra mondiale (flashcard extra)
(54, '{"question":"Cos\'è stato il Patto Molotov-Ribbentrop?","answer":"Accordo di non aggressione firmato il 23 agosto 1939 tra URSS e Germania nazista, con protocollo segreto per la spartizione dell\'Europa orientale (Polonia, Paesi Baltici)."}', 2, '2026-06-10 10:00:00'),
(55, '{"question":"Cos\'è stato l\'Olocausto?","answer":"Lo sterminio sistematico di circa 6 milioni di ebrei e milioni di altri perseguitati (Rom, disabili, omosessuali, oppositori politici) da parte del regime nazista tra il 1941 e il 1945."}', 2, '2026-06-10 10:00:00'),
(56, '{"question":"Quando è avvenuto lo sbarco in Normandia e perché è importante?","answer":"6 giugno 1944 (D-Day): la più grande operazione anfibia della storia. Gli Alleati aprirono un secondo fronte in Europa occidentale, accelerando la sconfitta della Germania nazista."}', 1, '2026-06-10 10:00:00'),

-- Lesson 5: Fiumi d'Italia (flashcard extra)
(57, '{"question":"Qual è il fiume più lungo d\'Italia e dove sfocia?","answer":"Il Po (652 km): nasce dal Monviso in Piemonte e sfocia nel Mar Adriatico con un ampio delta a sud di Venezia."}', 1, '2026-06-10 10:00:00'),
(58, '{"question":"Quale fiume attraversa Roma?","answer":"Il Tevere (405 km), terzo fiume d\'Italia per lunghezza. Sfocia nel Mar Tirreno a Ostia."}', 1, '2026-06-10 10:00:00'),
(59, '{"question":"Quale fiume attraversa Firenze ed è famoso per i suoi ponti storici?","answer":"L\'Arno (241 km). Su di esso si trovano il celebre Ponte Vecchio e altri ponti storici del centro città."}', 1, '2026-06-10 10:00:00');

-- ── Flashcard_lesson (status attuale) ────────────────────────
INSERT INTO `flashcard_lesson` (`flashcard_id`, `lesson_id`, `status`, `created_at`) VALUES
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
(53, 20, 'learning', '2026-06-10 10:00:00'),
-- Lesson 4 Seconda guerra mondiale (extra cards): 1 mastered, 1 review, 1 learning
(54, 4, 'mastered', '2026-06-10 10:00:00'),
(55, 4, 'review',   '2026-06-10 10:00:00'),
(56, 4, 'learning', '2026-06-10 10:00:00'),
-- Lesson 5 Fiumi d'Italia (extra cards): 1 mastered, 1 review, 1 learning
(57, 5, 'mastered', '2026-06-10 10:00:00'),
(58, 5, 'review',   '2026-06-10 10:00:00'),
(59, 5, 'learning', '2026-06-10 10:00:00');

-- ── Sessioni ultimi 7 giorni (user_id=2) ─────────────────────
-- Tutte le date in UTC (ora italiana = UTC+2 in estate)
-- Totali per giorno → grafico settimanale:
--   Mer 24/6:  8 studiate,  6 corrette
--   Gio 25/6: 11 studiate,  8 corrette
--   Ven 26/6:  6 studiate,  4 corrette
--   Sab 27/6: 13 studiate, 10 corrette
--   Dom 28/6: 11 studiate,  7 corrette
--   Lun 29/6: 14 studiate, 11 corrette
--   Mar 30/6: 11 studiate,  9 corrette  ← oggi (54 min)
--
--   Tasso successo storico ≈ 74%
INSERT INTO `sessioni` (`id`, `user_id`, `subject_id`, `lesson_id`, `result`, `last_usage_date`, `session_duration`, `completed`, `created_at`) VALUES

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
INSERT INTO `points` (`id`, `user_id`, `total_point`, `streak_days`, `last_streak_date`, `created_at`, `updated_at`) VALUES
(2, 2, 320, 7, '2026-06-30 09:30:00', '2026-06-10 10:00:00', '2026-06-30 09:30:00');

-- ── Badge di Elena ────────────────────────────────────────────
INSERT INTO `user_badge` (`id`, `user_id`, `badge_id`, `progress`, `unlocked`, `unlocked_at`, `created_at`) VALUES
(3, 2, 1, 10, 1, '2026-06-15 10:00:00', '2026-06-10 10:00:00'),  -- Principiante (10 fc) ✓
(4, 2, 2,  7, 1, '2026-06-30 09:30:00', '2026-06-10 10:00:00'),  -- Studente Dedicato (streak 7gg) ✓
(5, 2, 3, 74, 0, NULL,                  '2026-06-10 10:00:00');   -- Maestro del Quiz (100 fc) in corso
