# Valker Consulting — Sitio Web con Panel de Administración (Node.js + Express)

## Requisitos
- Node.js 18 o superior

## Instalación y ejecución

```bash
npm install
npm start
```

- Sitio público: http://localhost:3000
- Panel de administración: http://localhost:3000/admin

## Acceso al panel de admin

Contraseña por defecto: **valker2026**

Para cambiarla:
```bash
ADMIN_PASSWORD=tu_contraseña_segura SESSION_SECRET=una_frase_secreta_larga npm start
```

## Funciones del sitio público

- **Historias**: sección que muestra las publicaciones que subas desde /admin.
- **Agenda de citas**: formulario con calendario (fecha + horarios de 9am-1pm y 3pm-5pm, lunes a viernes).
  Valida automáticamente que no se agenden dos citas en el mismo horario, ni en fin de semana.
  Al confirmar, se ofrece también avisar por WhatsApp con un mensaje prellenado.
- **Botones flotantes**: WhatsApp, Facebook e Instagram, fijos en la esquina inferior derecha.
  ⚠️ Actualiza los enlaces reales de Facebook e Instagram en `public/index.html`
  (busca `float-btn ig` y `float-btn fb`) — por ahora tienen URLs de ejemplo.

## Qué puedes hacer desde /admin

**Historias**
- Crear, editar y eliminar historias (título, categoría, resumen, contenido, imagen).
- Marcarlas como publicadas o dejarlas en borrador.

**Citas agendadas**
- Ver todas las citas hechas desde el sitio público (nombre, contacto, servicio, fecha/hora).
- Cambiar su estado: pendiente / confirmada / cancelada.
- Eliminarlas.

## Estructura

```
valker-app/
├── server.js
├── package.json
├── middleware/
│   └── auth.js
├── routes/
│   ├── stories.js           # API pública + CRUD de historias
│   └── appointments.js      # API pública + gestión de citas
├── data/
│   ├── stories.json
│   └── appointments.json
└── public/
    ├── index.html            # Sitio público (historias, agenda, botones flotantes)
    ├── admin.html             # Panel de administración
    ├── logo.png                # Logo real de Valker Consulting
    └── uploads/                # Imágenes subidas desde el panel de admin
```

## Notas de seguridad para producción

- Cambia `ADMIN_PASSWORD` y `SESSION_SECRET` antes de publicar el sitio.
- Sirve el sitio detrás de HTTPS.
- El almacenamiento (historias y citas) es JSON simple — suficiente para uso de una sola persona administrando. Se puede migrar a una base de datos real más adelante sin tocar el diseño del sitio.
