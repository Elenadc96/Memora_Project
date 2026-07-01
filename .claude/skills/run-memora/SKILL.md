---
name: run-memora
description: Launch and drive Memora (MEVN flashcard app) locally — backend, frontend, DB, browser automation with Playwright, and login credentials for manual/automated testing. Use whenever asked to run, test, screenshot, or verify a change in this app end-to-end.
---

# Eseguire e testare Memora dal vivo

Questo file raccoglie quello che ho imparato eseguendo davvero l'app (non solo leggendo il codice), così una sessione futura non deve riscoprirlo da zero.

## Avvio backend

```bash
cd backend
npm run dev   # nodemon, porta 3000 (da .env / PORT)
```

Verifica che sia su: `curl http://localhost:3000/api/status` → `{"status":"ok",...}`.

**Bug noto (probabilmente già risolto, ma se ricompare è questo):** `routes/users.js` può mandare in crash l'intero avvio con `ValidationError: ... ERR_ERL_KEY_GEN_IPV6`. Causa: `express-rate-limit` v8 richiede l'helper `ipKeyGenerator` per normalizzare `req.ip` in un `keyGenerator` custom. Fix: importare `const { ipKeyGenerator } = require('express-rate-limit')` e usarlo per il fallback IP invece di `req.ip` grezzo.

Serve MySQL raggiungibile con le credenziali in `backend/.env` (DB_HOST/DB_USER/DB_PASSWORD/DB_NAME). Schema + seed completi (incluso l'utente demo Elena) sono in un unico file: `backend/sql/memora.sql`.

## Avvio frontend

```bash
cd frontend
npm run serve   # vue-cli-service, porta 8080 di default
```

**Attenzione:** se la 8080 è occupata, vue-cli-service passa automaticamente alla porta successiva libera (es. 8082) — controlla sempre la riga `App running at:` nel log invece di assumere 8080. Il proxy `/api/*` → `localhost:3000` (config in `vue.config.js`) funziona comunque, indipendentemente dalla porta del frontend.

Per fermare entrambi: `pkill -f "node ./bin/www"` e `pkill -f "vue-cli-service serve"` (oppure trova il PID con `netstat -ano | grep :3000` / `:8080`/`:8082` e killalo).

## Credenziali di test

Utente demo con dati storici realistici (materie, lezioni, flashcard, sessioni, punti, badge) creato nel seed:

- Email: `elena.di.cicco96@gmail.com`
- Password: `Elena123!`

C'è anche un utente minimale `mario@example.com` (id=1) ma senza password bcrypt valida (placeholder) — non usarlo per login reale via UI.

**Attenzione:** se in futuro la password di Elena viene cambiata dall'app (o il DB reimportato con un seed diverso), questa credenziale va verificata/aggiornata.

## Browser automation

`chromium-cli` **non è installato** in questo ambiente. Setup Playwright da zero (una tantum per sessione, ~1-2 minuti):

```bash
cd <scratchpad>
npm init -y
npm install playwright
npx playwright install chromium   # ~115MB, serve anche se già fatto in un'altra sessione: l'installazione dei browser non persiste tra sessioni diverse
```

Poi un normale script Node con `require('playwright')` (non serve il test runner di Playwright, va bene uno script imperativo con `chromium.launch()`).

### Login (selettori verificati)

```js
await page.goto(BASE + '/login');
await page.fill('input[type=email]', 'elena.di.cicco96@gmail.com');
await page.fill('input[type=password]', 'Elena123!');
await page.click('button[type=submit]');
await page.waitForURL('**/dashboard', { timeout: 15000 });
```

### Navigare a una lezione — NON fare deep-link diretto

`page.goto(BASE + '/subject/:id/lesson/:lessonId')` (reload completo) **non è affidabile**: spesso mostra ancora la lista lezioni della materia invece del dettaglio, per una race tra il caricamento delle lezioni nello store e il redirect-back che scatta se `lessonId` non risolve subito. Va bene invece navigare in due passi client-side:

```js
await page.goto(BASE + '/subject/' + subjectId);
await page.waitForSelector('text=' + lessonName, { timeout: 10000 });
await page.locator('text=' + lessonName).first().click();   // click sulla RIGA, non sul bottone hover "Studia"
await page.waitForURL('**/lesson/**', { timeout: 10000 });
```

### Completare una sessione di studio

Sulla pagina di dettaglio lezione, un solo bottone `button:has-text("Studia")` apre l'overlay (se sei ancora sulla lista materie invece del dettaglio lezione, ce ne sono 2+ per via dei bottoni hover sulle righe — segno che la navigazione sopra non è andata a buon fine).

Per ogni flashcard:

```js
await page.getByText('Mostra risposta', { exact: true }).click();   // NON "Tocca/Clicca per vedere la risposta" — quello è solo testo statico, non cliccabile
await page.getByText('Lo sapevo!', { exact: true }).click();        // oppure 'Quasi...' / 'Non lo sapevo'
```

Il salvataggio parte con `POST /api/sessions` all'ultima carta — per sapere quando è finito:

```js
await page.waitForResponse(r => r.url().includes('/api/sessions') && r.request().method() === 'POST');
```

### Verificare la classifica/badge

`/ranking` fa due chiamate in parallelo (`GET /api/ranking` + `GET /api/badge/me`); aspetta `text=Le Tue Stats` prima di leggere i numeri, altrimenti li leggi mentre sono ancora a "–"/0.

### Rumore di console innocuo

Un `401` su `GET /api/auth/me` al primissimo caricamento (prima del login, o su un reload a freddo della pagina di login) è normale: `App.vue` chiama `checkSession()` incondizionatamente all'avvio per capire se l'utente è già loggato. Non è un bug.

## Formula punti (per verificare a mano i risultati di un test)

```
punti totali = streak_giorni × 50 + carte_completate_totali × 2 + sessioni_perfette × 100
```

Dettagli e casi limite completi in `docs/GAMIFICATION.md`.
