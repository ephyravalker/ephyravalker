function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.status(401).json({ error: 'No autorizado. Inicia sesión primero.' });
}

module.exports = { requireAuth };
