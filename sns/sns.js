// ── HGSNS JS v4 ── badges / filtered rec feed / follow feed fix / X-like scoring
// ── Promise.all 並列化最適化済み ──

const FIREBASE_CONFIG_BIN = "01111011 00100010 01100001 01110000 01101001 01001011 01100101 01111001 00100010 00111010 00100010 01000001 01001001 01111010 01100001 01010011 01111001 01000011 01100110 00111000 01010000 01001010 01011001 01111000 01000011 01001010 01000011 01000110 01000011 01000100 00110001 01110000 01101000 01000100 01011111 00101101 01011000 01010110 01010101 01011010 00111001 00110010 01000100 01010011 01010110 01110101 01010010 01100001 01110101 01010101 00100010 00101100 00100010 01100001 01110101 01110100 01101000 01000100 01101111 01101101 01100001 01101001 01101110 00100010 00111010 00100010 01101000 01100111 01110011 01110100 01110101 01100100 01111001 00101101 00110001 00111000 01100101 00110010 00110011 00101110 01100110 01101001 01110010 01100101 01100010 01100001 01110011 01100101 01100001 01110000 01110000 00101110 01100011 01101111 01101101 00100010 00101100 00100010 01100100 01100001 01110100 01100001 01100010 01100001 01110011 01100101 01010101 01010010 01001100 00100010 00111010 00100010 01101000 01110100 01110100 01110000 01110011 00111010 00101111 00101111 01101000 01100111 01110011 01110100 01110101 01100100 01111001 00101101 00110001 00111000 01100101 00110010 00110011 00101101 01100100 01100101 01100110 01100001 01110101 01101100 01110100 00101101 01110010 01110100 01100100 01100010 00101110 01100001 01110011 01101001 01100001 00101101 01110011 01101111 01110101 01110100 01101000 01100101 01100001 01110011 01110100 00110001 00101110 01100110 01101001 01110010 01100101 01100010 01100001 01110011 01100101 01100100 01100001 01110100 01100001 01100010 01100001 01110011 01100101 00101110 01100001 01110000 01110000 00100010 00101100 00100010 01110000 01110010 01101111 01101010 01100101 01100011 01110100 01001001 01100100 00100010 00111010 00100010 01101000 01100111 01110011 01110100 01110101 01100100 01111001 00101101 00110001 00111000 01100101 00110010 00110011 00100010 00101100 00100010 01110011 01110100 01101111 01110010 01100001 01100111 01100101 01000010 01110101 01100011 01101011 01100101 01110100 00100010 00111010 00100010 01101000 01100111 01110011 01110100 01110101 01100100 01111001 00101101 00110001 00111000 01100101 00110010 00110011 00101110 01100110 01101001 01110010 01100101 01100010 01100001 01110011 01100101 01110011 01110100 01101111 01110010 01100001 01100111 01100101 00101110 01100001 01110000 01110000 00100010 00101100 00100010 01101101 01100101 01110011 01110011 01100001 01100111 01101001 01101110 01100111 01010011 01100101 01101110 01100100 01100101 01110010 01001001 01100100 00100010 00111010 00100010 00110111 00110010 00110000 00110001 00110101 00110000 00110111 00110001 00110010 00110111 00110111 00110101 00100010 00101100 00100010 01100001 01110000 01110000 01001001 01100100 00100010 00111010 00100010 00110001 00111010 00110111 00110010 00110000 00110001 00110101 00110000 00110111 00110001 00110010 00110111 00110111 00110101 00111010 01110111 01100101 01100010 00111010 00110110 00110011 00110010 01100010 00110010 01100010 01100100 00110110 01100110 00110000 00110100 00110100 00110001 01100001 00111000 00110011 01100100 00110111 00110100 00111001 01100101 00110010 00100010 00101100 00100010 01101101 01100101 01100001 01110011 01110101 01110010 01100101 01101101 01100101 01101110 01110100 01001001 01100100 00100010 00111010 00100010 01000111 00101101 01011001 00110000 00110101 00110110 00110001 00110001 00110110 01010010 01010001 01001101 00100010 01111101";

function bin2str(b){const c=b.replace(/[^01]/g,'');if(!c)return'';return c.match(/.{1,8}/g).filter(x=>x.length===8).map(b=>String.fromCharCode(parseInt(b,2))).join('');}

// ── State ──
let db = null;
let session = null;
let currentView = 'home';
let viewHistory = [];
let viewedProfile = null;
let _postImageBase64 = null;
let _sheetImageBase64 = null;
let _replyImageBase64 = null;
let _replyContext = null;
let _repostContext = null;
let _feedTab = 'rec';
let _searchTab = 'users';
let _searchResults = { users:[], posts:[], tags:[] };
let _unreadNotifCount = 0;

// ── ユーザーフラグキャッシュ（バッジ用）──
const _userFlagsCache = {};

// ── Helpers ──
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
  if(n>=10000)return (n/10000).toFixed(1).replace(/\.0$/,'')+'万';
  if(n>=1000)return (n/1000).toFixed(1).replace(/\.0$/,'')+'K';
  return String(n);
}
function setCookie(name,value,days){try{const exp=days?'; expires='+new Date(Date.now()+days*864e5).toUTCString():'';const secure=location.protocol==='https:'?'; Secure':'';document.cookie=name+'='+encodeURIComponent(value)+exp+'; path=/; SameSite=Lax'+secure;}catch(e){}}
function getCookie(name){try{const m=document.cookie.split('; ').find(r=>r.startsWith(name+'='));return m?decodeURIComponent(m.split('=').slice(1).join('=')):null;}catch(e){return null;}}
function deleteCookie(name){document.cookie=name+'=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';}

