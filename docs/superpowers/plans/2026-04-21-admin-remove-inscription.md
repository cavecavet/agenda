# Admin: Eliminar inscripció individual — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** En mode admin, mostrar un botó `✕` al costat de cada nom a la llista d'apuntats d'una franja, permetent esborrar la inscripció directament des del modal.

**Architecture:** Canvi localitzat a un sol fitxer (`association/js/app.js`). Es modifica la funció `openSlot()` per renderitzar botons de supressió quan `adminActiu === true`, i s'afegeix la funció `adminRemoveInscripcion(id)` que fa `DELETE` a Supabase i refresca el modal.

**Tech Stack:** JavaScript vanilla, Supabase JS v2 (ja inicialitzat com `sb`).

---

### Task 1: Afegir botó ✕ a la llista d'apuntats en mode admin

**Files:**
- Modify: `association/js/app.js:402-405`

La secció actual que renderitza la llista d'apuntats dins `openSlot()` és:

```js
const ul = document.getElementById('enrolledList');
ul.innerHTML = ins.length
    ? ins.map(e => `<li><div class="avatar">${e.nombre.charAt(0).toUpperCase()}</div>${e.nombre}</li>`).join('')
    : '<li style="color:var(--gray-400)">Ningú apuntat encara</li>';
```

- [ ] **Step 1: Substituir el render de la llista per la versió condicional**

Substituir el bloc anterior per:

```js
const ul = document.getElementById('enrolledList');
ul.innerHTML = ins.length
    ? ins.map(e => `<li>
        <div class="avatar">${e.nombre.charAt(0).toUpperCase()}</div>
        ${e.nombre}
        ${adminActiu ? `<button onclick="adminRemoveInscripcion('${e.id}')"
            style="margin-left:auto;background:none;border:none;color:var(--danger);font-size:1rem;cursor:pointer;padding:0 0.25rem;line-height:1"
            title="Eliminar inscripció">✕</button>` : ''}
      </li>`).join('')
    : '<li style="color:var(--gray-400)">Ningú apuntat encara</li>';
```

- [ ] **Step 2: Verificar visualment**

1. Obre la app en el navegador
2. Entra en mode admin (botó 🔧 Admin → contrasenya)
3. Fes clic en una franja que tingui persones apuntades
4. Comprova que cada nom té un `✕` petit alineat a la dreta
5. Comprova que sense mode admin els `✕` no apareixen

---

### Task 2: Implementar la funció `adminRemoveInscripcion`

**Files:**
- Modify: `association/js/app.js` — afegir funció nova just després de `doUnsignup()` (línia ~473)

- [ ] **Step 1: Afegir la funció**

Inserir just després del tancament de `doUnsignup()`:

```js
async function adminRemoveInscripcion(inscripcionId) {
    const { error } = await sb.from('inscripciones').delete().eq('id', inscripcionId);
    if (error) { alert('Error eliminant la inscripció: ' + error.message); return; }
    await loadWeek();
    openSlot(currentSlotId);
}
```

- [ ] **Step 2: Verificar funcionament**

1. En mode admin, obre una franja amb persones apuntades
2. Fes clic al `✕` d'una persona
3. Comprova que desapareix de la llista immediatament (el modal es refresca sol)
4. Comprova que el comptador de places (`X de Y places ocupades`) s'actualitza
5. Comprova que la targeta de la franja al fons també s'actualitza (barra de progrés)

- [ ] **Step 3: Commit**

```bash
git add association/js/app.js
git commit -m "feat: admin can remove individual inscriptions from slot modal"
```
