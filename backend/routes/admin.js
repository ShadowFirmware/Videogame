const router = require('express').Router();
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const { db } = require('../db/database');
const { verifyAdmin } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const VALID_TOPICS = ['variables_tipos', 'estructuras_control', 'funciones', 'poo', 'estructuras_datos'];
const VALID_DIFFS = ['easy', 'medium', 'hard'];

function validateQuestion(q) {
  if (!q.text || !q.option_a || !q.option_b || !q.option_c)
    return 'text, option_a, option_b, option_c son requeridos';
  if (!['a', 'b', 'c'].includes(q.correct_option))
    return 'correct_option debe ser a, b o c';
  if (!VALID_TOPICS.includes(q.topic))
    return `topic inválido. Usa: ${VALID_TOPICS.join(', ')}`;
  if (!VALID_DIFFS.includes(q.difficulty))
    return `difficulty inválida. Usa: ${VALID_DIFFS.join(', ')}`;
  return null;
}

// Listar preguntas
router.get('/questions', verifyAdmin, (req, res) => {
  const { topic, difficulty, search } = req.query;
  let sql = 'SELECT * FROM questions WHERE 1=1';
  const params = [];
  if (topic) { sql += ' AND topic = ?'; params.push(topic); }
  if (difficulty) { sql += ' AND difficulty = ?'; params.push(difficulty); }
  if (search) { sql += ' AND text LIKE ?'; params.push(`%${search}%`); }
  sql += ' ORDER BY topic, difficulty, id';
  res.json(db.prepare(sql).all(...params));
});

// Crear pregunta
router.post('/questions', verifyAdmin, (req, res) => {
  const q = req.body;
  const err = validateQuestion(q);
  if (err) return res.status(400).json({ error: err });

  const result = db.prepare(
    'INSERT INTO questions (text,option_a,option_b,option_c,correct_option,explanation,topic,difficulty) VALUES (?,?,?,?,?,?,?,?)'
  ).run(q.text, q.option_a, q.option_b, q.option_c, q.correct_option, q.explanation || '', q.topic, q.difficulty);

  res.status(201).json({ id: result.lastInsertRowid, ...q });
});

// Actualizar pregunta
router.put('/questions/:id', verifyAdmin, (req, res) => {
  const q = req.body;
  const err = validateQuestion(q);
  if (err) return res.status(400).json({ error: err });

  const result = db.prepare(
    'UPDATE questions SET text=?,option_a=?,option_b=?,option_c=?,correct_option=?,explanation=?,topic=?,difficulty=? WHERE id=?'
  ).run(q.text, q.option_a, q.option_b, q.option_c, q.correct_option, q.explanation || '', q.topic, q.difficulty, req.params.id);

  if (result.changes === 0) return res.status(404).json({ error: 'Pregunta no encontrada' });
  res.json({ id: parseInt(req.params.id), ...q });
});

// Eliminar pregunta
router.delete('/questions/:id', verifyAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Pregunta no encontrada' });
  res.json({ deleted: true });
});

// Carga masiva CSV
router.post('/questions/upload', verifyAdmin, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Archivo CSV requerido' });

  let records;
  try {
    records = parse(req.file.buffer.toString('utf8'), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true
    });
  } catch (e) {
    return res.status(400).json({ error: 'Error al parsear el CSV: ' + e.message });
  }

  const errors = [];
  const valid = [];
  records.forEach((row, i) => {
    const q = {
      text: row.text || row.pregunta || row.Pregunta,
      option_a: row.option_a || row.opcion_a,
      option_b: row.option_b || row.opcion_b,
      option_c: row.option_c || row.opcion_c,
      correct_option: (row.correct_option || row.correcta || '').toLowerCase(),
      explanation: row.explanation || row.explicacion || '',
      topic: row.topic || row.tema,
      difficulty: row.difficulty || row.dificultad || 'easy'
    };
    const err = validateQuestion(q);
    if (err) errors.push(`Fila ${i + 2}: ${err}`);
    else valid.push(q);
  });

  if (valid.length === 0)
    return res.status(400).json({ error: 'No hay preguntas válidas', errors });

  const insert = db.prepare(
    'INSERT INTO questions (text,option_a,option_b,option_c,correct_option,explanation,topic,difficulty) VALUES (?,?,?,?,?,?,?,?)'
  );
  const insertMany = db.transaction((rows) => {
    for (const q of rows) insert.run(q.text, q.option_a, q.option_b, q.option_c, q.correct_option, q.explanation, q.topic, q.difficulty);
  });
  insertMany(valid);

  res.json({ inserted: valid.length, errors });
});

// Estadísticas de estudiantes
router.get('/stats', verifyAdmin, (req, res) => {
  const students = db.prepare(
    `SELECT u.id, u.username, u.email, u.created_at,
       COUNT(s.id) as partidas,
       MAX(s.score) as mejor_puntaje,
       ROUND(AVG(s.score)) as puntaje_promedio
     FROM users u
     LEFT JOIN scores s ON s.user_id = u.id
     WHERE u.role = 'student'
     GROUP BY u.id ORDER BY mejor_puntaje DESC`
  ).all();

  const byTopic = db.prepare(
    `SELECT topic, COUNT(*) as partidas, ROUND(AVG(score)) as promedio, MAX(score) as maximo
     FROM scores GROUP BY topic ORDER BY topic`
  ).all();

  const totalQuestions = db.prepare('SELECT COUNT(*) as n FROM questions').get().n;

  res.json({ students, byTopic, totalQuestions });
});

// Listar todos los estudiantes para dropdown
router.get('/users', verifyAdmin, (req, res) => {
  res.json(db.prepare("SELECT id, username, email, created_at FROM users WHERE role='student' ORDER BY username").all());
});

module.exports = router;
