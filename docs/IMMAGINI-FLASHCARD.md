# Immagini nelle flashcard

Ogni flashcard può avere un'immagine opzionale sia sulla domanda che sulla risposta.

---

## Come funziona in breve

Il browser manda il file al backend. Il backend lo ridimensiona e lo salva come `.jpg` su disco. Nel database non salva il file, solo il percorso verso di esso. Quando il frontend deve mostrare l'immagine, la chiede direttamente al backend tramite quel percorso.

```
Browser  →  POST /api/lessons/:id/flashcards (multipart)
               ↓
           Backend riceve il file in RAM (multer)
               ↓
           Sharp lo ridimensiona e lo salva su disco come UUID.jpg
               ↓
           Nel DB salva solo il path: "/uploads/flashcards/abc123.jpg"
               ↓
Browser  ←  riceve il path, richiede GET /uploads/flashcards/abc123.jpg
```

---

## Perché le immagini non stanno nel database

MySQL può memorizzare immagini come BLOB (Binary Large Object), ma è una cattiva idea:

- I **backup** diventano lenti e enormi perché il DB contiene file binari
- Ogni query che legge una flashcard trascinerebbe dietro i file
- Non c'è **caching HTTP** nativo: il browser non può mettere in cache una risposta JSON
- I filesystem esistono apposta per i file; Express li serve in millisecondi

Nel DB la colonna `flashcard.content` è un JSON che contiene solo il percorso testuale:

```json
{
  "question": "Qual è la formula quadratica?",
  "answer": "x = (-b ± √(b²-4ac)) / 2a",
  "questionImage": "/uploads/flashcards/abc123.jpg",
  "answerImage": null
}
```

I file fisici stanno in `backend/uploads/flashcards/`. Puoi aprire quella cartella con Windows Explorer e vedere i JPG normalmente.

---

## Perché si ridimensiona con Sharp

Un'immagine da smartphone può facilmente pesare 5–8MB. Se non si fa nulla:

- 10 flashcard × 2 immagini = fino a 100MB trasferiti ogni volta che si apre una lezione
- Le sessioni di studio diventano lente su connessioni normali

Sharp è una libreria Node.js che elabora immagini ad alta velocità. Nella nostra configurazione fa tre cose:

1. **`.rotate()`** — legge i metadati EXIF della foto e ruota l'immagine correttamente (le foto da smartphone hanno spesso l'orientamento salvato nei metadati invece che nei pixel)
2. **`.resize(1600, 1600, fit: 'inside')`** — riduce l'immagine a massimo 1600px per lato, senza allargare quelle già piccole
3. **`.jpeg({ quality: 85, mozjpeg: true })`** — ricomprime in JPEG con qualità 85%, usando l'algoritmo mozjpeg che è più efficiente di quello standard

Risultato tipico: un'immagine da 1.5MB diventa ~100–200KB. Qualità visiva indistinguibile su schermo.

### Perché i file vengono salvati come JPEG anche se si carica un WebP e PNG

Il frontend accetta in upload tre formati: JPEG, PNG e WebP. Il backend li accetta tutti e tre allo stesso modo. Sharp però converte **sempre** il file in JPEG prima di salvarlo su disco.

Il motivo è che un unico formato di output semplifica il codice:

- Il cleanup sa sempre che l'estensione su disco è `.jpg`, indipendentemente da cosa ha caricato l'utente
- Non serve gestire casi separati per ogni formato nella cancellazione dei file

WebP comprime meglio (~25% in meno di JPEG), ma su immagini già ridimensionate a 1600px la differenza è ~50–100KB — non abbastanza da giustificare la complessità aggiuntiva.

---

## Dove cambiare il limite di dimensione

Il limite massimo per ogni immagine è definito in **due file** (uno per lato). Basta cambiare il numero:

**Backend** — `backend/middleware/upload.js`
```js
const MAX_IMAGE_MB = 5;   // ← cambia qui
```

**Frontend** — `frontend/src/components/subject/ImagePicker.vue`
```js
const MAX_IMAGE_MB = 5   // ← cambia qui (deve corrispondere al backend)
```

Il testo "max 5 MB" mostrato nell'interfaccia si aggiorna automaticamente perché legge la variabile.

> I due valori devono essere uguali: il frontend valida prima di inviare (UX), il backend valida durante lo streaming (sicurezza). Se sono diversi, il frontend potrebbe accettare un file che il backend rifiuta — o viceversa.

---

## Come vengono validati i file

La validazione avviene in due livelli:

### 1. Frontend (UX)

Il componente `ImagePicker.vue` controlla **prima che il file venga inviato**:

- Il tipo MIME deve essere `image/jpeg`, `image/png` o `image/webp`
- La dimensione deve essere ≤ `MAX_IMAGE_MB`

