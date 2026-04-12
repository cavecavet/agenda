# Redisseny Visual Agenda Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar el redisseny visual "Marí Refinat" a `association/index.html` sense canviar funcionalitat ni dades.

**Architecture:** Tot el codi viu en un únic fitxer HTML autocontingut (`association/index.html`) amb CSS embedded i JS inline. Els canvis es divideixen en 4 tasques seqüencials: (1) cards de franja, (2) header, (3) capçaleres de dia + navegació setmanal, (4) acabats (fons, barra, modal).

**Tech Stack:** HTML/CSS/JS vanilla, Supabase JS v2 (no es toca), localStorage.

---

## Context: funcions clau

- `slotCard(s)` — línia ~795: genera l'HTML de cada card de franja. **Cal modificar la plantilla HTML i afegir `fmtDuration()`.**
- `renderWeek(mon)` — línia ~757: genera les seccions per dia. **Cal modificar `.day-header` per afegir la píndola "Avui".**
- `<header>` HTML — línia ~513: capçalera estàtica. **Cal afegir el SVG d'onada i canviar el subtítol.**
- CSS `<style>` — línies 8–488: tot el CSS. **Cal modificar classes existents i afegir-ne de noves.**

---

## Task 1: Cards de franja — CSS i JS

Canvi principal: les cards passen de grid 2 columnes a llista vertical amb layout flex horitzontal (columna hora | divisor | info).

**Files:**
- Modify: `association/index.html` (CSS `.slots-grid`, `.slot-card` i classes relacionades; funció JS `slotCard()`)

- [ ] **Step 1: Substituir el CSS de `.slots-grid`**

Troba el bloc:
```css
.slots-grid {
    padding: 0.6rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(155px, 1fr));
    gap: 0.5rem;
}
```
Substitueix-lo per:
```css
.slots-grid {
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}
```

- [ ] **Step 2: Substituir el CSS de `.slot-card` i totes les sub-classes**

Troba el bloc que comença amb `.slot-card {` i acaba just abans de `/* ---- MODAL OVERLAY ---- */` (aproximadament línies 149–221). Substitueix **tot** aquest bloc per:

```css
/* ---- SLOT CARD ---- */
.slot-card {
    border: 1.5px solid #e4eff5;
    border-radius: 10px;
    padding: 0.6rem 0.75rem;
    cursor: pointer;
    transition: all 0.15s;
    user-select: none;
    display: flex;
    align-items: center;
    gap: 0.65rem;
    background: white;
    box-shadow: 0 2px 6px rgba(0,101,128,0.06);
}
.slot-card:hover:not(.full) {
    border-color: var(--primary);
    box-shadow: 0 2px 10px rgba(14,165,233,0.15);
    transform: translateY(-1px);
}
.slot-card.full {
    opacity: 0.5;
    cursor: default;
    background: var(--gray-50);
}
.slot-card.mine {
    border-color: var(--accent-teal);
    background: linear-gradient(135deg, #f0fdf8 0%, #e8f7f3 100%);
    box-shadow: 0 2px 8px rgba(6, 167, 125, 0.12);
}
.slot-time-col {
    text-align: center;
    min-width: 44px;
    flex-shrink: 0;
}
.slot-time {
    font-size: 0.78rem;
    font-weight: 800;
    color: #0077a8;
    line-height: 1;
}
.slot-dur {
    font-size: 0.58rem;
    color: var(--gray-400);
    margin-top: 2px;
}
.slot-divider {
    width: 1px;
    background: #e4eff5;
    height: 30px;
    flex-shrink: 0;
}
.slot-info {
    flex: 1;
    min-width: 0;
}
.slot-activity {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--gray-800);
}
.slot-bar-row {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    margin-top: 0.3rem;
}
.bar-track {
    flex: 1;
    height: 5px;
    background: var(--gray-200);
    border-radius: 3px;
    overflow: hidden;
}
.bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s;
    background: var(--primary);
}
.bar-fill.warn  { background: var(--warning); }
.bar-fill.full  { background: var(--danger); }
.bar-count {
    font-size: 0.65rem;
    color: var(--gray-600);
    white-space: nowrap;
}
.bar-count.full-count { color: var(--danger); font-weight: 600; }
.slot-mine-badge {
    font-size: 0.65rem;
    color: var(--success);
    font-weight: 700;
    margin-top: 0.2rem;
}
```

