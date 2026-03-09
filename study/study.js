/* ═══════════════════════════════════════════════════════
   HGStudy  —  study.js
   Firebase Auth + Flashcard engine + Session management
═══════════════════════════════════════════════════════ */

// ── Firebase Config (binary-encoded) ─────────────────────
// Replace these bytes with your actual Firebase config values
// Each string is encoded as UTF-8 byte array for obfuscation
const _cfg = {
  // databaseURL
  _a: [
104,116,116,112,115,58,47,47,104,103,115,116,117,100,121,45,49,56,101,50,51,45,100,101,102,97,117,108,116,45,114,116,100,98,46,97,115,105,97,45,115,111,117,116,104,101,97,115,116,49,46,102,105,114,101,98,97,115,101,100,97,116,97,98,97,115,101,46,97,112,112
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
const app      = firebase.initializeApp(firebaseConfig);
const auth     = firebase.auth();
const db       = firebase.database();

// ── Session ───────────────────────────────────────────────
const SESSION_KEY = 'hg_session';
const SESSION_KEY_LS = 'hg_session_ls';

function saveSession(data) {
  const str = JSON.stringify(data);
  try {
    localStorage.setItem(SESSION_KEY_LS, str);
    document.cookie = `${SESSION_KEY}=${encodeURIComponent(str)};path=/;max-age=2592000`;
  } catch(e) {}
}
function loadSession() {
  try {
    const ls = localStorage.getItem(SESSION_KEY_LS);
    if (ls) return JSON.parse(ls);
    const m = document.cookie.match(new RegExp(`(?:^|; )${SESSION_KEY}=([^;]*)`));
    if (m) return JSON.parse(decodeURIComponent(m[1]));
  } catch(e) {}
  return null;
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY_LS); } catch(e) {}
  document.cookie = `${SESSION_KEY}=;path=/;max-age=0`;
}

// ── App State ─────────────────────────────────────────────
let currentUser = null;
let currentSession = null;  // { uid, username, isAdmin }
let decks = {};             // { deckId: { name, cards: [...] } }
let currentDeckId = null;
let studyQueue = [];
let currentCardIdx = 0;
let cardFlipped = false;
let sessionStats = { total: 0, again: 0, good: 0, easy: 0 };
let isEditMode = false;

// ── DOM ───────────────────────────────────────────────────
const dom = {
  welcomeScreen:    () => document.getElementById('welcomeScreen'),
  studyArea:        () => document.getElementById('studyArea'),
  cardsListView:    () => document.getElementById('cardsListView'),
  sessionComplete:  () => document.getElementById('sessionComplete'),
  navLoginBtn:      () => document.getElementById('navLoginBtn'),
  navUser:          () => document.getElementById('navUser'),
  navUsername:      () => document.getElementById('navUsername'),
  navLogoutBtn:     () => document.getElementById('navLogoutBtn'),
  authModal:        () => document.getElementById('authModal'),
  authForm:         () => document.getElementById('authForm'),
  authTitle:        () => document.getElementById('authTitle'),
  authUsername:     () => document.getElementById('authUsername'),
  authPassword:     () => document.getElementById('authPassword'),
  authSubmitBtn:    () => document.getElementById('authSubmitBtn'),
  authSwitchText:   () => document.getElementById('authSwitchText'),
  authError:        () => document.getElementById('authError'),
  deckSelect:       () => document.getElementById('deckSelect'),
  cardFront:        () => document.getElementById('cardFront'),
  cardBack:         () => document.getElementById('cardBack'),
  cardBackArea:     () => document.getElementById('cardBackArea'),
  cardProgress:     () => document.getElementById('cardProgress'),
  progressBar:      () => document.getElementById('progressBar'),
  cardsList:        () => document.getElementById('cardsList'),
  addFront:         () => document.getElementById('addFront'),
  addBack:          () => document.getElementById('addBack'),
  completeAgain:    () => document.getElementById('completeAgain'),
  completeGood:     () => document.getElementById('completeGood'),
  completeEasy:     () => document.getElementById('completeEasy'),
  toast:            () => document.getElementById('toast'),
};

// ── Auth Mode ─────────────────────────────────────────────
let authMode = 'login'; // 'login' | 'register'

