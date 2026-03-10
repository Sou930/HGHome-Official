/* ═══════════════════════════════════════════════════════
   HGStudy  —  study.js
   フラッシュカード + 解説ブログ (Firebase Realtime DB)
═══════════════════════════════════════════════════════ */

// ── Firebase Config ───────────────────────────────────
const _cfg = {
  _a:[104,116,116,112,115,58,47,47,104,103,115,116,117,100,121,45,49,56,101,50,51,45,100,101,102,97,117,108,116,45,114,116,100,98,46,97,115,105,97,45,115,111,117,116,104,101,97,115,116,49,46,102,105,114,101,98,97,115,101,100,97,116,97,98,97,115,101,46,97,112,112],
  _c:[104,103,115,116,117,100,121,45,49,56,101,50,51,46,102,105,114,101,98,97,115,101,97,112,112,46,99,111,109],
  _d:[65,73,122,97,83,121,67,102,56,80,74,89,120,67,74,67,70,67,68,49,112,104,68,95,45,88,86,85,90,57,50,68,83,86,117,82,97,117,85],
  _e:[104,103,115,116,117,100,121,45,49,56,101,50,51],
  _f:[49,58,55,50,48,49,53,48,55,49,50,55,55,53,58,119,101,98,58,54,51,50,98,50,98,100,54,102,48,52,52,49,97,56,51,100,55,52,57,101,50]
};
const _d = b => b.map(c=>String.fromCharCode(c)).join('');
const firebaseConfig = {
  apiKey:           _d(_cfg._d),
  authDomain:       _d(_cfg._c),
  databaseURL:      _d(_cfg._a),
  projectId:        _d(_cfg._e),
  storageBucket:    _d(_cfg._c),
  messagingSenderId:"720150712775",
  appId:            _d(_cfg._f)
};
const app  = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.database();

// ── Session ───────────────────────────────────────────
function saveSession(d){ try{ localStorage.setItem('hgs_sess',JSON.stringify(d)); document.cookie=`hgs_sess=${encodeURIComponent(JSON.stringify(d))};path=/;max-age=2592000`; }catch(e){} }
function loadSession(){ try{ const s=localStorage.getItem('hgs_sess'); if(s)return JSON.parse(s); const m=document.cookie.match(/(?:^|; )hgs_sess=([^;]*)/); if(m)return JSON.parse(decodeURIComponent(m[1])); }catch(e){} return null; }
function clearSession(){ try{localStorage.removeItem('hgs_sess');}catch(e){} document.cookie='hgs_sess=;path=/;max-age=0'; }

// ── App State ─────────────────────────────────────────
let currentUser    = null;
let currentSession = null;
let decks          = {};
let currentDeckId  = null;
let studyQueue     = [];
let currentCardIdx = 0;
let cardFlipped    = false;
let sessionStats   = {total:0,again:0,good:0,easy:0};
let isEditMode     = false;

// ── Blog State ────────────────────────────────────────
let allPosts     = {};
let currentPostId= null;
let blogSort     = 'new';
let editingPostId= null;
let selectedTag  = '';

const BLOG_TAGS = ['文法','語彙','歴史','数学','物理','化学','生物','英語','その他'];

// ── Avatar ────────────────────────────────────────────
const AVATAR_COLORS = [['#7B6CF6','#B06EF6'],['#F5835B','#F6C344'],['#52C4A3','#3B82F6'],['#E65B9A','#F5835B'],['#4B8DEA','#52C4A3'],['#A068F5','#F5835B']];
function avatarColor(name){ let h=0; for(let i=0;i<name.length;i++) h=(h*31+name.charCodeAt(i))&0xffff; return AVATAR_COLORS[h%AVATAR_COLORS.length]; }
function drawAvatar(canvas, username, imageData, size){
  if(!canvas) return;
  const s=size||canvas.width; canvas.width=s; canvas.height=s;
  const ctx=canvas.getContext('2d'); ctx.clearRect(0,0,s,s);
  if(imageData){
    const img=new Image(); img.onload=()=>{ ctx.save(); ctx.beginPath(); ctx.arc(s/2,s/2,s/2,0,Math.PI*2); ctx.clip(); ctx.drawImage(img,0,0,s,s); ctx.restore(); }; img.src=imageData;
  } else {
    const [c1,c2]=avatarColor(username||'?');
    const g=ctx.createLinearGradient(0,0,s,s); g.addColorStop(0,c1); g.addColorStop(1,c2);
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(s/2,s/2,s/2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.92)'; ctx.font=`bold ${Math.round(s*.36)}px "JetBrains Mono",monospace`;
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText((username||'?').slice(0,2).toUpperCase(),s/2,s/2);
  }
}

