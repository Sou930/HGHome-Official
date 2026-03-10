/* ═══════════════════════════════════════════════════════
   HGStudy  —  study.js
   Firebase Auth + Flashcard engine + Session management
═══════════════════════════════════════════════════════ */

// ── Firebase Config (binary-encoded) ─────────────────────
const _cfg = {
  _a: [104,116,116,112,115,58,47,47,104,103,115,116,117,100,121,45,49,56,101,50,51,45,100,101,102,97,117,108,116,45,114,116,100,98,46,97,115,105,97,45,115,111,117,116,104,101,97,115,116,49,46,102,105,114,101,98,97,115,101,100,97,116,97,98,97,115,101,46,97,112,112],
  _c: [104,103,115,116,117,100,121,45,49,56,101,50,51,46,102,105,114,101,98,97,115,101,97,112,112,46,99,111,109],
  _d: [65,73,122,97,83,121,67,102,56,80,74,89,120,67,74,67,70,67,68,49,112,104,68,95,45,88,86,85,90,57,50,68,83,86,117,82,97,117,85],
  _e: [104,103,115,116,117,100,121,45,49,56,101,50,51],
  _f: [49,58,55,50,48,49,53,48,55,49,50,55,55,53,58,119,101,98,58,54,51,50,98,50,98,100,54,102,48,52,52,49,97,56,51,100,55,52,57,101,50]
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
let currentUser    = null;
let currentSession = null;
let decks          = {};
let currentDeckId  = null;
let studyQueue     = [];
let currentCardIdx = 0;
let cardFlipped    = false;
let sessionStats   = { total: 0, again: 0, good: 0, easy: 0 };
let isEditMode     = false;

// ── Avatar helpers (ported from HGHome) ───────────────────
const AVATAR_COLORS = [
  ['#7B6CF6','#B06EF6'], ['#F5835B','#F6C344'], ['#52C4A3','#3B82F6'],
  ['#E65B9A','#F5835B'], ['#4B8DEA','#52C4A3'], ['#A068F5','#F5835B']
];
function avatarColorForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
function drawAvatarCanvas(canvas, username, imageData, size) {
  if (!canvas) return;
  const s = size || canvas.width;
  canvas.width = s; canvas.height = s;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, s, s);
  if (imageData) {
    const img = new Image();
    img.onload = function() {
      ctx.save();
      ctx.beginPath(); ctx.arc(s/2, s/2, s/2, 0, Math.PI*2); ctx.clip();
      ctx.drawImage(img, 0, 0, s, s);
      ctx.restore();
    };
    img.src = imageData;
  } else {
    const colors = avatarColorForName(username || '?');
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, colors[0]); g.addColorStop(1, colors[1]);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(s/2, s/2, s/2, 0, Math.PI*2); ctx.fill();
    const initials = (username || '?').slice(0, 2).toUpperCase();
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = `bold ${Math.round(s * 0.36)}px "IBM Plex Mono",monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(initials, s/2, s/2);
  }
}

// ── DOM ───────────────────────────────────────────────────
const dom = {
  welcomeScreen:   () => document.getElementById('welcomeScreen'),
  studyArea:       () => document.getElementById('studyArea'),
  cardsListView:   () => document.getElementById('cardsListView'),
  sessionComplete: () => document.getElementById('sessionComplete'),
  navLoginBtn:     () => document.getElementById('navLoginBtn'),
  navUserBtn:      () => document.getElementById('navUserBtn'),
  navUsername:     () => document.getElementById('navUsername'),
  navAvatarCanvas: () => document.getElementById('navAvatarCanvas'),
  acctMenu:        () => document.getElementById('acctMenu'),
  acctMenuDispName:() => document.getElementById('acctMenuDispName'),
  acctMenuUsername:() => document.getElementById('acctMenuUsername'),
  authModal:       () => document.getElementById('authModal'),
  authForm:        () => document.getElementById('authForm'),
  authTitle:       () => document.getElementById('authTitle'),
  authUsername:    () => document.getElementById('authUsername'),
  authPassword:    () => document.getElementById('authPassword'),
  authSubmitBtn:   () => document.getElementById('authSubmitBtn'),
  authSwitchText:  () => document.getElementById('authSwitchText'),
  authError:       () => document.getElementById('authError'),
  deckSelect:      () => document.getElementById('deckSelect'),
  cardFront:       () => document.getElementById('cardFront'),
  cardBack:        () => document.getElementById('cardBack'),
  cardBackArea:    () => document.getElementById('cardBackArea'),
  cardProgress:    () => document.getElementById('cardProgress'),
  progressBar:     () => document.getElementById('progressBar'),
  cardsList:       () => document.getElementById('cardsList'),
  addFront:        () => document.getElementById('addFront'),
  addBack:         () => document.getElementById('addBack'),
  toast:           () => document.getElementById('toast'),
};

// ── Nav: Account menu ─────────────────────────────────────
function toggleAcctMenu() {
  dom.acctMenu().classList.toggle('open');
}
function closeAcctMenu() {
  dom.acctMenu().classList.remove('open');
}
// Close on outside click
document.addEventListener('click', function(e) {
  const menu = dom.acctMenu();
  const btn  = dom.navUserBtn();
  if (menu && btn && !btn.contains(e.target) && !menu.contains(e.target)) {
    menu.classList.remove('open');
  }
});

// ── Profile (ported from HGHome study.js) ─────────────────
async function fetchUserProfile(username) {
  try {
    const snap = await db.ref(`users/${username}`).once('value');
    return snap.val();
  } catch(e) { return null; }
}

function openMyProfile() {
  if (!currentSession) { openAuthModal('login'); return; }
  // Show a simple profile toast / link for now — full profile view requires
  // the HGHome multi-view SPA. Here we open a minimal info modal.
  showProfileModal(currentSession);
}

// ── Minimal profile modal ─────────────────────────────────
function showProfileModal(session) {
  // Remove existing if any
  const existing = document.getElementById('profileModal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'profileModal';
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.7);
    display:flex;align-items:center;justify-content:center;z-index:999;
    backdrop-filter:blur(6px);
  `;
  overlay.innerHTML = `
    <div style="
      background:var(--bg,#0d0b14);
      border:1px solid var(--border,rgba(255,255,255,0.1));
      border-radius:16px;padding:28px;min-width:280px;max-width:340px;
      box-shadow:0 16px 48px rgba(0,0,0,0.5);position:relative;
      font-family:inherit;
    ">
      <button onclick="document.getElementById('profileModal').remove()" style="
        position:absolute;top:14px;right:14px;background:none;border:none;
        color:var(--text3,#666);font-size:18px;cursor:pointer;line-height:1;
      ">✕</button>

      <div style="display:flex;flex-direction:column;align-items:center;gap:12px;margin-bottom:20px;">
        <canvas id="profileModalAvatar" width="72" height="72" style="border-radius:50%;"></canvas>
        <div style="text-align:center;">
          <div id="profileModalDispName" style="font-weight:700;font-size:18px;color:var(--text,#fff);"></div>
          <div id="profileModalUsername" style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--text3,#666);margin-top:3px;"></div>
        </div>
      </div>

      <div id="profileModalStats" style="
        display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px;
      ">
        <div style="background:var(--card,rgba(255,255,255,0.04));border-radius:10px;padding:10px;text-align:center;">
          <div style="font-size:20px;font-weight:700;color:var(--yellow,#ffe600);" id="profileModalDecks">—</div>
          <div style="font-size:11px;color:var(--text3,#666);margin-top:2px;">デッキ数</div>
        </div>
        <div style="background:var(--card,rgba(255,255,255,0.04));border-radius:10px;padding:10px;text-align:center;">
          <div style="font-size:20px;font-weight:700;color:var(--yellow,#ffe600);" id="profileModalCards">—</div>
          <div style="font-size:11px;color:var(--text3,#666);margin-top:2px;">総カード数</div>
        </div>
      </div>

      <div id="profileModalBio" style="
        font-size:13px;color:var(--text2,#aaa);text-align:center;
        min-height:16px;margin-bottom:16px;
      "></div>

      <button onclick="document.getElementById('profileModal').remove()" style="
        width:100%;padding:10px;border-radius:8px;
        background:var(--yellow,#ffe600);color:#000;
        font-weight:700;font-size:14px;border:none;cursor:pointer;
        font-family:inherit;
      ">閉じる</button>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) overlay.remove();
  });

  // Fill avatar
  const av = localStorage.getItem('fm_avatar_' + session.username) || null;
  drawAvatarCanvas(document.getElementById('profileModalAvatar'), session.username, av, 72);
  document.getElementById('profileModalDispName').textContent = session.username;
  document.getElementById('profileModalUsername').textContent = '@' + session.username;

  // Fetch bio + stats async
  fetchUserProfile(session.username).then(profile => {
    if (profile && profile.bio) {
      document.getElementById('profileModalBio').textContent = profile.bio;
    }
    if (profile && profile.displayName) {
      document.getElementById('profileModalDispName').textContent = profile.displayName;
    }
  }).catch(() => {});

  // Count decks/cards from local decks state
  const deckCount = Object.keys(decks).length;
  const cardCount = Object.values(decks).reduce((sum, d) => {
    return sum + (d.cards ? Object.keys(d.cards).length : 0);
  }, 0);
  document.getElementById('profileModalDecks').textContent = deckCount;
  document.getElementById('profileModalCards').textContent = cardCount;
}

// ── Auth Mode ─────────────────────────────────────────────
let authMode = 'login';

function openAuthModal(mode = 'login') {
  authMode = mode;
  dom.authModal().classList.add('active');
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
    errEl.classList.add('visible'); return;
  }
  if (username.length < 3) {
    errEl.textContent = 'ユーザー名は3文字以上必要です';
    errEl.classList.add('visible'); return;
  }

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
      await db.ref(`users/${username}`).set({
        uid: cred.user.uid, username, createdAt: Date.now(), isAdmin: false, bio: '', displayName: username
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
    const email    = user.email || '';
    const username = email.replace('@hghome.app', '');
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

// ── Update nav UI ─────────────────────────────────────────
function updateNavUI() {
  if (currentSession) {
    dom.navLoginBtn().style.display = 'none';
    dom.navUserBtn().style.display  = 'flex';

    const displayName = currentSession.username + (currentSession.isAdmin ? ' [ADMIN]' : '');
    dom.navUsername().textContent = displayName;
    dom.acctMenuDispName().textContent = displayName;
    dom.acctMenuUsername().textContent = '@' + currentSession.username;

    if (currentSession.isAdmin) {
      dom.navUsername().style.color = 'var(--yellow, #ffe600)';
    }

    // Draw avatar
    const av = localStorage.getItem('fm_avatar_' + currentSession.username) || null;
    drawAvatarCanvas(dom.navAvatarCanvas(), currentSession.username, av, 24);
  } else {
    dom.navLoginBtn().style.display = '';
    dom.navUserBtn().style.display  = 'none';
  }
}

function onLogin() {
  updateNavUI();
  dom.welcomeScreen().style.display = 'none';
  loadDecks();
  showToast(`ようこそ、${currentSession.username}さん！`);
}
function onLogout() {
  updateNavUI();
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
    decks = snap.val() || {};
    refreshDeckSelect();
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
  const uid    = currentUser.uid;
  const deckId = 'deck_' + Date.now();
  const deck   = { name, cards: {}, createdAt: Date.now() };
  try {
    await db.ref(`study/${uid}/decks/${deckId}`).set(deck);
    decks[deckId]  = deck;
    currentDeckId  = deckId;
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
  const uid    = currentUser.uid;
  const cardId = 'card_' + Date.now();
  const card   = { front, back, createdAt: Date.now(), due: Date.now(), interval: 0, ease: 2.5, reps: 0 };
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
  const card = decks[currentDeckId]?.cards?.[cardId];
  if (!card) return;
  let { interval, ease, reps } = card;
  ease = ease || 2.5;
  if (rating === 1) {
    interval = 1; reps = 0;
  } else if (rating === 2) {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * ease);
    reps++;
    ease = Math.max(1.3, ease - 0.08);
  } else {
    if (reps === 0) interval = 4;
    else interval = Math.round(interval * ease * 1.3);
    reps++;
    ease = Math.min(3.0, ease + 0.15);
  }
  const due     = Date.now() + interval * 86400000;
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
    .filter(([_, c]) => c.due <= now + 300000)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([id]) => id);
  if (studyQueue.length === 0) {
    studyQueue = Object.keys(deck.cards);
  }
  for (let i = studyQueue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [studyQueue[i], studyQueue[j]] = [studyQueue[j], studyQueue[i]];
  }
  currentCardIdx = 0;
  cardFlipped    = false;
  sessionStats   = { total: studyQueue.length, again: 0, good: 0, easy: 0 };
}

function renderFlashcard() {
  const deck = decks[currentDeckId];
  if (!deck || !deck.cards || studyQueue.length === 0) { showEmptyState(); return; }
  if (currentCardIdx >= studyQueue.length) { showSessionComplete(); return; }
  const cardId = studyQueue[currentCardIdx];
  const card   = deck.cards[cardId];
  if (!card) { currentCardIdx++; renderFlashcard(); return; }

  cardFlipped = false;
  dom.cardFront().textContent = card.front;
  dom.cardBack().textContent  = card.back;
  dom.cardBackArea().style.display = 'none';
  document.querySelectorAll('.ctrl-btn').forEach(b => b.disabled = true);
  const total = studyQueue.length;
  const done  = currentCardIdx;
  dom.cardProgress().textContent  = `${done} / ${total}`;
  dom.progressBar().style.width   = `${(done / total) * 100}%`;
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
  const now   = Date.now();
  const due   = deck.cards ? Object.values(deck.cards).filter(c => c.due <= now + 300000).length : 0;
  const el    = document.getElementById('toolbarStats');
  if (el) el.innerHTML = `カード: <span>${total}</span> &nbsp; 学習中: <span>${due}</span>`;
}

// ── Deck Select change ────────────────────────────────────
window.onDeckChange = function(val) {
  currentDeckId = val;
  if (isEditMode) showEditView();
  else showStudyView();
};

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
  dom.addBack().value  = '';
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
  t.className   = 'toast' + (type ? ' ' + type : '') + ' show';
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
  link.rel   = 'manifest';
  link.href  = URL.createObjectURL(new Blob([JSON.stringify(manifest)],{type:'application/json'}));
  document.head.appendChild(link);
})();

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  dom.authForm()?.addEventListener('submit', handleAuthSubmit);
  dom.authModal()?.addEventListener('click', (e) => {
    if (e.target === dom.authModal()) closeAuthModal();
  });
  document.getElementById('flashcard')?.addEventListener('click', flipCard);
  dom.welcomeScreen().style.display = 'flex';
  dom.studyArea().classList.remove('active');

  // Expose globals
  window.openAuthModal  = openAuthModal;
  window.closeAuthModal = closeAuthModal;
  window.handleLogout   = handleLogout;
  window.openMyProfile  = openMyProfile;
  window.toggleAcctMenu = toggleAcctMenu;
  window.closeAcctMenu  = closeAcctMenu;
});
