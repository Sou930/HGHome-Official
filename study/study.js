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
const app = firebase.initializeApp(firebaseConfig);
const db  = firebase.database();

// ── Password Hashing (pure JS SHA-256, no crypto.subtle required) ────
function hashPass(pw){
  // Pure JS SHA-256 — works on all browsers including iOS Safari non-HTTPS
  const msg = 'hgstudy:' + pw;
  function sha256(str){
    function rr(n,d){return(n>>>d)|(n<<(32-d));}
    const H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    const bytes=[];
    for(let i=0;i<str.length;i++){
      const c=str.charCodeAt(i);
      if(c<128)bytes.push(c);
      else if(c<2048)bytes.push(0xc0|(c>>6),0x80|(c&0x3f));
      else bytes.push(0xe0|(c>>12),0x80|((c>>6)&0x3f),0x80|(c&0x3f));
    }
    const l=bytes.length*8;
    bytes.push(0x80);
    while(bytes.length%64!==56)bytes.push(0);
    for(let i=7;i>=0;i--)bytes.push((l/(Math.pow(2,i*8)))&0xff);
    const w=new Array(64);
    for(let i=0;i<bytes.length/64;i++){
      for(let j=0;j<16;j++)w[j]=(bytes[i*64+j*4]<<24)|(bytes[i*64+j*4+1]<<16)|(bytes[i*64+j*4+2]<<8)|bytes[i*64+j*4+3];
      for(let j=16;j<64;j++){const s0=rr(w[j-15],7)^rr(w[j-15],18)^(w[j-15]>>>3);const s1=rr(w[j-2],17)^rr(w[j-2],19)^(w[j-2]>>>10);w[j]=(w[j-16]+s0+w[j-7]+s1)>>>0;}
      let [a,b,c,d,e,f,g,h]=[...H];
      for(let j=0;j<64;j++){const S1=rr(e,6)^rr(e,11)^rr(e,25);const ch=(e&f)^(~e&g);const t1=(h+S1+ch+K[j]+w[j])>>>0;const S0=rr(a,2)^rr(a,13)^rr(a,22);const maj=(a&b)^(a&c)^(b&c);const t2=(S0+maj)>>>0;h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}
      H[0]=(H[0]+a)>>>0;H[1]=(H[1]+b)>>>0;H[2]=(H[2]+c)>>>0;H[3]=(H[3]+d)>>>0;H[4]=(H[4]+e)>>>0;H[5]=(H[5]+f)>>>0;H[6]=(H[6]+g)>>>0;H[7]=(H[7]+h)>>>0;
    }
    return H.map(n=>n.toString(16).padStart(8,'0')).join('');
  }
  return Promise.resolve(sha256(msg));
}