// ── Helpers ───────────────────────────────────────────
function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmtDate(ts){ if(!ts) return ''; const d=new Date(ts); return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`; }
function ge(id){ return document.getElementById(id); }

// ── Markdown Parser ───────────────────────────────────
function renderMarkdown(src){
  if(!src) return '';
  let s = src
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    // headings
    .replace(/^#{3} (.+)$/gm,'<h3>$1</h3>')
    .replace(/^#{2} (.+)$/gm,'<h2>$1</h2>')
    .replace(/^# (.+)$/gm,'<h1>$1</h1>')
    // blockquote
    .replace(/^&gt; (.+)$/gm,'<blockquote>$1</blockquote>')
    // hr
    .replace(/^---$/gm,'<hr>')
    // bold / italic / code
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/`(.+?)`/g,'<code>$1</code>')
    // spoiler ||text||
    .replace(/\|\|(.+?)\|\|/g,'<span class="spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>')
    // link [text](url)
    .replace(/\[(.+?)\]\((https?:\/\/[^\)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
    // table
    .replace(/^\|(.+)\|$/gm, m => '<tr>' + m.slice(1,-1).split('|').map(c=>`<td>${c.trim()}</td>`).join('') + '</tr>')
    .replace(/(<tr>.*<\/tr>\n?){2,}/gs, t => `<table>${t.replace(/<tr>(<td>.*?<\/td>)+<\/tr>/,'m => m.replace(/<td>/g,"<th>").replace(/<\/td>/g,"</th>">')}</table>`);

  // lists
  s = s.replace(/(^- .+\n?)+/gm, m => '<ul>' + m.split('\n').filter(l=>l.startsWith('- ')).map(l=>`<li>${l.slice(2)}</li>`).join('') + '</ul>');
  s = s.replace(/(^\d+\. .+\n?)+/gm, m => '<ol>' + m.split('\n').filter(l=>/^\d+\./.test(l)).map(l=>`<li>${l.replace(/^\d+\. /,'')}</li>`).join('') + '</ol>');

  // code block
  s = s.replace(/```[\w]*\n?([\s\S]+?)```/g,'<pre><code>$1</code></pre>');

  // paragraphs (non-block lines)
  s = s.replace(/\n{2,}/g,'\n\n');
  const lines = s.split('\n');
  const out = []; let buf = [];
  const BLOCKS = /^(<h[1-6]|<ul|<ol|<li|<blockquote|<hr|<pre|<table|<tr)/;
  for(const line of lines){
    if(BLOCKS.test(line.trim())){
      if(buf.length){ out.push(`<p>${buf.join(' ')}</p>`); buf=[]; }
      out.push(line);
    } else if(line.trim()===''){
      if(buf.length){ out.push(`<p>${buf.join(' ')}</p>`); buf=[]; }
    } else { buf.push(line); }
  }
  if(buf.length) out.push(`<p>${buf.join(' ')}</p>`);
  return out.join('\n');
}

// ── Tab Switch ────────────────────────────────────────
window.switchTab = function(tab){
  ge('pageStudy').classList.toggle('active', tab==='study');
  ge('pageBlog').classList.toggle('active',  tab==='blog');
  ge('tabStudy').classList.toggle('on', tab==='study');
  ge('tabBlog').classList.toggle('on',  tab==='blog');
  if(tab==='blog') loadBlogPosts();
};

// ══════════════════════════════════════════════════════
//  BLOG FEATURE
// ══════════════════════════════════════════════════════

// ── Blog sub-view switcher ────────────────────────────
function showBlogList(){ ge('blogList').style.display=''; ge('blogPost').style.display='none'; ge('blogEdit').style.display='none'; }
function showBlogPostView(){ ge('blogList').style.display='none'; ge('blogPost').style.display=''; ge('blogEdit').style.display='none'; }
function showBlogEditView(){ ge('blogList').style.display='none'; ge('blogPost').style.display='none'; ge('blogEdit').style.display=''; }

// ── Load all posts ────────────────────────────────────
async function loadBlogPosts(){
  try{
    const snap = await db.ref('study_blog/posts').once('value');
    allPosts = snap.val() || {};
    renderBlogGrid();
  } catch(e){
    ge('blogPostsGrid').innerHTML = `<div class="blog-empty"><div class="empty-emoji">⚠️</div><p>読み込みエラー: ${esc(e.message)}</p></div>`;
  }
}

// ── Render grid ───────────────────────────────────────
function renderBlogGrid(){
  const grid  = ge('blogPostsGrid');
  const count = ge('blogHeroCount');
  let posts   = Object.entries(allPosts);
  count.textContent = posts.length;

  if(posts.length===0){
    grid.innerHTML = '<div class="blog-empty"><div class="empty-emoji">📝</div><p>まだ記事がありません</p></div>';
    return;
  }

  posts.sort((a,b)=> blogSort==='new' ? b[1].createdAt-a[1].createdAt : a[1].createdAt-b[1].createdAt);

  grid.innerHTML = posts.map(([id,p])=>`
    <div class="blog-card" onclick="openPost('${id}')">
      <div class="blog-card-top">
        <span class="blog-card-tag">${esc(p.tag||'その他')}</span>
        ${currentSession && (currentSession.username===p.author || currentSession.isAdmin)
          ? `<div class="blog-card-actions-mini" onclick="event.stopPropagation()">
               <button class="blog-action-mini" onclick="openBlogEdit('${id}')">編集</button>
               <button class="blog-action-mini danger" onclick="deletePost('${id}')">削除</button>
             </div>` : ''}
      </div>
      <div class="blog-card-title">${esc(p.title||'無題')}</div>
      <div class="blog-card-preview">${esc((p.body||'').slice(0,120))}${(p.body||'').length>120?'…':''}</div>
      <div class="blog-card-meta">
        <span class="blog-card-author">@${esc(p.author||'')}</span>
        <span>${fmtDate(p.createdAt)}</span>
        <span>💬 ${p.commentCount||0}</span>
      </div>
    </div>
  `).join('');
}

window.setBlogSort = function(s){
  blogSort = s;
  ge('sortNew').classList.toggle('on', s==='new');
  ge('sortOld').classList.toggle('on', s==='old');
  renderBlogGrid();
};

// ── Open post ─────────────────────────────────────────
window.openPost = async function(postId){
  currentPostId = postId;
  showBlogPostView();

  const p = allPosts[postId];
  if(!p) return;

  ge('postTag').textContent    = p.tag || 'その他';
  ge('postTitle').textContent  = p.title || '無題';
  ge('postAuthor').textContent = '@' + (p.author||'');
  ge('postDate').textContent   = fmtDate(p.createdAt);
  ge('postBody').innerHTML     = renderMarkdown(p.body||'');

  // spoiler click already via renderMarkdown onclick

  const isOwner = currentSession && (currentSession.username===p.author || currentSession.isAdmin);
  ge('editPostBtn').style.display   = isOwner ? '' : 'none';
  ge('deletePostBtn').style.display = isOwner ? '' : 'none';

  // comments
  loadComments(postId);

  if(currentSession){
    ge('commentFormWrap').style.display   = '';
    ge('commentLoginPrompt').style.display= 'none';
  } else {
    ge('commentFormWrap').style.display   = 'none';
    ge('commentLoginPrompt').style.display= '';
  }

  // scroll to top
  window.scrollTo({top:0,behavior:'smooth'});
};

// ── Delete post ───────────────────────────────────────
window.deletePost = async function(postId){
  if(!currentSession) return;
  const p = allPosts[postId];
  if(!p) return;
  if(!confirm(`「${p.title}」を削除しますか？`)) return;
  try{
    await db.ref(`study_blog/posts/${postId}`).remove();
    delete allPosts[postId];
    renderBlogGrid();
    showBlogList();
    showToast('記事を削除しました');
  } catch(e){ showToast('削除エラー: '+e.message,'error'); }
};

// ── Blog Edit ─────────────────────────────────────────
window.openBlogEdit = function(postId){
  if(!currentSession){ openAuthModal('login'); return; }
  editingPostId = postId || null;
  showBlogEditView();
  setBlogEditMode('edit');

  // Build tag selector
  const grid = ge('tagSelGrid');
  grid.innerHTML = BLOG_TAGS.map(t=>`
    <button class="tag-opt${selectedTag===t?' on':''}" onclick="selectBlogTag('${t}')">${t}</button>
  `).join('');

  if(postId && allPosts[postId]){
    const p = allPosts[postId];
    ge('editTitle').value = p.title || '';
    ge('editBody').value  = p.body  || '';
    selectedTag = p.tag || '';
  } else {
    ge('editTitle').value = '';
    ge('editBody').value  = '';
    selectedTag = '';
  }
  updateTagGrid();
};

window.selectBlogTag = function(tag){
  selectedTag = tag;
  updateTagGrid();
};
function updateTagGrid(){
  const grid = ge('tagSelGrid');
  if(!grid) return;
  grid.querySelectorAll('.tag-opt').forEach(btn=>{
    btn.classList.toggle('on', btn.textContent === selectedTag);
  });
}

window.cancelBlogEdit = function(){
  if(editingPostId && allPosts[editingPostId]) openPost(editingPostId);
  else showBlogList();
};

window.setBlogEditMode = function(mode){
  ge('editModeBtn').classList.toggle('on',    mode==='edit');
  ge('previewModeBtn').classList.toggle('on', mode==='preview');
  ge('editPane').style.display    = mode==='edit'    ? '' : 'none';
  ge('previewPane').style.display = mode==='preview' ? '' : 'none';
  if(mode==='preview'){
    ge('previewTitle').textContent = ge('editTitle').value || '（タイトルなし）';
    ge('previewTag').textContent   = selectedTag || 'その他';
    ge('previewBody').innerHTML    = renderMarkdown(ge('editBody').value);
  }
};

window.savePost = async function(){
  if(!currentSession){ openAuthModal('login'); return; }
  const title = ge('editTitle').value.trim();
  const body  = ge('editBody').value.trim();
  if(!title){ showToast('タイトルを入力してください','error'); return; }
  if(!body){  showToast('本文を入力してください','error');    return; }

  const now = Date.now();
  const data = {
    title, body,
    tag: selectedTag || 'その他',
    author: currentSession.username,
    updatedAt: now,
    ...(editingPostId && allPosts[editingPostId]
        ? { createdAt: allPosts[editingPostId].createdAt, commentCount: allPosts[editingPostId].commentCount||0 }
        : { createdAt: now, commentCount: 0 })
  };

  try{
    if(editingPostId){
      await db.ref(`study_blog/posts/${editingPostId}`).update(data);
      allPosts[editingPostId] = { ...allPosts[editingPostId], ...data };
      showToast('記事を更新しました','success');
      openPost(editingPostId);
    } else {
      const ref = db.ref('study_blog/posts').push();
      await ref.set(data);
      allPosts[ref.key] = data;
      showToast('記事を公開しました','success');
      renderBlogGrid();
      openPost(ref.key);
    }
    editingPostId = null;
  } catch(e){ showToast('保存エラー: '+e.message,'error'); }
};

// ── Comments ──────────────────────────────────────────
async function loadComments(postId){
  const list = ge('commentList');
  list.innerHTML = '<div style="padding:16px;color:var(--text3);font-size:13px">読み込み中...</div>';
  try{
    const snap = await db.ref(`study_blog/comments/${postId}`).orderByChild('createdAt').once('value');
    const comments = snap.val() || {};
    const arr = Object.entries(comments).sort((a,b)=>a[1].createdAt-b[1].createdAt);
    ge('commentCount').textContent = arr.length;
    if(arr.length===0){
      list.innerHTML = '<div class="comment-empty">まだコメントはありません</div>';
      return;
    }
    list.innerHTML = arr.map(([cid,c])=>`
      <div class="comment-item" id="c_${cid}">
        <div class="comment-header">
          <span class="comment-author">@${esc(c.author)}</span>
          <span class="comment-date">${fmtDate(c.createdAt)}</span>
          ${currentSession && (currentSession.username===c.author||currentSession.isAdmin)
            ? `<button class="comment-del" onclick="deleteComment('${postId}','${cid}')" title="削除">✕</button>` : ''}
        </div>
        <div class="comment-body">${esc(c.body)}</div>
      </div>
    `).join('');
  } catch(e){
    list.innerHTML = '<div class="comment-empty">読み込みエラー</div>';
  }
}

window.submitComment = async function(){
  if(!currentSession){ openAuthModal('login'); return; }
  const input = ge('commentInput');
  const body  = (input.value||'').trim();
  if(!body) return;
  if(!currentPostId) return;
  try{
    const ref = db.ref(`study_blog/comments/${currentPostId}`).push();
    await ref.set({ author: currentSession.username, body, createdAt: Date.now() });
    // increment comment count
    const p = allPosts[currentPostId];
    if(p){ p.commentCount = (p.commentCount||0)+1; await db.ref(`study_blog/posts/${currentPostId}/commentCount`).set(p.commentCount); }
    input.value = '';
    loadComments(currentPostId);
    showToast('コメントを投稿しました','success');
  } catch(e){ showToast('投稿エラー: '+e.message,'error'); }
};

window.deleteComment = async function(postId, commentId){
  if(!confirm('このコメントを削除しますか？')) return;
  try{
    await db.ref(`study_blog/comments/${postId}/${commentId}`).remove();
    const p = allPosts[postId];
    if(p && p.commentCount>0){ p.commentCount--; await db.ref(`study_blog/posts/${postId}/commentCount`).set(p.commentCount); }
    loadComments(postId);
    showToast('コメントを削除しました');
  } catch(e){ showToast('削除エラー','error'); }
};

// ══════════════════════════════════════════════════════
//  FLASHCARD ENGINE
// ══════════════════════════════════════════════════════
window.switchTab = (function(orig){
  return function(tab){
    orig(tab);
  };
})(window.switchTab);

// re-define clean (closure from above is fine)
window.switchTab = function(tab){
  ge('pageStudy').classList.toggle('active', tab==='study');
  ge('pageBlog').classList.toggle('active',  tab==='blog');
  ge('tabStudy').classList.toggle('on', tab==='study');
  ge('tabBlog').classList.toggle('on',  tab==='blog');
  if(tab==='blog'){ loadBlogPosts(); }
};

// Nav
function toggleAcctMenu(){ ge('acctMenu').classList.toggle('open'); }
function closeAcctMenu(){  ge('acctMenu').classList.remove('open'); }
window.toggleAcctMenu = toggleAcctMenu;
window.closeAcctMenu  = closeAcctMenu;
document.addEventListener('click',e=>{
  const m=ge('acctMenu'),b=ge('navUserBtn');
  if(m&&b&&!b.contains(e.target)&&!m.contains(e.target)) m.classList.remove('open');
});

// Profile modal
async function fetchUserProfile(username){
  try{ const s=await db.ref(`users/${username}`).once('value'); return s.val(); }catch(e){return null;}
}
function openMyProfile(){ if(!currentSession){openAuthModal('login');return;} showProfileModal(currentSession); }
window.openMyProfile = openMyProfile;

function showProfileModal(session){
  const ex=ge('profileModal'); if(ex) ex.remove();
  const ov=document.createElement('div');
  ov.id='profileModal';
  ov.style.cssText='position:fixed;inset:0;z-index:600;background:rgba(8,13,28,.55);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;';
  ov.innerHTML=`
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r-sm);width:100%;max-width:340px;box-shadow:var(--shadow-lg);position:relative;overflow:hidden;font-family:var(--Fb);">
      <div style="height:5px;background:linear-gradient(90deg,var(--primary),var(--blog))"></div>
      <button onclick="document.getElementById('profileModal').remove()" style="position:absolute;top:16px;right:14px;width:26px;height:26px;border-radius:var(--r-xs);background:var(--surface2);color:var(--text3);font-size:12px;cursor:pointer;border:none;display:flex;align-items:center;justify-content:center;">✕</button>
      <div style="padding:20px 22px">
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:18px">
          <canvas id="profileModalAvatar" width="72" height="72" style="border-radius:8px"></canvas>
          <div style="text-align:center">
            <div id="pmDispName" style="font-family:var(--Fd);font-weight:800;font-size:18px;color:var(--text)"></div>
            <div id="pmUsername" style="font-family:var(--Fm);font-size:11px;color:var(--text3);margin-top:3px"></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-xs);padding:10px;text-align:center">
            <div id="pmDecks" style="font-family:var(--Fm);font-size:22px;font-weight:700;color:var(--primary)">—</div>
            <div style="font-size:10px;color:var(--text3);font-weight:700;letter-spacing:.4px;text-transform:uppercase;margin-top:4px">デッキ</div>
          </div>
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-xs);padding:10px;text-align:center">
            <div id="pmPosts" style="font-family:var(--Fm);font-size:22px;font-weight:700;color:var(--blog)">—</div>
            <div style="font-size:10px;color:var(--text3);font-weight:700;letter-spacing:.4px;text-transform:uppercase;margin-top:4px">記事</div>
          </div>
        </div>
        <div id="pmBio" style="font-size:13px;color:var(--text2);text-align:center;margin-bottom:16px;line-height:1.6"></div>
        <button onclick="document.getElementById('profileModal').remove()" style="width:100%;padding:10px;border-radius:var(--r-xs);background:var(--primary);color:#fff;font-weight:700;font-size:13px;border:none;cursor:pointer;font-family:var(--Fb)">閉じる</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click',e=>{ if(e.target===ov) ov.remove(); });

  const av=localStorage.getItem('fm_avatar_'+session.username)||null;
  drawAvatar(ge('profileModalAvatar'), session.username, av, 72);
  ge('pmDispName').textContent = session.username;
  ge('pmUsername').textContent = '@'+session.username;
  ge('pmDecks').textContent = Object.keys(decks).length;

  // count user's posts
  const postCount = Object.values(allPosts).filter(p=>p.author===session.username).length;
  ge('pmPosts').textContent = postCount;

  fetchUserProfile(session.username).then(p=>{
    if(!p) return;
    if(p.bio) ge('pmBio').textContent = p.bio;
    if(p.displayName) ge('pmDispName').textContent = p.displayName;
  }).catch(()=>{});
}

