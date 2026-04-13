# 🌊 Agenda de Associació — Guia de configuració i publicació

Agenda comunitaria per gestionar activitats i franges horàries de l'associació **Cave Cavet** amb estil marinero dedicat a la biologia marina.

> **Nota**: La agenda de natació está desactivada per ara. Solo la de **Cave Cavet** és funcional.

Tot el procés triga uns **20-30 minuts** i és completament **gratuït**.

---

## PAS 1 — Crear la base de dades (Supabase) 🗄️

1. Ves a **[supabase.com](https://supabase.com)** i crea un compte gratuït.
2. Crea un nou projecte (tria la regió més propera, ex. *EU West*).
3. Un cop creat, ves a **SQL Editor → New query**.
4. Copia el contingut de `supabase_setup.sql` i executa'l (botó **Run**).
5. Ves a **Settings → API** i copia:
   - **Project URL** → serà el teu `supabaseUrl`
   - **anon public key** → serà el teu `supabaseKey`

---

## PAS 2 — Configurar notificacions WhatsApp (CallMeBot) 📱

CallMeBot és un servei gratuït que permet enviar missatges a WhatsApp via API.

### Opció A: Notificació al teu número personal (fàcil)
1. Afegeix el número **+34 621 331 709** als teus contactes de WhatsApp
   (posa-li el nom "CallMeBot" per identificar-lo).
   > Alternativa: **+34 623 78 64 49**
2. Envia el missatge `I allow callmebot to send me messages` a aquell contacte.
3. En uns minuts rebràs un missatge amb la teva **API Key**.
4. Anota el teu número amb prefix de país (ex: `34612345678`) i la API Key.

### Opció B: Notificació a un grup de WhatsApp (recomanat per a associacions)
1. Ves a **[callmebot.com/blog/free-api-whatsapp-messages/](https://www.callmebot.com/blog/free-api-whatsapp-messages/)**.
2. Segueix les instruccions per afegir el bot al teu grup de WhatsApp.
3. Obtindràs un **Phone ID de grup** i una **API Key**.
4. Usa el Phone ID com a `callmebotPhone` i la API Key com a `callmebotApiKey`.

> **Nota**: Si prefereixes avisos per correu electrònic en lloc de WhatsApp, pots
> saltar-te aquest pas i deixar `callmebotPhone` buit; l'aplicació funcionarà
> igual sense notificacions.

---

## PAS 3 — Configurar les credencials (GitHub Secrets) ⚙️

Les credencials **mai no s'editen directament** a `index.html` (estarien visibles al repositori públic). En canvi, s'injecten automàticament durant el desplegament via GitHub Actions Secrets.

### 3.1 — Generar el hash de la contrasenya d'admin

La contrasenya d'admin s'emmagatzema com un **hash SHA-256** per evitar que sigui visible al codi font. Per generar-lo:

1. Obre el navegador i prem **F12** per obrir les eines de desenvolupador.
2. Ves a la pestanya **Console**.
3. Enganxa i executa aquest codi (substituint `la_teva_contrasenya`):

```javascript
crypto.subtle.digest('SHA-256', new TextEncoder().encode('la_teva_contrasenya'))
  .then(b => console.log(Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2,'0')).join('')))
```

4. Copia el hash llarg que apareix (64 caràcters hexadecimals).

### 3.2 — Afegir els secrets a GitHub

1. Al teu repositori de GitHub, ves a **Settings → Secrets and variables → Actions**.
2. Clica **New repository secret** per a cadascun d'aquests valors:

| Nom del secret        | Valor                                      |
|-----------------------|--------------------------------------------|
| `SUPABASE_URL`        | URL del projecte (del Pas 1)               |
| `SUPABASE_KEY`        | Anon public key (del Pas 1)                |
| `CALLMEBOT_PHONE`     | Número amb prefix país, ex: `34612345678` |
| `CALLMEBOT_API_KEY`   | API Key de CallMeBot (del Pas 2)           |
| `ADMIN_PASSWORD`      | Hash SHA-256 generat al pas 3.1            |

> **Important**: Un cop guardats, els secrets no es poden llegir ni des de la web de GitHub ni des de les eines de desenvolupador del navegador. Desa'ls en un lloc segur.

---

## PAS 4 — Publicar a GitHub Pages 🚀

### Pas a pas:

1. **Crea un repositori a GitHub**:
   - Ves a **[github.com/new](https://github.com/new)**
   - Nom: `agenda` (o el que prefereixis)
   - Selecciona "Public"
   - Crea el repositori

2. **Puja els arxius**:
   ```bash
   cd /path/to/agenda
   git init
   git add .
   git commit -m "Initial setup: association agenda"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/agenda.git
   git push -u origin main
   ```

3. **Activa GitHub Pages amb GitHub Actions**:
   - Ves a **Settings → Pages** del teu repositori
   - A "Source", selecciona **"GitHub Actions"** (no "Deploy from a branch")
   - Clica **Save**

4. **Afegeix els secrets** (Pas 3.2 d'aquesta guia).

5. **Espera 1-2 minuts** i la web estarà en viu a:
   - Pàgina principal: `https://YOUR_USERNAME.github.io/agenda/`
   - Agenda de l'associació: `https://YOUR_USERNAME.github.io/agenda/association/`

> **Com funciona**: Cada `git push` a `main` dispara el workflow `.github/workflows/deploy.yml`, que injecta els secrets als fitxers i publica la pàgina. Les credencials mai no queden al codi font.

---

## PAS 5 — Primera configuració 🎯

1. **Obre la URL** de l'agenda: `https://YOUR_USERNAME.github.io/agenda/association/`
2. **Clica el botó ⚙️ Admin** (baix a la dreta)
3. **Introdueix la contrasenya** que has configurat a `adminPassword`
4. A la secció **"Crear franges horàries"**:
   - Tria les dates de la setmana (des de ... fins a ...)
   - Posa l'hora d'inici i fi (ex: 09:00 a 13:00)
   - Indica el nom de l'activitat
   - Marca les places per franja
   - Clica **Crear franges**
5. Les franges apareixeran al calendari setmanal. ¡Ja podeu apuntar-vos!

---

## Funcionament diari 📋

- **Participants**: Obren l'URL, fan clic a la franja que volen, escriuen el seu nom
  i cliquen "Apuntar-me". El sistema envia automàticament un avís a WhatsApp.
- **Admin**: Crea les franges setmanals des del panell Admin.
  Pot eliminar-les si cal canviar l'horari.
- **El nom es recorda**: El navegador guarda el nom del participant la primera vegada,
  de manera que les properes visites és més ràpid apuntar-se.

---

## Canviar la contrasenya d'admin 🔑

1. Tria la nova contrasenya i genera el seu hash SHA-256 (veure Pas 3.1).
2. Ves a **Settings → Secrets and variables → Actions** al teu repositori de GitHub.
3. Clica el botó **✏️ Update** al costat del secret `ADMIN_PASSWORD`.
4. Enganxa el nou hash i guarda.
5. Fes un `git push` buit per forçar un nou desplegament:
   ```bash
   git commit --allow-empty -m "chore: rotate admin password"
   git push
   ```
6. En 1-2 minuts la nova contrasenya estarà activa.

> **Nota**: Mai no desis la contrasenya al codi font ni la enviïs per correu o WhatsApp en clar. Comparteix-la en persona o per un canal xifrat.

---

## Preguntes freqüents ❓

**Pot algú apuntar-se amb el nom d'un altre?**
Sí, és una app de confiança per a comunitats petites. No té autenticació amb
contrasenya per participant.

**Quants usuaris pot tenir?**
El pla gratuït de Supabase suporta fins a **500 MB** de dades i **50.000**
peticions al dia, més que suficient per a la vostra associació.

**L'URL canviarà?**
No, un cop publicada a GitHub Pages, la URL és permanent mentre mantinguis el repositori actiu.

**Com actualitzar els arxius després?**
1. Edita els fitxers localment
2. `git add .` → `git commit -m "..."` → `git push`
3. GitHub Actions desplega automàticament en 1-2 minuts

**Com envio la URL als socis?**
Comparteix la URL per WhatsApp o correu. Crea un codi QR gratuït a
[qr-code-generator.com](https://www.qr-code-generator.com) i penja'l al
tauler d'anuncis de l'associació.

---

Consulta el **[README.md](README.md)** per a més informació tècnica.
