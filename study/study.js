/* ═══════════════════════════════════════════════════════
   HGStudy  —  study.js  v4.2 (最適化版)
   フラッシュカード + 学習履歴 (Firebase Realtime DB)
═══════════════════════════════════════════════════════ */

// ── Firebase Config ───────────────────────────────────
const _cfg = {
  _a:[104,116,116,112,115,58,47,47,104,103,115,116,117,100,121,45,49,56,101,50,51,45,100,101,102,97,117,108,116,45,114,116,100,98,46,97,115,105,97,45,115,111,117,116,104,101,97,115,116,49,46,102,105,114,101,98,97,115,101,100,97,116,97,98,97,115,101,46,97,112,112],
  _c:[104,103,115,116,117,100,121,45,49,56,101,50,51,46,102,105,114,101,98,97,115,101,97,112,112,46,99,111,109],
  _d:[65,73,122,97,83,121,67,102,56,80,74,89,120,67,74,67,70,67,68,49,112,104,68,95,45,88,86,85,90,57,50,68,83,86,117,82,97,117,85],
  _e:[104,103,115,116,117,100,121,45,49,56,101,50,51],
  _f:[49,58,55,50,48,49,53,48,55,49,50,55,55,53,58,119,101,98,58,54,51,50,98,50,98,100,54,102,48,52,52,49,97,56,51,100,55,52,57,101,50]
};
const _d = b => b.map(c => String.fromCharCode(c)).join('');
const firebaseConfig = {
  apiKey: _d(_cfg._d), authDomain: _d(_cfg._c), databaseURL: _d(_cfg._a),
  projectId: _d(_cfg._e), storageBucket: _d(_cfg._c),
  messagingSenderId: '720150712775', appId: _d(_cfg._f)
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ── SHA-256 Hash ─────────────────────────────────────
function hashPass(pw) {
  const msg = 'hgstudy:' + pw;
  function sha256(str) {
    function rr(n, d) { return (n >>> d) | (n << (32 - d)); }
    const H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      if (c < 128) bytes.push(c);
      else if (c < 2048) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
      else bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
    const l = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (let i = 7; i >= 0; i--) bytes.push((l / Math.pow(2, i * 8)) & 0xff);
    const w = new Array(64);
    for (let i = 0; i < bytes.length / 64; i++) {
      for (let j = 0; j < 16; j++) w[j] = (bytes[i*64+j*4] << 24) | (bytes[i*64+j*4+1] << 16) | (bytes[i*64+j*4+2] << 8) | bytes[i*64+j*4+3];
      for (let j = 16; j < 64; j++) {
        const s0 = rr(w[j-15],7) ^ rr(w[j-15],18) ^ (w[j-15] >>> 3);
        const s1 = rr(w[j-2],17) ^ rr(w[j-2],19) ^ (w[j-2] >>> 10);
        w[j] = (w[j-16] + s0 + w[j-7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = [...H];
      for (let j = 0; j < 64; j++) {
        const S1 = rr(e,6) ^ rr(e,11) ^ rr(e,25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[j] + w[j]) >>> 0;
        const S0 = rr(a,2) ^ rr(a,13) ^ rr(a,22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) >>> 0;
        h=g; g=f; f=e; e=(d+t1)>>>0; d=c; c=b; b=a; a=(t1+t2)>>>0;
      }
      H[0]=(H[0]+a)>>>0; H[1]=(H[1]+b)>>>0; H[2]=(H[2]+c)>>>0; H[3]=(H[3]+d)>>>0;
      H[4]=(H[4]+e)>>>0; H[5]=(H[5]+f)>>>0; H[6]=(H[6]+g)>>>0; H[7]=(H[7]+h)>>>0;
    }
    return H.map(n => n.toString(16).padStart(8, '0')).join('');
  }
  return Promise.resolve(sha256(msg));
}

// ── Session ─────────────────────────────────────────
const SESSION_KEY = 'hg_session';
function saveSession(d) {
  const str = JSON.stringify(d);
  try { localStorage.setItem(SESSION_KEY, str); } catch(e) {}
  const exp = '; expires=' + new Date(Date.now() + 30 * 864e5).toUTCString();
  const sec = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = SESSION_KEY + '=' + encodeURIComponent(str) + exp + '; path=/; SameSite=Lax' + sec;
}
function loadSession() {
  try {
    const ls = localStorage.getItem(SESSION_KEY);
    if (ls) return JSON.parse(ls);
    const mc = document.cookie.match(/(?:^|; )hg_session=([^;]*)/);
    if (mc) return JSON.parse(decodeURIComponent(mc[1]));
  } catch(e) {}
  return null;
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch(e) {}
  document.cookie = SESSION_KEY + '=;path=/;max-age=0';
}

// ── Constants ─────────────────────────────────────────
const DECK_CATS  = ['ALL','代数','幾何','甲','乙','漢文','歴史','地理','物理','生物','英語A','英語B','ロシア語','PYTHON','C','その他'];
const CAT_COLORS = {'代数':'#F59E0B','幾何':'#10B981','甲':'#6366F1','乙':'#8B5CF6','漢文':'#EC4899','歴史':'#F97316','地理':'#14B8A6','物理':'#3B82F6','生物':'#22C55E','英語A':'#EAB308','英語B':'#F59E0B','ロシア語':'#EF4444','PYTHON':'#06B6D4','C':'#64748B','その他':'#6B7280'};
const PAGE_SIZE  = 10;

// ── State ─────────────────────────────────────────────
let currentSession = null;
let allPublicDecks = {}, allFavs = {}, deckSort = 'pop', deckCat = 'ALL';
let filteredSortedDecks = [], displayedCount = PAGE_SIZE;
let currentDeckId = null, decks = {};
let studyMode = 'normal', studyQueue = [], currentCardIdx = 0, cardFlipped = false;
let sessionStats = {total:0, again:0, good:0, easy:0};
let quizQueue = [], quizIdx = 0, quizAnswered = false, quizCorrectIdx = -1;
let quizStats = {correct:0, wrong:0, total:0};
let currentQuizChoices = [];
let quizDir = 'fb'; // 'fb' = front→back, 'bf' = back→front
let quizCombo = 0, quizMaxCombo = 0;
let quizWrongLog = []; // [{question, correct, chosen}]
let navReturn = {page:'pageStudy', subStudy:'deckBrowser'};
let currentProfileUser = null;
let editingDeckIdPage = null;
let editPageCat = '';

// ── Avatar ────────────────────────────────────────────
const AVATAR_COLORS = [['#7B6CF6','#B06EF6'],['#F5835B','#F6C344'],['#52C4A3','#3B82F6'],['#E65B9A','#F5835B'],['#4B8DEA','#52C4A3'],['#A068F5','#F5835B']];
function avatarColor(n) {
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function drawAvatar(canvas, username, imageData, size) {
  if (!canvas) return;
  const s = size || canvas.width;
  canvas.width = s; canvas.height = s;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, s, s);
  if (imageData) {
    const img = new Image();
    img.onload = () => {
      ctx.save();
      ctx.beginPath(); ctx.arc(s/2, s/2, s/2, 0, Math.PI*2); ctx.clip();
      ctx.drawImage(img, 0, 0, s, s);
      ctx.restore();
    };
    img.src = imageData;
  } else {
    const [c1, c2] = avatarColor(username || '?');
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(s/2, s/2, s/2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.font = `bold ${Math.round(s*.36)}px "JetBrains Mono",monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText((username || '?').slice(0, 2).toUpperCase(), s/2, s/2);
  }
}

// ── Helpers ───────────────────────────────────────────
const esc   = s => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const ge    = id => document.getElementById(id);
const catBg = cat => { const c = CAT_COLORS[cat] || '#6B7280'; return `background:${c}22;color:${c};`; };
const todayStr     = () => new Date().toISOString().split('T')[0];
const yesterdayStr = () => new Date(Date.now() - 86400000).toISOString().split('T')[0];
const fmtDate = ts => {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
};
const shuffle = arr => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};
function getAvatar(username) {
  return currentSession?._avatar && currentSession.username === username
    ? currentSession._avatar
    : localStorage.getItem('fm_avatar_' + username) || null;
}
function localAvatar(username, ud) {
  const av = ud?.avatar || localStorage.getItem('fm_avatar_' + username) || null;
  if (av) localStorage.setItem('fm_avatar_' + username, av);
  return av;
}

// ── Toast ─────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = '') {
  const t = ge('toast');
  t.textContent = msg;
  t.className = 'toast' + (type ? ' ' + type : '') + ' show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Theme ─────────────────────────────────────────────
let themeIdx = localStorage.getItem('hgstudy_theme') === 'dark' ? 1 : 0;
function applyTheme() {
  document.documentElement.setAttribute('data-theme', themeIdx === 0 ? 'light' : 'dark');
  const b = ge('themeToggle');
  if (b) b.textContent = themeIdx === 0 ? '🌙' : '☀️';
}
window.toggleTheme = () => {
  themeIdx = (themeIdx + 1) % 2;
  localStorage.setItem('hgstudy_theme', themeIdx === 0 ? 'light' : 'dark');
  applyTheme();
};
applyTheme();

// ══════════════════════════════════════════════════════
//  PAGE NAVIGATION
// ══════════════════════════════════════════════════════
const ALL_PAGES = ['pageStudy','pageHistory','pageRanking','pageProfile','pageDeckEdit'];

function showMainPage(pageId) {
  ALL_PAGES.forEach(id => ge(id)?.classList.toggle('active', id === pageId));
  const isMain = ['pageStudy','pageHistory','pageRanking'].includes(pageId);
  const navTabsEl = ge('navTabsWrap');
  if (navTabsEl) navTabsEl.style.display = isMain ? '' : 'none';
  ge('tabStudy').classList.toggle('on', pageId === 'pageStudy');
  ge('tabHistory').classList.toggle('on', pageId === 'pageHistory');
  ge('tabRanking').classList.toggle('on', pageId === 'pageRanking');
}

window.switchTab = function(tab) {
  if (tab === 'study') {
    navReturn.page = 'pageStudy';
    showMainPage('pageStudy');
    ge('deckBrowser').style.display = '';
    ge('studySession').style.display = 'none';
  } else if (tab === 'history') {
    navReturn.page = 'pageHistory';
    showMainPage('pageHistory');
    loadHistoryPage();
  } else if (tab === 'ranking') {
    navReturn.page = 'pageRanking';
    showMainPage('pageRanking');
    loadRankingPage();
  }
};

window.openUserProfile = function(username) {
  const active = document.querySelector('.page-view.active');
  navReturn.page = active ? active.id : 'pageStudy';
  navReturn.subStudy = ge('studySession')?.style.display !== 'none' ? 'studySession' : 'deckBrowser';
  currentProfileUser = username;
  showMainPage('pageProfile');
  renderProfilePage(username);
};
window.openMyProfile = () => {
  if (!currentSession) { openAuthModal('login'); return; }
  openUserProfile(currentSession.username);
};

window.goBackFromProfile = function() {
  showMainPage(navReturn.page);
  if (navReturn.page === 'pageStudy') {
    ge('deckBrowser').style.display = navReturn.subStudy === 'deckBrowser' ? '' : 'none';
    ge('studySession').style.display = navReturn.subStudy === 'studySession' ? '' : 'none';
  }
};

window.openDeckEditPage = function(deckId) {
  if (!currentSession) { openAuthModal('login'); return; }
  const dk = allPublicDecks[deckId];
  if (!dk || dk.owner !== currentSession.username) { showToast('権限がありません', 'error'); return; }
  editingDeckIdPage = deckId;
  navReturn.page = 'pageStudy';
  navReturn.subStudy = 'deckBrowser';
  showMainPage('pageDeckEdit');
  renderDeckEditPage(deckId);
};

window.goBackFromEdit = function() {
  showMainPage('pageStudy');
  ge('deckBrowser').style.display = '';
  ge('studySession').style.display = 'none';
  renderDeckGrid();
};

// ══════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════
function toggleAcctMenu() { ge('acctMenu').classList.toggle('open'); }
function closeAcctMenu()  { ge('acctMenu').classList.remove('open'); }
window.toggleAcctMenu = toggleAcctMenu;
window.closeAcctMenu  = closeAcctMenu;
document.addEventListener('click', e => {
  const m = ge('acctMenu'), b = ge('navUserBtn');
  if (m && b && !b.contains(e.target) && !m.contains(e.target)) m.classList.remove('open');
});

let authMode = 'login';
function openAuthModal(mode = 'login') {
  authMode = mode;
  ge('authModal').classList.add('active');
  updateAuthUI();
  ge('authError').classList.remove('visible');
  ge('authUsername').value = '';
  ge('authPassword').value = '';
  ge('authUsername').focus();
}
function closeAuthModal() { ge('authModal').classList.remove('active'); }
function updateAuthUI() {
  const isL = authMode === 'login';
  ge('authTitle').textContent = isL ? 'ログイン' : '新規登録';
  ge('authSubmitBtn').textContent = isL ? '[ ログイン ]' : '[ 登録 ]';
  ge('authSwitchText').innerHTML = isL
    ? 'アカウントをお持ちでない方は<a onclick="switchAuthMode()">こちら</a>'
    : 'すでにアカウントをお持ちの方は<a onclick="switchAuthMode()">こちら</a>';
}
window.switchAuthMode = () => { authMode = authMode === 'login' ? 'register' : 'login'; updateAuthUI(); ge('authError').classList.remove('visible'); };
window.openAuthModal  = openAuthModal;
window.closeAuthModal = closeAuthModal;

async function handleAuthSubmit(e) {
  e.preventDefault();
  const username = ge('authUsername').value.trim();
  const password = ge('authPassword').value;
  const errEl = ge('authError');
  errEl.classList.remove('visible');

  if (!username || !password)      { errEl.textContent = 'ユーザー名とパスワードを入力してください'; errEl.classList.add('visible'); return; }
  if (username.length < 3)         { errEl.textContent = 'ユーザー名は3文字以上必要です'; errEl.classList.add('visible'); return; }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) { errEl.textContent = 'ユーザー名は英数字・アンダースコアのみ'; errEl.classList.add('visible'); return; }
  if (password.length < 6)         { errEl.textContent = 'パスワードは6文字以上必要です'; errEl.classList.add('visible'); return; }

  const btn = ge('authSubmitBtn');
  btn.disabled = true; btn.textContent = '...';
  try {
    const hash = await hashPass(password);
    if (authMode === 'login') {
      const snap = await db.ref(`users/${username}`).once('value');
      const ud = snap.val();
      if (!ud || ud.hash !== hash) { errEl.textContent = 'ユーザー名またはパスワードが違います'; errEl.classList.add('visible'); return; }
      const isAdmin = !!ud.isAdmin || !!ud.isadmin || ud.role === 'admin';
      currentSession = { uid:username, username, isAdmin, displayName:ud.displayName||username };
    } else {
      const snap = await db.ref(`users/${username}`).once('value');
      if (snap.exists()) { errEl.textContent = 'このユーザー名はすでに使われています'; errEl.classList.add('visible'); return; }
      await db.ref(`users/${username}`).set({ uid:username, username, hash, displayName:username, bio:'', avatar:'', isAdmin:false, streak:0, streak_date:'', created:Date.now() });
      currentSession = { uid:username, username, isAdmin:false, displayName:username };
    }
    saveSession(currentSession);
    closeAuthModal();
    onLogin();
  } catch(err) {
    errEl.textContent = 'エラー: ' + err.message;
    errEl.classList.add('visible');
  } finally {
    btn.disabled = false;
    updateAuthUI();
  }
}

function updateNavUI() {
  const loggedIn = !!currentSession;
  ge('navLoginBtn').style.display = loggedIn ? 'none' : '';
  ge('navUserBtn').style.display  = loggedIn ? 'flex' : 'none';
  ge('createDeckBtn').style.display = loggedIn ? '' : 'none';
  if (!loggedIn) return;
  ge('navUsername').textContent = currentSession.username + (currentSession.isAdmin ? ' [ADMIN]' : '');
  ge('acctMenuDispName').textContent = currentSession.displayName || currentSession.username;
  ge('acctMenuUsername').textContent = '@' + currentSession.username;
  const av = getAvatar(currentSession.username);
  drawAvatar(ge('navAvatarCanvas'), currentSession.username, av, 28);
  drawAvatar(ge('acctMenuAvatar'),  currentSession.username, av, 40);
}

async function onLogin() {
  try {
    const snap = await db.ref(`users/${currentSession.username}`).once('value');
    const ud = snap.val() || {};
    const isAdm = !!ud.isAdmin || !!ud.isadmin || ud.role === 'admin';
    currentSession = { ...currentSession, isAdmin:isAdm, displayName:ud.displayName||currentSession.username, streak:ud.streak||0 };
    if (ud.avatar) {
      localStorage.setItem('fm_avatar_' + currentSession.username, ud.avatar);
      currentSession._avatar = ud.avatar;
    }
    saveSession(currentSession);
  } catch(e) {}
  updateNavUI();
  ge('welcomeScreen').style.display = 'none';
  ge('deckBrowser').style.display = '';
  loadAllDecks();
  requestNotifPermission();
  startNewsWatch();
  await checkStreakOnLogin();
  showToast(`ようこそ、${currentSession.username}さん！`);
  if (ge('pageHistory').classList.contains('active')) loadHistoryPage();
}

function onLogout() {
  updateNavUI();
  ge('deckBrowser').style.display   = 'none';
  ge('studySession').style.display  = 'none';
  ge('welcomeScreen').style.display = 'flex';
  allPublicDecks = {}; decks = {}; currentDeckId = null; allFavs = {}; displayedCount = PAGE_SIZE;
  renderHistoryPageContent([]);
}
window.handleLogout = () => { currentSession = null; clearSession(); onLogout(); showToast('ログアウトしました'); };

// ══════════════════════════════════════════════════════
//  LEARNING LOGS & STREAK
// ══════════════════════════════════════════════════════
async function saveStudyLog() {
  if (!currentSession || !currentDeckId) return;
  const dk = allPublicDecks[currentDeckId] || decks[currentDeckId];
  if (!dk) return;
  const correct = studyMode === '4choice' ? quizStats.correct  : sessionStats.good + sessionStats.easy;
  const total   = studyMode === '4choice' ? quizStats.total    : sessionStats.total;
  const score   = total > 0 ? Math.round(correct / total * 100) : 0;
  const log = { date:todayStr(), ts:Date.now(), deckId:currentDeckId, deckName:dk.name||'無題', mode:studyMode, correct, total, score };
  try {
    await db.ref(`logs/${currentSession.username}`).push(log);
    await updateStreak();
    if (ge('pageHistory').classList.contains('active')) loadHistoryPage();
  } catch(e) { console.error('log save error', e); }
}

async function updateStreak() {
  if (!currentSession) return;
  const today = todayStr(), yesterday = yesterdayStr();
  try {
    const snap = await db.ref(`users/${currentSession.username}`).once('value');
    const ud = snap.val() || {};
    if (ud.streak_date === today) return;
    const newStreak = ud.streak_date === yesterday ? (ud.streak || 0) + 1 : 1;
    await db.ref(`users/${currentSession.username}`).update({ streak:newStreak, streak_date:today });
    currentSession.streak = newStreak;
    saveSession(currentSession);
    updateNavUI();
  } catch(e) {}
}

async function checkStreakOnLogin() {
  if (!currentSession) return;
  const yesterday = yesterdayStr();
  try {
    const snap = await db.ref(`users/${currentSession.username}/streak_date`).once('value');
    const lastDate = snap.val();
    if (!lastDate || lastDate === todayStr() || lastDate === yesterday) return;
    await db.ref(`users/${currentSession.username}`).update({ streak:0 });
    currentSession.streak = 0;
    saveSession(currentSession);
  } catch(e) {}
}

// ══════════════════════════════════════════════════════
//  HISTORY PAGE + CALENDAR
// ══════════════════════════════════════════════════════
let _historyLogs = [];

async function loadHistoryPage() {
  const body = ge('historyPageBody');
  if (!body) return;
  if (!currentSession) { renderHistoryPageContent([]); return; }
  body.innerHTML = '<div style="padding:60px;text-align:center"><div class="spinner"></div></div>';
  try {
    const snap = await db.ref(`logs/${currentSession.username}`).orderByChild('ts').limitToLast(200).once('value');
    _historyLogs = Object.values(snap.val() || {}).sort((a, b) => b.ts - a.ts);
    renderHistoryPageContent(_historyLogs);
  } catch(e) { renderHistoryPageContent([]); }
}

function buildCalendarHTML(logs) {
  const dateMap = {};
  logs.forEach(l => { dateMap[l.date] = (dateMap[l.date] || 0) + 1; });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({length:364}, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (363 - i));
    const key = d.toISOString().split('T')[0];
    return { key, dow:d.getDay(), count:dateMap[key] || 0 };
  });
  const blanks = Array(days[0].dow).fill(null);
  const allCells = [...blanks, ...days];
  const maxCount = Math.max(1, ...Object.values(dateMap));

  function cellColor(count) {
    if (!count) return 'var(--cal-empty)';
    const r = count / maxCount;
    return r < 0.25 ? 'var(--cal-l1)' : r < 0.5 ? 'var(--cal-l2)' : r < 0.75 ? 'var(--cal-l3)' : 'var(--cal-l4)';
  }
  const weekLabels = ['日','月','火','水','木','金','土'];
  const totalWeeks = Math.ceil(allCells.length / 7);
  const gridCells = allCells.map((d, i) => {
    if (!d) return '<div class="cal-cell cal-blank"></div>';
    const tip = d.count > 0 ? `${d.key}：${d.count}セッション` : `${d.key}：なし`;
    return `<div class="cal-cell" style="background:${cellColor(d.count)}" data-tip="${tip}" data-count="${d.count}"></div>`;
  }).join('');

  return `<div class="cal-wrap">
    <div class="cal-inner">
      <div class="cal-week-labels">${weekLabels.map((l,i) => i%2===1 ? `<span>${l}</span>` : '<span></span>').join('')}</div>
      <div class="cal-grid" style="grid-template-columns:repeat(${totalWeeks},12px)">${gridCells}</div>
    </div>
    <div class="cal-legend">
      <span style="color:var(--text3);font-size:10px">少ない</span>
      <div class="cal-cell" style="background:var(--cal-empty)"></div>
      <div class="cal-cell" style="background:var(--cal-l1)"></div>
      <div class="cal-cell" style="background:var(--cal-l2)"></div>
      <div class="cal-cell" style="background:var(--cal-l3)"></div>
      <div class="cal-cell" style="background:var(--cal-l4)"></div>
      <span style="color:var(--text3);font-size:10px">多い</span>
    </div>
  </div>`;
}

const hpModeIcon  = m => m === '4choice' ? '🎯' : m === 'random' ? '🔀' : '📖';
const hpModeLabel = m => m === '4choice' ? '4択' : m === 'random' ? 'ランダム' : '通常';
function hpFmtDate(dateStr) {
  const today = todayStr(), yesterday = yesterdayStr();
  if (dateStr === today)     return '今日';
  if (dateStr === yesterday) return '昨日';
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
}
const hpScoreColor = s => s >= 80 ? 'var(--green)' : s >= 50 ? 'var(--yellow)' : '#E03030';

function renderHistoryPageContent(logs) {
  const body = ge('historyPageBody');
  if (!body) return;
  if (!currentSession) {
    body.innerHTML = `<div class="hp-page-login"><div class="hp-page-login-icon">📊</div><p>ログインして学習履歴を確認しよう</p><button class="hp-login-btn" onclick="openAuthModal('login')">ログイン</button></div>`;
    return;
  }
  const streak = currentSession.streak || 0;
  const streakColor = streak >= 7 ? '#F97316' : streak >= 3 ? '#EAB308' : 'var(--primary)';
  const totalSessions = logs.length;
  const totalCards = logs.reduce((s, l) => s + l.total, 0);
  const avgScore   = totalSessions > 0 ? Math.round(logs.reduce((s, l) => s + l.score, 0) / totalSessions) : 0;
  const grouped    = {};
  logs.forEach(l => { (grouped[l.date] = grouped[l.date] || []).push(l); });

  let html = `
    <div class="hp-section-title">📅 学習カレンダー</div>
    ${buildCalendarHTML(logs)}
    <div class="hp-page-stats">
      <div class="hp-page-streak" style="border-color:${streakColor}40;background:${streakColor}10">
        <div class="hp-page-streak-fire">🔥</div>
        <div class="hp-page-streak-num" style="color:${streakColor}">${streak}</div>
        <div class="hp-page-streak-lbl">日連続学習</div>
        <div class="hp-page-streak-note">${streak === 0 ? '今日学習してストリークを開始！' : '継続中！この調子で頑張ろう'}</div>
      </div>
      <div class="hp-page-stat-grid">
        <div class="hp-page-stat"><div class="hp-page-stat-n" style="color:var(--primary)">${totalSessions}</div><div class="hp-page-stat-l">総セッション</div></div>
        <div class="hp-page-stat"><div class="hp-page-stat-n" style="color:var(--blog)">${totalCards}</div><div class="hp-page-stat-l">総問題数</div></div>
        <div class="hp-page-stat"><div class="hp-page-stat-n" style="color:var(--green)">${avgScore}%</div><div class="hp-page-stat-l">平均正答率</div></div>
        <div class="hp-page-stat"><div class="hp-page-stat-n" style="color:#F97316">${Object.keys(grouped).length}</div><div class="hp-page-stat-l">学習日数</div></div>
      </div>
    </div>`;

  if (!logs.length) {
    html += `<div class="hp-page-empty"><div style="font-size:48px;margin-bottom:12px">📭</div><p>まだ学習履歴がありません</p><p style="font-size:12px;margin-top:6px">セッションを完了すると記録が残ります</p><button class="hp-login-btn" style="margin-top:16px" onclick="switchTab('study')">学習を始める →</button></div>`;
    body.innerHTML = html;
    return;
  }

  html += '<div class="hp-section-title">📋 学習ログ</div><div class="hp-page-list">';
  Object.entries(grouped).forEach(([date, dayLogs]) => {
    const dayAvg = Math.round(dayLogs.reduce((s, l) => s + l.score, 0) / dayLogs.length);
    html += `<div class="hp-page-date-section">
      <div class="hp-page-date-header">
        <span class="hp-page-date-label">${hpFmtDate(date)}</span>
        <span class="hp-page-date-meta">${dayLogs.length}セッション &nbsp;·&nbsp; 平均 ${dayAvg}%</span>
      </div>
      <div class="hp-page-log-list">`;
    dayLogs.forEach(l => {
      const sc = hpScoreColor(l.score);
      html += `<div class="hp-page-log-item">
        <div class="hp-page-log-icon">${hpModeIcon(l.mode)}</div>
        <div class="hp-page-log-body">
          <div class="hp-page-log-deck">${esc(l.deckName)}</div>
          <div class="hp-page-log-detail">
            <span class="hp-page-log-tag">${hpModeLabel(l.mode)}</span>
            <span class="hp-page-log-qa">${l.correct}/${l.total}問正解</span>
          </div>
          <div class="hp-page-score-bar-wrap"><div class="hp-page-score-bar" style="width:${Math.min(100,l.score)}%;background:${sc}"></div></div>
        </div>
        <div class="hp-page-log-score" style="color:${sc}">${l.score}<span style="font-size:10px;opacity:.7">%</span></div>
      </div>`;
    });
    html += '</div></div>';
  });
  html += '</div>';
  body.innerHTML = html;

  body.querySelectorAll('.cal-cell[data-tip]').forEach(cell => {
    cell.addEventListener('mouseenter', () => {
      const tip = document.createElement('div');
      tip.className = 'cal-tooltip'; tip.textContent = cell.dataset.tip;
      document.body.appendChild(tip);
      const r = cell.getBoundingClientRect();
      tip.style.left = (r.left + r.width/2 - tip.offsetWidth/2) + 'px';
      tip.style.top  = (r.top - tip.offsetHeight - 6 + window.scrollY) + 'px';
      cell._tip = tip;
    });
    cell.addEventListener('mouseleave', () => { cell._tip?.remove(); cell._tip = null; });
  });
}

// ══════════════════════════════════════════════════════
//  RANKING PAGE
// ══════════════════════════════════════════════════════
let _rankingTab  = 'cards';
let _rankingData = null;

window.switchRankingTab = function(tab) {
  _rankingTab = tab;
  ['cards','score','streak'].forEach(t => {
    ge(`rtab${t.charAt(0).toUpperCase()+t.slice(1)}`)?.classList.toggle('on', t === tab);
  });
  renderRankingList();
};

async function loadRankingPage() {
  const body = ge('rankingBody');
  if (!body) return;
  body.innerHTML = '<div style="padding:60px;text-align:center"><div class="spinner"></div></div>';
  try {
    const [usersSnap, logsSnap] = await Promise.all([
      db.ref('users').once('value'),
      db.ref('logs').once('value')
    ]);
    const users   = usersSnap.val() || {};
    const allLogs = logsSnap.val() || {};
    _rankingData = Object.entries(users).map(([username, ud]) => {
      const userLogs   = Object.values(allLogs[username] || {});
      const sessions   = userLogs.length;
      const totalCards = userLogs.reduce((s, l) => s + (l.total || 0), 0);
      const avgScore   = sessions > 0 ? Math.round(userLogs.reduce((s, l) => s + (l.score || 0), 0) / sessions) : 0;
      return { username, displayName:ud.displayName||username, avatar:localAvatar(username,ud), totalCards, sessions, avgScore, streak:ud.streak||0 };
    }).filter(u => u.sessions > 0 || u.streak > 0);
    renderRankingList();
  } catch(e) {
    body.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text3)">読み込みエラー: ${esc(e.message)}</div>`;
  }
}

function renderRankingList() {
  const body = ge('rankingBody');
  if (!body || !_rankingData) return;
  let sorted = [..._rankingData];
  let valueKey, valueFmt, valueLabel, valueColor;
  if (_rankingTab === 'cards') {
    sorted.sort((a, b) => b.totalCards - a.totalCards);
    valueKey = 'totalCards'; valueFmt = v => `${v}問`; valueLabel = '総カード数'; valueColor = 'var(--primary)';
  } else if (_rankingTab === 'score') {
    sorted = sorted.filter(u => u.sessions >= 3).sort((a, b) => b.avgScore - a.avgScore);
    valueKey = 'avgScore'; valueFmt = v => `${v}%`; valueLabel = '平均正答率（3セッション以上）'; valueColor = 'var(--green)';
  } else {
    sorted.sort((a, b) => b.streak - a.streak);
    valueKey = 'streak'; valueFmt = v => `${v}日`; valueLabel = '連続学習日数'; valueColor = '#F97316';
  }
  sorted = sorted.filter(u => u[valueKey] > 0).slice(0, 50);
  if (!sorted.length) {
    body.innerHTML = '<div class="ranking-empty"><div style="font-size:48px;margin-bottom:12px">📭</div><p>まだデータがありません</p></div>';
    return;
  }
  const maxVal  = sorted[0][valueKey] || 1;
  const medals  = ['🥇','🥈','🥉'];
  body.innerHTML = `<div class="ranking-list-wrap">
    <div class="ranking-list-label">${valueLabel}</div>
    <div class="ranking-list">
      ${sorted.map((u, i) => {
        const rank  = i + 1;
        const isMe  = currentSession && u.username === currentSession.username;
        const pct   = Math.round((u[valueKey] / maxVal) * 100);
        const medal = rank <= 3 ? medals[rank-1] : `${rank}`;
        return `<div class="ranking-item${isMe ? ' ranking-item-me' : ''}" id="ri_${u.username}">
          <div class="ranking-rank${rank<=3?' ranking-rank-medal':''}">${medal}</div>
          <canvas class="ranking-avatar" id="rav_${u.username}" width="36" height="36"></canvas>
          <div class="ranking-info">
            <div class="ranking-name">
              <span class="ranking-dispname" onclick="openUserProfile('${esc(u.username)}')">${esc(u.displayName)}</span>
              <span class="ranking-username">@${esc(u.username)}</span>
              ${isMe ? '<span class="ranking-me-badge">YOU</span>' : ''}
            </div>
            <div class="ranking-bar-wrap"><div class="ranking-bar" style="width:${pct}%;background:${valueColor}"></div></div>
          </div>
          <div class="ranking-value" style="color:${valueColor}">${valueFmt(u[valueKey])}</div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
  sorted.forEach(u => drawAvatar(ge(`rav_${u.username}`), u.username, u.avatar, 36));
}

// ══════════════════════════════════════════════════════
//  DECK BROWSER
// ══════════════════════════════════════════════════════
function initCatFilter() {
  const wrap = ge('catScroll');
  if (!wrap) return;
  wrap.innerHTML = DECK_CATS.map(c => `<button class="cat-pill${c==='ALL'?' on':''}" onclick="setDeckCat('${c}')">${c}</button>`).join('');
}

window.setDeckCat = function(cat) {
  deckCat = cat; displayedCount = PAGE_SIZE;
  document.querySelectorAll('.cat-pill').forEach(b => b.classList.toggle('on', b.textContent === cat));
  renderDeckGrid();
};
window.setDeckSort = function(sort) {
  deckSort = sort; displayedCount = PAGE_SIZE;
  ge('sortPopBtn').classList.toggle('on', sort === 'pop');
  ge('sortNewBtn').classList.toggle('on', sort === 'new');
  renderDeckGrid();
};

async function loadAllDecks() {
  try {
    const [dSnap, cSnap] = await Promise.all([
      db.ref('decks').once('value'),
      db.ref('cards').once('value')
    ]);
    const rawDecks = dSnap.val() || {}, rawCards = cSnap.val() || {};
    allPublicDecks = {};
    for (const [id, dk] of Object.entries(rawDecks)) {
      allPublicDecks[id] = {
        ...dk,
        name: dk.name || '', desc: dk.desc || '',
        owner: dk.author || dk.uid || dk.owner || '',
        cat: dk.tag || dk.cat || '',
        createdAt: dk.ct || dk.createdAt || 0,
        favCount: dk.fc || dk.favCount || 0,
        viewCount: dk.viewCount || dk.vc || 0,
        cardCount: dk.cc || dk.cardCount || 0,
        cards: {}
      };
    }
    for (const [deckId, deckCards] of Object.entries(rawCards)) {
      if (!allPublicDecks[deckId] || !deckCards || typeof deckCards !== 'object') continue;
      let cnt = 0;
      for (const [cardId, card] of Object.entries(deckCards)) {
        if (!card || typeof card !== 'object') continue;
        allPublicDecks[deckId].cards[cardId] = {
          front: card.f || card.front || '', back: card.b || card.back || '',
          deckId, due: card.due || Date.now(), interval: card.interval || 0, ease: card.ease || 2.5, reps: card.reps || 0
        };
        cnt++;
      }
      allPublicDecks[deckId].cardCount = cnt;
    }
    if (currentSession) {
      decks = {};
      for (const [id, dk] of Object.entries(allPublicDecks)) {
        if (dk.owner === currentSession.username) decks[id] = dk;
      }
      const fSnap = await db.ref(`favs/${currentSession.username}`).once('value');
      allFavs = fSnap.val() || {};
    }
    renderDeckGrid();
  } catch(e) { showToast('読み込みエラー: ' + e.message, 'error'); }
}

function renderDeckGrid() {
  let list = Object.entries(allPublicDecks);
  if (deckCat !== 'ALL') list = list.filter(([, d]) => d.cat === deckCat);
  if (deckSort === 'pop') {
    list.sort((a, b) => ((b[1].favCount||0)*2 + (b[1].viewCount||0)) - ((a[1].favCount||0)*2 + (a[1].viewCount||0)));
  } else {
    list.sort((a, b) => (b[1].createdAt||0) - (a[1].createdAt||0));
  }
  filteredSortedDecks = list;
  const total = list.length;
  if (ge('deckCountBadge')) ge('deckCountBadge').textContent = total;
  if (ge('deckHeroCount'))  ge('deckHeroCount').textContent  = total;
  const grid = ge('deckGrid');
  if (!grid) return;
  if (!total) { grid.innerHTML = '<div class="deck-empty"><div class="empty-emoji">📭</div><p>デッキがまだありません</p></div>'; return; }
  const shown = list.slice(0, displayedCount), remaining = total - shown.length;
  grid.innerHTML = shown.map(([id, dk]) => deckCardHTML(id, dk)).join('');
  if (remaining > 0) {
    const lm = document.createElement('div');
    lm.className = 'load-more-wrap';
    lm.innerHTML = `<button class="load-more-btn" onclick="loadMoreDecks()">もっと読み込む（残り${remaining}件）</button>`;
    grid.appendChild(lm);
  }
}

function deckCardHTML(id, dk) {
  const isMine  = currentSession && dk.owner === currentSession.username;
  const isFav   = !!allFavs[id];
  const cnt     = dk.cardCount || 0, favCnt = dk.favCount || 0, viewCnt = dk.viewCount || 0;
  const tagHtml = dk.cat ? `<span class="dc-tag" style="${catBg(dk.cat)}">${esc(dk.cat)}</span>` : '<span></span>';
  return `<div class="deck-card-new" id="dcard_${id}">
    <div class="dc-card-top">${tagHtml}
      ${isMine ? `<div class="dc-owner-btns">
        <button class="dc-action-mini" onclick="openDeckEditPage('${id}')">✏️ 編集</button>
        <button class="dc-action-mini danger" onclick="deleteDeckDirect('${id}')">🗑️</button>
      </div>` : ''}
    </div>
    <div class="dc-title-new">${esc(dk.name || '無題')}</div>
    ${dk.desc ? `<div class="dc-desc-new">${esc(dk.desc)}</div>` : ''}
    <div class="dc-meta-new">
      <span class="dc-author-new" onclick="openUserProfile('${esc(dk.owner||'')}')">@${esc(dk.owner||'')}</span>
      <span>📇 ${cnt}枚</span><span>⭐ ${favCnt}</span><span>👁 ${viewCnt}</span>
      <span>${fmtDate(dk.createdAt)}</span>
    </div>
    <div class="dc-actions-new">
      <button class="study-start-btn-new" onclick="showStudyModeModal('${id}')">▶ 学習する</button>
      <button class="fav-btn-new${isFav ? ' on' : ''}" id="favbtn_${id}" onclick="toggleFav('${id}')">
        ${isFav ? '★' : '☆'} ${favCnt}
      </button>
    </div>
  </div>`;
}

window.loadMoreDecks = function() {
  displayedCount += PAGE_SIZE;
  const grid = ge('deckGrid');
  if (!grid) return;
  grid.querySelector('.load-more-wrap')?.remove();
  const newSlice  = filteredSortedDecks.slice(displayedCount - PAGE_SIZE, displayedCount);
  newSlice.forEach(([id, dk]) => grid.insertAdjacentHTML('beforeend', deckCardHTML(id, dk)));
  const remaining = filteredSortedDecks.length - displayedCount;
  if (remaining > 0) {
    const lm = document.createElement('div');
    lm.className = 'load-more-wrap';
    lm.innerHTML = `<button class="load-more-btn" onclick="loadMoreDecks()">もっと読み込む（残り${remaining}件）</button>`;
    grid.appendChild(lm);
  }
};

window.toggleFav = async function(deckId) {
  if (!currentSession) { openAuthModal('login'); return; }
  const me = currentSession.username, was = !!allFavs[deckId], dk = allPublicDecks[deckId];
  if (!dk) return;
  if (was) {
    delete allFavs[deckId];
    dk.favCount = Math.max(0, (dk.favCount || 1) - 1);
    await db.ref(`favs/${me}/${deckId}`).remove();
  } else {
    allFavs[deckId] = true;
    dk.favCount = (dk.favCount || 0) + 1;
    await db.ref(`favs/${me}/${deckId}`).set(true);
  }
  await db.ref(`decks/${deckId}/fc`).set(dk.favCount);
  const btn = ge('favbtn_' + deckId);
  if (btn) { btn.className = 'fav-btn-new' + (was ? '' : ' on'); btn.innerHTML = `${was ? '☆' : '★'} ${dk.favCount}`; }
};

window.deleteDeckDirect = async function(deckId) {
  if (!currentSession) return;
  const dk = allPublicDecks[deckId];
  if (!dk || dk.owner !== currentSession.username) { showToast('権限がありません', 'error'); return; }
  if (!confirm(`「${dk.name}」を削除しますか？カードも全て削除されます。`)) return;
  try {
    await Promise.all([db.ref(`cards/${deckId}`).remove(), db.ref(`decks/${deckId}`).remove()]);
    delete allPublicDecks[deckId]; delete decks[deckId];
    renderDeckGrid(); showToast('デッキを削除しました');
  } catch(e) { showToast('削除エラー: ' + e.message, 'error'); }
};

// ── デッキ作成モーダル ─────────────────────────────────
let dmSelectedCat = '';
window.openCreateDeckModal = function() {
  if (!currentSession) { openAuthModal('login'); return; }
  ge('dmName').value = ''; ge('dmDesc').value = ''; dmSelectedCat = '';
  document.querySelectorAll('.dm-cat-btn').forEach(b => b.classList.toggle('on', b.textContent === dmSelectedCat));
  ge('deckModal').classList.add('open');
};
window.closeDeckModal = () => ge('deckModal').classList.remove('open');
window.dmToggleCat = function(cat) {
  dmSelectedCat = dmSelectedCat === cat ? '' : cat;
  document.querySelectorAll('.dm-cat-btn').forEach(b => b.classList.toggle('on', b.textContent === dmSelectedCat));
};
window.saveDeckFromModal = async function() {
  if (!currentSession) return;
  const name = ge('dmName').value.trim();
  if (!name) { showToast('タイトルを入力してください', 'error'); return; }
  const btn = ge('dmSaveBtn');
  btn.disabled = true; btn.textContent = '保存中...';
  try {
    const deckId = 'dk_' + Math.random().toString(36).slice(2, 12);
    const dk = { name, desc:ge('dmDesc').value.trim(), tag:dmSelectedCat, author:currentSession.username, uid:currentSession.username, ct:Date.now(), ut:Date.now(), fc:0, vc:0, cc:0 };
    await db.ref(`decks/${deckId}`).set(dk);
    allPublicDecks[deckId] = { ...dk, owner:currentSession.username, cat:dmSelectedCat, createdAt:dk.ct, favCount:0, viewCount:0, cardCount:0, cards:{} };
    decks[deckId] = allPublicDecks[deckId];
    ge('deckModal').classList.remove('open');
    showToast(`「${name}」を作成しました`, 'success');
    renderDeckGrid();
    openDeckEditPage(deckId);
  } catch(e) { showToast('エラー: ' + e.message, 'error'); }
  finally { btn.disabled = false; btn.textContent = '💾 保存する'; }
};
function initDmCats() {
  const dm = ge('dmCats');
  if (!dm) return;
  dm.innerHTML = DECK_CATS.filter(c => c !== 'ALL').map(c => `<button class="dm-cat-btn" onclick="dmToggleCat('${c}')">${c}</button>`).join('');
}

// ══════════════════════════════════════════════════════
//  STUDY MODE MODAL
// ══════════════════════════════════════════════════════
window.showStudyModeModal = function(deckId) {
  currentDeckId = deckId;
  const dk = allPublicDecks[deckId];
  if (!dk) return;
  ge('modeModalDeckName').textContent = dk.name || '無題';
  const cnt = dk.cardCount || Object.keys(dk.cards || {}).length;
  ge('modeModalCardCount').textContent = `${cnt}枚`;
  const mode4 = ge('mode4Btn');
  if (mode4) { mode4.disabled = cnt < 4; mode4.title = cnt < 4 ? '4枚以上のカードが必要です' : ''; }
  ge('studyModeModal').classList.add('open');
};
window.closeStudyModeModal = () => ge('studyModeModal').classList.remove('open');

window.startStudyWithMode = function(mode) {
  closeStudyModeModal();
  studyMode = mode;
  if (!decks[currentDeckId]) decks[currentDeckId] = allPublicDecks[currentDeckId];
  _launchStudy(currentDeckId);
};

function _launchStudy(deckId) {
  currentDeckId = deckId;
  const dk = allPublicDecks[deckId];
  if (!dk) return;

  // viewCount をまとめて更新
  db.ref(`decks/${deckId}`).once('value').then(s => {
    const v = s.val() || {};
    db.ref(`decks/${deckId}`).update({ viewCount:(v.viewCount||0)+1, vc:(v.vc||0)+1 }).catch(()=>{});
  }).catch(()=>{});

  ge('deckBrowser').style.display = 'none';
  ge('studySession').style.display = '';
  ge('sessDeckName').textContent = dk.name || '無題';
  ge('cardsListView').classList.remove('active');
  ge('sessionComplete').classList.remove('active');
  ge('studyArea')?.classList.add('active');
  const editBtn = ge('editDeckBtn');
  if (editBtn) editBtn.style.display = (currentSession && dk.owner === currentSession.username) ? '' : 'none';

  const flashArea = ge('flashcardArea'), quizArea = ge('quizArea');
  db.ref(`cards/${deckId}`).once('value').then(snap => {
    const raw = snap.val() || {};
    if (!decks[deckId]) decks[deckId] = { ...dk };
    decks[deckId].cards = {};
    for (const [cid, card] of Object.entries(raw)) {
      if (!card || typeof card !== 'object') continue;
      decks[deckId].cards[cid] = {
        front: card.f || card.front || '', back: card.b || card.back || '',
        deckId, due: card.due || Date.now(), interval: card.interval || 0, ease: card.ease || 2.5, reps: card.reps || 0
      };
    }
    if (allPublicDecks[deckId]) allPublicDecks[deckId].cards = decks[deckId].cards;
    if (studyMode === '4choice') {
      if (flashArea) flashArea.style.display = 'none';
      if (quizArea)  quizArea.style.display = 'block';
      buildQuizQueue(); renderQuizCard();
    } else {
      if (flashArea) flashArea.style.display = '';
      if (quizArea)  quizArea.style.display = 'none';
      buildStudyQueue(); renderFlashcard();
    }
  }).catch(e => showToast('カードの読み込みに失敗しました: ' + e.message, 'error'));
}

window.backToBrowser = function() {
  ge('studySession').style.display = 'none';
  ge('deckBrowser').style.display = '';
  currentDeckId = null;
};

// ══════════════════════════════════════════════════════
//  FLASHCARD (通常・ランダム)
// ══════════════════════════════════════════════════════
function buildStudyQueue() {
  const d = decks[currentDeckId];
  if (!d?.cards || !Object.keys(d.cards).length) { studyQueue = []; return; }
  const now = Date.now();
  if (studyMode === 'random') {
    studyQueue = shuffle(Object.keys(d.cards));
  } else {
    studyQueue = Object.entries(d.cards)
      .filter(([, c]) => c.due <= now + 300000)
      .sort((a, b) => a[1].due - b[1].due)
      .map(([id]) => id);
    if (!studyQueue.length) studyQueue = Object.keys(d.cards);
    shuffle(studyQueue);
  }
  currentCardIdx = 0; cardFlipped = false;
  sessionStats = { total:studyQueue.length, again:0, good:0, easy:0 };
}

function renderFlashcard() {
  const d = decks[currentDeckId];
  if (!d) return;
  if (!d.cards || !Object.keys(d.cards).length) { showEditViewInSession(); return; }
  if (!studyQueue.length || currentCardIdx >= studyQueue.length) { showSessionComplete(); return; }
  const cardId = studyQueue[currentCardIdx], card = d.cards[cardId];
  if (!card) { currentCardIdx++; renderFlashcard(); return; }
  cardFlipped = false;
  ge('cardFront').textContent = card.front;
  ge('cardBack').textContent  = card.back;
  ge('cardBackArea').style.display = 'none';
  document.querySelectorAll('.ctrl-btn').forEach(b => b.disabled = true);
  ge('cardProgress').textContent = `${currentCardIdx} / ${studyQueue.length}`;
  ge('progressBar').style.width  = `${(currentCardIdx / studyQueue.length) * 100}%`;
}

function showEditViewInSession() {
  ge('cardsListView').classList.add('active');
  ge('sessionComplete').classList.remove('active');
  renderCardsList();
}

function showSessionComplete() {
  saveStudyLog();
  const statsEl = ge('sessionComplete').querySelector('.complete-stats');
  if (studyMode === '4choice') {
    ge('quizArea').style.display = 'none';
    const acc = Math.round(quizStats.correct / Math.max(1, quizStats.total) * 100);
    let wrongReview = '';
    if (quizWrongLog.length > 0) {
      wrongReview = `<div class="quiz-wrong-review">
        <div class="quiz-wrong-review-title">間違えた問題（${quizWrongLog.length}問）</div>
        ${quizWrongLog.map(w => `
          <div class="quiz-wrong-item">
            <div class="quiz-wrong-q">${esc(w.question)}</div>
            <div class="quiz-wrong-detail">
              <span class="quiz-wrong-correct">✓ ${esc(w.correct)}</span>
              <span class="quiz-wrong-chosen">✗ ${esc(w.chosen)}</span>
            </div>
          </div>`).join('')}
      </div>`;
    }
    statsEl.innerHTML = `
      <div class="quiz-final-stats">
        <div class="quiz-final-item"><span class="quiz-final-num green">${quizStats.correct}</span><span class="quiz-final-lbl">正解</span></div>
        <div class="quiz-final-item"><span class="quiz-final-num red">${quizStats.wrong}</span><span class="quiz-final-lbl">不正解</span></div>
        <div class="quiz-final-item"><span class="quiz-final-num">${acc}%</span><span class="quiz-final-lbl">正答率</span></div>
        <div class="quiz-final-item"><span class="quiz-final-num yellow">${quizMaxCombo}</span><span class="quiz-final-lbl">最大コンボ</span></div>
      </div>
      ${wrongReview}`;
  } else {
    statsEl.innerHTML = `完了: <strong>${sessionStats.total}</strong>枚`;
  }
  ge('sessionComplete').classList.add('active');
  ge('cardsListView').classList.remove('active');
}

window.flipCard = function() {
  if (cardFlipped) return;
  cardFlipped = true;
  ge('cardBackArea').style.display = 'flex';
  document.querySelectorAll('.ctrl-btn').forEach(b => b.disabled = false);
};

window.rateCard = async function(rating, dir) {
  const fc = ge('flashcard');
  const cardId = studyQueue[currentCardIdx];
  sessionStats.good++;
  if (fc && dir) {
    fc.classList.add(dir === 'right' ? 'swiping-right' : 'swiping-left');
    await new Promise(r => setTimeout(r, 200));
    fc.classList.remove('swiping-right', 'swiping-left');
  }
  await updateCardSRS(cardId, rating);
  currentCardIdx++;
  renderFlashcard();
};

window.restartSession = function() {
  ge('sessionComplete').classList.remove('active');
  const flashArea = ge('flashcardArea'), quizArea = ge('quizArea');
  if (studyMode === '4choice') {
    if (flashArea) flashArea.style.display = 'none';
    if (quizArea)  quizArea.style.display = 'block';
    buildQuizQueue(); renderQuizCard();
  } else {
    if (flashArea) flashArea.style.display = '';
    if (quizArea)  quizArea.style.display = 'none';
    buildStudyQueue(); renderFlashcard();
  }
};

async function updateCardSRS(cardId, rating) {
  const card = decks[currentDeckId]?.cards?.[cardId];
  if (!card) return;
  let { interval, ease, reps } = card;
  ease = ease || 2.5;
  if (rating === 1) {
    interval = 1; reps = 0;
  } else if (rating === 2) {
    interval = reps === 0 ? 1 : reps === 1 ? 6 : Math.round(interval * ease);
    reps++; ease = Math.max(1.3, ease - 0.08);
  } else {
    interval = reps === 0 ? 4 : Math.round(interval * ease * 1.3);
    reps++; ease = Math.min(3.0, ease + 0.15);
  }
  const due = Date.now() + interval * 86400000;
  decks[currentDeckId].cards[cardId] = { ...card, interval, ease, reps, due };
  if (currentSession) await db.ref(`cards/${currentDeckId}/${cardId}`).update({ interval, ease, reps, due }).catch(()=>{});
}

function renderCardsList() {
  const d = decks[currentDeckId], list = ge('cardsList');
  if (!d?.cards || !Object.keys(d.cards).length) {
    list.innerHTML = '<p style="color:var(--text3);font-size:12px;padding:16px 0">カードがまだありません。</p>';
    return;
  }
  list.innerHTML = Object.entries(d.cards).map(([id, card]) => `
    <div class="card-item">
      <div class="card-item-body">
        <div class="card-item-front">${esc(card.front)}</div>
        <div class="card-item-back">→ ${esc(card.back)}</div>
      </div>
      <button class="card-delete" onclick="deleteCardSession('${id}')">✕</button>
    </div>`).join('');
}

window.handleAddCard = function(e) {
  e.preventDefault();
  const front = ge('addFront').value.trim(), back = ge('addBack').value.trim();
  if (!front || !back) { showToast('表面・裏面を入力してください', 'error'); return; }
  addCardToSession(front, back);
  ge('addFront').value = ''; ge('addBack').value = ''; ge('addFront').focus();
};

async function addCardToSession(front, back) {
  if (!currentSession || !currentDeckId) return;
  const cardId = 'c_' + Math.random().toString(36).slice(2, 10);
  const card   = { f:front, b:back, due:Date.now(), interval:0, ease:2.5, reps:0 };
  try {
    await db.ref(`cards/${currentDeckId}/${cardId}`).set(card);
    const nc = (decks[currentDeckId].cardCount || 0) + 1;
    await db.ref(`decks/${currentDeckId}/cc`).set(nc);
    if (!decks[currentDeckId].cards) decks[currentDeckId].cards = {};
    decks[currentDeckId].cards[cardId] = { front, back, deckId:currentDeckId, ...card };
    decks[currentDeckId].cardCount = nc;
    if (allPublicDecks[currentDeckId]) allPublicDecks[currentDeckId] = decks[currentDeckId];
    renderCardsList(); showToast('カードを追加しました', 'success');
  } catch(e) { showToast('追加エラー: ' + e.message, 'error'); }
}

window.deleteCardSession = async function(cardId) {
  if (!currentSession || !currentDeckId) return;
  try {
    await db.ref(`cards/${currentDeckId}/${cardId}`).remove();
    const nc = Math.max(0, (decks[currentDeckId].cardCount || 1) - 1);
    await db.ref(`decks/${currentDeckId}/cc`).set(nc);
    delete decks[currentDeckId].cards[cardId];
    decks[currentDeckId].cardCount = nc;
    renderCardsList(); showToast('カードを削除しました');
  } catch(e) { showToast('削除エラー: ' + e.message, 'error'); }
};

// ══════════════════════════════════════════════════════
//  4択クイズ
// ══════════════════════════════════════════════════════
window.setQuizDir = function(dir) {
  quizDir = dir;
  ge('quizDirFB')?.classList.toggle('on', dir === 'fb');
  ge('quizDirBF')?.classList.toggle('on', dir === 'bf');
};

function buildQuizQueue() {
  const d = decks[currentDeckId] || allPublicDecks[currentDeckId];
  if (!d?.cards) { quizQueue = []; return; }
  const ids = Object.keys(d.cards).filter(k => { const c = d.cards[k]; return c?.front && c?.back; });
  quizQueue = shuffle(ids);
  quizIdx = 0; quizAnswered = false;
  quizStats = { correct:0, wrong:0, total:quizQueue.length };
  quizCombo = 0; quizMaxCombo = 0; quizWrongLog = [];
  decks[currentDeckId] = d;
  _updateQuizScoreUI();
}

function _updateQuizScoreUI() {
  const scoreNum = ge('quizScoreNum');
  if (scoreNum) scoreNum.textContent = quizStats.correct;
  const comboBox = ge('quizComboBox');
  const comboNum = ge('quizComboNum');
  if (comboBox && comboNum) {
    if (quizCombo >= 2) {
      comboBox.style.display = '';
      comboNum.textContent = quizCombo;
    } else {
      comboBox.style.display = 'none';
    }
  }
}

function renderQuizCard() {
  const d = decks[currentDeckId] || allPublicDecks[currentDeckId];
  if (!d) { showToast('デッキが見つかりません', 'error'); return; }
  if (!quizQueue.length) { buildQuizQueue(); if (!quizQueue.length) { showSessionComplete(); return; } }
  if (quizIdx >= quizQueue.length) { showSessionComplete(); return; }
  const cardId = quizQueue[quizIdx], card = d.cards[cardId];
  if (!card) { quizIdx++; renderQuizCard(); return; }
  quizAnswered = false;

  // 問題文と選択肢の方向
  const qText   = quizDir === 'fb' ? card.front  : card.back;
  const ansText = quizDir === 'fb' ? card.back   : card.front;
  const qLabel  = quizDir === 'fb' ? '問題（表）' : '問題（裏）';

  const allCards = Object.values(d.cards).filter(c => c?.front && c?.back && c !== card);
  const wrongChoices = shuffle(allCards).slice(0, 3);
  const choices = shuffle([card, ...wrongChoices]);
  currentQuizChoices = choices;
  quizCorrectIdx = choices.indexOf(card);

  // progress
  const pct = (quizIdx / quizQueue.length) * 100;
  const pb = ge('quizProgressBar');
  if (pb) { pb.style.transition = 'none'; pb.style.width = pct + '%'; requestAnimationFrame(() => { pb.style.transition = 'width .4s ease'; }); }
  if (ge('quizProgress')) ge('quizProgress').textContent = `${quizIdx+1} / ${quizQueue.length}`;
  if (ge('quizQLabel'))   ge('quizQLabel').textContent   = qLabel;

  // question card entrance animation
  const qCard = ge('quizQuestionCard');
  if (qCard) { qCard.classList.remove('quiz-card-enter'); void qCard.offsetWidth; qCard.classList.add('quiz-card-enter'); }
  if (ge('quizQuestion')) ge('quizQuestion').textContent = qText;

  // reset result & next
  const resultEl = ge('quizResult'), nextBtn = ge('quizNextBtn');
  if (resultEl) { resultEl.innerHTML = ''; resultEl.className = 'quiz-result'; }
  if (nextBtn)  nextBtn.style.display = 'none';

  // render choices with entrance animation
  const choicesEl = ge('quizChoices');
  if (choicesEl) {
    choicesEl.innerHTML = choices.map((c, i) => {
      const label = quizDir === 'fb' ? c.back : c.front;
      return `<button class="quiz-choice quiz-choice-enter" style="animation-delay:${i*55}ms" onclick="selectQuizAnswer(${i})">
        <span class="quiz-choice-key">${i+1}</span>${esc(label)}
      </button>`;
    }).join('');
  }
  _updateQuizScoreUI();
}

window.selectQuizAnswer = function(choiceIdx) {
  if (quizAnswered) return;
  quizAnswered = true;
  const isCorrect = choiceIdx === quizCorrectIdx;
  const d = decks[currentDeckId] || allPublicDecks[currentDeckId];
  const cardId = quizQueue[quizIdx];
  const card = d?.cards?.[cardId];

  document.querySelectorAll('.quiz-choice').forEach((btn, i) => {
    btn.disabled = true;
    btn.querySelector('.quiz-choice-key')?.remove();
    if (i === quizCorrectIdx) btn.classList.add('correct');
    if (i === choiceIdx && !isCorrect) btn.classList.add('wrong');
  });

  const result = ge('quizResult');
  if (isCorrect) {
    quizStats.correct++;
    quizCombo++;
    if (quizCombo > quizMaxCombo) quizMaxCombo = quizCombo;
    if (result) {
      const combo = quizCombo >= 3 ? ` <span class="quiz-combo-badge">${quizCombo}連続！🔥</span>` : '';
      result.innerHTML = `✓ 正解！${combo}`;
      result.className = 'quiz-result correct-msg';
    }
    // 問題カードに正解エフェクト
    ge('quizQuestionCard')?.classList.add('quiz-card-correct');
    setTimeout(() => ge('quizQuestionCard')?.classList.remove('quiz-card-correct'), 500);
  } else {
    quizStats.wrong++;
    quizCombo = 0;
    const correctLabel = quizDir === 'fb'
      ? currentQuizChoices[quizCorrectIdx]?.back
      : currentQuizChoices[quizCorrectIdx]?.front;
    const chosenLabel = quizDir === 'fb'
      ? currentQuizChoices[choiceIdx]?.back
      : currentQuizChoices[choiceIdx]?.front;
    if (result) {
      result.innerHTML = `✗ 不正解 &nbsp;<span class="quiz-wrong-ans">正解: ${esc(correctLabel||'')}</span>`;
      result.className = 'quiz-result wrong-msg';
    }
    // 間違えた問題を記録
    if (card) quizWrongLog.push({ question: quizDir === 'fb' ? card.front : card.back, correct: correctLabel||'', chosen: chosenLabel||'' });
    // シェイクアニメーション
    ge('quizQuestionCard')?.classList.add('quiz-card-wrong');
    setTimeout(() => ge('quizQuestionCard')?.classList.remove('quiz-card-wrong'), 500);
  }

  _updateQuizScoreUI();
  const nextBtn = ge('quizNextBtn');
  if (nextBtn) nextBtn.style.display = '';
};

window.nextQuizCard = function() { quizIdx++; renderQuizCard(); };

// キーボードショートカット
document.addEventListener('keydown', e => {
  const qa = ge('quizArea');
  if (!qa || qa.style.display === 'none') return;
  if (['1','2','3','4'].includes(e.key)) {
    const idx = parseInt(e.key) - 1;
    const btns = document.querySelectorAll('.quiz-choice');
    if (btns[idx] && !btns[idx].disabled) { btns[idx].click(); }
  }
  if (e.key === 'Enter') {
    const nb = ge('quizNextBtn');
    if (nb && nb.style.display !== 'none') nb.click();
  }
});

// ══════════════════════════════════════════════════════
//  DECK EDIT PAGE
// ══════════════════════════════════════════════════════
async function renderDeckEditPage(deckId) {
  const dk = allPublicDecks[deckId];
  if (!dk) return;
  ge('editPageDeckName').value = dk.name || '';
  ge('editPageDesc').value     = dk.desc || '';
  editPageCat = dk.cat || '';
  ge('editPageCats').innerHTML = DECK_CATS.filter(c => c !== 'ALL').map(c =>
    `<button class="dm-cat-btn${dk.cat===c?' on':''}" onclick="editPageToggleCat('${c}')">${c}</button>`
  ).join('');
  renderEditPageCards(deckId);
}

window.editPageToggleCat = function(cat) {
  editPageCat = editPageCat === cat ? '' : cat;
  document.querySelectorAll('#editPageCats .dm-cat-btn').forEach(b => b.classList.toggle('on', b.textContent === editPageCat));
};

window.saveEditPageDeck = async function() {
  if (!currentSession || !editingDeckIdPage) return;
  const name = ge('editPageDeckName').value.trim();
  if (!name) { showToast('タイトルを入力してください', 'error'); return; }
  const btn = ge('editPageSaveBtn');
  btn.disabled = true; btn.textContent = '保存中...';
  try {
    const updates = { name, desc:ge('editPageDesc').value.trim(), tag:editPageCat, ut:Date.now() };
    await db.ref(`decks/${editingDeckIdPage}`).update(updates);
    if (allPublicDecks[editingDeckIdPage]) {
      Object.assign(allPublicDecks[editingDeckIdPage], { name:updates.name, desc:updates.desc, cat:updates.tag });
    }
    showToast('デッキを保存しました', 'success');
  } catch(e) { showToast('保存エラー: ' + e.message, 'error'); }
  finally { btn.disabled = false; btn.textContent = '💾 保存'; }
};

function renderEditPageCards(deckId) {
  const dk    = allPublicDecks[deckId];
  if (!dk) return;
  const cards = dk.cards || {};
  const cnt   = Object.keys(cards).length;
  ge('editPageCardCount').textContent = `${cnt}枚`;
  const list = ge('editPageCardList');
  if (!cnt) { list.innerHTML = '<p style="color:var(--text3);font-size:13px;padding:16px 0;text-align:center">カードがまだありません</p>'; return; }
  list.innerHTML = Object.entries(cards).map(([cid, c]) => `
    <div class="ep-card-item" id="epc_${cid}">
      <div class="ep-card-display" id="epcd_${cid}">
        <div class="ep-card-texts">
          <div class="ep-card-front">${esc(c.front)}</div>
          <div class="ep-card-arrow">→</div>
          <div class="ep-card-back">${esc(c.back)}</div>
        </div>
        <div class="ep-card-btns">
          <button class="ep-btn edit" onclick="startEditCard('${deckId}','${cid}')">✏️</button>
          <button class="ep-btn del"  onclick="deleteEditPageCard('${deckId}','${cid}')">✕</button>
        </div>
      </div>
      <div class="ep-card-editor" id="epce_${cid}" style="display:none">
        <input class="dm-add-input" id="epf_${cid}" value="${esc(c.front)}" placeholder="表面">
        <input class="dm-add-input" id="epb_${cid}" value="${esc(c.back)}"  placeholder="裏面">
        <div style="display:flex;gap:6px;margin-top:6px">
          <button class="dm-add-btn" onclick="saveEditCard('${deckId}','${cid}')">保存</button>
          <button style="padding:7px 12px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);color:var(--text2);font-size:12px;font-weight:700;cursor:pointer;" onclick="cancelEditCard('${cid}')">キャンセル</button>
        </div>
      </div>
    </div>`).join('');
}

window.startEditCard  = (deckId, cid) => { ge(`epcd_${cid}`).style.display = 'none'; ge(`epce_${cid}`).style.display = ''; ge(`epf_${cid}`).focus(); };
window.cancelEditCard = cid          => { ge(`epcd_${cid}`).style.display = '';     ge(`epce_${cid}`).style.display = 'none'; };

window.saveEditCard = async function(deckId, cid) {
  const front = (ge(`epf_${cid}`)?.value || '').trim(), back = (ge(`epb_${cid}`)?.value || '').trim();
  if (!front || !back) { showToast('表面・裏面を入力してください', 'error'); return; }
  try {
    await db.ref(`cards/${deckId}/${cid}`).update({ f:front, b:back });
    if (allPublicDecks[deckId]?.cards?.[cid]) { allPublicDecks[deckId].cards[cid].front = front; allPublicDecks[deckId].cards[cid].back = back; }
    if (decks[deckId]?.cards?.[cid])          { decks[deckId].cards[cid].front = front; decks[deckId].cards[cid].back = back; }
    renderEditPageCards(deckId); showToast('カードを更新しました', 'success');
  } catch(e) { showToast('更新エラー: ' + e.message, 'error'); }
};

window.deleteEditPageCard = async function(deckId, cid) {
  if (!confirm('このカードを削除しますか？')) return;
  try {
    await db.ref(`cards/${deckId}/${cid}`).remove();
    const nc = Math.max(0, (allPublicDecks[deckId].cardCount || 1) - 1);
    await db.ref(`decks/${deckId}/cc`).set(nc);
    delete allPublicDecks[deckId].cards[cid]; allPublicDecks[deckId].cardCount = nc;
    if (decks[deckId]) { delete decks[deckId].cards[cid]; decks[deckId].cardCount = nc; }
    renderEditPageCards(deckId); showToast('カードを削除しました');
  } catch(e) { showToast('削除エラー: ' + e.message, 'error'); }
};

window.addEditPageCard = async function() {
  if (!currentSession || !editingDeckIdPage) return;
  const front = (ge('epAddFront')?.value || '').trim(), back = (ge('epAddBack')?.value || '').trim();
  if (!front || !back) { showToast('表面と裏面を入力してください', 'error'); return; }
  const cardId = 'c_' + Math.random().toString(36).slice(2, 10);
  const card   = { f:front, b:back, due:Date.now(), interval:0, ease:2.5, reps:0 };
  try {
    await db.ref(`cards/${editingDeckIdPage}/${cardId}`).set(card);
    const nc = (allPublicDecks[editingDeckIdPage].cardCount || 0) + 1;
    await db.ref(`decks/${editingDeckIdPage}/cc`).set(nc);
    if (!allPublicDecks[editingDeckIdPage].cards) allPublicDecks[editingDeckIdPage].cards = {};
    allPublicDecks[editingDeckIdPage].cards[cardId] = { front, back, deckId:editingDeckIdPage, ...card };
    allPublicDecks[editingDeckIdPage].cardCount = nc;
    if (decks[editingDeckIdPage]) decks[editingDeckIdPage] = allPublicDecks[editingDeckIdPage];
    ge('epAddFront').value = ''; ge('epAddBack').value = ''; ge('epAddFront').focus();
    renderEditPageCards(editingDeckIdPage); showToast('カードを追加しました', 'success');
  } catch(e) { showToast('追加エラー: ' + e.message, 'error'); }
};

window.deleteEditPageDeck = async function() {
  if (!editingDeckIdPage || !currentSession) return;
  const dk = allPublicDecks[editingDeckIdPage];
  if (!dk || dk.owner !== currentSession.username) { showToast('権限がありません', 'error'); return; }
  if (!confirm(`「${dk.name}」を削除しますか？カードも全て削除されます。`)) return;
  try {
    await Promise.all([db.ref(`cards/${editingDeckIdPage}`).remove(), db.ref(`decks/${editingDeckIdPage}`).remove()]);
    delete allPublicDecks[editingDeckIdPage]; delete decks[editingDeckIdPage];
    goBackFromEdit(); showToast('デッキを削除しました');
  } catch(e) { showToast('削除エラー: ' + e.message, 'error'); }
};

// ══════════════════════════════════════════════════════
//  PROFILE PAGE
// ══════════════════════════════════════════════════════
async function renderProfilePage(username) {
  const page = ge('pageProfile');
  page.innerHTML = `<div class="profile-bar"><button class="back-btn" onclick="goBackFromProfile()">← 戻る</button><div style="flex:1"></div></div><div class="profile-loading"><div class="spinner"></div></div>`;
  try {
    const [pSnap, fSnap, allFollowsSnap] = await Promise.all([
      db.ref(`users/${username}`).once('value'),
      db.ref(`follows/${username}`).once('value'),
      db.ref('follows').once('value')
    ]);
    const ud = pSnap.val() || {};
    const followingMap  = fSnap.val() || {};
    const allFollows    = allFollowsSnap.val() || {};
    const followerCount  = Object.values(allFollows).filter(f => f?.[username] === true).length;
    const followingCount = Object.keys(followingMap).length;
    const isSelf   = currentSession && currentSession.username === username;
    const amFollowing = !isSelf && currentSession && (allFollows[currentSession.username] || {})[username] === true;
    const userDecks = Object.entries(allPublicDecks).filter(([, d]) => d.owner === username);
    const av        = localAvatar(username, ud);
    const streakVal = ud.streak || 0;

    page.innerHTML = `
    <div class="profile-bar">
      <button class="back-btn" onclick="goBackFromProfile()">← 戻る</button>
      <div style="flex:1"></div>
      ${isSelf ? '<button class="btn btn-blog btn-sm" onclick="openProfileEditModal()">✏️ 編集</button>' : ''}
    </div>
    <div class="profile-hero">
      <div class="profile-hero-bg"></div>
      <div class="profile-hero-inner">
        <canvas id="profileAvatar" width="80" height="80" class="profile-avatar"></canvas>
        <div class="profile-info">
          <div class="profile-dispname">${esc(ud.displayName || username)}</div>
          <div class="profile-username">@${esc(username)}</div>
          ${ud.bio ? `<div class="profile-bio">${esc(ud.bio)}</div>` : ''}
          <div class="profile-badges">
            ${streakVal > 0 ? `<span class="profile-badge streak">🔥 ${streakVal}日連続</span>` : ''}
            ${ud.isadmin || ud.isAdmin ? '<span class="profile-badge admin">⚡ ADMIN</span>' : ''}
            ${ud.created ? `<span class="profile-badge date">📅 ${fmtDate(ud.created)}から</span>` : ''}
          </div>
        </div>
        ${!isSelf && currentSession ? `<button class="follow-btn${amFollowing?' following':''}" id="profileFollowBtn" onclick="toggleProfileFollow('${esc(username)}')">${amFollowing?'フォロー中':'フォローする'}</button>` : ''}
      </div>
    </div>
    <div class="profile-stats">
      <div class="profile-stat"><div class="pstat-val" style="color:var(--primary)">${followerCount}</div><div class="pstat-lbl">フォロワー</div></div>
      <div class="profile-stat"><div class="pstat-val" style="color:var(--blog)">${followingCount}</div><div class="pstat-lbl">フォロー中</div></div>
      <div class="profile-stat"><div class="pstat-val" style="color:#F59E0B">${userDecks.length}</div><div class="pstat-lbl">デッキ</div></div>
    </div>
    <div class="profile-content">
      ${userDecks.length === 0 ? '<div class="profile-empty">デッキがありません</div>' :
        `<div class="profile-deck-grid">${userDecks.map(([id, dk]) => `
          <div class="profile-deck-card" onclick="showStudyModeModal('${id}');goBackFromProfile()">
            ${dk.cat ? `<span class="dc-tag" style="${catBg(dk.cat)};font-size:9px;padding:2px 7px;border-radius:4px;font-weight:800;">${esc(dk.cat)}</span>` : ''}
            <div class="profile-deck-name">${esc(dk.name || '無題')}</div>
            <div class="profile-deck-meta">${dk.cardCount||0}枚 · ⭐ ${dk.favCount||0}</div>
          </div>`).join('')}
        </div>`}
    </div>`;
    drawAvatar(ge('profileAvatar'), username, av, 80);
  } catch(e) {
    page.innerHTML = `<div class="profile-bar"><button class="back-btn" onclick="goBackFromProfile()">← 戻る</button></div><div style="padding:60px;text-align:center;color:var(--text3)">読み込みエラー: ${esc(e.message)}</div>`;
  }
}

window.toggleProfileFollow = async function(targetUsername) {
  if (!currentSession) { openAuthModal('login'); return; }
  const me  = currentSession.username, btn = ge('profileFollowBtn');
  const am  = (await db.ref(`follows/${me}/${targetUsername}`).once('value')).val() === true;
  if (am) { await db.ref(`follows/${me}/${targetUsername}`).remove(); if (btn) { btn.textContent = 'フォローする'; btn.classList.remove('following'); } }
  else    { await db.ref(`follows/${me}/${targetUsername}`).set(true); if (btn) { btn.textContent = 'フォロー中';   btn.classList.add('following'); } }
  showToast(am ? `@${targetUsername} のフォローを解除しました` : `@${targetUsername} をフォローしました`);
};

window.openProfileEditModal = function() {
  ge('profileEditModal')?.remove();
  const ud = currentSession;
  const ov = document.createElement('div');
  ov.id = 'profileEditModal'; ov.className = 'modal-overlay active';
  ov.innerHTML = `<div class="modal" style="max-width:440px">
    <button class="modal-close" onclick="document.getElementById('profileEditModal').remove()">✕</button>
    <h2 class="modal-title">プロフィール編集</h2>
    <div class="form-group" style="margin-top:8px">
      <label class="form-label">アバター</label>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
        <canvas id="peAvatarPreview" width="56" height="56" style="border-radius:10px;flex-shrink:0"></canvas>
        <label style="cursor:pointer;padding:8px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;font-size:12px;font-weight:700;color:var(--text2)">
          📷 画像を選ぶ<input type="file" accept="image/*" style="display:none" onchange="previewAvatar(event)">
        </label>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">表示名</label>
      <input class="form-input" id="peDisplayName" value="${esc(ud.displayName||ud.username||'')}" placeholder="表示名">
    </div>
    <div class="form-group">
      <label class="form-label">自己紹介</label>
      <textarea class="form-input" id="peBio" rows="3" placeholder="自己紹介...">${esc(currentSession._bio||'')}</textarea>
    </div>
    <div class="form-error" id="peError"></div>
    <button class="btn btn-primary" onclick="saveProfileEdit()" style="width:calc(100% - 44px);margin-bottom:20px">💾 保存する</button>
  </div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  drawAvatar(ge('peAvatarPreview'), ud.username, getAvatar(ud.username), 56);
  db.ref(`users/${ud.username}/bio`).once('value').then(s => { const b = s.val(); if (b && ge('peBio')) ge('peBio').value = b; }).catch(()=>{});
};

let _peAvatarData = null;
window.previewAvatar = function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => { _peAvatarData = ev.target.result; drawAvatar(ge('peAvatarPreview'), currentSession.username, _peAvatarData, 56); };
  reader.readAsDataURL(file);
};

window.saveProfileEdit = async function() {
  if (!currentSession) return;
  const displayName = (ge('peDisplayName')?.value || '').trim();
  const bio         = (ge('peBio')?.value || '').trim();
  if (!displayName) { ge('peError').textContent = '表示名を入力してください'; ge('peError').style.display = 'block'; return; }
  try {
    const updates = { displayName, bio };
    if (_peAvatarData) updates.avatar = _peAvatarData;
    await db.ref(`users/${currentSession.username}`).update(updates);
    currentSession.displayName = displayName; currentSession._bio = bio;
    if (_peAvatarData) { currentSession._avatar = _peAvatarData; localStorage.setItem('fm_avatar_' + currentSession.username, _peAvatarData); }
    saveSession(currentSession); updateNavUI();
    ge('profileEditModal')?.remove(); _peAvatarData = null;
    showToast('プロフィールを更新しました', 'success');
    renderProfilePage(currentSession.username);
  } catch(e) { ge('peError').textContent = 'エラー: ' + e.message; ge('peError').style.display = 'block'; }
};

// ── Push Notifications ────────────────────────────────
async function requestNotifPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') await Notification.requestPermission().catch(()=>{});
}
let _newsActive = false, _latestNewsTs = 0;
function startNewsWatch() {
  if (!db || _newsActive) return;
  _newsActive = true;
  db.ref('news').orderByChild('ts').limitToLast(1).once('value').then(snap => {
    const data = snap.val();
    if (data) _latestNewsTs = Object.values(data)[0].ts || 0;
    db.ref('news').orderByChild('ts').startAfter(_latestNewsTs).on('child_added', snap => {
      const n = snap.val();
      if (!n || n.ts <= _latestNewsTs) return;
      _latestNewsTs = n.ts;
      if (Notification.permission === 'granted' && document.visibilityState !== 'visible') {
        sendLocalNotif(n.title || 'お知らせ', (n.content || '').slice(0, 80));
      } else {
        showToast('🔔 新着: ' + (n.title || 'お知らせ'));
      }
    });
  }).catch(()=>{});
}
async function sendLocalNotif(title, body) {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    reg.showNotification('HGStudy — ' + title, { body, icon:'/icons/icon-192.png', tag:'hgstudy-news', renotify:true, vibrate:[200,100,200] });
  } catch(e) {}
}

// ══════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  ge('authForm')?.addEventListener('submit', handleAuthSubmit);
  ge('authModal')?.addEventListener('click', e => { if (e.target === ge('authModal')) closeAuthModal(); });
  ge('deckModal')?.addEventListener('click', e => { if (e.target === ge('deckModal')) closeDeckModal(); });
  ge('studyModeModal')?.addEventListener('click', e => { if (e.target === ge('studyModeModal')) closeStudyModeModal(); });
  ge('flashcard')?.addEventListener('click', () => window.flipCard());

  // スワイプ対応
  (function() {
    const fc = ge('flashcard');
    if (!fc) return;
    let sx = 0, sy = 0;
    fc.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive:true });
    fc.addEventListener('touchend',   e => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (!cardFlipped) window.flipCard();
        else window.rateCard(2, dx > 0 ? 'right' : 'left');
      }
    }, { passive:true });
    let mx = 0, dragging = false;
    fc.addEventListener('mousedown', e => { mx = e.clientX; dragging = true; });
    fc.addEventListener('mouseup',   e => {
      if (!dragging) return; dragging = false;
      const dx = e.clientX - mx;
      if (Math.abs(dx) > 60) {
        if (!cardFlipped) window.flipCard();
        else window.rateCard(2, dx > 0 ? 'right' : 'left');
      }
    });
  })();

  ge('welcomeScreen').style.display  = 'none';
  ge('deckBrowser').style.display    = 'none';
  ge('studySession').style.display   = 'none';
  initCatFilter(); initDmCats();

  const sess = loadSession();
  if (sess?.uid) {
    currentSession = sess;
    db.ref(`users/${sess.username}`).once('value').then(snap => {
      const ud = snap.val() || {};
      const isAdm = !!ud.isAdmin || !!ud.isadmin || ud.role === 'admin';
      currentSession = { ...currentSession, isAdmin:isAdm, displayName:ud.displayName||sess.username, streak:ud.streak||0 };
      if (ud.avatar) { currentSession._avatar = ud.avatar; localStorage.setItem('fm_avatar_' + sess.username, ud.avatar); }
      saveSession(currentSession);
      onLogin();
    }).catch(() => onLogin());
  } else {
    ge('welcomeScreen').style.display = 'flex';
    loadAllDecks();
  }
});
