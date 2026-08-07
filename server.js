const express = require('express');
const session = require('express-session');
const path = require('path');
const storiesRouter = require('./routes/stories');
const appointmentsRouter = require('./routes/appointments');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'valker-consulting-secret-cambia-esto',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 8 // 8 horas
  }
}));

// API (pública + admin)
app.use('/api', storiesRouter);
app.use('/api', appointmentsRouter);

// Estáticos (HTML, logo, css, js, uploads)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Valker Consulting corriendo en http://localhost:${PORT}`);
  console.log(`Panel de administración en http://localhost:${PORT}/admin`);
});