function extractHashtags(text){
  const matches=text.match(/#[^\s#！？。、,\.]+/g);
  return matches?[...new Set(matches.map(t=>t.toLowerCase()))]:[];
}
function renderTextWithHashtags(text){
  if(!text)return '';
  return esc(text)
    .replace(/#([^\s#！？。、,\.&]+)/g,'<span class="hashtag" onclick="event.stopPropagation();openHashtag(\'#$1\')">#$1</span>')
    .replace(/@([a-zA-Z0-9_]{2,20})/g,'<span class="mention" onclick="event.stopPropagation();openProfile(\'$1\')">@$1</span>');
}

// ── バッジ ──
async function getUserFlags(username){
  if(_userFlagsCache[username]!==undefined)return _userFlagsCache[username];
  if(!db){_userFlagsCache[username]={};return{};}
  try{
    const snap=await db.ref(`users/${username}`).once('value');
    const u=snap.val()||{};
    const flags={isadmin:!!u.isadmin,isdev:!!u.isdev,isofficial:!!u.isofficial};
    _userFlagsCache[username]=flags;
    return flags;
  }catch(e){_userFlagsCache[username]={};return{};}
}

function buildBadgeHtml(flags, size){
  if(!flags)return'';
  const cls=size==='lg'?'-lg':'';
  let html='';
  if(flags.isadmin){
    html+=`<span class="user-badge badge-admin${cls}" title="管理者">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7l-9-5z"/></svg>
    </span>`;
  }
  if(flags.isofficial){
    html+=`<span class="user-badge badge-official${cls}" title="公式">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
    </span>`;
  }
  if(flags.isdev){
    html+=`<span class="user-badge badge-dev${cls}" title="開発者">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
    </span>`;
  }
  return html;
}

// ── Avatar ──
const AVATAR_COLORS=[['#7B6CF6','#B06EF6'],['#F5835B','#F6C344'],['#52C4A3','#3B82F6'],['#E65B9A','#F5835B'],['#4B8DEA','#52C4A3'],['#A068F5','#F5835B'],['#F6C344','#52C4A3'],['#3B82F6','#E65B9A']];
function avatarColorForName(name){let h=0;for(let i=0;i<name.length;i++)h=(h*31+name.charCodeAt(i))&0xffff;return AVATAR_COLORS[h%AVATAR_COLORS.length];}
function drawAvatarCanvas(canvas,username,imageData,size){
  if(!canvas)return;
  const s=size||canvas.width;canvas.width=s;canvas.height=s;
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,s,s);
  if(imageData){const img=new Image();img.onload=function(){ctx.save();ctx.beginPath();ctx.arc(s/2,s/2,s/2,0,Math.PI*2);ctx.clip();ctx.drawImage(img,0,0,s,s);ctx.restore();};img.src=imageData;}
  else{const colors=avatarColorForName(username||'?');const g=ctx.createLinearGradient(0,0,s,s);g.addColorStop(0,colors[0]);g.addColorStop(1,colors[1]);ctx.fillStyle=g;ctx.beginPath();ctx.arc(s/2,s/2,s/2,0,Math.PI*2);ctx.fill();const initials=(username||'?').slice(0,2).toUpperCase();ctx.fillStyle='rgba(255,255,255,0.92)';ctx.font=`bold ${Math.round(s*0.36)}px "Outfit",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(initials,s/2,s/2);}
}
function avatarImgTag(username,imageData,size){
  if(imageData)return`<img class="post-avatar" src="${esc(imageData)}" alt="${esc(username)}" onclick="openProfile('${esc(username)}')">`;
  const cv=document.createElement('canvas');cv.width=size||44;cv.height=size||44;
  drawAvatarCanvas(cv,username,null,size||44);
  return`<img class="post-avatar" src="${cv.toDataURL()}" alt="${esc(username)}" onclick="openProfile('${esc(username)}')">`;
}
async function getAvatarDataUrl(username){
  let av=null;
  try{av=localStorage.getItem('fm_avatar_'+username);}catch(e){}
  if(!av&&db){try{const snap=await db.ref(`users/${username}/avatar`).once('value');av=snap.val()||null;if(av)try{localStorage.setItem('fm_avatar_'+username,av);}catch(e){}}catch(e){}}
  return av;
}

// ── Toast ──
let _toastTimer=null;
function showToast(msg){const t=document.getElementById('snsToast');if(!t)return;t.textContent=msg;t.classList.add('show');if(_toastTimer)clearTimeout(_toastTimer);_toastTimer=setTimeout(()=>t.classList.remove('show'),2600);}

// ── Firebase init ──
function initFirebase(){
  let cfg=null;try{cfg=JSON.parse(bin2str(FIREBASE_CONFIG_BIN));}catch(e){}
  if(!cfg||!cfg.apiKey){db=null;return false;}
  try{if(!firebase.apps.length)firebase.initializeApp(cfg);db=firebase.database();return true;}
  catch(e){db=null;return false;}
}

// ── Session ──
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
    try{const cached=localStorage.getItem('fm_avatar_'+session.username);if(cached&&!av)session._avatar=cached;}catch(e){}
    const avData=session._avatar||null;
    drawAvatarCanvas(document.getElementById('sidebarAvatarCanvas'),session.username,avData,40);
    drawAvatarCanvas(document.getElementById('composerAvatarCanvas'),session.username,avData,44);
    drawAvatarCanvas(document.getElementById('sheetAvatarCanvas'),session.username,avData,40);
    const navAv=document.getElementById('navAvatarCanvas');
    if(navAv){
      drawAvatarCanvas(navAv,session.username,avData,26);
      navAv.style.display='block';
      const profileWrap=document.getElementById('navProfileIconWrap');
      if(profileWrap){
        profileWrap.querySelectorAll('.nav-icon-outline,.nav-icon-fill').forEach(s=>s.style.display='none');
      }
    }
    document.getElementById('feedComposer').style.display='flex';
  }else{
    if(guest)guest.style.display='flex';
    if(auth)auth.style.display='none';
    document.getElementById('feedComposer').style.display='none';
  }
}
function doLogout(){
  session=null;deleteCookie('hg_session');deleteCookie('hgs_sess');
  try{localStorage.removeItem('hg_session_ls');localStorage.removeItem('hgs_sess');}catch(e){}
  updateSidebarUI();showToast('ログアウトしました');loadFeed();openAuthModal('login');
}

// ── パスワード表示切替 ──
function togglePassVis(inputId,btn){
  const input=document.getElementById(inputId);if(!input)return;
  const isPass=input.type==='password';
  input.type=isPass?'text':'password';
  btn.innerHTML=isPass
    ?`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
    :`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
}

// ── Auth Modal ──
let _authMode='login';
function openAuthModal(mode){_authMode=mode||'login';switchAuthTab(_authMode);document.getElementById('authOverlay').classList.add('open');setTimeout(()=>document.getElementById('authUser')?.focus(),80);}
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
    const bytes=[];for(let i=0;i<str.length;i++){const c=str.charCodeAt(i);if(c<128)bytes.push(c);else if(c<2048)bytes.push(0xc0|(c>>6),0x80|(c&0x3f));else bytes.push(0xe0|(c>>12),0x80|((c>>6)&0x3f),0x80|(c&0x3f));}
    const l=bytes.length*8;bytes.push(0x80);while(bytes.length%64!==56)bytes.push(0);for(let i=7;i>=0;i--)bytes.push((l/(Math.pow(2,i*8)))&0xff);
    const w=new Array(64);
    for(let i=0;i<bytes.length/64;i++){for(let j=0;j<16;j++)w[j]=(bytes[i*64+j*4]<<24)|(bytes[i*64+j*4+1]<<16)|(bytes[i*64+j*4+2]<<8)|bytes[i*64+j*4+3];for(let j=16;j<64;j++){const s0=rr(w[j-15],7)^rr(w[j-15],18)^(w[j-15]>>>3);const s1=rr(w[j-2],17)^rr(w[j-2],19)^(w[j-2]>>>10);w[j]=(w[j-16]+s0+w[j-7]+s1)>>>0;}
    let [a,b,c,d,e,f,g,h]=[...H];for(let j=0;j<64;j++){const S1=rr(e,6)^rr(e,11)^rr(e,25);const ch=(e&f)^(~e&g);const t1=(h+S1+ch+K[j]+w[j])>>>0;const S0=rr(a,2)^rr(a,13)^rr(a,22);const maj=(a&b)^(a&c)^(b&c);const t2=(S0+maj)>>>0;h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}
    H[0]=(H[0]+a)>>>0;H[1]=(H[1]+b)>>>0;H[2]=(H[2]+c)>>>0;H[3]=(H[3]+d)>>>0;H[4]=(H[4]+e)>>>0;H[5]=(H[5]+f)>>>0;H[6]=(H[6]+g)>>>0;H[7]=(H[7]+h)>>>0;}
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
  if(_authMode==='reg'){const c=document.getElementById('authPassConfirm').value;if(pass!==c){showAuthErr('パスワードが一致しません');return;}await doRegister(username,pass);}
  else await doLogin(username,pass);
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
    updateSidebarUI();document.getElementById('authOverlay').classList.remove('open');showToast('アカウントを作成しました！');loadFeed();
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
    if(av)try{localStorage.setItem('fm_avatar_'+username,av);}catch(e){}
    session={uid:username,username,displayName:stored.displayName||username,_avatar:av};
    const str=JSON.stringify(session);
    setCookie('hg_session',str,30);setCookie('hgs_sess',str,30);
    try{localStorage.setItem('hg_session_ls',str);localStorage.setItem('hgs_sess',str);}catch(e){}
    updateSidebarUI();document.getElementById('authOverlay').classList.remove('open');showToast('ログインしました！');loadFeed();loadNotifBadge();
  }catch(e){showAuthErr('エラー: '+e.message);}
  finally{btn.textContent='ログイン';btn.disabled=false;}
}

// ── Image Upload ──
const MAX_IMG_W=1200,MAX_IMG_Q=0.82;
function compressImage(dataUrl,cb){
  const img=new Image();
  img.onload=()=>{
    let w=img.width,h=img.height;
    if(w>MAX_IMG_W){h=Math.round(h*MAX_IMG_W/w);w=MAX_IMG_W;}
    const cv=document.createElement('canvas');cv.width=w;cv.height=h;
    cv.getContext('2d').drawImage(img,0,0,w,h);
    let q=MAX_IMG_Q,result=cv.toDataURL('image/jpeg',q);
    while(result.length>600*1024*4/3&&q>0.3){q-=0.08;result=cv.toDataURL('image/jpeg',q);}
    cb(result);
  };
  img.src=dataUrl;
}
function readFileAsDataUrl(file,cb){const r=new FileReader();r.onload=e=>cb(e.target.result);r.readAsDataURL(file);}
function handlePostImgSelect(e){const f=e.target.files[0];if(!f)return;readFileAsDataUrl(f,raw=>compressImage(raw,d=>{_postImageBase64=d;document.getElementById('composerImgPreviewImg').src=d;document.getElementById('composerImgPreview').classList.add('show');}));}
function clearPostImage(){_postImageBase64=null;document.getElementById('composerImgPreview').classList.remove('show');document.getElementById('composerImgPreviewImg').src='';document.getElementById('postImgInput').value='';}
function handleSheetImgSelect(e){const f=e.target.files[0];if(!f)return;readFileAsDataUrl(f,raw=>compressImage(raw,d=>{_sheetImageBase64=d;document.getElementById('sheetImgPreviewImg').src=d;document.getElementById('sheetImgPreview').classList.add('show');}));}
function clearSheetImage(){_sheetImageBase64=null;document.getElementById('sheetImgPreview').classList.remove('show');document.getElementById('sheetImgPreviewImg').src='';document.getElementById('sheetImgInput').value='';}
function handleReplyImgSelect(e){const f=e.target.files[0];if(!f)return;readFileAsDataUrl(f,raw=>compressImage(raw,d=>{_replyImageBase64=d;document.getElementById('replyImgPreviewImg').src=d;document.getElementById('replyImgPreview').classList.add('show');}));}
function clearReplyImage(){_replyImageBase64=null;document.getElementById('replyImgPreview').classList.remove('show');document.getElementById('replyImgPreviewImg').src='';document.getElementById('replyImgInput').value='';}

// ── 文字数リング ──
function updateCharRing(len,max,ringId,countId){
  const ring=document.getElementById(ringId);
  const countEl=document.getElementById(countId);
  if(!ring)return;
  const r=12;const circ=2*Math.PI*r;
  const ratio=Math.min(len/max,1);
  const offset=circ*(1-ratio);
  ring.setAttribute('stroke-dashoffset',offset);
  const isWarn=len>max*0.85;
  const isOver=len>max;
  ring.className.baseVal='char-ring-fill'+(isOver?' over':isWarn?' warn':'');
  if(countEl){
    if(len>max-20){
      countEl.style.display='';
      countEl.textContent=max-len;
      countEl.className='composer-count'+(isOver?' over':isWarn?' warn':'');
    }else{
      countEl.style.display='none';
    }
  }
  return !isOver&&len>0;
}

// ── Desktop Composer ──
function updateComposerCount(){
  const ta=document.getElementById('composerText');
  const len=ta.value.length;const max=280;
  const valid=updateCharRing(len,max,'composerRingFill','composerCount');
  document.getElementById('composerSubmitBtn').disabled=!valid;
}
function clearReplyContext(){
  _replyContext=null;
  document.getElementById('composerReplyBanner').style.display='none';
}

// ── Mobile Compose Sheet ──
function openMobileCompose(replyCtx){
  if(!session){openAuthModal('login');return;}
  _replyContext=replyCtx||null;
  const sheetTitle=document.getElementById('sheetTitle');
  const sheetReplyBanner=document.getElementById('sheetReplyBanner');
  const sheetReplyName=document.getElementById('sheetReplyName');
  if(replyCtx){
    sheetTitle.textContent='返信';
    sheetReplyBanner.style.display='block';
    sheetReplyName.textContent='@'+(replyCtx.displayName||replyCtx.username);
  }else{
    sheetTitle.textContent='新しいポスト';
    sheetReplyBanner.style.display='none';
  }
  document.getElementById('sheetQuotePreview').style.display='none';
  document.getElementById('sheetTextarea').value='';
  updateSheetCount();clearSheetImage();
  const av=session._avatar||null;
  drawAvatarCanvas(document.getElementById('sheetAvatarCanvas'),session.username,av,40);
  document.getElementById('mobileComposeOverlay').classList.add('open');
  setTimeout(()=>document.getElementById('sheetTextarea').focus(),100);
}
function closeMobileCompose(){document.getElementById('mobileComposeOverlay').classList.remove('open');}
function updateSheetCount(){
  const ta=document.getElementById('sheetTextarea');const len=ta.value.length;const max=280;
  updateCharRing(len,max,'sheetRingFill','__none__');
  document.getElementById('sheetSubmitBtn').disabled=len===0||len>max;
}
async function submitSheetPost(){
  if(!session){showToast('ログインが必要です');return;}
  const text=document.getElementById('sheetTextarea').value.trim();
  if(!text&&!_sheetImageBase64){showToast('テキストまたは画像が必要です');return;}
  if(text.length>280){showToast('280文字以内にしてください');return;}
  const btn=document.getElementById('sheetSubmitBtn');btn.disabled=true;
  try{
    const post={text,username:session.username,displayName:session.displayName||session.username,ts:Date.now(),likes:{},reposts:{},replyCount:0,views:0};
    if(_sheetImageBase64)post.image=_sheetImageBase64;
    if(_replyContext){
      post.replyTo={owner:_replyContext.owner,postId:_replyContext.postId,username:_replyContext.username,displayName:_replyContext.displayName};
      await db.ref(`posts/${_replyContext.owner}/${_replyContext.postId}/replyCount`).transaction(c=>(c||0)+1);
      if(_replyContext.username!==session.username)
        await pushNotification(_replyContext.username,'reply',{from:session.username,fromDisplay:session.displayName||session.username,postOwner:_replyContext.owner,postId:_replyContext.postId,text:text.slice(0,60)});
    }
    await db.ref('posts/'+session.username).push(post);
    await saveHashtags(text);
    closeMobileCompose();showToast('投稿しました ✓');
    if(currentView==='home')loadFeed();
    else if(currentView==='thread'&&_replyContext)openThread(_replyContext.owner,_replyContext.postId);
  }catch(e){showToast('エラー: '+e.message);}
  finally{btn.disabled=false;}
}

// ── Desktop Submit Post ──
async function submitPost(){
  if(!session){showToast('ログインが必要です');return;}
  const text=document.getElementById('composerText').value.trim();
  if(!text&&!_postImageBase64){showToast('テキストまたは画像が必要です');return;}
  if(text.length>280){showToast('280文字以内にしてください');return;}
  const btn=document.getElementById('composerSubmitBtn');btn.disabled=true;
  try{
    const post={text,username:session.username,displayName:session.displayName||session.username,ts:Date.now(),likes:{},reposts:{},replyCount:0,views:0};
    if(_postImageBase64)post.image=_postImageBase64;
    if(_replyContext){
      post.replyTo={owner:_replyContext.owner,postId:_replyContext.postId,username:_replyContext.username,displayName:_replyContext.displayName};
      await db.ref(`posts/${_replyContext.owner}/${_replyContext.postId}/replyCount`).transaction(c=>(c||0)+1);
      if(_replyContext.username!==session.username)
        await pushNotification(_replyContext.username,'reply',{from:session.username,fromDisplay:session.displayName||session.username,postOwner:_replyContext.owner,postId:_replyContext.postId,text:text.slice(0,60)});
    }
    await db.ref('posts/'+session.username).push(post);
    await saveHashtags(text);
    document.getElementById('composerText').value='';clearPostImage();updateComposerCount();clearReplyContext();
    showToast('投稿しました ✓');
    if(currentView==='home')loadFeed();
  }catch(e){showToast('エラー: '+e.message);}
  finally{btn.disabled=false;}
}

// ── Hashtag index ──
async function saveHashtags(text){
  if(!db||!text)return;
  const tags=extractHashtags(text);
  const now=Date.now();
  await Promise.all(tags.map(tag=>{
    const key=tag.replace('#','').replace(/[.#$\[\]\/]/g,'_');
    return db.ref(`hashtags/${key}`).transaction(cur=>{
      if(!cur)return{tag,count:1,lastUsed:now};
      return{...cur,count:(cur.count||0)+1,lastUsed:now};
    });
  }));
}

// ── 閲覧数カウント ──
async function recordView(owner,postId){
  if(!db)return;
  try{await db.ref(`posts/${owner}/${postId}/views`).transaction(c=>(c||0)+1);}catch(e){}
}

// ── ブックマーク ──
async function toggleBookmark(e,owner,postId,btn){
  e.stopPropagation();
  if(!session){showToast('ログインが必要です');return;}
  const ref=db.ref(`bookmarks/${session.username}/${owner}_${postId}`);
  const snap=await ref.once('value');
  const bookmarked=snap.val()!==null;
  if(bookmarked){
    await ref.remove();
    if(btn){btn.classList.remove('bookmarked');btn.title='ブックマーク';}
    showToast('ブックマークを解除しました');
  }else{
    await ref.set({owner,postId,ts:Date.now()});
    if(btn){btn.classList.add('bookmarked');btn.title='ブックマーク済み';}
    showToast('ブックマークしました');
  }
}
async function isBookmarked(owner,postId){
  if(!session||!db)return false;
  try{const snap=await db.ref(`bookmarks/${session.username}/${owner}_${postId}`).once('value');return snap.val()!==null;}
  catch(e){return false;}
}
async function loadBookmarksView(){
  const el=document.getElementById('bookmarksView');if(!el)return;
  if(!session){el.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">🔒</span>ログインが必要です</div>';return;}
  el.innerHTML=`<div class="bookmarks-header">ブックマーク<div class="bookmarks-sub">@${esc(session.username)} のブックマーク</div></div><div class="spinner"><div class="spin"></div>読み込み中...</div>`;
  try{
    const snap=await db.ref(`bookmarks/${session.username}`).orderByChild('ts').once('value');
    const data=snap.val()||{};
    const entries=Object.values(data).sort((a,b)=>b.ts-a.ts);
    const postsEl=document.createElement('div');
    el.innerHTML=`<div class="bookmarks-header">ブックマーク<div class="bookmarks-sub">@${esc(session.username)} のブックマーク</div></div>`;
    if(!entries.length){
      el.innerHTML+='<div class="feed-empty"><span class="feed-empty-icon">🔖</span>まだブックマークがありません</div>';return;
    }
    el.appendChild(postsEl);
    // ── 並列化: ブックマーク投稿の一括取得 ──
    const posts = await Promise.allSettled(
      entries.map(async e => {
        try{
          const s=await db.ref(`posts/${e.owner}/${e.postId}`).once('value');
          const p=s.val();
          if(!p)return null;
          return{id:e.postId,owner:e.owner,...p};
        }catch(err){return null;}
      })
    );
    const valid=posts
      .filter(r=>r.status==='fulfilled'&&r.value!==null)
      .map(r=>r.value);
    if(!valid.length){postsEl.innerHTML='<div class="feed-empty">投稿が見つかりません</div>';return;}
    await renderPosts(postsEl,valid);
  }catch(e){el.innerHTML+=`<div class="feed-empty">エラー: ${esc(e.message)}</div>`;}
}

// ── 通知 ──
async function pushNotification(toUser,type,data){
  if(!db||!toUser)return;
  try{await db.ref(`notifications/${toUser}`).push({type,data,ts:Date.now(),read:false});}catch(e){}
}
async function loadNotifBadge(){
  if(!session||!db)return;
  try{
    const snap=await db.ref(`notifications/${session.username}`).orderByChild('read').equalTo(false).once('value');
    const count=snap.numChildren();
    _unreadNotifCount=count;
    const badge=document.getElementById('notifBadge');
    if(badge){badge.style.display=count>0?'flex':'none';badge.textContent=count>9?'9+':String(count);}
  }catch(e){}
}
async function loadNotifications(){
  const el=document.getElementById('notificationsView');if(!el)return;
  if(!session){el.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">🔒</span>ログインが必要です</div>';return;}
  el.innerHTML='<div class="spinner"><div class="spin"></div>読み込み中...</div>';
  try{
    const snap=await db.ref(`notifications/${session.username}`).orderByChild('ts').limitToLast(50).once('value');
    const data=snap.val()||{};
    const notifs=Object.entries(data).map(([id,n])=>({id,...n})).sort((a,b)=>b.ts-a.ts);
    const updates={};
    notifs.forEach(n=>{if(!n.read)updates[`notifications/${session.username}/${n.id}/read`]=true;});
    if(Object.keys(updates).length)db.ref().update(updates);
    _unreadNotifCount=0;
    const badge=document.getElementById('notifBadge');
    if(badge)badge.style.display='none';
    if(!notifs.length){el.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">🔔</span>通知はありません</div>';return;}
    el.innerHTML='';
    notifs.forEach(n=>{
      const item=document.createElement('div');
      item.className='notif-item'+(n.read?'':' unread');
      const d=n.data||{};
      let iconClass='',iconContent='',bodyText='';
      if(n.type==='like'){iconClass='like';iconContent='❤️';bodyText=`<strong>${esc(d.fromDisplay||d.from)}</strong> さんがいいねしました`;}
      else if(n.type==='repost'){iconClass='repost';iconContent='🔁';bodyText=`<strong>${esc(d.fromDisplay||d.from)}</strong> さんがリポストしました`;}
      else if(n.type==='follow'){iconClass='follow';iconContent='👤';bodyText=`<strong>${esc(d.fromDisplay||d.from)}</strong> さんがフォローしました`;}
      else if(n.type==='reply'){iconClass='reply';iconContent='💬';bodyText=`<strong>${esc(d.fromDisplay||d.from)}</strong> さんが返信しました`;}
      item.innerHTML=`
        <div class="notif-icon ${iconClass}">${iconContent}</div>
        <div class="notif-body">
          <div class="notif-text">${bodyText}</div>
          ${d.text?`<div class="notif-post-preview">${esc(d.text)}</div>`:''}
          <div class="notif-time">${timeAgo(n.ts)}</div>
        </div>`;
      if(n.type==='follow'&&d.from)item.onclick=()=>openProfile(d.from);
      else if(d.postOwner&&d.postId)item.onclick=()=>openThread(d.postOwner,d.postId);
      el.appendChild(item);
    });
  }catch(e){el.innerHTML=`<div class="feed-empty">エラー: ${esc(e.message)}</div>`;}
}

// ── Feed ──
async function loadFeed(){
  if(currentView!=='home')return;
  const feedEl=document.getElementById('feedPosts');
  feedEl.innerHTML='<div class="spinner"><div class="spin"></div>読み込み中...</div>';
  if(!db){feedEl.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">⚠️</span>Firebase 未初期化</div>';return;}
  if(_feedTab==='follow'&&session){
    await loadFollowFeed(feedEl);
  }else{
    await loadRecFeed(feedEl);
  }
}

// ── X風スコアリング ──
function calcEngagementScore(p){
  const likeCount  = p.likes  ? Object.keys(p.likes).length  : 0;
  const repostCount= p.reposts? Object.keys(p.reposts).length: 0;
  const replyCount = p.replyCount||0;
  const views      = p.views||0;
  const engagement = likeCount*3 + repostCount*4 + replyCount*2 + views*0.01;
  const hoursAgo = Math.max(0.1, (Date.now()-p.ts)/(1000*60*60));
  return engagement / Math.pow(hoursAgo+2, 1.8);
}

// ── おすすめフィード（並列化）──
async function loadRecFeed(feedEl){
  if(!db){feedEl.innerHTML='<div class="feed-empty">DB未接続</div>';return;}
  try{
    const usersSnap=await db.ref('users').once('value');
    const users=Object.keys(usersSnap.val()||{});

    // ── 並列化: 全ユーザーの投稿を同時取得 ──
    const postArrays = await Promise.allSettled(
      users.map(u =>
        db.ref('posts/'+u).orderByChild('ts').limitToLast(30).once('value')
          .then(s => {
            const d=s.val()||{};
            return Object.entries(d)
              .filter(([,p])=>!p.replyTo)
              .map(([id,p])=>({id,owner:u,...p}));
          })
      )
    );

    let posts = postArrays
      .filter(r=>r.status==='fulfilled')
      .flatMap(r=>r.value);

    const now=Date.now();
    const recent=posts.filter(p=>(now-p.ts)<72*60*60*1000);
    const older =posts.filter(p=>(now-p.ts)>=72*60*60*1000);

    recent.sort((a,b)=>calcEngagementScore(b)-calcEngagementScore(a));
    older .sort((a,b)=>calcEngagementScore(b)-calcEngagementScore(a));

    const combined=[...recent.slice(0,30),...older.slice(0,5)]
      .sort((a,b)=>calcEngagementScore(b)-calcEngagementScore(a))
      .slice(0,60);

    if(!combined.length){
      feedEl.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">🐦</span>まだ投稿がありません</div>';return;
    }
    await renderPosts(feedEl,combined);
  }catch(e){feedEl.innerHTML=`<div class="feed-empty">読み込みエラー: ${esc(e.message)}</div>`;}
}

// ── フォロー中フィード（並列化）──
async function loadFollowFeed(feedEl){
  if(!session){feedEl.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">🔒</span>ログインが必要です</div>';return;}
  try{
    const followSnap=await db.ref('follows/'+session.username).once('value');
    const followData=followSnap.val()||{};
    const followList=Object.keys(followData).filter(k=>followData[k]===true);
    const targets=[session.username,...followList];

    // ── 並列化: フォロー中ユーザーの投稿を同時取得 ──
    const postArrays = await Promise.allSettled(
      targets.map(u =>
        db.ref('posts/'+u).orderByChild('ts').limitToLast(40).once('value')
          .then(s => {
            const d=s.val()||{};
            return Object.entries(d).map(([id,p])=>({
              id,
              owner:u,
              username:p.username||u,
              displayName:p.displayName||p.username||u,
              ...p
            }));
          })
      )
    );

    let posts = postArrays
      .filter(r=>r.status==='fulfilled')
      .flatMap(r=>r.value)
      .sort((a,b)=>b.ts-a.ts)
      .slice(0,80);

    if(!posts.length){
      feedEl.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">🐦</span>フォロー中のユーザーの投稿がありません<br><small style="margin-top:8px;display:block">誰かをフォローしてみましょう</small></div>';return;
    }
    await renderPosts(feedEl,posts);
  }catch(e){feedEl.innerHTML=`<div class="feed-empty">読み込みエラー: ${esc(e.message)}</div>`;}
}

// フィードタブ切替
function switchFeedTab(tab){
  _feedTab=tab;
  document.getElementById('feedTabRec')?.classList.toggle('active',tab==='rec');
  document.getElementById('feedTabFollow')?.classList.toggle('active',tab==='follow');
  if(currentView==='home')loadFeed();
}

// ── renderPosts（並列化）──
async function renderPosts(container, posts, showThreadLines){
  container.innerHTML='';

  // 全投稿の DOM 生成を並列実行
  const results = await Promise.allSettled(
    posts.map((p, i) => {
      const hasThread = showThreadLines && i < posts.length - 1;
      return buildPostEl(p, hasThread);
    })
  );

  // 順序を保ったまま追加。失敗した投稿はスキップ
  results.forEach(result => {
    if(result.status === 'fulfilled'){
      container.appendChild(result.value);
    }
  });
}

// ── buildPostEl（内部の非同期処理を並列化）──
async function buildPostEl(p, showThreadLine){
  const el=document.createElement('div');
  el.className='post';
  el.dataset.postId=p.id;
  el.dataset.owner=p.owner||p.username;

  const username=p.username||p.owner;
  const owner=p.owner||p.username;

  // ── 並列化: アバター・バッジ・ブックマークを同時取得 ──
  const [av, flags, bookmarked] = await Promise.all([
    getAvatarDataUrl(username),
    getUserFlags(username),
    session ? isBookmarked(owner, p.id) : Promise.resolve(false)
  ]);

  const avHtml=avatarImgTag(username,av,44);
  const badgeHtml=buildBadgeHtml(flags,'sm');

  const likeCount  =p.likes  ?Object.keys(p.likes).length  :0;
  const repostCount=p.reposts?Object.keys(p.reposts).length:0;
  const views=p.views||0;
  const liked   =session&&p.likes  &&p.likes[session.username];
  const reposted=session&&p.reposts&&p.reposts[session.username];
  const isOwner=session&&session.username===username;

  const imgHtml=p.image
    ?`<div class="post-img" onclick="event.stopPropagation();openLightbox('${esc(p.image)}')"><img src="${esc(p.image)}" alt="投稿画像" loading="lazy"></div>`
    :'';
  const replyToHtml=p.replyTo
    ?`<div class="post-reply-to">↩ <span>@${esc(p.replyTo.displayName||p.replyTo.username)}</span> への返信</div>`
    :'';
  let quoteHtml='';
  if(p.quoteOf){
    quoteHtml=`<div class="post-quote-embed" onclick="event.stopPropagation();openThread('${esc(p.quoteOf.owner)}','${esc(p.quoteOf.postId)}')">
      <div class="qe-header">
        <span class="qe-name">${esc(p.quoteOf.displayName||p.quoteOf.username)}</span>
        <span class="qe-uname">@${esc(p.quoteOf.username)}</span>
      </div>
      <div class="qe-text">${esc((p.quoteOf.text||'').slice(0,80))}${(p.quoteOf.text||'').length>80?'…':''}</div>
    </div>`;
  }
  const menuHtml=isOwner?`
    <div class="post-menu-wrap">
      <button class="post-menu-btn" onclick="event.stopPropagation();togglePostMenu(event,'menu_${p.id}')">
        <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
      </button>
      <div class="post-dropdown" id="menu_${p.id}">
        <button class="post-dropdown-item danger" onclick="event.stopPropagation();deletePost('${owner}','${p.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          削除
        </button>
      </div>
    </div>`:'<span style="margin-left:auto;width:30px"></span>';

  el.innerHTML=`
    <div class="post-avatar-col">
      ${avHtml}
      ${showThreadLine?'<div class="post-thread-line"></div>':''}
    </div>
    <div class="post-body">
      <div class="post-header">
        <span class="post-dispname" onclick="event.stopPropagation();openProfile('${esc(username)}')" style="cursor:pointer">${esc(p.displayName||username)}</span>
        ${badgeHtml}
        <span class="post-username">@${esc(username)}</span>
        <span class="post-dot">·</span>
        <span class="post-time">${timeAgo(p.ts)}</span>
        ${menuHtml}
      </div>
      ${replyToHtml}
      ${p.text?`<div class="post-text">${renderTextWithHashtags(p.text)}</div>`:''}
      ${imgHtml}
      ${quoteHtml}
      <div class="post-actions">
        <button class="post-action reply" onclick="event.stopPropagation();openReplyModal('${esc(owner)}','${p.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <span>${p.replyCount||0}</span>
        </button>
        <button class="post-action repost ${reposted?'reposted':''}" onclick="event.stopPropagation();openRepostModal('${esc(owner)}','${p.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
          <span>${repostCount}</span>
        </button>
        <button class="post-action like ${liked?'liked':''}" id="likeBtn_${p.id}" onclick="event.stopPropagation();toggleLike(event,'${esc(owner)}','${p.id}',this)">
          <svg viewBox="0 0 24 24" fill="${liked?'currentColor':'none'}" stroke="currentColor" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          <span>${likeCount}</span>
        </button>
        <button class="post-action" style="gap:4px;padding:7px 8px;" onclick="event.stopPropagation()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          <span style="font-size:.78rem;color:var(--white3)">${formatCount(views)}</span>
        </button>
        <button class="post-action bookmark ${bookmarked?'bookmarked':''}" onclick="event.stopPropagation();toggleBookmark(event,'${esc(owner)}','${p.id}',this)" title="${bookmarked?'ブックマーク済み':'ブックマーク'}">
          <svg viewBox="0 0 24 24" fill="${bookmarked?'currentColor':'none'}" stroke="currentColor" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
        </button>
        <button class="post-action share" onclick="event.stopPropagation();sharePost(event,'${p.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        </button>
      </div>
    </div>`;

  el.addEventListener('click',()=>openThread(owner,p.id));
  return el;
}

// Post menu
function togglePostMenu(e,menuId){
  e.stopPropagation();
  document.querySelectorAll('.post-dropdown.open').forEach(m=>{if(m.id!==menuId)m.classList.remove('open');});
  document.getElementById(menuId)?.classList.toggle('open');
}
document.addEventListener('click',()=>{document.querySelectorAll('.post-dropdown.open').forEach(m=>m.classList.remove('open'));});

// ── Like ──
async function toggleLike(e,owner,postId,btn){
  e.stopPropagation();
  if(!session){showToast('ログインが必要です');return;}
  const ref=db.ref(`posts/${owner}/${postId}/likes/${session.username}`);
  const snap=await ref.once('value');const liked=snap.val()===true;
  if(liked){
    await ref.remove();
  }else{
    await ref.set(true);
    if(owner!==session.username){
      const postSnap=await db.ref(`posts/${owner}/${postId}`).once('value');
      const post=postSnap.val()||{};
      await pushNotification(owner,'like',{from:session.username,fromDisplay:session.displayName||session.username,postOwner:owner,postId,text:(post.text||'').slice(0,60)});
    }
  }
  const countEl=btn.querySelector('span');const svg=btn.querySelector('svg');
  btn.classList.toggle('liked',!liked);
  svg.setAttribute('fill',!liked?'currentColor':'none');
  countEl.textContent=Math.max(0,(parseInt(countEl.textContent)||0)+(!liked?1:-1));
  if(!liked){btn.classList.add('like-animate');setTimeout(()=>btn.classList.remove('like-animate'),400);}
}

// ── Repost Modal ──
let _repostState={owner:'',postId:'',reposted:false};
function openRepostModal(owner,postId){
  if(!session){showToast('ログインが必要です');return;}
  _repostState={owner,postId,reposted:false};
  db.ref(`posts/${owner}/${postId}/reposts/${session.username}`).once('value').then(snap=>{
    const alreadyReposted=snap.val()===true;
    _repostState.reposted=alreadyReposted;
    const undoBtn=document.getElementById('undoRepostBtn');
    if(undoBtn)undoBtn.style.display=alreadyReposted?'flex':'none';
  });
  document.getElementById('repostOverlay').classList.add('open');
}
function closeRepostModal(){document.getElementById('repostOverlay').classList.remove('open');}
async function doRepost(){
  const {owner,postId,reposted}=_repostState;
  if(reposted){await doUndoRepost();return;}
  await db.ref(`posts/${owner}/${postId}/reposts/${session.username}`).set(true);
  if(owner!==session.username){
    const postSnap=await db.ref(`posts/${owner}/${postId}`).once('value');
    const post=postSnap.val()||{};
    await pushNotification(owner,'repost',{from:session.username,fromDisplay:session.displayName||session.username,postOwner:owner,postId,text:(post.text||'').slice(0,60)});
  }
  closeRepostModal();showToast('リポストしました');
  await refreshPostInFeed(owner,postId);
}
async function doUndoRepost(){
  const {owner,postId}=_repostState;
  await db.ref(`posts/${owner}/${postId}/reposts/${session.username}`).remove();
  closeRepostModal();showToast('リポストを取り消しました');
  await refreshPostInFeed(owner,postId);
}
async function refreshPostInFeed(owner,postId){
  const btns=document.querySelectorAll(`.post[data-post-id="${postId}"] .post-action.repost`);
  if(!btns.length)return;
  const snap=await db.ref(`posts/${owner}/${postId}/reposts`).once('value');
  const count=snap.val()?Object.keys(snap.val()).length:0;
  const reposted=snap.val()&&snap.val()[session?.username]===true;
  btns.forEach(btn=>{
    btn.classList.toggle('reposted',reposted);
    const span=btn.querySelector('span');if(span)span.textContent=count;
  });
}

// ── Quote Repost ──
async function openQuoteRepost(){
  closeRepostModal();
  const {owner,postId}=_repostState;
  const snap=await db.ref(`posts/${owner}/${postId}`).once('value');
  const post=snap.val();if(!post){showToast('投稿が見つかりません');return;}
  _repostContext={owner,postId,post};
  const previewEl=document.getElementById('quotePreviewEmbed');
  if(previewEl){
    previewEl.innerHTML=`
      <div class="qe-header">
        <span class="qe-name">${esc(post.displayName||post.username)}</span>
        <span class="qe-uname">@${esc(post.username)}</span>
      </div>
      <div class="qe-text">${esc((post.text||'').slice(0,120))}${(post.text||'').length>120?'…':''}</div>`;
  }
  document.getElementById('quoteTextarea').value='';updateQuoteCount();
  const av=session._avatar||null;
  drawAvatarCanvas(document.getElementById('quoteAvatarCanvas'),session.username,av,40);
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
    const {owner,postId,post}=_repostContext;
    const newPost={
      text,username:session.username,displayName:session.displayName||session.username,
      ts:Date.now(),likes:{},reposts:{},replyCount:0,views:0,
      quoteOf:{owner,postId,username:post.username,displayName:post.displayName||post.username,text:post.text||''}
    };
    await db.ref('posts/'+session.username).push(newPost);
    if(text)await saveHashtags(text);
    closeQuoteModal();showToast('引用リポストしました');
    if(currentView==='home')loadFeed();
  }catch(e){showToast('エラー: '+e.message);}
  finally{btn.disabled=false;}
}

// ── Reply Modal ──
let _replyModalCtx=null;
async function openReplyModal(owner,postId){
  if(!session){showToast('ログインが必要です');return;}
  const snap=await db.ref(`posts/${owner}/${postId}`).once('value');
  const post=snap.val();if(!post){showToast('投稿が見つかりません');return;}
  _replyModalCtx={owner,postId,post};
  const isMobile=window.innerWidth<=800;
  if(isMobile){
    openMobileCompose({owner,postId,username:post.username,displayName:post.displayName||post.username,text:post.text||''});
    return;
  }
  const ctx=document.getElementById('replyModalContext');
  const av=await getAvatarDataUrl(post.username||owner);
  const avHtml=avatarImgTag(post.username||owner,av,40);
  ctx.innerHTML=`
    <div class="post-avatar-col">${avHtml}<div class="post-thread-line"></div></div>
    <div class="post-body">
      <div class="post-header">
        <span class="post-dispname">${esc(post.displayName||post.username)}</span>
        <span class="post-username">@${esc(post.username||owner)}</span>
      </div>
      ${post.text?`<div class="post-text">${renderTextWithHashtags(post.text)}</div>`:''}
    </div>`;
  document.getElementById('replyTextarea').value='';
  updateReplyCount();clearReplyImage();
  const myAv=session._avatar||null;
  drawAvatarCanvas(document.getElementById('replyAvatarCanvas'),session.username,myAv,40);
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
    const {owner,postId,post}=_replyModalCtx;
    const newPost={
      text,username:session.username,displayName:session.displayName||session.username,
      ts:Date.now(),likes:{},reposts:{},replyCount:0,views:0,
      replyTo:{owner,postId,username:post.username||owner,displayName:post.displayName||post.username||owner}
    };
    if(_replyImageBase64)newPost.image=_replyImageBase64;
    await db.ref('posts/'+session.username).push(newPost);
    await db.ref(`posts/${owner}/${postId}/replyCount`).transaction(c=>(c||0)+1);
    if(text)await saveHashtags(text);
    if((post.username||owner)!==session.username)
      await pushNotification(post.username||owner,'reply',{from:session.username,fromDisplay:session.displayName||session.username,postOwner:owner,postId,text:text.slice(0,60)});
    document.querySelectorAll(`.post[data-post-id="${postId}"] .post-action.reply span`).forEach(el=>{el.textContent=(parseInt(el.textContent)||0)+1;});
    closeReplyModal();showToast('返信しました');
    if(currentView==='thread')openThread(owner,postId);
    else if(currentView==='home')loadFeed();
  }catch(e){showToast('エラー: '+e.message);}
  finally{btn.disabled=false;}
}

// ── Thread View ──
async function openThread(owner,postId){
  viewHistory.push(currentView);
  currentView='thread';
  setView('thread');
  if(!session||session.username!==owner)recordView(owner,postId);
  const el=document.getElementById('threadView');
  el.innerHTML='<div class="spinner"><div class="spin"></div>読み込み中...</div>';
  try{
    // ── 並列化: 投稿データ・アバター・バッジ・ブックマークを同時取得 ──
    const snap=await db.ref(`posts/${owner}/${postId}`).once('value');
    const post=snap.val();if(!post){el.innerHTML='<div class="feed-empty">投稿が見つかりません</div>';return;}
    post.id=postId;post.owner=owner;
    const username=post.username||owner;

    const [av, flags, bookmarked] = await Promise.all([
      getAvatarDataUrl(username),
      getUserFlags(username),
      session ? isBookmarked(owner, postId) : Promise.resolve(false)
    ]);

    const badgeHtml=buildBadgeHtml(flags,'lg');
    const likeCount  =post.likes  ?Object.keys(post.likes).length  :0;
    const repostCount=post.reposts?Object.keys(post.reposts).length:0;
    const views=post.views||0;
    const liked   =session&&post.likes  &&post.likes[session.username];
    const reposted=session&&post.reposts&&post.reposts[session.username];
    const avHtml=avatarImgTag(username,av,48);
    const imgHtml=post.image?`<div class="post-img" onclick="openLightbox('${esc(post.image)}')" style="cursor:zoom-in"><img src="${esc(post.image)}" alt="" loading="lazy"></div>`:'';
    let quoteHtml='';
    if(post.quoteOf){
      quoteHtml=`<div class="post-quote-embed" onclick="openThread('${esc(post.quoteOf.owner)}','${esc(post.quoteOf.postId)}')">
        <div class="qe-header"><span class="qe-name">${esc(post.quoteOf.displayName||post.quoteOf.username)}</span><span class="qe-uname">@${esc(post.quoteOf.username)}</span></div>
        <div class="qe-text">${esc((post.quoteOf.text||'').slice(0,100))}${(post.quoteOf.text||'').length>100?'…':''}</div>
      </div>`;
    }
    el.innerHTML=`
      <div class="post-detail">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          ${avHtml.replace('class="post-avatar"','class="post-avatar" style="width:48px;height:48px;"')}
          <div>
            <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
              <div class="post-dispname" onclick="openProfile('${esc(username)}')" style="cursor:pointer;font-size:1.05rem">${esc(post.displayName||username)}</div>
              ${badgeHtml}
            </div>
            <div class="post-username">@${esc(username)}</div>
          </div>
        </div>
        ${post.replyTo?`<div class="post-reply-to" style="margin-bottom:8px;">↩ <span>@${esc(post.replyTo.displayName||post.replyTo.username)}</span> への返信</div>`:''}
        ${post.text?`<div class="post-text" style="font-size:1.15rem;margin-bottom:12px;">${renderTextWithHashtags(post.text)}</div>`:''}
        ${imgHtml}
        ${quoteHtml}
        <div style="font-size:.84rem;color:var(--white3);margin:8px 0;">${new Date(post.ts).toLocaleString('ja-JP',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
        <div class="post-detail-meta">
          <span><strong>${formatCount(repostCount)}</strong> リポスト</span>
          <span><strong>${formatCount(likeCount)}</strong> いいね</span>
          <span style="display:flex;align-items:center;gap:4px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <strong>${formatCount(views)}</strong> 件の表示
          </span>
        </div>
        <div class="post-detail-actions">
          <button class="post-action reply" onclick="openReplyModal('${esc(owner)}','${postId}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            <span>${post.replyCount||0}</span>
          </button>
          <button class="post-action repost ${reposted?'reposted':''}" onclick="openRepostModal('${esc(owner)}','${postId}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
            <span>${repostCount}</span>
          </button>
          <button class="post-action like ${liked?'liked':''}" id="likeBtn_detail_${postId}" onclick="toggleLike(event,'${esc(owner)}','${postId}',this)">
            <svg viewBox="0 0 24 24" fill="${liked?'currentColor':'none'}" stroke="currentColor" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            <span>${likeCount}</span>
          </button>
          <button class="post-action bookmark ${bookmarked?'bookmarked':''}" onclick="toggleBookmark(event,'${esc(owner)}','${postId}',this)">
            <svg viewBox="0 0 24 24" fill="${bookmarked?'currentColor':'none'}" stroke="currentColor" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
          </button>
          <button class="post-action share" onclick="sharePost(event,'${postId}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          </button>
        </div>
      </div>
      <div class="thread-replies-head">返信</div>
      <div id="threadReplies"><div class="spinner"><div class="spin"></div></div></div>`;
    loadReplies(owner,postId);
  }catch(e){el.innerHTML=`<div class="feed-empty">エラー: ${esc(e.message)}</div>`;}
}

// ── loadReplies（並列化）──
async function loadReplies(owner,postId){
  const el=document.getElementById('threadReplies');if(!el)return;
  try{
    const usersSnap=await db.ref('users').once('value');
    const users=Object.keys(usersSnap.val()||{});

    // ── 並列化: 全ユーザーの返信を同時検索 ──
    const replyArrays = await Promise.allSettled(
      users.map(u =>
        db.ref('posts/'+u).orderByChild('ts').once('value')
          .then(s => {
            const d=s.val()||{};
            return Object.entries(d)
              .filter(([,p])=>p.replyTo&&p.replyTo.postId===postId&&p.replyTo.owner===owner)
              .map(([id,p])=>({
                id,owner:u,
                username:p.username||u,
                displayName:p.displayName||p.username||u,
                ...p
              }));
          })
      )
    );

    const replies = replyArrays
      .filter(r=>r.status==='fulfilled')
      .flatMap(r=>r.value)
      .sort((a,b)=>a.ts-b.ts);

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

// ── Lightbox ──
function openLightbox(src){
  const lb=document.getElementById('imgLightbox');
  const img=document.getElementById('lightboxImg');
  if(!lb||!img)return;
  img.src=src;lb.classList.add('open');document.body.style.overflow='hidden';
}
function closeLightbox(){
  const lb=document.getElementById('imgLightbox');
  if(lb){lb.classList.remove('open');document.body.style.overflow='';}
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLightbox();});

// ── Follow ──
async function toggleFollow(targetUsername){
  if(!session){showToast('ログインが必要です');return;}
  if(targetUsername===session.username){showToast('自分はフォローできません');return;}
  const ref=db.ref(`follows/${session.username}/${targetUsername}`);
  const snap=await ref.once('value');const following=snap.val()===true;
  if(following){
    await ref.remove();
  }else{
    await ref.set(true);
    await pushNotification(targetUsername,'follow',{from:session.username,fromDisplay:session.displayName||session.username});
  }
  showToast(following?`@${targetUsername} のフォローを解除しました`:`@${targetUsername} をフォローしました`);
  return !following;
}

// ── Profile View（並列化）──
async function openProfile(username){
  viewHistory.push(currentView);
  viewedProfile=username;setView('profile');
  const el=document.getElementById('profileView');
  el.innerHTML='<div class="spinner"><div class="spin"></div>読み込み中...</div>';
  try{
    // ── 並列化: ユーザー情報・アバター・バッジ・フォロー情報を同時取得 ──
    const [snap, av, flags, followsSnap, followersSnap, postsSnap] = await Promise.all([
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

    // isFollowing だけ session 依存なので条件付き
    const isFollowing = session
      ? (await db.ref(`follows/${session.username}/${username}`).once('value')).val()===true
      : false;

    const actionBtn=isMe
      ?`<button class="profile-edit-btn" onclick="openEditProfile()">プロフィールを編集</button>`
      :`<button class="profile-follow-btn ${isFollowing?'following':''}" id="profileFollowBtn" onclick="onProfileFollow('${esc(username)}')">${isFollowing?'フォロー中':'フォロー'}</button>`;
    const cvId='profileAvatarCv_'+Date.now();
    const joinedDate=u.created?new Date(u.created).toLocaleDateString('ja-JP',{year:'numeric',month:'long'}):'';
    el.innerHTML=`
      <div class="profile-header">
        <div class="profile-banner" style="background:linear-gradient(135deg,#0D1B2A,#1E2C3E,#C9A84C22)"></div>
        <div class="profile-info">
          <div class="profile-avatar-wrap">
            <canvas id="${cvId}" class="profile-avatar" width="84" height="84"></canvas>
            ${actionBtn}
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:2px;">
            <div class="profile-dispname" style="margin-bottom:0">${esc(u.displayName||username)}</div>
            ${badgeHtml}
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
  el.innerHTML='<div class="spinner"><div class="spin"></div></div>';
  try{
    const snap=await db.ref('posts/'+username).orderByChild('ts').limitToLast(40).once('value');
    const data=snap.val()||{};
    const posts=Object.entries(data).map(([id,p])=>({
      id,owner:username,
      username:p.username||username,
      displayName:p.displayName||p.username||username,
      ...p
    })).sort((a,b)=>b.ts-a.ts);
    if(!posts.length){el.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">🐦</span>まだ投稿がありません</div>';return;}
    await renderPosts(el,posts);
  }catch(e){el.innerHTML=`<div class="feed-empty">エラー: ${esc(e.message)}</div>`;}
}

// ── Edit Profile ──
async function openEditProfile(){
  if(!session)return;
  const snap=await db.ref('users/'+session.username).once('value');
  const u=snap.val()||{};
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
    const str=JSON.stringify(session);
    setCookie('hg_session',str,30);setCookie('hgs_sess',str,30);
    try{localStorage.setItem('hg_session_ls',str);localStorage.setItem('hgs_sess',str);}catch(e){}
    delete _userFlagsCache[session.username];
    updateSidebarUI();closeEditProfile();showToast('プロフィールを更新しました ✓');openProfile(session.username);
  }catch(e){document.getElementById('editProfileErr').textContent='エラー: '+e.message;document.getElementById('editProfileErr').classList.add('show');}
  finally{btn.disabled=false;}
}

// ── Follow List Modal（並列化）──
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

    // ── 並列化: 全ユーザーのデータ・アバター・バッジを同時取得 ──
    const userDataList = await Promise.allSettled(
      users.map(async u => {
        const [uSnap, av, flags] = await Promise.all([
          db.ref('users/'+u).once('value'),
          getAvatarDataUrl(u),
          getUserFlags(u)
        ]);
        return { u, ud: uSnap.val()||{username:u}, av, flags };
      })
    );

    userDataList
      .filter(r=>r.status==='fulfilled')
      .forEach(({ value: { u, ud, av, flags } }) => {
        const cvId='flav_'+u;
        const badgeHtml=buildBadgeHtml(flags,'sm');
        const item=document.createElement('div');item.className='follow-user-item';
        item.innerHTML=`<canvas id="${cvId}" class="suggest-avatar" width="40" height="40"></canvas>
          <div class="suggest-info">
            <div class="suggest-name" style="display:flex;align-items:center;gap:4px;">${esc(ud.displayName||u)}${badgeHtml}</div>
            <div class="suggest-uname">@${esc(u)}</div>
          </div>`;
        item.onclick=()=>{closeFollowList();openProfile(u);};
        body.appendChild(item);
        drawAvatarCanvas(document.getElementById(cvId),u,av,40);
      });
  }catch(e){document.getElementById('followListBody').innerHTML=`<div class="feed-empty">エラー: ${esc(e.message)}</div>`;}
}
function closeFollowList(){document.getElementById('followListOverlay').classList.remove('open');}

// ── Hashtag View（並列化）──
async function openHashtag(tag){
  viewHistory.push(currentView);
  setView('hashtag');
  const el=document.getElementById('hashtagView');
  el.innerHTML='<div class="spinner"><div class="spin"></div>読み込み中...</div>';
  const normalTag=tag.toLowerCase();
  try{
    const usersSnap=await db.ref('users').once('value');
    const users=Object.keys(usersSnap.val()||{});

    // ── 並列化 ──
    const postArrays = await Promise.allSettled(
      users.map(u =>
        db.ref('posts/'+u).orderByChild('ts').limitToLast(50).once('value')
          .then(s => {
            const d=s.val()||{};
            return Object.entries(d)
              .filter(([,p])=>p.text&&extractHashtags(p.text).includes(normalTag))
              .map(([id,p])=>({id,owner:u,username:p.username||u,...p}));
          })
      )
    );

    const posts = postArrays
      .filter(r=>r.status==='fulfilled')
      .flatMap(r=>r.value)
      .sort((a,b)=>b.ts-a.ts);

    el.innerHTML=`
      <div class="hashtag-header">
        <div class="hashtag-title">${esc(tag)}</div>
        <div class="hashtag-count">${posts.length} 件の投稿</div>
      </div>
      <div id="hashtagPosts"></div>`;
    if(!posts.length){document.getElementById('hashtagPosts').innerHTML='<div class="feed-empty">このハッシュタグの投稿はまだありません</div>';return;}
    await renderPosts(document.getElementById('hashtagPosts'),posts);
  }catch(e){el.innerHTML=`<div class="feed-empty">エラー: ${esc(e.message)}</div>`;}
}

// ── Trends ──
async function loadTrends(){
  try{
    const snap=await db.ref('hashtags').once('value');
    const data=snap.val()||{};
    const now=Date.now();
    const trends=Object.entries(data)
      .map(([key,v])=>{
        const age=Math.max(1,(now-v.lastUsed)/(1000*60*60));
        const score=v.count/Math.sqrt(age);
        return{tag:v.tag||('#'+key),count:v.count||0,score,lastUsed:v.lastUsed};
      })
      .sort((a,b)=>b.score-a.score)
      .slice(0,10);
    return trends;
  }catch(e){return[];}
}
async function loadRightTrends(){
  const el=document.getElementById('rightTrends');if(!el)return;
  const trends=await loadTrends();
  if(!trends.length){el.innerHTML='<div style="padding:12px 16px;font-size:.84rem;color:var(--white3)">まだトレンドがありません</div>';return;}
  el.innerHTML='';
  trends.slice(0,5).forEach((t,i)=>{
    const item=document.createElement('div');item.className='trend-item';
    item.innerHTML=`<span class="trend-rank">${i+1}</span>
      <div class="trend-info">
        <div class="trend-tag">${esc(t.tag)}</div>
        <div class="trend-count">${formatCount(t.count)} 件</div>
      </div>`;
    item.onclick=()=>openHashtag(t.tag);
    el.appendChild(item);
  });
}
async function loadTrendView(){
  const el=document.getElementById('trendView');if(!el)return;
  el.innerHTML='<div class="spinner"><div class="spin"></div>読み込み中...</div>';
  const trends=await loadTrends();
  if(!trends.length){el.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">📈</span>まだトレンドがありません</div>';return;}
  el.innerHTML='<div style="padding:14px 16px;font-weight:700;font-size:1rem;border-bottom:1px solid var(--line)">🔥 トレンド</div>';
  trends.forEach((t,i)=>{
    const item=document.createElement('div');item.className='trend-item';
    item.style.padding='14px 16px';
    item.innerHTML=`<span class="trend-rank">${i+1}</span>
      <div class="trend-info">
        <div class="trend-tag" style="font-size:1rem">${esc(t.tag)}</div>
        <div class="trend-count">${formatCount(t.count)} 件の投稿</div>
      </div>
      <span class="trend-badge">トレンド</span>`;
    item.onclick=()=>openHashtag(t.tag);
    el.appendChild(item);
  });
}

// ── Search（並列化）──
let _searchDebounce=null;
async function doSearch(){
  const q=(document.getElementById('searchInput')?.value||'').trim().toLowerCase();
  setView('search');
  const clearBtn=document.getElementById('searchClearBtn');
  if(clearBtn)clearBtn.style.display=q?'flex':'none';
  const tabsEl=document.getElementById('searchTabs');
  const el=document.getElementById('searchView');
  if(!q){
    if(tabsEl)tabsEl.style.display='none';
    el.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">🔍</span>キーワードを入力してください</div>';return;
  }
  if(q.startsWith('#')){openHashtag(q);return;}
  if(tabsEl)tabsEl.style.display='flex';
  el.innerHTML='<div class="spinner"><div class="spin"></div></div>';
  try{
    // ── 並列化: ユーザー検索・投稿検索・タグ検索を同時実行 ──
    const [usersSnap, tagsSnap] = await Promise.all([
      db.ref('users').once('value'),
      db.ref('hashtags').once('value')
    ]);

    const usersData=usersSnap.val()||{};
    _searchResults.users=Object.entries(usersData).filter(([k,v])=>
      k.toLowerCase().includes(q)||(v.displayName||'').toLowerCase().includes(q)
    );

    const allUsers=Object.keys(usersData);
    const postArrays = await Promise.allSettled(
      allUsers.map(u =>
        db.ref('posts/'+u).orderByChild('ts').limitToLast(30).once('value')
          .then(s=>{
            const d=s.val()||{};
            return Object.entries(d)
              .filter(([,p])=>p.text&&p.text.toLowerCase().includes(q))
              .map(([id,p])=>({id,owner:u,username:p.username||u,...p}));
          })
      )
    );
    _searchResults.posts = postArrays
      .filter(r=>r.status==='fulfilled')
      .flatMap(r=>r.value)
      .sort((a,b)=>b.ts-a.ts)
      .slice(0,30);

    const tagsData=tagsSnap.val()||{};
    _searchResults.tags=Object.entries(tagsData)
      .filter(([k,v])=>(v.tag||k).toLowerCase().includes(q.replace('#','')))
      .sort((a,b)=>(b[1].count||0)-(a[1].count||0))
      .slice(0,15);

    renderSearchTab(_searchTab);
  }catch(e){el.innerHTML=`<div class="feed-empty">エラー: ${esc(e.message)}</div>`;}
}
function switchSearchTab(tab){
  _searchTab=tab;
  ['users','posts','tags'].forEach(t=>{
    document.getElementById('sTab'+t.charAt(0).toUpperCase()+t.slice(1))?.classList.toggle('active',t===tab);
  });
  renderSearchTab(tab);
}
async function renderSearchTab(tab){
  const el=document.getElementById('searchView');if(!el)return;
  el.innerHTML='';
  if(tab==='users'){
    const matched=_searchResults.users;
    if(!matched.length){el.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">👤</span>ユーザーが見つかりません</div>';return;}

    // ── 並列化: 検索結果ユーザーのアバター・バッジを同時取得 ──
    const userDataList = await Promise.allSettled(
      matched.map(async ([uname, u]) => {
        const [av, flags] = await Promise.all([
          getAvatarDataUrl(uname),
          getUserFlags(uname)
        ]);
        return { uname, u, av, flags };
      })
    );

    userDataList
      .filter(r=>r.status==='fulfilled')
      .forEach(({ value: { uname, u, av, flags } }) => {
        const cvId='srav_'+uname;
        const badgeHtml=buildBadgeHtml(flags,'sm');
        const item=document.createElement('div');item.className='follow-user-item';
        item.innerHTML=`<canvas id="${cvId}" class="suggest-avatar" width="40" height="40"></canvas>
          <div class="suggest-info">
            <div class="suggest-name" style="display:flex;align-items:center;gap:4px;">${esc(u.displayName||uname)}${badgeHtml}</div>
            <div class="suggest-uname">@${esc(uname)}</div>
            ${u.bio?`<div class="suggest-bio">${esc(u.bio.slice(0,60))}</div>`:''}
          </div>`;
        item.onclick=()=>openProfile(uname);
        el.appendChild(item);
        drawAvatarCanvas(document.getElementById(cvId),uname,av,40);
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
      item.onclick=()=>openHashtag(v.tag||'#'+key);
      el.appendChild(item);
    });
  }
}
function clearSearch(){
  const inp=document.getElementById('searchInput');
  if(inp)inp.value='';
  const clearBtn=document.getElementById('searchClearBtn');
  if(clearBtn)clearBtn.style.display='none';
  const tabsEl=document.getElementById('searchTabs');
  if(tabsEl)tabsEl.style.display='none';
  document.getElementById('searchView').innerHTML='<div class="feed-empty"><span class="feed-empty-icon">🔍</span>キーワードを入力してください</div>';
  inp?.focus();
}
function onSearchInput(e){
  const clearBtn=document.getElementById('searchClearBtn');
  if(clearBtn)clearBtn.style.display=e.target.value?'flex':'none';
  if(e.key==='Enter')doSearch();
  else{
    clearTimeout(_searchDebounce);
    _searchDebounce=setTimeout(()=>{if(e.target.value.trim().length>=2)doSearch();},400);
  }
}
function onRightSearchInput(inp){inp.style.setProperty('--val',inp.value);}
function copySearchAndGo(val){
  const el=document.getElementById('searchInput');if(el)el.value=val;
  doSearch();
}

// ── おすすめユーザー（並列化）──
async function loadSuggestUsers(){
  const el=document.getElementById('suggestUsers');if(!el)return;
  try{
    const [usersSnap, followsAllSnap] = await Promise.all([
      db.ref('users').once('value'),
      db.ref('follows').once('value')
    ]);

    const usersData=usersSnap.val()||{};
    const allUsers=Object.keys(usersData).filter(u=>u!==(session?.username));
    if(!allUsers.length){el.innerHTML='<div style="padding:12px 16px;font-size:.84rem;color:var(--white3)">他のユーザーがいません</div>';return;}

    const followsAll=followsAllSnap.val()||{};
    let myFollows={},myFollowers={};
    if(session){
      myFollows=followsAll[session.username]||{};
      for(const uid in followsAll){if(followsAll[uid][session.username]===true)myFollowers[uid]=true;}
    }

    // ── 並列化: 全ユーザーのスコア計算に必要なデータを同時取得 ──
    const scored = await Promise.allSettled(
      allUsers.map(async u => {
        const uData=usersData[u]||{};
        let followerCount=0;
        for(const uid in followsAll){if(followsAll[uid][u]===true)followerCount++;}
        let postCount=0,lastActive=0;
        try{
          const postsSnap=await db.ref('posts/'+u).orderByChild('ts').limitToLast(5).once('value');
          const postsData=postsSnap.val()||{};
          postCount=postsSnap.numChildren();
          Object.values(postsData).forEach(p=>{if(p.ts>lastActive)lastActive=p.ts;});
        }catch(e){}
        const alreadyFollowing=myFollows[u]===true;
        const mutualPending=myFollowers[u]&&!alreadyFollowing;
        const now=Date.now();
        const daysSinceActive=lastActive?Math.max(0.1,(now-lastActive)/(1000*60*60*24)):30;
        let score=followerCount*2+postCount*0.5+(mutualPending?20:0)+(1/daysSinceActive)*5;
        return{u,uData,followerCount,postCount,alreadyFollowing,mutualPending,score};
      })
    );

    const validScored = scored
      .filter(r=>r.status==='fulfilled')
      .map(r=>r.value);

    const notFollowing=validScored.filter(s=>!s.alreadyFollowing).sort((a,b)=>b.score-a.score);
    const following   =validScored.filter(s=>s.alreadyFollowing ).sort((a,b)=>b.score-a.score);
    const ordered=[...notFollowing.slice(0,4),...following.slice(0,1)].slice(0,4);

    // ── 並列化: 表示用アバター・バッジを同時取得 ──
    const displayData = await Promise.allSettled(
      ordered.map(async item => {
        const [av, flags] = await Promise.all([
          getAvatarDataUrl(item.u),
          getUserFlags(item.u)
        ]);
        return { ...item, av, flags };
      })
    );

    el.innerHTML='';
    displayData
      .filter(r=>r.status==='fulfilled')
      .forEach(({ value: { u, uData, followerCount, mutualPending, alreadyFollowing, av, flags } }) => {
        const cvId='sgav_'+u;
        const badgeHtml=buildBadgeHtml(flags,'sm');
        const item=document.createElement('div');item.className='suggest-user';
        const mutualHint  =mutualPending?`<div class="suggest-mutual"><span>フォローされています</span></div>`:'';
        const followerHint=followerCount>0?`<div class="suggest-mutual">${formatCount(followerCount)} フォロワー</div>`:'';
        item.innerHTML=`<canvas id="${cvId}" class="suggest-avatar" width="40" height="40"></canvas>
          <div class="suggest-info" onclick="openProfile('${esc(u)}')">
            <div class="suggest-name" style="display:flex;align-items:center;gap:4px;">${esc(uData.displayName||u)}${badgeHtml}</div>
            <div class="suggest-uname">@${esc(u)}</div>
            ${uData.bio?`<div class="suggest-bio">${esc(uData.bio.slice(0,40))}</div>`:mutualPending?mutualHint:followerHint}
          </div>
          <button class="follow-btn ${alreadyFollowing?'following':''}" id="sfbtn_${u}" onclick="onSuggestFollow('${esc(u)}')">${alreadyFollowing?'フォロー中':'フォロー'}</button>`;
        el.appendChild(item);
        drawAvatarCanvas(document.getElementById(cvId),u,av,40);
      });
  }catch(e){el.innerHTML=`<div style="padding:12px 16px;font-size:.83rem;color:var(--white3)">読み込みエラー</div>`;}
}
async function onSuggestFollow(username){
  const following=await toggleFollow(username);
  const btn=document.getElementById('sfbtn_'+username);
  if(btn){btn.textContent=following?'フォロー中':'フォロー';btn.className='follow-btn '+(following?'following':'');}
  setTimeout(loadSuggestUsers,500);
}

// ── View Management ──
function setView(view){
  currentView=view;
  document.querySelectorAll('.sidebar-nav-item[data-view]').forEach(el=>{
    const active=el.dataset.view===view;
    el.classList.toggle('active',active);
    const outlines=el.querySelectorAll('.nav-icon-outline');
    const fills=el.querySelectorAll('.nav-icon-fill');
    outlines.forEach(s=>s.style.display=active?'none':'');
    fills.forEach(s=>s.style.display=active?'':'none');
  });

  const panels={
    home:'homeView',profile:'profileViewWrap',search:'searchViewWrap',
    trend:'trendViewWrap',hashtag:'hashtagViewWrap',thread:'threadViewWrap',
    notifications:'notificationsViewWrap',bookmarks:'bookmarksViewWrap'
  };
  Object.entries(panels).forEach(([v,id])=>{
    const el=document.getElementById(id);
    if(el)el.style.display=v===view?'block':'none';
  });

  const homeTabs=document.getElementById('homeFeedTabs');
  const titleBar=document.getElementById('feedTitleBar');
  const titleText=document.getElementById('feedTitleText');
  const titles={
    profile:'プロフィール',search:'検索',trend:'トレンド',
    hashtag:'ハッシュタグ',thread:'投稿',notifications:'通知',bookmarks:'ブックマーク'
  };
  if(view==='home'){
    if(homeTabs)homeTabs.style.display='flex';
    if(titleBar)titleBar.style.display='none';
  }else{
    if(homeTabs)homeTabs.style.display='none';
    if(titleBar)titleBar.style.display='flex';
    if(titleText)titleText.textContent=titles[view]||'HGSNS';
  }

  const feedEl=document.querySelector('.sns-feed');
  if(feedEl)feedEl.scrollTop=0;

  if(view==='trend')loadTrendView();
  if(view==='bookmarks')loadBookmarksView();
}

function goBack(){
  const prev=viewHistory.pop();
  if(prev&&prev!==currentView){
    if(prev==='home'){setView('home');loadFeed();}
    else if(prev==='profile'&&viewedProfile){openProfile(viewedProfile);}
    else{setView(prev);}
  }else{
    setView('home');loadFeed();
  }
}

// ── Boot ──
document.addEventListener('DOMContentLoaded',()=>{
  initFirebase();
  loadSession();
  loadFeed();
  loadSuggestUsers();
  loadRightTrends();
  setView('home');
  updateComposerCount();
  if(session)loadNotifBadge();
  setInterval(()=>{if(session)loadNotifBadge();},60000);
});
