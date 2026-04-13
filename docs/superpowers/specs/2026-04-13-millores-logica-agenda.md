# Millores de lògica de l'agenda — Design Spec

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Cinc millores independents a l'agenda de Cave Cavet: desactivar WhatsApp, notes per dia editables in-line, divisió matí/tarda amb torn sencer, durada de franja configurable, i navegació automàtica a la primera setmana amb activitats.

**Stack:** HTML + CSS + vanilla JS + Supabase (static site, GitHub Pages)

**Fitxers principals:**
- `association/js/app.js` — tota la lògica
- `association/css/style.css` — estils
- `association/index.html` — HTML + CONFIG
- `supabase_setup.sql` — schema DB (nova taula)

---

## 1. Desactivar notificacions WhatsApp

La crida a `notifyWhatsApp(name, s)` dins `doSignup()` es **comenta** (no s'elimina) per poder reactivar-la fàcilment.

```js
// notifyWhatsApp(name, s);  // desactivat temporalment
```

Cap canvi a secrets, workflow ni CONFIG.

---

## 2. Nova taula `notes_dia` a Supabase

### Schema

```sql
CREATE TABLE notes_dia (
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
CREATE POLICY "notes_dia_update" ON notes_dia FOR UPDATE USING (true);
CREATE POLICY "notes_dia_delete" ON notes_dia FOR DELETE USING (true);
```

### Càrrega

A `loadWeek()`, paral·lelament a la consulta de franges, es fa:

```js
const { data: notes } = await sb
    .from('notes_dia')
    .select('fecha, nota')
    .eq('tipo_agenda', CONFIG.tipoAgenda)
    .gte('fecha', iso(mon))
    .lte('fecha', iso(sun));
// resultat: map { fecha → nota }
```

### Desa (upsert)

Quan l'admin edita la nota d'un dia i perd el focus (`blur`):

```js
await sb.from('notes_dia').upsert(
    { tipo_agenda: CONFIG.tipoAgenda, fecha, nota },
    { onConflict: 'tipo_agenda,fecha' }
);
```

---

## 3. Layout del dia: pestanyes matí/tarda + nota editable

### Estructura HTML per dia

```html
<div class="day-section">
  <div class="day-header today">
    <span>Dilluns 20 de gener</span>
    <span class="today-pill">Avui</span>
  </div>
  <div class="day-note" data-fecha="2026-01-20" contenteditable="false">
    🎭 Taller de teatre — Sala gran
  </div>
  <div class="shift-tabs">
    <button class="shift-tab active" data-shift="mati">☀️ Matí (3)</button>
    <button class="shift-tab"        data-shift="tarda">🌤 Tarda (2)</button>
  </div>
  <div class="slots-grid" data-shift="mati"> ... </div>
  <div class="slots-grid" data-shift="tarda" style="display:none"> ... </div>
</div>
```

### Divisió matí/tarda (automàtica)

Les franges d'un dia s'ordenen per `hora_inicio`. Es detecta un gap >60 minuts entre dues franges consecutives. Les franges abans del gap = matí, les d'després = tarda.

```js
function timeToMins(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }

function splitShifts(daySlots) {
    // daySlots ordenat per hora_inicio
    let splitIdx = -1;
    for (let i = 1; i < daySlots.length; i++) {
        const prev = timeToMins(daySlots[i-1].hora_fin);
        const curr = timeToMins(daySlots[i].hora_inicio);
        if (curr - prev > 60) { splitIdx = i; break; }
    }
    if (splitIdx === -1) return { mati: daySlots, tarda: [] };
    return { mati: daySlots.slice(0, splitIdx), tarda: daySlots.slice(splitIdx) };
}
```

Si `tarda` és buit, no es mostren les pestanyes (dia continu sense divisió).

### Nota del dia

- Si no hi ha nota i l'admin **no** és actiu: la `div.day-note` no es renderitza
- Si no hi ha nota i l'admin **és actiu**: es renderitza buida amb placeholder "Afegeix una descripció..."
- Si hi ha nota: sempre visible
- Quan l'admin és actiu: `contenteditable="true"`, estil cursor editable, desa en `blur`

### Estat admin actiu

S'afegeix una variable global `let adminActiu = false`. Es posa a `true` quan `checkAdminPwd()` valida correctament. En `renderWeek()`, si `adminActiu`, les notes del dia es fan editables.

### Botó "Torn sencer"

A cada pestanya de torn, sota les franges, apareix:

```html
<button class="btn-torn-sencer" onclick="openTornSencer('mati', '2026-01-20')">
    + Torn sencer de matí
</button>
```

El botó apareix **desactivat** (disabled) si totes les franges del torn estan plenes.

---

## 4. Modal "Torn sencer"

Nou overlay `#tornOverlay` afegit a `index.html`, similar al `#signupOverlay` existent.

### Contingut del modal

```
☀️ Torn de matí sencer             [✕]
Dilluns 20 de gener

Franges incloses:
• 09:00–09:30  Stand Up   3/8   [ja apuntat ✓ / ple ✗ / disponible]
• 09:30–10:00  Stand Up   7/8
• 10:00–10:30  Stand Up   2/8

El teu nom
[________________________]

[✓ Apuntar-me a totes]   [Cancel·la]
```

### Lògica d'inscripció en bloc

```js
async function doTornSencer() {
    const name = input.value.trim();
    const myNameLow = name.toLowerCase();
    // Filtra: franges del torn que no estan plenes I on l'usuari no està ja apuntat
    const aInscriure = tornSlots.filter(s => {
        const ins = s.inscripciones || [];
        const ple = ins.length >= s.plazas_max;
        const jaApuntat = ins.some(e => e.nombre.trim().toLowerCase() === myNameLow);
        return !ple && !jaApuntat;
    });
    if (!aInscriure.length) { /* missatge: ja apuntat a totes o totes plenes */ return; }
    const rows = aInscriure.map(s => ({
        franja_id: s.id, tipo_agenda: CONFIG.tipoAgenda, nombre: name
    }));
    await sb.from('inscripciones').insert(rows);
    localStorage.setItem('myName', name);
    await loadWeek();
    closeOverlay('tornOverlay');
}
```

---

## 5. Durada de franja configurable

Al formulari admin, el camp actual de "Hora inici / Hora fi" es manté. S'afegeix un **radio group** de durada:

```html
<div class="form-group">
    <label class="form-label">Durada per franja</label>
    <div class="duration-options">
        <label><input type="radio" name="aDuration" value="30" checked> 30'</label>
        <label><input type="radio" name="aDuration" value="60"> 1h</label>
        <label><input type="radio" name="aDuration" value="120"> 2h</label>
    </div>
</div>
```

A `createSlots()`, la variable `durMin` (ara hardcodejada a 30) passa a llegir-se del radio seleccionat:

```js
const durMin = parseInt(document.querySelector('input[name="aDuration"]:checked').value);
```

El bucle intern passa de `nm = m + 30` a `nm = m + durMin`.

---

## 6. Navegació automàtica a la primera setmana amb franges

A `DOMContentLoaded`, abans de cridar `loadWeek()`, es fa una consulta per trobar la data mínima futura:

```js
const today = iso(new Date());
const { data } = await sb
    .from('franjas')
    .select('fecha')
    .eq('tipo_agenda', CONFIG.tipoAgenda)
    .gte('fecha', today)
    .order('fecha')
    .limit(1);

if (data && data.length) {
    const firstDate = new Date(data[0].fecha + 'T00:00:00');
    const firstMon  = getMonday(firstDate);
    const currMon   = getMonday(new Date());
    const diffMs    = firstMon - currMon;
    weekOffset      = Math.round(diffMs / (7 * 24 * 3600 * 1000));
} else {
    // sense activitats futures → weekOffset = 0, renderitzar missatge especial
    noFutureSlots = true;
}
await loadWeek();
```

Si `noFutureSlots` és `true`, `renderWeek()` mostra:

```html
<div class="empty-state">
    <div class="icon">🪸</div>
    <div>No hi ha activitats pròximes</div>
</div>
```

en lloc del missatge actual "No hi ha franges aquesta setmana".

---

## Canvis a `supabase_setup.sql`

S'afegeix la secció de `notes_dia` al final del fitxer existent.

## Fitxers afectats

| Fitxer | Canvis |
|--------|--------|
| `association/js/app.js` | Tots els punts 1, 3, 4, 5, 6 |
| `association/css/style.css` | Estils per `.day-note`, `.shift-tabs`, `.shift-tab`, `.btn-torn-sencer`, `.duration-options` |
| `association/index.html` | Nou `#tornOverlay` al HTML |
| `supabase_setup.sql` | Nova taula `notes_dia` |
