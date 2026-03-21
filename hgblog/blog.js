/**
 * HGBlog — blog.js
 * Firebase Realtime Database バックエンド
 * 認証: HGHome/HGStudy と共有セッション
 */

/* ═══ Firebase ═══ */
const FIREBASE_CONFIG_BIN="01111011 00100010 01100001 01110000 01101001 01001011 01100101 01111001 00100010 00111010 00100010 01000001 01001001 01111010 01100001 01010011 01111001 01000011 01100110 00111000 01010000 01001010 01011001 01111000 01000011 01001010 01000011 01000110 01000011 01000100 00110001 01110000 01101000 01000100 01011111 00101101 01011000 01010110 01010101 01011010 00111001 00110010 01000100 01010011 01010110 01110101 01010010 01100001 01110101 01010101 00100010 00101100 00100010 01100001 01110101 01110100 01101000 01000100 01101111 01101101 01100001 01101001 01101110 00100010 00111010 00100010 01101000 01100111 01110011 01110100 01110101 01100100 01111001 00101101 00110001 00111000 01100101 00110010 00110011 00101110 01100110 01101001 01110010 01100101 01100010 01100001 01110011 01100101 01100001 01110000 01110000 00101110 01100011 01101111 01101101 00100010 00101100 00100010 01100100 01100001 01110100 01100001 01100010 01100001 01110011 01100101 01010101 01010010 01001100 00100010 00111010 00100010 01101000 01110100 01110100 01110000 01110011 00111010 00101111 00101111 01101000 01100111 01110011 01110100 01110101 01100100 01111001 00101101 00110001 00111000 01100101 00110010 00110011 00101101 01100100 01100101 01100110 01100001 01110101 01101100 01110100 00101101 01110010 01110100 01100100 01100010 00101110 01100001 01110011 01101001 01100001 00101101 01110011 01101111 01110101 01110100 01101000 01100101 01100001 01110011 01110100 00110001 00101110 01100110 01101001 01110010 01100101 01100010 01100001 01110011 01100101 01100100 01100001 01110100 01100001 01100010 01100001 01110011 01100101 00101110 01100001 01110000 01110000 00100010 00101100 00100010 01110000 01110010 01101111 01101010 01100101 01100011 01110100 01001001 01100100 00100010 00111010 00100010 01101000 01100111 01110011 01110100 01110101 01100100 01111001 00101101 00110001 00111000 01100101 00110010 00110011 00100010 00101100 00100010 01110011 01110100 01101111 01110010 01100001 01100111 01100101 01000010 01110101 01100011 01101011 01100101 01110100 00100010 00111010 00100010 01101000 01100111 01110011 01110100 01110101 01100100 01111001 00101101 00110001 00111000 01100101 00110010 00110011 00101110 01100110 01101001 01110010 01100101 01100010 01100001 01110011 01100101 01110011 01110100 01101111 01110010 01100001 01100111 01100101 00101110 01100001 01110000 01110000 00100010 00101100 00100010 01101101 01100101 01110011 01110011 01100001 01100111 01101001 01101110 01100111 01010011 01100101 01101110 01100100 01100101 01110010 01001001 01100100 00100010 00111010 00100010 00110111 00110010 00110000 00110001 00110101 00110000 00110111 00110001 00110010 00110111 00110111 00110101 00100010 00101100 00100010 01100001 01110000 01110000 01001001 01100100 00100010 00111010 00100010 00110001 00111010 00110111 00110010 00110000 00110001 00110101 00110000 00110111 00110001 00110010 00110111 00110111 00110101 00111010 01110111 01100101 01100010 00111010 00110110 00110011 00110010 01100010 00110010 01100010 01100100 00110110 01100110 00110000 00110100 00110100 00110001 01100001 00111000 00110011 01100100 00110111 00110100 00111001 01100101 00110010 00100010 00101100 00100010 01101101 01100101 01100001 01110011 01110101 01110010 01100101 01101101 01100101 01101110 01110100 01001001 01100100 00100010 00111010 00100010 01000111 00101101 01011001 00110000 00110101 00110110 00110001 00110001 00110110 01010010 01010001 01001101 00100010 01111101";

function bin2str(b) {
  const c = b.replace(/[^01]/g, '');
  if (!c) return '';
  return c.match(/.{1,8}/g).filter(x => x.length === 8)
    .map(b => String.fromCharCode(parseInt(b, 2))).join('');
}

/* ═══ State ═══ */
let db = null;
let session = null;
let isAdmin = false;
let allPosts = [];
let editingPostId = null;
let currentCatFilter = 'all';
let currentSearchQuery = '';
let tagInputTags = [];
let _coverImageBase64 = null;
let authMode = 'login';
let sortOrder = 'newest'; // 'newest' | 'oldest'
let _draftSaveTimer = null;
let _editorView = 'write'; // 'write' | 'preview'

/* ═══ Cookie / Session ═══ */
function getCookie(n) {
  try {
    const m = document.cookie.split('; ').find(r => r.startsWith(n + '='));
    return m ? decodeURIComponent(m.split('=').slice(1).join('=')) : null;
  } catch(e) { return null; }
}
function setCookie(n, v, d) {
  try {
    const e = d ? '; expires=' + new Date(Date.now() + d * 864e5).toUTCString() : '';
    const s = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = n + '=' + encodeURIComponent(v) + e + '; path=/; SameSite=Lax' + s;
  } catch(e) {}
}
function deleteCookie(n) {
  document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
}

function loadSession() {
  let s = null;
  const cv = getCookie('hg_session');
  const lv = localStorage.getItem('hg_session_ls');
  if (cv) { try { s = JSON.parse(cv); } catch(e) {} }
  if (!s && lv) { try { s = JSON.parse(lv); } catch(e) {} }
  if (s && s.uid) session = s;
  updateHeaderUI();
  if (session) checkAdminRole();
}
function saveSession(s) {
  session = s;
  const str = JSON.stringify(s);
  setCookie('hg_session', str, 30);
  setCookie('hgs_sess', str, 30);
  try { localStorage.setItem('hg_session_ls', str); localStorage.setItem('hgs_sess', str); } catch(e) {}
}
function clearSession() {
  session = null;
  deleteCookie('hg_session');
  deleteCookie('hgs_sess');
  try { localStorage.removeItem('hg_session_ls'); localStorage.removeItem('hgs_sess'); } catch(e) {}
}

