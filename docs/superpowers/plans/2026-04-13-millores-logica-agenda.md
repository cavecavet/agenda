# Millores de lògica de l'agenda — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cinc millores a l'agenda Cave Cavet: desactivar WhatsApp, notes per dia editables in-line, divisió matí/tarda automàtica amb modal de torn sencer, durada de franja configurable, i navegació automàtica a la primera setmana amb activitats.

**Architecture:** Tot el codi viu a `association/js/app.js` (lògica) i `association/css/style.css` (estils). S'afegeix un nou overlay al HTML i una nova taula `notes_dia` a Supabase. No hi ha build step — els canvis es despleguen via `git push`.

**Tech Stack:** Vanilla JS, Supabase JS v2, CSS custom, GitHub Pages + GitHub Actions

---

## Fitxers afectats

| Fitxer | Rol |
|--------|-----|
| `association/js/app.js` | Tota la lògica (modificar) |
| `association/css/style.css` | Estils nous (modificar) |
| `association/index.html` | Nou overlay torn sencer (modificar) |
| `supabase_setup.sql` | Nova taula notes_dia (modificar) |

---

## Task 1: Desactivar WhatsApp + nova variable global adminActiu

**Files:**
- Modify: `association/js/app.js:1-5` (globals) i `association/js/app.js:242` (doSignup)

- [ ] **Step 1: Afegir variables globals**

Al principi de `app.js`, les línies 1-5 actuals són:
```js
// ── Estado ──────────────────────────────────────
let sb;           // supabase client
let weekOffset = 0;
let slots = [];
let currentSlotId = null;
```

Substituir per:
```js
// ── Estado ──────────────────────────────────────
let sb;               // supabase client
let weekOffset = 0;
let slots = [];
let notesMap = {};    // { fecha: nota } per la setmana visible
let currentSlotId = null;
let adminActiu = false;
```

- [ ] **Step 2: Comentar la crida a notifyWhatsApp**

A `app.js` línia 242, dins `doSignup()`, canviar:
```js
    localStorage.setItem('myName', name);
    notifyWhatsApp(name, s);

    await loadWeek();
```
Per:
```js
    localStorage.setItem('myName', name);
    // notifyWhatsApp(name, s);  // desactivat temporalment

    await loadWeek();
```

- [ ] **Step 3: Activar adminActiu quan la contrasenya és correcta**

A `checkAdminPwd()` (línia 294), canviar:
```js
    if (hashHex === CONFIG.adminPasswordHash) {
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
    } else {
```
Per:
```js
    if (hashHex === CONFIG.adminPasswordHash) {
        adminActiu = true;
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        renderWeek(getMonday(new Date()));
    } else {
```

> Nota: el `renderWeek` extra fa que les notes del dia es tornin editables immediatament sense recarregar les dades.

- [ ] **Step 4: Resetar adminActiu quan es tanca el panell**

A `openAdmin()` (línia 280), afegir `adminActiu = false;` i tornar a renderitzar:
```js
function openAdmin() {
    adminActiu = false;
    document.getElementById('adminLogin').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('adminPwd').value = '';
    document.getElementById('adminLoginErr').textContent = '';
    document.getElementById('adminOverlay').classList.add('open');
}
```

- [ ] **Step 5: Verificar manualment**

Obre `association/index2.html` al navegador. Comprova:
- Apuntar-se a una franja **no** genera cap missatge de WhatsApp (no hi ha crida de xarxa a callmebot.com a les Dev Tools → Network)
- El botó Admin → contrasenya correcta → `adminActiu` és `true` a la consola: `console.log(adminActiu)`

- [ ] **Step 6: Commit**
```bash
git add association/js/app.js
git commit -m "feat: disable whatsapp, add adminActiu global"
```

---

## Task 2: Taula notes_dia a Supabase + càrrega a loadWeek

**Files:**
- Modify: `supabase_setup.sql` (afegir taula)
- Modify: `association/js/app.js:64-94` (loadWeek)

