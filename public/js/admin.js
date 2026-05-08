const API = '';
const TOPIC_NAMES = {
  variables_tipos: 'Variables y Tipos',
  estructuras_control: 'Estructuras de Control',
  funciones: 'Funciones',
  poo: 'POO',
  estructuras_datos: 'Estructuras de Datos'
};
const DIFF_LABELS = { easy: 'Fácil', medium: 'Media', hard: 'Difícil' };

let token = localStorage.getItem('token');
let currentQuestions = [];

// ---------- helpers ----------
async function apiFetch(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error');
  return data;
}

function showEl(id)  { document.getElementById(id).classList.remove('hidden'); }
function hideEl(id)  { document.getElementById(id).classList.add('hidden'); }
function esc(str)    { return String(str).replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ---------- Sección activa ----------
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    btn.classList.add('active');
    showEl('section-' + btn.dataset.section);
    if (btn.dataset.section === 'estadisticas') loadStats();
  });
});

// ---------- Login ----------
document.getElementById('admin-login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideEl('al-error');
  try {
    const data = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: document.getElementById('al-email').value, password: document.getElementById('al-pass').value })
    }).then(r => r.json());
    if (!data.token) throw new Error(data.error || 'Error');
    if (data.user.role !== 'admin') throw new Error('Solo administradores pueden acceder aquí');
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    token = data.token;
    bootPanel(data.user);
  } catch (err) {
    const el = document.getElementById('al-error');
    el.textContent = err.message;
    el.classList.remove('hidden');
  }
});

// ---------- Logout ----------
document.getElementById('admin-logout')?.addEventListener('click', () => {
  localStorage.clear();
  location.reload();
});

// ---------- Boot ----------
async function bootPanel(user) {
  hideEl('admin-login-screen');
  showEl('admin-panel');
  document.getElementById('admin-username').textContent = user.username;
  await loadQuestions();
}

// ---------- PREGUNTAS ----------
async function loadQuestions() {
  const topic = document.getElementById('filter-topic').value;
  const diff  = document.getElementById('filter-difficulty').value;
  const q     = document.getElementById('filter-search').value.trim();
  let url = `${API}/api/admin/questions?`;
  if (topic) url += `topic=${topic}&`;
  if (diff)  url += `difficulty=${diff}&`;
  if (q)     url += `search=${encodeURIComponent(q)}&`;

  document.getElementById('questions-list').innerHTML = '<div class="loading">Cargando...</div>';
  try {
    currentQuestions = await apiFetch(url);
    renderQuestions();
  } catch (e) {
    document.getElementById('questions-list').innerHTML = `<div class="loading">Error: ${esc(e.message)}</div>`;
  }
}

function renderQuestions() {
  const list = document.getElementById('questions-list');
  document.getElementById('questions-count').textContent = `${currentQuestions.length} pregunta${currentQuestions.length !== 1 ? 's' : ''} encontrada${currentQuestions.length !== 1 ? 's' : ''}`;
  if (currentQuestions.length === 0) {
    list.innerHTML = '<div class="loading">No se encontraron preguntas.</div>';
    return;
  }
  list.innerHTML = currentQuestions.map(q => `
    <div class="question-card ${q.difficulty}">
      <div class="question-meta">
        <span class="badge badge-topic">${esc(TOPIC_NAMES[q.topic] || q.topic)}</span>
        <span class="badge badge-${q.difficulty}">${esc(DIFF_LABELS[q.difficulty] || q.difficulty)}</span>
        <span style="font-size:.75rem;color:var(--text-muted)">#${q.id}</span>
      </div>
      <div class="question-text">${esc(q.text)}</div>
      <div class="question-options">
        <div class="option-item ${q.correct_option==='a' ? 'correct' : ''}">A) ${esc(q.option_a)}</div>
        <div class="option-item ${q.correct_option==='b' ? 'correct' : ''}">B) ${esc(q.option_b)}</div>
        <div class="option-item ${q.correct_option==='c' ? 'correct' : ''}">C) ${esc(q.option_c)}</div>
      </div>
      ${q.explanation ? `<div class="question-explanation">💡 ${esc(q.explanation)}</div>` : ''}
      <div class="question-actions">
        <button class="btn-edit" onclick="openEditModal(${q.id})">✏️ Editar</button>
        <button class="btn-delete" onclick="deleteQuestion(${q.id})">🗑️ Eliminar</button>
      </div>
    </div>
  `).join('');
}