function openAuthModal(mode = 'login') {
  authMode = mode;
  const modal = dom.authModal();
  modal.classList.add('active');
  updateAuthModalUI();
  dom.authError().classList.remove('visible');
  dom.authUsername().value = '';
  dom.authPassword().value = '';
  dom.authUsername().focus();
}
function closeAuthModal() {
  dom.authModal().classList.remove('active');
}
function updateAuthModalUI() {
  const isLogin = authMode === 'login';
  dom.authTitle().textContent     = isLogin ? 'ログイン' : '新規登録';
  dom.authSubmitBtn().textContent = isLogin ? '[ ログイン ]' : '[ 登録 ]';
  dom.authSwitchText().innerHTML  = isLogin
    ? 'アカウントをお持ちでない方は<a onclick="switchAuthMode()">こちら</a>'
    : 'すでにアカウントをお持ちの方は<a onclick="switchAuthMode()">こちら</a>';
}
window.switchAuthMode = function() {
  authMode = authMode === 'login' ? 'register' : 'login';
  updateAuthModalUI();
  dom.authError().classList.remove('visible');
};

// ── Auth Submit ───────────────────────────────────────────
async function handleAuthSubmit(e) {
  e.preventDefault();
  const username = dom.authUsername().value.trim();
  const password = dom.authPassword().value;
  const errEl = dom.authError();
  errEl.classList.remove('visible');

  if (!username || !password) {
    errEl.textContent = 'ユーザー名とパスワードを入力してください';
    errEl.classList.add('visible');
    return;
  }
  if (username.length < 3) {
    errEl.textContent = 'ユーザー名は3文字以上必要です';
    errEl.classList.add('visible');
    return;
  }

  // We use email = username@hghome.app internally
  const email = `${username}@hghome.app`;
  const submitBtn = dom.authSubmitBtn();
  submitBtn.disabled = true;
  submitBtn.textContent = '...';

  try {
    if (authMode === 'login') {
      await auth.signInWithEmailAndPassword(email, password);
    } else {
      if (password.length < 6) throw new Error('パスワードは6文字以上必要です');
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      // Write user profile
      await db.ref(`users/${username}`).set({
        uid: cred.user.uid, username, createdAt: Date.now(), isAdmin: false
      });
    }
    closeAuthModal();
  } catch(err) {
    let msg = err.message;
    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') msg = 'ユーザー名またはパスワードが違います';
    if (err.code === 'auth/email-already-in-use') msg = 'このユーザー名はすでに使われています';
    if (err.code === 'auth/weak-password') msg = 'パスワードは6文字以上にしてください';
    if (err.code === 'auth/too-many-requests') msg = 'しばらく待ってから再試行してください';
    errEl.textContent = msg;
    errEl.classList.add('visible');
  } finally {
    submitBtn.disabled = false;
    updateAuthModalUI();
  }
}

// ── Auth State Observer ───────────────────────────────────
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    const email = user.email || '';
    const username = email.replace('@hghome.app', '');
    // Fetch user record for isAdmin
    let isAdmin = false;
    try {
      const snap = await db.ref(`users/${username}`).once('value');
      const userData = snap.val();
      if (userData) isAdmin = !!userData.isAdmin;
    } catch(e) {}
    currentSession = { uid: user.uid, username, isAdmin };
    saveSession(currentSession);
    onLogin();
  } else {
    currentUser = null;
    currentSession = null;
    clearSession();
    onLogout();
  }
});

function onLogin() {
  dom.navLoginBtn().style.display = 'none';
  dom.navUser().style.display = 'flex';
  dom.navUsername().textContent = currentSession.username;
  if (currentSession.isAdmin) {
    dom.navUsername().textContent += ' [ADMIN]';
    dom.navUsername().style.color = 'var(--yellow)';
  }
  dom.welcomeScreen().style.display = 'none';
  loadDecks();
  showToast(`ようこそ、${currentSession.username}さん！`);
}
function onLogout() {
  dom.navLoginBtn().style.display = '';
  dom.navUser().style.display = 'none';
  dom.welcomeScreen().style.display = 'flex';
  dom.studyArea().classList.remove('active');
  dom.cardsListView().classList.remove('active');
  decks = {};
}

async function handleLogout() {
  await auth.signOut();
  showToast('ログアウトしました');
}

// ── Decks ─────────────────────────────────────────────────
async function loadDecks() {
  const uid = currentUser.uid;
  try {
    const snap = await db.ref(`study/${uid}/decks`).once('value');
    const data = snap.val() || {};
    decks = data;
    refreshDeckSelect();
    // If no decks, create default
    if (Object.keys(decks).length === 0) {
      await createDeck('デフォルトデッキ');
    } else {
      currentDeckId = Object.keys(decks)[0];
      showStudyView();
    }
  } catch(e) {
    showToast('デッキ読み込みエラー: ' + e.message, 'error');
  }
}

