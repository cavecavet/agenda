# Admin: Eliminar inscripció individual

## Problema
Quan una persona s'inscriu per error a una franja, no hi ha cap manera d'esborrar-la des de la interfície. L'admin ha d'anar directament a Supabase.

## Solució

En mode admin, cada element de la llista d'apuntats del modal de franja mostra un botó `✕` alineat a la dreta. Clicar-lo esborra aquella inscripció i refresca el modal.

## Abast

Un sol fitxer modificat: `association/js/app.js`

### Canvis

**1. `openSlot()` — renderitzar llista d'apuntats**

Condicionalment, si `adminActiu`, cada `<li>` inclou un botó `✕` cridant `adminRemoveInscripcion(e.id)`.

```html
<!-- mode normal -->
<li><div class="avatar">A</div>Anna Garcia</li>

<!-- mode admin -->
<li>
  <div class="avatar">A</div>Anna Garcia
  <button onclick="adminRemoveInscripcion('uuid')" class="remove-btn">✕</button>
</li>
```

**2. Nova funció `adminRemoveInscripcion(id)`**

- `DELETE` a `inscripciones` per `id`
- En cas d'error: `alert()`
- En cas d'èxit: `await loadWeek()` i torna a obrir el modal actualitzat (`openSlot(currentSlotId)`)

### Estil

El botó `✕` és petit, color `var(--danger)`, alineat a la dreta amb `margin-left: auto`. Sense estils nous necessaris si s'usa un `<button>` inline amb `style`.

## Comportament

- Sense diàleg de confirmació (acció reversible: la persona es pot tornar a apuntar)
- Visible únicament quan `adminActiu === true`
- Funciona sobre qualsevol inscripció, independentment del nom guardat al `localStorage`
