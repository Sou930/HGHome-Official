// ── HGSNS JS v5.0 ──
// 新機能: 投稿編集/アンケート/DM/ピン留め/無限スクロール/予約投稿
//          スケルトンUI/モバイル引用リポスト/アバター&バナー画像/Markdown/管理ダッシュボード
// Firebase最適化: Storage移行・localStorage TTLキャッシュ・接続数節約・レートリミット

const FIREBASE_CONFIG_BIN = "01111011 00100010 01100001 01110000 01101001 01001011 01100101 01111001 00100010 00111010 00100010 01000001 01001001 01111010 01100001 01010011 01111001 01000011 01100110 00111000 01010000 01001010 01011001 01111000 01000011 01001010 01000011 01000110 01000011 01000100 00110001 01110000 01101000 01000100 01011111 00101101 01011000 01010110 01010101 01011010 00111001 00110010 01000100 01010011 01010110 01110101 01010010 01100001 01110101 01010101 00100010 00101100 00100010 01100001 01110101 01110100 01101000 01000100 01101111 01101101 01100001 01101001 01101110 00100010 00111010 00100010 01101000 01100111 01110011 01110100 01110101 01100100 01111001 00101101 00110001 00111000 01100101 00110010 00110011 00101110 01100110 01101001 01110010 01100101 01100010 01100001 01110011 01100101 01100001 01110000 01110000 00101110 01100011 01101111 01101101 00100010 00101100 00100010 01100100 01100001 01110100 01100001 01100010 01100001 01110011 01100101 01010101 01010010 01001100 00100010 00111010 00100010 01101000 01110100 01110100 01110000 01110011 00111010 00101111 00101111 01101000 01100111 01110011 01110100 01110101 01100100 01111001 00101101 00110001 00111000 01100101 00110010 00110011 00101101 01100100 01100101 01100110 01100001 01110101 01101100 01110100 00101101 01110010 01110100 01100100 01100010 00101110 01100001 01110011 01101001 01100001 00101101 01110011 01101111 01110101 01110100 01101000 01100101 01100001 01110011 01110100 00110001 00101110 01100110 01101001 01110010 01100101 01100010 01100001 01110011 01100101 01100100 01100001 01110100 01100001 01100010 01100001 01110011 01100101 00101110 01100001 01110000 01110000 00100010 00101100 00100010 01110000 01110010 01101111 01101010 01100101 01100011 01110100 01001001 01100100 00100010 00111010 00100010 01101000 01100111 01110011 01110100 01110101 01100100 01111001 00101101 00110001 00111000 01100101 00110010 00110011 00100010 00101100 00100010 01110011 01110100 01101111 01110010 01100001 01100111 01100101 01000010 01110101 01100011 01101011 01100101 01110100 00100010 00111010 00100010 01101000 01100111 01110011 01110100 01110101 01100100 01111001 00101101 00110001 00111000 01100101 00110010 00110011 00101110 01100110 01101001 01110010 01100101 01100010 01100001 01110011 01100101 01110011 01110100 01101111 01110010 01100001 01100111 01100101 00101110 01100001 01110000 01110000 00100010 00101100 00100010 01101101 01100101 01110011 01110011 01100001 01100111 01101001 01101110 01100111 01010011 01100101 01101110 01100100 01100101 01110010 01001001 01100100 00100010 00111010 00100010 00110111 00110010 00110000 00110001 00110101 00110000 00110111 00110001 00110010 00110111 00110111 00110101 00100010 00101100 00100010 01100001 01110000 01110000 01001001 01100100 00100010 00111010 00100010 00110001 00111010 00110111 00110010 00110000 00110001 00110101 00110000 00110111 00110001 00110010 00110111 00110111 00110101 00111010 01110111 01100101 01100010 00111010 00110110 00110011 00110010 01100010 00110010 01100010 01100100 00110110 01100110 00110000 00110100 00110100 00110001 01100001 00111000 00110011 01100100 00110111 00110100 00111001 01100101 00110010 00100010 00101100 00100010 01101101 01100101 01100001 01110011 01110101 01110010 01100101 01101101 01100101 01101110 01110100 01001001 01100100 00100010 00111010 00100010 01000111 00101101 01011001 00110000 00110101 00110110 00110001 00110001 00110110 01010010 01010001 01001101 00100010 01111101";

function bin2str(b){const c=b.replace(/[^01]/g,'');if(!c)return'';return c.match(/.{1,8}/g).filter(x=>x.length===8).map(b=>String.fromCharCode(parseInt(b,2))).join('');}

// ════════════════════════════════════════
//  STATE
// ════════════════════════════════════════
let db=null, storage=null, session=null;
let currentView='home', viewHistory=[], viewedProfile=null;
let _postImageBase64=null, _sheetImageBase64=null, _replyImageBase64=null;
let _replyContext=null, _repostContext=null;
let _repostState={owner:'',postId:'',reposted:false};
let _feedTab='rec', _searchTab='users';
let _searchResults={users:[],posts:[],tags:[]};
let _unreadNotifCount=0, _dmListener=null, _currentDmRoom=null;
let _editPostCtx=null;
// 無限スクロール
let _feedCursor=null, _feedLoading=false, _feedExhausted=false;
let _feedSentinelObserver=null;
const PAGE_SIZE=20;
// キャッシュ
const _userFlagsCache={}, _avatarCache={};
const AVATAR_TTL=24*60*60*1000; // 24h
// レートリミット（Firebase書き込み削減）
let _lastPostTs=0;
const POST_INTERVAL=15000; // 15秒

