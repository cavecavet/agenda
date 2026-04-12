# 📅 Agendas Comunitarias

Sistema de gestión de agendas simples para comunidades, asociaciones, y grupos de actividades. Soporta múltiples agendas independientes con una base de datos compartida.

## 🎯 Características

- ✅ **Dos agendas independentes**: Natació y Associació (extensible a más)
- ✅ **Sin autenticación de usuarios**: Basado en confianza comunitaria
- ✅ **Notificaciones WhatsApp**: Avisos automáticos al inscribirse
- ✅ **Panel admin protegido**: Control total sobre franjas horarias
- ✅ **Diseño responsivo**: Funciona en móvil, tablet y escritorio
- ✅ **100% gratuito**: Supabase + GitHub Pages
- ✅ **Datos separados automáticamente**: Cada agenda tiene sus propias franjas
- ✅ **Despliegue automático**: GitHub Actions despliega con cada push

## 🚀 Despliegue rápido

### 1. Crear base de datos (Supabase)
```bash
# 1. Regístrate en supabase.com
# 2. Crea un proyecto
# 3. Ejecuta el SQL de supabase_setup.sql
# 4. Copia tus credenciales:
#    - Project URL
#    - Anon key (public)
```

### 2. Configurar credenciales
Edita los archivos de configuración:
- `swimming/index.html` → CONFIG
- `association/index.html` → CONFIG

```javascript
const CONFIG = {
    supabaseUrl:  'https://your-project.supabase.co',
    supabaseKey:  'your-anon-key',
    callmebotPhone:  '34612345678',  // opcional
    callmebotApiKey: 'your-api-key', // opcional
    nombreAsociacion: 'Mi Asociación',
    actividadDefault: 'Actividad 🎉',
    tipoAgenda: 'asociacion',  // NO CAMBIAR
    adminPassword: 'tu-contraseña-admin',
};
```

### 3. Publicar en GitHub Pages
```bash
git push origin main
```

GitHub Actions desplegará automáticamente. Accede a:
- `https://your-username.github.io/agenda/`
- `https://your-username.github.io/agenda/swimming/`
- `https://your-username.github.io/agenda/association/`

## 📋 Estructura del proyecto

```
agenda/
├── index.html                      # Página principal (galería de agendas)
├── swimming/index.html             # Agenda de natación
├── association/index.html          # Agenda de asociación
├── index-old.html                  # Versión anterior de backup
├── SETUP.md                        # Guía de configuración e instalación
├── supabase_setup.sql              # Script de inicialización de DB
├── _config.yml                     # Configuración de GitHub Pages
├── .github/
│   └── workflows/
│       └── deploy.yml              # Workflow automático de despliegue
└── README.md                       # Este archivo
```

## 🔧 Arquitectura

### Base de datos (Supabase)
```sql
-- Franjas horàries
franjas:
  - id (UUID)
  - tipo_agenda ('nadar' o 'asociacion')
  - actividad (nombre de la actividad)
  - fecha (date)
  - hora_inicio (time)
  - hora_fin (time)
  - plazas_max (capacidad)
  - created_at

-- Inscripciones
inscripciones:
  - id (UUID)
  - franja_id (FK → franjas)
  - tipo_agenda (copia para filtrado rápido)
  - nombre (del participante)
  - created_at
```

### Separación de datos
Cada agenda se filtra automáticamente por su `tipo_agenda`:
- `/swimming/` → solo muestra franjas con `tipo_agenda = 'nadar'`
- `/association/` → solo muestra franjas con `tipo_agenda = 'asociacion'`

## 📱 Uso

### Para participantes
1. Abre la URL de tu agenda
2. Haz clic en la franja que quieres
3. Escribe tu nombre y confirma
4. ¡Recibirás un aviso por WhatsApp!

### Para admins
1. Haz clic en **⚙️ Admin**
2. Introduce la contraseña
3. Crea franjes o elimina las existentes
4. Los cambios se sincronizan en tiempo real

## 🔐 Seguridad

- Las RLS policies de Supabase son públicas (por confianza comunitaria)
- El panel admin está protegido por contraseña
- Los datos se guardan en Supabase (encriptados en tránsito)
- No se almacenan emails ni teléfonos (solo nombres)

## 📞 Notificaciones WhatsApp

Usa [CallMeBot](https://www.callmebot.com) para avisos automáticos:
1. Agrega el número +34 644 59 78 09 a WhatsApp
2. Envía: "I allow callmebot to send me messages"
3. Copia la API Key que recibas
4. Configura tu número y API Key en `CONFIG`

## 🤝 Contribuciones

Este proyecto es código abierto. Siéntete libre de:
- Crear forks
- Sugerir mejoras
- Reportar bugs
- Añadir nuevas agendas/características

## 📄 Licencia

MIT - Libre para usar, modificar y distribuir

## 🆘 Soporte

Consulta [SETUP.md](SETUP.md) para instrucciones detalladas.

---

Hecho con ❤️ para comunidades que organizan actividades conjuntas.