/* ═══ Avatar ═══ */
const AVATAR_COLORS = [
  ['#7B6CF6','#B06EF6'],['#F5835B','#F6C344'],['#52C4A3','#3B82F6'],
  ['#E65B9A','#F5835B'],['#4B8DEA','#52C4A3'],['#A068F5','#F5835B']
];
function avatarColorForName(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
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
      ctx.beginPath();
      ctx.arc(s/2, s/2, s/2, 0, Math.PI*2);
      ctx.clip();
      ctx.drawImage(img, 0, 0, s, s);
      ctx.restore();
    };
    img.src = imageData;
  } else {
    const colors = avatarColorForName(username || '?');
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, colors[0]);
    g.addColorStop(1, colors[1]);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s/2, s/2, s/2, 0, Math.PI*2);
    ctx.fill();
    const initials = (username || '?').slice(0, 2).toUpperCase();
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = `bold ${Math.round(s * 0.36)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, s/2, s/2);
  }
}

/* ═══ UI helpers ═══ */
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
let _toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ═══ Firebase init ═══ */
function initFirebase() {
  let cfg = null;
  try { cfg = JSON.parse(bin2str(FIREBASE_CONFIG_BIN)); } catch(e) {}
  if (!cfg || !cfg.apiKey) { db = null; return false; }
  try {
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    db = firebase.database();
    return true;
  } catch(e) { db = null; return false; }
}

/* ═══ Admin check ═══ */
async function checkAdminRole() {
  if (!session || !db) { isAdmin = false; return; }
  try {
    const snap = await db.ref('users/' + session.username).once('value');
    const d = snap.val() || {};
    isAdmin = d.isAdmin === true || d.isadmin === true || d.role === 'admin';
  } catch(e) { isAdmin = false; }
}

/* ═══ Header UI ═══ */
function updateHeaderUI() {
  const li = document.getElementById('hdrLoginBtn');
  const re = document.getElementById('hdrRegBtn');
  const hu = document.getElementById('hdrUser');
  const wb = document.getElementById('writeBtn');
  if (session) {
    li.style.display = 'none';
    re.style.display = 'none';
    hu.style.display = 'flex';
    if (wb) wb.style.display = '';
    document.getElementById('hdrUsername').textContent = session.displayName || session.username;
    document.getElementById('acctDispName').textContent = session.displayName || session.username;
    document.getElementById('acctUsername').textContent = '@' + session.username;
    const av = session._avatar || localStorage.getItem('fm_avatar_' + session.username) || null;
    drawAvatarCanvas(document.getElementById('hdrAvatarCanvas'), session.username, av, 28);
  } else {
    li.style.display = '';
    re.style.display = '';
    hu.style.display = 'none';
    if (wb) wb.style.display = 'none';
  }
  updateMobileNavUI();
}
function toggleAcctMenu() { document.getElementById('acctMenu').classList.toggle('open'); }
function closeAcctMenu() { document.getElementById('acctMenu').classList.remove('open'); }
document.addEventListener('click', function(e) {
  const m = document.getElementById('acctMenu');
  const hu = document.getElementById('hdrUser');
  if (m && hu && !hu.contains(e.target)) m.classList.remove('open');
});
function doLogout() {
  clearSession();
  isAdmin = false;
  updateHeaderUI();
  closeAcctMenu();
  showToast('ログアウトしました');
  renderPosts();
}

/* ═══ AUTH MODAL ═══ */
function openAuthModal(mode) {
  switchAuthTab(mode || 'login');
  document.getElementById('authOverlay').classList.add('open');
  setTimeout(() => document.getElementById('authUser').focus(), 80);
}
function closeAuthModal() { document.getElementById('authOverlay').classList.remove('open'); }
function switchAuthTab(mode) {
  authMode = mode;
  document.getElementById('authTabLogin').classList.toggle('on', mode === 'login');
  document.getElementById('authTabReg').classList.toggle('on', mode === 'reg');
  document.getElementById('authRegExtra').style.display = mode === 'reg' ? 'block' : 'none';
  document.getElementById('authSubmitBtn').textContent = mode === 'login' ? 'ログイン' : 'アカウントを作成';
  document.getElementById('authModalTitle').textContent = mode === 'login' ? 'ログイン' : 'アカウント作成';
  document.getElementById('authErr').classList.remove('show');
}
function showAuthErr(msg) {
  const el = document.getElementById('authErr');
  el.textContent = msg; el.classList.add('show');
}
async function authSubmit() {
  const username = document.getElementById('authUser').value.trim().toLowerCase();
  const pass = document.getElementById('authPass').value;
  document.getElementById('authErr').classList.remove('show');
  if (!username) { showAuthErr('ユーザー名を入力してください'); return; }
  if (username.length < 2 || username.length > 20) { showAuthErr('ユーザー名は2〜20文字にしてください'); return; }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) { showAuthErr('ユーザー名は英数字・アンダースコアのみ'); return; }
  if (pass.length < 6) { showAuthErr('パスワードは6文字以上にしてください'); return; }
  if (authMode === 'reg') {
    const c = document.getElementById('authPassConfirm').value;
    if (pass !== c) { showAuthErr('パスワードが一致しません'); return; }
    await doRegister(username, pass);
  } else {
    await doLogin(username, pass);
  }
}
async function hashPass(pw) {
  function sha256(str) {
    function rr(n,d){return(n>>>d)|(n<<(32-d));}
    const H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    const bytes=[];for(let i=0;i<str.length;i++){const c=str.charCodeAt(i);if(c<128)bytes.push(c);else if(c<2048)bytes.push(0xc0|(c>>6),0x80|(c&0x3f));else bytes.push(0xe0|(c>>12),0x80|((c>>6)&0x3f),0x80|(c&0x3f));}
    const l=bytes.length*8;bytes.push(0x80);while(bytes.length%64!==56)bytes.push(0);for(let i=7;i>=0;i--)bytes.push((l/(Math.pow(2,i*8)))&0xff);
    const w=new Array(64);for(let i=0;i<bytes.length/64;i++){for(let j=0;j<16;j++)w[j]=(bytes[i*64+j*4]<<24)|(bytes[i*64+j*4+1]<<16)|(bytes[i*64+j*4+2]<<8)|bytes[i*64+j*4+3];for(let j=16;j<64;j++){const s0=rr(w[j-15],7)^rr(w[j-15],18)^(w[j-15]>>>3);const s1=rr(w[j-2],17)^rr(w[j-2],19)^(w[j-2]>>>10);w[j]=(w[j-16]+s0+w[j-7]+s1)>>>0;}let[a,b,c,d,e,f,g,h]=[...H];for(let j=0;j<64;j++){const S1=rr(e,6)^rr(e,11)^rr(e,25);const ch=(e&f)^(~e&g);const t1=(h+S1+ch+K[j]+w[j])>>>0;const S0=rr(a,2)^rr(a,13)^rr(a,22);const maj=(a&b)^(a&c)^(b&c);const t2=(S0+maj)>>>0;h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}H[0]=(H[0]+a)>>>0;H[1]=(H[1]+b)>>>0;H[2]=(H[2]+c)>>>0;H[3]=(H[3]+d)>>>0;H[4]=(H[4]+e)>>>0;H[5]=(H[5]+f)>>>0;H[6]=(H[6]+g)>>>0;H[7]=(H[7]+h)>>>0;}
    return H.map(n=>n.toString(16).padStart(8,'0')).join('');
  }
  return sha256('hgstudy:' + pw);
}
async function doRegister(username, pass) {
  const btn = document.getElementById('authSubmitBtn');
  btn.textContent = '登録中...'; btn.disabled = true;
  try {
    const hash = await hashPass(pass);
    if (db) {
      const snap = await db.ref('users/' + username).once('value');
      if (snap.exists()) { showAuthErr('このユーザー名はすでに使われています'); return; }
      await db.ref('users/' + username).set({ username, hash, displayName: username, bio: '', avatar: '', created: Date.now() });
    }
    saveSession({ uid: username, username, displayName: username, _avatar: null });
    updateHeaderUI();
    await checkAdminRole();
    showToast('アカウントを作成しました！');
    closeAuthModal();
    renderPosts();
  } catch(e) {
    showAuthErr('エラー: ' + e.message);
  } finally {
    btn.textContent = 'アカウントを作成'; btn.disabled = false;
  }
}
async function doLogin(username, pass) {
  const btn = document.getElementById('authSubmitBtn');
  btn.textContent = '確認中...'; btn.disabled = true;
  try {
    const hash = await hashPass(pass);
    let stored = null;
    if (db) {
      const snap = await db.ref('users/' + username).once('value');
      stored = snap.val();
    }
    if (!stored || stored.hash !== hash) { showAuthErr('ユーザー名またはパスワードが間違っています'); return; }
    const loginAvatar = stored.avatar || null;
    if (loginAvatar) { try { localStorage.setItem('fm_avatar_' + username, loginAvatar); } catch(e) {} }
    saveSession({ uid: username, username, displayName: stored.displayName || username, _avatar: loginAvatar });
    updateHeaderUI();
    await checkAdminRole();
    showToast('ログインしました！');
    closeAuthModal();
    renderPosts();
  } catch(e) {
    showAuthErr('エラー: ' + e.message);
  } finally {
    btn.textContent = 'ログイン'; btn.disabled = false;
  }
}

/* ═══ Markdown renderer ═══ */
function renderMarkdown(md) {
  if (!md) return '';
  let html = String(md);

  // Escape HTML
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  // Headings
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Blockquote
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote><p>$1</p></blockquote>');

  // HR
  html = html.replace(/^---+$/gm, '<hr>');

  // Bold + Italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // Unordered lists
  html = html.replace(/(^[\-\*] .+$\n?)+/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^[\-\*] /, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/(^\d+\. .+$\n?)+/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
    return `<ol>${items}</ol>`;
  });

  // Tables — must come before paragraph wrapping
  html = html.replace(/((?:^\|.+$\n?){2,})/gm, (block) => {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l.startsWith('|'));
    if (lines.length < 2) return block;
    // Second line must be a separator (|---|---|)
    if (!/^\|[\s\-:|]+\|$/.test(lines[1])) return block;
    const parseRow = (line) =>
      line.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
    const headers = parseRow(lines[0]);
    const dataRows = lines.slice(2);
    let t = '<table><thead><tr>';
    headers.forEach(h => { t += `<th>${h}</th>`; });
    t += '</tr></thead><tbody>';
    dataRows.forEach(row => {
      t += '<tr>';
      parseRow(row).forEach(c => { t += `<td>${c}</td>`; });
      t += '</tr>';
    });
    t += '</tbody></table>';
    return t;
  });

  // Paragraphs (double newline → paragraph break)
  const parts = html.split(/\n{2,}/);
  html = parts.map(p => {
    p = p.trim();
    if (!p) return '';
    // Skip block elements
    if (/^<(h[1-6]|ul|ol|li|pre|blockquote|hr|table|thead|tbody|tr|th|td)/.test(p)) return p;
    // Single newlines within paragraph → <br>
    p = p.replace(/\n/g, '<br>');
    return `<p>${p}</p>`;
  }).join('\n');

  return html;
}

/* ═══ Reading time ═══ */
function readingTime(text) {
  const words = (text || '').trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

/* ═══ Category labels ═══ */
const CAT_LABELS = {
  general: '一般',
  tech: 'テック',
  study: '学習',
  life: 'ライフ',
  news: 'ニュース'
};
const CAT_ICONS = {
  general: '📝',
  tech: '💻',
  study: '📚',
  life: '☕',
  news: '📰'
};

/* ═══ Load posts ═══ */
async function loadPosts() {
  const grid = document.getElementById('blogGrid');
  grid.innerHTML = '<div class="spinner" style="grid-column:1/-1"><div class="spin"></div>読み込み中...</div>';
  try {
    if (!db) {
      grid.innerHTML = '<div class="blog-empty" style="grid-column:1/-1"><span class="blog-empty-icon">⚠️</span><h3>Firebase 未初期化</h3><p>設定を確認してください</p></div>';
      return;
    }
    const snap = await db.ref('blog_posts').orderByChild('ts').limitToLast(100).once('value');
    const data = snap.val() || {};
    allPosts = Object.entries(data)
      .map(([id, p]) => ({ id, ...p }))
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));
    renderPosts();
    updateSidebar();
  } catch(e) {
    grid.innerHTML = `<div class="blog-empty" style="grid-column:1/-1"><span class="blog-empty-icon">⚠️</span><h3>読み込み失敗</h3><p>${esc(e.message)}</p></div>`;
  }
}

/* ═══ Render posts ═══ */
function renderPosts() {
  const grid = document.getElementById('blogGrid');
  let posts = allPosts;

  // Filter by category
  if (currentCatFilter !== 'all') {
    posts = posts.filter(p => p.cat === currentCatFilter);
  }

  // Filter by search
  if (currentSearchQuery) {
    const q = currentSearchQuery.toLowerCase();
    posts = posts.filter(p =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.content || '').toLowerCase().includes(q) ||
      (p.author || '').toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }

  // Sort
  if (sortOrder === 'oldest') {
    posts = [...posts].sort((a, b) => (a.ts || 0) - (b.ts || 0));
  }

  if (!posts.length) {
    grid.innerHTML = `
      <div class="blog-empty">
        <span class="blog-empty-icon">✍️</span>
        <h3>記事がありません</h3>
        <p>${session ? 'まだ記事がありません。最初の記事を書いてみよう！' : 'ログインして記事を投稿できます'}</p>
      </div>`;
    return;
  }

  grid.innerHTML = '';
  posts.forEach((post, i) => {
    const card = createPostCard(post, i === 0 && posts.length > 2);
    grid.appendChild(card);
  });
}

function createPostCard(post, featured) {
  const el = document.createElement('div');
  el.className = 'blog-card' + (featured ? ' featured' : '');
  el.onclick = () => openReader(post.id);

  const ts = post.ts ? new Date(post.ts) : null;
  const dateStr = ts ? ts.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
  const cat = post.cat || 'general';
  const catLabel = CAT_LABELS[cat] || cat;
  const excerpt = (post.content || '').replace(/[#*`_\[\]]/g, '').slice(0, 160);
  const canEdit = session && (session.username === post.author || isAdmin);

  const thumbHTML = post.cover
    ? `<div class="blog-card-thumb"><img src="${esc(post.cover)}" alt="" loading="lazy"></div>`
    : `<div class="blog-card-thumb"><div class="blog-card-thumb-placeholder">${CAT_ICONS[cat] || '✍️'}</div></div>`;

  const actionsHTML = canEdit
    ? `<div class="blog-card-actions" onclick="event.stopPropagation()">
        <button class="blog-act-btn" onclick="openEditor('${post.id}')">編集</button>
        <button class="blog-act-btn del" onclick="deletePost('${post.id}')">削除</button>
       </div>`
    : '';

  const tagsHTML = post.tags && post.tags.length
    ? post.tags.map(t => `<span class="tag-pill" onclick="event.stopPropagation();filterByTag('${esc(t)}')">${esc(t)}</span>`).join('')
    : '';

  el.innerHTML = `
    ${thumbHTML}
    ${actionsHTML}
    <div class="blog-card-body">
      <div class="blog-card-meta">
        <span class="blog-cat-badge ${esc(cat)}">${esc(catLabel)}</span>
        <span class="blog-card-date">${esc(dateStr)}</span>
      </div>
      <div class="blog-card-title">${esc(post.title || '（無題）')}</div>
      <div class="blog-card-excerpt">${esc(excerpt)}</div>
      <div class="blog-card-footer">
        <div class="blog-card-author">
          <canvas class="blog-card-author-av" width="22" height="22"></canvas>
          <span class="blog-card-author-name">${esc(post.authorDisplay || post.author || '匿名')}</span>
        </div>
        <span class="blog-card-reading">${readingTime(post.content)}</span>
      </div>
    </div>`;

  // Draw author avatar
  const av = el.querySelector('.blog-card-author-av');
  if (av) {
    const cachedAvatar = localStorage.getItem('fm_avatar_' + (post.author || ''));
    drawAvatarCanvas(av, post.author || '?', cachedAvatar, 22);
  }

  return el;
}

