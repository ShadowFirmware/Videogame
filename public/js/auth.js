const API = '';
const TOPIC_NAMES = {
  variables_tipos: 'Variables y Tipos',
  estructuras_control: 'Estructuras de Control',
  funciones: 'Funciones',
  poo: 'POO',
  estructuras_datos: 'Estructuras de Datos'
};

// ---------- UI helpers ----------
function showError(elId, msg) {
  const el = document.getElementById(elId);
  el.textContent = msg;
  el.classList.remove('hidden');
}
function hideError(elId) { document.getElementById(elId).classList.add('hidden'); }
function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  btn.querySelector('.btn-text').classList.toggle('hidden', loading);
  btn.querySelector('.btn-loader').classList.toggle('hidden', !loading);
  btn.disabled = loading;
}

// ---------- Auth ----------
async function apiPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error desconocido');
  return data;
}

async function apiGet(url, token) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error');
  return data;
}

function saveSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function getSession() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  return { token, user };
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// ---------- Dashboard ----------
async function loadDashboard(token, user) {
  document.getElementById('auth-container') && (document.querySelector('.auth-container').classList.add('hidden'));
  document.getElementById('dashboard').classList.remove('hidden');

  document.getElementById('profile-username').textContent = user.username;
  document.getElementById('profile-avatar').textContent = user.username.charAt(0).toUpperCase();

  try {
    const scores = await apiGet(`${API}/api/scores/me`, token);
    const best   = await apiGet(`${API}/api/scores/best`, token);

    document.getElementById('stat-partidas').textContent = scores.length;
    const topScore = best.reduce((m, b) => Math.max(m, b.best_score), 0);
    const topDist  = best.reduce((m, b) => Math.max(m, b.best_distance), 0);
    document.getElementById('stat-record').textContent = topScore;
    document.getElementById('stat-distancia').textContent = topDist + 'm';

    // Nivel según partidas
    const lvls = ['Principiante', 'Aprendiz', 'Intermedio', 'Avanzado', 'Experto'];
    document.getElementById('profile-level').textContent = lvls[Math.min(Math.floor(scores.length / 3), 4)];

    // Historial
    if (scores.length > 0) {
      const list = document.getElementById('history-list');
      list.innerHTML = scores.slice(0, 8).map(s => `
        <div class="history-item">
          <span class="topic-tag">${TOPIC_NAMES[s.topic] || s.topic}</span>
          <span class="score">⭐ ${s.score} pts</span>
          <span class="date">${new Date(s.created_at).toLocaleDateString('es-MX')}</span>
        </div>
      `).join('');
    }
  } catch (e) {
    console.error('Error cargando stats:', e);
  }
}

// ---------- Navegación al juego ----------
document.querySelectorAll('.topic-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const { token, user } = getSession();
    if (!token) return;
    const topic = btn.dataset.topic;
    // Guardar topic seleccionado y redirigir
    sessionStorage.setItem('selectedTopic', topic);
    sessionStorage.setItem('selectedTopicName', TOPIC_NAMES[topic]);
    window.location.href = '/game';
  });
});

// ---------- Logout ----------
document.getElementById('btn-logout')?.addEventListener('click', () => {
  clearSession();
  location.reload();
});

// ---------- Tabs ----------
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`form-${tab}`).classList.add('active');
    hideError('login-error');
    hideError('reg-error');
  });
});

// ---------- Login form ----------
document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError('login-error');
  setLoading('btn-login', true);
  try {
    const data = await apiPost(`${API}/api/auth/login`, {
      email: document.getElementById('login-email').value,
      password: document.getElementById('login-password').value
    });
    saveSession(data.token, data.user);
    if (data.user.role === 'admin') {
      window.location.href = '/admin';
    } else {
      await loadDashboard(data.token, data.user);
    }
  } catch (err) {
    showError('login-error', err.message);
  } finally {
    setLoading('btn-login', false);
  }
});

// ---------- Register form ----------
document.getElementById('form-register').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError('reg-error');
  setLoading('btn-register', true);
  try {
    const data = await apiPost(`${API}/api/auth/register`, {
      username: document.getElementById('reg-username').value,
      email: document.getElementById('reg-email').value,
      password: document.getElementById('reg-password').value
    });
    saveSession(data.token, data.user);
    await loadDashboard(data.token, data.user);
  } catch (err) {
    showError('reg-error', err.message);
  } finally {
    setLoading('btn-register', false);
  }
});

// ---------- Auto-login si hay sesión activa ----------
(async () => {
  const { token, user } = getSession();
  if (!token || !user) return;
  try {
    // Verificar que el token siga válido
    await apiGet(`${API}/api/auth/me`, token);
    if (user.role === 'admin') {
      window.location.href = '/admin';
    } else {
      await loadDashboard(token, user);
    }
  } catch {
    clearSession();
  }
})();