- [ ] **Step 3: Afegir la funció `fmtDuration()` al JS**

Just abans de la funció `slotCard(s)` (~línia 795), afegeix:

```js
function fmtDuration(ini, fi) {
    const [h1, m1] = ini.split(':').map(Number);
    const [h2, m2] = fi.split(':').map(Number);
    const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    return mins >= 60 ? `${Math.floor(mins/60)}h${mins%60 ? (mins%60)+'m' : ''}` : `${mins}m`;
}
```

- [ ] **Step 4: Substituir la funció `slotCard(s)`**

Substitueix tota la funció `slotCard(s)` (línies 795–817) per:

```js
function slotCard(s) {
    const ins  = s.inscripciones || [];
    const cnt  = ins.length;
    const max  = s.plazas_max;
    const pct  = Math.min(100, Math.round(cnt / max * 100));
    const fill = pct >= 100 ? 'full' : pct >= 75 ? 'warn' : '';
    const myName = (localStorage.getItem('myName') || '').trim().toLowerCase();
    const isMine = myName && ins.some(e => e.nombre.trim().toLowerCase() === myName);
    const timeColor = cnt >= max ? 'color:var(--danger)' : '';
    const dur = fmtDuration(s.hora_inicio, s.hora_fin);

    return `
    <div class="slot-card ${cnt >= max && !isMine ? 'full' : ''} ${isMine ? 'mine' : ''}"
         onclick="openSlot('${s.id}')">
        <div class="slot-time-col">
            <div class="slot-time" style="${timeColor}">${s.hora_inicio.slice(0,5)}</div>
            <div class="slot-dur">${dur}</div>
        </div>
        <div class="slot-divider"></div>
        <div class="slot-info">
            <div class="slot-activity">${s.actividad}</div>
            <div class="slot-bar-row">
                <div class="bar-track"><div class="bar-fill ${fill}" style="width:${pct}%"></div></div>
                <span class="bar-count ${cnt >= max ? 'full-count' : ''}">${cnt}/${max}</span>
            </div>
            ${isMine ? '<div class="slot-mine-badge">✓ Apuntat/ada</div>' : ''}
        </div>
    </div>`;
}
```

> Nota: s'elimina `.slot-names` (llista de noms a la card) — el modal ja mostra tots els noms.

- [ ] **Step 5: Verificació visual**

Obre `association/index.html` al navegador (o recarrega si ja estava obert). Les cards han de mostrar-se en llista vertical amb la columna d'hora a l'esquerra. Si Supabase no està configurat, apareixerà el missatge de configuració — és correcte, els canvis visuals s'aplicaran igualment als elements estàtics.

- [ ] **Step 6: Commit**

```bash
git add association/index.html
git commit -m "redesign: slot cards to vertical flex layout with time column"
```

---

## Task 2: Header — onada SVG i estil

**Files:**
- Modify: `association/index.html` (CSS `header`, HTML `<header>`)

- [ ] **Step 1: Actualitzar el CSS del header**

Troba el bloc `/* ---- HEADER ---- */` i substitueix **tot** fins al `/* ---- WEEK NAV ---- */` per:

```css
/* ---- HEADER ---- */
header {
    background: linear-gradient(160deg, #0077a8 0%, #0096c7 45%, #05967d 100%);
    color: white;
    padding: 1rem 1.25rem 2.4rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    position: relative;
    overflow: hidden;
}
.header-title { font-size: 1.1rem; font-weight: 800; letter-spacing: -0.01em; }
.header-sub   { font-size: 0.72rem; opacity: 0.8; margin-top: 0.15rem; font-style: normal; letter-spacing: normal; }
.header-icon  { font-size: 1.8rem; }
.header-badge {
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.28);
    border-radius: 20px;
    padding: 0.2rem 0.6rem;
    font-size: 0.62rem;
    font-weight: 600;
    white-space: nowrap;
}
.header-wave {
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 28px;
    pointer-events: none;
}
```