/* ═══ Sidebar ═══ */
function updateSidebar() {
  // Recent posts
  const recentList = document.getElementById('recentList');
  const recent = allPosts.slice(0, 5);
  if (!recent.length) {
    recentList.innerHTML = '<p style="font-size:.8rem;color:var(--ink6);padding:8px 0;">まだ記事がありません</p>';
  } else {
    recentList.innerHTML = recent.map(p => {
      const thumb = p.cover
        ? `<div class="recent-item-thumb"><img src="${esc(p.cover)}" alt="" loading="lazy"></div>`
        : `<div class="recent-item-thumb">${CAT_ICONS[p.cat] || '✍️'}</div>`;
      return `<div class="recent-item" onclick="openReader('${p.id}')">
        ${thumb}
        <div class="recent-item-info">
          <div class="recent-item-title">${esc(p.title || '（無題）')}</div>
          <div class="recent-item-meta">${esc(p.authorDisplay || p.author || '匿名')}</div>
        </div>
      </div>`;
    }).join('');
  }

  // Category counts
  const catList = document.getElementById('catList');
  const counts = {};
  allPosts.forEach(p => { const c = p.cat || 'general'; counts[c] = (counts[c] || 0) + 1; });
  const cats = [
    { key: 'all', label: 'すべて', icon: '🗂️' },
    { key: 'general', label: '一般', icon: '📝' },
    { key: 'tech', label: 'テック', icon: '💻' },
    { key: 'study', label: '学習', icon: '📚' },
    { key: 'life', label: 'ライフ', icon: '☕' },
    { key: 'news', label: 'ニュース', icon: '📰' }
  ];
  catList.innerHTML = cats.map(c => {
    const cnt = c.key === 'all' ? allPosts.length : (counts[c.key] || 0);
    return `<div class="cat-item ${currentCatFilter === c.key ? 'active' : ''}" onclick="filterByCat('${c.key}')">
      <span>${c.icon} ${esc(c.label)}</span>
      <span class="cat-item-count">${cnt}</span>
    </div>`;
  }).join('');

  // Tag cloud
  const tagMap = {};
  allPosts.forEach(p => (p.tags || []).forEach(t => { tagMap[t] = (tagMap[t] || 0) + 1; }));
  const tagCloud = document.getElementById('tagCloud');
  const tagEntries = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).slice(0, 20);
  tagCloud.innerHTML = tagEntries.length
    ? tagEntries.map(([t, n]) => `<span class="tag-pill" onclick="filterByTag('${esc(t)}')">${esc(t)} <span style="opacity:.6">${n}</span></span>`).join('')
    : '<span style="font-size:.8rem;color:var(--ink6);">タグなし</span>';
}