- [ ] **Step 1: Afegir la taula a supabase_setup.sql**

Al final del fitxer `supabase_setup.sql`, afegir:
```sql
-- ══════════════════════════════════════════════════════════
-- Notes per dia (descripcions d'event editables per l'admin)
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notes_dia (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_agenda text        NOT NULL,
    fecha       date        NOT NULL,
    nota        text        NOT NULL DEFAULT '',
    created_at  timestamptz DEFAULT now(),
    UNIQUE(tipo_agenda, fecha)
);

ALTER TABLE notes_dia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes_dia_select" ON notes_dia FOR SELECT USING (true);
CREATE POLICY "notes_dia_insert" ON notes_dia FOR INSERT WITH CHECK (true);
CREATE POLICY "notes_dia_update" ON notes_dia FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "notes_dia_delete" ON notes_dia FOR DELETE USING (true);
```

- [ ] **Step 2: Executar el SQL a Supabase**

Ves a **supabase.com → el teu projecte → SQL Editor → New query**, enganxa el bloc SQL de dalt i clica **Run**. Ha de dir "Success".

- [ ] **Step 3: Modificar loadWeek per carregar notes en paral·lel**

La funció `loadWeek()` actual (línies 64-94) fa una sola consulta. Substituir el cos sencer per:

```js
async function loadWeek() {
    const mon = getMonday(new Date());
    mon.setDate(mon.getDate() + weekOffset * 7);
    const sun = new Date(mon); sun.setDate(sun.getDate() + 6);

    const M = ['gen','feb','mar','abr','mai','jun','jul','ago','set','oct','nov','des'];
    const m1 = mon.getDate() + ' ' + M[mon.getMonth()];
    const m2 = sun.getDate() + ' ' + M[sun.getMonth()] + ' ' + sun.getFullYear();
    document.getElementById('weekLabel').textContent = `${m1} – ${m2}`;

    document.getElementById('mainContent').innerHTML = '<div class="loading">Carregant franges…</div>';

    const [franjesRes, notesRes] = await Promise.all([
        sb.from('franjas')
            .select('*, inscripciones(id, nombre, created_at)')
            .eq('tipo_agenda', CONFIG.tipoAgenda)
            .gte('fecha', iso(mon))
            .lte('fecha', iso(sun))
            .order('fecha')
            .order('hora_inicio'),
        sb.from('notes_dia')
            .select('fecha, nota')
            .eq('tipo_agenda', CONFIG.tipoAgenda)
            .gte('fecha', iso(mon))
            .lte('fecha', iso(sun))
    ]);

    if (franjesRes.error) {
        document.getElementById('mainContent').innerHTML = `
            <div class="config-warn">Error carregant dades: ${franjesRes.error.message}<br>
            Comprova la configuració de Supabase i les polítiques RLS.</div>`;
        return;
    }

    slots = franjesRes.data || [];
    notesMap = {};
    (notesRes.data || []).forEach(n => { notesMap[n.fecha] = n.nota; });
    renderWeek(mon);
}
```

- [ ] **Step 4: Verificar manualment**

Obre `index2.html`. Obre les Dev Tools → Network. Recarrega. Has de veure dues crides a Supabase: una a `franjas` i una a `notes_dia`. Ambdues han de retornar 200.

- [ ] **Step 5: Commit**
```bash
git add supabase_setup.sql association/js/app.js
git commit -m "feat: add notes_dia table and load notes in loadWeek"
```

---

## Task 3: Divisió matí/tarda + renderWeek amb pestanyes

**Files:**
- Modify: `association/js/app.js:96-133` (renderWeek + helpers nous)
- Modify: `association/css/style.css` (estils nous per pestanyes i nota del dia)

- [ ] **Step 1: Afegir helpers timeToMins i splitShifts just abans de renderWeek**

