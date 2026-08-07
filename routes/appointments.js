const express = require('express');
const fs = require('fs');
const path = require('path');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '..', 'data', 'appointments.json');

function readAppointments() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    return [];
  }
}

function writeAppointments(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

const VALID_SLOTS = ['09:00','10:00','11:00','12:00','13:00','15:00','16:00','17:00'];

// ================= PÚBLICO =================

// Horarios ya ocupados para una fecha dada, para deshabilitarlos en el formulario
router.get('/appointments/availability', (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Falta la fecha.' });

  const taken = readAppointments()
    .filter(a => a.date === date && a.status !== 'cancelada')
    .map(a => a.time);

  res.json({ date, taken });
});

// Crear una solicitud de cita
router.post('/appointments', (req, res) => {
  const { name, email, phone, service, date, time, message } = req.body;

  if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre es obligatorio.' });
  if (!email || !email.trim()) return res.status(400).json({ error: 'El correo es obligatorio.' });
  if (!date) return res.status(400).json({ error: 'Selecciona una fecha.' });
  if (!time || !VALID_SLOTS.includes(time)) return res.status(400).json({ error: 'Selecciona un horario válido.' });

  const selectedDate = new Date(date + 'T00:00:00');
  const today = new Date(); today.setHours(0,0,0,0);
  if (isNaN(selectedDate.getTime()) || selectedDate < today) {
    return res.status(400).json({ error: 'La fecha debe ser hoy o en el futuro.' });
  }
  const day = selectedDate.getDay();
  if (day === 0 || day === 6) {
    return res.status(400).json({ error: 'Solo agendamos citas de lunes a viernes.' });
  }

  const list = readAppointments();
  const clash = list.find(a => a.date === date && a.time === time && a.status !== 'cancelada');
  if (clash) return res.status(409).json({ error: 'Ese horario ya fue reservado. Elige otro.' });

  const appointment = {
    id: Date.now().toString(36) + Math.round(Math.random() * 1e4).toString(36),
    name: name.trim(),
    email: email.trim(),
    phone: (phone || '').trim(),
    service: (service || 'Consulta general').trim(),
    date,
    time,
    message: (message || '').trim(),
    status: 'pendiente',
    createdAt: new Date().toISOString()
  };

  list.push(appointment);
  writeAppointments(list);
  res.status(201).json(appointment);
});

// ================= ADMIN =================

router.get('/admin/appointments', requireAuth, (req, res) => {
  const list = readAppointments().sort((a, b) => {
    const da = new Date(`${a.date}T${a.time}`);
    const db = new Date(`${b.date}T${b.time}`);
    return da - db;
  });
  res.json(list);
});

router.put('/admin/appointments/:id', requireAuth, (req, res) => {
  const list = readAppointments();
  const idx = list.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Cita no encontrada.' });

  const { status } = req.body;
  if (!['pendiente', 'confirmada', 'cancelada'].includes(status)) {
    return res.status(400).json({ error: 'Estado inválido.' });
  }
  list[idx].status = status;
  writeAppointments(list);
  res.json(list[idx]);
});

router.delete('/admin/appointments/:id', requireAuth, (req, res) => {
  const list = readAppointments();
  const idx = list.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Cita no encontrada.' });

  list.splice(idx, 1);
  writeAppointments(list);
  res.json({ ok: true });
});

module.exports = router;
