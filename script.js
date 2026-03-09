/* ═══════════════════════════════════════════════════════
   HGHome Official  —  script.js
   Firebase Auth + News CRUD + Admin + Push Notifications
═══════════════════════════════════════════════════════ */

// ── Firebase Config (binary-encoded) ─────────────────────
// Update these byte arrays with your actual Firebase config
const _cfg = {

  // databaseURL
  _a: [
104,116,116,112,115,58,47,47,104,103,115,116,117,100,121,45,49,56,101,50,51,45,100,101,102,97,117,108,116,45,114,116,100,98,46,97,115,105,97,45,115,111,117,116,104,101,97,115,116,49,46,102,105,114,101,98,97,115,101,100,97,116,97,98,97,115,101,46,97,112,112
  ],

  // (このコードでは使われてないけど残す)
  _b: [
104,103,115,116,117,100,121,45,49,56,101,50,51,45,100,101,102,97,117,108,116,45,114,116,100,98
  ],

  // authDomain / storageBucket
  _c: [
104,103,115,116,117,100,121,45,49,56,101,50,51,46,102,105,114,101,98,97,115,101,97,112,112,46,99,111,109
  ],

  // apiKey
  _d: [
65,73,122,97,83,121,67,102,56,80,74,89,120,67,74,67,70,67,68,49,112,104,68,95,45,88,86,85,90,57,50,68,83,86,117,82,97,117,85
  ],

  // projectId
  _e: [
104,103,115,116,117,100,121,45,49,56,101,50,51
  ],

  // appId
  _f: [
49,58,55,50,48,49,53,48,55,49,50,55,55,53,58,119,101,98,58,54,51,50,98,50,98,100,54,102,48,52,52,49,97,56,51,100,55,52,57,101,50
  ]
};
const _d = (b) => b.map(c => String.fromCharCode(c)).join('');
const firebaseConfig = {
  apiKey:            _d(_cfg._d),
  authDomain:        _d(_cfg._c),
  databaseURL:       _d(_cfg._a),
  projectId:         _d(_cfg._e),
  storageBucket:     _d(_cfg._c),
   messagingSenderId: "720150712775",
  appId:             _d(_cfg._f)
};

// ── Firebase Init ─────────────────────────────────────────
const app  = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.database();

// ── Session ───────────────────────────────────────────────
const SESSION_KEY    = 'hg_session';
const SESSION_KEY_LS = 'hg_session_ls';

function saveSession(data) {
  const str = JSON.stringify(data);
  try { localStorage.setItem(SESSION_KEY_LS, str); } catch(e) {}
  try { document.cookie = `${SESSION_KEY}=${encodeURIComponent(str)};path=/;max-age=2592000`; } catch(e) {}
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY_LS); } catch(e) {}
  try { document.cookie = `${SESSION_KEY}=;path=/;max-age=0`; } catch(e) {}
}

// ── App State ─────────────────────────────────────────────
let currentUser    = null;
let currentSession = null;   // { uid, username, isAdmin }
let authMode       = 'login';
let newsCategory   = 'info';
let newsUnsubscribe = null;
let _initialNewsLoaded = false;
const _pageLoadTime = Date.now();
const _seenNewsIds  = new Set();

// ── Shortcuts ─────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

// ── Auth ──────────────────────────────────────────────────
function openAuthModal(mode = 'login') {
  authMode = mode;
  $('authModal').classList.add('active');
  updateAuthModalUI();
  $('authError').classList.remove('visible');
  $('authUsername').value = '';
  $('authPassword').value = '';
  $('authUsername').focus();
}
function closeAuthModal() {
  $('authModal').classList.remove('active');
}
function updateAuthModalUI() {
  const isLogin = authMode === 'login';
  $('authTitle').textContent     = isLogin ? 'ログイン' : '新規登録';
  $('authSubmitBtn').textContent = isLogin ? '[ ログイン ]' : '[ 登録する ]';
  $('authSwitchText').innerHTML  = isLogin
    ? 'アカウントをお持ちでない方は <a onclick="switchAuthMode()">新規登録</a>'
    : 'すでにアカウントをお持ちの方は <a onclick="switchAuthMode()">ログイン</a>';
}
window.switchAuthMode = function() {
  authMode = authMode === 'login' ? 'register' : 'login';
  updateAuthModalUI();
  $('authError').classList.remove('visible');
};
window.openAuthModal  = openAuthModal;
window.closeAuthModal = closeAuthModal;