document.getElementById('btn-filter').addEventListener('click', loadQuestions);
document.getElementById('filter-search').addEventListener('keydown', e => { if (e.key === 'Enter') loadQuestions(); });

// ---------- Modal CRUD ----------
function openCreateModal() {
  document.getElementById('modal-title').textContent = 'Nueva Pregunta';
  document.getElementById('form-question').reset();
  document.getElementById('q-id').value = '';
  hideEl('q-error');
  showEl('modal-question');
}

function openEditModal(id) {
  const q = currentQuestions.find(x => x.id === id);
  if (!q) return;
  document.getElementById('modal-title').textContent = 'Editar Pregunta';
  document.getElementById('q-id').value = q.id;
  document.getElementById('q-text').value = q.text;
  document.getElementById('q-a').value = q.option_a;
  document.getElementById('q-b').value = q.option_b;
  document.getElementById('q-c').value = q.option_c;
  document.getElementById('q-correct').value = q.correct_option;
  document.getElementById('q-topic').value = q.topic;
  document.getElementById('q-difficulty').value = q.difficulty;
  document.getElementById('q-explanation').value = q.explanation || '';
  hideEl('q-error');
  showEl('modal-question');
}

function closeModal() { hideEl('modal-question'); }

document.getElementById('btn-new-question').addEventListener('click', openCreateModal);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);