/* ═══ Filter helpers ═══ */
function filterByCat(cat) {
  currentCatFilter = cat;
  updateSidebar();
  renderPosts();
  // Sync filter chips
  document.querySelectorAll('.filter-chip[data-cat]').forEach(el => {
    el.classList.toggle('active', el.dataset.cat === cat);
  });
}
function filterByTag(tag) {
  document.getElementById('searchInput').value = tag;
  currentSearchQuery = tag;
  renderPosts();
}

/* ═══ Post reader ═══ */
async function openReader(postId) {
  const overlay = document.getElementById('readerOverlay');
  const panel = document.getElementById('readerPanel');
  panel.innerHTML = '<div class="spinner" style="padding:120px"><div class="spin"></div></div>';
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  attachProgressBar(overlay);

  try {
    let post;
    const cached = allPosts.find(p => p.id === postId);
    if (cached) {
      post = cached;
    } else {
      const snap = await db.ref('blog_posts/' + postId).once('value');
      post = { id: postId, ...snap.val() };
    }

    const ts = post.ts ? new Date(post.ts) : null;
    const dateStr = ts ? ts.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }) : '';
    const cat = post.cat || 'general';
    const canEdit = session && (session.username === post.author || isAdmin);

    const heroHTML = post.cover
      ? `<img class="reader-hero-img" src="${esc(post.cover)}" alt="">`
      : `<div class="reader-hero-placeholder">${CAT_ICONS[cat] || '✍️'}</div>`;

    const tagsHTML = (post.tags || []).map(t =>
      `<span class="tag-pill" style="font-size:.68rem">${esc(t)}</span>`
    ).join('');

    const actionsHTML = canEdit
      ? `<div class="reader-close-actions">
          <button class="reader-act" onclick="openEditor('${post.id}');closeReader()">編集</button>
          <button class="reader-act del" onclick="deletePost('${post.id}')">削除</button>
         </div>`
      : '<div></div>';

    panel.innerHTML = `
      <div class="reader-close">
        <button class="reader-close-btn" onclick="closeReader()">✕</button>
        ${actionsHTML}
      </div>
      <div class="reader-hero">${heroHTML}</div>
      <div class="reader-content">
        <div class="reader-tags">
          <span class="reader-cat-badge ${esc(cat)}">${esc(CAT_LABELS[cat] || cat)}</span>
          ${tagsHTML}
        </div>
        <h1 class="reader-title">${esc(post.title || '（無題）')}</h1>
        <div class="reader-byline">
          <div class="reader-author">
            <canvas class="reader-author-av" width="32" height="32"></canvas>
            <div>
              <div class="reader-author-name">${esc(post.authorDisplay || post.author || '匿名')}</div>
              <div class="reader-author-handle">@${esc(post.author || '')}</div>
            </div>
          </div>
          <span class="reader-date">${esc(dateStr)}</span>
          <span class="reader-reading">${readingTime(post.content)}</span>
        </div>
        <div class="blog-body" id="readerBody"></div>
      </div>`;

    // Render markdown safely
    document.getElementById('readerBody').innerHTML = renderMarkdown(post.content || '');

    // Draw author avatar
    const av = panel.querySelector('.reader-author-av');
    if (av) {
      const cachedAvatar = localStorage.getItem('fm_avatar_' + (post.author || ''));
      drawAvatarCanvas(av, post.author || '?', cachedAvatar, 32);
    }
  } catch(e) {
    panel.innerHTML = `<div style="padding:40px;text-align:center;color:var(--ink5)">エラーが発生しました: ${esc(e.message)}</div>`;
  }
}
function closeReader() {
  const overlay = document.getElementById('readerOverlay');
  overlay.classList.remove('open');
  detachProgressBar(overlay);
  document.body.style.overflow = '';
}