async function handleAuthSubmit(e) {
  e.preventDefault();
  const username = $('authUsername').value.trim();
  const password = $('authPassword').value;
  const errEl = $('authError');
  errEl.classList.remove('visible');
  if (!username || !password) { errEl.textContent = 'ユーザー名とパスワードを入力してください'; errEl.classList.add('visible'); return; }
  if (username.length < 3) { errEl.textContent = 'ユーザー名は3文字以上'; errEl.classList.add('visible'); return; }

  const email = `${username}@hghome.app`;
  const btn = $('authSubmitBtn');
  btn.disabled = true; btn.textContent = '...';
  try {
    if (authMode === 'login') {
      await auth.signInWithEmailAndPassword(email, password);
    } else {
      if (password.length < 6) throw new Error('パスワードは6文字以上必要です');
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      await db.ref(`users/${username}`).set({ uid: cred.user.uid, username, createdAt: Date.now(), isAdmin: false });
    }
    closeAuthModal();
  } catch(err) {
    let msg = err.message;
    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') msg = 'ユーザー名またはパスワードが違います';
    if (err.code === 'auth/email-already-in-use') msg = 'このユーザー名はすでに使われています';
    if (err.code === 'auth/weak-password') msg = 'パスワードは6文字以上にしてください';
    if (err.code === 'auth/too-many-requests') msg = 'しばらくお待ちください';
    errEl.textContent = msg; errEl.classList.add('visible');
  } finally {
    btn.disabled = false; updateAuthModalUI();
  }
}

auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    const username = (user.email || '').replace('@hghome.app', '');
    let isAdmin = false;
    try {
      const snap = await db.ref(`users/${username}`).once('value');
      const data = snap.val();
      if (data) isAdmin = !!data.isAdmin;
    } catch(e) {}
    currentSession = { uid: user.uid, username, isAdmin };
    saveSession(currentSession);
    onLoginUI();
    showToast(`ようこそ、${username}さん！`);
  } else {
    currentUser = null;
    currentSession = null;
    clearSession();
    onLogoutUI();
  }
});

function onLoginUI() {
  $('navLoginBtn').style.display = 'none';
  $('navUser').style.display = 'flex';
  const unEl = $('navUsername');
  unEl.textContent = currentSession.username + (currentSession.isAdmin ? ' [ADMIN]' : '');
  unEl.className = 'nav-username' + (currentSession.isAdmin ? ' admin' : '');
  // Show post button for admins
  document.querySelectorAll('.post-btn').forEach(b => b.classList.toggle('visible', currentSession.isAdmin));
}
function onLogoutUI() {
  $('navLoginBtn').style.display = '';
  $('navUser').style.display = 'none';
  document.querySelectorAll('.post-btn').forEach(b => b.classList.remove('visible'));
}

window.handleLogout = async function() {
  await auth.signOut();
  showToast('ログアウトしました');
};

// ── News ──────────────────────────────────────────────────
function startNewsListener() {
  if (newsUnsubscribe) newsUnsubscribe();
  const newsRef = db.ref('news').orderByChild('ts').limitToLast(20);

  newsUnsubscribe = newsRef.on('value', (snap) => {
    const raw = snap.val() || {};
    const items = Object.entries(raw)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => {
        if (b.pinned !== a.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
        return b.ts - a.ts;
      });

    // Notifications for new items (not on initial load)
    if (_initialNewsLoaded) {
      items.forEach(item => {
        if (!_seenNewsIds.has(item.id) && item.ts > _pageLoadTime) {
          triggerNotification(item);
          showNotifBanner(item);
        }
      });
    }

    // Track all seen IDs
    items.forEach(item => _seenNewsIds.add(item.id));
    _initialNewsLoaded = true;

    renderNews(items);
  });
}

function renderNews(items) {
  const grid = $('newsGrid');
  if (!grid) return;
  if (items.length === 0) {
    grid.innerHTML = '<div class="news-empty">// まだニュースはありません</div>';
    return;
  }
  grid.innerHTML = '';
  const isAdmin = currentSession?.isAdmin;
  items.forEach(item => {
    const card = document.createElement('div');
    const catClass = `cat-${item.category || 'info'}`;
    card.className = 'news-card' + (item.pinned ? ' pinned' : '') + ` category-${item.category || 'info'}`;
    card.innerHTML = `
      <div class="news-card-top">
        <span class="news-category ${catClass}">${catLabel(item.category)}</span>
        ${item.pinned ? '<span class="news-pin">📌 固定</span>' : ''}
        <span class="news-meta">${formatDate(item.ts)} · ${item.author || ''}</span>
      </div>
      <div class="news-title">${escHtml(item.title)}</div>
      <div class="news-content">${escHtml(item.content)}</div>
      ${isAdmin ? `<div class="news-card-actions"><button class="news-del-btn" onclick="deleteNews('${item.id}')">削除</button></div>` : ''}
    `;
    grid.appendChild(card);
  });
}

function catLabel(cat) {
  return { info: 'INFO', update: 'UPDATE', event: 'EVENT' }[cat] || 'INFO';
}
function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const y = d.getFullYear(), mo = d.getMonth()+1, day = d.getDate();
  const h = String(d.getHours()).padStart(2,'0'), m = String(d.getMinutes()).padStart(2,'0');
  return `${y}/${mo}/${day} ${h}:${m}`;
}