Inserir a `app.js` just abans de `function renderWeek(mon)` (línia 96):

```js
// ── Torn matí/tarda ───────────────────────────────
function timeToMins(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function splitShifts(daySlots) {
    // Detecta el primer gap >60 min entre franges consecutives
    for (let i = 1; i < daySlots.length; i++) {
        const endPrev  = timeToMins(daySlots[i-1].hora_fin);
        const startCur = timeToMins(daySlots[i].hora_inicio);
        if (startCur - endPrev > 60) {
            return { mati: daySlots.slice(0, i), tarda: daySlots.slice(i) };
        }
    }
    return { mati: daySlots, tarda: [] };
}
```

- [ ] **Step 2: Reescriure renderWeek**

Substituir la funció `renderWeek(mon)` completa (línies 96-133) per:

```js
function renderWeek(mon) {
    const today = iso(new Date());
    const cont  = document.getElementById('mainContent');

    if (!slots.length) {
        cont.innerHTML = `
            <div class="empty-state">
                <div class="icon">🪸</div>
                <div style="font-weight:600;margin-bottom:0.25rem">No hi ha franges aquesta setmana</div>
                <div>Usa el panell Admin per crear les franges horàries</div>
            </div>`;
        return;
    }

    const byDate = {};
    slots.forEach(s => { (byDate[s.fecha] = byDate[s.fecha] || []).push(s); });

    let html = '';
    for (let i = 0; i < 7; i++) {
        const d = new Date(mon); d.setDate(d.getDate() + i);
        const ds = iso(d);
        const daySlots = byDate[ds];
        if (!daySlots) continue;

        const isToday = ds === today;
        const nota    = notesMap[ds] || '';
        const { mati, tarda } = splitShifts(daySlots);
        const twoShifts = tarda.length > 0;

        const notaHtml = (nota || adminActiu)
            ? `<div class="day-note ${adminActiu ? 'editable' : ''}"
                    data-fecha="${ds}"
                    contenteditable="${adminActiu ? 'true' : 'false'}"
                    data-placeholder="Afegeix una descripció de l'event..."
                    onblur="saveNote('${ds}', this.textContent.trim())"
               >${nota}</div>`
            : '';

        const shiftBtns = twoShifts
            ? `<div class="shift-tabs">
                 <button class="shift-tab active" onclick="switchShift(this,'${ds}','mati')">☀️ Matí (${mati.length})</button>
                 <button class="shift-tab"        onclick="switchShift(this,'${ds}','tarda')">🌤 Tarda (${tarda.length})</button>
               </div>`
            : '';

        const matiGrid  = renderShiftGrid(mati,  ds, 'mati',  true);
        const tardaGrid = twoShifts ? renderShiftGrid(tarda, ds, 'tarda', false) : '';

        html += `
        <div class="day-section">
            <div class="day-header ${isToday ? 'today' : ''}">
                <span>${fmtDate(ds)}</span>
                ${isToday ? '<span class="today-pill">Avui</span>' : ''}
            </div>
            ${notaHtml}
            ${shiftBtns}
            ${matiGrid}
            ${tardaGrid}
        </div>`;
    }
    cont.innerHTML = html;
}
```

- [ ] **Step 3: Afegir renderShiftGrid i switchShift**

Afegir just després de `renderWeek`:

```js
function renderShiftGrid(shiftSlots, fecha, shiftName, visible) {
    const myName = (localStorage.getItem('myName') || '').trim().toLowerCase();
    const allFull = shiftSlots.every(s => {
        const ins = s.inscripciones || [];
        return ins.length >= s.plazas_max && !ins.some(e => e.nombre.trim().toLowerCase() === myName);
    });
    const label = shiftName === 'mati' ? 'matí' : 'tarda';

    return `<div class="slots-grid" data-fecha="${fecha}" data-shift="${shiftName}" ${visible ? '' : 'style="display:none"'}>
        ${shiftSlots.map(slotCard).join('')}
        <button class="btn-torn-sencer" ${allFull ? 'disabled' : ''}
                onclick="openTornSencer('${fecha}','${shiftName}')">
            + Torn sencer de ${label}
        </button>
    </div>`;
}

function switchShift(btn, fecha, shift) {
    // Actualitza les pestanyes actives
    const section = btn.closest('.day-section');
    section.querySelectorAll('.shift-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // Mostra/amaga els grids
    section.querySelectorAll('.slots-grid').forEach(g => {
        g.style.display = g.dataset.shift === shift ? '' : 'none';
    });
}
```