// Auth
let authMode='login';
function openAuthModal(mode='login'){
  authMode=mode;
  ge('authModal').classList.add('active');
  updateAuthUI();
  ge('authError').classList.remove('visible');
  ge('authUsername').value=''; ge('authPassword').value='';
  ge('authUsername').focus();
}
function closeAuthModal(){ ge('authModal').classList.remove('active'); }
function updateAuthUI(){
  const isL=authMode==='login';
  ge('authTitle').textContent    = isL?'ログイン':'新規登録';
  ge('authSubmitBtn').textContent= isL?'[ ログイン ]':'[ 登録 ]';
  ge('authSwitchText').innerHTML = isL
    ? 'アカウントをお持ちでない方は<a onclick="switchAuthMode()">こちら</a>'
    : 'すでにアカウントをお持ちの方は<a onclick="switchAuthMode()">こちら</a>';
}
window.switchAuthMode=function(){ authMode=authMode==='login'?'register':'login'; updateAuthUI(); ge('authError').classList.remove('visible'); };
window.openAuthModal  = openAuthModal;
window.closeAuthModal = closeAuthModal;

async function handleAuthSubmit(e){
  e.preventDefault();
  const username = ge('authUsername').value.trim();
  const password = ge('authPassword').value;
  const errEl    = ge('authError');
  errEl.classList.remove('visible');
  if(!username||!password){errEl.textContent='ユーザー名とパスワードを入力してください';errEl.classList.add('visible');return;}
  if(username.length<3){errEl.textContent='ユーザー名は3文字以上必要です';errEl.classList.add('visible');return;}
  const email=`${username}@hghome.app`;
  const btn=ge('authSubmitBtn'); btn.disabled=true; btn.textContent='...';
  try{
    if(authMode==='login'){
      await auth.signInWithEmailAndPassword(email,password);
    } else {
      if(password.length<6) throw new Error('パスワードは6文字以上必要です');
      const cred=await auth.createUserWithEmailAndPassword(email,password);
      await db.ref(`users/${username}`).set({uid:cred.user.uid,username,createdAt:Date.now(),isAdmin:false,bio:'',displayName:username});
    }
    closeAuthModal();
  } catch(err){
    let msg=err.message;
    if(err.code==='auth/user-not-found'||err.code==='auth/wrong-password') msg='ユーザー名またはパスワードが違います';
    if(err.code==='auth/email-already-in-use') msg='このユーザー名はすでに使われています';
    if(err.code==='auth/weak-password') msg='パスワードは6文字以上にしてください';
    if(err.code==='auth/too-many-requests') msg='しばらく待ってから再試行してください';
    errEl.textContent=msg; errEl.classList.add('visible');
  } finally{ btn.disabled=false; updateAuthUI(); }
}

