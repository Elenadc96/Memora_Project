# Gamification e Classifica — Documentazione

Questo documento spiega come funziona il sistema di punti, streak, badge e classifica globale di Memora: cosa succede, perché è stato progettato così, dove vive ogni pezzo nel database e quali casi limite sono stati (o non sono stati) presi in considerazione.

L'obiettivo è che chi legge capisca la **logica**, non il codice riga per riga: i nomi di colonne/variabili vengono citati solo dove serve per orientarsi nel database.

---

## 1. Visione d'insieme

Il sistema di gamification è composto da quattro concetti collegati tra loro:

1. **I punti totali** — un punteggio cumulativo che rappresenta quanto un utente ha studiato e con quanta costanza.
2. **Lo streak** — il numero di giorni consecutivi in cui l'utente ha studiato almeno una volta.
3. **I badge** — obiettivi sbloccabili, ciascuno con una propria condizione (es. "completa 10 flashcard", "raggiungi 7 giorni di fila").
4. **La classifica globale** — l'elenco di tutti gli utenti ordinato per punti totali.

Tutti e quattro si aggiornano in un unico momento preciso: **quando l'utente completa una sessione di studio** (cioè quando risponde ad almeno una flashcard e la sessione viene salvata). Non esiste un processo periodico o "in background" che ricalcola punteggi: tutto avviene in modo sincrono, subito dopo il salvataggio della sessione, prima che la risposta torni al browser.

Se una sessione viene salvata senza che l'utente abbia risposto a nessuna flashcard (sessione vuota), nessuno di questi quattro elementi viene toccato: non conta né come giorno di streak, né aggiunge carte completate.

---

## 2. Struttura del database

Le tabelle coinvolte sono quattro, oltre a quelle già esistenti per materie/lezioni/flashcard.

### La tabella dei "punti" dell'utente

È una tabella con **una sola riga per utente** (una specie di scheda riassuntiva sempre aggiornata). Contiene:

- il punteggio totale attuale;
- lo streak attuale, in giorni;
- la data dell'ultimo giorno "valido" ai fini dello streak (usata per capire se l'utente ha studiato oggi, ieri, o se ha saltato un giorno);
- quattro contatori di supporto, pensati appositamente per calcolare i badge senza dover rileggere e ricalcolare tutta la cronologia delle sessioni ogni volta: il totale storico di flashcard completate, il numero di sessioni con accuratezza perfetta, e due indicatori sì/no ("ha mai completato una sessione molto veloce", "ha mai studiato nel cuore della notte").

Questa riga viene creata automaticamente in due momenti: alla registrazione di un nuovo utente (parte già a zero), oppure — come rete di sicurezza — alla primissima sessione di studio salvata, se per qualche motivo la riga non esisteva ancora.

**Perché dei contatori "di supporto" invece di ricalcolare tutto al volo?** Perché la cronologia completa delle sessioni può diventare grande, e alcune informazioni (accuratezza perfetta, sessione molto veloce, sessione notturna) richiederebbero di rileggere e interpretare il contenuto di ogni singola sessione passata ogni volta che si apre la pagina della classifica o dei badge — per tutti gli utenti in classifica, non solo per uno. Aggiornare pochi contatori una volta, nel momento in cui succede il fatto, è molto più leggero che ricostruirli da zero ad ogni visualizzazione.

### La tabella dei badge (il catalogo)

Contiene la lista fissa degli 8 badge disponibili, ciascuno con: nome, descrizione, un'icona (salvata come semplice parola chiave, es. "star", "flame" — l'icona vera e propria e la traduzione del nome/descrizione vengono decise dal frontend, il database conserva solo il riferimento), una "categoria" che indica quale contatore va guardato per quel badge, e un traguardo numerico da raggiungere.

Le categorie sono quattro: badge basati sul totale di flashcard completate, badge basati sullo streak, badge "sì/no" legati a un evento particolare (sessione molto veloce oppure sessione notturna), e un badge basato sul numero di sessioni con accuratezza perfetta.

