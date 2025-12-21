const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ilouli-secret-key-change-in-production';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.tier !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Optional auth - doesn't require token but populates req.user if present
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }
  next();
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, tier: user.tier },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

module.exports = {
  authMiddleware,
  authenticateToken: authMiddleware,
  adminMiddleware,
  optionalAuth,
  generateToken,
  JWT_SECRET
};
