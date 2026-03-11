/* ═══════════════════════════════════════════════════════
   HGStudy  —  study.js  v4.1
   フラッシュカード + 解説ブログ + 学習履歴 (Firebase Realtime DB)
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
  apiKey:_d(_cfg._d), authDomain:_d(_cfg._c), databaseURL:_d(_cfg._a),
  projectId:_d(_cfg._e), storageBucket:_d(_cfg._c),
  messagingSenderId:"720150712775", appId:_d(_cfg._f)
};
const app = firebase.initializeApp(firebaseConfig);
const db  = firebase.database();

// ── SHA-256 Hash ─────────────────────────────────────
function hashPass(pw){
  const msg='hgstudy:'+pw;
  function sha256(str){
    function rr(n,d){return(n>>>d)|(n<<(32-d));}
    const H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    const bytes=[];
    for(let i=0;i<str.length;i++){const c=str.charCodeAt(i);if(c<128)bytes.push(c);else if(c<2048)bytes.push(0xc0|(c>>6),0x80|(c&0x3f));else bytes.push(0xe0|(c>>12),0x80|((c>>6)&0x3f),0x80|(c&0x3f));}
    const l=bytes.length*8;bytes.push(0x80);while(bytes.length%64!==56)bytes.push(0);for(let i=7;i>=0;i--)bytes.push((l/(Math.pow(2,i*8)))&0xff);
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

// ── Session ─────────────────────────────────────────
function saveSession(d){
  try{const str=JSON.stringify(d);localStorage.setItem('hg_session_ls',str);localStorage.setItem('hgs_sess',str);const exp='; expires='+new Date(Date.now()+30*864e5).toUTCString();const sec=location.protocol==='https:'?'; Secure':'';document.cookie='hg_session='+encodeURIComponent(str)+exp+'; path=/; SameSite=Lax'+sec;document.cookie='hgs_sess='+encodeURIComponent(str)+exp+'; path=/; SameSite=Lax'+sec;}catch(e){}
}
function loadSession(){
  try{const n=localStorage.getItem('hg_session_ls');if(n)return JSON.parse(n);const o=localStorage.getItem('hgs_sess');if(o)return JSON.parse(o);const mc=document.cookie.match(/(?:^|; )hg_session=([^;]*)/);if(mc)return JSON.parse(decodeURIComponent(mc[1]));const mo=document.cookie.match(/(?:^|; )hgs_sess=([^;]*)/);if(mo)return JSON.parse(decodeURIComponent(mo[1]));}catch(e){}return null;
}
function clearSession(){
  try{localStorage.removeItem('hg_session_ls');localStorage.removeItem('hgs_sess');}catch(e){}
  document.cookie='hg_session=;path=/;max-age=0';document.cookie='hgs_sess=;path=/;max-age=0';
}

// ── Constants ─────────────────────────────────────────
const BLOG_TAGS  = ['文法','語彙','歴史','数学','物理','化学','生物','英語','その他'];
const DECK_CATS  = ['ALL','代数','幾何','甲','乙','漢文','歴史','地理','物理','生物','英語A','英語B','ロシア語','PYTHON','C','その他'];
const CAT_COLORS = {'代数':'#F59E0B','幾何':'#10B981','甲':'#6366F1','乙':'#8B5CF6','漢文':'#EC4899','歴史':'#F97316','地理':'#14B8A6','物理':'#3B82F6','生物':'#22C55E','英語A':'#EAB308','英語B':'#F59E0B','ロシア語':'#EF4444','PYTHON':'#06B6D4','C':'#64748B','その他':'#6B7280'};
const PAGE_SIZE  = 10;

// ── State ─────────────────────────────────────────────
let currentSession = null;

// Blog
let allPosts={}, currentPostId=null, blogSort='new', editingPostId=null, selectedTag='';

// Decks
let allPublicDecks={}, allFavs={}, deckSort='pop', deckCat='ALL';
let filteredSortedDecks=[], displayedCount=PAGE_SIZE;
let currentDeckId=null, decks={};

// Flashcard session
let studyMode='normal', studyQueue=[], currentCardIdx=0, cardFlipped=false;
let sessionStats={total:0,again:0,good:0,easy:0};

// 4-choice quiz
let quizQueue=[], quizIdx=0, quizAnswered=false, quizCorrectIdx=-1;
let quizStats={correct:0,wrong:0,total:0};
let currentQuizChoices=[];

// Navigation
let navReturn={page:'pageStudy',subStudy:'deckBrowser'};
let currentProfileUser=null;
let editingDeckIdPage=null;
let editingCardId=null;

// ── Avatar ────────────────────────────────────────────
const AVATAR_COLORS=[['#7B6CF6','#B06EF6'],['#F5835B','#F6C344'],['#52C4A3','#3B82F6'],['#E65B9A','#F5835B'],['#4B8DEA','#52C4A3'],['#A068F5','#F5835B']];
function avatarColor(n){let h=0;for(let i=0;i<n.length;i++)h=(h*31+n.charCodeAt(i))&0xffff;return AVATAR_COLORS[h%AVATAR_COLORS.length];}
function drawAvatar(canvas,username,imageData,size){
  if(!canvas)return;const s=size||canvas.width;canvas.width=s;canvas.height=s;
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,s,s);
  if(imageData){const img=new Image();img.onload=()=>{ctx.save();ctx.beginPath();ctx.arc(s/2,s/2,s/2,0,Math.PI*2);ctx.clip();ctx.drawImage(img,0,0,s,s);ctx.restore();};img.src=imageData;}
  else{const[c1,c2]=avatarColor(username||'?');const g=ctx.createLinearGradient(0,0,s,s);g.addColorStop(0,c1);g.addColorStop(1,c2);ctx.fillStyle=g;ctx.beginPath();ctx.arc(s/2,s/2,s/2,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(255,255,255,.92)';ctx.font=`bold ${Math.round(s*.36)}px "JetBrains Mono",monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText((username||'?').slice(0,2).toUpperCase(),s/2,s/2);}
}

// ── Helpers ───────────────────────────────────────────
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function fmtDate(ts){if(!ts)return '';const d=new Date(ts);return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;}
function ge(id){return document.getElementById(id);}
function catBg(cat){const c=CAT_COLORS[cat]||'#6B7280';return `background:${c}22;color:${c};`;}
function todayStr(){return new Date().toISOString().split('T')[0];}
function yesterdayStr(){return new Date(Date.now()-86400000).toISOString().split('T')[0];}

// ── Markdown ──────────────────────────────────────────
function renderMarkdown(src){
  if(!src)return '';
  let s=src.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^#{3} (.+)$/gm,'<h3>$1</h3>').replace(/^#{2} (.+)$/gm,'<h2>$1</h2>').replace(/^# (.+)$/gm,'<h1>$1</h1>')
    .replace(/^&gt; (.+)$/gm,'<blockquote>$1</blockquote>').replace(/^---$/gm,'<hr>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/`(.+?)`/g,'<code>$1</code>')
    .replace(/\|\|(.+?)\|\|/g,'<span class="spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>')
    .replace(/\[(.+?)\]\((https?:\/\/[^\)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  s=s.replace(/(^- .+\n?)+/gm,m=>'<ul>'+m.split('\n').filter(l=>l.startsWith('- ')).map(l=>`<li>${l.slice(2)}</li>`).join('')+'</ul>');
  s=s.replace(/(^\d+\. .+\n?)+/gm,m=>'<ol>'+m.split('\n').filter(l=>/^\d+\./.test(l)).map(l=>`<li>${l.replace(/^\d+\. /,'')}</li>`).join('')+'</ol>');
  s=s.replace(/```[\w]*\n?([\s\S]+?)```/g,'<pre><code>$1</code></pre>');
  s=s.replace(/\n{2,}/g,'\n\n');
  const lines=s.split('\n');const out=[];let buf=[];
  const BLOCKS=/^(<h[1-6]|<ul|<ol|<li|<blockquote|<hr|<pre)/;
  for(const line of lines){if(BLOCKS.test(line.trim())){if(buf.length){out.push(`<p>${buf.join(' ')}</p>`);buf=[];}out.push(line);}else if(line.trim()===''){if(buf.length){out.push(`<p>${buf.join(' ')}</p>`);buf=[];}}else{buf.push(line);}}
  if(buf.length)out.push(`<p>${buf.join(' ')}</p>`);
  return out.join('\n');
}

// ══════════════════════════════════════════════════════
//  PAGE NAVIGATION
// ══════════════════════════════════════════════════════

const ALL_PAGES=['pageStudy','pageBlog','pageHistory','pageProfile','pageDeckEdit'];

function showMainPage(pageId){
  ALL_PAGES.forEach(id=>{const el=ge(id);if(el)el.classList.toggle('active',id===pageId);});
  const isMain=['pageStudy','pageBlog','pageHistory'].includes(pageId);
  const navTabsEl=ge('navTabsWrap');
  if(navTabsEl)navTabsEl.style.display=isMain?'':'none';
  ge('tabStudy').classList.toggle('on',pageId==='pageStudy');
  ge('tabBlog').classList.toggle('on',pageId==='pageBlog');
  ge('tabHistory').classList.toggle('on',pageId==='pageHistory');
}

window.switchTab=function(tab){
  if(tab==='study'){
    navReturn.page='pageStudy';
    showMainPage('pageStudy');
    ge('deckBrowser').style.display='';
    ge('studySession').style.display='none';
  }else if(tab==='blog'){
    navReturn.page='pageBlog';
    showMainPage('pageBlog');
    loadBlogPosts();
  }else if(tab==='history'){
    navReturn.page='pageHistory';
    showMainPage('pageHistory');
    loadHistoryPage();
  }
};

window.openUserProfile=function(username){
  const active=document.querySelector('.page-view.active');
  navReturn.page=active?active.id:'pageStudy';
  navReturn.subStudy=ge('studySession')&&ge('studySession').style.display!=='none'?'studySession':'deckBrowser';
  currentProfileUser=username;
  showMainPage('pageProfile');
  renderProfilePage(username);
};
window.openMyProfile=function(){if(!currentSession){openAuthModal('login');return;}openUserProfile(currentSession.username);};

window.goBackFromProfile=function(){
  showMainPage(navReturn.page);
  if(navReturn.page==='pageStudy'){
    ge('deckBrowser').style.display=navReturn.subStudy==='deckBrowser'?'':'none';
    ge('studySession').style.display=navReturn.subStudy==='studySession'?'':'none';
  }
};

window.openDeckEditPage=function(deckId){
  if(!currentSession){openAuthModal('login');return;}
  const dk=allPublicDecks[deckId];
  if(!dk||dk.owner!==currentSession.username){showToast('権限がありません','error');return;}
  editingDeckIdPage=deckId;
  navReturn.page='pageStudy';
  navReturn.subStudy='deckBrowser';
  showMainPage('pageDeckEdit');
  renderDeckEditPage(deckId);
};

window.goBackFromEdit=function(){
  showMainPage('pageStudy');
  ge('deckBrowser').style.display='';
  ge('studySession').style.display='none';
  renderDeckGrid();
};

// ══════════════════════════════════════════════════════
//  BLOG
// ══════════════════════════════════════════════════════

function showBlogList(){ge('blogList').style.display='';ge('blogPost').style.display='none';ge('blogEdit').style.display='none';}
function showBlogPostView(){ge('blogList').style.display='none';ge('blogPost').style.display='';ge('blogEdit').style.display='none';}
function showBlogEditView(){ge('blogList').style.display='none';ge('blogPost').style.display='none';ge('blogEdit').style.display='';}

async function loadBlogPosts(){
  try{const snap=await db.ref('blogs').once('value');allPosts=snap.val()||{};renderBlogGrid();}
  catch(e){ge('blogPostsGrid').innerHTML=`<div class="blog-empty"><div class="empty-emoji">⚠️</div><p>読み込みエラー: ${esc(e.message)}</p></div>`;}
}

function renderBlogGrid(){
  const grid=ge('blogPostsGrid'),count=ge('blogHeroCount');
  let posts=Object.entries(allPosts);
  count.textContent=posts.length;
  if(posts.length===0){grid.innerHTML='<div class="blog-empty"><div class="empty-emoji">📝</div><p>まだ記事がありません</p></div>';return;}
  posts.sort((a,b)=>blogSort==='new'?b[1].createdAt-a[1].createdAt:a[1].createdAt-b[1].createdAt);
  grid.innerHTML=posts.map(([id,p])=>`
    <div class="blog-card" onclick="openPost('${id}')">
      <div class="blog-card-top">
        <span class="blog-card-tag">${esc(p.tag||'その他')}</span>
        ${currentSession&&(currentSession.username===p.author||currentSession.isAdmin)?`<div class="blog-card-actions-mini" onclick="event.stopPropagation()">
          <button class="blog-action-mini" onclick="openBlogEdit('${id}')">編集</button>
          <button class="blog-action-mini danger" onclick="deletePost('${id}')">削除</button></div>`:''}</div>
      <div class="blog-card-title">${esc(p.title||'無題')}</div>
      <div class="blog-card-preview">${esc((p.content||'').slice(0,120))}${(p.content||'').length>120?'…':''}</div>
      <div class="blog-card-meta">
        <span class="blog-card-author" onclick="event.stopPropagation();openUserProfile('${esc(p.author||'')}')">@${esc(p.author||'')}</span>
        <span>${fmtDate(p.createdAt)}</span><span>💬 ${p.commentCount||0}</span></div></div>`).join('');
}

window.setBlogSort=function(s){blogSort=s;ge('sortBlogNew').classList.toggle('on',s==='new');ge('sortBlogOld').classList.toggle('on',s==='old');renderBlogGrid();};

window.openPost=async function(postId){
  currentPostId=postId;showBlogPostView();
  const p=allPosts[postId];if(!p)return;
  ge('postTag').textContent=p.tag||'その他';ge('postTitle').textContent=p.title||'無題';
  ge('postAuthor').textContent='@'+(p.author||'');ge('postDate').textContent=fmtDate(p.createdAt);
  ge('postBody').innerHTML=renderMarkdown(p.content||'');
  const isOwner=currentSession&&(currentSession.username===p.author||currentSession.isAdmin);
  ge('editPostBtn').style.display=isOwner?'':'none';ge('deletePostBtn').style.display=isOwner?'':'none';
  loadComments(postId);
  ge('commentFormWrap').style.display=currentSession?'':'none';
  ge('commentLoginPrompt').style.display=currentSession?'none':'';
  window.scrollTo({top:0,behavior:'smooth'});
};

window.deletePost=async function(postId){
  if(!currentSession)return;const p=allPosts[postId];if(!p)return;
  if(!confirm(`「${p.title}」を削除しますか？`))return;
  try{await db.ref(`blogs/${postId}`).remove();delete allPosts[postId];renderBlogGrid();showBlogList();showToast('記事を削除しました');}
  catch(e){showToast('削除エラー: '+e.message,'error');}
};

window.openBlogEdit=function(postId){
  if(!currentSession){openAuthModal('login');return;}
  editingPostId=postId||null;showBlogEditView();setBlogEditMode('edit');
  const grid=ge('tagSelGrid');
  grid.innerHTML=BLOG_TAGS.map(t=>`<button class="tag-opt${selectedTag===t?' on':''}" onclick="selectBlogTag('${t}')">${t}</button>`).join('');
  if(postId&&allPosts[postId]){const p=allPosts[postId];ge('editTitle').value=p.title||'';ge('editBody').value=p.content||'';selectedTag=p.tag||'';}
  else{ge('editTitle').value='';ge('editBody').value='';selectedTag='';}
  updateTagGrid();
};
window.selectBlogTag=function(tag){selectedTag=tag;updateTagGrid();};
function updateTagGrid(){const g=ge('tagSelGrid');if(!g)return;g.querySelectorAll('.tag-opt').forEach(b=>b.classList.toggle('on',b.textContent===selectedTag));}
window.cancelBlogEdit=function(){if(editingPostId&&allPosts[editingPostId])openPost(editingPostId);else showBlogList();};
window.setBlogEditMode=function(mode){
  ge('editModeBtn').classList.toggle('on',mode==='edit');ge('previewModeBtn').classList.toggle('on',mode==='preview');
  ge('editPane').style.display=mode==='edit'?'':'none';ge('previewPane').style.display=mode==='preview'?'':'none';
  if(mode==='preview'){ge('previewTitle').textContent=ge('editTitle').value||'（タイトルなし）';ge('previewTag').textContent=selectedTag||'その他';ge('previewBody').innerHTML=renderMarkdown(ge('editBody').value);}
};
window.savePost=async function(){
  if(!currentSession){openAuthModal('login');return;}
  const title=ge('editTitle').value.trim(),content=ge('editBody').value.trim();
  if(!title){showToast('タイトルを入力してください','error');return;}
  if(!content){showToast('本文を入力してください','error');return;}
  const now=Date.now();
  const data={title,content,tag:selectedTag||'その他',author:currentSession.username,updatedAt:now,
    ...(editingPostId&&allPosts[editingPostId]?{createdAt:allPosts[editingPostId].createdAt,commentCount:allPosts[editingPostId].commentCount||0}:{createdAt:now,commentCount:0})};
  try{
    if(editingPostId){await db.ref(`blogs/${editingPostId}`).update(data);allPosts[editingPostId]={...allPosts[editingPostId],...data};showToast('記事を更新しました','success');openPost(editingPostId);}
    else{const ref=db.ref('blogs').push();await ref.set(data);allPosts[ref.key]=data;showToast('記事を公開しました','success');renderBlogGrid();openPost(ref.key);}
    editingPostId=null;
  }catch(e){showToast('保存エラー: '+e.message,'error');}
};

async function loadComments(postId){
  const list=ge('commentList');list.innerHTML='<div style="padding:16px;color:var(--text3);font-size:13px">読み込み中...</div>';
  try{
    const snap=await db.ref(`blogs_comments/${postId}`).orderByChild('createdAt').once('value');
    const arr=Object.entries(snap.val()||{}).sort((a,b)=>a[1].createdAt-b[1].createdAt);
    ge('commentCount').textContent=arr.length;
    if(arr.length===0){list.innerHTML='<div class="comment-empty">まだコメントはありません</div>';return;}
    list.innerHTML=arr.map(([cid,c])=>`<div class="comment-item" id="c_${cid}">
      <div class="comment-header"><span class="comment-author">@${esc(c.author)}</span><span class="comment-date">${fmtDate(c.createdAt)}</span>
      ${currentSession&&(currentSession.username===c.author||currentSession.isAdmin)?`<button class="comment-del" onclick="deleteComment('${postId}','${cid}')">✕</button>`:''}</div>
      <div class="comment-body">${esc(c.body)}</div></div>`).join('');
  }catch(e){list.innerHTML='<div class="comment-empty">読み込みエラー</div>';}
}
window.submitComment=async function(){
  if(!currentSession){openAuthModal('login');return;}
  const input=ge('commentInput'),body=(input.value||'').trim();
  if(!body||!currentPostId)return;
  try{
    const ref=db.ref(`blogs_comments/${currentPostId}`).push();
    await ref.set({author:currentSession.username,body,createdAt:Date.now()});
    const p=allPosts[currentPostId];if(p){p.commentCount=(p.commentCount||0)+1;await db.ref(`blogs/${currentPostId}/commentCount`).set(p.commentCount);}
    input.value='';loadComments(currentPostId);showToast('コメントを投稿しました','success');
  }catch(e){showToast('投稿エラー: '+e.message,'error');}
};
window.deleteComment=async function(postId,commentId){
  if(!confirm('このコメントを削除しますか？'))return;
  try{
    await db.ref(`blogs_comments/${postId}/${commentId}`).remove();
    const p=allPosts[postId];if(p&&p.commentCount>0){p.commentCount--;await db.ref(`blogs/${postId}/commentCount`).set(p.commentCount);}
    loadComments(postId);showToast('コメントを削除しました');
  }catch(e){showToast('削除エラー','error');}
};

// ══════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════

function toggleAcctMenu(){ge('acctMenu').classList.toggle('open');}
function closeAcctMenu(){ge('acctMenu').classList.remove('open');}
window.toggleAcctMenu=toggleAcctMenu;window.closeAcctMenu=closeAcctMenu;
document.addEventListener('click',e=>{const m=ge('acctMenu'),b=ge('navUserBtn');if(m&&b&&!b.contains(e.target)&&!m.contains(e.target))m.classList.remove('open');});

let authMode='login';
function openAuthModal(mode='login'){
  authMode=mode;ge('authModal').classList.add('active');updateAuthUI();
  ge('authError').classList.remove('visible');ge('authUsername').value='';ge('authPassword').value='';ge('authUsername').focus();
}
function closeAuthModal(){ge('authModal').classList.remove('active');}
function updateAuthUI(){
  const isL=authMode==='login';
  ge('authTitle').textContent=isL?'ログイン':'新規登録';ge('authSubmitBtn').textContent=isL?'[ ログイン ]':'[ 登録 ]';
  ge('authSwitchText').innerHTML=isL?'アカウントをお持ちでない方は<a onclick="switchAuthMode()">こちら</a>':'すでにアカウントをお持ちの方は<a onclick="switchAuthMode()">こちら</a>';
}
window.switchAuthMode=function(){authMode=authMode==='login'?'register':'login';updateAuthUI();ge('authError').classList.remove('visible');};
window.openAuthModal=openAuthModal;window.closeAuthModal=closeAuthModal;

async function handleAuthSubmit(e){
  e.preventDefault();
  const username=ge('authUsername').value.trim(),password=ge('authPassword').value;
  const errEl=ge('authError');errEl.classList.remove('visible');
  if(!username||!password){errEl.textContent='ユーザー名とパスワードを入力してください';errEl.classList.add('visible');return;}
  if(username.length<3){errEl.textContent='ユーザー名は3文字以上必要です';errEl.classList.add('visible');return;}
  if(!/^[a-zA-Z0-9_]+$/.test(username)){errEl.textContent='ユーザー名は英数字・アンダースコアのみ';errEl.classList.add('visible');return;}
  if(password.length<6){errEl.textContent='パスワードは6文字以上必要です';errEl.classList.add('visible');return;}
  const btn=ge('authSubmitBtn');btn.disabled=true;btn.textContent='...';
  try{
    const hash=await hashPass(password);
    if(authMode==='login'){
      const snap=await db.ref(`users/${username}`).once('value');const ud=snap.val();
      if(!ud||ud.hash!==hash){errEl.textContent='ユーザー名またはパスワードが違います';errEl.classList.add('visible');return;}
      const isAdmin=!!ud.isAdmin||!!ud.isadmin||ud.role==='admin';
      currentSession={uid:username,username,isAdmin,displayName:ud.displayName||username};
      saveSession(currentSession);closeAuthModal();onLogin();
    }else{
      const snap=await db.ref(`users/${username}`).once('value');
      if(snap.exists()){errEl.textContent='このユーザー名はすでに使われています';errEl.classList.add('visible');return;}
      await db.ref(`users/${username}`).set({uid:username,username,hash,displayName:username,bio:'',avatar:'',isAdmin:false,streak:0,streak_date:'',created:Date.now()});
      currentSession={uid:username,username,isAdmin:false,displayName:username};
      saveSession(currentSession);closeAuthModal();onLogin();
    }
  }catch(err){errEl.textContent='エラー: '+err.message;errEl.classList.add('visible');}
  finally{btn.disabled=false;updateAuthUI();}
}

function updateNavUI(){
  if(currentSession){
    ge('navLoginBtn').style.display='none';ge('navUserBtn').style.display='flex';
    ge('navUsername').textContent=currentSession.username+(currentSession.isAdmin?' [ADMIN]':'');
    ge('acctMenuDispName').textContent=currentSession.displayName||currentSession.username;
    ge('acctMenuUsername').textContent='@'+currentSession.username;
    const av=currentSession._avatar||localStorage.getItem('fm_avatar_'+currentSession.username)||null;
    drawAvatar(ge('navAvatarCanvas'),currentSession.username,av,28);
    drawAvatar(ge('acctMenuAvatar'),currentSession.username,av,40);
    ge('newPostBtn').style.display='';ge('createDeckBtn').style.display='';
  }else{
    ge('navLoginBtn').style.display='';ge('navUserBtn').style.display='none';
    ge('newPostBtn').style.display='none';ge('createDeckBtn').style.display='none';
  }
}

async function onLogin(){
  try{
    const snap=await db.ref(`users/${currentSession.username}`).once('value');const ud=snap.val()||{};
    const isAdm=!!ud.isAdmin||!!ud.isadmin||ud.role==='admin';
    currentSession={...currentSession,isAdmin:isAdm,displayName:ud.displayName||currentSession.username,streak:ud.streak||0};
    if(ud.avatar){localStorage.setItem('fm_avatar_'+currentSession.username,ud.avatar);currentSession._avatar=ud.avatar;}
    saveSession(currentSession);
  }catch(e){}
  updateNavUI();
  ge('welcomeScreen').style.display='none';ge('deckBrowser').style.display='';
  loadAllDecks();requestNotifPermission();startNewsWatch();

  // 連続学習チェック（ログイン時）
  await checkStreakOnLogin();

  showToast(`ようこそ、${currentSession.username}さん！`);
  if(ge('pageBlog').classList.contains('active'))loadBlogPosts();
  if(ge('pageHistory').classList.contains('active'))loadHistoryPage();
}
function onLogout(){
  updateNavUI();ge('deckBrowser').style.display='none';ge('studySession').style.display='none';ge('welcomeScreen').style.display='flex';
  allPublicDecks={};decks={};currentDeckId=null;allFavs={};displayedCount=PAGE_SIZE;
  renderHistoryPageContent([]);
}
window.handleLogout=function(){currentSession=null;clearSession();onLogout();showToast('ログアウトしました');};

// ══════════════════════════════════════════════════════
//  LEARNING LOGS & STREAK
// ══════════════════════════════════════════════════════

async function saveStudyLog(){
  if(!currentSession||!currentDeckId)return;
  const dk=allPublicDecks[currentDeckId]||decks[currentDeckId];
  if(!dk)return;

  let correct,total,score;
  if(studyMode==='4choice'){
    correct=quizStats.correct;
    total=quizStats.total;
  }else{
    correct=sessionStats.good+sessionStats.easy;
    total=sessionStats.total;
  }
  score=total>0?Math.round(correct/total*100):0;

  const log={
    date:todayStr(),
    ts:Date.now(),
    deckId:currentDeckId,
    deckName:dk.name||'無題',
    mode:studyMode,
    correct,
    total,
    score
  };

  try{
    await db.ref(`logs/${currentSession.username}`).push(log);
    await updateStreak();
    if(ge('pageHistory').classList.contains('active'))loadHistoryPage();
  }catch(e){console.error('log save error',e);}
}

async function updateStreak(){
  if(!currentSession)return;
  const today=todayStr();
  const yesterday=yesterdayStr();
  try{
    const snap=await db.ref(`users/${currentSession.username}`).once('value');
    const ud=snap.val()||{};
    const lastDate=ud.streak_date||'';
    if(lastDate===today)return;
    let newStreak;
    if(lastDate===yesterday){newStreak=(ud.streak||0)+1;}
    else{newStreak=1;}
    await db.ref(`users/${currentSession.username}`).update({streak:newStreak,streak_date:today});
    currentSession.streak=newStreak;
    saveSession(currentSession);
    updateNavUI();
  }catch(e){}
}

async function checkStreakOnLogin(){
  if(!currentSession)return;
  const today=todayStr();
  const yesterday=yesterdayStr();
  try{
    const snap=await db.ref(`users/${currentSession.username}/streak_date`).once('value');
    const lastDate=snap.val();
    if(!lastDate)return;
    if(lastDate===today||lastDate===yesterday)return;
    await db.ref(`users/${currentSession.username}`).update({streak:0});
    currentSession.streak=0;
    saveSession(currentSession);
  }catch(e){}
}

// ══════════════════════════════════════════════════════
//  HISTORY PAGE (独立タブ)
// ══════════════════════════════════════════════════════

let _historyLogs=[];

async function loadHistoryPage(){
  const body=ge('historyPageBody');
  if(!body)return;

  if(!currentSession){
    renderHistoryPageContent([]);
    return;
  }

  body.innerHTML='<div style="padding:60px;text-align:center"><div class="spinner"></div></div>';

  try{
    const snap=await db.ref(`logs/${currentSession.username}`)
      .orderByChild('ts').limitToLast(100).once('value');
    _historyLogs=Object.values(snap.val()||{}).sort((a,b)=>b.ts-a.ts);
    renderHistoryPageContent(_historyLogs);
  }catch(e){
    renderHistoryPageContent([]);
  }
}

function hpModeIcon(m){return m==='4choice'?'🎯':m==='random'?'🔀':'📖';}
function hpModeLabel(m){return m==='4choice'?'4択':m==='random'?'ランダム':'通常';}
function hpFmtDate(dateStr){
  const today=todayStr();
  const yesterday=yesterdayStr();
  if(dateStr===today)return '今日';
  if(dateStr===yesterday)return '昨日';
  const d=new Date(dateStr);
  return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
}
function hpScoreColor(s){return s>=80?'var(--green)':s>=50?'var(--yellow)':'#E03030';}

function renderHistoryPageContent(logs){
  const body=ge('historyPageBody');
  if(!body)return;

  if(!currentSession){
    body.innerHTML=`
      <div class="hp-page-login">
        <div class="hp-page-login-icon">📊</div>
        <p>ログインして学習履歴を確認しよう</p>
        <button class="hp-login-btn" onclick="openAuthModal('login')">ログイン</button>
      </div>`;
    return;
  }

  const streak=currentSession.streak||0;
  const streakColor=streak>=7?'#F97316':streak>=3?'#EAB308':'var(--primary)';

  // 統計計算
  const totalSessions=logs.length;
  const totalCards=logs.reduce((s,l)=>s+l.total,0);
  const avgScore=totalSessions>0?Math.round(logs.reduce((s,l)=>s+l.score,0)/totalSessions):0;
  const bestStreak=streak;

  // 日付でグループ化
  const grouped={};
  logs.forEach(l=>{(grouped[l.date]=grouped[l.date]||[]).push(l);});

  let html=`
    <!-- ストリーク & 統計 -->
    <div class="hp-page-stats">
      <div class="hp-page-streak" style="border-color:${streakColor}40;background:${streakColor}10">
        <div class="hp-page-streak-fire">🔥</div>
        <div class="hp-page-streak-num" style="color:${streakColor}">${streak}</div>
        <div class="hp-page-streak-lbl">日連続学習</div>
        ${streak===0?`<div class="hp-page-streak-note">今日学習してストリークを開始！</div>`:`<div class="hp-page-streak-note">継続中！この調子で頑張ろう</div>`}
      </div>
      <div class="hp-page-stat-grid">
        <div class="hp-page-stat">
          <div class="hp-page-stat-n" style="color:var(--primary)">${totalSessions}</div>
          <div class="hp-page-stat-l">総セッション</div>
        </div>
        <div class="hp-page-stat">
          <div class="hp-page-stat-n" style="color:var(--blog)">${totalCards}</div>
          <div class="hp-page-stat-l">総問題数</div>
        </div>
        <div class="hp-page-stat">
          <div class="hp-page-stat-n" style="color:var(--green)">${avgScore}%</div>
          <div class="hp-page-stat-l">平均正答率</div>
        </div>
        <div class="hp-page-stat">
          <div class="hp-page-stat-n" style="color:#F97316">${Object.keys(grouped).length}</div>
          <div class="hp-page-stat-l">学習日数</div>
        </div>
      </div>
    </div>`;

  if(logs.length===0){
    html+=`<div class="hp-page-empty">
      <div style="font-size:48px;margin-bottom:12px">📭</div>
      <p>まだ学習履歴がありません</p>
      <p style="font-size:12px;margin-top:6px">セッションを完了すると記録が残ります</p>
      <button class="hp-login-btn" style="margin-top:16px" onclick="switchTab('study')">学習を始める →</button>
    </div>`;
    body.innerHTML=html;
    return;
  }

  // 履歴リスト
  html+=`<div class="hp-page-list">`;
  Object.entries(grouped).forEach(([date,dayLogs])=>{
    const dayTotal=dayLogs.length;
    const dayAvg=Math.round(dayLogs.reduce((s,l)=>s+l.score,0)/dayTotal);
    html+=`
      <div class="hp-page-date-section">
        <div class="hp-page-date-header">
          <span class="hp-page-date-label">${hpFmtDate(date)}</span>
          <span class="hp-page-date-meta">${dayTotal}セッション &nbsp;·&nbsp; 平均 ${dayAvg}%</span>
        </div>
        <div class="hp-page-log-list">`;
    dayLogs.forEach(l=>{
      const sc=hpScoreColor(l.score);
      const pct=Math.min(100,l.score);
      html+=`
        <div class="hp-page-log-item">
          <div class="hp-page-log-icon">${hpModeIcon(l.mode)}</div>
          <div class="hp-page-log-body">
            <div class="hp-page-log-deck">${esc(l.deckName)}</div>
            <div class="hp-page-log-detail">
              <span class="hp-page-log-tag">${hpModeLabel(l.mode)}</span>
              <span class="hp-page-log-qa">${l.correct}/${l.total}問正解</span>
            </div>
            <div class="hp-page-score-bar-wrap">
              <div class="hp-page-score-bar" style="width:${pct}%;background:${sc}"></div>
            </div>
          </div>
          <div class="hp-page-log-score" style="color:${sc}">${l.score}<span style="font-size:10px;opacity:.7">%</span></div>
        </div>`;
    });
    html+=`</div></div>`;
  });
  html+=`</div>`;

  body.innerHTML=html;
}

// ══════════════════════════════════════════════════════
//  DECK BROWSER
// ══════════════════════════════════════════════════════

function initCatFilter(){
  const wrap=ge('catScroll');if(!wrap)return;
  wrap.innerHTML=DECK_CATS.map(c=>`<button class="cat-pill${c==='ALL'?' on':''}" onclick="setDeckCat('${c}')">${c}</button>`).join('');
}

window.setDeckCat=function(cat){
  deckCat=cat;displayedCount=PAGE_SIZE;
  document.querySelectorAll('.cat-pill').forEach(b=>b.classList.remove('on'));
  const tgt=Array.from(document.querySelectorAll('.cat-pill')).find(b=>b.textContent===cat);
  if(tgt)tgt.classList.add('on');
  renderDeckGrid();
};
window.setDeckSort=function(sort){
  deckSort=sort;displayedCount=PAGE_SIZE;
  ge('sortPopBtn').classList.toggle('on',sort==='pop');ge('sortNewBtn').classList.toggle('on',sort==='new');
  renderDeckGrid();
};

async function loadAllDecks(){
  try{
    const[dSnap,cSnap]=await Promise.all([db.ref('decks').once('value'),db.ref('cards').once('value')]);
    const rawDecks=dSnap.val()||{},rawCards=cSnap.val()||{};
    allPublicDecks={};
    for(const[id,dk]of Object.entries(rawDecks)){
      allPublicDecks[id]={...dk,name:dk.name||'',desc:dk.desc||'',
        owner:dk.author||dk.uid||dk.owner||'',cat:dk.tag||dk.cat||'',
        createdAt:dk.ct||dk.createdAt||0,favCount:dk.fc||dk.favCount||0,
        viewCount:dk.viewCount||dk.vc||0,cardCount:dk.cc||dk.cardCount||0,cards:{}};
    }
    for(const[deckId,deckCards]of Object.entries(rawCards)){
      if(!allPublicDecks[deckId]||!deckCards||typeof deckCards!=='object')continue;
      let cnt=0;
      for(const[cardId,card]of Object.entries(deckCards)){
        if(!card||typeof card!=='object')continue;
        allPublicDecks[deckId].cards[cardId]={front:card.f||card.front||'',back:card.b||card.back||'',deckId,
          due:card.due||Date.now(),interval:card.interval||0,ease:card.ease||2.5,reps:card.reps||0};
        cnt++;
      }
      allPublicDecks[deckId].cardCount=cnt;
    }
    if(currentSession){
      decks={};
      for(const[id,dk]of Object.entries(allPublicDecks))if(dk.owner===currentSession.username)decks[id]=dk;
      const fSnap=await db.ref(`favs/${currentSession.username}`).once('value');allFavs=fSnap.val()||{};
    }
    renderDeckGrid();
  }catch(e){showToast('読み込みエラー: '+e.message,'error');}
}

function renderDeckGrid(){
  let list=Object.entries(allPublicDecks);
  if(deckCat!=='ALL')list=list.filter(([,d])=>d.cat===deckCat);

  // 人気順: お気に入り数 × 2 + 閲覧数 の合計スコアで降順
  if(deckSort==='pop'){
    list.sort((a,b)=>{
      const scoreA=(a[1].favCount||0)*2+(a[1].viewCount||0);
      const scoreB=(b[1].favCount||0)*2+(b[1].viewCount||0);
      return scoreB-scoreA;
    });
  }else{
    list.sort((a,b)=>(b[1].createdAt||0)-(a[1].createdAt||0));
  }

  filteredSortedDecks=list;
  const total=list.length;
  if(ge('deckCountBadge'))ge('deckCountBadge').textContent=total;
  if(ge('deckHeroCount'))ge('deckHeroCount').textContent=total;
  const grid=ge('deckGrid');if(!grid)return;
  if(total===0){grid.innerHTML=`<div class="deck-empty"><div class="empty-emoji">📭</div><p>デッキがまだありません</p></div>`;return;}
  const shown=list.slice(0,displayedCount),remaining=total-shown.length;
  grid.innerHTML=shown.map(([id,dk])=>deckCardHTML(id,dk)).join('');
  if(remaining>0){
    const lm=document.createElement('div');lm.className='load-more-wrap';
    lm.innerHTML=`<button class="load-more-btn" onclick="loadMoreDecks()">もっと読み込む（残り${remaining}件）</button>`;
    grid.appendChild(lm);
  }
}

function deckCardHTML(id,dk){
  const isMine=currentSession&&dk.owner===currentSession.username;
  const isFav=!!allFavs[id];
  const cnt=dk.cardCount||0,favCnt=dk.favCount||0,viewCnt=dk.viewCount||0;
  const tagHtml=dk.cat?`<span class="dc-tag" style="${catBg(dk.cat)}">${esc(dk.cat)}</span>`:'<span></span>';
  return `<div class="deck-card-new" id="dcard_${id}">
    <div class="dc-card-top">${tagHtml}
      ${isMine?`<div class="dc-owner-btns">
        <button class="dc-action-mini" onclick="openDeckEditPage('${id}')">✏️ 編集</button>
        <button class="dc-action-mini danger" onclick="deleteDeckDirect('${id}')">🗑️</button>
      </div>`:''}
    </div>
    <div class="dc-title-new">${esc(dk.name||'無題')}</div>
    ${dk.desc?`<div class="dc-desc-new">${esc(dk.desc)}</div>`:''}
    <div class="dc-meta-new">
      <span class="dc-author-new" onclick="openUserProfile('${esc(dk.owner||'')}')">@${esc(dk.owner||'')}</span>
      <span>📇 ${cnt}枚</span><span>⭐ ${favCnt}</span><span>👁 ${viewCnt}</span>
      <span>${fmtDate(dk.createdAt)}</span>
    </div>
    <div class="dc-actions-new">
      <button class="study-start-btn-new" onclick="showStudyModeModal('${id}')">▶ 学習する</button>
      <button class="fav-btn-new${isFav?' on':''}" id="favbtn_${id}" onclick="toggleFav('${id}')">
        ${isFav?'★':'☆'} ${favCnt}
      </button>
    </div>
  </div>`;
}

window.loadMoreDecks=function(){
  displayedCount+=PAGE_SIZE;
  const grid=ge('deckGrid');if(!grid)return;
  const total=filteredSortedDecks.length,oldLm=grid.querySelector('.load-more-wrap');
  if(oldLm)oldLm.remove();
  const newSlice=filteredSortedDecks.slice(displayedCount-PAGE_SIZE,displayedCount);
  newSlice.forEach(([id,dk])=>grid.insertAdjacentHTML('beforeend',deckCardHTML(id,dk)));
  const remaining=total-displayedCount;
  if(remaining>0){
    const lm=document.createElement('div');lm.className='load-more-wrap';
    lm.innerHTML=`<button class="load-more-btn" onclick="loadMoreDecks()">もっと読み込む（残り${remaining}件）</button>`;
    grid.appendChild(lm);
  }
};

window.toggleFav=async function(deckId){
  if(!currentSession){openAuthModal('login');return;}
  const me=currentSession.username,was=!!allFavs[deckId],dk=allPublicDecks[deckId];if(!dk)return;
  if(was){delete allFavs[deckId];dk.favCount=Math.max(0,(dk.favCount||1)-1);await db.ref(`favs/${me}/${deckId}`).remove();await db.ref(`decks/${deckId}/fc`).set(dk.favCount);}
  else{allFavs[deckId]=true;dk.favCount=(dk.favCount||0)+1;await db.ref(`favs/${me}/${deckId}`).set(true);await db.ref(`decks/${deckId}/fc`).set(dk.favCount);}
  const btn=ge('favbtn_'+deckId);
  if(btn){btn.className='fav-btn-new'+(was?'':' on');btn.innerHTML=`${was?'☆':'★'} ${dk.favCount}`;}
};

window.deleteDeckDirect=async function(deckId){
  if(!currentSession)return;const dk=allPublicDecks[deckId];
  if(!dk||dk.owner!==currentSession.username){showToast('権限がありません','error');return;}
  if(!confirm(`「${dk.name}」を削除しますか？カードも全て削除されます。`))return;
  try{await db.ref(`cards/${deckId}`).remove();await db.ref(`decks/${deckId}`).remove();delete allPublicDecks[deckId];delete decks[deckId];renderDeckGrid();showToast('デッキを削除しました');}
  catch(e){showToast('削除エラー: '+e.message,'error');}
};

// ── デッキ作成モーダル ─────────────────────────────────
let dmSelectedCat='';
window.openCreateDeckModal=function(){
  if(!currentSession){openAuthModal('login');return;}
  ge('dmName').value='';ge('dmDesc').value='';dmSelectedCat='';
  document.querySelectorAll('.dm-cat-btn').forEach(b=>b.classList.toggle('on',b.textContent===dmSelectedCat));
  ge('deckModal').classList.add('open');
};
window.closeDeckModal=function(){ge('deckModal').classList.remove('open');};
window.dmToggleCat=function(cat){dmSelectedCat=dmSelectedCat===cat?'':cat;document.querySelectorAll('.dm-cat-btn').forEach(b=>b.classList.toggle('on',b.textContent===dmSelectedCat));};
window.saveDeckFromModal=async function(){
  if(!currentSession)return;
  const name=ge('dmName').value.trim();if(!name){showToast('タイトルを入力してください','error');return;}
  const btn=ge('dmSaveBtn');btn.disabled=true;btn.textContent='保存中...';
  try{
    const deckId='dk_'+Math.random().toString(36).slice(2,12);
    const dk={name,desc:ge('dmDesc').value.trim(),tag:dmSelectedCat,author:currentSession.username,uid:currentSession.username,ct:Date.now(),ut:Date.now(),fc:0,vc:0,cc:0};
    await db.ref(`decks/${deckId}`).set(dk);
    allPublicDecks[deckId]={...dk,owner:currentSession.username,cat:dmSelectedCat,createdAt:dk.ct,favCount:0,viewCount:0,cardCount:0,cards:{}};
    decks[deckId]=allPublicDecks[deckId];
    ge('deckModal').classList.remove('open');
    showToast(`「${name}」を作成しました`,'success');
    renderDeckGrid();
    openDeckEditPage(deckId);
  }catch(e){showToast('エラー: '+e.message,'error');}
  finally{btn.disabled=false;btn.textContent='💾 保存する';}
};
function initDmCats(){
  const dm=ge('dmCats');if(!dm)return;
  dm.innerHTML=DECK_CATS.filter(c=>c!=='ALL').map(c=>`<button class="dm-cat-btn" onclick="dmToggleCat('${c}')">${c}</button>`).join('');
}

// ══════════════════════════════════════════════════════
//  STUDY MODE MODAL
// ══════════════════════════════════════════════════════

window.showStudyModeModal=function(deckId){
  currentDeckId=deckId;
  const dk=allPublicDecks[deckId];if(!dk)return;
  ge('modeModalDeckName').textContent=dk.name||'無題';
  const cnt=dk.cardCount||Object.keys(dk.cards||{}).length;
  ge('modeModalCardCount').textContent=`${cnt}枚`;
  const mode4=ge('mode4Btn');
  if(mode4){mode4.disabled=cnt<4;mode4.title=cnt<4?'4枚以上のカードが必要です':'';}
  ge('studyModeModal').classList.add('open');
};
window.closeStudyModeModal=function(){ge('studyModeModal').classList.remove('open');};

window.startStudyWithMode=function(mode){
  closeStudyModeModal();
  studyMode=mode;
  if(!decks[currentDeckId])decks[currentDeckId]=allPublicDecks[currentDeckId];
  _launchStudy(currentDeckId);
};

function _launchStudy(deckId){
  currentDeckId=deckId;const dk=allPublicDecks[deckId];if(!dk)return;
  db.ref(`decks/${deckId}/viewCount`).transaction(v=>(v||0)+1).catch(()=>{});
  db.ref(`decks/${deckId}/vc`).transaction(v=>(v||0)+1).catch(()=>{});
  ge('deckBrowser').style.display='none';ge('studySession').style.display='';
  ge('sessDeckName').textContent=dk.name||'無題';

  // まずセッション内のすべての子要素を非表示/非アクティブにリセット
  ge('cardsListView').classList.remove('active');
  ge('sessionComplete').classList.remove('active');

  const editBtn=ge('editDeckBtn');
  if(editBtn)editBtn.style.display=(currentSession&&dk.owner===currentSession.username)?'':'none';
  if(!decks[deckId])decks[deckId]=dk;

  // studyArea を常にアクティブにする（重要: quiz/flashcard の親）
  const studyArea=ge('studyArea');
  if(studyArea)studyArea.classList.add('active');

  const flashArea=ge('flashcardArea');
  const quizArea=ge('quizArea');

  if(studyMode==='4choice'){
    // 4択: flashcard を隠し quiz を表示
    if(flashArea)flashArea.style.display='none';
    if(quizArea)quizArea.style.display='';
    buildQuizQueue();
    renderQuizCard();
  }else{
    // 通常/ランダム: quiz を隠し flashcard を表示
    if(flashArea)flashArea.style.display='';
    if(quizArea)quizArea.style.display='none';
    buildStudyQueue();
    renderFlashcard();
  }
}

window.backToBrowser=function(){
  ge('studySession').style.display='none';ge('deckBrowser').style.display='';currentDeckId=null;
};

// ══════════════════════════════════════════════════════
//  FLASHCARD (通常・ランダム)
// ══════════════════════════════════════════════════════

function buildStudyQueue(){
  const d=decks[currentDeckId];
  if(!d||!d.cards||Object.keys(d.cards).length===0){studyQueue=[];return;}
  const now=Date.now();
  if(studyMode==='random'){
    studyQueue=Object.keys(d.cards).sort(()=>Math.random()-.5);
  }else{
    studyQueue=Object.entries(d.cards).filter(([,c])=>c.due<=now+300000).sort((a,b)=>a[1].due-b[1].due).map(([id])=>id);
    if(studyQueue.length===0)studyQueue=Object.keys(d.cards);
    for(let i=studyQueue.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[studyQueue[i],studyQueue[j]]=[studyQueue[j],studyQueue[i]];}
  }
  currentCardIdx=0;cardFlipped=false;sessionStats={total:studyQueue.length,again:0,good:0,easy:0};
}

function renderFlashcard(){
  const d=decks[currentDeckId];
  if(!d){return;}
  if(!d.cards||Object.keys(d.cards).length===0){showEditViewInSession();return;}
  if(studyQueue.length===0||currentCardIdx>=studyQueue.length){showSessionComplete();return;}
  const cardId=studyQueue[currentCardIdx],card=d.cards[cardId];
  if(!card){currentCardIdx++;renderFlashcard();return;}
  cardFlipped=false;
  ge('cardFront').textContent=card.front;ge('cardBack').textContent=card.back;
  ge('cardBackArea').style.display='none';
  document.querySelectorAll('.ctrl-btn').forEach(b=>b.disabled=true);
  ge('cardProgress').textContent=`${currentCardIdx} / ${studyQueue.length}`;
  ge('progressBar').style.width=`${(currentCardIdx/studyQueue.length)*100}%`;
}

function showEditViewInSession(){ge('cardsListView').classList.add('active');ge('sessionComplete').classList.remove('active');renderCardsList();}

function showSessionComplete(){
  // 学習ログを保存
  saveStudyLog();

  if(studyMode==='4choice'){
    ge('sessionComplete').classList.add('active');ge('cardsListView').classList.remove('active');
    // quizArea を隠してセッション完了を表示
    const quizArea=ge('quizArea');if(quizArea)quizArea.style.display='none';
    ge('sessionComplete').querySelector('.complete-stats').innerHTML=
      `正解: <strong>${quizStats.correct}</strong> &nbsp;|&nbsp; 不正解: <strong>${quizStats.wrong}</strong> &nbsp;|&nbsp; 正答率: <strong>${Math.round(quizStats.correct/Math.max(1,quizStats.total)*100)}%</strong>`;
  }else{
    ge('sessionComplete').classList.add('active');ge('cardsListView').classList.remove('active');
    ge('sessionComplete').querySelector('.complete-stats').innerHTML=
      `総数: <strong>${sessionStats.total}</strong> &nbsp;|&nbsp; もう一度: <strong>${sessionStats.again}</strong> &nbsp;|&nbsp; Good: <strong>${sessionStats.good}</strong> &nbsp;|&nbsp; Easy: <strong>${sessionStats.easy}</strong>`;
  }
}

window.flipCard=function(){if(cardFlipped)return;cardFlipped=true;ge('cardBackArea').style.display='flex';document.querySelectorAll('.ctrl-btn').forEach(b=>b.disabled=false);};
window.rateCard=async function(rating){
  const cardId=studyQueue[currentCardIdx];
  if(rating===1)sessionStats.again++;else if(rating===2)sessionStats.good++;else sessionStats.easy++;
  await updateCardSRS(cardId,rating);
  if(rating===1){const r=Math.min(currentCardIdx+3,studyQueue.length);studyQueue.splice(r,0,cardId);}
  currentCardIdx++;renderFlashcard();
};
window.restartSession=function(){
  const flashArea=ge('flashcardArea');
  const quizArea=ge('quizArea');
  ge('sessionComplete').classList.remove('active');
  if(studyMode==='4choice'){
    if(flashArea)flashArea.style.display='none';
    if(quizArea)quizArea.style.display='';
    buildQuizQueue();renderQuizCard();
  }else{
    if(flashArea)flashArea.style.display='';
    if(quizArea)quizArea.style.display='none';
    buildStudyQueue();renderFlashcard();
  }
};

async function updateCardSRS(cardId,rating){
  const card=decks[currentDeckId]?.cards?.[cardId];if(!card)return;
  let{interval,ease,reps}=card;ease=ease||2.5;
  if(rating===1){interval=1;reps=0;}
  else if(rating===2){if(reps===0)interval=1;else if(reps===1)interval=6;else interval=Math.round(interval*ease);reps++;ease=Math.max(1.3,ease-.08);}
  else{if(reps===0)interval=4;else interval=Math.round(interval*ease*1.3);reps++;ease=Math.min(3.0,ease+.15);}
  const due=Date.now()+interval*86400000;
  decks[currentDeckId].cards[cardId]={...card,interval,ease,reps,due};
  if(currentSession)await db.ref(`cards/${currentDeckId}/${cardId}`).update({interval,ease,reps,due}).catch(()=>{});
}

function renderCardsList(){
  const d=decks[currentDeckId],list=ge('cardsList');
  if(!d||!d.cards||Object.keys(d.cards).length===0){list.innerHTML='<p style="color:var(--text3);font-size:12px;padding:16px 0">カードがまだありません。</p>';return;}
  list.innerHTML='';
  Object.entries(d.cards).forEach(([id,card])=>{
    const item=document.createElement('div');item.className='card-item';
    item.innerHTML=`<div class="card-item-body"><div class="card-item-front">${esc(card.front)}</div><div class="card-item-back">→ ${esc(card.back)}</div></div><button class="card-delete" onclick="deleteCardSession('${id}')">✕</button>`;
    list.appendChild(item);
  });
}
window.handleAddCard=function(e){
  e.preventDefault();
  const front=ge('addFront').value.trim(),back=ge('addBack').value.trim();
  if(!front||!back){showToast('表面・裏面を入力してください','error');return;}
  addCardToSession(front,back);ge('addFront').value='';ge('addBack').value='';ge('addFront').focus();
};
async function addCardToSession(front,back){
  if(!currentSession||!currentDeckId)return;
  const cardId='c_'+Math.random().toString(36).slice(2,10);
  const card={f:front,b:back,due:Date.now(),interval:0,ease:2.5,reps:0};
  try{
    await db.ref(`cards/${currentDeckId}/${cardId}`).set(card);
    const nc=(decks[currentDeckId].cardCount||0)+1;await db.ref(`decks/${currentDeckId}/cc`).set(nc);
    if(!decks[currentDeckId].cards)decks[currentDeckId].cards={};
    decks[currentDeckId].cards[cardId]={front,back,deckId:currentDeckId,...card};decks[currentDeckId].cardCount=nc;
    if(allPublicDecks[currentDeckId])allPublicDecks[currentDeckId]=decks[currentDeckId];
    renderCardsList();showToast('カードを追加しました','success');
  }catch(e){showToast('追加エラー: '+e.message,'error');}
}
window.deleteCardSession=async function(cardId){
  if(!currentSession||!currentDeckId)return;
  try{
    await db.ref(`cards/${currentDeckId}/${cardId}`).remove();
    const nc=Math.max(0,(decks[currentDeckId].cardCount||1)-1);await db.ref(`decks/${currentDeckId}/cc`).set(nc);
    delete decks[currentDeckId].cards[cardId];decks[currentDeckId].cardCount=nc;renderCardsList();showToast('カードを削除しました');
  }catch(e){showToast('削除エラー: '+e.message,'error');}
};

// ══════════════════════════════════════════════════════
//  4択クイズ
// ══════════════════════════════════════════════════════

function buildQuizQueue(){
  const d=decks[currentDeckId];
  if(!d||!d.cards){quizQueue=[];return;}
  quizQueue=Object.keys(d.cards).sort(()=>Math.random()-.5);
  quizIdx=0;quizAnswered=false;quizStats={correct:0,wrong:0,total:quizQueue.length};
}

function renderQuizCard(){
  const d=decks[currentDeckId];
  if(!d)return;
  if(quizIdx>=quizQueue.length){showSessionComplete();return;}

  const cardId=quizQueue[quizIdx];
  const card=d.cards[cardId];
  if(!card){quizIdx++;renderQuizCard();return;}

  quizAnswered=false;

  // 選択肢を作る: 正解 + ランダムな不正解3つ
  const allCards=Object.values(d.cards);
  const wrongCards=allCards.filter(c=>c!==card).sort(()=>Math.random()-.5).slice(0,3);
  const choices=[card,...wrongCards].sort(()=>Math.random()-.5);
  currentQuizChoices=choices;
  quizCorrectIdx=choices.indexOf(card);

  // プログレス
  const progressBar=ge('quizProgressBar');
  const progressText=ge('quizProgress');
  if(progressBar)progressBar.style.width=`${(quizIdx/quizQueue.length)*100}%`;
  if(progressText)progressText.textContent=`${quizIdx+1} / ${quizQueue.length}`;

  // 問題文
  const questionEl=ge('quizQuestion');
  if(questionEl)questionEl.textContent=card.front;

  // 結果・次へボタンをリセット
  const resultEl=ge('quizResult');
  const nextBtn=ge('quizNextBtn');
  if(resultEl){resultEl.textContent='';resultEl.className='quiz-result';}
  if(nextBtn)nextBtn.style.display='none';

  // 選択肢を描画
  const choicesEl=ge('quizChoices');
  if(!choicesEl)return;
  choicesEl.innerHTML=choices.map((c,i)=>
    `<button class="quiz-choice" onclick="selectQuizAnswer(${i})">${esc(c.back)}</button>`
  ).join('');
}

window.selectQuizAnswer=function(choiceIdx){
  if(quizAnswered)return;
  quizAnswered=true;
  const isCorrect=choiceIdx===quizCorrectIdx;

  document.querySelectorAll('.quiz-choice').forEach((btn,i)=>{
    btn.disabled=true;
    if(i===quizCorrectIdx)btn.classList.add('correct');
    if(i===choiceIdx&&!isCorrect)btn.classList.add('wrong');
  });

  const result=ge('quizResult');
  if(result){
    if(isCorrect){
      quizStats.correct++;
      result.textContent='✓ 正解！';
      result.className='quiz-result correct-msg';
    }else{
      quizStats.wrong++;
      result.textContent=`✗ 不正解　正解: ${currentQuizChoices[quizCorrectIdx]?.back||''}`;
      result.className='quiz-result wrong-msg';
    }
  }

  const nextBtn=ge('quizNextBtn');
  if(nextBtn)nextBtn.style.display='';
};

window.nextQuizCard=function(){quizIdx++;renderQuizCard();};

// ══════════════════════════════════════════════════════
//  DECK EDIT PAGE
// ══════════════════════════════════════════════════════

async function renderDeckEditPage(deckId){
  const dk=allPublicDecks[deckId];if(!dk)return;
  ge('editPageDeckName').value=dk.name||'';
  ge('editPageDesc').value=dk.desc||'';
  const catWrap=ge('editPageCats');
  catWrap.innerHTML=DECK_CATS.filter(c=>c!=='ALL').map(c=>
    `<button class="dm-cat-btn${dk.cat===c?' on':''}" onclick="editPageToggleCat('${c}')">${c}</button>`
  ).join('');
  window._editPageCat=dk.cat||'';
  renderEditPageCards(deckId);
}

window.editPageToggleCat=function(cat){
  window._editPageCat=window._editPageCat===cat?'':cat;
  document.querySelectorAll('#editPageCats .dm-cat-btn').forEach(b=>b.classList.toggle('on',b.textContent===window._editPageCat));
};

window.saveEditPageDeck=async function(){
  if(!currentSession||!editingDeckIdPage)return;
  const name=ge('editPageDeckName').value.trim();
  if(!name){showToast('タイトルを入力してください','error');return;}
  const btn=ge('editPageSaveBtn');btn.disabled=true;btn.textContent='保存中...';
  try{
    const updates={name,desc:ge('editPageDesc').value.trim(),tag:window._editPageCat||'',ut:Date.now()};
    await db.ref(`decks/${editingDeckIdPage}`).update(updates);
    if(allPublicDecks[editingDeckIdPage]){
      allPublicDecks[editingDeckIdPage].name=updates.name;
      allPublicDecks[editingDeckIdPage].desc=updates.desc;
      allPublicDecks[editingDeckIdPage].cat=updates.tag;
    }
    showToast('デッキを保存しました','success');
  }catch(e){showToast('保存エラー: '+e.message,'error');}
  finally{btn.disabled=false;btn.textContent='💾 保存';}
};

function renderEditPageCards(deckId){
  const dk=allPublicDecks[deckId];if(!dk)return;
  const cards=dk.cards||{};const cnt=Object.keys(cards).length;
  ge('editPageCardCount').textContent=`${cnt}枚`;
  const list=ge('editPageCardList');
  if(cnt===0){list.innerHTML='<p style="color:var(--text3);font-size:13px;padding:16px 0;text-align:center">カードがまだありません</p>';return;}
  list.innerHTML=Object.entries(cards).map(([cid,c])=>
    `<div class="ep-card-item" id="epc_${cid}">
      <div class="ep-card-display" id="epcd_${cid}">
        <div class="ep-card-texts">
          <div class="ep-card-front">${esc(c.front)}</div>
          <div class="ep-card-arrow">→</div>
          <div class="ep-card-back">${esc(c.back)}</div>
        </div>
        <div class="ep-card-btns">
          <button class="ep-btn edit" onclick="startEditCard('${deckId}','${cid}')">✏️</button>
          <button class="ep-btn del" onclick="deleteEditPageCard('${deckId}','${cid}')">✕</button>
        </div>
      </div>
      <div class="ep-card-editor" id="epce_${cid}" style="display:none">
        <input class="dm-add-input" id="epf_${cid}" value="${esc(c.front)}" placeholder="表面">
        <input class="dm-add-input" id="epb_${cid}" value="${esc(c.back)}" placeholder="裏面">
        <div style="display:flex;gap:6px;margin-top:6px">
          <button class="dm-add-btn" onclick="saveEditCard('${deckId}','${cid}')">保存</button>
          <button style="padding:7px 12px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);color:var(--text2);font-size:12px;font-weight:700;cursor:pointer;" onclick="cancelEditCard('${cid}')">キャンセル</button>
        </div>
      </div>
    </div>`
  ).join('');
}

window.startEditCard=function(deckId,cid){ge(`epcd_${cid}`).style.display='none';ge(`epce_${cid}`).style.display='';ge(`epf_${cid}`).focus();};
window.cancelEditCard=function(cid){ge(`epcd_${cid}`).style.display='';ge(`epce_${cid}`).style.display='none';};
window.saveEditCard=async function(deckId,cid){
  const front=(ge(`epf_${cid}`)?.value||'').trim(),back=(ge(`epb_${cid}`)?.value||'').trim();
  if(!front||!back){showToast('表面・裏面を入力してください','error');return;}
  try{
    await db.ref(`cards/${deckId}/${cid}`).update({f:front,b:back});
    if(allPublicDecks[deckId]?.cards?.[cid]){allPublicDecks[deckId].cards[cid].front=front;allPublicDecks[deckId].cards[cid].back=back;}
    if(decks[deckId]?.cards?.[cid]){decks[deckId].cards[cid].front=front;decks[deckId].cards[cid].back=back;}
    renderEditPageCards(deckId);showToast('カードを更新しました','success');
  }catch(e){showToast('更新エラー: '+e.message,'error');}
};
window.deleteEditPageCard=async function(deckId,cid){
  if(!confirm('このカードを削除しますか？'))return;
  try{
    await db.ref(`cards/${deckId}/${cid}`).remove();
    const nc=Math.max(0,(allPublicDecks[deckId].cardCount||1)-1);
    await db.ref(`decks/${deckId}/cc`).set(nc);
    delete allPublicDecks[deckId].cards[cid];allPublicDecks[deckId].cardCount=nc;
    if(decks[deckId]){delete decks[deckId].cards[cid];decks[deckId].cardCount=nc;}
    renderEditPageCards(deckId);showToast('カードを削除しました');
  }catch(e){showToast('削除エラー: '+e.message,'error');}
};
window.addEditPageCard=async function(){
  if(!currentSession||!editingDeckIdPage)return;
  const front=(ge('epAddFront')?.value||'').trim(),back=(ge('epAddBack')?.value||'').trim();
  if(!front||!back){showToast('表面と裏面を入力してください','error');return;}
  const cardId='c_'+Math.random().toString(36).slice(2,10);
  const card={f:front,b:back,due:Date.now(),interval:0,ease:2.5,reps:0};
  try{
    await db.ref(`cards/${editingDeckIdPage}/${cardId}`).set(card);
    const nc=(allPublicDecks[editingDeckIdPage].cardCount||0)+1;
    await db.ref(`decks/${editingDeckIdPage}/cc`).set(nc);
    if(!allPublicDecks[editingDeckIdPage].cards)allPublicDecks[editingDeckIdPage].cards={};
    allPublicDecks[editingDeckIdPage].cards[cardId]={front,back,deckId:editingDeckIdPage,...card};
    allPublicDecks[editingDeckIdPage].cardCount=nc;
    if(decks[editingDeckIdPage])decks[editingDeckIdPage]=allPublicDecks[editingDeckIdPage];
    ge('epAddFront').value='';ge('epAddBack').value='';ge('epAddFront').focus();
    renderEditPageCards(editingDeckIdPage);showToast('カードを追加しました','success');
  }catch(e){showToast('追加エラー: '+e.message,'error');}
};
window.deleteEditPageDeck=async function(){
  if(!editingDeckIdPage||!currentSession)return;
  const dk=allPublicDecks[editingDeckIdPage];
  if(!dk||dk.owner!==currentSession.username){showToast('権限がありません','error');return;}
  if(!confirm(`「${dk.name}」を削除しますか？カードも全て削除されます。`))return;
  try{
    await db.ref(`cards/${editingDeckIdPage}`).remove();await db.ref(`decks/${editingDeckIdPage}`).remove();
    delete allPublicDecks[editingDeckIdPage];delete decks[editingDeckIdPage];
    goBackFromEdit();showToast('デッキを削除しました');
  }catch(e){showToast('削除エラー: '+e.message,'error');}
};

// ══════════════════════════════════════════════════════
//  PROFILE PAGE
// ══════════════════════════════════════════════════════

async function renderProfilePage(username){
  const page=ge('pageProfile');
  page.innerHTML=`<div class="profile-bar">
    <button class="back-btn" onclick="goBackFromProfile()">← 戻る</button>
    <div style="flex:1"></div>
  </div>
  <div class="profile-loading"><div class="spinner"></div></div>`;

  try{
    const[pSnap,fSnap,allFollowsSnap]=await Promise.all([
      db.ref(`users/${username}`).once('value'),
      db.ref(`follows/${username}`).once('value'),
      db.ref('follows').once('value'),
    ]);
    const ud=pSnap.val()||{};
    const followingMap=fSnap.val()||{};
    const allFollows=allFollowsSnap.val()||{};
    const followerCount=Object.values(allFollows).filter(f=>f&&f[username]===true).length;
    const followingCount=Object.keys(followingMap).length;
    const isSelf=currentSession&&currentSession.username===username;
    let amFollowing=false;
    if(currentSession&&!isSelf){const myF=allFollows[currentSession.username]||{};amFollowing=myF[username]===true;}

    const userDecks=Object.entries(allPublicDecks).filter(([,d])=>d.owner===username);
    const userPosts=Object.entries(allPosts).filter(([,p])=>p.author===username);
    const av=localStorage.getItem('fm_avatar_'+username)||ud.avatar||null;
    const streakVal=ud.streak||0;
    const createdTs=ud.created||ud.createdAt||0;

    page.innerHTML=`
    <div class="profile-bar">
      <button class="back-btn" onclick="goBackFromProfile()">← 戻る</button>
      <div style="flex:1"></div>
      ${isSelf?`<button class="btn btn-blog btn-sm" onclick="openProfileEditModal()">✏️ 編集</button>`:''}
    </div>

    <div class="profile-hero">
      <div class="profile-hero-bg"></div>
      <div class="profile-hero-inner">
        <canvas id="profileAvatar" width="80" height="80" class="profile-avatar"></canvas>
        <div class="profile-info">
          <div class="profile-dispname">${esc(ud.displayName||username)}</div>
          <div class="profile-username">@${esc(username)}</div>
          ${ud.bio?`<div class="profile-bio">${esc(ud.bio)}</div>`:''}
          <div class="profile-badges">
            ${streakVal>0?`<span class="profile-badge streak">🔥 ${streakVal}日連続</span>`:''}
            ${ud.isadmin||ud.isAdmin?`<span class="profile-badge admin">⚡ ADMIN</span>`:''}
            ${createdTs?`<span class="profile-badge date">📅 ${fmtDate(createdTs)}から</span>`:''}
          </div>
        </div>
        ${!isSelf&&currentSession?`<button class="follow-btn${amFollowing?' following':''}" id="profileFollowBtn" onclick="toggleProfileFollow('${username}')">${amFollowing?'フォロー中':'フォローする'}</button>`:''}
      </div>
    </div>

    <div class="profile-stats">
      <div class="profile-stat"><div class="pstat-val" style="color:var(--primary)">${followerCount}</div><div class="pstat-lbl">フォロワー</div></div>
      <div class="profile-stat"><div class="pstat-val" style="color:var(--blog)">${followingCount}</div><div class="pstat-lbl">フォロー中</div></div>
      <div class="profile-stat"><div class="pstat-val" style="color:#F59E0B">${userDecks.length}</div><div class="pstat-lbl">デッキ</div></div>
      <div class="profile-stat"><div class="pstat-val" style="color:#52C4A3">${userPosts.length}</div><div class="pstat-lbl">記事</div></div>
    </div>

    <div class="profile-tabs-wrap">
      <div class="profile-tabs">
        <button class="profile-tab on" id="ptabDecks" onclick="switchProfileTab('decks')">📚 デッキ</button>
        <button class="profile-tab" id="ptabPosts" onclick="switchProfileTab('posts')">✏️ 記事</button>
      </div>
    </div>

    <div class="profile-content">
      <div id="profileDecksView">
        ${userDecks.length===0?'<div class="profile-empty">デッキがありません</div>':
          `<div class="profile-deck-grid">${userDecks.map(([id,dk])=>`
            <div class="profile-deck-card" onclick="showStudyModeModal('${id}');goBackFromProfile()">
              ${dk.cat?`<span class="dc-tag" style="${catBg(dk.cat)};font-size:9px;padding:2px 7px;border-radius:4px;font-weight:800;">${esc(dk.cat)}</span>`:''}
              <div class="profile-deck-name">${esc(dk.name||'無題')}</div>
              <div class="profile-deck-meta">${dk.cardCount||0}枚 · ⭐ ${dk.favCount||0}</div>
            </div>`).join('')}</div>`}
      </div>
      <div id="profilePostsView" style="display:none">
        ${userPosts.length===0?'<div class="profile-empty">記事がありません</div>':
          `<div class="profile-posts-list">${userPosts.sort((a,b)=>b[1].createdAt-a[1].createdAt).map(([id,p])=>`
            <div class="profile-post-item" onclick="switchTab('blog');openPost('${id}')">
              <span class="blog-card-tag" style="font-size:9px;">${esc(p.tag||'その他')}</span>
              <div class="profile-post-title">${esc(p.title||'無題')}</div>
              <div class="profile-post-meta">${fmtDate(p.createdAt)} · 💬 ${p.commentCount||0}</div>
            </div>`).join('')}</div>`}
      </div>
    </div>`;

    drawAvatar(ge('profileAvatar'),username,av,80);
  }catch(e){
    page.innerHTML=`<div class="profile-bar"><button class="back-btn" onclick="goBackFromProfile()">← 戻る</button></div>
    <div style="padding:60px;text-align:center;color:var(--text3)">読み込みエラー: ${esc(e.message)}</div>`;
  }
}

window.switchProfileTab=function(tab){
  ge('ptabDecks').classList.toggle('on',tab==='decks');
  ge('ptabPosts').classList.toggle('on',tab==='posts');
  ge('profileDecksView').style.display=tab==='decks'?'':'none';
  ge('profilePostsView').style.display=tab==='posts'?'':'none';
};

window.toggleProfileFollow=async function(targetUsername){
  if(!currentSession){openAuthModal('login');return;}
  const me=currentSession.username,btn=ge('profileFollowBtn');
  const amSnap=await db.ref(`follows/${me}/${targetUsername}`).once('value');const am=amSnap.val()===true;
  if(am){await db.ref(`follows/${me}/${targetUsername}`).remove();if(btn){btn.textContent='フォローする';btn.classList.remove('following');}}
  else{await db.ref(`follows/${me}/${targetUsername}`).set(true);if(btn){btn.textContent='フォロー中';btn.classList.add('following');}}
  showToast(am?`@${targetUsername} のフォローを解除しました`:`@${targetUsername} をフォローしました`);
};

window.openProfileEditModal=function(){
  const ex=ge('profileEditModal');if(ex)ex.remove();
  const ud=currentSession;
  const ov=document.createElement('div');
  ov.id='profileEditModal';
  ov.className='modal-overlay active';
  ov.innerHTML=`<div class="modal" style="max-width:440px">
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
  ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});
  drawAvatar(ge('peAvatarPreview'),ud.username,ud._avatar||localStorage.getItem('fm_avatar_'+ud.username)||null,56);
  db.ref(`users/${ud.username}/bio`).once('value').then(s=>{const b=s.val();if(b&&ge('peBio'))ge('peBio').value=b;}).catch(()=>{});
};
let _peAvatarData=null;
window.previewAvatar=function(e){
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{_peAvatarData=ev.target.result;drawAvatar(ge('peAvatarPreview'),currentSession.username,_peAvatarData,56);};
  reader.readAsDataURL(file);
};
window.saveProfileEdit=async function(){
  if(!currentSession)return;
  const displayName=(ge('peDisplayName')?.value||'').trim();
  const bio=(ge('peBio')?.value||'').trim();
  if(!displayName){ge('peError').textContent='表示名を入力してください';ge('peError').style.display='block';return;}
  try{
    const updates={displayName,bio};
    if(_peAvatarData)updates.avatar=_peAvatarData;
    await db.ref(`users/${currentSession.username}`).update(updates);
    currentSession.displayName=displayName;currentSession._bio=bio;
    if(_peAvatarData){currentSession._avatar=_peAvatarData;localStorage.setItem('fm_avatar_'+currentSession.username,_peAvatarData);}
    saveSession(currentSession);updateNavUI();
    ge('profileEditModal')?.remove();_peAvatarData=null;
    showToast('プロフィールを更新しました','success');
    renderProfilePage(currentSession.username);
  }catch(e){ge('peError').textContent='エラー: '+e.message;ge('peError').style.display='block';}
};

window.toggleFollow=async function(targetUsername){
  if(!currentSession){openAuthModal('login');return;}
  const me=currentSession.username;
  const amSnap=await db.ref(`follows/${me}/${targetUsername}`).once('value');const am=amSnap.val()===true;
  if(am){await db.ref(`follows/${me}/${targetUsername}`).remove();showToast(`@${targetUsername} のフォローを解除しました`);}
  else{await db.ref(`follows/${me}/${targetUsername}`).set(true);showToast(`@${targetUsername} をフォローしました`);}
};

// ── Push Notifications ────────────────────────────────
async function requestNotifPermission(){if(!('Notification'in window))return;if(Notification.permission==='default')await Notification.requestPermission().catch(()=>{});}
let _newsActive=false,_latestNewsTs=0;
function startNewsWatch(){
  if(!db||_newsActive)return;_newsActive=true;
  db.ref('news').orderByChild('ts').limitToLast(1).once('value').then(snap=>{
    const data=snap.val();if(data)_latestNewsTs=Object.values(data)[0].ts||0;
    db.ref('news').orderByChild('ts').startAfter(_latestNewsTs).on('child_added',snap=>{
      const n=snap.val();if(!n||n.ts<=_latestNewsTs)return;_latestNewsTs=n.ts;
      if(Notification.permission==='granted'&&document.visibilityState!=='visible')sendLocalNotif(n.title||'お知らせ',(n.content||'').slice(0,80));
      else showToast('🔔 新着: '+(n.title||'お知らせ'));
    });
  }).catch(()=>{});
}
async function sendLocalNotif(title,body){
  if(!('serviceWorker'in navigator))return;
  try{const reg=await navigator.serviceWorker.ready;reg.showNotification('HGStudy — '+title,{body,icon:'/icons/icon-192.png',tag:'hgstudy-news',renotify:true,vibrate:[200,100,200]});}catch(e){}
}

// ── Toast ─────────────────────────────────────────────
let toastTimer;
function showToast(msg,type=''){
  const t=ge('toast');t.textContent=msg;t.className='toast'+(type?' '+type:'')+' show';
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3000);
}

// ── Theme ─────────────────────────────────────────────
let themeIdx=localStorage.getItem('hgstudy_theme')==='dark'?1:0;
function applyTheme(){document.documentElement.setAttribute('data-theme',themeIdx===0?'light':'dark');const b=ge('themeToggle');if(b)b.textContent=themeIdx===0?'🌙':'☀️';}
window.toggleTheme=function(){themeIdx=(themeIdx+1)%2;localStorage.setItem('hgstudy_theme',themeIdx===0?'light':'dark');applyTheme();};
applyTheme();

// ── Init ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',()=>{
  ge('authForm')?.addEventListener('submit',handleAuthSubmit);
  ge('authModal')?.addEventListener('click',e=>{if(e.target===ge('authModal'))closeAuthModal();});
  ge('deckModal')?.addEventListener('click',e=>{if(e.target===ge('deckModal'))closeDeckModal();});
  ge('studyModeModal')?.addEventListener('click',e=>{if(e.target===ge('studyModeModal'))closeStudyModeModal();});
  ge('flashcard')?.addEventListener('click',()=>window.flipCard());
  ge('welcomeScreen').style.display='none';
  ge('deckBrowser').style.display='none';
  ge('studySession').style.display='none';
  initCatFilter();initDmCats();

  const sess=loadSession();
  if(sess&&sess.uid){
    currentSession=sess;
    db.ref(`users/${sess.username}`).once('value').then(snap=>{
      const ud=snap.val()||{};
      const isAdm=!!ud.isAdmin||!!ud.isadmin||ud.role==='admin';
      currentSession={...currentSession,isAdmin:isAdm,displayName:ud.displayName||sess.username,streak:ud.streak||0};
      if(ud.avatar){currentSession._avatar=ud.avatar;localStorage.setItem('fm_avatar_'+sess.username,ud.avatar);}
      saveSession(currentSession);onLogin();
    }).catch(()=>onLogin());
  }else{
    ge('welcomeScreen').style.display='flex';
    loadAllDecks();
  }
});