// Auth state observer
auth.onAuthStateChanged(async user=>{
  if(user){
    currentUser=user;
    const username=user.email.replace('@hghome.app','');
    let isAdmin=false;
    try{ const s=await db.ref(`users/${username}`).once('value'); const d=s.val(); if(d) isAdmin=!!d.isAdmin; }catch(e){}
    currentSession={uid:user.uid,username,isAdmin};
    saveSession(currentSession);
    onLogin();
  } else {
    currentUser=null; currentSession=null; clearSession(); onLogout();
  }
});

function updateNavUI(){
  if(currentSession){
    ge('navLoginBtn').style.display='none';
    ge('navUserBtn').style.display='flex';
    ge('navUsername').textContent=currentSession.username+(currentSession.isAdmin?' [ADMIN]':'');
    ge('acctMenuDispName').textContent=currentSession.username;
    ge('acctMenuUsername').textContent='@'+currentSession.username;
    const av=localStorage.getItem('fm_avatar_'+currentSession.username)||null;
    drawAvatar(ge('navAvatarCanvas'),currentSession.username,av,24);
    drawAvatar(ge('acctMenuAvatar'), currentSession.username,av,36);
    ge('newPostBtn').style.display='';
  } else {
    ge('navLoginBtn').style.display='';
    ge('navUserBtn').style.display='none';
    ge('newPostBtn').style.display='none';
  }
}

