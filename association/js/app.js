// ── Estado ──────────────────────────────────────
let sb;               // supabase client
let weekOffset = 0;
let slots = [];
let notesMap = {};    // { fecha: nota } per la setmana visible
let currentSlotId = null;
let adminActiu = false;

// ── Init ─────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
    const M = ['Gen','Feb','Mar','Abr','Mai','Jun','Jul','Ago','Set','Oct','Nov','Des'];
    const now = new Date();
    document.getElementById('headerBadge').textContent = `${M[now.getMonth()]} ${now.getFullYear()}`;

    if (CONFIG.supabaseUrl.startsWith('TU_')) {
        document.getElementById('mainContent').innerHTML = `
            <div class="config-warn">
                <strong>🌊 Aplicació no configurada</strong><br><br>
                Edita el fitxer <code>index.html</code> i omple els valors a la secció <code>CONFIG</code> al principi del codi:<br><br>
                • <code>supabaseUrl</code> + <code>supabaseKey</code> → <a href="https://supabase.com" target="_blank">supabase.com</a> › Settings › API<br>
                • <code>callmebotPhone</code> + <code>callmebotApiKey</code> → <a href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank">callmebot.com</a><br>
                • <code>adminPassword</code> → tria una contrasenya per al panell admin<br><br>
                Consulta el fitxer <strong>SETUP.md</strong> per a les instruccions detallades.
            </div>`;
        return;
    }

    sb = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

    // Defaults admin form
    const mon = getMonday(new Date());
    const sun = new Date(mon); sun.setDate(sun.getDate() + 6);
    document.getElementById('aDateFrom').value = iso(mon);
    document.getElementById('aDateTo').value   = iso(sun);
    document.getElementById('aActivity').value = CONFIG.actividadDefault;

    await loadWeek();
});

// ── Semana ───────────────────────────────────────
function getMonday(d) {
    const r = new Date(d);
    const day = r.getDay();
    r.setDate(r.getDate() - day + (day === 0 ? -6 : 1));
    r.setHours(0,0,0,0);
    return r;
}
function iso(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function fmtDate(str) {
    const D = ['diumenge','dilluns','dimarts','dimecres','dijous','divendres','dissabte'];
    const M = ['gener','febrer','març','abril','maig','juny','juliol','agost','setembre','octubre','novembre','desembre'];
    const d = new Date(str + 'T00:00:00');
    return `${D[d.getDay()]} ${d.getDate()} de ${M[d.getMonth()]}`;
}
function fmtDateShort(str) {
    const M = ['gen','feb','mar','abr','mai','jun','jul','ago','set','oct','nov','des'];
    const d = new Date(str + 'T00:00:00');
    return `${d.getDate()} ${M[d.getMonth()]}`;
}

function changeWeek(delta) { weekOffset += delta; loadWeek(); }

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

function fmtDuration(ini, fi) {
    const [h1, m1] = ini.split(':').map(Number);
    const [h2, m2] = fi.split(':').map(Number);
    const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    return mins >= 60 ? `${Math.floor(mins/60)}h${mins%60 ? (mins%60)+'m' : ''}` : `${mins}m`;
}

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

// ── Modal inscripció ──────────────────────────────
function openSlot(id) {
    const s = slots.find(x => x.id === id);
    if (!s) return;
    currentSlotId = id;

    const ins  = s.inscripciones || [];
    const cnt  = ins.length;
    const max  = s.plazas_max;
    const full = cnt >= max;

    document.getElementById('mTitle').textContent =
        `${s.hora_inicio.slice(0,5)}–${s.hora_fin.slice(0,5)}  ·  ${s.actividad}`;
    document.getElementById('mSub').textContent =
        `${fmtDate(s.fecha)}  ·  ${cnt} de ${max} places ocupades`;

    // Llista apuntats
    const ul = document.getElementById('enrolledList');
    ul.innerHTML = ins.length
        ? ins.map(e => `<li><div class="avatar">${e.nombre.charAt(0).toUpperCase()}</div>${e.nombre}</li>`).join('')
        : '<li style="color:var(--gray-400)">Ningú apuntat encara</li>';

    // Estat usuari
    const myName = (localStorage.getItem('myName') || '').trim().toLowerCase();
    const isMine = myName && ins.some(e => e.nombre.trim().toLowerCase() === myName);

    document.getElementById('signupAlert').innerHTML = '';

    if (isMine) {
        document.getElementById('signupForm').style.display    = 'none';
        document.getElementById('alreadySection').style.display = 'block';
    } else {
        document.getElementById('signupForm').style.display    = 'block';
        document.getElementById('alreadySection').style.display = 'none';
        const savedName = localStorage.getItem('myName') || '';
        if (savedName) document.getElementById('nameInput').value = savedName;
        const btn = document.getElementById('signupBtn');
        btn.disabled    = full;
        btn.textContent = full ? 'Franja plena' : '✓ Apuntar-me';
    }

    document.getElementById('signupOverlay').classList.add('open');
    if (!isMine) setTimeout(() => document.getElementById('nameInput').focus(), 100);
}

async function doSignup() {
    const name = document.getElementById('nameInput').value.trim();
    if (!name) { showAlert('signupAlert', 'Escriu el teu nom', 'error'); return; }

    const btn = document.getElementById('signupBtn');
    btn.disabled = true; btn.textContent = 'Apuntant…';

    const s   = slots.find(x => x.id === currentSlotId);
    const cnt = (s.inscripciones || []).length;
    if (cnt >= s.plazas_max) {
        showAlert('signupAlert', 'Aquesta franja ja és plena', 'error');
        btn.disabled = false; btn.textContent = '✓ Apuntar-me';
        return;
    }

    const { error } = await sb.from('inscripciones')
        .insert({ franja_id: currentSlotId, tipo_agenda: CONFIG.tipoAgenda, nombre: name });

    if (error) {
        showAlert('signupAlert', 'Error: ' + error.message, 'error');
        btn.disabled = false; btn.textContent = '✓ Apuntar-me';
        return;
    }

    localStorage.setItem('myName', name);
    // notifyWhatsApp(name, s);  // desactivat temporalment

    await loadWeek();
    closeOverlay('signupOverlay');
}

async function doUnsignup() {
    const myName = (localStorage.getItem('myName') || '').trim().toLowerCase();
    if (!myName) return;
    const s  = slots.find(x => x.id === currentSlotId);
    const me = (s.inscripciones || []).find(e => e.nombre.trim().toLowerCase() === myName);
    if (!me) return;

    const { error } = await sb.from('inscripciones').delete().eq('id', me.id);
    if (error) { alert('Error: ' + error.message); return; }

    await loadWeek();
    closeOverlay('signupOverlay');
}

// ── WhatsApp notification ─────────────────────────
function notifyWhatsApp(name, slot) {
    if (!CONFIG.callmebotPhone || CONFIG.callmebotPhone === 'TU_NUMERO') return;

    const msg = `🏊 *${CONFIG.nombreAsociacion}*\n`
              + `${name} s'ha apuntat a ${slot.actividad}\n`
              + `📅 ${fmtDate(slot.fecha)}\n`
              + `⏰ ${slot.hora_inicio.slice(0,5)}–${slot.hora_fin.slice(0,5)}`;

    const url = `https://api.callmebot.com/whatsapp.php`
              + `?phone=${CONFIG.callmebotPhone}`
              + `&text=${encodeURIComponent(msg)}`
              + `&apikey=${CONFIG.callmebotApiKey}`;

    fetch(url, { mode: 'no-cors' }).catch(() => {});
}

// ── Admin ─────────────────────────────────────────
function openAdmin() {
    adminActiu = false;
    document.getElementById('adminLogin').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('adminPwd').value = '';
    document.getElementById('adminLoginErr').textContent = '';
    document.getElementById('adminOverlay').classList.add('open');
}

async function checkAdminPwd() {
    const input = document.getElementById('adminPwd').value;
    const encoded = new TextEncoder().encode(input);
    const hashBuf = await crypto.subtle.digest('SHA-256', encoded);
    const hashHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2,'0')).join('');

    if (hashHex === CONFIG.adminPasswordHash) {
        adminActiu = true;
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        renderWeek(getMonday(new Date()));
    } else {
        document.getElementById('adminLoginErr').textContent = 'Contrasenya incorrecta';
    }
}