// ════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function timeAgo(ts){
  const s=Math.floor((Date.now()-ts)/1000);
  if(s<60)return s+'秒';
  const m=Math.floor(s/60);if(m<60)return m+'分';
  const h=Math.floor(m/60);if(h<24)return h+'時間';
  const d=Math.floor(h/24);if(d<7)return d+'日';
  return new Date(ts).toLocaleDateString('ja-JP',{month:'short',day:'numeric'});
}
function formatCount(n){
  if(n>=10000)return(n/10000).toFixed(1).replace(/\.0$/,'')+'万';
  if(n>=1000)return(n/1000).toFixed(1).replace(/\.0$/,'')+'K';
  return String(n||0);
}
function setCookie(n,v,d){try{const e=d?'; expires='+new Date(Date.now()+d*864e5).toUTCString():'';const sec=location.protocol==='https:'?'; Secure':'';document.cookie=n+'='+encodeURIComponent(v)+e+'; path=/; SameSite=Lax'+sec;}catch(e){}}
function getCookie(n){try{const m=document.cookie.split('; ').find(r=>r.startsWith(n+'='));return m?decodeURIComponent(m.split('=').slice(1).join('=')):null;}catch(e){return null;}}
function deleteCookie(n){document.cookie=n+'=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';}
function extractHashtags(t){const m=t.match(/#[^\s#！？。、,\.]+/g);return m?[...new Set(m.map(x=>x.toLowerCase()))]:[];}

// ── Markdown + ハッシュタグ レンダラー ──
function renderTextWithHashtags(text){
  if(!text)return'';
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g,'<em>$1</em>')
    .replace(/~~(.+?)~~/g,'<del>$1</del>')
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/#([^\s#！？。、,\.&;]+)/g,'<span class="hashtag" onclick="event.stopPropagation();openHashtag(\'#$1\')">#$1</span>')
    .replace(/@([a-zA-Z0-9_]{2,20})/g,'<span class="mention" onclick="event.stopPropagation();openProfile(\'$1\')">@$1</span>');
}

// ════════════════════════════════════════
//  BADGES
// ════════════════════════════════════════
async function getUserFlags(username){
  if(_userFlagsCache[username]!==undefined)return _userFlagsCache[username];
  if(!db){_userFlagsCache[username]={};return{};}
  try{
    const snap=await db.ref(`users/${username}`).once('value');
    const u=snap.val()||{};
    const flags={isadmin:!!u.isadmin,isdev:!!u.isdev,isofficial:!!u.isofficial};
    _userFlagsCache[username]=flags;return flags;
  }catch(e){_userFlagsCache[username]={};return{};}
}
function buildBadgeHtml(flags,size){
  if(!flags)return'';
  const s=size==='lg'?'-lg':'';let h='';
  if(flags.isadmin)h+=`<span class="user-badge${s} badge-admin${s}" title="管理者"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7l-9-5z"/></svg></span>`;
  if(flags.isofficial)h+=`<span class="user-badge${s} badge-official${s}" title="公式"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg></span>`;
  if(flags.isdev)h+=`<span class="user-badge${s} badge-dev${s}" title="開発者"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg></span>`;
  return h;
}

// ════════════════════════════════════════
//  AVATAR
// ════════════════════════════════════════
const AVATAR_COLORS=[['#7B6CF6','#B06EF6'],['#F5835B','#F6C344'],['#52C4A3','#3B82F6'],['#E65B9A','#F5835B'],['#4B8DEA','#52C4A3'],['#A068F5','#F5835B'],['#F6C344','#52C4A3'],['#3B82F6','#E65B9A']];
function avatarColorForName(name){let h=0;for(let i=0;i<name.length;i++)h=(h*31+name.charCodeAt(i))&0xffff;return AVATAR_COLORS[h%AVATAR_COLORS.length];}
function drawAvatarCanvas(canvas,username,imageData,size){
  if(!canvas)return;
  const s=size||canvas.width;canvas.width=s;canvas.height=s;
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,s,s);
  if(imageData){
    const img=new Image();img.crossOrigin='anonymous';
    img.onload=()=>{ctx.save();ctx.beginPath();ctx.arc(s/2,s/2,s/2,0,Math.PI*2);ctx.clip();ctx.drawImage(img,0,0,s,s);ctx.restore();};
    img.src=imageData;
  }else{
    const colors=avatarColorForName(username||'?');
    const g=ctx.createLinearGradient(0,0,s,s);g.addColorStop(0,colors[0]);g.addColorStop(1,colors[1]);
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(s/2,s/2,s/2,0,Math.PI*2);ctx.fill();
    const initials=(username||'?').slice(0,2).toUpperCase();
    ctx.fillStyle='rgba(255,255,255,0.92)';ctx.font=`bold ${Math.round(s*.36)}px "Outfit",sans-serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(initials,s/2,s/2);
  }
}
function avatarImgTag(username,av,size){
  if(av)return`<img class="post-avatar" src="${esc(av)}" alt="${esc(username)}" onclick="openProfile('${esc(username)}')" loading="lazy">`;
  const cv=document.createElement('canvas');cv.width=size||44;cv.height=size||44;
  drawAvatarCanvas(cv,username,null,size||44);
  return`<img class="post-avatar" src="${cv.toDataURL()}" alt="${esc(username)}" onclick="openProfile('${esc(username)}')">`;
}

// ── アバター取得（TTLキャッシュ）──
async function getAvatarDataUrl(username){
  if(_avatarCache[username])return _avatarCache[username];
  try{
    const cached=localStorage.getItem('hg_av_'+username);
    if(cached){const{url,ts}=JSON.parse(cached);if(Date.now()-ts<AVATAR_TTL){_avatarCache[username]=url;return url;}}
  }catch(e){}
  if(!db)return null;
  try{
    const snap=await db.ref(`users/${username}/avatar`).once('value');
    const url=snap.val()||null;
    _avatarCache[username]=url;
    if(url)try{localStorage.setItem('hg_av_'+username,JSON.stringify({url,ts:Date.now()}));}catch(e){}
    return url;
  }catch(e){return null;}
}

// ════════════════════════════════════════
//  FIREBASE STORAGE アップロード
//  ※ base64をRTDBに直接保存しないことで転送量・ストレージ使用量を大幅削減
// ════════════════════════════════════════
async function uploadToStorage(base64data,path){
  if(!storage||!base64data)return base64data; // fallback
  try{
    const res=await fetch(base64data);const blob=await res.blob();
    const ref=storage.ref(path);
    const snap=await ref.put(blob,{cacheControl:'public,max-age=31536000'});
    return await snap.ref.getDownloadURL();
  }catch(e){
    console.warn('Storage upload failed, using base64 fallback');
    return base64data;
  }
}

// ════════════════════════════════════════
//  TOAST
// ════════════════════════════════════════
let _toastTimer=null;
function showToast(msg){
  const t=document.getElementById('snsToast');if(!t)return;
  t.textContent=msg;t.classList.add('show');
  if(_toastTimer)clearTimeout(_toastTimer);
  _toastTimer=setTimeout(()=>t.classList.remove('show'),2600);
}

// ════════════════════════════════════════
//  SKELETON LOADING
// ════════════════════════════════════════
function skeletonHtml(count=5){
  const s=`<div class="skeleton-post"><div class="skeleton-avatar"></div><div class="skeleton-body"><div class="skeleton-line short"></div><div class="skeleton-line"></div><div class="skeleton-line medium"></div></div></div>`;
  return Array(count).fill(s).join('');
}

// ════════════════════════════════════════
//  FIREBASE INIT
// ════════════════════════════════════════
function initFirebase(){
  let cfg=null;try{cfg=JSON.parse(bin2str(FIREBASE_CONFIG_BIN));}catch(e){}
  if(!cfg||!cfg.apiKey){db=null;return false;}
  try{
    if(!firebase.apps.length)firebase.initializeApp(cfg);
    db=firebase.database();
    if(typeof firebase.storage==='function')storage=firebase.storage();
    return true;
  }catch(e){db=null;return false;}
}

// ════════════════════════════════════════
//  SESSION
// ════════════════════════════════════════
function loadSession(){
  let s=null;
  const cv=getCookie('hg_session')||getCookie('hgs_sess');
  const lv=localStorage.getItem('hg_session_ls')||localStorage.getItem('hgs_sess');
  if(cv){try{s=JSON.parse(cv);}catch(e){}}
  if(!s&&lv){try{s=JSON.parse(lv);}catch(e){}}
  if(s&&s.uid)session=s;
  updateSidebarUI();
  if(!session)openAuthModal('login');
}

function updateSidebarUI(){
  const guest=document.getElementById('sidebarGuest');
  const auth=document.getElementById('sidebarAuth');
  if(session){
    if(guest)guest.style.display='none';
    if(auth)auth.style.display='flex';
    document.getElementById('sidebarDispname').textContent=session.displayName||session.username;
    document.getElementById('sidebarUname').textContent='@'+session.username;
    const av=session._avatar||null;
    drawAvatarCanvas(document.getElementById('sidebarAvatarCanvas'),session.username,av,40);
    drawAvatarCanvas(document.getElementById('composerAvatarCanvas'),session.username,av,44);
    drawAvatarCanvas(document.getElementById('sheetAvatarCanvas'),session.username,av,40);
    const navAv=document.getElementById('navAvatarCanvas');
    if(navAv){
      drawAvatarCanvas(navAv,session.username,av,26);navAv.style.display='block';
      document.getElementById('navProfileIconWrap')?.querySelectorAll('.nav-icon-outline,.nav-icon-fill').forEach(s=>s.style.display='none');
    }
    document.getElementById('feedComposer').style.display='flex';
    getUserFlags(session.username).then(f=>{
      const btn=document.getElementById('adminNavBtn');
      if(btn)btn.style.display=f.isadmin?'flex':'none';
    });
  }else{
    if(guest)guest.style.display='flex';
    if(auth)auth.style.display='none';
    document.getElementById('feedComposer').style.display='none';
    const btn=document.getElementById('adminNavBtn');if(btn)btn.style.display='none';
  }
}

function doLogout(){
  session=null;deleteCookie('hg_session');deleteCookie('hgs_sess');
  try{localStorage.removeItem('hg_session_ls');localStorage.removeItem('hgs_sess');}catch(e){}
  disconnectDmListener();
  updateSidebarUI();showToast('ログアウトしました');loadFeed();openAuthModal('login');
}

function togglePassVis(inputId,btn){
  const input=document.getElementById(inputId);if(!input)return;
  const isPass=input.type==='password';input.type=isPass?'text':'password';
  btn.innerHTML=isPass
    ?`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
    :`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
}

// ════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════
let _authMode='login';
function openAuthModal(mode){
  _authMode=mode||'login';switchAuthTab(_authMode);
  document.getElementById('authOverlay').classList.add('open');
  setTimeout(()=>document.getElementById('authUser')?.focus(),80);
}
function closeAuthModal(){if(!session)return;document.getElementById('authOverlay').classList.remove('open');}
function switchAuthTab(mode){
  _authMode=mode;
  document.getElementById('authTabLogin').classList.toggle('on',mode==='login');
  document.getElementById('authTabReg').classList.toggle('on',mode==='reg');
  document.getElementById('authRegExtra').style.display=mode==='reg'?'block':'none';
  document.getElementById('authSubmitBtn').textContent=mode==='login'?'ログイン':'アカウントを作成';
  document.getElementById('authErr').classList.remove('show');
}
function showAuthErr(msg){const el=document.getElementById('authErr');el.textContent=msg;el.classList.add('show');}

async function hashPass(pw){
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
      let[a,b,c,d,e,f,g,h]=[...H];
      for(let j=0;j<64;j++){const S1=rr(e,6)^rr(e,11)^rr(e,25);const ch=(e&f)^(~e&g);const t1=(h+S1+ch+K[j]+w[j])>>>0;const S0=rr(a,2)^rr(a,13)^rr(a,22);const maj=(a&b)^(a&c)^(b&c);const t2=(S0+maj)>>>0;h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}
      H[0]=(H[0]+a)>>>0;H[1]=(H[1]+b)>>>0;H[2]=(H[2]+c)>>>0;H[3]=(H[3]+d)>>>0;H[4]=(H[4]+e)>>>0;H[5]=(H[5]+f)>>>0;H[6]=(H[6]+g)>>>0;H[7]=(H[7]+h)>>>0;
    }
    return H.map(n=>n.toString(16).padStart(8,'0')).join('');
  }
  return sha256('hgstudy:'+pw);
}

async function authSubmit(){
  const username=document.getElementById('authUser').value.trim().toLowerCase();
  const pass=document.getElementById('authPass').value;
  document.getElementById('authErr').classList.remove('show');
  if(!username){showAuthErr('ユーザー名を入力してください');return;}
  if(!/^[a-zA-Z0-9_]{2,20}$/.test(username)){showAuthErr('ユーザー名は英数字・アンダースコア 2〜20文字');return;}
  if(pass.length<6){showAuthErr('パスワードは6文字以上');return;}
  if(_authMode==='reg'){
    const c=document.getElementById('authPassConfirm').value;
    if(pass!==c){showAuthErr('パスワードが一致しません');return;}
    await doRegister(username,pass);
  }else{
    await doLogin(username,pass);
  }
}
async function doRegister(username,pass){
  const btn=document.getElementById('authSubmitBtn');btn.textContent='登録中...';btn.disabled=true;
  try{
    const hash=await hashPass(pass);
    const snap=await db.ref('users/'+username).once('value');
    if(snap.exists()){showAuthErr('このユーザー名はすでに使われています');return;}
    await db.ref('users/'+username).set({username,hash,displayName:username,bio:'',avatar:'',created:Date.now()});
    const str=JSON.stringify({uid:username,username,displayName:username,_avatar:null});
    setCookie('hg_session',str,30);setCookie('hgs_sess',str,30);
    try{localStorage.setItem('hg_session_ls',str);localStorage.setItem('hgs_sess',str);}catch(e){}
    session={uid:username,username,displayName:username,_avatar:null};
    updateSidebarUI();document.getElementById('authOverlay').classList.remove('open');
    showToast('アカウントを作成しました！');loadFeed();
  }catch(e){showAuthErr('エラー: '+e.message);}
  finally{btn.textContent='アカウントを作成';btn.disabled=false;}
}
async function doLogin(username,pass){
  const btn=document.getElementById('authSubmitBtn');btn.textContent='確認中...';btn.disabled=true;
  try{
    const hash=await hashPass(pass);
    const snap=await db.ref('users/'+username).once('value');
    const stored=snap.val();
    if(!stored||stored.hash!==hash){showAuthErr('ユーザー名またはパスワードが間違っています');return;}
    const av=stored.avatar||null;
    if(av)try{localStorage.setItem('hg_av_'+username,JSON.stringify({url:av,ts:Date.now()}));}catch(e){}
    session={uid:username,username,displayName:stored.displayName||username,_avatar:av};
    const str=JSON.stringify(session);
    setCookie('hg_session',str,30);setCookie('hgs_sess',str,30);
    try{localStorage.setItem('hg_session_ls',str);localStorage.setItem('hgs_sess',str);}catch(e){}
    updateSidebarUI();document.getElementById('authOverlay').classList.remove('open');
    showToast('ログインしました！');loadFeed();loadNotifBadge();publishScheduledPosts();
  }catch(e){showAuthErr('エラー: '+e.message);}
  finally{btn.textContent='ログイン';btn.disabled=false;}
}

// ════════════════════════════════════════
//  IMAGE UPLOAD
// ════════════════════════════════════════
const MAX_IMG_W=1200, MAX_IMG_Q=0.82;
function compressImage(dataUrl,cb){
  const img=new Image();img.onload=()=>{
    let w=img.width,h=img.height;
    if(w>MAX_IMG_W){h=Math.round(h*MAX_IMG_W/w);w=MAX_IMG_W;}
    const cv=document.createElement('canvas');cv.width=w;cv.height=h;
    cv.getContext('2d').drawImage(img,0,0,w,h);
    let q=MAX_IMG_Q,result=cv.toDataURL('image/jpeg',q);
    while(result.length>600*1024*4/3&&q>0.3){q-=0.08;result=cv.toDataURL('image/jpeg',q);}
    cb(result);
  };img.src=dataUrl;
}
function readFileAsDataUrl(file,cb){const r=new FileReader();r.onload=e=>cb(e.target.result);r.readAsDataURL(file);}
function handlePostImgSelect(e){const f=e.target.files[0];if(!f)return;readFileAsDataUrl(f,raw=>compressImage(raw,d=>{_postImageBase64=d;document.getElementById('composerImgPreviewImg').src=d;document.getElementById('composerImgPreview').classList.add('show');}));}
function clearPostImage(){_postImageBase64=null;document.getElementById('composerImgPreview').classList.remove('show');document.getElementById('composerImgPreviewImg').src='';document.getElementById('postImgInput').value='';}
function handleSheetImgSelect(e){const f=e.target.files[0];if(!f)return;readFileAsDataUrl(f,raw=>compressImage(raw,d=>{_sheetImageBase64=d;document.getElementById('sheetImgPreviewImg').src=d;document.getElementById('sheetImgPreview').classList.add('show');}));}
function clearSheetImage(){_sheetImageBase64=null;document.getElementById('sheetImgPreview').classList.remove('show');document.getElementById('sheetImgPreviewImg').src='';document.getElementById('sheetImgInput').value='';}
function handleReplyImgSelect(e){const f=e.target.files[0];if(!f)return;readFileAsDataUrl(f,raw=>compressImage(raw,d=>{_replyImageBase64=d;document.getElementById('replyImgPreviewImg').src=d;document.getElementById('replyImgPreview').classList.add('show');}));}
function clearReplyImage(){_replyImageBase64=null;document.getElementById('replyImgPreview').classList.remove('show');document.getElementById('replyImgPreviewImg').src='';document.getElementById('replyImgInput').value='';}

// ── アバター画像アップロード ──
function triggerAvatarUpload(){
  if(!session)return;
  const inp=document.createElement('input');inp.type='file';inp.accept='image/*';
  inp.onchange=e=>{const f=e.target.files[0];if(!f)return;readFileAsDataUrl(f,raw=>compressImage(raw,async d=>{
    try{
      const url=await uploadToStorage(d,`avatars/${session.username}`);
      await db.ref(`users/${session.username}/avatar`).set(url);
      session._avatar=url;
      const str=JSON.stringify(session);setCookie('hg_session',str,30);setCookie('hgs_sess',str,30);
      try{localStorage.setItem('hg_session_ls',str);localStorage.setItem('hgs_sess',str);localStorage.setItem('hg_av_'+session.username,JSON.stringify({url,ts:Date.now()}));}catch(ex){}
      _avatarCache[session.username]=url;
      updateSidebarUI();openProfile(session.username);showToast('アバターを更新しました ✓');
    }catch(ex){showToast('エラー: '+ex.message);}
  }));};
  inp.click();
}

// ── バナー画像アップロード ──
function triggerBannerUpload(){
  if(!session)return;
  const inp=document.createElement('input');inp.type='file';inp.accept='image/*';
  inp.onchange=e=>{const f=e.target.files[0];if(!f)return;readFileAsDataUrl(f,raw=>compressImage(raw,async d=>{
    try{
      const url=await uploadToStorage(d,`banners/${session.username}`);
      await db.ref(`users/${session.username}/banner`).set(url);
      showToast('バナーを更新しました ✓');openProfile(session.username);
    }catch(ex){showToast('エラー: '+ex.message);}
  }));};
  inp.click();
}

// ════════════════════════════════════════
//  文字数リング
// ════════════════════════════════════════
function updateCharRing(len,max,ringId,countId){
  const ring=document.getElementById(ringId);const countEl=document.getElementById(countId);
  if(!ring)return;
  const circ=2*Math.PI*12;
  ring.setAttribute('stroke-dashoffset',circ*(1-Math.min(len/max,1)));
  const isWarn=len>max*.85,isOver=len>max;
  ring.className.baseVal='char-ring-fill'+(isOver?' over':isWarn?' warn':'');
  if(countEl){
    if(len>max-20){countEl.style.display='';countEl.textContent=max-len;countEl.className='composer-count'+(isOver?' over':isWarn?' warn':'');}
    else countEl.style.display='none';
  }
  return !isOver&&len>0;
}
function updateComposerCount(){
  const ta=document.getElementById('composerText');
  const valid=updateCharRing(ta.value.length,280,'composerRingFill','composerCount');
  document.getElementById('composerSubmitBtn').disabled=!valid;
}
function clearReplyContext(){_replyContext=null;document.getElementById('composerReplyBanner').style.display='none';}

// ════════════════════════════════════════
//  POLL COMPOSER（デスクトップ）
// ════════════════════════════════════════
function toggleDesktopPoll(show){
  const el=document.getElementById('desktopPollComposer');
  if(el){el.classList.toggle('show',show);if(!show)resetDesktopPoll();}
}
function resetDesktopPoll(){
  const wrap=document.getElementById('desktopPollOptions');if(!wrap)return;
  // 選択肢2個に戻す
  const rows=wrap.querySelectorAll('.poll-option-row');
  rows.forEach((r,i)=>{if(i>=2)r.remove();else r.querySelector('input').value='';});
  wrap.querySelectorAll('.poll-remove-btn').forEach(b=>b.style.display='none');
  const addBtn=document.getElementById('desktopPollAddBtn');if(addBtn)addBtn.style.display='flex';
}
function addDesktopPollOption(){
  const wrap=document.getElementById('desktopPollOptions');if(!wrap)return;
  const rows=wrap.querySelectorAll('.poll-option-row');if(rows.length>=4)return;
  const idx=rows.length+1;
  const row=document.createElement('div');row.className='poll-option-row';
  row.innerHTML=`<input type="text" placeholder="選択肢 ${idx}" maxlength="40"><button class="poll-remove-btn" onclick="removeDesktopPollOption(this)"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>`;
  wrap.appendChild(row);
  wrap.querySelectorAll('.poll-remove-btn').forEach(b=>b.style.display='flex');
  if(wrap.querySelectorAll('.poll-option-row').length>=4)document.getElementById('desktopPollAddBtn').style.display='none';
}
function removeDesktopPollOption(btn){
  const wrap=document.getElementById('desktopPollOptions');if(!wrap)return;
  btn.closest('.poll-option-row').remove();
  const rows=wrap.querySelectorAll('.poll-option-row');
  if(rows.length<=2)rows.forEach(r=>r.querySelector('.poll-remove-btn').style.display='none');
  document.getElementById('desktopPollAddBtn').style.display='flex';
}
function getDesktopPollData(){
  const el=document.getElementById('desktopPollComposer');
  if(!el||!el.classList.contains('show'))return null;
  const inputs=document.getElementById('desktopPollOptions').querySelectorAll('input');
  const options=[...inputs].map(i=>i.value.trim()).filter(Boolean);
  if(options.length<2)return null;
  const duration=parseInt(document.getElementById('desktopPollDuration').value)||604800000;
  return{options,endsAt:Date.now()+duration,votes:{}};
}

// ════════════════════════════════════════
//  POLL DISPLAY
// ════════════════════════════════════════
function buildPollHtml(poll,owner,postId){
  if(!poll||!poll.options)return'';
  const now=Date.now();const expired=now>poll.endsAt;
  const votes=poll.votes||{};
  const totalVotes=Object.keys(votes).length;
  const myVote=session?votes[session.username]:undefined;
  const hasVoted=myVote!==undefined||expired;
  const counts=poll.options.map((_,i)=>Object.values(votes).filter(v=>v===i).length);
  const optHtml=poll.options.map((opt,i)=>{
    const cnt=counts[i];const pct=totalVotes>0?Math.round(cnt/totalVotes*100):0;
    const isMyVote=myVote===i;
    const cls=hasVoted?(isMyVote?'voted-bar':''):(expired?'expired-bar':'');
    return`<div class="poll-option-bar ${cls}" onclick="event.stopPropagation();${!hasVoted&&!expired?`votePoll('${esc(owner)}','${esc(postId)}',${i})`:''}">
      ${hasVoted?`<div class="poll-option-fill" style="width:${pct}%"></div>`:''}
      <div class="poll-option-label">
        <span class="poll-option-name">${hasVoted&&isMyVote?'<span class="poll-option-check">✓</span>':''}${esc(opt)}</span>
        ${hasVoted?`<span class="poll-option-pct">${pct}%</span>`:''}
      </div>
    </div>`;
  }).join('');
  const remaining=expired?'投票終了':`残り${timeRemaining(poll.endsAt)}`;
  return`<div class="poll-wrap"><div class="poll-options-list">${optHtml}</div><div class="poll-meta"><span>${formatCount(totalVotes)} 票</span><span>${remaining}</span></div></div>`;
}
function timeRemaining(endsAt){
  const ms=endsAt-Date.now();if(ms<=0)return'終了';
  const d=Math.floor(ms/86400000);if(d>0)return d+'日';
  const h=Math.floor(ms/3600000);if(h>0)return h+'時間';
  return Math.floor(ms/60000)+'分';
}
async function votePoll(owner,postId,optionIndex){
  if(!session){showToast('ログインが必要です');return;}
  try{
    await db.ref(`posts/${owner}/${postId}/poll/votes/${session.username}`).set(optionIndex);
    showToast('投票しました');
    // ローカル更新
    const postEl=document.querySelector(`.post[data-post-id="${postId}"]`);
    if(postEl){
      const snap=await db.ref(`posts/${owner}/${postId}/poll`).once('value');
      const poll=snap.val();const pollWrap=postEl.querySelector('.poll-wrap');
      if(poll&&pollWrap)pollWrap.outerHTML=buildPollHtml(poll,owner,postId);
    }
  }catch(e){showToast('エラー: '+e.message);}
}

// ════════════════════════════════════════
//  MOBILE COMPOSE SHEET
// ════════════════════════════════════════
function openMobileCompose(replyCtx,quoteCtx){
  if(!session){openAuthModal('login');return;}
  _replyContext=replyCtx||null;_repostContext=quoteCtx||null;
  const sheetTitle=document.getElementById('sheetTitle');
  const sheetReplyBanner=document.getElementById('sheetReplyBanner');
  const sheetReplyName=document.getElementById('sheetReplyName');
  const sheetQuotePreview=document.getElementById('sheetQuotePreview');
  if(replyCtx){
    sheetTitle.textContent='返信';sheetReplyBanner.style.display='flex';
    sheetReplyName.textContent='@'+(replyCtx.displayName||replyCtx.username);
  }else{
    sheetTitle.textContent='新しいポスト';sheetReplyBanner.style.display='none';
  }
  if(quoteCtx&&sheetQuotePreview){
    sheetQuotePreview.style.display='block';
    sheetQuotePreview.innerHTML=`<div class="qe-header"><span class="qe-name">${esc(quoteCtx.post.displayName||quoteCtx.post.username)}</span><span class="qe-uname">@${esc(quoteCtx.post.username)}</span></div><div class="qe-text">${esc((quoteCtx.post.text||'').slice(0,100))}</div>`;
  }else if(sheetQuotePreview){sheetQuotePreview.style.display='none';}
  document.getElementById('sheetTextarea').value='';updateSheetCount();clearSheetImage();
  drawAvatarCanvas(document.getElementById('sheetAvatarCanvas'),session.username,session._avatar||null,40);
  document.getElementById('mobileComposeOverlay').classList.add('open');
  setTimeout(()=>document.getElementById('sheetTextarea').focus(),100);
}
function closeMobileCompose(){document.getElementById('mobileComposeOverlay').classList.remove('open');_repostContext=null;}
function updateSheetCount(){
  const ta=document.getElementById('sheetTextarea');const len=ta.value.length;
  updateCharRing(len,280,'sheetRingFill',null);
  document.getElementById('sheetSubmitBtn').disabled=len===0||len>280;
}
async function submitSheetPost(){
  if(!session){showToast('ログインが必要です');return;}
  if(Date.now()-_lastPostTs<POST_INTERVAL){showToast(`${Math.ceil((POST_INTERVAL-(Date.now()-_lastPostTs))/1000)}秒後に投稿できます`);return;}
  const text=document.getElementById('sheetTextarea').value.trim();
  if(!text&&!_sheetImageBase64){showToast('テキストまたは画像が必要です');return;}
  if(text.length>280){showToast('280文字以内にしてください');return;}
  const btn=document.getElementById('sheetSubmitBtn');btn.disabled=true;
  try{
    let imageUrl=null;
    if(_sheetImageBase64)imageUrl=await uploadToStorage(_sheetImageBase64,`postImages/${session.username}/${Date.now()}`);
    const post={text,username:session.username,displayName:session.displayName||session.username,ts:Date.now(),likes:{},reposts:{},replyCount:0,views:0};
    if(imageUrl)post.image=imageUrl;
    if(_replyContext){
      post.replyTo={owner:_replyContext.owner,postId:_replyContext.postId,username:_replyContext.username,displayName:_replyContext.displayName};
      await db.ref(`posts/${_replyContext.owner}/${_replyContext.postId}/replyCount`).transaction(c=>(c||0)+1);
      if(_replyContext.username!==session.username)await pushNotification(_replyContext.username,'reply',{from:session.username,fromDisplay:session.displayName||session.username,postOwner:_replyContext.owner,postId:_replyContext.postId,text:text.slice(0,60)});
    }
    if(_repostContext){
      const{owner:qo,postId:qp,post:qpost}=_repostContext;
      post.quoteOf={owner:qo,postId:qp,username:qpost.username,displayName:qpost.displayName||qpost.username,text:qpost.text||''};
    }
    await db.ref('posts/'+session.username).push(post);
    await saveHashtags(text);_lastPostTs=Date.now();
    closeMobileCompose();showToast('投稿しました ✓');
    if(currentView==='home')loadFeed();
    else if(currentView==='thread'&&_replyContext)openThread(_replyContext.owner,_replyContext.postId);
  }catch(e){showToast('エラー: '+e.message);}
  finally{btn.disabled=false;}
}

// ════════════════════════════════════════
//  DESKTOP SUBMIT
// ════════════════════════════════════════
async function submitPost(){
  if(!session){showToast('ログインが必要です');return;}
  if(Date.now()-_lastPostTs<POST_INTERVAL){showToast(`${Math.ceil((POST_INTERVAL-(Date.now()-_lastPostTs))/1000)}秒後に投稿できます`);return;}
  const text=document.getElementById('composerText').value.trim();
  if(!text&&!_postImageBase64){showToast('テキストまたは画像が必要です');return;}
  if(text.length>280){showToast('280文字以内にしてください');return;}
  const btn=document.getElementById('composerSubmitBtn');btn.disabled=true;
  try{
    let imageUrl=null;
    if(_postImageBase64)imageUrl=await uploadToStorage(_postImageBase64,`postImages/${session.username}/${Date.now()}`);
    const pollData=getDesktopPollData();
    const post={text,username:session.username,displayName:session.displayName||session.username,ts:Date.now(),likes:{},reposts:{},replyCount:0,views:0};
    if(imageUrl)post.image=imageUrl;
    if(pollData)post.poll=pollData;
    if(_replyContext){
      post.replyTo={owner:_replyContext.owner,postId:_replyContext.postId,username:_replyContext.username,displayName:_replyContext.displayName};
      await db.ref(`posts/${_replyContext.owner}/${_replyContext.postId}/replyCount`).transaction(c=>(c||0)+1);
      if(_replyContext.username!==session.username)await pushNotification(_replyContext.username,'reply',{from:session.username,fromDisplay:session.displayName||session.username,postOwner:_replyContext.owner,postId:_replyContext.postId,text:text.slice(0,60)});
    }
    await db.ref('posts/'+session.username).push(post);
    await saveHashtags(text);_lastPostTs=Date.now();
    document.getElementById('composerText').value='';clearPostImage();updateComposerCount();clearReplyContext();toggleDesktopPoll(false);
    showToast('投稿しました ✓');if(currentView==='home')loadFeed();
  }catch(e){showToast('エラー: '+e.message);}
  finally{btn.disabled=false;}
}

// ════════════════════════════════════════
//  投稿編集（5分以内）
// ════════════════════════════════════════
function openEditPostModal(owner,postId){
  if(!session||session.username!==owner){showToast('権限がありません');return;}
  _editPostCtx={owner,postId};
  const postEl=document.querySelector(`.post[data-post-id="${postId}"]`);
  const currentText=postEl?.querySelector('.post-text')?.innerText||'';
  document.getElementById('editPostText').value=currentText;
  document.getElementById('editPostErr').classList.remove('show');
  document.getElementById('editPostOverlay').classList.add('open');
  document.querySelectorAll('.post-dropdown.open').forEach(m=>m.classList.remove('open'));
}
function closeEditPostModal(){document.getElementById('editPostOverlay').classList.remove('open');_editPostCtx=null;}
async function submitEditPost(){
  if(!session||!_editPostCtx){return;}
  const text=document.getElementById('editPostText').value.trim();
  if(!text){const el=document.getElementById('editPostErr');el.textContent='テキストを入力してください';el.classList.add('show');return;}
  if(text.length>280){const el=document.getElementById('editPostErr');el.textContent='280文字以内にしてください';el.classList.add('show');return;}
  const btn=document.getElementById('editPostSubmitBtn');btn.disabled=true;
  try{
    const{owner,postId}=_editPostCtx;
    // 投稿時刻を確認
    const snap=await db.ref(`posts/${owner}/${postId}/ts`).once('value');
    if(Date.now()-snap.val()>5*60*1000){showToast('編集可能時間（5分）を超えています');closeEditPostModal();return;}
    await db.ref(`posts/${owner}/${postId}`).update({text,editedAt:Date.now()});
    closeEditPostModal();showToast('投稿を編集しました ✓');
    // 表示を即時更新
    const postEl=document.querySelector(`.post[data-post-id="${postId}"]`);
    if(postEl){
      const textEl=postEl.querySelector('.post-text');if(textEl)textEl.innerHTML=renderTextWithHashtags(text);
      if(!postEl.querySelector('.edited-badge')){
        const timeEl=postEl.querySelector('.post-time');
        if(timeEl)timeEl.insertAdjacentHTML('afterend','<span class="edited-badge">編集済み</span>');
      }
    }
    await saveHashtags(text);
  }catch(e){const el=document.getElementById('editPostErr');el.textContent='エラー: '+e.message;el.classList.add('show');}
  finally{btn.disabled=false;}
}

// ════════════════════════════════════════
//  ピン留め
// ════════════════════════════════════════
async function togglePinPost(owner,postId){
  if(!session||session.username!==owner){showToast('権限がありません');return;}
  document.querySelectorAll('.post-dropdown.open').forEach(m=>m.classList.remove('open'));
  try{
    const snap=await db.ref(`users/${owner}/pinnedPost`).once('value');
    const current=snap.val();
    if(current===postId){
      await db.ref(`users/${owner}/pinnedPost`).remove();
      showToast('ピン留めを解除しました');
    }else{
      await db.ref(`users/${owner}/pinnedPost`).set(postId);
      showToast('ピン留めしました 📌');
    }
    if(currentView==='profile'&&viewedProfile===owner)await loadProfilePosts(owner);
  }catch(e){showToast('エラー: '+e.message);}
}

// ════════════════════════════════════════
//  予約投稿
// ════════════════════════════════════════
function openScheduleModal(){
  if(!session){showToast('ログインが必要です');return;}
  const dt=document.getElementById('scheduleDateTime');
  // デフォルトを1時間後に
  const d=new Date(Date.now()+3600000);
  dt.value=d.toISOString().slice(0,16);
  dt.min=new Date(Date.now()+60000).toISOString().slice(0,16);
  document.getElementById('scheduleOverlay').classList.add('open');
}
function closeScheduleModal(){document.getElementById('scheduleOverlay').classList.remove('open');}
async function submitScheduledPost(){
  if(!session){showToast('ログインが必要です');return;}
  const text=document.getElementById('composerText').value.trim();
  if(!text&&!_postImageBase64){showToast('テキストまたは画像が必要です');return;}
  const dtVal=document.getElementById('scheduleDateTime').value;
  if(!dtVal){showToast('日時を選択してください');return;}
  const scheduledAt=new Date(dtVal).getTime();
  if(scheduledAt<=Date.now()+30000){showToast('現在より未来の時刻を指定してください');return;}
  try{
    let imageUrl=null;
    if(_postImageBase64)imageUrl=await uploadToStorage(_postImageBase64,`postImages/${session.username}/${Date.now()}`);
    const post={text,username:session.username,displayName:session.displayName||session.username,scheduledAt,createdAt:Date.now()};
    if(imageUrl)post.image=imageUrl;
    await db.ref(`scheduled/${session.username}`).push(post);
    closeScheduleModal();clearPostImage();document.getElementById('composerText').value='';updateComposerCount();
    showToast(`${new Date(scheduledAt).toLocaleString('ja-JP',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})} に予約しました`);
  }catch(e){showToast('エラー: '+e.message);}
}
async function publishScheduledPosts(){
  if(!session||!db)return;
  try{
    const snap=await db.ref(`scheduled/${session.username}`).once('value');
    const data=snap.val()||{};const now=Date.now();
    const due=Object.entries(data).filter(([,v])=>v.scheduledAt<=now);
    await Promise.allSettled(due.map(async([id,v])=>{
      const post={text:v.text,username:v.username,displayName:v.displayName,ts:v.scheduledAt,likes:{},reposts:{},replyCount:0,views:0};
      if(v.image)post.image=v.image;
      await db.ref('posts/'+session.username).push(post);
      await db.ref(`scheduled/${session.username}/${id}`).remove();
      if(v.text)await saveHashtags(v.text);
    }));
    if(due.length>0){showToast(`${due.length}件の予約投稿を公開しました`);if(currentView==='home')loadFeed();}
  }catch(e){}
}
async function loadScheduledView(){
  const el=document.getElementById('scheduledView');if(!el)return;
  if(!session){el.innerHTML='<div class="feed-empty">ログインが必要です</div>';return;}
  el.innerHTML=skeletonHtml(3);
  try{
    const snap=await db.ref(`scheduled/${session.username}`).orderByChild('scheduledAt').once('value');
    const data=snap.val()||{};
    const items=Object.entries(data).map(([id,v])=>({id,...v})).sort((a,b)=>a.scheduledAt-b.scheduledAt);
    if(!items.length){el.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">🕐</span>予約投稿はありません</div>';return;}
    el.innerHTML='';
    items.forEach(item=>{
      const div=document.createElement('div');div.className='scheduled-item';
      div.innerHTML=`<div class="scheduled-item-body">
        <div class="scheduled-time"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${new Date(item.scheduledAt).toLocaleString('ja-JP',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
        <div class="scheduled-text">${esc(item.text||'')}</div>
        <div class="scheduled-actions"><button class="scheduled-del-btn" onclick="deleteScheduled('${item.id}')">削除</button></div>
      </div>`;
      el.appendChild(div);
    });
  }catch(e){el.innerHTML=`<div class="feed-empty">エラー: ${esc(e.message)}</div>`;}
}
async function deleteScheduled(id){
  if(!session||!confirm('この予約投稿を削除しますか？'))return;
  try{await db.ref(`scheduled/${session.username}/${id}`).remove();showToast('削除しました');loadScheduledView();}
  catch(e){showToast('エラー: '+e.message);}
}

// ════════════════════════════════════════
//  HASHTAG INDEX
// ════════════════════════════════════════
async function saveHashtags(text){
  if(!db||!text)return;
  const tags=extractHashtags(text);const now=Date.now();
  await Promise.all(tags.map(tag=>{
    const key=tag.replace('#','').replace(/[.#$\[\]\/]/g,'_');
    return db.ref(`hashtags/${key}`).transaction(cur=>{if(!cur)return{tag,count:1,lastUsed:now};return{...cur,count:(cur.count||0)+1,lastUsed:now};});
  }));
}

// ════════════════════════════════════════
//  閲覧数
// ════════════════════════════════════════
async function recordView(owner,postId){
  if(!db)return;
  try{await db.ref(`posts/${owner}/${postId}/views`).transaction(c=>(c||0)+1);}catch(e){}
}

// ════════════════════════════════════════
//  BOOKMARK
// ════════════════════════════════════════
async function toggleBookmark(e,owner,postId,btn){
  e.stopPropagation();if(!session){showToast('ログインが必要です');return;}
  const ref=db.ref(`bookmarks/${session.username}/${owner}_${postId}`);
  const snap=await ref.once('value');const bookmarked=snap.val()!==null;
  if(bookmarked){await ref.remove();if(btn){btn.classList.remove('bookmarked');btn.querySelector('svg').setAttribute('fill','none');}showToast('ブックマークを解除しました');}
  else{await ref.set({owner,postId,ts:Date.now()});if(btn){btn.classList.add('bookmarked');btn.querySelector('svg').setAttribute('fill','currentColor');}showToast('ブックマークしました');}
}
async function isBookmarked(owner,postId){
  if(!session||!db)return false;
  try{const snap=await db.ref(`bookmarks/${session.username}/${owner}_${postId}`).once('value');return snap.val()!==null;}catch(e){return false;}
}
async function loadBookmarksView(){
  const el=document.getElementById('bookmarksView');if(!el)return;
  if(!session){el.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">🔒</span>ログインが必要です</div>';return;}
  el.innerHTML=`<div class="bookmarks-header">ブックマーク<div class="bookmarks-sub">@${esc(session.username)} のブックマーク</div></div>${skeletonHtml(4)}`;
  try{
    const snap=await db.ref(`bookmarks/${session.username}`).orderByChild('ts').once('value');
    const data=snap.val()||{};const entries=Object.values(data).sort((a,b)=>b.ts-a.ts);
    const postsEl=document.createElement('div');
    el.innerHTML=`<div class="bookmarks-header">ブックマーク<div class="bookmarks-sub">@${esc(session.username)} のブックマーク</div></div>`;
    if(!entries.length){el.innerHTML+='<div class="feed-empty"><span class="feed-empty-icon">🔖</span>まだブックマークがありません</div>';return;}
    el.appendChild(postsEl);
    const posts=await Promise.allSettled(entries.map(async e=>{try{const s=await db.ref(`posts/${e.owner}/${e.postId}`).once('value');const p=s.val();if(!p)return null;return{id:e.postId,owner:e.owner,...p};}catch{return null;}}));
    const valid=posts.filter(r=>r.status==='fulfilled'&&r.value).map(r=>r.value);
    if(!valid.length){postsEl.innerHTML='<div class="feed-empty">投稿が見つかりません</div>';return;}
    await renderPosts(postsEl,valid);
  }catch(e){el.innerHTML+=`<div class="feed-empty">エラー: ${esc(e.message)}</div>`;}
}

// ════════════════════════════════════════
//  通知
// ════════════════════════════════════════
async function pushNotification(toUser,type,data){if(!db||!toUser)return;try{await db.ref(`notifications/${toUser}`).push({type,data,ts:Date.now(),read:false});}catch(e){}}
async function loadNotifBadge(){
  if(!session||!db)return;
  try{
    const snap=await db.ref(`notifications/${session.username}`).orderByChild('read').equalTo(false).once('value');
    const count=snap.numChildren();_unreadNotifCount=count;
    const badge=document.getElementById('notifBadge');if(badge){badge.style.display=count>0?'flex':'none';badge.textContent=count>9?'9+':String(count);}
  }catch(e){}
}
async function loadNotifications(){
  const el=document.getElementById('notificationsView');if(!el)return;
  if(!session){el.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">🔒</span>ログインが必要です</div>';return;}
  el.innerHTML='<div class="spinner"><div class="spin"></div>読み込み中...</div>';
  try{
    const snap=await db.ref(`notifications/${session.username}`).orderByChild('ts').limitToLast(50).once('value');
    const data=snap.val()||{};const notifs=Object.entries(data).map(([id,n])=>({id,...n})).sort((a,b)=>b.ts-a.ts);
    const updates={};notifs.forEach(n=>{if(!n.read)updates[`notifications/${session.username}/${n.id}/read`]=true;});
    if(Object.keys(updates).length)db.ref().update(updates);
    _unreadNotifCount=0;const badge=document.getElementById('notifBadge');if(badge)badge.style.display='none';
    if(!notifs.length){el.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">🔔</span>通知はありません</div>';return;}
    el.innerHTML='';
    notifs.forEach(n=>{
      const item=document.createElement('div');item.className='notif-item'+(n.read?'':' unread');
      const d=n.data||{};let iconClass='',iconContent='',bodyText='';
      if(n.type==='like'){iconClass='like';iconContent='❤️';bodyText=`<strong>${esc(d.fromDisplay||d.from)}</strong> さんがいいねしました`;}
      else if(n.type==='repost'){iconClass='repost';iconContent='🔁';bodyText=`<strong>${esc(d.fromDisplay||d.from)}</strong> さんがリポストしました`;}
      else if(n.type==='follow'){iconClass='follow';iconContent='👤';bodyText=`<strong>${esc(d.fromDisplay||d.from)}</strong> さんがフォローしました`;}
      else if(n.type==='reply'){iconClass='reply';iconContent='💬';bodyText=`<strong>${esc(d.fromDisplay||d.from)}</strong> さんが返信しました`;}
      item.innerHTML=`<div class="notif-icon ${iconClass}">${iconContent}</div><div class="notif-body"><div class="notif-text">${bodyText}</div>${d.text?`<div class="notif-post-preview">${esc(d.text)}</div>`:''}<div class="notif-time">${timeAgo(n.ts)}</div></div>`;
      if(n.type==='follow'&&d.from)item.onclick=()=>openProfile(d.from);
      else if(d.postOwner&&d.postId)item.onclick=()=>openThread(d.postOwner,d.postId);
      el.appendChild(item);
    });
  }catch(e){el.innerHTML=`<div class="feed-empty">エラー: ${esc(e.message)}</div>`;}
}

// ════════════════════════════════════════
//  DM（ダイレクトメッセージ）
// ════════════════════════════════════════
function getRoomId(a,b){return[a,b].sort().join('__');}

function disconnectDmListener(){
  if(_dmListener){_dmListener();_dmListener=null;}_currentDmRoom=null;
}

async function loadDmView(){
  const el=document.getElementById('dmView');if(!el)return;
  if(!session){el.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">🔒</span>ログインが必要です</div>';return;}
  disconnectDmListener();
  el.innerHTML=`
    <button class="dm-new-btn" onclick="openDmNew()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      新しいメッセージ
    </button>
    <div id="dmRoomList"><div class="spinner"><div class="spin"></div></div></div>`;
  try{
    // 自分が参加しているルームを取得
    const snap=await db.ref(`dmRooms`).orderByChild(`members/${session.username}`).equalTo(true).once('value');
    const rooms=snap.val()||{};
    const roomList=document.getElementById('dmRoomList');
    if(!Object.keys(rooms).length){roomList.innerHTML='<div class="feed-empty" style="padding:40px 24px">まだメッセージがありません</div>';return;}
    const roomArr=Object.entries(rooms).map(([id,r])=>({id,...r})).sort((a,b)=>(b.lastTs||0)-(a.lastTs||0));
    roomList.innerHTML='';
    for(const room of roomArr){
      const otherUser=Object.keys(room.members||{}).find(u=>u!==session.username)||'';
      const[av,flags]=await Promise.all([getAvatarDataUrl(otherUser),getUserFlags(otherUser)]);
      const cvId='dmav_'+room.id;
      const item=document.createElement('div');item.className='dm-room-item'+(room.unread?.[session.username]?' unread-room':'');
      item.innerHTML=`<canvas id="${cvId}" class="suggest-avatar" width="40" height="40"></canvas>
        <div class="dm-room-info">
          <div class="dm-room-name">${esc(otherUser)}${buildBadgeHtml(flags,'sm')}</div>
          <div class="dm-room-last">${esc((room.lastMsg||'').slice(0,40))}</div>
        </div>
        <div class="dm-room-time">${room.lastTs?timeAgo(room.lastTs):''}</div>`;
      item.onclick=()=>openDmChat(room.id,otherUser);
      roomList.appendChild(item);
      drawAvatarCanvas(document.getElementById(cvId),otherUser,av,40);
    }
  }catch(e){document.getElementById('dmRoomList').innerHTML=`<div class="feed-empty">エラー: ${esc(e.message)}</div>`;}
}

function openDmNew(){document.getElementById('dmNewOverlay').classList.add('open');document.getElementById('dmUserSearchInput').value='';document.getElementById('dmUserSearchResults').innerHTML='';}
function closeDmNew(){document.getElementById('dmNewOverlay').classList.remove('open');}

async function searchDmUsers(q){
  const el=document.getElementById('dmUserSearchResults');if(!el)return;
  if(!q||q.length<2){el.innerHTML='';return;}
  el.innerHTML='<div class="spinner"><div class="spin"></div></div>';
  try{
    const snap=await db.ref('users').once('value');
    const users=snap.val()||{};
    const matched=Object.entries(users).filter(([k])=>k!==session.username&&k.toLowerCase().includes(q.toLowerCase())).slice(0,8);
    if(!matched.length){el.innerHTML='<div style="padding:12px 16px;color:var(--white3);font-size:.88rem;">見つかりません</div>';return;}
    el.innerHTML='';
    for(const[uname,u]of matched){
      const av=await getAvatarDataUrl(uname);const cvId='dmnew_'+uname;
      const item=document.createElement('div');item.className='follow-user-item';
      item.innerHTML=`<canvas id="${cvId}" class="suggest-avatar" width="40" height="40"></canvas>
        <div class="suggest-info"><div class="suggest-name">${esc(u.displayName||uname)}</div><div class="suggest-uname">@${esc(uname)}</div></div>`;
      item.onclick=async()=>{closeDmNew();const roomId=getRoomId(session.username,uname);await db.ref(`dmRooms/${roomId}/members`).update({[session.username]:true,[uname]:true});openDmChat(roomId,uname);};
      el.appendChild(item);drawAvatarCanvas(document.getElementById(cvId),uname,av,40);
    }
  }catch(e){el.innerHTML=`<div style="padding:12px;color:var(--like);font-size:.84rem;">エラー: ${esc(e.message)}</div>`;}
}

async function openDmChat(roomId,otherUser){
  viewHistory.push(currentView);setView('dm');_currentDmRoom=roomId;disconnectDmListener();
  const el=document.getElementById('dmView');
  el.innerHTML=`
    <div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--line);">
      <button onclick="goBack()" style="background:none;border:none;color:var(--white);cursor:pointer;display:flex;align-items:center;padding:4px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </button>
      <span style="font-weight:700;cursor:pointer" onclick="openProfile('${esc(otherUser)}')">@${esc(otherUser)}</span>
    </div>
    <div class="dm-chat-wrap">
      <div class="dm-messages" id="dmMessages"><div class="spinner"><div class="spin"></div></div></div>
      <div class="dm-input-bar">
        <textarea class="dm-textarea" id="dmInputText" placeholder="メッセージを送信..." rows="1" onkeydown="if((event.ctrlKey||event.metaKey)&&event.key==='Enter')sendDmMessage('${esc(roomId)}','${esc(otherUser)}')" oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'"></textarea>
        <button class="dm-send-btn" onclick="sendDmMessage('${esc(roomId)}','${esc(otherUser)}')">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>`;
  // 未読をクリア
  await db.ref(`dmRooms/${roomId}/unread/${session.username}`).remove().catch(()=>{});
  // リアルタイムリスナー（接続1本）
  const messagesRef=db.ref(`dmMessages/${roomId}`).orderByChild('ts').limitToLast(80);
  const listener=messagesRef.on('value',snap=>{
    const msgs=snap.val()||{};const msgsEl=document.getElementById('dmMessages');if(!msgsEl)return;
    const arr=Object.entries(msgs).map(([id,m])=>({id,...m})).sort((a,b)=>a.ts-b.ts);
    msgsEl.innerHTML='';
    let lastDate='';
    arr.forEach(msg=>{
      const d=new Date(msg.ts).toLocaleDateString('ja-JP');
      if(d!==lastDate){msgsEl.innerHTML+=`<div class="dm-date-sep">${d}</div>`;lastDate=d;}
      const mine=msg.from===session.username;
      msgsEl.innerHTML+=`<div class="dm-msg-wrap ${mine?'mine':'theirs'}"><div class="dm-msg ${mine?'mine':'theirs'}">${esc(msg.text)}</div><div class="dm-msg-time">${timeAgo(msg.ts)}</div></div>`;
    });
    msgsEl.scrollTop=msgsEl.scrollHeight;
  });
  _dmListener=()=>messagesRef.off('value',listener);
}

async function sendDmMessage(roomId,otherUser){
  const ta=document.getElementById('dmInputText');if(!ta)return;
  const text=ta.value.trim();if(!text||!session)return;
  const btn=document.querySelector('.dm-send-btn');if(btn)btn.disabled=true;
  try{
    const msg={from:session.username,text,ts:Date.now()};
    await db.ref(`dmMessages/${roomId}`).push(msg);
    await db.ref(`dmRooms/${roomId}`).update({lastMsg:text,lastTs:Date.now(),[`unread/${otherUser}`]:true});
    ta.value='';ta.style.height='auto';
  }catch(e){showToast('エラー: '+e.message);}
  finally{if(btn)btn.disabled=false;}
}

// ════════════════════════════════════════
//  FEED（無限スクロール付き）
// ════════════════════════════════════════
async function loadFeed(){
  if(currentView!=='home')return;
  _feedCursor=null;_feedLoading=false;_feedExhausted=false;
  const feedEl=document.getElementById('feedPosts');
  feedEl.innerHTML=skeletonHtml(6);
  if(!db){feedEl.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">⚠️</span>Firebase 未初期化</div>';return;}
  if(_feedTab==='follow'&&session)await loadFollowFeed(feedEl);
  else await loadRecFeed(feedEl);
  setupInfiniteScroll();
}

function setupInfiniteScroll(){
  if(_feedSentinelObserver){_feedSentinelObserver.disconnect();_feedSentinelObserver=null;}
  const sentinel=document.getElementById('feedSentinel');if(!sentinel)return;
  _feedSentinelObserver=new IntersectionObserver(entries=>{
    if(entries[0].isIntersecting&&!_feedLoading&&!_feedExhausted)loadMoreFeed();
  },{threshold:0.1});
  _feedSentinelObserver.observe(sentinel);
}

async function loadMoreFeed(){
  if(_feedLoading||_feedExhausted)return;
  _feedLoading=true;
  const feedEl=document.getElementById('feedPosts');
  const loader=document.createElement('div');loader.className='feed-load-more';
  loader.innerHTML='<div class="spin"></div> 読み込み中...';
  const sentinel=document.getElementById('feedSentinel');
  if(sentinel)feedEl.insertBefore(loader,sentinel);else feedEl.appendChild(loader);
  try{
    if(_feedTab==='follow'&&session)await appendFollowFeed(feedEl,loader);
    else await appendRecFeed(feedEl,loader);
  }finally{_feedLoading=false;loader.remove();}
}

// X風スコアリング
function calcEngagementScore(p){
  const lk=p.likes?Object.keys(p.likes).length:0;
  const rp=p.reposts?Object.keys(p.reposts).length:0;
  const ry=p.replyCount||0,vw=p.views||0;
  const eng=lk*3+rp*4+ry*2+vw*.01;
  const h=Math.max(.1,(Date.now()-p.ts)/3600000);
  return eng/Math.pow(h+2,1.8);
}

async function loadRecFeed(feedEl){
  try{
    const usersSnap=await db.ref('users').once('value');
    const users=Object.keys(usersSnap.val()||{});
    const postArrays=await Promise.allSettled(users.map(u=>
      db.ref('posts/'+u).orderByChild('ts').limitToLast(30).once('value').then(s=>{
        const d=s.val()||{};
        return Object.entries(d).filter(([,p])=>!p.replyTo).map(([id,p])=>({id,owner:u,...p}));
      })
    ));
    let posts=postArrays.filter(r=>r.status==='fulfilled').flatMap(r=>r.value);
    const now=Date.now();
    const recent=posts.filter(p=>(now-p.ts)<72*3600000).sort((a,b)=>calcEngagementScore(b)-calcEngagementScore(a));
    const older=posts.filter(p=>(now-p.ts)>=72*3600000).sort((a,b)=>calcEngagementScore(b)-calcEngagementScore(a));
    const combined=[...recent,...older.slice(0,10)].sort((a,b)=>calcEngagementScore(b)-calcEngagementScore(a));
    _feedCursor={allPosts:combined,offset:PAGE_SIZE};
    const page=combined.slice(0,PAGE_SIZE);
    if(!page.length){feedEl.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">🐦</span>まだ投稿がありません</div>';_feedExhausted=true;return;}
    feedEl.innerHTML='';await renderPosts(feedEl,page);
    if(combined.length<=PAGE_SIZE)_feedExhausted=true;
  }catch(e){feedEl.innerHTML=`<div class="feed-empty">読み込みエラー: ${esc(e.message)}</div>`;}
}
async function appendRecFeed(feedEl,loader){
  if(!_feedCursor)return;
  const{allPosts,offset}=_feedCursor;const page=allPosts.slice(offset,offset+PAGE_SIZE);
  if(!page.length){_feedExhausted=true;return;}
  _feedCursor.offset=offset+PAGE_SIZE;
  if(_feedCursor.offset>=allPosts.length)_feedExhausted=true;
  await renderPosts(feedEl,page,false,loader);
}
async function loadFollowFeed(feedEl){
  if(!session){feedEl.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">🔒</span>ログインが必要です</div>';return;}
  try{
    const followSnap=await db.ref('follows/'+session.username).once('value');
    const followData=followSnap.val()||{};
    const targets=[session.username,...Object.keys(followData).filter(k=>followData[k]===true)];
    const postArrays=await Promise.allSettled(targets.map(u=>
      db.ref('posts/'+u).orderByChild('ts').limitToLast(40).once('value').then(s=>{
        const d=s.val()||{};
        return Object.entries(d).map(([id,p])=>({id,owner:u,username:p.username||u,displayName:p.displayName||p.username||u,...p}));
      })
    ));
    let posts=postArrays.filter(r=>r.status==='fulfilled').flatMap(r=>r.value).sort((a,b)=>b.ts-a.ts);
    _feedCursor={allPosts:posts,offset:PAGE_SIZE};
    const page=posts.slice(0,PAGE_SIZE);
    if(!page.length){feedEl.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">🐦</span>フォロー中の投稿がありません</div>';_feedExhausted=true;return;}
    feedEl.innerHTML='';await renderPosts(feedEl,page);
    if(posts.length<=PAGE_SIZE)_feedExhausted=true;
  }catch(e){feedEl.innerHTML=`<div class="feed-empty">読み込みエラー: ${esc(e.message)}</div>`;}
}
async function appendFollowFeed(feedEl,loader){
  if(!_feedCursor)return;
  const{allPosts,offset}=_feedCursor;const page=allPosts.slice(offset,offset+PAGE_SIZE);
  if(!page.length){_feedExhausted=true;return;}
  _feedCursor.offset=offset+PAGE_SIZE;
  if(_feedCursor.offset>=allPosts.length)_feedExhausted=true;
  await renderPosts(feedEl,page,false,loader);
}
function switchFeedTab(tab){
  _feedTab=tab;
  document.getElementById('feedTabRec')?.classList.toggle('active',tab==='rec');
  document.getElementById('feedTabFollow')?.classList.toggle('active',tab==='follow');
  if(currentView==='home')loadFeed();
}

// ════════════════════════════════════════
//  renderPosts
// ════════════════════════════════════════
async function renderPosts(container,posts,showThreadLines,insertBefore){
  const results=await Promise.allSettled(posts.map((p,i)=>buildPostEl(p,showThreadLines&&i<posts.length-1)));
  results.forEach(r=>{
    if(r.status==='fulfilled'){
      if(insertBefore&&insertBefore.parentNode===container)container.insertBefore(r.value,insertBefore);
      else container.appendChild(r.value);
    }
  });
}

// ════════════════════════════════════════
//  buildPostEl
// ════════════════════════════════════════
async function buildPostEl(p,showThreadLine){
  const el=document.createElement('div');el.className='post';el.dataset.postId=p.id;el.dataset.owner=p.owner||p.username;
  const username=p.username||p.owner,owner=p.owner||p.username;
  const[av,flags,bookmarked]=await Promise.all([
    getAvatarDataUrl(username),getUserFlags(username),
    session?isBookmarked(owner,p.id):Promise.resolve(false)
  ]);
  const avHtml=avatarImgTag(username,av,44);const badgeHtml=buildBadgeHtml(flags,'sm');
  const likeCount=p.likes?Object.keys(p.likes).length:0;
  const repostCount=p.reposts?Object.keys(p.reposts).length:0;
  const views=p.views||0;
  const liked=session&&p.likes&&p.likes[session.username];
  const reposted=session&&p.reposts&&p.reposts[session.username];
  const isOwner=session&&session.username===username;
  const imgHtml=p.image?`<div class="post-img" onclick="event.stopPropagation();openLightbox('${esc(p.image)}')"><img src="${esc(p.image)}" alt="投稿画像" loading="lazy"></div>`:'';
  const replyToHtml=p.replyTo?`<div class="post-reply-to">↩ <span>@${esc(p.replyTo.displayName||p.replyTo.username)}</span> への返信</div>`:'';
  const pollHtml=p.poll?buildPollHtml(p.poll,owner,p.id):'';
  let quoteHtml='';
  if(p.quoteOf)quoteHtml=`<div class="post-quote-embed" onclick="event.stopPropagation();openThread('${esc(p.quoteOf.owner)}','${esc(p.quoteOf.postId)}')"><div class="qe-header"><span class="qe-name">${esc(p.quoteOf.displayName||p.quoteOf.username)}</span><span class="qe-uname">@${esc(p.quoteOf.username)}</span></div><div class="qe-text">${esc((p.quoteOf.text||'').slice(0,80))}${(p.quoteOf.text||'').length>80?'…':''}</div></div>`;
  const editedBadge=p.editedAt?`<span class="edited-badge">編集済み</span>`:'';
  const isPinned=p._pinned||false;
  const canEdit=isOwner&&(Date.now()-p.ts)<5*60*1000;
  const menuHtml=isOwner?`
    <div class="post-menu-wrap">
      <button class="post-menu-btn" onclick="event.stopPropagation();togglePostMenu(event,'menu_${p.id}')"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg></button>
      <div class="post-dropdown" id="menu_${p.id}">
        ${canEdit?`<button class="post-dropdown-item" onclick="event.stopPropagation();openEditPostModal('${esc(owner)}','${esc(p.id)}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>編集 <small style="color:var(--white3);font-size:.72rem;">（5分以内）</small></button>`:''}
        <button class="post-dropdown-item" onclick="event.stopPropagation();togglePinPost('${esc(owner)}','${esc(p.id)}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>${isPinned?'ピン留めを解除':'ピン留め'}</button>
        <button class="post-dropdown-item danger" onclick="event.stopPropagation();deletePost('${esc(owner)}','${esc(p.id)}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>削除</button>
      </div>
    </div>`:'<span style="margin-left:auto;width:30px"></span>';

  el.innerHTML=`
    ${isPinned?`<div class="post-pin-label"><svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3" fill="var(--bg)"/></svg>ピン留め</div>`:''}
    <div style="display:flex;gap:12px;width:100%">
      <div class="post-avatar-col">${avHtml}${showThreadLine?'<div class="post-thread-line"></div>':''}</div>
      <div class="post-body">
        <div class="post-header">
          <span class="post-dispname" onclick="event.stopPropagation();openProfile('${esc(username)}')" style="cursor:pointer">${esc(p.displayName||username)}</span>
          ${badgeHtml}
          <span class="post-username">@${esc(username)}</span>
          <span class="post-dot">·</span>
          <span class="post-time">${timeAgo(p.ts)}</span>
          ${editedBadge}
          ${menuHtml}
        </div>
        ${replyToHtml}
        ${p.text?`<div class="post-text">${renderTextWithHashtags(p.text)}</div>`:''}
        ${imgHtml}${pollHtml}${quoteHtml}
        <div class="post-actions">
          <button class="post-action reply" onclick="event.stopPropagation();openReplyModal('${esc(owner)}','${esc(p.id)}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><span>${p.replyCount||0}</span></button>
          <button class="post-action repost ${reposted?'reposted':''}" onclick="event.stopPropagation();openRepostModal('${esc(owner)}','${esc(p.id)}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg><span>${repostCount}</span></button>
          <button class="post-action like ${liked?'liked':''}" id="likeBtn_${p.id}" onclick="event.stopPropagation();toggleLike(event,'${esc(owner)}','${esc(p.id)}',this)"><svg viewBox="0 0 24 24" fill="${liked?'currentColor':'none'}" stroke="currentColor" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg><span>${likeCount}</span></button>
          <button class="post-action" style="gap:4px;padding:7px 8px;" onclick="event.stopPropagation()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg><span style="font-size:.78rem;color:var(--white3)">${formatCount(views)}</span></button>
          <button class="post-action bookmark ${bookmarked?'bookmarked':''}" onclick="event.stopPropagation();toggleBookmark(event,'${esc(owner)}','${esc(p.id)}',this)"><svg viewBox="0 0 24 24" fill="${bookmarked?'currentColor':'none'}" stroke="currentColor" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg></button>
          <button class="post-action share" onclick="event.stopPropagation();sharePost(event,'${esc(p.id)}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg></button>
        </div>
      </div>
    </div>`;

  el.addEventListener('click',()=>openThread(owner,p.id));
  return el;
}

// ── Post menu ──
function togglePostMenu(e,menuId){
  e.stopPropagation();
  document.querySelectorAll('.post-dropdown.open').forEach(m=>{if(m.id!==menuId)m.classList.remove('open');});
  document.getElementById(menuId)?.classList.toggle('open');
}
document.addEventListener('click',()=>document.querySelectorAll('.post-dropdown.open').forEach(m=>m.classList.remove('open')));

// ════════════════════════════════════════
//  LIKE
// ════════════════════════════════════════
async function toggleLike(e,owner,postId,btn){
  e.stopPropagation();if(!session){showToast('ログインが必要です');return;}
  const ref=db.ref(`posts/${owner}/${postId}/likes/${session.username}`);
  const snap=await ref.once('value');const liked=snap.val()===true;
  if(liked){await ref.remove();}
  else{
    await ref.set(true);
    if(owner!==session.username){
      const postSnap=await db.ref(`posts/${owner}/${postId}`).once('value');const post=postSnap.val()||{};
      await pushNotification(owner,'like',{from:session.username,fromDisplay:session.displayName||session.username,postOwner:owner,postId,text:(post.text||'').slice(0,60)});
    }
  }
  const countEl=btn.querySelector('span');const svg=btn.querySelector('svg');
  btn.classList.toggle('liked',!liked);svg.setAttribute('fill',!liked?'currentColor':'none');
  countEl.textContent=Math.max(0,(parseInt(countEl.textContent)||0)+(!liked?1:-1));
  if(!liked){btn.classList.add('like-animate');setTimeout(()=>btn.classList.remove('like-animate'),400);}
}

// ════════════════════════════════════════
//  REPOST
// ════════════════════════════════════════
function openRepostModal(owner,postId){
  if(!session){showToast('ログインが必要です');return;}
  _repostState={owner,postId,reposted:false};
  db.ref(`posts/${owner}/${postId}/reposts/${session.username}`).once('value').then(snap=>{
    const already=snap.val()===true;_repostState.reposted=already;
    const undoBtn=document.getElementById('undoRepostBtn');if(undoBtn)undoBtn.style.display=already?'flex':'none';
  });
  document.getElementById('repostOverlay').classList.add('open');
}
function closeRepostModal(){document.getElementById('repostOverlay').classList.remove('open');}
async function doRepost(){
  const{owner,postId,reposted}=_repostState;if(reposted){await doUndoRepost();return;}
  await db.ref(`posts/${owner}/${postId}/reposts/${session.username}`).set(true);
  if(owner!==session.username){
    const snap=await db.ref(`posts/${owner}/${postId}`).once('value');const post=snap.val()||{};
    await pushNotification(owner,'repost',{from:session.username,fromDisplay:session.displayName||session.username,postOwner:owner,postId,text:(post.text||'').slice(0,60)});
  }
  closeRepostModal();showToast('リポストしました');await refreshRepostBtn(owner,postId);
}
async function doUndoRepost(){
  const{owner,postId}=_repostState;
  await db.ref(`posts/${owner}/${postId}/reposts/${session.username}`).remove();
  closeRepostModal();showToast('リポストを取り消しました');await refreshRepostBtn(owner,postId);
}
async function refreshRepostBtn(owner,postId){
  const btns=document.querySelectorAll(`.post[data-post-id="${postId}"] .post-action.repost`);if(!btns.length)return;
  const snap=await db.ref(`posts/${owner}/${postId}/reposts`).once('value');
  const count=snap.val()?Object.keys(snap.val()).length:0;
  const reposted=snap.val()&&snap.val()[session?.username]===true;
  btns.forEach(btn=>{btn.classList.toggle('reposted',reposted);const span=btn.querySelector('span');if(span)span.textContent=count;});
}

// ── Quote Repost ──
async function openQuoteRepost(){
  closeRepostModal();
  const{owner,postId}=_repostState;
  const isMobile=window.innerWidth<=800;
  const snap=await db.ref(`posts/${owner}/${postId}`).once('value');
  const post=snap.val();if(!post){showToast('投稿が見つかりません');return;}
  _repostContext={owner,postId,post};
  if(isMobile){
    openMobileCompose(null,{owner,postId,post});return;
  }
  const previewEl=document.getElementById('quotePreviewEmbed');
  if(previewEl)previewEl.innerHTML=`<div class="qe-header"><span class="qe-name">${esc(post.displayName||post.username)}</span><span class="qe-uname">@${esc(post.username)}</span></div><div class="qe-text">${esc((post.text||'').slice(0,120))}${(post.text||'').length>120?'…':''}</div>`;
  document.getElementById('quoteTextarea').value='';updateQuoteCount();
  drawAvatarCanvas(document.getElementById('quoteAvatarCanvas'),session.username,session._avatar||null,40);
  document.getElementById('quoteOverlay').classList.add('open');
  setTimeout(()=>document.getElementById('quoteTextarea').focus(),100);
}
function closeQuoteModal(){document.getElementById('quoteOverlay').classList.remove('open');}
function updateQuoteCount(){
  const ta=document.getElementById('quoteTextarea');const len=ta.value.length;const max=280;
  const el=document.getElementById('quoteCount');el.textContent=max-len;
  el.className='composer-count'+(len>max?' over':len>max*.9?' warn':'');
}
async function submitQuoteRepost(){
  if(!session||!_repostContext){showToast('エラー');return;}
  const text=document.getElementById('quoteTextarea').value.trim();
  const btn=document.getElementById('quoteSubmitBtn');btn.disabled=true;
  try{
    const{owner,postId,post}=_repostContext;
    const newPost={text,username:session.username,displayName:session.displayName||session.username,ts:Date.now(),likes:{},reposts:{},replyCount:0,views:0,quoteOf:{owner,postId,username:post.username,displayName:post.displayName||post.username,text:post.text||''}};
    await db.ref('posts/'+session.username).push(newPost);
    if(text)await saveHashtags(text);
    closeQuoteModal();showToast('引用リポストしました');if(currentView==='home')loadFeed();
  }catch(e){showToast('エラー: '+e.message);}
  finally{btn.disabled=false;}
}

// ════════════════════════════════════════
//  REPLY MODAL
// ════════════════════════════════════════
let _replyModalCtx=null;
async function openReplyModal(owner,postId){
  if(!session){showToast('ログインが必要です');return;}
  const snap=await db.ref(`posts/${owner}/${postId}`).once('value');
  const post=snap.val();if(!post){showToast('投稿が見つかりません');return;}
  _replyModalCtx={owner,postId,post};
  const isMobile=window.innerWidth<=800;
  if(isMobile){openMobileCompose({owner,postId,username:post.username||owner,displayName:post.displayName||post.username||owner,text:post.text||''});return;}
  const ctx=document.getElementById('replyModalContext');
  const av=await getAvatarDataUrl(post.username||owner);
  ctx.innerHTML=`<div class="post-avatar-col">${avatarImgTag(post.username||owner,av,40)}<div class="post-thread-line"></div></div>
    <div class="post-body">
      <div class="post-header"><span class="post-dispname">${esc(post.displayName||post.username)}</span><span class="post-username">@${esc(post.username||owner)}</span></div>
      ${post.text?`<div class="post-text">${renderTextWithHashtags(post.text)}</div>`:''}
    </div>`;
  document.getElementById('replyTextarea').value='';updateReplyCount();clearReplyImage();
  drawAvatarCanvas(document.getElementById('replyAvatarCanvas'),session.username,session._avatar||null,40);
  document.getElementById('replyOverlay').classList.add('open');
  setTimeout(()=>document.getElementById('replyTextarea').focus(),100);
}
function closeReplyModal(){document.getElementById('replyOverlay').classList.remove('open');_replyModalCtx=null;}
function updateReplyCount(){
  const ta=document.getElementById('replyTextarea');const len=ta.value.length;const max=280;
  const el=document.getElementById('replyCount');el.textContent=max-len;
  el.className='composer-count'+(len>max?' over':len>max*.9?' warn':'');
  document.getElementById('replySubmitBtn').disabled=len===0||len>max;
}
async function submitReply(){
  if(!session||!_replyModalCtx){showToast('エラー');return;}
  const text=document.getElementById('replyTextarea').value.trim();
  if(!text&&!_replyImageBase64){showToast('テキストまたは画像が必要です');return;}
  const btn=document.getElementById('replySubmitBtn');btn.disabled=true;
  try{
    const{owner,postId,post}=_replyModalCtx;
    let imageUrl=null;
    if(_replyImageBase64)imageUrl=await uploadToStorage(_replyImageBase64,`postImages/${session.username}/${Date.now()}`);
    const newPost={text,username:session.username,displayName:session.displayName||session.username,ts:Date.now(),likes:{},reposts:{},replyCount:0,views:0,replyTo:{owner,postId,username:post.username||owner,displayName:post.displayName||post.username||owner}};
    if(imageUrl)newPost.image=imageUrl;
    await db.ref('posts/'+session.username).push(newPost);
    await db.ref(`posts/${owner}/${postId}/replyCount`).transaction(c=>(c||0)+1);
    if(text)await saveHashtags(text);
    if((post.username||owner)!==session.username)await pushNotification(post.username||owner,'reply',{from:session.username,fromDisplay:session.displayName||session.username,postOwner:owner,postId,text:text.slice(0,60)});
    document.querySelectorAll(`.post[data-post-id="${postId}"] .post-action.reply span`).forEach(el=>{el.textContent=(parseInt(el.textContent)||0)+1;});
    closeReplyModal();showToast('返信しました');
    if(currentView==='thread')openThread(owner,postId);
    else if(currentView==='home')loadFeed();
  }catch(e){showToast('エラー: '+e.message);}
  finally{btn.disabled=false;}
}

// ════════════════════════════════════════
//  THREAD VIEW
// ════════════════════════════════════════
async function openThread(owner,postId){
  viewHistory.push(currentView);currentView='thread';setView('thread');
  if(!session||session.username!==owner)recordView(owner,postId);
  const el=document.getElementById('threadView');
  el.innerHTML=skeletonHtml(3);
  try{
    const snap=await db.ref(`posts/${owner}/${postId}`).once('value');
    const post=snap.val();if(!post){el.innerHTML='<div class="feed-empty">投稿が見つかりません</div>';return;}
    post.id=postId;post.owner=owner;
    const username=post.username||owner;
    const[av,flags,bookmarked]=await Promise.all([getAvatarDataUrl(username),getUserFlags(username),session?isBookmarked(owner,postId):Promise.resolve(false)]);
    const badgeHtml=buildBadgeHtml(flags,'lg');
    const likeCount=post.likes?Object.keys(post.likes).length:0;
    const repostCount=post.reposts?Object.keys(post.reposts).length:0;
    const views=post.views||0;
    const liked=session&&post.likes&&post.likes[session.username];
    const reposted=session&&post.reposts&&post.reposts[session.username];
    const avHtml=avatarImgTag(username,av,48);
    const imgHtml=post.image?`<div class="post-img" onclick="openLightbox('${esc(post.image)}')" style="cursor:zoom-in"><img src="${esc(post.image)}" alt="" loading="lazy"></div>`:'';
    const pollHtml=post.poll?buildPollHtml(post.poll,owner,postId):'';
    let quoteHtml='';
    if(post.quoteOf)quoteHtml=`<div class="post-quote-embed" onclick="openThread('${esc(post.quoteOf.owner)}','${esc(post.quoteOf.postId)}')"><div class="qe-header"><span class="qe-name">${esc(post.quoteOf.displayName||post.quoteOf.username)}</span><span class="qe-uname">@${esc(post.quoteOf.username)}</span></div><div class="qe-text">${esc((post.quoteOf.text||'').slice(0,100))}${(post.quoteOf.text||'').length>100?'…':''}</div></div>`;
    const editedBadge=post.editedAt?`<span class="edited-badge" style="font-size:.78rem;">編集済み</span>`:'';
    el.innerHTML=`
      <div class="post-detail">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          ${avHtml.replace('class="post-avatar"','class="post-avatar" style="width:48px;height:48px;"')}
          <div>
            <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
              <div class="post-dispname" onclick="openProfile('${esc(username)}')" style="cursor:pointer;font-size:1.05rem">${esc(post.displayName||username)}</div>${badgeHtml}
            </div>
            <div class="post-username">@${esc(username)}</div>
          </div>
        </div>
        ${post.replyTo?`<div class="post-reply-to" style="margin-bottom:8px;">↩ <span>@${esc(post.replyTo.displayName||post.replyTo.username)}</span> への返信</div>`:''}
        ${post.text?`<div class="post-text" style="font-size:1.15rem;margin-bottom:12px;">${renderTextWithHashtags(post.text)}</div>`:''}
        ${imgHtml}${pollHtml}${quoteHtml}
        <div style="font-size:.84rem;color:var(--white3);margin:8px 0;display:flex;align-items:center;gap:8px;">${new Date(post.ts).toLocaleString('ja-JP',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}${editedBadge}</div>
        <div class="post-detail-meta">
          <span><strong>${formatCount(repostCount)}</strong> リポスト</span>
          <span><strong>${formatCount(likeCount)}</strong> いいね</span>
          <span style="display:flex;align-items:center;gap:4px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg><strong>${formatCount(views)}</strong></span>
        </div>
        <div class="post-detail-actions">
          <button class="post-action reply" onclick="openReplyModal('${esc(owner)}','${esc(postId)}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><span>${post.replyCount||0}</span></button>
          <button class="post-action repost ${reposted?'reposted':''}" onclick="openRepostModal('${esc(owner)}','${esc(postId)}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg><span>${repostCount}</span></button>
          <button class="post-action like ${liked?'liked':''}" id="likeBtn_detail_${postId}" onclick="toggleLike(event,'${esc(owner)}','${esc(postId)}',this)"><svg viewBox="0 0 24 24" fill="${liked?'currentColor':'none'}" stroke="currentColor" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg><span>${likeCount}</span></button>
          <button class="post-action bookmark ${bookmarked?'bookmarked':''}" onclick="toggleBookmark(event,'${esc(owner)}','${esc(postId)}',this)"><svg viewBox="0 0 24 24" fill="${bookmarked?'currentColor':'none'}" stroke="currentColor" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg></button>
          <button class="post-action share" onclick="sharePost(event,'${esc(postId)}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg></button>
        </div>
      </div>
      <div class="thread-replies-head">返信</div>
      <div id="threadReplies"><div class="spinner"><div class="spin"></div></div></div>`;
    loadReplies(owner,postId);
  }catch(e){el.innerHTML=`<div class="feed-empty">エラー: ${esc(e.message)}</div>`;}
}

async function loadReplies(owner,postId){
  const el=document.getElementById('threadReplies');if(!el)return;
  try{
    const usersSnap=await db.ref('users').once('value');
    const users=Object.keys(usersSnap.val()||{});
    const replyArrays=await Promise.allSettled(users.map(u=>
      db.ref('posts/'+u).orderByChild('ts').once('value').then(s=>{
        const d=s.val()||{};
        return Object.entries(d).filter(([,p])=>p.replyTo&&p.replyTo.postId===postId&&p.replyTo.owner===owner).map(([id,p])=>({id,owner:u,username:p.username||u,displayName:p.displayName||p.username||u,...p}));
      })
    ));
    const replies=replyArrays.filter(r=>r.status==='fulfilled').flatMap(r=>r.value).sort((a,b)=>a.ts-b.ts);
    if(!replies.length){el.innerHTML='<div class="feed-empty" style="padding:30px">まだ返信がありません</div>';return;}
    await renderPosts(el,replies,true);
  }catch(e){el.innerHTML=`<div class="feed-empty">エラー: ${esc(e.message)}</div>`;}
}

async function deletePost(owner,postId){
  if(!session||session.username!==owner){showToast('権限がありません');return;}
  if(!confirm('この投稿を削除しますか？'))return;
  try{
    await db.ref(`posts/${owner}/${postId}`).remove();
    showToast('削除しました');
    if(currentView==='home')loadFeed();
    else if(currentView==='profile')loadProfilePosts(viewedProfile);
    else if(currentView==='thread')goBack();
  }catch(e){showToast('エラー: '+e.message);}
}

function sharePost(e,postId){
  if(e)e.stopPropagation();
  const url=location.href.split('?')[0]+'?post='+postId;
  if(navigator.share)navigator.share({title:'HGSNS',url});
  else{navigator.clipboard?.writeText(url);showToast('URLをコピーしました');}
}

// ════════════════════════════════════════
//  LIGHTBOX
// ════════════════════════════════════════
function openLightbox(src){const lb=document.getElementById('imgLightbox');const img=document.getElementById('lightboxImg');if(!lb||!img)return;img.src=src;lb.classList.add('open');document.body.style.overflow='hidden';}
function closeLightbox(){const lb=document.getElementById('imgLightbox');if(lb){lb.classList.remove('open');document.body.style.overflow='';}}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLightbox();});

// ════════════════════════════════════════
//  FOLLOW
// ════════════════════════════════════════
async function toggleFollow(targetUsername){
  if(!session){showToast('ログインが必要です');return;}
  if(targetUsername===session.username){showToast('自分はフォローできません');return;}
  const ref=db.ref(`follows/${session.username}/${targetUsername}`);
  const snap=await ref.once('value');const following=snap.val()===true;
  if(following){await ref.remove();}
  else{await ref.set(true);await pushNotification(targetUsername,'follow',{from:session.username,fromDisplay:session.displayName||session.username});}
  showToast(following?`@${targetUsername} のフォローを解除しました`:`@${targetUsername} をフォローしました`);
  return !following;
}

// ════════════════════════════════════════
//  PROFILE VIEW
// ════════════════════════════════════════
async function openProfile(username){
  viewHistory.push(currentView);viewedProfile=username;setView('profile');
  const el=document.getElementById('profileView');
  el.innerHTML=skeletonHtml(3);
  try{
    const[snap,av,flags,followsSnap,followersSnap,postsSnap]=await Promise.all([
      db.ref('users/'+username).once('value'),
      getAvatarDataUrl(username),
      getUserFlags(username),
      db.ref('follows/'+username).once('value'),
      db.ref('follows').once('value'),
      db.ref('posts/'+username).once('value')
    ]);
    const u=snap.val()||{username};
    const badgeHtml=buildBadgeHtml(flags,'lg');
    const followCount=followsSnap.val()?Object.values(followsSnap.val()).filter(v=>v===true).length:0;
    let followerCount=0;const allFollows=followersSnap.val()||{};
    for(const uid in allFollows){if(allFollows[uid][username]===true)followerCount++;}
    const postCount=postsSnap.numChildren();
    const isMe=session&&session.username===username;
    const isFollowing=session?(await db.ref(`follows/${session.username}/${username}`).once('value')).val()===true:false;
    const bannerStyle=u.banner?`background:url('${esc(u.banner)}') center/cover no-repeat`:`background:linear-gradient(135deg,#0D1B2A,#1E2C3E,#C9A84C22)`;
    const actionBtn=isMe
      ?`<button class="profile-edit-btn" onclick="openEditProfile()">プロフィールを編集</button>`
      :`<button class="profile-follow-btn ${isFollowing?'following':''}" id="profileFollowBtn" onclick="onProfileFollow('${esc(username)}')">${isFollowing?'フォロー中':'フォロー'}</button>`;
    const cvId='profileAvatarCv_'+Date.now();
    const joinedDate=u.created?new Date(u.created).toLocaleDateString('ja-JP',{year:'numeric',month:'long'}):'';
    el.innerHTML=`
      <div class="profile-header">
        <div class="profile-banner-wrap" ${isMe?`onclick="triggerBannerUpload()"`:''}  style="${bannerStyle};height:190px;display:block;position:relative;">
          ${isMe?`<div class="profile-banner-edit-overlay"><span>バナーを変更</span></div>`:''}
        </div>
        <div class="profile-info">
          <div class="profile-avatar-wrap">
            <div class="profile-avatar-edit-wrap" ${isMe?`onclick="triggerAvatarUpload()"`:''}  style="${!isMe?'cursor:default;':''} ">
              <canvas id="${cvId}" class="profile-avatar" width="84" height="84"></canvas>
              ${isMe?`<div class="profile-avatar-edit-overlay"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg></div>`:''}
            </div>
            ${actionBtn}
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:2px;">
            <div class="profile-dispname" style="margin-bottom:0">${esc(u.displayName||username)}</div>${badgeHtml}
          </div>
          <div class="profile-username">@${esc(username)}</div>
          ${u.bio?`<div class="profile-bio">${esc(u.bio)}</div>`:''}
          ${joinedDate?`<div class="profile-joined"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${joinedDate} 参加</div>`:''}
          <div class="profile-stats">
            <div class="profile-stat"><a onclick="openFollowList('${esc(username)}','follows')" style="cursor:pointer"><strong>${followCount}</strong> <span>フォロー中</span></a></div>
            <div class="profile-stat"><a onclick="openFollowList('${esc(username)}','followers')" style="cursor:pointer"><strong>${followerCount}</strong> <span>フォロワー</span></a></div>
            <div class="profile-stat"><span><strong>${postCount}</strong> <span>投稿</span></span></div>
          </div>
        </div>
      </div>
      <div id="profilePosts"></div>`;
    drawAvatarCanvas(document.getElementById(cvId),username,av,84);
    await loadProfilePosts(username);
  }catch(e){el.innerHTML=`<div class="feed-empty">エラー: ${esc(e.message)}</div>`;}
}
async function onProfileFollow(username){
  const following=await toggleFollow(username);
  const btn=document.getElementById('profileFollowBtn');
  if(btn){btn.textContent=following?'フォロー中':'フォロー';btn.className='profile-follow-btn '+(following?'following':'');}
}
async function loadProfilePosts(username){
  const el=document.getElementById('profilePosts');if(!el)return;
  el.innerHTML=skeletonHtml(3);
  try{
    // ピン留め投稿を先頭に
    const[pinnedSnap,postsSnap]=await Promise.all([
      db.ref(`users/${username}/pinnedPost`).once('value'),
      db.ref('posts/'+username).orderByChild('ts').limitToLast(40).once('value')
    ]);
    const pinnedId=pinnedSnap.val();
    const data=postsSnap.val()||{};
    let posts=Object.entries(data).map(([id,p])=>({id,owner:username,username:p.username||username,displayName:p.displayName||p.username||username,...p})).sort((a,b)=>b.ts-a.ts);
    if(pinnedId){
      const pinnedIdx=posts.findIndex(p=>p.id===pinnedId);
      if(pinnedIdx>0){const[pinned]=posts.splice(pinnedIdx,1);pinned._pinned=true;posts.unshift(pinned);}
      else if(pinnedIdx===0){posts[0]._pinned=true;}
    }
    if(!posts.length){el.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">🐦</span>まだ投稿がありません</div>';return;}
    await renderPosts(el,posts);
  }catch(e){el.innerHTML=`<div class="feed-empty">エラー: ${esc(e.message)}</div>`;}
}

// ── Edit Profile ──
async function openEditProfile(){
  if(!session)return;
  const snap=await db.ref('users/'+session.username).once('value');const u=snap.val()||{};
  document.getElementById('editDispName').value=u.displayName||session.username;
  document.getElementById('editBio').value=u.bio||'';
  document.getElementById('editProfileErr').classList.remove('show');
  document.getElementById('editProfileOverlay').classList.add('open');
}
function closeEditProfile(){document.getElementById('editProfileOverlay').classList.remove('open');}
async function submitEditProfile(){
  if(!session)return;
  const displayName=document.getElementById('editDispName').value.trim();
  const bio=document.getElementById('editBio').value.trim();
  const btn=document.getElementById('editProfileSubmitBtn');btn.disabled=true;
  try{
    await db.ref('users/'+session.username).update({displayName:displayName||session.username,bio});
    session.displayName=displayName||session.username;
    const str=JSON.stringify(session);setCookie('hg_session',str,30);setCookie('hgs_sess',str,30);
    try{localStorage.setItem('hg_session_ls',str);localStorage.setItem('hgs_sess',str);}catch(e){}
    delete _userFlagsCache[session.username];
    updateSidebarUI();closeEditProfile();showToast('プロフィールを更新しました ✓');openProfile(session.username);
  }catch(e){document.getElementById('editProfileErr').textContent='エラー: '+e.message;document.getElementById('editProfileErr').classList.add('show');}
  finally{btn.disabled=false;}
}

// ── Follow List Modal ──
async function openFollowList(username,type){
  document.getElementById('followListTitle').textContent=type==='follows'?'フォロー中':'フォロワー';
  document.getElementById('followListBody').innerHTML='<div class="spinner"><div class="spin"></div></div>';
  document.getElementById('followListOverlay').classList.add('open');
  try{
    let users=[];
    if(type==='follows'){const snap=await db.ref('follows/'+username).once('value');const d=snap.val()||{};users=Object.keys(d).filter(k=>d[k]===true);}
    else{const snap=await db.ref('follows').once('value');const d=snap.val()||{};for(const uid in d)if(d[uid][username]===true)users.push(uid);}
    if(!users.length){document.getElementById('followListBody').innerHTML='<div class="feed-empty">まだいません</div>';return;}
    const body=document.getElementById('followListBody');body.innerHTML='';
    const userDataList=await Promise.allSettled(users.map(async u=>{
      const[uSnap,av,flags]=await Promise.all([db.ref('users/'+u).once('value'),getAvatarDataUrl(u),getUserFlags(u)]);
      return{u,ud:uSnap.val()||{username:u},av,flags};
    }));
    userDataList.filter(r=>r.status==='fulfilled').forEach(({value:{u,ud,av,flags}})=>{
      const cvId='flav_'+u;const badgeHtml=buildBadgeHtml(flags,'sm');
      const item=document.createElement('div');item.className='follow-user-item';
      item.innerHTML=`<canvas id="${cvId}" class="suggest-avatar" width="40" height="40"></canvas><div class="suggest-info"><div class="suggest-name" style="display:flex;align-items:center;gap:4px;">${esc(ud.displayName||u)}${badgeHtml}</div><div class="suggest-uname">@${esc(u)}</div></div>`;
      item.onclick=()=>{closeFollowList();openProfile(u);};
      body.appendChild(item);drawAvatarCanvas(document.getElementById(cvId),u,av,40);
    });
  }catch(e){document.getElementById('followListBody').innerHTML=`<div class="feed-empty">エラー: ${esc(e.message)}</div>`;}
}
function closeFollowList(){document.getElementById('followListOverlay').classList.remove('open');}

// ════════════════════════════════════════
//  HASHTAG VIEW
// ════════════════════════════════════════
async function openHashtag(tag){
  viewHistory.push(currentView);setView('hashtag');
  const el=document.getElementById('hashtagView');
  el.innerHTML=skeletonHtml(4);const normalTag=tag.toLowerCase();
  try{
    const usersSnap=await db.ref('users').once('value');const users=Object.keys(usersSnap.val()||{});
    const postArrays=await Promise.allSettled(users.map(u=>
      db.ref('posts/'+u).orderByChild('ts').limitToLast(50).once('value').then(s=>{
        const d=s.val()||{};
        return Object.entries(d).filter(([,p])=>p.text&&extractHashtags(p.text).includes(normalTag)).map(([id,p])=>({id,owner:u,username:p.username||u,...p}));
      })
    ));
    const posts=postArrays.filter(r=>r.status==='fulfilled').flatMap(r=>r.value).sort((a,b)=>b.ts-a.ts);
    el.innerHTML=`<div class="hashtag-header"><div class="hashtag-title">${esc(tag)}</div><div class="hashtag-count">${posts.length} 件の投稿</div></div><div id="hashtagPosts"></div>`;
    if(!posts.length){document.getElementById('hashtagPosts').innerHTML='<div class="feed-empty">この ハッシュタグの投稿はまだありません</div>';return;}
    await renderPosts(document.getElementById('hashtagPosts'),posts);
  }catch(e){el.innerHTML=`<div class="feed-empty">エラー: ${esc(e.message)}</div>`;}
}

// ════════════════════════════════════════
//  TRENDS
// ════════════════════════════════════════
async function loadTrends(){
  try{
    const snap=await db.ref('hashtags').once('value');const data=snap.val()||{};const now=Date.now();
    return Object.entries(data).map(([key,v])=>{
      const age=Math.max(1,(now-v.lastUsed)/(3600000));const score=v.count/Math.sqrt(age);
      return{tag:v.tag||('#'+key),count:v.count||0,score,lastUsed:v.lastUsed};
    }).sort((a,b)=>b.score-a.score).slice(0,10);
  }catch(e){return[];}
}
async function loadRightTrends(){
  const el=document.getElementById('rightTrends');if(!el)return;
  const trends=await loadTrends();
  if(!trends.length){el.innerHTML='<div style="padding:12px 16px;font-size:.84rem;color:var(--white3)">まだトレンドがありません</div>';return;}
  el.innerHTML='';
  trends.slice(0,5).forEach((t,i)=>{
    const item=document.createElement('div');item.className='trend-item';
    item.innerHTML=`<span class="trend-rank">${i+1}</span><div class="trend-info"><div class="trend-tag">${esc(t.tag)}</div><div class="trend-count">${formatCount(t.count)} 件</div></div>`;
    item.onclick=()=>openHashtag(t.tag);el.appendChild(item);
  });
}
async function loadTrendView(){
  const el=document.getElementById('trendView');if(!el)return;
  el.innerHTML=skeletonHtml(5);const trends=await loadTrends();
  if(!trends.length){el.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">📈</span>まだトレンドがありません</div>';return;}
  el.innerHTML='<div style="padding:14px 16px;font-weight:700;font-size:1rem;border-bottom:1px solid var(--line)">🔥 トレンド</div>';
  trends.forEach((t,i)=>{
    const item=document.createElement('div');item.className='trend-item';item.style.padding='14px 16px';
    item.innerHTML=`<span class="trend-rank">${i+1}</span><div class="trend-info"><div class="trend-tag" style="font-size:1rem">${esc(t.tag)}</div><div class="trend-count">${formatCount(t.count)} 件の投稿</div></div><span class="trend-badge">トレンド</span>`;
    item.onclick=()=>openHashtag(t.tag);el.appendChild(item);
  });
}

// ════════════════════════════════════════
//  SEARCH
// ════════════════════════════════════════
let _searchDebounce=null;
async function doSearch(){
  const q=(document.getElementById('searchInput')?.value||'').trim().toLowerCase();
  setView('search');
  const clearBtn=document.getElementById('searchClearBtn');if(clearBtn)clearBtn.style.display=q?'flex':'none';
  const tabsEl=document.getElementById('searchTabs');const el=document.getElementById('searchView');
  if(!q){if(tabsEl)tabsEl.style.display='none';el.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">🔍</span>キーワードを入力してください</div>';return;}
  if(q.startsWith('#')){openHashtag(q);return;}
  if(tabsEl)tabsEl.style.display='flex';
  el.innerHTML=skeletonHtml(4);
  try{
    const[usersSnap,tagsSnap]=await Promise.all([db.ref('users').once('value'),db.ref('hashtags').once('value')]);
    const usersData=usersSnap.val()||{};
    _searchResults.users=Object.entries(usersData).filter(([k,v])=>k.toLowerCase().includes(q)||(v.displayName||'').toLowerCase().includes(q));
    const allUsers=Object.keys(usersData);
    const postArrays=await Promise.allSettled(allUsers.map(u=>
      db.ref('posts/'+u).orderByChild('ts').limitToLast(30).once('value').then(s=>{
        const d=s.val()||{};
        return Object.entries(d).filter(([,p])=>p.text&&p.text.toLowerCase().includes(q)).map(([id,p])=>({id,owner:u,username:p.username||u,...p}));
      })
    ));
    _searchResults.posts=postArrays.filter(r=>r.status==='fulfilled').flatMap(r=>r.value).sort((a,b)=>b.ts-a.ts).slice(0,30);
    const tagsData=tagsSnap.val()||{};
    _searchResults.tags=Object.entries(tagsData).filter(([k,v])=>(v.tag||k).toLowerCase().includes(q.replace('#',''))).sort((a,b)=>(b[1].count||0)-(a[1].count||0)).slice(0,15);
    renderSearchTab(_searchTab);
  }catch(e){el.innerHTML=`<div class="feed-empty">エラー: ${esc(e.message)}</div>`;}
}
function switchSearchTab(tab){
  _searchTab=tab;
  ['users','posts','tags'].forEach(t=>document.getElementById('sTab'+t.charAt(0).toUpperCase()+t.slice(1))?.classList.toggle('active',t===tab));
  renderSearchTab(tab);
}
async function renderSearchTab(tab){
  const el=document.getElementById('searchView');if(!el)return;el.innerHTML='';
  if(tab==='users'){
    const matched=_searchResults.users;
    if(!matched.length){el.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">👤</span>ユーザーが見つかりません</div>';return;}
    const userDataList=await Promise.allSettled(matched.map(async([uname,u])=>{
      const[av,flags]=await Promise.all([getAvatarDataUrl(uname),getUserFlags(uname)]);return{uname,u,av,flags};
    }));
    userDataList.filter(r=>r.status==='fulfilled').forEach(({value:{uname,u,av,flags}})=>{
      const cvId='srav_'+uname;const badgeHtml=buildBadgeHtml(flags,'sm');
      const item=document.createElement('div');item.className='follow-user-item';
      item.innerHTML=`<canvas id="${cvId}" class="suggest-avatar" width="40" height="40"></canvas><div class="suggest-info"><div class="suggest-name" style="display:flex;align-items:center;gap:4px;">${esc(u.displayName||uname)}${badgeHtml}</div><div class="suggest-uname">@${esc(uname)}</div>${u.bio?`<div class="suggest-bio">${esc(u.bio.slice(0,60))}</div>`:''}</div>`;
      item.onclick=()=>openProfile(uname);el.appendChild(item);drawAvatarCanvas(document.getElementById(cvId),uname,av,40);
    });
  }else if(tab==='posts'){
    const posts=_searchResults.posts;
    if(!posts.length){el.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">📄</span>投稿が見つかりません</div>';return;}
    await renderPosts(el,posts);
  }else if(tab==='tags'){
    const tags=_searchResults.tags;
    if(!tags.length){el.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">#</span>タグが見つかりません</div>';return;}
    tags.forEach(([key,v])=>{
      const item=document.createElement('div');item.className='trend-item';item.style.padding='14px 16px';
      item.innerHTML=`<div class="trend-info"><div class="trend-tag">${esc(v.tag||'#'+key)}</div><div class="trend-count">${formatCount(v.count||0)} 件の投稿</div></div>`;
      item.onclick=()=>openHashtag(v.tag||'#'+key);el.appendChild(item);
    });
  }
}
function clearSearch(){
  const inp=document.getElementById('searchInput');if(inp)inp.value='';
  const clearBtn=document.getElementById('searchClearBtn');if(clearBtn)clearBtn.style.display='none';
  const tabsEl=document.getElementById('searchTabs');if(tabsEl)tabsEl.style.display='none';
  document.getElementById('searchView').innerHTML='<div class="feed-empty"><span class="feed-empty-icon">🔍</span>キーワードを入力してください</div>';
  inp?.focus();
}
function onSearchInput(e){
  const clearBtn=document.getElementById('searchClearBtn');if(clearBtn)clearBtn.style.display=e.target.value?'flex':'none';
  if(e.key==='Enter')doSearch();
  else{clearTimeout(_searchDebounce);_searchDebounce=setTimeout(()=>{if(e.target.value.trim().length>=2)doSearch();},400);}
}
function onRightSearchInput(inp){}
function copySearchAndGo(val){const el=document.getElementById('searchInput');if(el)el.value=val;doSearch();}

// ════════════════════════════════════════
//  おすすめユーザー
// ════════════════════════════════════════
async function loadSuggestUsers(){
  const el=document.getElementById('suggestUsers');if(!el)return;
  try{
    const[usersSnap,followsAllSnap]=await Promise.all([db.ref('users').once('value'),db.ref('follows').once('value')]);
    const usersData=usersSnap.val()||{};const allUsers=Object.keys(usersData).filter(u=>u!==(session?.username));
    if(!allUsers.length){el.innerHTML='<div style="padding:12px 16px;font-size:.84rem;color:var(--white3)">他のユーザーがいません</div>';return;}
    const followsAll=followsAllSnap.val()||{};
    let myFollows={},myFollowers={};
    if(session){myFollows=followsAll[session.username]||{};for(const uid in followsAll){if(followsAll[uid][session.username]===true)myFollowers[uid]=true;}}
    const scored=await Promise.allSettled(allUsers.map(async u=>{
      const uData=usersData[u]||{};let followerCount=0;
      for(const uid in followsAll){if(followsAll[uid][u]===true)followerCount++;}
      let postCount=0,lastActive=0;
      try{const ps=await db.ref('posts/'+u).orderByChild('ts').limitToLast(5).once('value');postCount=ps.numChildren();Object.values(ps.val()||{}).forEach(p=>{if(p.ts>lastActive)lastActive=p.ts;});}catch(e){}
      const alreadyFollowing=myFollows[u]===true;const mutualPending=myFollowers[u]&&!alreadyFollowing;
      const daysSinceActive=lastActive?Math.max(0.1,(Date.now()-lastActive)/(86400000)):30;
      const score=followerCount*2+postCount*.5+(mutualPending?20:0)+(1/daysSinceActive)*5;
      return{u,uData,followerCount,postCount,alreadyFollowing,mutualPending,score};
    }));
    const validScored=scored.filter(r=>r.status==='fulfilled').map(r=>r.value);
    const notFollowing=validScored.filter(s=>!s.alreadyFollowing).sort((a,b)=>b.score-a.score);
    const following=validScored.filter(s=>s.alreadyFollowing).sort((a,b)=>b.score-a.score);
    const ordered=[...notFollowing.slice(0,4),...following.slice(0,1)].slice(0,4);
    const displayData=await Promise.allSettled(ordered.map(async item=>{
      const[av,flags]=await Promise.all([getAvatarDataUrl(item.u),getUserFlags(item.u)]);return{...item,av,flags};
    }));
    el.innerHTML='';
    displayData.filter(r=>r.status==='fulfilled').forEach(({value:{u,uData,followerCount,mutualPending,alreadyFollowing,av,flags}})=>{
      const cvId='sgav_'+u;const badgeHtml=buildBadgeHtml(flags,'sm');
      const item=document.createElement('div');item.className='suggest-user';
      item.innerHTML=`<canvas id="${cvId}" class="suggest-avatar" width="40" height="40"></canvas>
        <div class="suggest-info" onclick="openProfile('${esc(u)}')">
          <div class="suggest-name" style="display:flex;align-items:center;gap:4px;">${esc(uData.displayName||u)}${badgeHtml}</div>
          <div class="suggest-uname">@${esc(u)}</div>
          ${mutualPending?`<div class="suggest-mutual"><span>フォローされています</span></div>`:followerCount>0?`<div class="suggest-mutual">${formatCount(followerCount)} フォロワー</div>`:''}
        </div>
        <button class="follow-btn ${alreadyFollowing?'following':''}" id="sfbtn_${u}" onclick="onSuggestFollow('${esc(u)}')">${alreadyFollowing?'フォロー中':'フォロー'}</button>`;
      el.appendChild(item);drawAvatarCanvas(document.getElementById(cvId),u,av,40);
    });
  }catch(e){el.innerHTML=`<div style="padding:12px 16px;font-size:.83rem;color:var(--white3)">読み込みエラー</div>`;}
}
async function onSuggestFollow(username){
  const following=await toggleFollow(username);
  const btn=document.getElementById('sfbtn_'+username);
  if(btn){btn.textContent=following?'フォロー中':'フォロー';btn.className='follow-btn '+(following?'following':'');}
  setTimeout(loadSuggestUsers,500);
}

// ════════════════════════════════════════
//  管理者ダッシュボード
// ════════════════════════════════════════
async function loadAdminDashboard(){
  const el=document.getElementById('adminView');if(!el)return;
  if(!session){el.innerHTML='<div class="feed-empty">ログインが必要です</div>';return;}
  const flags=await getUserFlags(session.username);
  if(!flags.isadmin){el.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">🔒</span>管理者のみアクセスできます</div>';return;}
  el.innerHTML='<div class="spinner"><div class="spin"></div>読み込み中...</div>';
  try{
    const[usersSnap,postsSnap,notifSnap]=await Promise.all([
      db.ref('users').once('value'),
      db.ref('posts').once('value'),
      db.ref('notifications').once('value')
    ]);
    const users=usersSnap.val()||{};const postsData=postsSnap.val()||{};
    const userCount=Object.keys(users).length;
    let postCount=0;Object.values(postsData).forEach(u=>{postCount+=Object.keys(u).length;});
    const now=Date.now();const dayAgo=now-86400000;
    let activeToday=0;
    Object.values(postsData).forEach(u=>Object.values(u).forEach(p=>{if(p.ts>dayAgo)activeToday++;}));

    el.innerHTML=`
      <div style="padding:14px 16px;font-weight:700;font-size:1rem;border-bottom:1px solid var(--line)">🛡 管理ダッシュボード</div>
      <div class="admin-stat-grid">
        <div class="admin-stat-card"><div class="admin-stat-num">${userCount}</div><div class="admin-stat-label">ユーザー</div></div>
        <div class="admin-stat-card"><div class="admin-stat-num">${postCount}</div><div class="admin-stat-label">投稿数</div></div>
        <div class="admin-stat-card"><div class="admin-stat-num">${activeToday}</div><div class="admin-stat-label">今日の投稿</div></div>
      </div>
      <div class="admin-section-head">ユーザー管理</div>
      <div id="adminUserList"></div>`;

    const userList=document.getElementById('adminUserList');
    const userArr=Object.entries(users).sort((a,b)=>(b[1].created||0)-(a[1].created||0));
    for(const[uname,u]of userArr){
      const row=document.createElement('div');row.className='admin-user-row';
      const isAdmin=!!u.isadmin,isDev=!!u.isdev,isOfficial=!!u.isofficial;
      const postCnt=postsData[uname]?Object.keys(postsData[uname]).length:0;
      row.innerHTML=`
        <div class="admin-user-info">
          <div class="admin-user-name">${esc(u.displayName||uname)}</div>
          <div class="admin-user-uname">@${esc(uname)} · ${postCnt}投稿</div>
        </div>
        <div class="admin-badge-btns">
          <button class="admin-badge-btn ${isAdmin?'active-badge':''}" onclick="adminToggleBadge('${esc(uname)}','isadmin',this)" title="管理者">🛡</button>
          <button class="admin-badge-btn ${isOfficial?'active-badge':''}" onclick="adminToggleBadge('${esc(uname)}','isofficial',this)" title="公式">✓</button>
          <button class="admin-badge-btn ${isDev?'active-badge':''}" onclick="adminToggleBadge('${esc(uname)}','isdev',this)" title="開発者">&lt;/&gt;</button>
        </div>
        <button class="admin-delete-btn" onclick="adminDeleteUser('${esc(uname)}')">削除</button>`;
      userList.appendChild(row);
    }
  }catch(e){el.innerHTML=`<div class="feed-empty">エラー: ${esc(e.message)}</div>`;}
}

async function adminToggleBadge(username,flag,btn){
  try{
    const snap=await db.ref(`users/${username}/${flag}`).once('value');
    const current=!!snap.val();
    await db.ref(`users/${username}/${flag}`).set(!current);
    btn.classList.toggle('active-badge',!current);
    delete _userFlagsCache[username];
    showToast(`${username} の${flag}を${!current?'付与':'剥奪'}しました`);
  }catch(e){showToast('エラー: '+e.message);}
}

async function adminDeleteUser(username){
  if(username===session?.username){showToast('自分自身は削除できません');return;}
  if(!confirm(`@${username} を削除しますか？\nこの操作は取り消せません。`))return;
  try{
    await Promise.all([
      db.ref(`users/${username}`).remove(),
      db.ref(`posts/${username}`).remove(),
      db.ref(`follows/${username}`).remove(),
      db.ref(`notifications/${username}`).remove(),
    ]);
    showToast(`@${username} を削除しました`);loadAdminDashboard();
  }catch(e){showToast('エラー: '+e.message);}
}

// ════════════════════════════════════════
//  VIEW MANAGEMENT
// ════════════════════════════════════════
function setView(view){
  currentView=view;
  document.querySelectorAll('.sidebar-nav-item[data-view]').forEach(el=>{
    const active=el.dataset.view===view;el.classList.toggle('active',active);
    el.querySelectorAll('.nav-icon-outline').forEach(s=>s.style.display=active?'none':'');
    el.querySelectorAll('.nav-icon-fill').forEach(s=>s.style.display=active?'':'none');
  });
  const panels={home:'homeView',profile:'profileViewWrap',search:'searchViewWrap',trend:'trendViewWrap',hashtag:'hashtagViewWrap',thread:'threadViewWrap',notifications:'notificationsViewWrap',bookmarks:'bookmarksViewWrap',dm:'dmViewWrap',admin:'adminViewWrap',scheduled:'scheduledViewWrap'};
  Object.entries(panels).forEach(([v,id])=>{const el=document.getElementById(id);if(el)el.style.display=v===view?'block':'none';});
  const homeTabs=document.getElementById('homeFeedTabs');const titleBar=document.getElementById('feedTitleBar');const titleText=document.getElementById('feedTitleText');
  const titles={profile:'プロフィール',search:'検索',trend:'トレンド',hashtag:'ハッシュタグ',thread:'投稿',notifications:'通知',bookmarks:'ブックマーク',dm:'メッセージ',admin:'管理',scheduled:'予約投稿'};
  if(view==='home'){if(homeTabs)homeTabs.style.display='flex';if(titleBar)titleBar.style.display='none';}
  else{if(homeTabs)homeTabs.style.display='none';if(titleBar)titleBar.style.display='flex';if(titleText)titleText.textContent=titles[view]||'HGSNS';}
  document.querySelector('.sns-feed')?.scrollTo(0,0);
  if(view==='trend')loadTrendView();
  if(view==='bookmarks')loadBookmarksView();
  if(view==='dm')loadDmView();
  if(view==='scheduled')loadScheduledView();
}

function goBack(){
  if(_dmListener&&currentView==='dm')disconnectDmListener();
  const prev=viewHistory.pop();
  if(prev&&prev!==currentView){
    if(prev==='home'){setView('home');loadFeed();}
    else if(prev==='profile'&&viewedProfile){openProfile(viewedProfile);}
    else{setView(prev);}
  }else{setView('home');loadFeed();}
}

// ════════════════════════════════════════
//  BOOT
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded',()=>{
  initFirebase();
  loadSession();
  loadFeed();
  loadSuggestUsers();
  loadRightTrends();
  setView('home');
  updateComposerCount();
  if(session){loadNotifBadge();publishScheduledPosts();}
  setInterval(()=>{if(session){loadNotifBadge();publishScheduledPosts();}},60000);
});