function onLogin(){
  updateNavUI();
  ge('welcomeScreen').style.display='none';
  loadDecks();
  showToast(`ようこそ、${currentSession.username}さん！`);
  // refresh blog UI if on blog tab
  if(ge('pageBlog').classList.contains('active')) loadBlogPosts();
  // update comment form visibility
  if(currentPostId){
    ge('commentFormWrap').style.display='';
    ge('commentLoginPrompt').style.display='none';
  }
}
function onLogout(){
  updateNavUI();
  ge('welcomeScreen').style.display='flex';
  ge('studyArea').classList.remove('active');
  decks={}; currentDeckId=null;
  if(ge('pageBlog').classList.contains('active')){
    renderBlogGrid();
    // update comment form
    ge('commentFormWrap').style.display='none';
    ge('commentLoginPrompt').style.display='';
  }
}
window.handleLogout = async function(){ await auth.signOut(); showToast('ログアウトしました'); };

// ── Decks ─────────────────────────────────────────────
async function loadDecks(){
  try{
    const snap=await db.ref(`study/${currentUser.uid}/decks`).once('value');
    decks=snap.val()||{};
    refreshDeckSelect();
    if(Object.keys(decks).length===0) await createDeck('デフォルトデッキ');
    else{ currentDeckId=Object.keys(decks)[0]; showStudyView(); }
  }catch(e){ showToast('デッキ読み込みエラー: '+e.message,'error'); }
}
async function createDeck(name){
  const uid=currentUser.uid, deckId='deck_'+Date.now(), deck={name,cards:{},createdAt:Date.now()};
  try{
    await db.ref(`study/${uid}/decks/${deckId}`).set(deck);
    decks[deckId]=deck; currentDeckId=deckId;
    refreshDeckSelect(); showStudyView();
    showToast(`「${name}」を作成しました`,'success');
  }catch(e){ showToast('デッキ作成エラー: '+e.message,'error'); }
}
async function deleteDeck(deckId){
  if(!currentUser||!confirm(`「${decks[deckId]?.name}」を削除しますか？`)) return;
  try{
    await db.ref(`study/${currentUser.uid}/decks/${deckId}`).remove();
    delete decks[deckId]; currentDeckId=Object.keys(decks)[0]||null;
    refreshDeckSelect();
    if(currentDeckId) showStudyView(); else ge('studyArea').classList.remove('active');
    showToast('デッキを削除しました');
  }catch(e){ showToast('削除エラー: '+e.message,'error'); }
}
function refreshDeckSelect(){
  const sel=ge('deckSelect'); sel.innerHTML='';
  Object.entries(decks).forEach(([id,d])=>{
    const o=document.createElement('option'); o.value=id; o.textContent=d.name;
    if(id===currentDeckId) o.selected=true; sel.appendChild(o);
  });
}
window.onDeckChange    = function(v){ currentDeckId=v; isEditMode?showEditView():showStudyView(); };
window.promptNewDeck   = function(){ const n=prompt('デッキ名を入力してください'); if(n&&n.trim()) createDeck(n.trim()); };
window.confirmDeleteDeck = function(){ if(currentDeckId) deleteDeck(currentDeckId); };

