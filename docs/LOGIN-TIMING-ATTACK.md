# Auth Security — Login e Registrazione

Documento di riferimento per i problemi di sicurezza e le proposte di miglioramento
relativi alle rotte `POST /api/auth/login` e `POST /api/auth/register`.

---

## Stato dei problemi

| # | Problema | Area | Priorità | Stato |
|---|----------|------|----------|-------|
| 1 | Nessuna validazione backend dei campi obbligatori | Registrazione | Critica | 🔴 Aperto |
| 2 | Nessun rate limiting su `/register` | Registrazione | Critica | 🔴 Aperto |
| 3 | Race condition su email duplicata | Registrazione | Critica | 🔴 Aperto |
| 4 | Trim non applicato ai campi di testo | Registrazione | Importante | 🟡 Aperto |
| 5 | Messaggio di successo fuorviante post-registrazione | Registrazione | Importante | 🟡 Aperto |
| 6 | Nessuna verifica email | Registrazione | Importante | 🟡 Aperto |
| 7 | Timing attack sull'esistenza di un account | Login | Media | 🟡 Aperto |
| 8 | Password policy assente alla registrazione | Registrazione | Critica | ✅ Risolto |
| 9 | Registrazione non atomica (utenti + points) | Registrazione | Critica | ✅ Risolto |
| 10 | Validazione settings assente | Registrazione / Profilo | Critica | ✅ Risolto |
| 11 | Consenso GDPR assente | Registrazione | Importante | ✅ Risolto |

---

## Problemi aperti

### 1 — Nessuna validazione backend dei campi obbligatori

`backend/routes/auth.js` accetta la richiesta di registrazione senza verificare
che `name`, `lastName`, `email` e `password` siano presenti e non vuoti.
Un attaccante può chiamare l'API direttamente con campi assenti o bianchi.

**Fix proposto:** aggiungere controlli espliciti prima dell'apertura della
transazione, restituendo i codici di errore stabili già definiti
(`NAME_REQUIRED`, `LASTNAME_REQUIRED`, ecc.) già presenti nei file i18n.

---

### 2 — Nessun rate limiting su `/register`

La rotta `POST /api/auth/login` ha un limite di 10 tentativi per IP ogni 15
minuti. La rotta `POST /api/auth/register` non ha nessun limite.

**Impatto:** uno script può creare migliaia di account in pochi secondi,
riempiendo il database e saturando la CPU con le chiamate a `bcrypt.hash`
(volutamente lento — è il punto critico).

**Fix proposto:** aggiungere un `rateLimit` sulla rotta `/register`, con un
limite più permissivo rispetto al login (es. 5 registrazioni / 15 min per IP)
dato che un utente normale si registra una volta sola.

---

### 3 — Race condition su email duplicata

Il controllo di email già esistente avviene con una `SELECT` separata prima
dell'`INSERT`. Due richieste simultanee con la stessa email possono entrambe
superare il check e arrivare all'`INSERT`: la seconda fallisce sulla `UNIQUE`
constraint del DB, ma il `catch` generico restituisce `SERVER_ERROR` invece
di `EMAIL_ALREADY_REGISTERED`.

**Fix proposto:** nel blocco `catch`, intercettare l'errore MySQL con codice
`1062` (duplicate entry) e restituire `EMAIL_ALREADY_REGISTERED` anziché
`SERVER_ERROR`.

```js
} catch (err) {
  await conn.rollback();
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({ error: 'EMAIL_ALREADY_REGISTERED' });
  }
  console.error("ERRORE DURANTE LA REGISTRAZIONE:", err);
  res.status(500).json({ error: "SERVER_ERROR" });
}
```

---

### 4 — Trim non applicato ai campi di testo

`name` e `lastName` vengono salvati nel DB così come arrivano dalla richiesta.
Un utente può registrarsi con `"  Mario  "` e gli spazi vengono persistiti.
Il PATCH del profilo (`users.js`) applica già `.trim()` — inconsistenza.

**Fix proposto:** aggiungere `.trim()` su `name` e `lastName` in `auth.js`
prima dell'INSERT, come già fatto in `users.js`.

---

### 5 — Messaggio di successo fuorviante

Dopo la registrazione il frontend mostra "Puoi ora effettuare il login" e
redirige a `/login`, ma l'utente è già autenticato (il cookie JWT è stato
impostato dal backend). Il router lo reindirizzerà automaticamente a
`/dashboard`, rendendo il messaggio inaccurato.

