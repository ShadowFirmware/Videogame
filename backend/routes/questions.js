const router = require('express').Router();
const { db } = require('../db/database');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, (req, res) => {
  const { topic, difficulty } = req.query;
  let sql = 'SELECT id, text, option_a, option_b, option_c, topic, difficulty FROM questions WHERE 1=1';
  const params = [];
  if (topic) { sql += ' AND topic = ?'; params.push(topic); }
  if (difficulty) { sql += ' AND difficulty = ?'; params.push(difficulty); }
  sql += ' ORDER BY RANDOM() LIMIT 50';
  res.json(db.prepare(sql).all(...params));
});

router.get('/random', verifyToken, (req, res) => {
  const { topic, count = 10 } = req.query;
  const n = Math.min(parseInt(count) || 10, 50);
  let sql = 'SELECT id, text, option_a, option_b, option_c, topic, difficulty FROM questions';
  const params = [];
  if (topic) { sql += ' WHERE topic = ?'; params.push(topic); }
  sql += ' ORDER BY RANDOM() LIMIT ?';
  params.push(n);
  const questions = db.prepare(sql).all(...params);
  // Mezclar opciones pero mantener referencia a la correcta
  const full = questions.map(q => {
    const full = db.prepare('SELECT correct_option FROM questions WHERE id = ?').get(q.id);
    return { ...q, correct_option: full.correct_option };
  });
  res.json(full);
});

module.exports = router;