- [ ] **Step 2: Eliminar l'animació `float` i el pseudo-element `header::before`**

Elimina completament els blocs CSS:
```css
header::before {
    content: '🌊';
    ...
}
@keyframes float {
    ...
}
```

- [ ] **Step 3: Substituir el HTML del `<header>`**

Troba el bloc:
```html
<!-- ═══ HEADER ═══ -->
<header>
    <div>
        <div class="header-title" id="hTitle">Agenda Comunitaria</div>
        <div class="header-sub"  id="hSub">🌊 Activitats · Franges horàries 🌊</div>
    </div>
    <div class="header-icon">🐚</div>
</header>
```

Substitueix-lo per:
```html
<!-- ═══ HEADER ═══ -->
<header>
    <div>
        <div class="header-title" id="hTitle">Agenda Comunitaria</div>
        <div class="header-sub">Activitats · Franges horàries</div>
    </div>
    <div class="header-badge" id="headerBadge"></div>
    <svg class="header-wave" viewBox="0 0 400 28" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,14 C60,28 120,0 180,14 C240,28 300,0 360,14 C380,19 392,22 400,22 L400,28 L0,28 Z" fill="white"/>
    </svg>
</header>
```

- [ ] **Step 4: Actualitzar el JS d'inicialització per mostrar el badge**

A la funció `DOMContentLoaded`, just després de la línia:
```js
document.getElementById('hTitle').textContent = CONFIG.nombreAsociacion;
```
Afegeix:
```js
const M = ['Gen','Feb','Mar','Abr','Mai','Jun','Jul','Ago','Set','Oct','Nov','Des'];
const now = new Date();
document.getElementById('headerBadge').textContent = `${M[now.getMonth()]} ${now.getFullYear()}`;
```

- [ ] **Step 5: Verificació visual**

Recarrega. El header ha de mostrar l'onada a la part inferior i la píndola amb mes/any a la dreta.

- [ ] **Step 6: Commit**

```bash
git add association/index.html
git commit -m "redesign: header with wave SVG and month badge"
```

---

## Task 3: Capçaleres de dia i navegació setmanal

**Files:**
- Modify: `association/index.html` (CSS `.day-section`, `.day-header`, `.week-nav`; JS `renderWeek()`)

- [ ] **Step 1: Actualitzar el CSS de `.day-section` i `.day-header`**

Troba el bloc `/* ---- DAY SECTION ---- */` i substitueix fins a `/* ---- SLOT CARD ---- */` per:

```css
/* ---- DAY SECTION ---- */
.day-section {
    background: white;
    border-radius: 14px;
    margin-bottom: 0.65rem;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,101,128,0.07);
}
.day-header {
    background: white;
    padding: 0.55rem 0.85rem;
    font-weight: 700;
    font-size: 0.82rem;
    color: var(--gray-600);
    text-transform: capitalize;
    border-bottom: 1px solid var(--gray-100);
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.day-header.today {
    background: linear-gradient(90deg, #e6f7fd 0%, #f0fdf8 100%);
    color: var(--primary-dark);
    border-left: 3px solid var(--primary);
}
.today-pill {
    background: var(--primary);
    color: white;
    border-radius: 20px;
    padding: 0.12rem 0.5rem;
    font-size: 0.62rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}
```

- [ ] **Step 2: Actualitzar el CSS de `.week-nav`**

Troba el bloc `/* ---- WEEK NAV ---- */` i substitueix fins a `/* ---- MAIN ---- */` per:

```css
/* ---- WEEK NAV ---- */
.week-nav {
    background: white;
    padding: 0.6rem 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--gray-100);
    box-shadow: 0 1px 4px rgba(0,101,128,0.06);
    position: sticky;
    top: 0;
    z-index: 10;
}
.week-nav button {
    background: var(--gray-100);
    border: none;
    border-radius: 20px;
    padding: 0.35rem 0.8rem;
    cursor: pointer;
    color: var(--primary);
    font-size: 0.82rem;
    font-weight: 600;
    transition: background 0.15s;
    font-family: inherit;
}
.week-nav button:hover { background: var(--gray-200); }
.week-label { font-weight: 700; font-size: 0.88rem; color: var(--gray-800); }
```

- [ ] **Step 3: Actualitzar el fons de `main`**

Troba el bloc `/* ---- MAIN ---- */`:
```css
main {
    max-width: 960px;
    margin: 0 auto;
    padding: 1rem;
}
```
Substitueix-lo per:
```css
main {
    max-width: 960px;
    margin: 0 auto;
    padding: 0.75rem;
    background: #f2f8fb;
    min-height: calc(100vh - 140px);
}
```

- [ ] **Step 4: Modificar `renderWeek()` per afegir la píndola "Avui"**

Dins la funció `renderWeek(mon)`, troba la línia que genera el `.day-header`:
```js
html += `
<div class="day-section">
    <div class="day-header ${isToday ? 'today' : ''}">
        ${isToday ? '📍 ' : ''}${fmtDate(ds)}
    </div>
    <div class="slots-grid">
        ${daySlots.map(slotCard).join('')}
    </div>
</div>`;
```
Substitueix-la per:
```js
html += `
<div class="day-section">
    <div class="day-header ${isToday ? 'today' : ''}">
        <span>${fmtDate(ds)}</span>
        ${isToday ? '<span class="today-pill">Avui</span>' : ''}
    </div>
    <div class="slots-grid">
        ${daySlots.map(slotCard).join('')}
    </div>
</div>`;
```

- [ ] **Step 5: Verificació visual**

Recarrega. La setmana actual ha de mostrar la píndola "Avui" al dia d'avui, els botons de navegació han de ser arrodonits i el fons del contingut lleugerament blau.

- [ ] **Step 6: Commit**

```bash
git add association/index.html
git commit -m "redesign: day headers with today pill, rounded week nav, tinted bg"
```

---

## Task 4: Acabats — modal i eliminació de residus

**Files:**
- Modify: `association/index.html` (CSS `.modal`, eliminació de CSS obsolet del tema marí)

- [ ] **Step 1: Actualitzar el CSS del modal**

Troba el bloc `/* ---- MODAL ---- */`:
```css
.modal {
    background: white;
    border-radius: 18px 18px 0 0;
    ...
}
```
Canvia `border-radius: 18px 18px 0 0;` a `border-radius: 20px 20px 0 0;` i afegeix `box-shadow: 0 -4px 24px rgba(0,101,128,0.12);` a la regla.

El `@media (min-width: 600px)` ja sobreescriu el border-radius a `16px` — deixa'l com està.

- [ ] **Step 2: Eliminar CSS del tema marí obsolet**

Elimina el bloc sencer `/* ════ TEMA MARINO ════ */` (línies ~408–487) que inclou `.bubble`, `@keyframes rise`, `.wave-animation`, `@keyframes wave`, i les sobreescriptures de `.slot-card`, `.modal` i `.overlay`. Aquests estils queden sobreescrits pels nous i creen conflictes.

> ⚠️ Assegura't de NO eliminar les classes funcionals (`.check-label`, `.fab-admin`, `.config-warn`, etc.)

- [ ] **Step 3: Verificació final**

Obre l'app al navegador (mòbil o DevTools en mode mòbil). Comprova:
- [ ] Header amb onada i badge de mes
- [ ] Botons de navegació arrodonits
- [ ] Fons blau clar al contingut
- [ ] Cards en llista vertical amb columna d'hora
- [ ] Dia d'avui amb píndola "Avui"
- [ ] Barra de places visible (5px)
- [ ] Modal amb corners arrodonits (20px)
- [ ] Cap error a la consola del navegador

- [ ] **Step 4: Commit final**

```bash
git add association/index.html
git commit -m "redesign: modal polish and remove obsolete marine theme CSS"
```