**Fix proposto:** aggiornare il testo in `it.json` / `en.json` sotto
`register.success_text` con qualcosa di neutro (es. "Registrazione completata,
benvenuto su Memora."), oppure reindirizzare direttamente a `/dashboard`
dopo la registrazione anziché a `/login`.

---

### 6 — Nessuna verifica email

L'utente viene registrato e autenticato immediatamente, senza confermare il
possesso dell'indirizzo email. È possibile registrarsi con l'email di
qualcun altro.

**Fix proposto (complesso):** aggiungere alla tabella `utenti` i campi
`email_verified`, `email_verification_token` e `email_verification_token_expires_at`;
inviare un'email con link di verifica al momento della registrazione; bloccare
il login fino alla verifica. Richiede l'integrazione di un servizio SMTP
(es. Nodemailer + SendGrid / Resend).

---

### 7 — Timing attack sull'esistenza di un account

Vedere la sezione dettagliata in fondo al documento.

---

## Problemi risolti

### ✅ 8 — Password policy assente alla registrazione
La rotta `/register` non validava la password. Aggiunta `isValidPassword()`
in `backend/utils/validators.js` (8+ caratteri, maiuscola, minuscola, numero),
applicata sia alla registrazione che al cambio password. Il frontend mostra
i requisiti in tempo reale durante la digitazione.

### ✅ 9 — Registrazione non atomica
`INSERT INTO utenti` e `INSERT INTO points` erano due query separate: se la
seconda falliva, l'utente esisteva nel DB senza riga punti. Entrambe le
query sono ora dentro una singola transazione con `BEGIN / COMMIT / ROLLBACK`.

### ✅ 10 — Validazione settings assente
Il campo `settings` accettava qualsiasi JSON. Aggiunta `isValidSettings()`
in `validators.js`: accetta solo le chiavi `theme` (`light`/`dark`) e
`language` (`it`/`en`). Applicata sia alla registrazione che al PATCH profilo.

### ✅ 11 — Consenso GDPR assente
Aggiunta checkbox "Ho letto e accetto la Privacy Policy" nel form di
registrazione. Il submit è bloccato se non spuntata. Il link apre
`/privacy-policy` in una nuova tab.

---

## Dettaglio — Timing attack (problema #7)

### Il problema

In `backend/routes/auth.js`, la rotta `POST /api/auth/login` risponde con lo
stesso messaggio (`INVALID_CREDENTIALS`) sia se l'email non esiste sia se la
password è sbagliata — pensato apposta per non rivelare quale delle due cose
sia sbagliata. Il problema è che i due casi impiegano tempi molto diversi:

```js
const [rows] = await db.query('SELECT * FROM utenti WHERE email = ?', [email]);

if (rows.length === 0) {
  return res.status(401).json({ error: "INVALID_CREDENTIALS" }); // veloce: nessun bcrypt
}

const validPass = await bcrypt.compare(password, user.password_hash); // lento, apposta

if (!validPass) {
  return res.status(401).json({ error: "INVALID_CREDENTIALS" });
}
```

`bcrypt.compare` è progettato per essere lento (è una feature: rende il brute
force sull'hash più costoso). Ma questo significa che quando l'email **esiste**,
la richiesta ci mette molto più tempo a rispondere; quando l'email **non esiste**,
la richiesta esce quasi subito.

**Misurato empiricamente** (30 richieste per caso, sull'ambiente locale):

| Caso | Tempo medio |
|------|-------------|
| Email esistente, password sbagliata | ~68 ms |
| Email inesistente | ~3 ms |

Una differenza di circa 20 volte. Un attaccante che misura i tempi di risposta
può scoprire quali email sono registrate su Memora, anche se il testo dell'errore
è identico. Vulnerabilità catalogata come **CWE-208 (Observable Timing Discrepancy)**.

Nota: il rate limiter sul login (max 10 tentativi / 15 min per IP) rende la
raccolta di molte misure lenta e rumorosa — ma il problema tecnico resta.

---

### Proposta A — Confronto bcrypt sempre eseguito (consigliata)

Anche quando l'email non esiste, si esegue comunque un `bcrypt.compare`
contro un hash finto precalcolato, così il tempo di risposta è lo stesso
in entrambi i casi.

```js
const DUMMY_HASH = '$2b$10$abcdefghijklmnopqrstuv.wxyzABCDEFGHIJKLMNOPQRSTUVWXY';

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await db.query('SELECT * FROM utenti WHERE email = ?', [email]);
  const user = rows[0];

  const validPass = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);

  if (!user || !validPass) {
    return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  }
  // ...resto del login
});
```

**Pro:** risolve il problema alla radice, nessuna nuova dipendenza, poche righe.
**Contro:** bisogna generare e mantenere l'hash finto (operazione banale, una tantum).

---

### Proposta B — Delay artificiale costante

Si aggiunge un ritardo fisso prima di rispondere, così entrambi i percorsi
richiedono lo stesso tempo totale.

```js
const MIN_RESPONSE_TIME_MS = 100;

router.post('/login', loginLimiter, async (req, res) => {
  const start = Date.now();
  // ...logica di login esistente...

  const elapsed = Date.now() - start;
  if (elapsed < MIN_RESPONSE_TIME_MS) {
    await new Promise(r => setTimeout(r, MIN_RESPONSE_TIME_MS - elapsed));
  }
  // ...poi si invia la risposta
});
```

**Pro:** non tocca la logica di autenticazione, facile da capire.
**Contro:** non è mai perfettamente costante (jitter di rete, GC); rallenta
tutti i login legittimi.

---

### Proposta C — Accettare il rischio residuo

Si lascia il codice com'è e si considera il rate limiter una mitigazione
sufficiente.

**Pro:** zero lavoro aggiuntivo.
**Contro:** il problema tecnico resta; un attaccante paziente o con più IP
può comunque enumerare gli account nel tempo.

---

### Raccomandazione

**Proposta A**, perché chiude il problema alla radice con una modifica piccola
e localizzata. Il rate limiter resta comunque utile come ulteriore livello di
difesa (*defense in depth*).
