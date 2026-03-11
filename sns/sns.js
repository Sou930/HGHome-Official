// ── HGSNSの js ── (v2: repost / reply / hashtag / trend / mobile)

const FIREBASE_CONFIG_BIN = "01111011 00100010 01100001 01110000 01101001 01001011 01100101 01111001 00100010 00111010 00100010 01000001 01001001 01111010 01100001 01010011 01111001 01000011 01100110 00111000 01010000 01001010 01011001 01111000 01000011 01001010 01000011 01000110 01000011 01000100 00110001 01110000 01101000 01000100 01011111 00101101 01011000 01010110 01010101 01011010 00111001 00110010 01000100 01010011 01010110 01110101 01010010 01100001 01110101 01010101 00100010 00101100 00100010 01100001 01110101 01110100 01101000 01000100 01101111 01101101 01100001 01101001 01101110 00100010 00111010 00100010 01101000 01100111 01110011 01110100 01110101 01100100 01111001 00101101 00110001 00111000 01100101 00110010 00110011 00101110 01100110 01101001 01110010 01100101 01100010 01100001 01110011 01100101 01100001 01110000 01110000 00101110 01100011 01101111 01101101 00100010 00101100 00100010 01100100 01100001 01110100 01100001 01100010 01100001 01110011 01100101 01010101 01010010 01001100 00100010 00111010 00100010 01101000 01110100 01110100 01110000 01110011 00111010 00101111 00101111 01101000 01100111 01110011 01110100 01110101 01100100 01111001 00101101 00110001 00111000 01100101 00110010 00110011 00101101 01100100 01100101 01100110 01100001 01110101 01101100 01110100 00101101 01110010 01110100 01100100 01100010 00101110 01100001 01110011 01101001 01100001 00101101 01110011 01101111 01110101 01110100 01101000 01100101 01100001 01110011 01110100 00110001 00101110 01100110 01101001 01110010 01100101 01100010 01100001 01110011 01100101 01100100 01100001 01110100 01100001 01100010 01100001 01110011 01100101 00101110 01100001 01110000 01110000 00100010 00101100 00100010 01110000 01110010 01101111 01101010 01100101 01100011 01110100 01001001 01100100 00100010 00111010 00100010 01101000 01100111 01110011 01110100 01110101 01100100 01111001 00101101 00110001 00111000 01100101 00110010 00110011 00100010 00101100 00100010 01110011 01110100 01101111 01110010 01100001 01100111 01100101 01000010 01110101 01100011 01101011 01100101 01110100 00100010 00111010 00100010 01101000 01100111 01110011 01110100 01110101 01100100 01111001 00101101 00110001 00111000 01100101 00110010 00110011 00101110 01100110 01101001 01110010 01100101 01100010 01100001 01110011 01100101 01110011 01110100 01101111 01110010 01100001 01100111 01100101 00101110 01100001 01110000 01110000 00100010 00101100 00100010 01101101 01100101 01110011 01110011 01100001 01100111 01101001 01101110 01100111 01010011 01100101 01101110 01100100 01100101 01110010 01001001 01100100 00100010 00111010 00100010 00110111 00110010 00110000 00110001 00110101 00110000 00110111 00110001 00110010 00110111 00110111 00110101 00100010 00101100 00100010 01100001 01110000 01110000 01001001 01100100 00100010 00111010 00100010 00110001 00111010 00110111 00110010 00110000 00110001 00110101 00110000 00110111 00110001 00110010 00110111 00110111 00110101 00111010 01110111 01100101 01100010 00111010 00110110 00110011 00110010 01100010 00110010 01100010 01100100 00110110 01100110 00110000 00110100 00110100 00110001 01100001 00111000 00110011 01100100 00110111 00110100 00111001 01100101 00110010 00100010 00101100 00100010 01101101 01100101 01100001 01110011 01110101 01110010 01100101 01101101 01100101 01101110 01110100 01001001 01100100 00100010 00111010 00100010 01000111 00101101 01011001 00110000 00110101 00110110 00110001 00110001 00110110 01010010 01010001 01001101 00100010 01111101";

function bin2str(b){const c=b.replace(/[^01]/g,'');if(!c)return'';return c.match(/.{1,8}/g).filter(x=>x.length===8).map(b=>String.fromCharCode(parseInt(b,2))).join('');}

