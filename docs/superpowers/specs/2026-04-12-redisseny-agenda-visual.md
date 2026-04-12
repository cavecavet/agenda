# Redisseny Visual — Agenda Cave Cavet

**Data:** 2026-04-12  
**Fitxer afectat:** `association/index.html`  
**Estil triat:** Marí Refinat (paleta blau/turquesa/verd actual, més elegant)  
**Dispositiu prioritari:** Mòbil

---

## Resum

Redisseny visual de `association/index.html` sense canviar funcionalitat ni estructura de dades. L'objectiu és un acabat més polit i professional: millor jerarquia visual, millor llegibilitat al mòbil i més personalitat de marca.

---

## Canvis per secció

### 1. Header

**Actual:** Gradient horitzontal, emoji flotant, text bàsic.

**Nou:**
- Padding inferior ampliat per deixar espai a l'onada
- Onada SVG decorativa a la part inferior (`<svg>`) que connecta el header amb el cos
- Títol amb `font-weight: 800`, lletra lleugerament més gran
- Píndola discreta amb mes/any a la dreta (`Abr 2026`)
- Eliminar l'emoji animat de fons (`:before` amb `animation: float`)

### 2. Navegació setmanal (`.week-nav`)

**Actual:** Botons amb vora quadrada, aspecte de formulari.

**Nou:**
- Botons arrodonits (`border-radius: 20px`), fons `#f0f9fb`, text `#0096c7`
- Sense vora, amb fons de color suau — més touch-friendly
- Lleugera ombra inferior per separar del contingut

### 3. Fons del contingut (`main`)

**Actual:** Gradient blanc/blau molt clar, pla.

**Nou:**
- `background: #f2f8fb` — blau fred molt lleuger que dóna profunditat i fa "respirar" les cards

### 4. Capçaleres de dia (`.day-header`)

**Actual:** Text petit, destacat tènue per al dia d'avui.

**Nou:**
- Mida lletra lleument augmentada, `font-weight: 700`
- Dia d'avui: píndola `Avui` (fons `#0096c7`, text blanc) alineada a la dreta
- `border-radius` major a la secció del dia (`14px`)
- `box-shadow` suau per separar del fons

### 5. Cards de franja (`.slot-card`) — canvi principal

> ⚠️ Aquest canvi requereix modificar **tant el CSS com el HTML generat per JS** (la funció que renderitza les cards de franja).

**Actual:** Grid de 2 columnes, cards compactes, tota la info apilada verticalment dins.

**Nou — layout en fila (flex horitzontal):**
```
┌─────────────────────────────────────────┐
│  09:00  │  Natació lliure               │
│  90min  │  ████████░░  5/8              │
│         │  ✓ Apuntada                   │
└─────────────────────────────────────────┘
```
- Columna esquerra: hora (`font-weight: 800`, color `#0077a8`) + durada en gris
- Divisor vertical `1px solid #e4eff5`
- Columna dreta: nom activitat + barra + compte + insígnia si escau
- Layout: `display: flex`, ocupa tot l'ample disponible (1 columna, no grid de 2)
- El `.slots-grid` passa de `grid` a `display: flex; flex-direction: column; gap: 0.4rem`
- La hora es mostra sense el rang (no "09:00 – 10:30" sinó "09:00"), la durada es calcula com a diferència entre `hora_inicio` i `hora_fin` i es mostra a sota en minuts
- `border-radius: 10px`, vora `1.5px solid #e4eff5`
- Hover: `border-color: #0096c7` + ombra subtil
- Estat `.mine`: fons degradat verd molt clar (`#f0fdf8 → #e8f7f3`)
- Estat `.full`: color de la hora en vermell `#ef4444`

### 6. Barra de places (`.bar-track / .bar-fill`)

**Actual:** Alçada 4px, poc visible.

**Nou:**
- Alçada `5px`, `border-radius: 3px` — més visible sense ser agressiva
- Colors es mantenen: blau → taronja (warn) → vermell (ple)

### 7. Insígnia "Apuntada" (`.slot-mine-badge`)

**Actual:** Text petit sota la barra.

**Nou:**
- Text `✓ Apuntada`, color `#06a77d`, `font-weight: 700`
- Es mostra sota la barra quan la franja és pròpia

### 8. Modal (`.modal`)

Cap canvi estructural. Millores menors:
- `border-radius: 20px` (era 18px) per consistència
- `box-shadow` lleugerament més pronunciada
- Botó primari manté el degradat actual (ja és correcte)

---

## Variables CSS a modificar

Totes les variables `:root` es mantenen. S'afegeix:
```css
--surface-bg: #f2f8fb;   /* fons del contingut */
--slot-radius: 10px;     /* border-radius de les cards */
```

---

## Fora d'abast

- `index.html` (portada) — no es toca
- `swimming/index.html` — no es toca
- Funcionalitat JS (Supabase, inscripcions, admin) — no es toca
- Estructura HTML (elements, IDs, classes funcionals) — es pot afegir classes de presentació però no eliminar les existents