- [ ] **Step 4: Afegir estils a style.css**

Afegir al final de `association/css/style.css`:

```css
/* ---- SHIFT TABS ---- */
.shift-tabs {
    display: flex;
    border-bottom: 1px solid var(--gray-100);
    background: white;
}
.shift-tab {
    flex: 1;
    padding: 0.45rem 0.5rem;
    font-size: 0.78rem;
    font-weight: 600;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--gray-400);
    cursor: pointer;
    font-family: inherit;
    transition: color 0.15s, border-color 0.15s;
}
.shift-tab.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
}

/* ---- DAY NOTE ---- */
.day-note {
    padding: 0.4rem 0.85rem;
    font-size: 0.78rem;
    color: var(--gray-600);
    font-style: italic;
    background: var(--gray-50);
    border-bottom: 1px solid var(--gray-100);
    min-height: 1.6rem;
}
.day-note.editable {
    cursor: text;
    outline: none;
    background: #fffbeb;
    border-bottom-color: #fbbf24;
}
.day-note.editable:empty::before {
    content: attr(data-placeholder);
    color: var(--gray-300);
    font-style: italic;
    pointer-events: none;
}

/* ---- BOTÓ TORN SENCER ---- */
.btn-torn-sencer {
    width: 100%;
    background: var(--gray-50);
    border: 1.5px dashed var(--primary);
    border-radius: 8px;
    padding: 0.45rem;
    font-size: 0.78rem;
    color: var(--primary);
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    margin-top: 0.1rem;
    transition: background 0.15s;
}
.btn-torn-sencer:hover:not(:disabled) { background: var(--gray-100); }
.btn-torn-sencer:disabled { opacity: 0.4; cursor: default; border-style: solid; }
```

- [ ] **Step 5: Verificar manualment**

Obre `index2.html`. Comprova:
- Si hi ha franges de matí i tarda (gap >1h), apareixen dues pestanyes i pots canviar entre elles
- Si totes les franges són contínues, no apareixen pestanyes
- A cada torn apareix el botó "Torn sencer de matí/tarda"
- Quan l'admin entra la contrasenya, les capçaleres dels dies mostren la zona de nota (groga si buida)

- [ ] **Step 6: Commit**
```bash
git add association/js/app.js association/css/style.css
git commit -m "feat: morning/afternoon tabs with auto-detection and shift button"
```

---

## Task 4: Desar notes del dia (in-line edit)

**Files:**
- Modify: `association/js/app.js` (nova funció saveNote)

- [ ] **Step 1: Afegir la funció saveNote**

Afegir just després de `switchShift` (a la secció de funcions de torna):

```js
async function saveNote(fecha, text) {
    if (!adminActiu) return;
    if (text === (notesMap[fecha] || '')) return; // sense canvis
    const nota = text;
    const { error } = await sb.from('notes_dia').upsert(
        { tipo_agenda: CONFIG.tipoAgenda, fecha, nota },
        { onConflict: 'tipo_agenda,fecha' }
    );
    if (error) {
        alert('Error desant la nota: ' + error.message);
        return;
    }
    notesMap[fecha] = nota;
}
```

- [ ] **Step 2: Verificar manualment**

