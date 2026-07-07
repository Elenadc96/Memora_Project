# Timing attack sul login — proposte di fix

## Il problema

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
la richiesta ci mette molto più tempo a rispondere, perché deve passare da
bcrypt; quando l'email **non esiste**, la richiesta esce quasi subito.

**Misurato empiricamente** (30 richieste per caso, sull'ambiente locale):

| Caso                          | Tempo medio |
|--------------------------------|-------------|
| Email esistente, password sbagliata | ~68 ms |
| Email inesistente                   | ~3 ms  |

Una differenza di circa 20 volte. Un attaccante che misura i tempi di risposta
può quindi scoprire quali email sono registrate su Memora, anche se il testo
dell'errore è identico in entrambi i casi.

Questa è una vulnerabilità nota e catalogata: **CWE-208 (Observable Timing
Discrepancy)**.

Nota: da quando abbiamo aggiunto il rate limiter sul login (max 10 tentativi
ogni 15 minuti per IP), misurare questa differenza su tante email diverse è
molto più lento e rumoroso da fare — ma il problema di fondo, tecnicamente,
resta lì.

---

## Proposta 1 — Confronto bcrypt sempre eseguito (consigliata)

Anche quando l'email non esiste, si esegue comunque un `bcrypt.compare`
contro un hash "finto" precalcolato, così il tempo di risposta è lo stesso
in entrambi i casi.

```js
// Calcolato una volta all'avvio del server (o hardcoded), non ha bisogno
// di corrispondere a nessuna password reale — serve solo a bruciare lo
// stesso tempo di calcolo di un bcrypt.compare vero.
const DUMMY_HASH = '$2b$10$abcdefghijklmnopqrstuv.wxyzABCDEFGHIJKLMNOPQRSTUVWXY';

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await db.query('SELECT * FROM utenti WHERE email = ?', [email]);
  const user = rows[0];

  // Confronto SEMPRE eseguito, sia che l'utente esista sia che non esista.
  const validPass = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);

  if (!user || !validPass) {
    return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  }
  // ...resto del login
});
```

**Pro:** risolve il problema alla radice, nessuna nuova dipendenza, poche
righe di modifica.
**Contro:** bisogna generare e mantenere l'hash finto (banale, va fatto una
volta sola).

---

## Proposta 2 — Delay artificiale costante

Invece di cambiare la logica di bcrypt, si aggiunge un ritardo fisso (o
casuale in un piccolo intervallo) prima di rispondere, in modo che entrambi
i percorsi (email trovata / non trovata) richiedano più o meno lo stesso
tempo totale.

```js
const MIN_RESPONSE_TIME_MS = 100;

router.post('/login', loginLimiter, async (req, res) => {
  const start = Date.now();
  // ...logica di login esistente, senza modifiche...

  const elapsed = Date.now() - start;
  if (elapsed < MIN_RESPONSE_TIME_MS) {
    await new Promise(r => setTimeout(r, MIN_RESPONSE_TIME_MS - elapsed));
  }
  // ...poi si invia la risposta
});
```

**Pro:** non tocca la logica di autenticazione esistente, facile da capire.
**Contro:** è un'approssimazione ("constant time" non è mai perfettamente
costante — jitter di rete, carico del server, garbage collection possono
comunque introdurre piccole differenze misurabili su tanti campioni);
inoltre rallenta *tutti* i login, anche quelli legittimi, di quel tanto.

---

## Proposta 3 — Accettare il rischio residuo, mitigato dal rate limiter

Si lascia il codice com'è e si considera il rate limiter (Proposta già
implementata su `/api/auth/login`, max 10 tentativi/15 min per IP) una
mitigazione sufficiente: rende la raccolta di molte misure di tempo, su
molte email diverse, lenta e facilmente individuabile (troppi 429).

**Pro:** zero lavoro aggiuntivo.
**Contro:** il problema tecnico resta; un attaccante paziente (o con più IP a
disposizione) può comunque enumerare gli account nel tempo — non è una vera
soluzione, solo un contenimento.

---

## Raccomandazione

**Proposta 1**, perché chiude il problema alla radice con una modifica
piccola e localizzata, senza i compromessi di realismo della Proposta 2 né
il rischio residuo della Proposta 3. Il rate limiter già in piedi resta
comunque utile come ulteriore livello di difesa (*defense in depth*), non in
alternativa.