// ── Session (HGHome/HGStudy 共通キー) ─────────────────
function saveSession(d){
  try{
    const str=JSON.stringify(d);
    localStorage.setItem('hg_session_ls',str);
    localStorage.setItem('hgs_sess',str);
    const exp='; expires='+new Date(Date.now()+30*864e5).toUTCString();
    const sec=location.protocol==='https:'?'; Secure':'';
    document.cookie='hg_session='+encodeURIComponent(str)+exp+'; path=/; SameSite=Lax'+sec;
    document.cookie='hgs_sess='+encodeURIComponent(str)+exp+'; path=/; SameSite=Lax'+sec;
  }catch(e){}
}
function loadSession(){
  try{
    const n=localStorage.getItem('hg_session_ls'); if(n) return JSON.parse(n);
    const o=localStorage.getItem('hgs_sess');      if(o) return JSON.parse(o);
    const mc=document.cookie.match(/(?:^|; )hg_session=([^;]*)/); if(mc) return JSON.parse(decodeURIComponent(mc[1]));
    const mo=document.cookie.match(/(?:^|; )hgs_sess=([^;]*)/);   if(mo) return JSON.parse(decodeURIComponent(mo[1]));
  }catch(e){}
  return null;
}
function clearSession(){
  try{ localStorage.removeItem('hg_session_ls'); localStorage.removeItem('hgs_sess'); }catch(e){}
  document.cookie='hg_session=;path=/;max-age=0';
  document.cookie='hgs_sess=;path=/;max-age=0';
}

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
    .replace(/^#{3} (.+)$/gm,'<h3>$1</h3>')
    .replace(/^#{2} (.+)$/gm,'<h2>$1</h2>')
    .replace(/^# (.+)$/gm,'<h1>$1</h1>')
    .replace(/^&gt; (.+)$/gm,'<blockquote>$1</blockquote>')
    .replace(/^---$/gm,'<hr>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/`(.+?)`/g,'<code>$1</code>')
    .replace(/\|\|(.+?)\|\|/g,'<span class="spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>')
    .replace(/\[(.+?)\]\((https?:\/\/[^\)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^\|(.+)\|$/gm, m => '<tr>' + m.slice(1,-1).split('|').map(c=>`<td>${c.trim()}</td>`).join('') + '</tr>')
    .replace(/(<tr>.*<\/tr>\n?){2,}/gs, t => `<table>${t.replace(/<tr>(<td>.*?<\/td>)+<\/tr>/,'m => m.replace(/<td>/g,"<th>").replace(/<\/td>/g,"</th>">')}</table>`);

  s = s.replace(/(^- .+\n?)+/gm, m => '<ul>' + m.split('\n').filter(l=>l.startsWith('- ')).map(l=>`<li>${l.slice(2)}</li>`).join('') + '</ul>');
  s = s.replace(/(^\d+\. .+\n?)+/gm, m => '<ol>' + m.split('\n').filter(l=>/^\d+\./.test(l)).map(l=>`<li>${l.replace(/^\d+\. /,'')}</li>`).join('') + '</ol>');
  s = s.replace(/```[\w]*\n?([\s\S]+?)```/g,'<pre><code>$1</code></pre>');
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

function showBlogList(){ ge('blogList').style.display=''; ge('blogPost').style.display='none'; ge('blogEdit').style.display='none'; }
function showBlogPostView(){ ge('blogList').style.display='none'; ge('blogPost').style.display=''; ge('blogEdit').style.display='none'; }
function showBlogEditView(){ ge('blogList').style.display='none'; ge('blogPost').style.display='none'; ge('blogEdit').style.display=''; }

async function loadBlogPosts(){
  try{
    const snap = await db.ref('blogs').once('value');
    allPosts = snap.val() || {};
    renderBlogGrid();
  } catch(e){
    ge('blogPostsGrid').innerHTML = `<div class="blog-empty"><div class="empty-emoji">⚠️</div><p>読み込みエラー: ${esc(e.message)}</p></div>`;
  }
}

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
      <div class="blog-card-preview">${esc((p.content||'').slice(0,120))}${(p.content||'').length>120?'…':''}</div>
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

window.openPost = async function(postId){
  currentPostId = postId;
  showBlogPostView();

  const p = allPosts[postId];
  if(!p) return;

  ge('postTag').textContent    = p.tag || 'その他';
  ge('postTitle').textContent  = p.title || '無題';
  ge('postAuthor').textContent = '@' + (p.author||'');
  ge('postDate').textContent   = fmtDate(p.createdAt);
  ge('postBody').innerHTML     = renderMarkdown(p.content||'');

  const isOwner = currentSession && (currentSession.username===p.author || currentSession.isAdmin);
  ge('editPostBtn').style.display   = isOwner ? '' : 'none';
  ge('deletePostBtn').style.display = isOwner ? '' : 'none';

  loadComments(postId);

  if(currentSession){
    ge('commentFormWrap').style.display   = '';
    ge('commentLoginPrompt').style.display= 'none';
  } else {
    ge('commentFormWrap').style.display   = 'none';
    ge('commentLoginPrompt').style.display= '';
  }

  window.scrollTo({top:0,behavior:'smooth'});
};

window.deletePost = async function(postId){
  if(!currentSession) return;
  const p = allPosts[postId];
  if(!p) return;
  if(!confirm(`「${p.title}」を削除しますか？`)) return;
  try{
    await db.ref(`blogs/${postId}`).remove();
    delete allPosts[postId];
    renderBlogGrid();
    showBlogList();
    showToast('記事を削除しました');
  } catch(e){ showToast('削除エラー: '+e.message,'error'); }
};

window.openBlogEdit = function(postId){
  if(!currentSession){ openAuthModal('login'); return; }
  editingPostId = postId || null;
  showBlogEditView();
  setBlogEditMode('edit');

  const grid = ge('tagSelGrid');
  grid.innerHTML = BLOG_TAGS.map(t=>`
    <button class="tag-opt${selectedTag===t?' on':''}" onclick="selectBlogTag('${t}')">${t}</button>
  `).join('');

  if(postId && allPosts[postId]){
    const p = allPosts[postId];
    ge('editTitle').value = p.title || '';
    ge('editBody').value  = p.content || '';
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
  const content = ge('editBody').value.trim();
  if(!title){ showToast('タイトルを入力してください','error'); return; }
  if(!content){  showToast('本文を入力してください','error');    return; }

  const now = Date.now();
  const data = {
    title, content,
    tag: selectedTag || 'その他',
    author: currentSession.username,
    updatedAt: now,
    ...(editingPostId && allPosts[editingPostId]
        ? { createdAt: allPosts[editingPostId].createdAt, commentCount: allPosts[editingPostId].commentCount||0 }
        : { createdAt: now, commentCount: 0 })
  };

  try{
    if(editingPostId){
      await db.ref(`blogs/${editingPostId}`).update(data);
      allPosts[editingPostId] = { ...allPosts[editingPostId], ...data };
      showToast('記事を更新しました','success');
      openPost(editingPostId);
    } else {
      const ref = db.ref('blogs').push();
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
    const snap = await db.ref(`blogs_comments/${postId}`).orderByChild('createdAt').once('value');
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
    const ref = db.ref(`blogs_comments/${currentPostId}`).push();
    await ref.set({ author: currentSession.username, body, createdAt: Date.now() });
    const p = allPosts[currentPostId];
    if(p){ p.commentCount = (p.commentCount||0)+1; await db.ref(`blogs/${currentPostId}/commentCount`).set(p.commentCount); }
    input.value = '';
    loadComments(currentPostId);
    showToast('コメントを投稿しました','success');
  } catch(e){ showToast('投稿エラー: '+e.message,'error'); }
};

window.deleteComment = async function(postId, commentId){
  if(!confirm('このコメントを削除しますか？')) return;
  try{
    await db.ref(`blogs_comments/${postId}/${commentId}`).remove();
    const p = allPosts[postId];
    if(p && p.commentCount>0){ p.commentCount--; await db.ref(`blogs/${postId}/commentCount`).set(p.commentCount); }
    loadComments(postId);
    showToast('コメントを削除しました');
  } catch(e){ showToast('削除エラー','error'); }
};

// ══════════════════════════════════════════════════════
//  AUTH (DB hash-based — no Firebase Auth)
// ══════════════════════════════════════════════════════

// Nav
function toggleAcctMenu(){ ge('acctMenu').classList.toggle('open'); }
function closeAcctMenu(){  ge('acctMenu').classList.remove('open'); }
window.toggleAcctMenu = toggleAcctMenu;
window.closeAcctMenu  = closeAcctMenu;
document.addEventListener('click',e=>{
  const m=ge('acctMenu'),b=ge('navUserBtn');
  if(m&&b&&!b.contains(e.target)&&!m.contains(e.target)) m.classList.remove('open');
});

// ── Profile ──────────────────────────────────────────
async function fetchUserProfile(username){
  try{ const s=await db.ref(`users/${username}`).once('value'); return s.val(); }catch(e){return null;}
}

window.openMyProfile = function(){ if(!currentSession){openAuthModal('login');return;} openProfileModal(currentSession.username); };

// 他ユーザーのプロフィールを開く
window.openUserProfile = function(username){ openProfileModal(username); };

async function openProfileModal(targetUsername){
  const ex=ge('profileModal'); if(ex) ex.remove();

  // オーバーレイ作成（ローディング状態）
  const ov=document.createElement('div');
  ov.id='profileModal';
  ov.style.cssText='position:fixed;inset:0;z-index:600;background:rgba(8,13,28,.6);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
  ov.innerHTML=`<div id="pmCard" style="background:var(--surface);border:1px solid var(--border);border-radius:16px;width:100%;max-width:420px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.4);font-family:var(--Fb);">
    <div style="height:4px;background:linear-gradient(90deg,var(--primary),var(--blog),#F6C344)"></div>
    <div style="padding:24px;text-align:center;color:var(--text3);font-size:13px">読み込み中...</div>
  </div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click',e=>{ if(e.target===ov) ov.remove(); });

  // データ並列取得
  const isSelf = currentSession && currentSession.username === targetUsername;
  let profileData={}, allFollows={}, deckSnap={}, amFollowing=false;

  try{
    // follows/{user} = そのユーザーがフォローしているユーザーの map {targetUser: true}
    const [pSnap, fSnap, dSnap, allFollowsSnap, allCardsSnap] = await Promise.all([
      db.ref(`users/${targetUsername}`).once('value'),
      db.ref(`follows/${targetUsername}`).once('value'),
      db.ref('decks').once('value'),
      db.ref('follows').once('value'),
      db.ref('cards').once('value'),
    ]);
    profileData = pSnap.val() || {};
    const followingMap = fSnap.val() || {};   // targetUsername がフォローしている人
    const allDecksRaw = dSnap.val() || {};
    deckSnap = Object.fromEntries(Object.entries(allDecksRaw).filter(([,d])=>d.owner===targetUsername));
    // カード数をデッキに付与
    const allCardsRaw = allCardsSnap.val() || {};
    for(const [,card] of Object.entries(allCardsRaw)){
      if(card.deckId && deckSnap[card.deckId]){
        deckSnap[card.deckId]._cardCount = (deckSnap[card.deckId]._cardCount||0)+1;
      }
    }
    allFollows = allFollowsSnap.val() || {};

    // フォロワー: follows/{otherUser}/{targetUsername} === true な人を数える
    // フォロー中: follows/{targetUsername} のキー数
    if(currentSession && !isSelf){
      const myFollows = allFollows[currentSession.username] || {};
      amFollowing = myFollows[targetUsername] === true;
    }

    // followerCount: allFollows の各ユーザーのフォローリストに targetUsername が含まれる数
    var followerCount = Object.values(allFollows).filter(f=> f && f[targetUsername]===true).length;
    var followingCount = Object.keys(followingMap).length;
  }catch(e){ var followerCount=0, followingCount=0; }

  const deckList = Object.entries(deckSnap);
  const postCount = Object.values(allPosts).filter(p=>p.author===targetUsername).length;
  const displayName = profileData.displayName || targetUsername;
  const bio = profileData.bio || '';
  const av = localStorage.getItem('fm_avatar_'+targetUsername) || (profileData.avatar||null);

  // デッキカード HTML
  const decksHTML = deckList.length === 0
    ? `<div style="color:var(--text3);font-size:12px;text-align:center;padding:16px 0">デッキがありません</div>`
    : deckList.map(([id,dk])=>{
        const cardCount = dk._cardCount || 0;
        return `<div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px 14px;cursor:pointer;transition:border-color .15s;" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border)'">
          <div style="font-weight:700;font-size:13px;color:var(--text);margin-bottom:3px">${esc(dk.name||'無題')}</div>
          <div style="font-size:11px;color:var(--text3)">${cardCount} カード</div>
        </div>`;
      }).join('');

  // フォローボタン
  const followBtnHTML = (!currentSession || isSelf) ? '' : `
    <button id="pmFollowBtn" onclick="toggleFollow('${targetUsername}')"
      style="padding:7px 22px;border-radius:99px;font-weight:700;font-size:12px;cursor:pointer;border:1.5px solid ${amFollowing?'var(--border)':'var(--primary)'};background:${amFollowing?'transparent':'var(--primary)'};color:${amFollowing?'var(--text2)':'#fff'};font-family:var(--Fb);transition:all .18s;">
      ${amFollowing?'フォロー中':'フォローする'}
    </button>`;

  ge('pmCard').innerHTML = `
    <div style="height:4px;background:linear-gradient(90deg,var(--primary),var(--blog),#F6C344)"></div>
    <button onclick="document.getElementById('profileModal').remove()" style="position:absolute;top:14px;right:14px;width:28px;height:28px;border-radius:8px;background:var(--surface2);color:var(--text3);font-size:13px;cursor:pointer;border:none;display:flex;align-items:center;justify-content:center;z-index:1;">✕</button>
    <div style="position:relative;">

      <!-- ヘッダー -->
      <div style="padding:28px 24px 20px;display:flex;flex-direction:column;align-items:center;gap:12px;border-bottom:1px solid var(--border)">
        <canvas id="pmAvatarCanvas" width="80" height="80" style="border-radius:12px;flex-shrink:0"></canvas>
        <div style="text-align:center">
          <div style="font-family:var(--Fd);font-weight:800;font-size:20px;color:var(--text);line-height:1.2" id="pmDispName">${esc(displayName)}</div>
          <div style="font-size:12px;color:var(--text3);margin-top:4px">@${esc(targetUsername)}</div>
          ${bio ? `<div style="font-size:13px;color:var(--text2);margin-top:8px;line-height:1.6;max-width:280px">${esc(bio)}</div>` : ''}
        </div>
        ${followBtnHTML}
      </div>

      <!-- 統計 -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid var(--border)">
        ${[
          ['フォロワー', followerCount, 'var(--primary)'],
          ['フォロー中', followingCount, 'var(--blog)'],
          ['デッキ', deckList.length, '#F6C344'],
          ['記事', postCount, '#52C4A3'],
        ].map(([lbl,val,col])=>`
          <div style="padding:14px 8px;text-align:center;border-right:1px solid var(--border)">
            <div style="font-family:var(--Fm);font-size:20px;font-weight:700;color:${col}">${val}</div>
            <div style="font-size:10px;color:var(--text3);margin-top:3px;letter-spacing:.3px">${lbl}</div>
          </div>`).join('')}
      </div>

      <!-- デッキ一覧 -->
      <div style="padding:16px 20px">
        <div style="font-size:11px;font-weight:700;color:var(--text3);letter-spacing:.8px;text-transform:uppercase;margin-bottom:10px">公開デッキ</div>
        <div style="display:grid;gap:8px;max-height:200px;overflow-y:auto">${decksHTML}</div>
      </div>

      <!-- 閉じる -->
      <div style="padding:0 20px 20px">
        <button onclick="document.getElementById('profileModal').remove()" style="width:100%;padding:10px;border-radius:8px;background:var(--surface2);color:var(--text2);font-weight:700;font-size:13px;border:1px solid var(--border);cursor:pointer;font-family:var(--Fb)">閉じる</button>
      </div>
    </div>`;

  // アバター描画
  drawAvatar(ge('pmAvatarCanvas'), targetUsername, av, 80);
}

// ── フォロー / アンフォロー ────────────────────────────
// follows/{me}/{target}: true  — meがtargetをフォローしている
window.toggleFollow = async function(targetUsername){
  if(!currentSession){ openAuthModal('login'); return; }
  const me = currentSession.username;
  const btn = ge('pmFollowBtn');
  const amSnap = await db.ref(`follows/${me}/${targetUsername}`).once('value');
  const am = amSnap.val() === true;

  if(am){
    // アンフォロー
    await db.ref(`follows/${me}/${targetUsername}`).remove();
    if(btn){ btn.textContent='フォローする'; btn.style.background='var(--primary)'; btn.style.color='#fff'; btn.style.borderColor='var(--primary)'; }
    showToast(`@${targetUsername} のフォローを解除しました`);
  } else {
    // フォロー
    await db.ref(`follows/${me}/${targetUsername}`).set(true);
    if(btn){ btn.textContent='フォロー中'; btn.style.background='transparent'; btn.style.color='var(--text2)'; btn.style.borderColor='var(--border)'; }
    showToast(`@${targetUsername} をフォローしました`);
  }
};

// Auth modal
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
  if(!/^[a-zA-Z0-9_]+$/.test(username)){errEl.textContent='ユーザー名は英数字・アンダースコアのみ使用できます';errEl.classList.add('visible');return;}
  if(password.length<6){errEl.textContent='パスワードは6文字以上必要です';errEl.classList.add('visible');return;}

  const btn=ge('authSubmitBtn'); btn.disabled=true; btn.textContent='...';

  try{
    const hash = await hashPass(password);

    if(authMode==='login'){
      // DB-based login
      const snap = await db.ref(`users/${username}`).once('value');
      const userData = snap.val();
      if(!userData || userData.hash !== hash){
        errEl.textContent='ユーザー名またはパスワードが違います';
        errEl.classList.add('visible');
        return;
      }
      const isAdmin = !!userData.isAdmin || !!userData.isadmin || userData.role === 'admin';
      currentSession = { uid: username, username, isAdmin };
      saveSession(currentSession);
      closeAuthModal();
      onLogin();

    } else {
      // DB-based register
      const snap = await db.ref(`users/${username}`).once('value');
      if(snap.exists()){
        errEl.textContent='このユーザー名はすでに使われています';
        errEl.classList.add('visible');
        return;
      }
      await db.ref(`users/${username}`).set({
        uid: username,
        username,
        hash,
        displayName: username,
        bio: '',
        avatar: '',
        isAdmin: false,
        createdAt: Date.now()
      });
      currentSession = { uid: username, username, isAdmin: false };
      saveSession(currentSession);
      closeAuthModal();
      onLogin();
    }
  } catch(err){
    errEl.textContent = 'エラー: ' + err.message;
    errEl.classList.add('visible');
  } finally{
    btn.disabled=false;
    updateAuthUI();
  }
}

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
  if(ge('pageBlog').classList.contains('active')) loadBlogPosts();
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
    ge('commentFormWrap').style.display='none';
    ge('commentLoginPrompt').style.display='';
  }
}
window.handleLogout = function(){
  currentSession = null;
  clearSession();
  onLogout();
  showToast('ログアウトしました');
};

// ── Decks ─────────────────────────────────────────────
async function loadDecks(){
  if(!currentSession) return;
  try{
    const me = currentSession.username;

    // decks/ 全件取得 → JS側でownerフィルタ
    const [dSnap, cSnap] = await Promise.all([
      db.ref('decks').once('value'),
      db.ref('cards').once('value'),
    ]);

    const allDecks = dSnap.val() || {};
    const allCards = cSnap.val() || {};

    decks = {};
    for(const [deckId, deck] of Object.entries(allDecks)){
      if(deck.owner === me){
        decks[deckId] = {...deck, cards:{}};
      }
    }
    // カードをデッキに紐付け（deckIdで紐付け、ownerで確認）
    for(const [cardId, card] of Object.entries(allCards)){
      if(card.deckId && decks[card.deckId]){
        decks[card.deckId].cards[cardId] = card;
      }
    }

    refreshDeckSelect();
    if(Object.keys(decks).length === 0) await createDeck('デフォルトデッキ');
    else{ currentDeckId = Object.keys(decks)[0]; showStudyView(); }
  }catch(e){ showToast('デッキ読み込みエラー: '+e.message, 'error'); }
}
async function createDeck(name){
  if(!currentSession) return;
  const deckId='deck_'+Date.now();
  const deck={name, owner:currentSession.username, createdAt:Date.now()};
  try{
    await db.ref(`decks/${deckId}`).set(deck);
    decks[deckId]={...deck, cards:{}}; currentDeckId=deckId;
    refreshDeckSelect(); showStudyView();
    showToast(`「${name}」を作成しました`,'success');
  }catch(e){ showToast('デッキ作成エラー: '+e.message,'error'); }
}
async function deleteDeck(deckId){
  if(!currentSession||!confirm(`「${decks[deckId]?.name}」を削除しますか？`)) return;
  try{
    // デッキに属するカードも削除
    const cardIds=Object.keys(decks[deckId]?.cards||{});
    const updates={};
    updates[`decks/${deckId}`]=null;
    for(const cid of cardIds) updates[`cards/${cid}`]=null;
    await db.ref().update(updates);
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
  if(!currentSession||!currentDeckId) return;
  const cardId='card_'+Date.now();
  const card={front, back, deckId:currentDeckId, owner:currentSession.username,
               createdAt:Date.now(), due:Date.now(), interval:0, ease:2.5, reps:0};
  try{
    await db.ref(`cards/${cardId}`).set(card);
    if(!decks[currentDeckId].cards) decks[currentDeckId].cards={};
    decks[currentDeckId].cards[cardId]=card;
    renderCardsList(); showToast('カードを追加しました','success');
  }catch(e){ showToast('追加エラー: '+e.message,'error'); }
}
window.deleteCard = async function(cardId){
  if(!currentSession||!currentDeckId) return;
  try{
    await db.ref(`cards/${cardId}`).remove();
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
  if(currentSession) await db.ref(`cards/${cardId}`).update({interval,ease,reps,due}).catch(()=>{});
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
  const d=decks[currentDeckId];
  if(!d||!d.cards||Object.keys(d.cards).length===0){studyQueue=[];return;}
  const now=Date.now();
  studyQueue=Object.entries(d.cards).filter(([_,c])=>c.due<=now+300000).sort((a,b)=>a[1].due-b[1].due).map(([id])=>id);
  if(studyQueue.length===0) studyQueue=Object.keys(d.cards);
  for(let i=studyQueue.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[studyQueue[i],studyQueue[j]]=[studyQueue[j],studyQueue[i]];}
  currentCardIdx=0; cardFlipped=false; sessionStats={total:studyQueue.length,again:0,good:0,easy:0};
}
function renderFlashcard(){
  const d=decks[currentDeckId];
  if(!d){ ge('studyArea').classList.remove('active'); return; }
  if(!d.cards || Object.keys(d.cards).length===0){
    // カードがないデッキ → 編集モードを表示してカード追加を促す
    showEditView(); return;
  }
  if(studyQueue.length===0){ showSessionComplete(); return; }
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
  ge('authForm')?.addEventListener('submit', handleAuthSubmit);
  ge('authModal')?.addEventListener('click', e=>{ if(e.target===ge('authModal')) closeAuthModal(); });
  ge('flashcard')?.addEventListener('click', ()=>window.flipCard());
  ge('welcomeScreen').style.display='flex';
  ge('studyArea').classList.remove('active');

  // セッション復元
  const sess = loadSession();
  if(sess && sess.uid){
    currentSession = sess;
    // DBから最新のisadmin状態を取得してセッションに反映
    db.ref(`users/${sess.username}`).once('value').then(snap=>{
      const d = snap.val()||{};
      const isAdm = !!d.isAdmin || !!d.isadmin || d.role==='admin';
      if(isAdm !== currentSession.isAdmin){
        currentSession = {...currentSession, isAdmin: isAdm};
        saveSession(currentSession);
      }
      onLogin();
    }).catch(()=>{ onLogin(); });
  }
});