Obre `index2.html`. Entra com a admin. Fes clic sobre la zona groga de la nota d'un dia. Escriu "🎭 Prova de nota". Fes clic fora del camp (blur). Obre Supabase → Table Editor → `notes_dia` → has de veure la fila nova. Recarrega la pàgina → la nota ha de continuar apareixent.

- [ ] **Step 3: Commit**
```bash
git add association/js/app.js
git commit -m "feat: inline day note editing with upsert to notes_dia"
```

---

## Task 5: Modal torn sencer

**Files:**
- Modify: `association/index.html` (nou overlay)
- Modify: `association/js/app.js` (openTornSencer + doTornSencer)

- [ ] **Step 1: Afegir overlay torn sencer a index.html**

Just abans de `<script src="js/app.js"></script>` al final del `<body>`, afegir:

```html
<!-- ════════════════════════════════════════
     MODAL: TORN SENCER
     ════════════════════════════════════════ -->
<div class="overlay" id="tornOverlay">
    <div class="modal">
        <div class="modal-head">
            <div class="modal-title" id="tTitle"></div>
            <button class="close-btn" onclick="closeOverlay('tornOverlay')">✕</button>
        </div>
        <div class="modal-sub" id="tSub"></div>

        <div class="enrolled-title">Franges incloses</div>
        <ul class="enrolled-list" id="tornList"></ul>

        <hr class="divider">
        <div id="tornAlert"></div>

        <div class="form-group">
            <label class="form-label" for="tornNameInput">El teu nom</label>
            <input type="text" class="form-input" id="tornNameInput"
                   placeholder="Escriu el teu nom complet" autocomplete="name">
        </div>
        <div class="btn-row">
            <button class="btn btn-primary btn-full" id="tornBtn" onclick="doTornSencer()">✓ Apuntar-me a totes</button>
            <button class="btn btn-secondary" onclick="closeOverlay('tornOverlay')">Cancel·la</button>
        </div>
    </div>
</div>
```

- [ ] **Step 2: Afegir variables globals per al torn**

Al bloc de globals a l'inici de `app.js`, afegir:
```js
let tornSlots  = [];   // franges del torn actual obert
```

El bloc globals complet queda:
```js
// ── Estado ──────────────────────────────────────
let sb;
let weekOffset = 0;
let slots = [];
let notesMap = {};
let currentSlotId = null;
let adminActiu = false;
let tornSlots  = [];
```

- [ ] **Step 3: Afegir openTornSencer a app.js**

Afegir a la secció de modals (just després de `doUnsignup`):