Un dettaglio importante: i badge "sì/no" hanno un traguardo pari a 1 (si sono verificati oppure no), non un numero come "20 carte" o "5 minuti" — quelle soglie non sono un traguardo da mostrare in una barra di progresso, sono la condizione interna che fa scattare l'indicatore sì/no la prima volta. In una versione precedente questi due badge avevano per errore un traguardo numerico (20 e 100) che non corrispondeva a come venivano davvero valutati: è stato corretto.

### La tabella "badge per utente"

Collega ogni utente a ogni badge, con lo stato attuale: quanto è avanti nel traguardo, se è già stato sbloccato, e quando è stato sbloccato (se lo è stato). Se un utente non ha ancora nessun progresso su un badge, semplicemente non esiste ancora una riga per quella combinazione utente/badge — non è un errore, viene trattato come "zero progresso, non sbloccato" quando i dati vengono letti.

### La tabella delle sessioni di studio

Ogni sessione salvata registra, tra le altre cose, un riepilogo di quante flashcard sono state segnate come "sapevo", "quasi" o "non sapevo", oltre alla durata della sessione. Questa tabella è la fonte "grezza" degli eventi; i contatori nella tabella dei punti sono invece un riassunto già pronto all'uso, calcolato progressivamente sessione dopo sessione.

---

## 3. Come vengono calcolati i punti

La formula è semplice e volutamente trasparente, così un utente può capire da solo perché ha un certo punteggio:

> **punti totali = (giorni di streak × 50) + (flashcard completate in totale × 2) + (sessioni con accuratezza perfetta × 100)**

Ogni volta che una sessione viene salvata, il punteggio totale **non viene sommato a quello precedente**: viene ricalcolato da zero usando i tre valori aggiornati (streak, flashcard totali, sessioni perfette). È una scelta deliberata: il punteggio è interamente determinato da questi tre numeri, quindi ricalcolarlo ogni volta garantisce che sia sempre coerente con loro, senza rischio che piccoli errori di somma si accumulino nel tempo come succederebbe sommando un "delta" ad ogni sessione.

