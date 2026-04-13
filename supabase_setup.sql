-- ══════════════════════════════════════════════════════════
-- AGENDA COMUNITARIA — SQL de configuració Supabase
-- Executa aquest script a: supabase.com → SQL Editor → New query
-- ══════════════════════════════════════════════════════════

-- 1. Taula de franges horàries
CREATE TABLE IF NOT EXISTS franjas (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_agenda text        NOT NULL DEFAULT 'nadar',  -- 'nadar' o 'asociacion'
    actividad   text        NOT NULL,
    fecha       date        NOT NULL,
    hora_inicio time        NOT NULL,
    hora_fin    time        NOT NULL,
    plazas_max  integer     NOT NULL DEFAULT 8,
    created_at  timestamptz DEFAULT now()
);

-- 2. Taula d'inscripcions
CREATE TABLE IF NOT EXISTS inscripciones (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    franja_id   uuid        NOT NULL REFERENCES franjas(id) ON DELETE CASCADE,
    tipo_agenda text        NOT NULL DEFAULT 'nadar',  -- copia de franjas.tipo_agenda per rapidesa
    nombre      text        NOT NULL,
    created_at  timestamptz DEFAULT now()
);

-- 3. Índexos per a millor rendiment
CREATE INDEX IF NOT EXISTS idx_franjas_fecha       ON franjas (fecha);
CREATE INDEX IF NOT EXISTS idx_franjas_tipo_agenda ON franjas (tipo_agenda);
CREATE INDEX IF NOT EXISTS idx_inscripciones_franja ON inscripciones (franja_id);
CREATE INDEX IF NOT EXISTS idx_inscripciones_tipo_agenda ON inscripciones (tipo_agenda);

-- 4. Row Level Security (RLS) — necessari per usar la clau "anon"
ALTER TABLE franjas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscripciones ENABLE ROW LEVEL SECURITY;

-- 5. Polítiques: qualsevol pot llegir, inserir i esborrar
--    (és una app comunitària sense autenticació d'usuari)

-- Franjas: lectura pública
CREATE POLICY "franjas_select" ON franjas
    FOR SELECT USING (true);

-- Franjas: inserció i esborrat (el control és per contrasenya al client)
CREATE POLICY "franjas_insert" ON franjas
    FOR INSERT WITH CHECK (true);

CREATE POLICY "franjas_delete" ON franjas
    FOR DELETE USING (true);

-- Inscripciones: lectura pública
CREATE POLICY "inscripciones_select" ON inscripciones
    FOR SELECT USING (true);

-- Inscripciones: tothom pot apuntar-se
CREATE POLICY "inscripciones_insert" ON inscripciones
    FOR INSERT WITH CHECK (true);

-- Inscripciones: tothom pot esborrar la seva (el client comprova el nom)
CREATE POLICY "inscripciones_delete" ON inscripciones
    FOR DELETE USING (true);

-- ══════════════════════════════════════════════════════════
-- Ja pots tancar el SQL Editor. La base de dades està llesta.
-- ══════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════
-- Notes per event (descripció per rang de dates de l'event)
-- Executa DROP + CREATE si ja tenies la versió antiga (per data)
-- ══════════════════════════════════════════════════════════

DROP TABLE IF EXISTS notes_dia;

CREATE TABLE notes_dia (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_agenda  text        NOT NULL,
    fecha_inicio date        NOT NULL,
    fecha_fin    date        NOT NULL,
    nota         text        NOT NULL DEFAULT '',
    created_at   timestamptz DEFAULT now(),
    UNIQUE(tipo_agenda, fecha_inicio)
);

ALTER TABLE notes_dia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes_dia_select" ON notes_dia FOR SELECT USING (true);
CREATE POLICY "notes_dia_insert" ON notes_dia FOR INSERT WITH CHECK (true);
CREATE POLICY "notes_dia_update" ON notes_dia FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "notes_dia_delete" ON notes_dia FOR DELETE USING (true);