// ── Cards ─────────────────────────────────────────────
async function addCard(front,back){
  if(!currentUser||!currentDeckId) return;
  const uid=currentUser.uid, cardId='card_'+Date.now();
  const card={front,back,createdAt:Date.now(),due:Date.now(),interval:0,ease:2.5,reps:0};
  try{
    await db.ref(`study/${uid}/decks/${currentDeckId}/cards/${cardId}`).set(card);
    if(!decks[currentDeckId].cards) decks[currentDeckId].cards={};
    decks[currentDeckId].cards[cardId]=card;
    renderCardsList(); showToast('カードを追加しました','success');
  }catch(e){ showToast('追加エラー: '+e.message,'error'); }
}
window.deleteCard = async function(cardId){
  if(!currentUser||!currentDeckId) return;
  try{
    await db.ref(`study/${currentUser.uid}/decks/${currentDeckId}/cards/${cardId}`).remove();
    delete decks[currentDeckId].cards[cardId]; renderCardsList(); showToast('カードを削除しました');
  }catch(e){ showToast('削除エラー: '+e.message,'error'); }
};
async function updateCardSRS(cardId,rating){
  const card=decks[currentDeckId]?.cards?.[cardId]; if(!card) return;
  let {interval,ease,reps}=card; ease=ease||2.5;
  if(rating===1){interval=1;reps=0;}
  else if(rating===2){if(reps===0)interval=1;else if(reps===1)interval=6;else interval=Math.round(interval*ease);reps++;ease=Math.max(1.3,ease-.08);}
  else{if(reps===0)interval=4;else interval=Math.round(interval*ease*1.3);reps++;ease=Math.min(3.0,ease+.15);}
  const due=Date.now()+interval*86400000;
  decks[currentDeckId].cards[cardId]={...card,interval,ease,reps,due};
  if(currentUser) await db.ref(`study/${currentUser.uid}/decks/${currentDeckId}/cards/${cardId}`).update({interval,ease,reps,due}).catch(()=>{});
}

