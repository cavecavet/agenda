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

## PAS 3 — Configurar l'aplicació ⚙️

Obre `association/index.html` amb qualsevol editor de text (Bloc de notes, VS Code, etc.).
Cerca la secció `CONFIG` al principi del codi i omple els valors:

```javascript
const CONFIG = {
    supabaseUrl:  'https://xxxx.supabase.co',   // ← del Pas 1
    supabaseKey:  'eyJhbGci...',                 // ← del Pas 1
    callmebotPhone:  '34612345678',              // ← del Pas 2 (opcional)
    callmebotApiKey: '123456',                   // ← del Pas 2 (opcional)
    nombreAsociacion: 'Cave Cavet',
    actividadDefault: 'Activitat 🎉',
    tipoAgenda: 'asociacion',                    // ← NO CANVIAR
    adminPassword:    'la_teva_clau_secreta',    // ← tria una contrasenya
};
```

Desa el fitxer.

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

3. **Activa GitHub Pages**:
   - Ves a **Settings → Pages** del teu repositori
   - A "Source", selecciona **"Deploy from a branch"**
   - Branca: **`main`**
   - Carpeta: **`/ (root)`**
   - Clica **Save**

4. **Espera 1-2 minuts** i la web estarà en viu a:
   - Pàgina principal: `https://YOUR_USERNAME.github.io/agenda/`
   - Agenda de l'associació: `https://YOUR_USERNAME.github.io/agenda/association/`

### Desplegar automàticament amb GitHub Actions:
- El fitxer `.github/workflows/deploy.yml` ja està configurat.
- Cada cop que facis `git push` a `main`, GitHub Actions desplega automàticament en 1-2 minuts.

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
