require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const filesRoutes = require('./routes/files');
const gamesRoutes = require('./routes/games');
const aiRoutes = require('./routes/ai');
const notificationsRoutes = require('./routes/notifications');
const communityRoutes = require('./routes/community');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: [
    'https://ilouli.com',
    'https://www.ilouli.com',
    'https://ai.ilouli.com',
    'https://community.ilouli.com',
    'https://family.ilouli.com',
    'https://admin.ilouli.com',
    'https://lab.ilouli.com',
    'https://api.ilouli.com',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
