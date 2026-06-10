# Gestione degli stili — Memora Frontend

## Panoramica

Il sistema di stile è costruito su tre livelli sovrapposti. Per cambiare un colore o uno stile globale **tocchi sempre il livello più alto** e il cambiamento si propaga in automatico a tutto il resto.

```
frontend/src/assets/main.css        ← Layer 1: sorgente dei colori (CSS variables)
frontend/tailwind.config.js         ← Layer 2: mappa i colori a classi Tailwind
frontend/src/views/*.vue            ← Layer 3: template che usano le classi semantiche
```

---

## Layer 1 — CSS Custom Properties (`main.css`)

File: `frontend/src/assets/main.css`

È qui che vivono tutti i valori di colore. È il **punto di verità unico**: se vuoi cambiare un colore, cambi solo qui.

```css
:root {
  --color-primary:      #1B4965;   /* titoli, testo scuro */
  --color-accent:       #5FA8D3;   /* bottoni, link attivi */
  --color-accent-hover: #62B6CB;   /* hover bottoni */
  --color-border:       #62B6CB;   /* bordi, separatori */
  --color-page:         #BEE9E8;   /* sfondo pagina */
  --color-surface:      #CAE9FF;   /* card, pannelli, sidebar */
  --color-on-surface:   #1B4965;   /* testo scritto su surface */
  --color-text-primary: #1B4965;
  --color-text-muted:   #1B496599; /* primary al 60% di opacità */
}
```

### Dark mode

La dark mode si attiva aggiungendo la classe `.dark` sull'elemento `<html>`. Le stesse variabili vengono ridefinite con valori scuri:

```css
.dark {
  --color-page:         #0d1f2d;
  --color-surface:      #1B4965;
  --color-on-surface:   #CAE9FF;
  --color-text-primary: #CAE9FF;
  --color-text-muted:   #BEE9E8;
}
```

I componenti non sanno se sono in dark mode: usano sempre `var(--color-page)` e il browser si occupa di restituire il valore giusto.

---

## Layer 2 — Tailwind Theme (`tailwind.config.js`)

File: `frontend/tailwind.config.js`

Tailwind non conosce CSS variables di default. Questo file le espone come **token semantici** utilizzabili come classi utility standard.

```js
colors: {
  primary:        'var(--color-primary)',
  accent:         'var(--color-accent)',
  'accent-hover': 'var(--color-accent-hover)',
  border:         'var(--color-border)',
  page:           'var(--color-page)',
  surface:        'var(--color-surface)',
  'on-surface':   'var(--color-on-surface)',
  'text-primary': 'var(--color-text-primary)',
  'text-muted':   'var(--color-text-muted)',
}
```

Grazie a questa mappatura, Tailwind genera automaticamente tutte le varianti:

| Token       | Classi generate da Tailwind              |
|-------------|------------------------------------------|
| `primary`   | `bg-primary`, `text-primary`, `border-primary` |
| `accent`    | `bg-accent`, `text-accent`, `ring-accent`      |
| `page`      | `bg-page`                                |
| `surface`   | `bg-surface`, `text-surface`             |
| `on-surface`| `text-on-surface`                        |

---

## Layer 3 — Classi componente (`@layer components` in `main.css`)

Per evitare di ripetere lunghe catene di classi Tailwind, le combinazioni più usate sono estratte in **classi componente** con `@layer components`.

```css
@layer components {
  .btn-primary  { @apply bg-accent hover:bg-accent-hover text-white ... }
  .btn-outline  { @apply border border-accent text-accent ... }
  .btn-ghost    { @apply text-primary hover:bg-surface ... }
  .input-field  { @apply w-full border border-border rounded-md ... }
  .card         { @apply bg-white dark:bg-surface rounded-xl shadow-sm ... }
  .page-title   { @apply text-2xl font-bold text-primary ... }
  .page-subtitle{ @apply text-text-muted mt-1 ... }
}
```

### Riferimento rapido

| Classe          | Quando usarla                        |
|-----------------|--------------------------------------|
| `btn-primary`   | Azione principale (salva, login…)    |
| `btn-outline`   | Azione secondaria con bordo          |
| `btn-ghost`     | Azione terziaria / navigazione       |
| `input-field`   | Qualsiasi `<input>` o `<textarea>`   |
| `card`          | Card, pannelli, sezioni riquadrate   |
| `page-title`    | `<h2>` titolo di una pagina          |
| `page-subtitle` | Paragrafo descrittivo sotto il titolo|

---

## Come si usa nei template Vue

```html
<!-- GIUSTO: classi semantiche, zero hex -->
<div class="bg-page">
  <div class="card">
    <h2 class="page-title">{{ $t('dashboard.title') }}</h2>
    <p class="page-subtitle">{{ $t('dashboard.subtitle') }}</p>
    <button class="btn-primary">Salva</button>
    <input class="input-field" />
  </div>
</div>

<!-- SBAGLIATO: hex hard-coded, impossibile da manutenere -->
<div class="bg-[#BEE9E8]">
  <button class="bg-[#5FA8D3] hover:bg-[#62B6CB] text-white py-2 px-4 rounded-md">
    Salva
  </button>
</div>
```

---

## Come cambiare i colori dell'intera app

Modifica **solo** `frontend/src/assets/main.css`, blocco `:root`:

```css
:root {
  --color-primary: #2d6a4f;   /* era #1B4965 — ora verde scuro */
  --color-accent:  #52b788;   /* era #5FA8D3 — ora verde chiaro */
  /* tutto il resto si aggiorna da solo */
}
```

Nessun altro file va toccato.

---

## Colori con opacità (bg-accent/10, text-primary/50…)

Tailwind v3 non può calcolare l'opacità partendo da una CSS variable hex (`var(--color-accent)`).
Per i colori che usano modificatori di opacità, bisogna:

**1.** Definire anche i canali RGB in `main.css`:
```css
--color-accent-rgb: 95, 168, 211;   /* stesso valore di --color-accent in formato R,G,B */
```

**2.** Usare la sintassi a funzione in `tailwind.config.js`:
```js
accent: ({ opacityValue }) =>
  opacityValue !== undefined
    ? `rgba(var(--color-accent-rgb), ${opacityValue})`
    : 'var(--color-accent)',
```

Dopodiché `bg-accent/10`, `bg-accent/20`, `text-accent/70` funzionano normalmente.

---

## Come aggiungere un nuovo colore

**1.** Aggiungi la variabile in `main.css`:
```css
:root {
  --color-warning: #f59e0b;
}
.dark {
  --color-warning: #fbbf24;
}
```

**2.** Registrala in `tailwind.config.js`:
```js
colors: {
  warning: 'var(--color-warning)',
}
```

**3.** Usala nei template:
```html
<span class="text-warning">Attenzione</span>
```

---

## Come aggiungere una nuova classe componente

Aggiungila nel blocco `@layer components` di `main.css`:

```css
@layer components {
  .badge-success {
    @apply bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full;
  }
}
```

Poi usala ovunque: `<span class="badge-success">Completato</span>`
