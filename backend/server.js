require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { seedAdmin, seedQuestions } = require('./db/database');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rutas API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/scores', require('./routes/scores'));
app.use('/api/admin', require('./routes/admin'));

// SPA fallback
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'admin.html')));
app.get('/game', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'game.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  seedAdmin();
  seedQuestions();
  console.log(`\n✓ EducaRunner corriendo en http://localhost:${PORT}`);
  console.log(`  Login: http://localhost:${PORT}`);
  console.log(`  Admin: http://localhost:${PORT}/admin\n`);
});