// ── Post News (Admin) ─────────────────────────────────────
window.openNewsModal = function() {
  $('newsModal').classList.add('active');
  $('newsTitle').value = '';
  $('newsContent').value = '';
  $('newsError').classList.remove('visible');
  newsCategory = 'info';
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === newsCategory));
  $('newsTitle').focus();
};
window.closeNewsModal = function() {
  $('newsModal').classList.remove('active');
};
window.selectCategory = function(cat, el) {
  newsCategory = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
};

async function handleNewsSubmit(e) {
  e.preventDefault();
  if (!currentSession?.isAdmin) return;
  const title   = $('newsTitle').value.trim();
  const content = $('newsContent').value.trim();
  const pinned  = $('newsPinned').checked;
  const errEl   = $('newsError');
  errEl.classList.remove('visible');
  if (!title || !content) { errEl.textContent = 'タイトルと内容を入力してください'; errEl.classList.add('visible'); return; }

  const btn = $('newsSubmitBtn');
  btn.disabled = true; btn.textContent = '投稿中...';
  try {
    await db.ref('news').push({
      title, content, category: newsCategory,
      author: currentSession.username,
      ts: Date.now(), pinned
    });
    closeNewsModal();
    showToast('投稿しました', 'success');
  } catch(e) {
    errEl.textContent = '投稿エラー: ' + e.message; errEl.classList.add('visible');
  } finally {
    btn.disabled = false; btn.textContent = '[ 投稿する ]';
  }
}

window.deleteNews = async function(id) {
  if (!currentSession?.isAdmin || !confirm('このニュースを削除しますか？')) return;
  try {
    await db.ref(`news/${id}`).remove();
    _seenNewsIds.delete(id);
    showToast('削除しました');
  } catch(e) {
    showToast('削除エラー: ' + e.message, 'error');
  }
};

// ── Push Notifications ────────────────────────────────────
function requestNotifPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
function triggerNotification(item) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`HGHome — ${catLabel(item.category)}`, {
        body: `${item.title}\n${item.content?.slice(0, 80) || ''}`,
        icon: '/favicon.ico',
        tag: item.id
      });
    } catch(e) {}
  }
}
function showNotifBanner(item) {
  const banner = $('notifBanner');
  if (!banner) return;
  $('notifBannerTag').textContent   = catLabel(item.category);
  $('notifBannerTitle').textContent = item.title;
  banner.classList.add('show');
  setTimeout(() => banner.classList.remove('show'), 6000);
}
window.closeNotifBanner = function() {
  $('notifBanner')?.classList.remove('show');
};

// ── Theme ─────────────────────────────────────────────────
const themes = ['dark', 'light', 'glass'];
const themeEmojis = ['🌙', '☀️', '🔮'];
let themeIdx = parseInt(localStorage.getItem('hghome_theme') || '0');
function applyTheme() {
  document.documentElement.setAttribute('data-theme', themes[themeIdx]);
  $('themeBtn').textContent = themeEmojis[themeIdx];
}
window.toggleTheme = function() {
  themeIdx = (themeIdx + 1) % themes.length;
  localStorage.setItem('hghome_theme', themeIdx);
  applyTheme();
};

// ── Toast ─────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = '') {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast' + (type ? ' ' + type : '') + ' show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Helpers ───────────────────────────────────────────────
function escHtml(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── PWA Manifest ──────────────────────────────────────────
(function() {
  const c = document.createElement('canvas');
  c.width = c.height = 192;
  const x = c.getContext('2d');
  x.fillStyle = '#060608'; x.fillRect(0,0,192,192);
  x.fillStyle = '#ffe600'; x.font = 'bold 52px monospace';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('HGHOME', 96, 96);
  const manifest = {
    name:'HGHome', short_name:'HGHome',
    description:'HGHome 公式ポータル',
    start_url:'./index.html', display:'standalone',
    background_color:'#060608', theme_color:'#ffe600',
    icons:[{src:c.toDataURL('image/png'),sizes:'192x192',type:'image/png'}]
  };
  const link = document.createElement('link');
  link.rel = 'manifest';
  link.href = URL.createObjectURL(new Blob([JSON.stringify(manifest)],{type:'application/json'}));
  document.head.appendChild(link);
})();

// ── Service Worker ────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  startNewsListener();
  requestNotifPermission();

  $('authForm')?.addEventListener('submit', handleAuthSubmit);
  $('newsForm')?.addEventListener('submit', handleNewsSubmit);

  $('authModal')?.addEventListener('click', (e) => {
    if (e.target === $('authModal')) closeAuthModal();
  });
  $('newsModal')?.addEventListener('click', (e) => {
    if (e.target === $('newsModal')) closeNewsModal();
  });
});
