const router = require('express').Router();
const { db } = require('../db/database');
const { verifyToken } = require('../middleware/auth');

router.post('/', verifyToken, (req, res) => {
  const { score, distance, correct_answers, total_questions, topic } = req.body;
  if (score === undefined || !topic)
    return res.status(400).json({ error: 'score y topic son requeridos' });

  const result = db.prepare(
    'INSERT INTO scores (user_id, score, distance, correct_answers, total_questions, topic) VALUES (?,?,?,?,?,?)'
  ).run(req.user.id, score, distance || 0, correct_answers || 0, total_questions || 0, topic);

  res.status(201).json({ id: result.lastInsertRowid });
});

router.get('/me', verifyToken, (req, res) => {
  const scores = db.prepare(
    'SELECT * FROM scores WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
  ).all(req.user.id);
  res.json(scores);
});

router.get('/best', verifyToken, (req, res) => {
  const best = db.prepare(
    `SELECT topic, MAX(score) as best_score, MAX(distance) as best_distance
     FROM scores WHERE user_id = ? GROUP BY topic`
  ).all(req.user.id);
  res.json(best);
});

router.get('/ranking', verifyToken, (req, res) => {
  const { topic } = req.query;
  let sql = `SELECT u.username, MAX(s.score) as best_score, s.topic
             FROM scores s JOIN users u ON s.user_id = u.id`;
  const params = [];
  if (topic) { sql += ' WHERE s.topic = ?'; params.push(topic); }
  sql += ' GROUP BY s.user_id, s.topic ORDER BY best_score DESC LIMIT 10';
  res.json(db.prepare(sql).all(...params));
});

module.exports = router;