// ── Views ─────────────────────────────────────────────
function showStudyView(){
  ge('studyArea').classList.add('active');
  ge('cardsListView').classList.remove('active');
  ge('sessionComplete').classList.remove('active');
  isEditMode=false; buildStudyQueue(); renderFlashcard(); updateToolbarStats(); updateEditToggleBtn();
}
function showEditView(){
  ge('studyArea').classList.add('active');
  ge('cardsListView').classList.add('active');
  ge('sessionComplete').classList.remove('active');
  isEditMode=true; renderCardsList(); updateEditToggleBtn();
}
function showSessionComplete(){
  ge('studyArea').classList.add('active');
  ge('sessionComplete').classList.add('active');
  ge('sessionComplete').querySelector('.complete-stats').innerHTML=
    `総数: <strong>${sessionStats.total}</strong> &nbsp;|&nbsp; もう一度: <strong>${sessionStats.again}</strong> &nbsp;|&nbsp; Good: <strong>${sessionStats.good}</strong> &nbsp;|&nbsp; Easy: <strong>${sessionStats.easy}</strong>`;
}
function updateEditToggleBtn(){
  const b=ge('editToggleBtn'); if(!b) return;
  b.textContent=isEditMode?'学習モード':'カード編集';
  b.classList.toggle('active',isEditMode);
}
function updateToolbarStats(){
  const d=decks[currentDeckId]; if(!d) return;
  const total=d.cards?Object.keys(d.cards).length:0;
  const due=d.cards?Object.values(d.cards).filter(c=>c.due<=Date.now()+300000).length:0;
  const el=ge('toolbarStats'); if(el) el.innerHTML=`カード: <span>${total}</span> &nbsp; 学習中: <span>${due}</span>`;
}
window.toggleEditMode = function(){ isEditMode?showStudyView():showEditView(); };