async function createDeck(name) {
  if (!currentUser) return;
  const uid = currentUser.uid;
  const deckId = 'deck_' + Date.now();
  const deck = { name, cards: {}, createdAt: Date.now() };
  try {
    await db.ref(`study/${uid}/decks/${deckId}`).set(deck);
    decks[deckId] = deck;
    currentDeckId = deckId;
    refreshDeckSelect();
    showStudyView();
    showToast(`「${name}」を作成しました`, 'success');
  } catch(e) {
    showToast('デッキ作成エラー: ' + e.message, 'error');
  }
}

async function deleteDeck(deckId) {
  if (!currentUser || !confirm(`「${decks[deckId]?.name}」を削除しますか？`)) return;
  const uid = currentUser.uid;
  try {
    await db.ref(`study/${uid}/decks/${deckId}`).remove();
    delete decks[deckId];
    currentDeckId = Object.keys(decks)[0] || null;
    refreshDeckSelect();
    if (currentDeckId) showStudyView();
    else showEmptyState();
    showToast('デッキを削除しました');
  } catch(e) {
    showToast('削除エラー: ' + e.message, 'error');
  }
}

function refreshDeckSelect() {
  const sel = dom.deckSelect();
  sel.innerHTML = '';
  Object.entries(decks).forEach(([id, deck]) => {
    const opt = document.createElement('option');
    opt.value = id; opt.textContent = deck.name;
    if (id === currentDeckId) opt.selected = true;
    sel.appendChild(opt);
  });
}

// ── Cards ─────────────────────────────────────────────────
async function addCard(front, back) {
  if (!currentUser || !currentDeckId) return;
  const uid = currentUser.uid;
  const cardId = 'card_' + Date.now();
  const card = { front, back, createdAt: Date.now(), due: Date.now(), interval: 0, ease: 2.5, reps: 0 };
  try {
    await db.ref(`study/${uid}/decks/${currentDeckId}/cards/${cardId}`).set(card);
    if (!decks[currentDeckId].cards) decks[currentDeckId].cards = {};
    decks[currentDeckId].cards[cardId] = card;
    renderCardsList();
    showToast('カードを追加しました', 'success');
  } catch(e) {
    showToast('追加エラー: ' + e.message, 'error');
  }
}

async function deleteCard(cardId) {
  if (!currentUser || !currentDeckId) return;
  const uid = currentUser.uid;
  try {
    await db.ref(`study/${uid}/decks/${currentDeckId}/cards/${cardId}`).remove();
    delete decks[currentDeckId].cards[cardId];
    renderCardsList();
    showToast('カードを削除しました');
  } catch(e) {
    showToast('削除エラー: ' + e.message, 'error');
  }
}

async function updateCardSRS(cardId, rating) {
  // SM-2 algorithm: again=1, good=2, easy=3
  const card = decks[currentDeckId]?.cards?.[cardId];
  if (!card) return;
  let { interval, ease, reps } = card;
  ease = ease || 2.5;
  if (rating === 1) { // again
    interval = 1; reps = 0;
  } else if (rating === 2) { // good
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * ease);
    reps++;
    ease = Math.max(1.3, ease - 0.08);
  } else { // easy
    if (reps === 0) interval = 4;
    else interval = Math.round(interval * ease * 1.3);
    reps++;
    ease = Math.min(3.0, ease + 0.15);
  }
  const due = Date.now() + interval * 86400000;
  const updated = { ...card, interval, ease, reps, due };
  decks[currentDeckId].cards[cardId] = updated;
  if (currentUser) {
    const uid = currentUser.uid;
    try {
      await db.ref(`study/${uid}/decks/${currentDeckId}/cards/${cardId}`)
        .update({ interval, ease, reps, due });
    } catch(e) {}
  }
}