/* ═══ EDITOR ═══ */
async function openEditor(editId) {
  if (!session) { openAuthModal('login'); return; }
  editingPostId = editId || null;
  _coverImageBase64 = null;
  tagInputTags = [];
  _editorView = 'write';
  setEditorView('write');

  document.getElementById('editorTitle').textContent = editId ? '記事を編集' : '新しい記事を書く';
  document.getElementById('editorSubmitBtn').textContent = editId ? '更新する' : '公開する';
  document.getElementById('postErr').classList.remove('show');
  document.getElementById('postTitle').value = '';
  document.getElementById('postCat').value = 'general';
  document.getElementById('postContent').value = '';
  clearCoverImage();
  renderTagInput();
  updateTitleCount();
  const badge = document.getElementById('editorDraftBadge');
  if (badge) badge.style.display = 'none';

  if (editId) {
    try {      const snap = await db.ref('blog_posts/' + editId).once('value');
      const p = snap.val();
      if (!p) return;
      document.getElementById('postTitle').value = p.title || '';
      document.getElementById('postCat').value = p.cat || 'general';
      document.getElementById('postContent').value = p.content || '';
      tagInputTags = p.tags || [];
      renderTagInput();
      if (p.cover) {
        _coverImageBase64 = p.cover;
        document.getElementById('coverPreviewImg').src = p.cover;
        document.getElementById('coverPreview').classList.add('show');
        document.getElementById('coverSizeNote').textContent = '（既存の画像）';
      }
    } catch(e) { showToast('エラー: ' + e.message); return; }
  }

  document.getElementById('editorOverlay').classList.add('open');
  setTimeout(() => {
    document.getElementById('postTitle').focus();
    if (!editId) restoreDraft();
  }, 80);

  // Wire up draft auto-save for content textarea
  const ta = document.getElementById('postContent');
  if (ta) {
    ta.oninput = scheduleDraftSave;
  }
  const sel = document.getElementById('postCat');
  if (sel) sel.onchange = scheduleDraftSave;
}
function closeEditor() {
  document.getElementById('editorOverlay').classList.remove('open');
  editingPostId = null;
}