// ── Flashcard ─────────────────────────────────────────
function buildStudyQueue(){
  const d=decks[currentDeckId]; if(!d||!d.cards){studyQueue=[];return;}
  const now=Date.now();
  studyQueue=Object.entries(d.cards).filter(([_,c])=>c.due<=now+300000).sort((a,b)=>a[1].due-b[1].due).map(([id])=>id);
  if(studyQueue.length===0) studyQueue=Object.keys(d.cards);
  for(let i=studyQueue.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[studyQueue[i],studyQueue[j]]=[studyQueue[j],studyQueue[i]];}
  currentCardIdx=0; cardFlipped=false; sessionStats={total:studyQueue.length,again:0,good:0,easy:0};
}
function renderFlashcard(){
  const d=decks[currentDeckId];
  if(!d||!d.cards||studyQueue.length===0){ge('studyArea').classList.remove('active');return;}
  if(currentCardIdx>=studyQueue.length){showSessionComplete();return;}
  const cardId=studyQueue[currentCardIdx], card=d.cards[cardId];
  if(!card){currentCardIdx++;renderFlashcard();return;}
  cardFlipped=false;
  ge('cardFront').textContent=card.front; ge('cardBack').textContent=card.back;
  ge('cardBackArea').style.display='none';
  document.querySelectorAll('.ctrl-btn').forEach(b=>b.disabled=true);
  ge('cardProgress').textContent=`${currentCardIdx} / ${studyQueue.length}`;
  ge('progressBar').style.width=`${(currentCardIdx/studyQueue.length)*100}%`;
}
window.flipCard = function(){ if(cardFlipped)return; cardFlipped=true; ge('cardBackArea').style.display='flex'; document.querySelectorAll('.ctrl-btn').forEach(b=>b.disabled=false); };
window.rateCard = async function(rating){
  const cardId=studyQueue[currentCardIdx];
  if(rating===1) sessionStats.again++; else if(rating===2) sessionStats.good++; else sessionStats.easy++;
  await updateCardSRS(cardId,rating);
  if(rating===1){ const r=Math.min(currentCardIdx+3,studyQueue.length); studyQueue.splice(r,0,cardId); }
  currentCardIdx++; renderFlashcard();
};
window.restartSession = function(){ buildStudyQueue(); renderFlashcard(); ge('sessionComplete').classList.remove('active'); };

// ── Edit mode card list ───────────────────────────────
function renderCardsList(){
  const d=decks[currentDeckId], list=ge('cardsList');
  if(!d||!d.cards||Object.keys(d.cards).length===0){
    list.innerHTML='<p style="color:var(--text3);font-family:var(--Fm);font-size:12px;padding:16px 0">カードがまだありません。上のフォームから追加してください。</p>'; return;
  }
  list.innerHTML='';
  Object.entries(d.cards).forEach(([id,card])=>{
    const item=document.createElement('div'); item.className='card-item';
    item.innerHTML=`<div class="card-item-body"><div class="card-item-front">${esc(card.front)}</div><div class="card-item-back">→ ${esc(card.back)}</div></div><button class="card-delete" onclick="deleteCard('${id}')">✕</button>`;
    list.appendChild(item);
  });
}
window.handleAddCard = function(e){
  e.preventDefault();
  const front=ge('addFront').value.trim(), back=ge('addBack').value.trim();
  if(!front||!back){showToast('表面・裏面を入力してください','error');return;}
  addCard(front,back); ge('addFront').value=''; ge('addBack').value=''; ge('addFront').focus();
};

// ── Toast ─────────────────────────────────────────────
let toastTimer;
function showToast(msg,type=''){
  const t=ge('toast'); t.textContent=msg;
  t.className='toast'+(type?' '+type:'')+' show';
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),3000);
}

// ── Theme ─────────────────────────────────────────────
let themeIdx=localStorage.getItem('hgstudy_theme')==='dark'?1:0;
function applyTheme(){
  document.documentElement.setAttribute('data-theme',themeIdx===0?'light':'dark');
  const b=ge('themeToggle'); if(b) b.textContent=themeIdx===0?'🌙':'☀️';
}
window.toggleTheme=function(){ themeIdx=(themeIdx+1)%2; localStorage.setItem('hgstudy_theme',themeIdx===0?'light':'dark'); applyTheme(); };
applyTheme();

// ── Init ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',()=>{
  ge('authForm')?.addEventListener('submit',handleAuthSubmit);
  ge('authModal')?.addEventListener('click',e=>{if(e.target===ge('authModal'))closeAuthModal();});
  ge('flashcard')?.addEventListener('click',()=>window.flipCard());
  ge('welcomeScreen').style.display='flex';
  ge('studyArea').classList.remove('active');
});