```js
// ── Modal torn sencer ─────────────────────────────
function openTornSencer(fecha, shiftName) {
    const daySlots = slots.filter(s => s.fecha === fecha);
    const { mati, tarda } = splitShifts(daySlots);
    tornSlots = shiftName === 'mati' ? mati : tarda;

    const label  = shiftName === 'mati' ? '☀️ Torn de matí sencer' : '🌤 Torn de tarda sencer';
    document.getElementById('tTitle').textContent = label;
    document.getElementById('tSub').textContent   = fmtDate(fecha);

    const myName = (localStorage.getItem('myName') || '').trim().toLowerCase();
    const ul = document.getElementById('tornList');
    ul.innerHTML = tornSlots.map(s => {
        const ins      = s.inscripciones || [];
        const ple      = ins.length >= s.plazas_max;
        const jaApunt  = myName && ins.some(e => e.nombre.trim().toLowerCase() === myName);
        const badge    = jaApunt ? ' <span style="color:var(--success);font-weight:700">✓ ja apuntat/ada</span>'
                       : ple     ? ' <span style="color:var(--danger);font-weight:600">ple</span>'
                       :           '';
        return `<li>
            <div class="avatar">${s.hora_inicio.slice(0,5)}</div>
            ${s.actividad} · ${ins.length}/${s.plazas_max}${badge}
        </li>`;
    }).join('');

    document.getElementById('tornAlert').innerHTML = '';
    const savedName = localStorage.getItem('myName') || '';
    document.getElementById('tornNameInput').value = savedName;

    document.getElementById('tornOverlay').classList.add('open');
    setTimeout(() => document.getElementById('tornNameInput').focus(), 100);
}

async function doTornSencer() {
    const name = document.getElementById('tornNameInput').value.trim();
    if (!name) { showAlert('tornAlert', 'Escriu el teu nom', 'error'); return; }

    const myNameLow = name.toLowerCase();
    const aInscriure = tornSlots.filter(s => {
        const ins = s.inscripciones || [];
        const ple      = ins.length >= s.plazas_max;
        const jaApunt  = ins.some(e => e.nombre.trim().toLowerCase() === myNameLow);
        return !ple && !jaApunt;
    });

    if (!aInscriure.length) {
        showAlert('tornAlert', 'Ja estàs apuntat/ada a totes les franges disponibles', 'error');
        return;
    }

    const btn = document.getElementById('tornBtn');
    btn.disabled = true; btn.textContent = 'Apuntant…';

    const rows = aInscriure.map(s => ({
        franja_id:   s.id,
        tipo_agenda: CONFIG.tipoAgenda,
        nombre:      name
    }));

    const { error } = await sb.from('inscripciones').insert(rows);
    if (error) {
        showAlert('tornAlert', 'Error: ' + error.message, 'error');
        btn.disabled = false; btn.textContent = '✓ Apuntar-me a totes';
        return;
    }

    localStorage.setItem('myName', name);
    await loadWeek();
    closeOverlay('tornOverlay');
}
```

- [ ] **Step 4: Verificar manualment**

Obre `index2.html` amb franges de matí i tarda. Clica "Torn sencer de matí". Ha d'aparèixer el modal amb la llista de franges. Introdueix un nom i clica "Apuntar-me a totes". Tanca el modal. Les franges del matí han de mostrar el nom apuntat. Obre Supabase → `inscripciones` per confirmar les files.

- [ ] **Step 5: Commit**
```bash
git add association/index.html association/js/app.js
git commit -m "feat: add torn sencer modal with bulk inscription"
```

---

## Task 6: Durada configurable + navegació automàtica

**Files:**
- Modify: `association/index.html` (radio group durada al formulari admin)
- Modify: `association/js/app.js` (createSlots + DOMContentLoaded)

- [ ] **Step 1: Afegir radio group de durada al formulari admin a index.html**

Al panell admin, just abans del botó "Crear franges", hi ha el div del checkbox `aNoSunday`. Afegir un nou `form-group` just **després** del `form-row` que conté Activitat/Places:

```html
<div class="form-group">
    <label class="form-label">Durada per franja</label>
    <div class="duration-options">
        <label class="duration-option">
            <input type="radio" name="aDuration" value="30" checked> 30'
        </label>
        <label class="duration-option">
            <input type="radio" name="aDuration" value="60"> 1h
        </label>
        <label class="duration-option">
            <input type="radio" name="aDuration" value="120"> 2h
        </label>
    </div>
</div>
```

- [ ] **Step 2: Afegir estils per als radios a style.css**

Afegir al final de `association/css/style.css`:

```css
/* ---- DURATION OPTIONS ---- */
.duration-options {
    display: flex;
    gap: 0.75rem;
}
.duration-option {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.875rem;
    color: var(--gray-700);
    cursor: pointer;
}
```

- [ ] **Step 3: Llegir la durada a createSlots()**

A `createSlots()` a `app.js`, just després de `const noSun = ...`, afegir:
```js
    const durMin = parseInt(document.querySelector('input[name="aDuration"]:checked').value);
```

I canviar la línia `const nm = m + 30;` per `const nm = m + durMin;`:

```js
    while (cur <= end) {
        if (!(noSun && cur.getDay() === 0)) {
            const [fh, fm] = tFrom.split(':').map(Number);
            const [th, tm] = tTo.split(':').map(Number);
            let h = fh, m = fm;
            while (h * 60 + m < th * 60 + tm) {
                const nm = m + durMin;
                const nh = h + Math.floor(nm / 60);
                const rm = nm % 60;
                rows.push({
                    tipo_agenda: CONFIG.tipoAgenda,
                    actividad:   activity,
                    fecha:       iso(cur),
                    hora_inicio: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,
                    hora_fin:    `${String(nh).padStart(2,'0')}:${String(rm).padStart(2,'0')}`,
                    plazas_max:  cap
                });
                h = nh; m = rm;
            }
        }
        cur.setDate(cur.getDate() + 1);
    }
```

- [ ] **Step 4: Navegació automàtica a DOMContentLoaded**

Substituir la crida final `await loadWeek();` dins `DOMContentLoaded` per:

```js
    // Navegar a la primera setmana amb franges futures
    const today = iso(new Date());
    const { data: properes } = await sb
        .from('franjas')
        .select('fecha')
        .eq('tipo_agenda', CONFIG.tipoAgenda)
        .gte('fecha', today)
        .order('fecha')
        .limit(1);

    if (properes && properes.length) {
        const firstDate = new Date(properes[0].fecha + 'T00:00:00');
        const firstMon  = getMonday(firstDate);
        const currMon   = getMonday(new Date());
        weekOffset = Math.round((firstMon - currMon) / (7 * 24 * 3600 * 1000));
    }
    await loadWeek();
```

I afegir al final de `renderWeek`, dins el bloc `if (!slots.length)`, la detecció de "sense activitats futures". El `renderWeek` reb com a paràmetre `mon`, però no sap si és perquè no hi ha res. Afegirem una variable que ho indiqui. Afegir al bloc de globals:
```js
let noFutureSlots = false;
```

I just abans de `await loadWeek()` al final de DOMContentLoaded:
```js
    noFutureSlots = !(properes && properes.length);
    await loadWeek();
```

I dins `renderWeek`, reemplaçar el bloc `if (!slots.length)` per:
```js
    if (!slots.length) {
        const msg = noFutureSlots
            ? 'No hi ha activitats pròximes'
            : 'No hi ha franges aquesta setmana';
        const sub = noFutureSlots
            ? ''
            : '<div>Usa el panell Admin per crear les franges horàries</div>';
        cont.innerHTML = `
            <div class="empty-state">
                <div class="icon">🪸</div>
                <div style="font-weight:600;margin-bottom:0.25rem">${msg}</div>
                ${sub}
            </div>`;
        return;
    }
```

> Nota: `noFutureSlots` es posa a `false` de nou quan l'usuari navega manualment a una altra setmana. Afegir `noFutureSlots = false;` al principi de `changeWeek`:
```js
function changeWeek(delta) { noFutureSlots = false; weekOffset += delta; loadWeek(); }
```

- [ ] **Step 5: Verificar manualment**

- Obre `index2.html` sense franges a la setmana actual → ha d'anar directament a la setmana amb les properes franges
- Si no hi ha cap franja futura → missatge "No hi ha activitats pròximes"
- Al panell admin, comprova que seleccionant "1h" i creant franges de 09:00 a 13:00 crea 4 franges d'1h (09:00, 10:00, 11:00, 12:00)

- [ ] **Step 6: Commit + push**
```bash
git add association/index.html association/js/app.js association/css/style.css
git commit -m "feat: configurable slot duration, auto-navigate to next slots"
git push
```

---

## Verificació final

Després de les 6 tasques, comprova que el lloc en viu funciona:

1. L'app navega automàticament a la setmana amb activitats
2. Les pestanyes matí/tarda apareixen quan hi ha un gap >1h
3. El botó "Torn sencer" obre el modal i apunta a totes les franges
4. L'admin pot editar les notes dels dies in-line
5. El formulari de creació permet triar 30', 1h o 2h
6. No s'envien missatges de WhatsApp en apuntar-se