async function createSlots() {
    const from     = document.getElementById('aDateFrom').value;
    const to       = document.getElementById('aDateTo').value;
    const tFrom    = document.getElementById('aTimeFrom').value;
    const tTo      = document.getElementById('aTimeTo').value;
    const activity = document.getElementById('aActivity').value || CONFIG.actividadDefault;
    const cap      = parseInt(document.getElementById('aCapacity').value) || 8;
    const noSun    = document.getElementById('aNoSunday').checked;

    if (!from || !to || !tFrom || !tTo) {
        showAlert('adminAlert','Omple tots els camps','error'); return;
    }

    const btn = document.getElementById('createBtn');
    btn.disabled = true; btn.textContent = 'Creant…';

    const rows = [];
    const cur  = new Date(from + 'T00:00:00');
    const end  = new Date(to   + 'T00:00:00');

    while (cur <= end) {
        if (!(noSun && cur.getDay() === 0)) {
            const [fh, fm] = tFrom.split(':').map(Number);
            const [th, tm] = tTo.split(':').map(Number);
            let h = fh, m = fm;
            while (h * 60 + m < th * 60 + tm) {
                const nm = m + 30;
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

    if (!rows.length) {
        showAlert('adminAlert','No s\'han generat franges (comprova les dates)','error');
        btn.disabled = false; btn.textContent = 'Crear franges';
        return;
    }

    const { error } = await sb.from('franjas').insert(rows);
    if (error) {
        showAlert('adminAlert','Error: ' + error.message,'error');
    } else {
        showAlert('adminAlert',`✓ ${rows.length} franges creades correctament`,'success');
        await loadWeek();
    }
    btn.disabled = false; btn.textContent = 'Crear franges';
}

async function deleteWeekSlots() {
    if (!confirm('Eliminar totes les franges d\'aquesta setmana i les seves inscripcions?')) return;

    const mon = getMonday(new Date());
    mon.setDate(mon.getDate() + weekOffset * 7);
    const sun = new Date(mon); sun.setDate(sun.getDate() + 6);

    const { error } = await sb.from('franjas').delete()
        .eq('tipo_agenda', CONFIG.tipoAgenda)
        .gte('fecha', iso(mon)).lte('fecha', iso(sun));

    if (error) { showAlert('adminAlert','Error: ' + error.message,'error'); }
    else        { showAlert('adminAlert','✓ Franges eliminades','success'); await loadWeek(); }
}

// ── Utils ─────────────────────────────────────────
function closeOverlay(id) { document.getElementById(id).classList.remove('open'); }

function showAlert(containerId, msg, type) {
    document.getElementById(containerId).innerHTML =
        `<div class="alert alert-${type}">${msg}</div>`;
}

document.querySelectorAll('.overlay').forEach(o =>
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); })
);
