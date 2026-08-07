const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '..', 'data', 'stories.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');

// ---------- helpers de datos ----------
function readStories() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    return [];
  }
}

function writeStories(stories) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(stories, null, 2), 'utf-8');
}

// ---------- subida de imágenes ----------
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
    cb(null, `story-${Date.now()}-${Math.round(Math.random() * 1e6)}${safeExt}`);
  }
});

function fileFilter(req, file, cb) {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
  cb(ok ? null : new Error('Formato de imagen no permitido'), ok);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 6 * 1024 * 1024 } // 6MB
});

// ================= PÚBLICO =================

// Listado público de historias publicadas, más nuevas primero
router.get('/stories', (req, res) => {
  const stories = readStories()
    .filter(s => s.published !== false)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(stories);
});

// ================= ADMIN AUTH =================

router.post('/admin/login', (req, res) => {
  const { password } = req.body;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'valker2026';

  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Contraseña incorrecta.' });
  }
  req.session.isAdmin = true;
  res.json({ ok: true });
});

router.post('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get('/admin/session', (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

// ================= ADMIN CRUD =================

// Todas las historias (incluye no publicadas) — requiere sesión
router.get('/admin/stories', requireAuth, (req, res) => {
  const stories = readStories().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(stories);
});

// Crear historia nueva
router.post('/admin/stories', requireAuth, upload.single('image'), (req, res) => {
  const { title, category, excerpt, content, published } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'El título es obligatorio.' });
  }

  const stories = readStories();
  const newStory = {
    id: Date.now().toString(36) + Math.round(Math.random() * 1e4).toString(36),
    title: title.trim(),
    category: (category || 'General').trim(),
    excerpt: (excerpt || '').trim(),
    content: (content || '').trim(),
    image: req.file ? `/uploads/${req.file.filename}` : null,
    published: published === 'false' ? false : true,
    createdAt: new Date().toISOString()
  };

  stories.push(newStory);
  writeStories(stories);
  res.status(201).json(newStory);
});

// Editar historia existente
router.put('/admin/stories/:id', requireAuth, upload.single('image'), (req, res) => {
  const stories = readStories();
  const idx = stories.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Historia no encontrada.' });

  const { title, category, excerpt, content, published } = req.body;
  const existing = stories[idx];

  const updated = {
    ...existing,
    title: title !== undefined ? title.trim() : existing.title,
    category: category !== undefined ? category.trim() : existing.category,
    excerpt: excerpt !== undefined ? excerpt.trim() : existing.excerpt,
    content: content !== undefined ? content.trim() : existing.content,
    published: published === undefined ? existing.published : published !== 'false',
    image: req.file ? `/uploads/${req.file.filename}` : existing.image
  };

  // borra la imagen anterior si se reemplazó
  if (req.file && existing.image) {
    const oldPath = path.join(__dirname, '..', 'public', existing.image);
    fs.unlink(oldPath, () => {});
  }

  stories[idx] = updated;
  writeStories(stories);
  res.json(updated);
});

// Eliminar historia
router.delete('/admin/stories/:id', requireAuth, (req, res) => {
  const stories = readStories();
  const idx = stories.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Historia no encontrada.' });

  const [removed] = stories.splice(idx, 1);
  if (removed.image) {
    const imgPath = path.join(__dirname, '..', 'public', removed.image);
    fs.unlink(imgPath, () => {});
  }

  writeStories(stories);
  res.json({ ok: true });
});

module.exports = router;