// ── State ──
let db = null;
let session = null;
let currentView = 'home';
let viewedProfile = null;
let _postImageBase64 = null;
let _sheetImageBase64 = null;
let _replyImageBase64 = null;
// Reply context
let _replyContext = null; // { owner, postId, username, displayName, text }
// Repost context
let _repostContext = null; // { owner, postId, post }

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
function setCookie(name,value,days){try{const exp=days?'; expires='+new Date(Date.now()+days*864e5).toUTCString():'';const secure=location.protocol==='https:'?'; Secure':'';document.cookie=name+'='+encodeURIComponent(value)+exp+'; path=/; SameSite=Lax'+secure;}catch(e){}}
function getCookie(name){try{const m=document.cookie.split('; ').find(r=>r.startsWith(name+'='));return m?decodeURIComponent(m.split('=').slice(1).join('=')):null;}catch(e){return null;}}
function deleteCookie(name){document.cookie=name+'=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';}

// Parse hashtags from text
function extractHashtags(text){
  const matches=text.match(/#[^\s#！？。、,\.]+/g);
  return matches?[...new Set(matches.map(t=>t.toLowerCase()))]:[];
}
// Render text with clickable hashtags
function renderTextWithHashtags(text){
  if(!text)return '';
  return esc(text).replace(/#([^\s#！？。、,\.&]+)/g,'<span class="hashtag" onclick="event.stopPropagation();openHashtag(\'#$1\')">#$1</span>');
}

// ── Avatar ──
const AVATAR_COLORS=[['#7B6CF6','#B06EF6'],['#F5835B','#F6C344'],['#52C4A3','#3B82F6'],['#E65B9A','#F5835B'],['#4B8DEA','#52C4A3'],['#A068F5','#F5835B']];
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
  let av=localStorage.getItem('fm_avatar_'+username);
  if(!av&&db){try{const snap=await db.ref(`users/${username}/avatar`).once('value');av=snap.val()||null;if(av)localStorage.setItem('fm_avatar_'+username,av);}catch(e){}}
  return av;
}

// Toast
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
    const av=session._avatar||localStorage.getItem('fm_avatar_'+session.username)||null;
    drawAvatarCanvas(document.getElementById('sidebarAvatarCanvas'),session.username,av,40);
    drawAvatarCanvas(document.getElementById('composerAvatarCanvas'),session.username,av,44);
    drawAvatarCanvas(document.getElementById('sheetAvatarCanvas'),session.username,av,40);
    document.getElementById('feedComposer').style.display='flex';
  } else {
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
  else{await doLogin(username,pass);}
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
    updateSidebarUI();document.getElementById('authOverlay').classList.remove('open');showToast('ログインしました！');loadFeed();
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

// ── Composer (Desktop) ──
function updateComposerCount(){
  const ta=document.getElementById('composerText');
  const len=ta.value.length;const max=280;
  const el=document.getElementById('composerCount');
  el.textContent=max-len;
  el.className='composer-count'+(len>max?' over':len>max*.9?' warn':'');
  document.getElementById('composerSubmitBtn').disabled=len===0||len>max;
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
  } else {
    sheetTitle.textContent='新しい投稿';
    sheetReplyBanner.style.display='none';
  }
  document.getElementById('sheetQuotePreview').style.display='none';
  document.getElementById('sheetTextarea').value='';
  updateSheetCount();
  clearSheetImage();
  const av=session._avatar||localStorage.getItem('fm_avatar_'+session.username)||null;
  drawAvatarCanvas(document.getElementById('sheetAvatarCanvas'),session.username,av,40);
  document.getElementById('mobileComposeOverlay').classList.add('open');
  setTimeout(()=>document.getElementById('sheetTextarea').focus(),100);
}
function closeMobileCompose(){document.getElementById('mobileComposeOverlay').classList.remove('open');}
function updateSheetCount(){
  const ta=document.getElementById('sheetTextarea');const len=ta.value.length;const max=280;
  const el=document.getElementById('sheetCount');
  el.textContent=max-len;
  el.className='composer-count'+(len>max?' over':len>max*.9?' warn':'');
  document.getElementById('sheetSubmitBtn').disabled=len===0||len>max;
}
async function submitSheetPost(){
  if(!session){showToast('ログインが必要です');return;}
  const text=document.getElementById('sheetTextarea').value.trim();
  if(!text&&!_sheetImageBase64){showToast('テキストまたは画像が必要です');return;}
  if(text.length>280){showToast('280文字以内にしてください');return;}
  const btn=document.getElementById('sheetSubmitBtn');btn.disabled=true;
  try{
    const post={
      text,username:session.username,displayName:session.displayName||session.username,
      ts:Date.now(),likes:{},reposts:{},replyCount:0
    };
    if(_sheetImageBase64)post.image=_sheetImageBase64;
    if(_replyContext){
      post.replyTo={owner:_replyContext.owner,postId:_replyContext.postId,username:_replyContext.username,displayName:_replyContext.displayName};
      // Increment replyCount on parent
      await db.ref(`posts/${_replyContext.owner}/${_replyContext.postId}/replyCount`).transaction(c=>(c||0)+1);
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
    const post={text,username:session.username,displayName:session.displayName||session.username,ts:Date.now(),likes:{},reposts:{},replyCount:0};
    if(_postImageBase64)post.image=_postImageBase64;
    if(_replyContext){
      post.replyTo={owner:_replyContext.owner,postId:_replyContext.postId,username:_replyContext.username,displayName:_replyContext.displayName};
      await db.ref(`posts/${_replyContext.owner}/${_replyContext.postId}/replyCount`).transaction(c=>(c||0)+1);
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
  if(!db)return;
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

// ── Feed ──
async function loadFeed(){
  if(currentView!=='home')return;
  const feedEl=document.getElementById('feedPosts');
  feedEl.innerHTML='<div class="spinner"><div class="spin"></div>読み込み中...</div>';
  if(!db){feedEl.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">⚠️</span>Firebase 未初期化</div>';return;}
  if(!session){await loadAllPosts(feedEl);return;}
  try{
    const followSnap=await db.ref('follows/'+session.username).once('value');
    const followData=followSnap.val()||{};
    const followList=Object.keys(followData).filter(k=>followData[k]===true);
    const targets=[session.username,...followList];
    const postArrays=await Promise.all(targets.map(u=>
      db.ref('posts/'+u).orderByChild('ts').limitToLast(30).once('value')
        .then(s=>{const d=s.val()||{};return Object.entries(d).map(([id,p])=>({id,owner:u,...p}));})
        .catch(()=>[])
    ));
    let posts=postArrays.flat().sort((a,b)=>b.ts-a.ts).slice(0,60);
    if(!posts.length){feedEl.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">🐦</span>まだ投稿がありません<br><small style="margin-top:8px;display:block">誰かをフォローしてみましょう</small></div>';return;}
    await renderPosts(feedEl,posts);
  }catch(e){feedEl.innerHTML=`<div class="feed-empty">読み込みエラー: ${esc(e.message)}</div>`;}
}
async function loadAllPosts(feedEl){
  try{
    const usersSnap=await db.ref('users').once('value');
    const users=Object.keys(usersSnap.val()||{});
    const postArrays=await Promise.all(users.map(u=>
      db.ref('posts/'+u).orderByChild('ts').limitToLast(10).once('value')
        .then(s=>{const d=s.val()||{};return Object.entries(d).map(([id,p])=>({id,owner:u,...p}));})
        .catch(()=>[])
    ));
    let posts=postArrays.flat().sort((a,b)=>b.ts-a.ts).slice(0,40);
    if(!posts.length){feedEl.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">🐦</span>まだ投稿がありません</div>';return;}
    await renderPosts(feedEl,posts);
  }catch(e){feedEl.innerHTML=`<div class="feed-empty">読み込みエラー: ${esc(e.message)}</div>`;}
}
async function renderPosts(container,posts,showThreadLines){
  container.innerHTML='';
  for(let i=0;i<posts.length;i++){
    const p=posts[i];
    const hasThread=showThreadLines&&i<posts.length-1;
    const el=await buildPostEl(p,hasThread);
    container.appendChild(el);
  }
}

async function buildPostEl(p,showThreadLine){
  const el=document.createElement('div');
  el.className='post';
  el.dataset.postId=p.id;
  el.dataset.owner=p.owner||p.username;
  const av=await getAvatarDataUrl(p.username||p.owner);
  const avHtml=avatarImgTag(p.username||p.owner,av,44);
  const likeCount=p.likes?Object.keys(p.likes).length:0;
  const repostCount=p.reposts?Object.keys(p.reposts).length:0;
  const liked=session&&p.likes&&p.likes[session.username];
  const reposted=session&&p.reposts&&p.reposts[session.username];
  const isOwner=session&&session.username===(p.username||p.owner);
  const imgHtml=p.image?`<div class="post-img"><img src="${esc(p.image)}" alt="投稿画像" loading="lazy"></div>`:'';
  const replyToHtml=p.replyTo?`<div class="post-reply-to">↩ <span>@${esc(p.replyTo.displayName||p.replyTo.username)}</span> への返信</div>`:'';
  // Quote embed
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
        <button class="post-dropdown-item danger" onclick="deletePost('${p.owner||p.username}','${p.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          削除
        </button>
      </div>
    </div>`:'<button class="post-menu-btn" style="opacity:0;pointer-events:none">　</button>';

  el.innerHTML=`
    <div class="post-avatar-col">
      ${avHtml}
      ${showThreadLine?'<div class="post-thread-line"></div>':''}
    </div>
    <div class="post-body">
      <div class="post-header">
        <span class="post-dispname" onclick="event.stopPropagation();openProfile('${esc(p.username||p.owner)}')" style="cursor:pointer">${esc(p.displayName||p.username||p.owner)}</span>
        <span class="post-username">@${esc(p.username||p.owner)}</span>
        <span class="post-dot">·</span>
        <span class="post-time">${timeAgo(p.ts)}</span>
        ${menuHtml}
      </div>
      ${replyToHtml}
      ${p.text?`<div class="post-text">${renderTextWithHashtags(p.text)}</div>`:''}
      ${imgHtml}
      ${quoteHtml}
      <div class="post-actions">
        <button class="post-action reply" onclick="event.stopPropagation();openReplyModal('${esc(p.owner||p.username)}','${p.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <span>${p.replyCount||0}</span>
        </button>
        <button class="post-action repost ${reposted?'reposted':''}" onclick="event.stopPropagation();openRepostModal('${esc(p.owner||p.username)}','${p.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
          <span>${repostCount}</span>
        </button>
        <button class="post-action like ${liked?'liked':''}" onclick="event.stopPropagation();toggleLike(event,'${esc(p.owner||p.username)}','${p.id}',this)">
          <svg viewBox="0 0 24 24" fill="${liked?'currentColor':'none'}" stroke="currentColor" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          <span>${likeCount}</span>
        </button>
        <button class="post-action share" onclick="event.stopPropagation();sharePost(event,'${p.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        </button>
      </div>
    </div>`;

  // Click post body → open thread
  el.addEventListener('click',()=>openThread(p.owner||p.username,p.id));
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
  if(liked)await ref.remove();else await ref.set(true);
  const countEl=btn.querySelector('span');const svg=btn.querySelector('svg');
  btn.classList.toggle('liked',!liked);svg.setAttribute('fill',!liked?'currentColor':'none');
  countEl.textContent=Math.max(0,(parseInt(countEl.textContent)||0)+(!liked?1:-1));
}

// ── Repost Modal ──
let _repostState={owner:'',postId:'',reposted:false};
function openRepostModal(owner,postId){
  if(!session){showToast('ログインが必要です');return;}
  _repostState={owner,postId,reposted:false};
  // Check if already reposted
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
  const ref=db.ref(`posts/${owner}/${postId}/reposts/${session.username}`);
  await ref.set(true);
  closeRepostModal();showToast('リポストしました');
  // Refresh post in feed
  await refreshPostInFeed(owner,postId);
}
async function doUndoRepost(){
  const {owner,postId}=_repostState;
  const ref=db.ref(`posts/${owner}/${postId}/reposts/${session.username}`);
  await ref.remove();
  closeRepostModal();showToast('リポストを取り消しました');
  await refreshPostInFeed(owner,postId);
}
async function refreshPostInFeed(owner,postId){
  // Update repost button counts in current feed view without full reload
  const btns=document.querySelectorAll(`.post[data-post-id="${postId}"] .post-action.repost`);
  if(!btns.length)return;
  const snap=await db.ref(`posts/${owner}/${postId}/reposts`).once('value');
  const count=snap.val()?Object.keys(snap.val()).length:0;
  const reposted=snap.val()&&snap.val()[session.username]===true;
  btns.forEach(btn=>{
    btn.classList.toggle('reposted',reposted);
    const span=btn.querySelector('span');if(span)span.textContent=count;
  });
}

// ── Quote Repost ──
async function openQuoteRepost(){
  closeRepostModal();
  const {owner,postId}=_repostState;
  // Load original post
  const snap=await db.ref(`posts/${owner}/${postId}`).once('value');
  const post=snap.val();
  if(!post){showToast('投稿が見つかりません');return;}
  _repostContext={owner,postId,post};
  // Fill quote preview
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
  const av=session._avatar||localStorage.getItem('fm_avatar_'+session.username)||null;
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
      ts:Date.now(),likes:{},reposts:{},replyCount:0,
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
let _replyImgB64=null;
async function openReplyModal(owner,postId){
  if(!session){showToast('ログインが必要です');return;}
  // Load the post
  const snap=await db.ref(`posts/${owner}/${postId}`).once('value');
  const post=snap.val();if(!post){showToast('投稿が見つかりません');return;}
  _replyModalCtx={owner,postId,post};
  // Check if mobile
  const isMobile=window.innerWidth<=800;
  if(isMobile){
    openMobileCompose({owner,postId,username:post.username,displayName:post.displayName||post.username,text:post.text||''});
    return;
  }
  // Desktop reply modal
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
  const myAv=session._avatar||localStorage.getItem('fm_avatar_'+session.username)||null;
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
      ts:Date.now(),likes:{},reposts:{},replyCount:0,
      replyTo:{owner,postId,username:post.username||owner,displayName:post.displayName||post.username||owner}
    };
    if(_replyImageBase64)newPost.image=_replyImageBase64;
    await db.ref('posts/'+session.username).push(newPost);
    await db.ref(`posts/${owner}/${postId}/replyCount`).transaction(c=>(c||0)+1);
    if(text)await saveHashtags(text);
    // Update replyCount in UI
    document.querySelectorAll(`.post[data-post-id="${postId}"] .post-action.reply span`).forEach(el=>{el.textContent=(parseInt(el.textContent)||0)+1;});
    closeReplyModal();showToast('返信しました');
    if(currentView==='thread')openThread(owner,postId);
    else if(currentView==='home')loadFeed();
  }catch(e){showToast('エラー: '+e.message);}
  finally{btn.disabled=false;}
}

// ── Thread View ──
async function openThread(owner,postId){
  currentView='thread';
  setView('thread');
  const el=document.getElementById('threadView');
  el.innerHTML='<div class="spinner"><div class="spin"></div>読み込み中...</div>';
  try{
    const snap=await db.ref(`posts/${owner}/${postId}`).once('value');
    const post=snap.val();if(!post){el.innerHTML='<div class="feed-empty">投稿が見つかりません</div>';return;}
    post.id=postId;post.owner=owner;
    const av=await getAvatarDataUrl(post.username||owner);
    const likeCount=post.likes?Object.keys(post.likes).length:0;
    const repostCount=post.reposts?Object.keys(post.reposts).length:0;
    const liked=session&&post.likes&&post.likes[session.username];
    const reposted=session&&post.reposts&&post.reposts[session.username];
    const avHtml=avatarImgTag(post.username||owner,av,48);
    const imgHtml=post.image?`<div class="post-img"><img src="${esc(post.image)}" alt="" loading="lazy"></div>`:'';
    let quoteHtml='';
    if(post.quoteOf){
      quoteHtml=`<div class="post-quote-embed" onclick="openThread('${esc(post.quoteOf.owner)}','${esc(post.quoteOf.postId)}')">
        <div class="qe-header"><span class="qe-name">${esc(post.quoteOf.displayName||post.quoteOf.username)}</span><span class="qe-uname">@${esc(post.quoteOf.username)}</span></div>
        <div class="qe-text">${esc((post.quoteOf.text||'').slice(0,100))}${(post.quoteOf.text||'').length>100?'…':''}</div>
      </div>`;
    }
    el.innerHTML=`
      <div style="padding:12px 16px;border-bottom:1px solid var(--line);cursor:pointer;display:flex;align-items:center;gap:8px;color:var(--white3);" onclick="history.back()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        <span style="font-size:.9rem;">戻る</span>
      </div>
      <div class="post-detail">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          ${avHtml.replace('class="post-avatar"','class="post-avatar" style="width:48px;height:48px;"')}
          <div>
            <div class="post-dispname" onclick="openProfile('${esc(post.username||owner)}')" style="cursor:pointer">${esc(post.displayName||post.username||owner)}</div>
            <div class="post-username">@${esc(post.username||owner)}</div>
          </div>
        </div>
        ${post.replyTo?`<div class="post-reply-to">↩ <span>@${esc(post.replyTo.displayName||post.replyTo.username)}</span> への返信</div>`:''}
        ${post.text?`<div class="post-text" style="font-size:1.15rem;margin-bottom:12px;">${renderTextWithHashtags(post.text)}</div>`:''}
        ${imgHtml}
        ${quoteHtml}
        <div style="font-size:.85rem;color:var(--white3);margin-bottom:8px;">${new Date(post.ts).toLocaleString('ja-JP')}</div>
        <div class="post-detail-meta">
          <span><strong>${repostCount}</strong> リポスト</span>
          <span><strong>${likeCount}</strong> いいね</span>
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
          <button class="post-action like ${liked?'liked':''}" onclick="toggleLike(event,'${esc(owner)}','${postId}',this)">
            <svg viewBox="0 0 24 24" fill="${liked?'currentColor':'none'}" stroke="currentColor" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            <span>${likeCount}</span>
          </button>
        </div>
      </div>
      <div class="thread-replies-head">返信</div>
      <div id="threadReplies"><div class="spinner"><div class="spin"></div></div></div>`;
    // Load replies
    loadReplies(owner,postId);
  }catch(e){el.innerHTML=`<div class="feed-empty">エラー: ${esc(e.message)}</div>`;}
}
async function loadReplies(owner,postId){
  const el=document.getElementById('threadReplies');if(!el)return;
  try{
    const usersSnap=await db.ref('users').once('value');
    const users=Object.keys(usersSnap.val()||{});
    const replyArrays=await Promise.all(users.map(u=>
      db.ref('posts/'+u).orderByChild('ts').once('value')
        .then(s=>{
          const d=s.val()||{};
          return Object.entries(d)
            .filter(([,p])=>p.replyTo&&p.replyTo.postId===postId&&p.replyTo.owner===owner)
            .map(([id,p])=>({id,owner:u,...p}));
        }).catch(()=>[])
    ));
    const replies=replyArrays.flat().sort((a,b)=>a.ts-b.ts);
    if(!replies.length){el.innerHTML='<div class="feed-empty" style="padding:30px">まだ返信がありません</div>';return;}
    await renderPosts(el,replies);
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
    else if(currentView==='thread'){setView('home');loadFeed();}
  }catch(e){showToast('エラー: '+e.message);}
}

function sharePost(e,postId){
  e.stopPropagation();
  if(navigator.share)navigator.share({title:'HGSNS',url:location.href});
  else{navigator.clipboard?.writeText(location.href);showToast('URLをコピーしました');}
}

// ── Follow ──
async function toggleFollow(targetUsername){
  if(!session){showToast('ログインが必要です');return;}
  if(targetUsername===session.username){showToast('自分はフォローできません');return;}
  const ref=db.ref(`follows/${session.username}/${targetUsername}`);
  const snap=await ref.once('value');const following=snap.val()===true;
  if(following)await ref.remove();else await ref.set(true);
  showToast(following?`@${targetUsername} のフォローを解除しました`:`@${targetUsername} をフォローしました`);
  return !following;
}

// ── Profile View ──
async function openProfile(username){
  viewedProfile=username;setView('profile');
  const el=document.getElementById('profileView');
  el.innerHTML='<div class="spinner"><div class="spin"></div>読み込み中...</div>';
  try{
    const snap=await db.ref('users/'+username).once('value');
    const u=snap.val()||{username};
    const av=await getAvatarDataUrl(username);
    const [followsSnap,followersSnap]=await Promise.all([db.ref('follows/'+username).once('value'),db.ref('follows').once('value')]);
    const followCount=followsSnap.val()?Object.values(followsSnap.val()).filter(v=>v===true).length:0;
    let followerCount=0;const allFollows=followersSnap.val()||{};
    for(const uid in allFollows){if(allFollows[uid][username]===true)followerCount++;}
    const isMe=session&&session.username===username;
    const isFollowing=session&&(await db.ref(`follows/${session.username}/${username}`).once('value')).val()===true;
    const actionBtn=isMe
      ?`<button class="profile-edit-btn" onclick="openEditProfile()">プロフィールを編集</button>`
      :`<button class="profile-follow-btn ${isFollowing?'following':''}" id="profileFollowBtn" onclick="onProfileFollow('${esc(username)}')">${isFollowing?'フォロー中':'フォロー'}</button>`;
    const cvId='profileAvatarCv_'+Date.now();
    el.innerHTML=`
      <div class="profile-header">
        <div class="profile-banner" style="background:linear-gradient(135deg,#0D1B2A,#1E2C3E,#C9A84C22)"></div>
        <div class="profile-info">
          <div class="profile-avatar-wrap">
            <canvas id="${cvId}" class="profile-avatar" width="84" height="84"></canvas>
            ${actionBtn}
          </div>
          <div class="profile-dispname">${esc(u.displayName||username)}</div>
          <div class="profile-username">@${esc(username)}</div>
          ${u.bio?`<div class="profile-bio">${esc(u.bio)}</div>`:''}
          <div class="profile-stats">
            <div class="profile-stat"><a onclick="openFollowList('${esc(username)}','follows')" style="cursor:pointer"><strong>${followCount}</strong> <span>フォロー中</span></a></div>
            <div class="profile-stat"><a onclick="openFollowList('${esc(username)}','followers')" style="cursor:pointer"><strong>${followerCount}</strong> <span>フォロワー</span></a></div>
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
    const posts=Object.entries(data).map(([id,p])=>({id,owner:username,...p})).sort((a,b)=>b.ts-a.ts);
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
    for(const u of users){
      const uSnap=await db.ref('users/'+u).once('value');const ud=uSnap.val()||{username:u};
      const av=await getAvatarDataUrl(u);const cvId='flav_'+u;
      const item=document.createElement('div');item.className='follow-user-item';
      item.innerHTML=`<canvas id="${cvId}" class="suggest-avatar" width="40" height="40"></canvas>
        <div class="suggest-info"><div class="suggest-name">${esc(ud.displayName||u)}</div><div class="suggest-uname">@${esc(u)}</div></div>`;
      item.onclick=()=>{closeFollowList();openProfile(u);};
      body.appendChild(item);
      drawAvatarCanvas(document.getElementById(cvId),u,av,40);
    }
  }catch(e){document.getElementById('followListBody').innerHTML=`<div class="feed-empty">エラー: ${esc(e.message)}</div>`;}
}
function closeFollowList(){document.getElementById('followListOverlay').classList.remove('open');}

// ── Hashtag View ──
async function openHashtag(tag){
  setView('hashtag');
  const el=document.getElementById('hashtagView');
  el.innerHTML='<div class="spinner"><div class="spin"></div>読み込み中...</div>';
  const normalTag=tag.toLowerCase();
  try{
    const usersSnap=await db.ref('users').once('value');
    const users=Object.keys(usersSnap.val()||{});
    const postArrays=await Promise.all(users.map(u=>
      db.ref('posts/'+u).orderByChild('ts').limitToLast(50).once('value')
        .then(s=>{const d=s.val()||{};return Object.entries(d).filter(([,p])=>p.text&&extractHashtags(p.text).includes(normalTag)).map(([id,p])=>({id,owner:u,...p}));})
        .catch(()=>[])
    ));
    const posts=postArrays.flat().sort((a,b)=>b.ts-a.ts);
    el.innerHTML=`
      <div style="padding:12px 16px;border-bottom:1px solid var(--line);cursor:pointer;display:flex;align-items:center;gap:8px;color:var(--white3);" onclick="history.back()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </div>
      <div class="hashtag-header">
        <div>
          <div class="hashtag-title">${esc(tag)}</div>
          <div class="hashtag-count">${posts.length} 件の投稿</div>
        </div>
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
    // Sort by recent activity (lastUsed + count weighted)
    const now=Date.now();
    const trends=Object.entries(data)
      .map(([key,v])=>{
        const age=Math.max(1,(now-v.lastUsed)/(1000*60*60)); // hours
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
  if(!trends.length){el.innerHTML='<div style="padding:12px 16px;font-size:.85rem;color:var(--white3)">まだトレンドがありません</div>';return;}
  el.innerHTML='';
  trends.slice(0,5).forEach((t,i)=>{
    const item=document.createElement('div');item.className='trend-item';
    item.innerHTML=`<span class="trend-rank">${i+1}</span>
      <div class="trend-info">
        <div class="trend-tag">${esc(t.tag)}</div>
        <div class="trend-count">${t.count} 件の投稿</div>
      </div>`;
    item.onclick=()=>openHashtag(t.tag);
    el.appendChild(item);
  });
}

async function loadTrendView(){
  const el=document.getElementById('trendView');
  if(!el)return;
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
        <div class="trend-count">${t.count} 件の投稿</div>
      </div>
      <span class="trend-badge">トレンド</span>`;
    item.onclick=()=>openHashtag(t.tag);
    el.appendChild(item);
  });
}

// ── Search ──
async function doSearch(){
  const q=(document.getElementById('searchInput')?.value||document.getElementById('rightSearchInput')?.value||'').trim().toLowerCase();
  setView('search');
  const el=document.getElementById('searchView');
  if(!q){el.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">🔍</span>キーワードを入力してください</div>';return;}
  // Hashtag search
  if(q.startsWith('#')){openHashtag(q);return;}
  el.innerHTML='<div class="spinner"><div class="spin"></div></div>';
  try{
    const snap=await db.ref('users').once('value');
    const users=snap.val()||{};
    const matched=Object.entries(users).filter(([k,v])=>k.toLowerCase().includes(q)||(v.displayName||'').toLowerCase().includes(q));
    if(!matched.length){el.innerHTML='<div class="feed-empty"><span class="feed-empty-icon">🔍</span>ユーザーが見つかりませんでした</div>';return;}
    el.innerHTML='<div style="padding:16px;font-weight:700;font-size:.9rem;color:var(--white3);border-bottom:1px solid var(--line)">ユーザー検索結果</div>';
    for(const [uname,u] of matched){
      const av=await getAvatarDataUrl(uname);const cvId='srav_'+uname;
      const item=document.createElement('div');item.className='follow-user-item';
      item.innerHTML=`<canvas id="${cvId}" class="suggest-avatar" width="40" height="40"></canvas>
        <div class="suggest-info"><div class="suggest-name">${esc(u.displayName||uname)}</div><div class="suggest-uname">@${esc(uname)}</div></div>`;
      item.onclick=()=>openProfile(uname);
      el.appendChild(item);
      drawAvatarCanvas(document.getElementById(cvId),uname,av,40);
    }
  }catch(e){el.innerHTML=`<div class="feed-empty">エラー: ${esc(e.message)}</div>`;}
}
function onSearchInput(e){if(e.key==='Enter')doSearch();}
function copySearchAndGo(val){
  const el=document.getElementById('searchInput');if(el)el.value=val;
  doSearch();
}

// ── View Management ──
const ALL_VIEWS=['home','profile','search','trend','hashtag','thread'];
function setView(view){
  currentView=view;
  document.querySelectorAll('.sidebar-nav-item[data-view]').forEach(el=>el.classList.toggle('active',el.dataset.view===view));
  // Show/hide panels
  document.getElementById('homeView').style.display=view==='home'?'block':'none';
  document.getElementById('profileViewWrap').style.display=view==='profile'?'block':'none';
  document.getElementById('searchViewWrap').style.display=view==='search'?'block':'none';
  document.getElementById('trendViewWrap').style.display=view==='trend'?'block':'none';
  document.getElementById('hashtagViewWrap').style.display=view==='hashtag'?'block':'none';
  document.getElementById('threadViewWrap').style.display=view==='thread'?'block':'none';
  const titles={home:'ホーム',profile:'プロフィール',search:'検索',trend:'トレンド',hashtag:'ハッシュタグ',thread:'投稿'};
  document.getElementById('feedHeaderTitle').textContent=titles[view]||'HGSNS';
  document.querySelector('.sns-feed').scrollTop=0;
  // Lazy load trend view
  if(view==='trend')loadTrendView();
}
function onFeedTabClick(){
  if(currentView==='home')loadFeed();
  else{setView('home');loadFeed();}
}

// ── Right Panel: Suggest Users ──
async function loadSuggestUsers(){
  const el=document.getElementById('suggestUsers');if(!el)return;
  try{
    const snap=await db.ref('users').once('value');
    const users=snap.val()||{};
    const keys=Object.keys(users).filter(u=>u!==(session?.username)).slice(0,4);
    el.innerHTML='';
    for(const u of keys){
      const ud=users[u];const av=await getAvatarDataUrl(u);const cvId='sgav_'+u;
      const followSnap=session?await db.ref(`follows/${session.username}/${u}`).once('value'):null;
      const isFollowing=followSnap?.val()===true;
      const item=document.createElement('div');item.className='suggest-user';
      item.innerHTML=`<canvas id="${cvId}" class="suggest-avatar" width="40" height="40"></canvas>
        <div class="suggest-info" onclick="openProfile('${esc(u)}')"><div class="suggest-name">${esc(ud.displayName||u)}</div><div class="suggest-uname">@${esc(u)}</div></div>
        <button class="follow-btn ${isFollowing?'following':''}" id="sfbtn_${u}" onclick="onSuggestFollow('${esc(u)}')">${isFollowing?'フォロー中':'フォロー'}</button>`;
      el.appendChild(item);
      drawAvatarCanvas(document.getElementById(cvId),u,av,40);
    }
  }catch(e){}
}
async function onSuggestFollow(username){
  const following=await toggleFollow(username);
  const btn=document.getElementById('sfbtn_'+username);
  if(btn){btn.textContent=following?'フォロー中':'フォロー';btn.className='follow-btn '+(following?'following':'');}
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
});