Una conseguenza di questa formula, di cui è bene essere consapevoli: **il punteggio totale può scendere**, e non solo salire. Le flashcard completate e le sessioni perfette non diminuiscono mai, ma lo streak sì (vedi punto successivo) — e siccome lo streak è moltiplicato per 50 dentro la stessa formula del "totale", un utente che interrompe la propria costanza vede il punteggio calare, anche se non ha "disimparato" nulla. È un compromesso accettato per ora (rispecchia l'idea "il punteggio riflette anche quanto sei costante *adesso*", non solo quanto hai studiato in passato), ma è bene saperlo: non è un punteggio "solo storico" nel senso stretto del termine.

---

## 4. Come viene calcolato lo streak

Lo streak risponde alla domanda "quanti giorni di fila, fino a oggi compreso, l'utente ha studiato almeno una volta?". Il calcolo confronta la data dell'ultimo giorno in cui lo streak è stato aggiornato con la data di oggi, e si comporta in tre modi diversi:

- **Se l'utente ha già studiato oggi** (cioè l'ultima data registrata è proprio oggi): lo streak non cambia. Questo è ciò che permette di fare più sessioni nello stesso giorno senza che lo streak salga più del dovuto.
- **Se l'ultima volta è stata ieri**: lo streak aumenta di uno, perché la serie di giorni consecutivi continua.
- **In tutti gli altri casi** (non ha mai studiato prima, oppure è passato più di un giorno dall'ultima volta): lo streak riparte da uno, perché oggi è comunque un giorno valido, solo che la serie precedente si è interrotta.

Da notare una piccola differenza rispetto alla formula "sulla carta" descritta inizialmente nello spec: lì lo streak veniva valutato *prima* di contare la sessione di oggi (e in caso di interruzione tornava a zero). Qui invece la sessione di oggi è già avvenuta nel momento in cui il calcolo viene fatto, quindi un'interruzione fa ripartire lo streak da uno (oggi conta) e non da zero. Il risultato pratico è lo stesso, cambia solo il momento concettuale in cui si guarda il numero.

---

## 5. Come vengono sbloccati i badge

Ogni volta che una sessione viene salvata, **tutti** gli 8 badge vengono rivalutati da capo per quell'utente (non solo quelli "vicini" al traguardo). Per ciascun badge si guarda la categoria a cui appartiene (flashcard totali, streak, sessioni perfette, oppure evento sì/no) e si confronta il contatore corrispondente con il traguardo del badge:

- se il contatore ha raggiunto o superato il traguardo, il badge risulta sbloccato;
- altrimenti, il progresso mostrato è il valore del contatore (con un tetto massimo pari al traguardo stesso, così la barra di avanzamento non supera mai il 100%).

Il momento esatto in cui un badge viene sbloccato (la data/ora) viene registrato **una sola volta**, la prima volta che la condizione diventa vera. Le volte successive, anche se il badge viene rivalutato di nuovo, quella data non viene mai sovrascritta — e comunque i contatori che determinano i badge non possono mai diminuire, quindi un badge sbloccato resta sbloccato per sempre.

**Un caso particolare dentro i badge "sì/no":** due badge (quello per la sessione molto veloce e quello per la sessione notturna) condividono la stessa categoria, perché sono entrambi eventi booleani. Per capire a quale dei due contatori guardare (velocità o orario notturno), il sistema al momento guarda **il nome esatto del badge**, non solo la sua categoria. Questo funziona bene finché quei due nomi restano quelli attuali, ma è un punto fragile: ne parlo meglio nella sezione dei casi non gestiti, perché non è una soluzione definitiva.

### Come si accende l'indicatore "sessione molto veloce"

Si accende (e resta acceso per sempre, una volta acceso) se in una singola sessione l'utente ha risposto ad almeno 20 flashcard impiegando meno di 5 minuti in totale.

### Come si accende l'indicatore "sessione notturna"

Si accende (e resta acceso per sempre) se la sessione viene salvata in un orario compreso tra mezzanotte e le 5 del mattino. L'orario considerato è quello del server nel momento in cui riceve la richiesta di salvataggio — non l'orario "percepito" dall'utente sul proprio dispositivo. In pratica, per ora, funziona bene solo se server e utenti si trovano nello stesso fuso orario.

> **Nota:** questo è un limite di *progettazione* (si presume che il fuso del server coincida con quello dell'utente), diverso dal bug di fuso orario trovato e corretto nella dashboard (vedi [§10](#10-bug-di-fuso-orario-scoperto-durante-i-test-dal-vivo-e-corretto)) — quel bug era un errore di calcolo, questo qui invece è una scelta implicita mai messa in discussione, e resta un limite reale.

---

## 6. Come viene calcolata la classifica

La classifica globale mostra fino a 50 utenti, ordinati per punteggio totale decrescente. In caso di parità di punti, vince chi è stato attivo più di recente (guardando l'ultima data in cui lo streak è stato aggiornato); se anche questo coincide, l'ordine viene deciso in modo stabile ma arbitrario (chi si è registrato per primo). Questo garantisce che l'ordine sia sempre lo stesso ad ogni richiesta, senza posizioni che "ballano" a parità di punti.

La posizione mostrata a ciascun utente (#1, #2, #3…) è semplicemente la sua posizione nell'elenco ordinato: **non** viene assegnata la stessa posizione a chi ha lo stesso punteggio (a differenza di alcune classifiche sportive che assegnano "pari merito"). Ogni utente ha sempre una posizione singola e distinta.

---

## 7. Il flusso completo, passo per passo

Quando una sessione di studio viene salvata (e contiene almeno una flashcard con risposta):

1. La sessione viene registrata nello storico.
2. Lo stato di ogni flashcard coinvolta viene aggiornato (padroneggiata, da ripassare, in studio) in base a come l'utente ha risposto.
3. Lo streak viene ricalcolato confrontando la data di oggi con l'ultima registrata.
4. I contatori di supporto (flashcard totali, sessioni perfette, i due indicatori sì/no) vengono aggiornati.
5. Il punteggio totale viene ricalcolato da zero con la formula.
6. Tutti gli 8 badge vengono rivalutati rispetto ai contatori appena aggiornati, ed eventuali nuovi sblocchi vengono salvati con la data di sblocco.
7. Solo a questo punto la risposta torna al browser, e la pagina della classifica/badge — quando viene aperta — leggerà già i dati aggiornati.

---

## 8. Casi particolari gestiti

- **Più sessioni nello stesso giorno**: lo streak non viene incrementato più di una volta al giorno, ma flashcard completate, sessioni perfette e punti continuano ad accumularsi normalmente ad ogni sessione.
- **Sessione senza risposte**: non tocca nessuno dei quattro elementi (niente streak, niente punti, niente badge). Viene comunque salvata come sessione, ma è "trasparente" ai fini della gamification.
- **Primo utente in assoluto senza dati pregressi**: sia allo streak che ai contatori viene applicato un punto di partenza coerente (streak parte da 1 il primo giorno, i contatori da zero).
- **Badge già sbloccato che viene rivalutato di nuovo**: non perde la data originale di sblocco, e non può "tornare bloccato" perché i contatori non diminuiscono mai.
- **Utente a pari punti con un altro in classifica**: ha comunque una posizione singola e distinta, non condivisa, grazie al criterio di spareggio.
- **Utente nuovo che si registra**: entra subito in classifica con zero punti, invece di essere invisibile finché non completa la prima sessione.
- **Un passaggio del salvataggio fallisce a metà strada**: l'intero salvataggio di una sessione (sessione, stato delle flashcard, streak/punti, badge) è trattato come un **unico blocco indivisibile**. Se un qualsiasi passaggio fallisce per un problema tecnico imprevisto, tutti i passaggi già fatti prima — anche se erano andati a buon fine — vengono annullati automaticamente, come se la richiesta non fosse mai arrivata. L'utente riceve un errore chiaro invece di ritrovarsi con dati salvati solo a metà (es. la sessione registrata ma i punti no). Il dettaglio di come funziona è spiegato subito sotto.

### Come funziona la garanzia "o tutto o niente" sul salvataggio di una sessione

Questa parte merita una spiegazione a sé, perché è un meccanismo con un nome tecnico preciso (**transazione**) ma l'idea è semplice, ed è la stessa che si usa per un bonifico bancario: quando si sposta del denaro da un conto a un altro, la banca non vuole mai ritrovarsi nella situazione in cui i soldi sono usciti dal primo conto ma non sono ancora arrivati sul secondo. O il trasferimento riesce completamente, o va annullato completamente — non deve mai esistere uno stato "a metà".

Salvare una sessione di studio ha lo stesso problema, su scala più piccola: sono quattro scritture diverse sul database (la sessione stessa, lo stato di ogni flashcard, i contatori di punti/streak, e la valutazione degli 8 badge) che rappresentano un solo gesto dell'utente ("ho finito di studiare"). Prima di questa modifica, ogni scrittura veniva fatta per conto proprio, una via l'altra: se una delle ultime falliva, quelle precedenti restavano comunque salvate.

Ora, invece, tutte e quattro le scritture avvengono all'interno di un'unica transazione:

1. Prima di scrivere qualunque cosa, si comunica al database "da questo momento, tieni in sospeso tutto quello che sto per scrivere, non renderlo ancora definitivo".
2. Si eseguono in ordine tutte le scritture necessarie.
3. Se **tutte** vanno a buon fine, si dice al database "conferma, rendi definitivo tutto quello che ho scritto" — a quel punto, e solo a quel punto, i dati diventano visibili e permanenti.
4. Se **una qualsiasi** delle scritture fallisce (per un errore di connessione, un dato inatteso, o qualunque altro imprevisto), si dice al database "annulla tutto quello che ho scritto finora in questa transazione" — riportando il database esattamente allo stato in cui si trovava prima che la richiesta iniziasse, come se non fosse mai arrivata.

Una conseguenza pratica di questa scelta: le scritture dentro la transazione ora avvengono una alla volta, in fila, invece che "in parallelo" come succedeva prima per alcune di esse (l'aggiornamento dello stato delle flashcard, e la valutazione degli 8 badge). Il motivo è che tutte queste scritture condividono lo stesso "canale" dedicato verso il database aperto per la transazione, e quel canale può gestire una sola operazione alla volta — è lo stesso principio per cui in banca un singolo sportello serve un cliente alla volta, anche se in totale gli sportelli sono di più. Con il numero di flashcard e badge in gioco per ogni sessione (poche decine al massimo), la differenza di velocità percepita dall'utente è trascurabile.

---

## 9. Casi particolari **non** gestiti — da valutare insieme

Qui elenco onestamente i punti che ho individuato rivedendo la logica, che al momento **non** sono coperti. Non sono necessariamente errori bloccanti, ma sono scelte non ancora fatte consapevolmente insieme, quindi le segnalo così decidiamo insieme se e come intervenire.

1. **Nessun controllo che la sessione appartenga davvero all'utente.** Quando si salva una sessione, il sistema si fida dei dati inviati dal client (quale materia, quale lezione, quali flashcard e con quale esito) senza verificare che quella lezione appartenga davvero all'utente che sta salvando, né che le flashcard indicate esistano davvero in quella lezione. In una classifica competitiva, questo significa che in teoria si potrebbero "inventare" risultati di sessioni (anche molto grandi) per guadagnare punti e badge senza aver davvero studiato. Andrebbe aggiunto un controllo che verifichi la proprietà dei dati prima di accettarli.

2. **Nessuna protezione da richieste simultanee.** Se due sessioni della stessa persona vengono salvate esattamente nello stesso istante (ad esempio doppio click, o due schede del browser aperte), il sistema legge lo stato attuale, calcola i nuovi valori e poi scrive — ma tra la lettura e la scrittura un'altra richiesta potrebbe intromettersi. Nel peggiore dei casi, una delle due sessioni "vince" e i contatori dell'altra vengono silenziosamente persi. È un caso raro nell'uso normale, ma non impossibile. (Nota: questo è un problema diverso dalla garanzia "o tutto o niente" appena descritta sopra — quella riguarda un fallimento a metà di **una singola** richiesta; questo riguarda **due richieste diverse** che si accavallano nel tempo.)

3. **La distinzione tra i due badge booleani si basa sul nome esatto, non su qualcosa di strutturale.** Se in futuro qualcuno rinominasse uno di quei due badge dal pannello di amministrazione (che esiste ma è comunque un'area poco rifinita del progetto), oppure se se ne aggiungesse un terzo della stessa categoria, la logica smetterebbe di distinguerli correttamente in modo silenzioso, senza generare un errore visibile.

4. **La classifica mostra solo i primi 50.** Se un utente non rientra tra i primi 50, semplicemente non compare nell'elenco, e la sua posizione personale non viene mostrata da nessuna parte (l'app mostra un trattino). Per il numero di utenti attuale non è un problema pratico, ma è un limite da tenere presente se la base utenti dovesse crescere.

5. **Cancellare una materia o una lezione già studiata non fa scendere punti/contatori.** I contatori di gamification si accumulano nel momento in cui una sessione viene salvata, e da quel momento vivono "di vita propria" rispetto alla sessione stessa: se in seguito la materia o la lezione collegata viene eliminata (le sessioni associate vengono eliminate automaticamente insieme ad essa), il punteggio e i badge già guadagnati restano invariati. Può essere il comportamento desiderato (non si vuole punire chi fa ordine tra i propri contenuti), ma è bene che sia una scelta esplicita e non solo una conseguenza secondaria non discussa.

Fammi sapere quali di questi punti vuoi affrontare per primi.

---

## 10. Bug di fuso orario scoperto durante i test dal vivo (e corretto)

Questo bug **non riguarda il ranking o i badge** — è nella dashboard generale (`GET /api/dashboard`, il grafico "Attività di Studio Settimanale") — ma lo documento qui perché è emerso proprio testando dal vivo il sistema di punti/streak descritto in questo file, ed era esattamente il tipo di dubbio sollevato al §5 sul fuso orario. È stato trovato confrontando cosa mostrava la pagina con cosa restituiva davvero l'API (non fidandosi della sola interfaccia), quindi lo segno anche come promemoria di metodo: quando qualcosa sembra sbagliato, la verifica va fatta sui dati grezzi, non a occhio.

### Il sintomo

Nella dashboard, le sessioni di studio fatte "oggi" comparivano nel grafico settimanale come se fossero state fatte "ieri" — un giorno sistematicamente indietro rispetto alla realtà.

### La causa

Il codice doveva rispondere alla domanda "questa sessione, salvata in un certo istante, a quale dei 7 giorni del grafico appartiene?". Per rispondere, trasformava sia "oggi" sia la data di ogni sessione in un testo tipo `2026-07-01`, per poi confrontare i due testi.

Il problema è che le due trasformazioni non erano coerenti tra loro:

- la data di "oggi" veniva letta dall'orologio del computer così com'è (ora locale reale, es. le 11 del mattino) — nessun problema, restava sul giorno giusto;
- la data di ogni sessione, invece, veniva prima recuperata dal database come "solo giorno, senza orario" (equivalente a mezzanotte), e poi convertita in un testo usando un metodo che **converte sempre in fuso orario universale (UTC)** prima di scrivere il risultato.

Con un fuso orario avanti rispetto a UTC (quello italiano/tedesco d'estate, due ore avanti), la mezzanotte locale di un giorno corrisponde, in UTC, alle 22:00 del giorno **precedente**. Quindi ogni sessione, passando per quella conversione, veniva sistematicamente etichettata un giorno prima di quello vero — mentre "oggi" (calcolato senza passare per quella stessa conversione) restava corretto. Il confronto tra i due, di conseguenza, non trovava mai una sessione di oggi nel posto giusto: la trovava sempre "spostata" nel giorno prima.

### La correzione

In `backend/routes/api.js`, dentro `GET /api/dashboard`: invece di trasformare le date in testo passando per il fuso universale, ora si leggono direttamente i componenti (anno, mese, giorno) nel fuso orario locale, per entrambi i lati del confronto. Così "oggi" e "la data della sessione" vengono sempre letti allo stesso modo, e non c'è più nessuno spostamento.

### Riguarda anche punti/streak/badge?

No — verificato apposta. Il calcolo dello streak (§4) confronta le date in un modo diverso, che **non** passa per quella stessa conversione a rischio (usa l'ora locale in modo coerente su entrambi i lati del confronto, senza convertirla in formato universale a metà strada). L'ho verificato anche con un test dal vivo: completando una sessione vera il giorno dopo l'ultima registrata, lo streak è salito correttamente di uno — comportamento corretto, non l'errore appena descritto.

### Quindi la questione del fuso orario è "risolta"?

Solo in parte, ed è importante non confondere due problemi diversi:

- **Questo bug** (sessioni di oggi finite nel giorno sbagliato nel grafico) — **sì, risolto**. Era un errore di calcolo vero e proprio.
- **Il limite descritto al §5** (il badge "Nottambulo" guarda l'ora del server, non quella di chi studia) — **no, non risolto, resta un limite aperto**. Non è un errore di calcolo: è una scelta implicita (si assume che server e utente siano nello stesso fuso) che funziona bene qui perché è così nell'ambiente di sviluppo attuale, ma andrebbe affrontata separatamente — ad esempio sapendo/salvo il fuso orario di ciascun utente — se in futuro server e utenti potessero trovarsi in fusi diversi.