/* ── Tag input ── */
function renderTagInput() {
  const wrap = document.getElementById('tagInputWrap');
  wrap.innerHTML = tagInputTags.map((t, i) =>
    `<span class="tag-input-tag">${esc(t)}<button type="button" onclick="removeTag(${i})">×</button></span>`
  ).join('') +
  `<input class="tag-input-field" id="tagField" type="text" placeholder="タグを入力してEnter" maxlength="20"
    onkeydown="handleTagKey(event)" oninput="handleTagInput(event)">`;
}
function removeTag(i) { tagInputTags.splice(i, 1); renderTagInput(); }
function handleTagKey(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const val = e.target.value.trim().replace(/,/g, '');
    if (val && tagInputTags.length < 10 && !tagInputTags.includes(val)) {
      tagInputTags.push(val);
      renderTagInput();
      const f = document.getElementById('tagField');
      if (f) f.focus();
    }
  } else if (e.key === 'Backspace' && !e.target.value) {
    tagInputTags.pop(); renderTagInput();
    const f = document.getElementById('tagField');
    if (f) f.focus();
  }
}
function handleTagInput(e) {
  const val = e.target.value;
  if (val.endsWith(',')) {
    const tag = val.slice(0, -1).trim();
    if (tag && tagInputTags.length < 10 && !tagInputTags.includes(tag)) {
      tagInputTags.push(tag);
      renderTagInput();
      const f = document.getElementById('tagField');
      if (f) f.focus();
    }
  }
}