// ── Views ─────────────────────────────────────────────────
function showStudyView() {
  dom.studyArea().classList.add('active');
  dom.cardsListView().classList.remove('active');
  dom.sessionComplete().classList.remove('active');
  isEditMode = false;
  buildStudyQueue();
  renderFlashcard();
  updateToolbarStats();
}
function showEditView() {
  dom.studyArea().classList.add('active');
  dom.cardsListView().classList.add('active');
  dom.sessionComplete().classList.remove('active');
  isEditMode = true;
  renderCardsList();
}
function showEmptyState() {
  dom.studyArea().classList.remove('active');
}
function showSessionComplete() {
  dom.studyArea().classList.add('active');
  dom.sessionComplete().classList.add('active');
  const el = dom.sessionComplete();
  el.querySelector('.complete-title').textContent = 'SESSION COMPLETE';
  el.querySelector('.complete-stats').innerHTML =
    `総数: <strong>${sessionStats.total}</strong> &nbsp;|&nbsp; ` +
    `もう一度: <strong>${sessionStats.again}</strong> &nbsp;|&nbsp; ` +
    `Good: <strong>${sessionStats.good}</strong> &nbsp;|&nbsp; ` +
    `Easy: <strong>${sessionStats.easy}</strong>`;
}

// ── Flashcard ─────────────────────────────────────────────
function buildStudyQueue() {
  const deck = decks[currentDeckId];
  if (!deck || !deck.cards) { studyQueue = []; return; }
  const now = Date.now();
  studyQueue = Object.entries(deck.cards)
    .filter(([_, c]) => c.due <= now + 300000)  // due now or soon
    .sort((a, b) => a[1].due - b[1].due)
    .map(([id]) => id);
  if (studyQueue.length === 0) {
    // All cards future: show all for review
    studyQueue = Object.keys(deck.cards);
  }
  // Shuffle
  for (let i = studyQueue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [studyQueue[i], studyQueue[j]] = [studyQueue[j], studyQueue[i]];
  }
  currentCardIdx = 0;
  cardFlipped = false;
  sessionStats = { total: studyQueue.length, again: 0, good: 0, easy: 0 };
}

function renderFlashcard() {
  const deck = decks[currentDeckId];
  if (!deck || !deck.cards || studyQueue.length === 0) {
    showEmptyState();
    return;
  }
  if (currentCardIdx >= studyQueue.length) {
    showSessionComplete();
    return;
  }
  const cardId = studyQueue[currentCardIdx];
  const card = deck.cards[cardId];
  if (!card) { currentCardIdx++; renderFlashcard(); return; }

  cardFlipped = false;
  dom.cardFront().textContent = card.front;
  dom.cardBack().textContent = card.back;
  dom.cardBackArea().style.display = 'none';

  // Update controls
  const btns = document.querySelectorAll('.ctrl-btn');
  btns.forEach(b => b.disabled = true);

  // Progress
  const total = studyQueue.length;
  const done  = currentCardIdx;
  dom.cardProgress().textContent = `${done} / ${total}`;
  dom.progressBar().style.width = `${(done / total) * 100}%`;
}

window.flipCard = function() {
  if (cardFlipped) return;
  cardFlipped = true;
  dom.cardBackArea().style.display = '';
  document.querySelectorAll('.ctrl-btn').forEach(b => b.disabled = false);
};

window.rateCard = async function(rating) {
  const cardId = studyQueue[currentCardIdx];
  if (rating === 1) sessionStats.again++;
  else if (rating === 2) sessionStats.good++;
  else sessionStats.easy++;
  await updateCardSRS(cardId, rating);
  if (rating === 1) {
    // Put back in queue
    const reinsertAt = Math.min(currentCardIdx + 3, studyQueue.length);
    studyQueue.splice(reinsertAt, 0, cardId);
  }
  currentCardIdx++;
  renderFlashcard();
};

window.restartSession = function() {
  buildStudyQueue();
  renderFlashcard();
  dom.sessionComplete().classList.remove('active');
};

// ── Edit Mode Card List ────────────────────────────────────
function renderCardsList() {
  const deck = decks[currentDeckId];
  const list = dom.cardsList();
  if (!deck || !deck.cards || Object.keys(deck.cards).length === 0) {
    list.innerHTML = '<p style="color:var(--muted);font-family:\'IBM Plex Mono\',monospace;font-size:12px;padding:16px 0;">カードがまだありません。上のフォームから追加してください。</p>';
    return;
  }
  list.innerHTML = '';
  Object.entries(deck.cards).forEach(([id, card]) => {
    const item = document.createElement('div');
    item.className = 'card-item';
    item.innerHTML = `
      <div class="card-item-body">
        <div class="card-item-front">${escHtml(card.front)}</div>
        <div class="card-item-back"><span style="color:var(--muted)">→</span> ${escHtml(card.back)}</div>
      </div>
      <button class="card-delete" onclick="deleteCard('${id}')" title="削除">✕</button>
    `;
    list.appendChild(item);
  });
}
window.deleteCard = deleteCard;