document.getElementById('form-question').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideEl('q-error');
  const id = document.getElementById('q-id').value;
  const body = {
    text: document.getElementById('q-text').value.trim(),
    option_a: document.getElementById('q-a').value.trim(),
    option_b: document.getElementById('q-b').value.trim(),
    option_c: document.getElementById('q-c').value.trim(),
    correct_option: document.getElementById('q-correct').value,
    topic: document.getElementById('q-topic').value,
    difficulty: document.getElementById('q-difficulty').value,
    explanation: document.getElementById('q-explanation').value.trim()
  };

  try {
    if (id) {
      await apiFetch(`${API}/api/admin/questions/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    } else {
      await apiFetch(`${API}/api/admin/questions`, { method: 'POST', body: JSON.stringify(body) });
    }
    closeModal();
    await loadQuestions();
  } catch (err) {
    const el = document.getElementById('q-error');
    el.textContent = err.message;
    el.classList.remove('hidden');
  }
});

async function deleteQuestion(id) {
  if (!confirm('¿Eliminar esta pregunta? Esta acción no se puede deshacer.')) return;
  try {
    await apiFetch(`${API}/api/admin/questions/${id}`, { method: 'DELETE' });
    await loadQuestions();
  } catch (e) {
    alert('Error al eliminar: ' + e.message);
  }
}

// ---------- CSV Upload ----------
document.getElementById('btn-upload-csv').addEventListener('click', () => showEl('modal-csv'));

document.getElementById('btn-upload-submit').addEventListener('click', async () => {
  const file = document.getElementById('csv-file').files[0];
  if (!file) return alert('Selecciona un archivo CSV');

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${API}/api/admin/questions/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    const resultEl = document.getElementById('csv-result');
    resultEl.classList.remove('hidden');
    if (data.inserted > 0) {
      resultEl.innerHTML = `<div class="form-error" style="background:var(--success-light);color:var(--success);border-color:var(--success)">
        ✅ Se insertaron ${data.inserted} preguntas correctamente.
        ${data.errors.length > 0 ? `<br><small>${data.errors.join('<br>')}</small>` : ''}
      </div>`;
      await loadQuestions();
    } else {
      resultEl.innerHTML = `<div class="form-error">❌ ${data.error || 'No se pudo insertar ninguna pregunta.'}<br><small>${(data.errors||[]).join('<br>')}</small></div>`;
    }
  } catch (e) {
    alert('Error de red: ' + e.message);
  }
});

// Descargar plantilla CSV
document.getElementById('download-template').addEventListener('click', (e) => {
  e.preventDefault();
  const csv = `text,option_a,option_b,option_c,correct_option,explanation,topic,difficulty
¿Qué tipo de dato almacena valores verdadero/falso?,int,boolean,String,b,El tipo boolean almacena true o false.,variables_tipos,easy
¿Cuántas veces ejecuta: for(i=0;i<5;i++)?,4,5,6,b,i toma valores 0 a 4 (5 iteraciones).,estructuras_control,easy`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'plantilla_preguntas.csv';
  a.click();
});

// ---------- ESTADÍSTICAS ----------
async function loadStats() {
  document.getElementById('students-list').innerHTML = '<div class="loading">Cargando...</div>';
  try {
    const data = await apiFetch(`${API}/api/admin/stats`);

    // Summary cards
    document.getElementById('stats-summary').innerHTML = `
      <div class="stat-card"><div class="stat-value">${data.students.length}</div><div class="stat-label">Estudiantes</div></div>
      <div class="stat-card"><div class="stat-value">${data.totalQuestions}</div><div class="stat-label">Preguntas en DB</div></div>
      <div class="stat-card"><div class="stat-value">${data.byTopic.reduce((s,t)=>s+t.partidas,0)}</div><div class="stat-label">Partidas totales</div></div>
    `;

    // Por tema
    const maxAvg = Math.max(...data.byTopic.map(t => t.promedio || 0), 1);
    document.getElementById('topic-stats').innerHTML = data.byTopic.length === 0
      ? '<p style="color:var(--text-muted)">Sin datos aún.</p>'
      : data.byTopic.map(t => `
        <div class="topic-stat-row">
          <span class="topic-stat-label">${esc(TOPIC_NAMES[t.topic] || t.topic)}</span>
          <div class="topic-bar-bg"><div class="topic-bar-fill" style="width:${Math.round((t.promedio/maxAvg)*100)}%"></div></div>
          <span class="topic-stat-val">${t.partidas} partidas · prom: ${t.promedio} · máx: ${t.maximo}</span>
        </div>
      `).join('');

    // Estudiantes
    document.getElementById('students-list').innerHTML = data.students.length === 0
      ? '<div class="loading">No hay estudiantes registrados.</div>'
      : data.students.map(s => `
        <div class="student-row">
          <div>
            <div class="s-name">${esc(s.username)}</div>
            <div class="s-email">${esc(s.email)}</div>
          </div>
          <div class="s-val">${s.partidas} partidas</div>
          <div class="s-val">Prom: <strong>${s.puntaje_promedio || 0}</strong></div>
          <div class="s-val">Récord: <strong>${s.mejor_puntaje || 0}</strong></div>
        </div>
      `).join('');
  } catch (e) {
    document.getElementById('students-list').innerHTML = `<div class="loading">Error: ${esc(e.message)}</div>`;
  }
}

document.getElementById('btn-refresh-stats')?.addEventListener('click', loadStats);

// ---------- Init ----------
(async () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!token || !user) {
    showEl('admin-login-screen');
    return;
  }
  if (user.role !== 'admin') {
    localStorage.clear();
    window.location.href = '/';
    return;
  }
  try {
    const me = await fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!me.ok) throw new Error('Sesión expirada');
    bootPanel(user);
  } catch {
    localStorage.clear();
    showEl('admin-login-screen');
  }
})();