Se fallisce, mostra un toast di errore e non invia nulla.

### 2. Backend (sicurezza)

Il frontend può essere bypassato (basta usare curl o Postman). Per questo il backend fa i suoi controlli indipendentemente:

- **Multer** controlla la dimensione **durante lo streaming**: se il file supera il limite, chiude la connessione immediatamente senza aspettare che arrivi tutto. Questo protegge da attacchi DoS.
- Il `fileFilter` di multer rifiuta i MIME type non validi

Risposta in caso di errore:

| Problema | Codice HTTP | Errore JSON |
|---|---|---|
| File > MAX_IMAGE_MB | 413 | `FLASHCARD_IMAGE_TOO_LARGE` |
| Tipo non valido | 400 | `FLASHCARD_IMAGE_INVALID_TYPE` |

---

## I nomi dei file sono UUID

Ogni immagine salvata ottiene un nome casuale generato con `crypto.randomUUID()`:

```
5aa9ff34-14e6-4a37-b7b9-75d485df0da0.jpg
```

Motivi:
- **Nessuna collisione**: due utenti che caricano `foto.jpg` non si sovrascrivono
- **Nessun information disclosure**: il nome del file originale dell'utente non è visibile
- **Non enumerabile**: un attaccante non può fare `uploads/flashcards/1.jpg`, `2.jpg`... per scaricare tutte le immagini. Con 128 bit di entropia è computazionalmente impossibile indovinare un UUID valido

---

## Quando vengono cancellati i file

I file su disco vengono rimossi automaticamente in tre casi:

| Operazione | Cosa succede |
|---|---|
| **Cancella flashcard** | Il file immagine (domanda e risposta) viene eliminato prima di cancellare il record dal DB |
| **Modifica flashcard con nuova immagine** | Il nuovo file viene salvato, poi — solo dopo il commit sul DB — il vecchio viene cancellato |
| **Modifica flashcard con "rimuovi immagine"** | Il file viene cancellato, il campo nel JSON viene messo a `null` |
| **Cancella lezione** | Prima di cancellare la lezione, vengono letti e cancellati i file di tutte le sue flashcard |

L'ordine è importante: prima si salva/modifica il DB, poi si cancella il file vecchio. Così se il DB fallisce, il file vecchio è ancora lì e referenziato — nessuna perdita di dati.

---

## File toccati nell'implementazione

### Backend

| File | Cosa fa |
|---|---|
| `backend/middleware/upload.js` | Configurazione multer, helper sharp, funzioni di cleanup |
| `backend/app.js` | Serve la cartella `/uploads` come statico |
| `backend/routes/lessons.js` | POST flashcard accetta multipart; DELETE lesson cancella i file |
| `backend/routes/flashcards.js` | PUT accetta nuove immagini / rimozione; DELETE cancella i file |

### Frontend

| File | Cosa fa |
|---|---|
| `frontend/vue.config.js` | Proxy `/uploads` → backend (necessario in sviluppo) |
| `frontend/src/types/index.ts` | Aggiunto `questionImage?` e `answerImage?` al tipo `Flashcard` |
| `frontend/src/data/subjects.ts` | Aggiunto gli stessi campi a `StudyFlashcard` e al mapper |
| `frontend/src/stores/flashcards.ts` | `createFlashcard` e `updateFlashcard` usano `FormData` |
| `frontend/src/components/subject/ImagePicker.vue` | Componente riusabile: input file, preview, validazione |
| `frontend/src/components/subject/CreateFlashcardDialog.vue` | Aggiunto `ImagePicker` per domanda e risposta |
| `frontend/src/components/subject/EditFlashcardDialog.vue` | Aggiunto `ImagePicker` con gestione "rimuovi immagine esistente" |
| `frontend/src/components/subject/FlashcardList.vue` | Mostra immagini nella lista |
| `frontend/src/components/subject/FlashcardItem.vue` | Mostra thumbnail nella vista compatta |
| `frontend/src/components/subject/FlashcardCardModal.vue` | Mostra immagini nel flip card |
| `frontend/src/components/subject/StudySession.vue` | Mostra immagini durante la sessione di studio |
| `frontend/src/components/subject/LessonPage.vue` | Passa i `File` dallo store ai dialog |

---

## Schema del flusso PUT (modifica)

Il campo immagine in modifica ha tre stati possibili:

| Cosa fa l'utente | Cosa arriva al backend | Risultato |
|---|---|---|
| Non tocca l'immagine | Campo assente nel FormData | Immagine invariata |
| Carica un nuovo file | `questionImage=<File>` | Nuovo file salvato, vecchio cancellato |
| Clicca "rimuovi" (X) | `removeQuestionImage=true` | File cancellato, campo → `null` |