/* ── Cover image ── */
const MAX_IMG_SIZE = 1200, MAX_IMG_KB = 600;
function handleCoverDragOver(e) { e.preventDefault(); document.getElementById('coverUploadArea').classList.add('drag'); }
function handleCoverDragLeave(e) { document.getElementById('coverUploadArea').classList.remove('drag'); }
function handleCoverDrop(e) {
  e.preventDefault();
  document.getElementById('coverUploadArea').classList.remove('drag');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) processCoverFile(file);
}
function handleCoverSelect(e) { const file = e.target.files[0]; if (file) processCoverFile(file); }
function processCoverFile(file) {
  const reader = new FileReader();
  reader.onload = function(ev) {
    const img = new Image();
    img.onload = function() {
      let w = img.width, h = img.height;
      if (w > MAX_IMG_SIZE || h > MAX_IMG_SIZE) {
        if (w > h) { h = Math.round(h * MAX_IMG_SIZE / w); w = MAX_IMG_SIZE; }
        else { w = Math.round(w * MAX_IMG_SIZE / h); h = MAX_IMG_SIZE; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      let quality = 0.85;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      while (dataUrl.length > MAX_IMG_KB * 1024 * 4/3 && quality > 0.3) {
        quality -= 0.08;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      const kb = Math.round(dataUrl.length * 3/4 / 1024);
      _coverImageBase64 = dataUrl;
      document.getElementById('coverPreviewImg').src = dataUrl;
      document.getElementById('coverPreview').classList.add('show');
      document.getElementById('coverSizeNote').textContent = `${w}×${h}px / 約${kb}KB`;
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}
function clearCoverImage() {
  _coverImageBase64 = null;
  document.getElementById('coverPreview').classList.remove('show');
  document.getElementById('coverPreviewImg').src = '';
  const inp = document.getElementById('coverInput');
  if (inp) inp.value = '';
  document.getElementById('coverSizeNote').textContent = '';
}

/* ── Submit post ── */
async function submitPost() {
  if (!session) { showToast('ログインが必要です'); return; }
  const title = document.getElementById('postTitle').value.trim();
  const cat = document.getElementById('postCat').value;
  const content = document.getElementById('postContent').value.trim();
  const errEl = document.getElementById('postErr');
  errEl.classList.remove('show');

  if (!title) { errEl.textContent = 'タイトルを入力してください'; errEl.classList.add('show'); return; }
  if (!content) { errEl.textContent = '内容を入力してください'; errEl.classList.add('show'); return; }

  const btn = document.getElementById('editorSubmitBtn');
  btn.disabled = true;
  btn.textContent = '送信中...';

  try {
    const data = {
      title, cat, content,
      author: session.username,
      authorDisplay: session.displayName || session.username,
      tags: tagInputTags.slice(),
      ut: Date.now()
    };
    if (_coverImageBase64) data.cover = _coverImageBase64;
    else if (editingPostId) data.cover = null;

    if (editingPostId) {
      await db.ref('blog_posts/' + editingPostId).update(data);
      showToast('記事を更新しました ✓');
    } else {
      data.ts = Date.now();
      await db.ref('blog_posts').push(data);
      showToast('記事を公開しました ✓');
      clearDraft();
    }
    closeEditor();
    await loadPosts();
  } catch(e) {
    errEl.textContent = 'エラー: ' + e.message;
    errEl.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.textContent = editingPostId ? '更新する' : '公開する';
  }
}

/* ── Delete post ── */
async function deletePost(id) {
  const post = allPosts.find(p => p.id === id);
  if (!session) { showToast('ログインが必要です'); return; }
  if (post && session.username !== post.author && !isAdmin) { showToast('権限がありません'); return; }
  if (!confirm('この記事を削除しますか？')) return;
  try {
    await db.ref('blog_posts/' + id).remove();
    showToast('削除しました');
    closeReader();
    await loadPosts();
  } catch(e) { showToast('エラー: ' + e.message); }
}

/* ═══ MARKDOWN TOOLBAR ═══ */
function insertMd(type) {
  const ta = document.getElementById('postContent');
  if (!ta) return;
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const sel = ta.value.substring(start, end);
  const before = ta.value.substring(0, start);
  const after = ta.value.substring(end);

  const wrap = (pre, post, placeholder) => {
    const text = sel || placeholder;
    ta.value = before + pre + text + post + after;
    const s = start + pre.length;
    ta.setSelectionRange(s, s + text.length);
  };
  const linePrefix = (prefix, placeholder) => {
    const bol = before.lastIndexOf('\n') + 1;
    const lineStart = ta.value.substring(0, bol);
    const lineEnd = ta.value.substring(bol);
    const text = sel || placeholder;
    ta.value = lineStart + prefix + lineEnd;
    ta.setSelectionRange(bol + prefix.length, bol + prefix.length + text.length);
  };
  const block = (text) => {
    const pre = (before.length > 0 && !before.endsWith('\n\n')) ?
      (before.endsWith('\n') ? '\n' : '\n\n') : '';
    const suf = '\n\n';
    ta.value = before + pre + text + suf + after;
    ta.setSelectionRange(start + pre.length, start + pre.length + text.length);
  };

  switch(type) {
    case 'bold':       wrap('**', '**', 'テキスト'); break;
    case 'italic':     wrap('*', '*', 'テキスト'); break;
    case 'code':       wrap('`', '`', 'コード'); break;
    case 'codeblock':  block('```\n' + (sel || 'コードをここに') + '\n```'); break;
    case 'heading1':   linePrefix('# ', '見出し1'); break;
    case 'heading2':   linePrefix('## ', '見出し2'); break;
    case 'heading3':   linePrefix('### ', '見出し3'); break;
    case 'quote':      linePrefix('> ', '引用テキスト'); break;
    case 'list':       linePrefix('- ', 'リスト項目'); break;
    case 'link': {
      const url = 'https://';
      const text2 = sel || 'リンクテキスト';
      ta.value = before + '[' + text2 + '](' + url + ')' + after;
      const s2 = start + 1 + text2.length + 2;
      ta.setSelectionRange(s2, s2 + url.length);
      break;
    }
  }
  ta.focus();
  scheduleDraftSave();
}

function insertMarkdownTable(rows, cols) {
  const ta = document.getElementById('postContent');
  if (!ta) return;
  const start = ta.selectionStart;
  const before = ta.value.substring(0, start);
  const after = ta.value.substring(start);

  // Build header row with placeholder names
  const headerCells = Array.from({length: cols}, (_, i) => ' 列' + (i + 1) + ' ');
  const sepCells    = Array.from({length: cols}, () => '---');
  const dataCells   = Array.from({length: cols}, () => '   ');

  const headerRow = '|' + headerCells.join('|') + '|';
  const sepRow    = '|' + sepCells.join('|') + '|';
  const dataRow   = '|' + dataCells.join('|') + '|';
  const dataRows  = Array.from({length: rows - 1}, () => dataRow);

  const table = [headerRow, sepRow, ...dataRows].join('\n');
  const pre = (before.length > 0 && !before.endsWith('\n\n')) ?
    (before.endsWith('\n') ? '\n' : '\n\n') : '';
  const suf = '\n\n';

  ta.value = before + pre + table + suf + after;
  // Select first header cell content
  const selStart = start + pre.length + 1; // after leading |
  ta.setSelectionRange(selStart, selStart + headerCells[0].length);
  ta.focus();
  scheduleDraftSave();
}

let _tablePicker = null;
function toggleTablePicker(btnEl) {
  if (_tablePicker) { _tablePicker.remove(); _tablePicker = null; return; }

  const MAXR = 6, MAXC = 6;
  let selR = 2, selC = 2;

  const picker = document.createElement('div');
  picker.className = 'table-picker';
  _tablePicker = picker;

  const title = document.createElement('div');
  title.className = 'table-picker-title';
  title.textContent = '表のサイズを選択';

  const grid = document.createElement('div');
  grid.className = 'table-picker-grid';

  for (let r = 0; r < MAXR; r++) {
    for (let c = 0; c < MAXC; c++) {
      const cell = document.createElement('div');
      cell.className = 'table-picker-cell';
      cell.dataset.r = r; cell.dataset.c = c;
      cell.onmouseenter = () => {
        selR = r + 1; selC = c + 1;
        updateGridHighlight(grid, selR, selC);
        label.textContent = `${selR} 行 × ${selC} 列`;
      };
      cell.onclick = () => { insertMarkdownTable(selR, selC); closeTablePicker(); };
      if (r < 2 && c < 2) cell.classList.add('sel');
      grid.appendChild(cell);
    }
  }

  const label = document.createElement('div');
  label.className = 'table-picker-label';
  label.textContent = '2 行 × 2 列';

  // Manual input section
  const manual = document.createElement('div');
  manual.className = 'table-picker-manual';
  manual.innerHTML =
    '<label>行</label>' +
    '<input class="table-picker-num" id="tpRows" type="number" min="1" max="30" value="3">' +
    '<label>列</label>' +
    '<input class="table-picker-num" id="tpCols" type="number" min="1" max="10" value="3">' +
    '<button class="table-picker-insert" onclick="insertTableManual()">挿入</button>';

  picker.appendChild(title);
  picker.appendChild(grid);
  picker.appendChild(label);
  picker.appendChild(manual);

  const wrap = document.getElementById('mdToolTableWrap');
  wrap.appendChild(picker);

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', _tablePickerOutside);
  }, 0);
}
function _tablePickerOutside(e) {
  const wrap = document.getElementById('mdToolTableWrap');
  if (wrap && !wrap.contains(e.target)) closeTablePicker();
}
function closeTablePicker() {
  if (_tablePicker) { _tablePicker.remove(); _tablePicker = null; }
  document.removeEventListener('click', _tablePickerOutside);
}
function updateGridHighlight(grid, rows, cols) {
  grid.querySelectorAll('.table-picker-cell').forEach(cell => {
    const r = parseInt(cell.dataset.r) + 1;
    const c = parseInt(cell.dataset.c) + 1;
    cell.classList.toggle('sel', r <= rows && c <= cols);
  });
}
function insertTableManual() {
  const r = Math.max(1, Math.min(30, parseInt(document.getElementById('tpRows').value) || 3));
  const c = Math.max(1, Math.min(10, parseInt(document.getElementById('tpCols').value) || 3));
  insertMarkdownTable(r, c);
  closeTablePicker();
}

/* ═══ MOBILE NAV ═══ */
function toggleMobileNav() {
  const nav = document.getElementById('mobileNav');
  const btn = document.getElementById('navHamburger');
  const isOpen = nav.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
}
function closeMobileNav() {
  document.getElementById('mobileNav').classList.remove('open');
  document.getElementById('navHamburger').classList.remove('open');
}
function updateMobileNavUI() {
  const mu = document.getElementById('mobileNavUser');
  const ml = document.getElementById('mobileLoginBtn');
  const mr = document.getElementById('mobileRegBtn');
  if (!mu) return;
  if (session) {
    mu.style.display = 'flex';
    ml.style.display = 'none';
    mr.style.display = 'none';
    const d = document.getElementById('mobileNavDisp');
    const h = document.getElementById('mobileNavHandle');
    if (d) d.textContent = session.displayName || session.username;
    if (h) h.textContent = '@' + session.username;
    const av = session._avatar || localStorage.getItem('fm_avatar_' + session.username) || null;
    drawAvatarCanvas(document.getElementById('mobileNavAvatar'), session.username, av, 32);
  } else {
    mu.style.display = 'none';
    ml.style.display = '';
    mr.style.display = '';
  }
}

/* ═══ SORT ═══ */
function toggleSort() {
  sortOrder = sortOrder === 'newest' ? 'oldest' : 'newest';
  const btn = document.getElementById('sortBtn');
  const lbl = document.getElementById('sortLabel');
  if (sortOrder === 'oldest') {
    lbl.textContent = '古い順';
    btn.classList.add('asc');
  } else {
    lbl.textContent = '新しい順';
    btn.classList.remove('asc');
  }
  renderPosts();
}

/* ═══ READING PROGRESS BAR ═══ */
let _progressHandler = null;
function attachProgressBar(overlayEl) {
  const bar = document.createElement('div');
  bar.className = 'reader-progress-bar';
  bar.id = 'readerProgressFill';
  const panel = document.getElementById('readerPanel');
  if (panel) panel.prepend(bar);

  _progressHandler = function() {
    const scrollTop = overlayEl.scrollTop;
    const scrollHeight = overlayEl.scrollHeight - overlayEl.clientHeight;
    const pct = scrollHeight > 0 ? Math.min(100, (scrollTop / scrollHeight) * 100) : 0;
    bar.style.width = pct + '%';
  };
  overlayEl.addEventListener('scroll', _progressHandler, { passive: true });
}
function detachProgressBar(overlayEl) {
  if (_progressHandler) {
    overlayEl.removeEventListener('scroll', _progressHandler);
    _progressHandler = null;
  }
}

/* ═══ EDITOR TABS ═══ */
function setEditorView(mode) {
  _editorView = mode;
  const writePanel = document.getElementById('editorWritePanel');
  const previewPanel = document.getElementById('editorPreviewPanel');
  const tabWrite = document.getElementById('editorTabWrite');
  const tabPreview = document.getElementById('editorTabPreview');
  if (mode === 'preview') {
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value;
    const previewTitle = document.getElementById('editorPreviewTitle');
    const previewBody = document.getElementById('editorPreviewBody');
    if (previewTitle) previewTitle.textContent = title;
    if (previewBody) previewBody.innerHTML = renderMarkdown(content);
    writePanel.style.display = 'none';
    previewPanel.style.display = '';
    tabWrite.classList.remove('active');
    tabPreview.classList.add('active');
  } else {
    writePanel.style.display = '';
    previewPanel.style.display = 'none';
    tabWrite.classList.add('active');
    tabPreview.classList.remove('active');
    setTimeout(() => document.getElementById('postTitle').focus(), 60);
  }
}

/* ═══ TITLE CHAR COUNTER ═══ */
function updateTitleCount() {
  const input = document.getElementById('postTitle');
  const counter = document.getElementById('titleCharCount');
  if (!input || !counter) return;
  const len = input.value.length;
  const max = 120;
  counter.textContent = len + ' / ' + max;
  counter.classList.toggle('warn', len > 90 && len <= 108);
  counter.classList.toggle('danger', len > 108);
  scheduleDraftSave();
}

/* ═══ DRAFT AUTO-SAVE ═══ */
const DRAFT_KEY = 'hgblog_draft';
function scheduleDraftSave() {
  clearTimeout(_draftSaveTimer);
  _draftSaveTimer = setTimeout(saveDraft, 1800);
}
function saveDraft() {
  if (!session) return;
  try {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const cat = document.getElementById('postCat').value;
    if (!title && !content) { clearDraft(); return; }
    const draft = { title, content, cat, tags: tagInputTags.slice(), savedAt: Date.now() };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    const badge = document.getElementById('editorDraftBadge');
    if (badge) badge.style.display = 'inline-flex';
  } catch(e) {}
}
function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch(e) {}
  const badge = document.getElementById('editorDraftBadge');
  if (badge) badge.style.display = 'none';
}
function restoreDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return false;
    const draft = JSON.parse(raw);
    if (!draft || (!draft.title && !draft.content)) return false;
    const ageMin = Math.round((Date.now() - (draft.savedAt || 0)) / 60000);
    if (!confirm(`${ageMin}分前の下書きが見つかりました。\n\n「${draft.title || '（タイトルなし）'}」\n\n復元しますか？`)) return false;
    document.getElementById('postTitle').value = draft.title || '';
    document.getElementById('postContent').value = draft.content || '';
    document.getElementById('postCat').value = draft.cat || 'general';
    tagInputTags = draft.tags || [];
    renderTagInput();
    updateTitleCount();
    const badge = document.getElementById('editorDraftBadge');
    if (badge) badge.style.display = 'inline-flex';
    return true;
  } catch(e) { return false; }
}

/* ═══ Init ═══ */
window.addEventListener('DOMContentLoaded', function() {
  initFirebase();
  loadSession();
  loadPosts();

  // Write button
  const wb = document.getElementById('writeBtn');
  if (wb) {
    if (!session) wb.style.display = 'none';
  }

  // Search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let searchTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        currentSearchQuery = e.target.value.trim();
        renderPosts();
      }, 200);
    });
  }

  // Filter chips
  document.querySelectorAll('.filter-chip[data-cat]').forEach(chip => {
    chip.addEventListener('click', () => filterByCat(chip.dataset.cat));
  });

  // Close reader on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.getElementById('readerOverlay').classList.contains('open')) closeReader();
      if (document.getElementById('editorOverlay').classList.contains('open')) closeEditor();
      if (document.getElementById('authOverlay').classList.contains('open')) closeAuthModal();
    }
  });
});