function updateToolbarStats() {
  const deck = decks[currentDeckId];
  if (!deck) return;
  const total = deck.cards ? Object.keys(deck.cards).length : 0;
  const now = Date.now();
  const due = deck.cards
    ? Object.values(deck.cards).filter(c => c.due <= now + 300000).length
    : 0;
  const el = document.getElementById('toolbarStats');
  if (el) el.innerHTML =
    `カード: <span>${total}</span> &nbsp; 学習中: <span>${due}</span>`;
}

// ── Deck Select change ────────────────────────────────────
window.onDeckChange = function(val) {
  currentDeckId = val;
  if (isEditMode) showEditView();
  else showStudyView();
};

// ── New Deck ──────────────────────────────────────────────
window.promptNewDeck = function() {
  const name = prompt('デッキ名を入力してください');
  if (name && name.trim()) createDeck(name.trim());
};

window.confirmDeleteDeck = function() {
  if (currentDeckId) deleteDeck(currentDeckId);
};

// ── Add Card Form ─────────────────────────────────────────
window.handleAddCard = function(e) {
  e.preventDefault();
  const front = dom.addFront().value.trim();
  const back  = dom.addBack().value.trim();
  if (!front || !back) { showToast('表面・裏面を入力してください', 'error'); return; }
  addCard(front, back);
  dom.addFront().value = '';
  dom.addBack().value = '';
  dom.addFront().focus();
};

// ── Toggle Edit/Study ─────────────────────────────────────
window.toggleEditMode = function() {
  if (isEditMode) showStudyView();
  else showEditView();
  updateEditToggleBtn();
};
function updateEditToggleBtn() {
  const btn = document.getElementById('editToggleBtn');
  if (!btn) return;
  btn.textContent = isEditMode ? '学習モード' : 'カード編集';
  btn.classList.toggle('active', isEditMode);
}

// ── Toast ─────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = '') {
  const t = dom.toast();
  t.textContent = msg;
  t.className = 'toast' + (type ? ' ' + type : '') + ' show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Helpers ───────────────────────────────────────────────
function escHtml(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Theme ─────────────────────────────────────────────────
const themes = ['dark', 'light'];
let themeIdx = localStorage.getItem('hgstudy_theme') === 'light' ? 1 : 0;
function applyTheme() {
  document.documentElement.setAttribute('data-theme', themes[themeIdx]);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = themeIdx === 0 ? '🌙' : '☀️';
}
window.toggleTheme = function() {
  themeIdx = (themeIdx + 1) % themes.length;
  localStorage.setItem('hgstudy_theme', themes[themeIdx]);
  applyTheme();
};
applyTheme();

// ── PWA Manifest ──────────────────────────────────────────
(function() {
  const c = document.createElement('canvas');
  c.width = c.height = 192;
  const x = c.getContext('2d');
  x.fillStyle = '#060608'; x.fillRect(0,0,192,192);
  x.fillStyle = '#ffe600'; x.font = 'bold 70px monospace';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('HGS', 96, 96);
  const manifest = {
    name:'HGStudy', short_name:'HGStudy',
    start_url:'./study.html', display:'standalone',
    background_color:'#060608', theme_color:'#ffe600',
    icons:[{src:c.toDataURL('image/png'),sizes:'192x192',type:'image/png'}]
  };
  const link = document.createElement('link');
  link.rel = 'manifest';
  link.href = URL.createObjectURL(new Blob([JSON.stringify(manifest)],{type:'application/json'}));
  document.head.appendChild(link);
})();

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Auth modal events
  dom.authForm()?.addEventListener('submit', handleAuthSubmit);
  dom.authModal()?.addEventListener('click', (e) => {
    if (e.target === dom.authModal()) closeAuthModal();
  });
  // Flashcard click to flip
  document.getElementById('flashcard')?.addEventListener('click', flipCard);
  // Show welcome screen initially until auth resolves
  dom.welcomeScreen().style.display = 'flex';
  dom.studyArea().classList.remove('active');
  // Expose globals
  window.openAuthModal = openAuthModal;
  window.closeAuthModal = closeAuthModal;
  window.handleLogout = handleLogout;
});
