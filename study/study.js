const FIREBASE_CONFIG_BIN = "01111011 00100010 01100001 01110000 01101001 01001011 01100101 01111001 00100010 00111010 00100010 01000001 01001001 01111010 01100001 01010011 01111001 01000011 01100110 00111000 01010000 01001010 01011001 01111000 01000011 01001010 01000011 01000110 01000011 01000100 00110001 01110000 01101000 01000100 01011111 00101101 01011000 01010110 01010101 01011010 00111001 00110010 01000100 01010011 01010110 01110101 01010010 01100001 01110101 01010101 00100010 00101100 00100010 01100001 01110101 01110100 01101000 01000100 01101111 01101101 01100001 01101001 01101110 00100010 00111010 00100010 01101000 01100111 01110011 01110100 01110101 01100100 01111001 00101101 00110001 00111000 01100101 00110010 00110011 00101110 01100110 01101001 01110010 01100101 01100010 01100001 01110011 01100101 01100001 01110000 01110000 00101110 01100011 01101111 01101101 00100010 00101100 00100010 01100100 01100001 01110100 01100001 01100010 01100001 01110011 01100101 01010101 01010010 01001100 00100010 00111010 00100010 01101000 01110100 01110100 01110000 01110011 00111010 00101111 00101111 01101000 01100111 01110011 01110100 01110101 01100100 01111001 00101101 00110001 00111000 01100101 00110010 00110011 00101101 01100100 01100101 01100110 01100001 01110101 01101100 01110100 00101101 01110010 01110100 01100100 01100010 00101110 01100001 01110011 01101001 01100001 00101101 01110011 01101111 01110101 01110100 01101000 01100101 01100001 01110011 01110100 00110001 00101110 01100110 01101001 01110010 01100101 01100010 01100001 01110011 01100101 01100100 01100001 01110100 01100001 01100010 01100001 01110011 01100101 00101110 01100001 01110000 01110000 00100010 00101100 00100010 01110000 01110010 01101111 01101010 01100101 01100011 01110100 01001001 01100100 00100010 00111010 00100010 01101000 01100111 01110011 01110100 01110101 01100100 01111001 00101101 00110001 00111000 01100101 00110010 00110011 00100010 00101100 00100010 01110011 01110100 01101111 01110010 01100001 01100111 01100101 01000010 01110101 01100011 01101011 01100101 01110100 00100010 00111010 00100010 01101000 01100111 01110011 01110100 01110101 01100100 01111001 00101101 00110001 00111000 01100101 00110010 00110011 00101110 01100110 01101001 01110010 01100101 01100010 01100001 01110011 01100101 01110011 01110100 01101111 01110010 01100001 01100111 01100101 00101110 01100001 01110000 01110000 00100010 00101100 00100010 01101101 01100101 01110011 01110011 01100001 01100111 01101001 01101110 01100111 01010011 01100101 01101110 01100100 01100101 01110010 01001001 01100100 00100010 00111010 00100010 00110111 00110010 00110000 00110001 00110101 00110000 00110111 00110001 00110010 00110111 00110111 00110101 00100010 00101100 00100010 01100001 01110000 01110000 01001001 01100100 00100010 00111010 00100010 00110001 00111010 00110111 00110010 00110000 00110001 00110101 00110000 00110111 00110001 00110010 00110111 00110111 00110101 00111010 01110111 01100101 01100010 00111010 00110110 00110011 00110010 01100010 00110010 01100010 01100100 00110110 01100110 00110000 00110100 00110100 00110001 01100001 00111000 00110011 01100100 00110111 00110100 00111001 01100101 00110010 00100010 00101100 00100010 01101101 01100101 01100001 01110011 01110101 01110010 01100101 01101101 01100101 01101110 01110100 01001001 01100100 00100010 00111010 00100010 01000111 00101101 01011001 00110000 00110101 00110110 00110001 00110001 00110110 01010010 01010001 01001101 00100010 01111101";

function bin2str(b){const c=b.replace(/[^01]/g,'');if(!c)return'';return c.match(/.{1,8}/g).filter(x=>x.length===8).map(b=>String.fromCharCode(parseInt(b,2))).join('');}

const MAX_CARDS=150,MAX_FIELD=500,MAX_NAME=80,MAX_LOAD=50;
const TTL_D=3*60*1000,TTL_C=10*60*1000,LOAD_TIMEOUT=5000;

let db=null,session=null,myFavs={};
let currentTab='all',currentTagFilter='',currentSort='popular',selectedTag='',selectedBlogTag='';
let currentDeckId=null,currentDeckName='',editCards=[];
let currentBlogId=null,currentBlogData=null;
let _currentBlogAuthorUid='';
let studyCards=[],studyIdx=0,studyFlipped=false,studySeenAll=false,studyCorrect=0;
let quizCards=[],quizIdx=0,quizScore=0;
let dragSrcIdx=null;
let touchDragActive=false,touchDragIdx=null,touchDragGhost=null,touchDragOriginEl=null;
let _pendingAvatarData=null;




function setCookie(name,value,days){try{const exp=days?'; expires='+new Date(Date.now()+days*864e5).toUTCString():'';const secure=location.protocol==='https:'?'; Secure':'';document.cookie=name+'='+encodeURIComponent(value)+exp+'; path=/; SameSite=Lax'+secure;}catch(e){}}
function getCookie(name){try{const match=document.cookie.split('; ').find(row=>row.startsWith(name+'='));return match?decodeURIComponent(match.split('=').slice(1).join('=')):null;}catch(e){return null;}}
function deleteCookie(name){document.cookie=name+'=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';}

function cSet(k,v){try{localStorage.setItem(k,JSON.stringify({ts:Date.now(),v}))}catch(e){}}
function cGet(k,ttl){try{const r=JSON.parse(localStorage.getItem(k)||'null');return r&&Date.now()-r.ts<ttl?r.v:null}catch(e){return null}}
function cDel(k){localStorage.removeItem(k);}

async function hashPass(pw){const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('hgstudy:'+pw));return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');}

function initFirebase(){
  let cfg=null;
  if(FIREBASE_CONFIG_BIN&&FIREBASE_CONFIG_BIN.trim().length>20){try{cfg=JSON.parse(bin2str(FIREBASE_CONFIG_BIN))}catch(e){}}
  if(!cfg){try{cfg=JSON.parse(localStorage.getItem('fm_cfg')||'null')}catch(e){}}
  if(!cfg||!cfg.apiKey){db=null;return false;}
  try{if(!firebase.apps.length)firebase.initializeApp(cfg);db=firebase.database();localStorage.setItem('fm_cfg',JSON.stringify(cfg));return true;}
  catch(e){db=null;return false;}
}

function loadSession(){
  try{
    let s=null;
    const cookieVal=getCookie('hg_session');
    const lsVal=localStorage.getItem('hg_session_ls');
    if(cookieVal){try{s=JSON.parse(cookieVal);}catch(e){}}
    if(!s&&lsVal){try{s=JSON.parse(lsVal);}catch(e){}}
    if(s&&s.uid)session=s;
  }catch(e){}
  updateHeaderUI();
}
function saveSession(s){session=s;const str=JSON.stringify(s);setCookie('hg_session',str,30);try{localStorage.setItem('hg_session_ls',str);}catch(e){}}
function clearSession(){session=null;deleteCookie('hg_session');try{localStorage.removeItem('hg_session_ls');}catch(e){};myFavs={};}

const AVATAR_COLORS=[['#7B6CF6','#B06EF6'],['#F5835B','#F6C344'],['#52C4A3','#3B82F6'],['#E65B9A','#F5835B'],['#4B8DEA','#52C4A3'],['#A068F5','#F5835B']];
function avatarColorForName(name){let hash=0;for(let i=0;i<name.length;i++)hash=(hash*31+name.charCodeAt(i))&0xffff;return AVATAR_COLORS[hash%AVATAR_COLORS.length];}
function drawAvatarCanvas(canvas,username,imageData,size){
  if(!canvas)return;
  const s=size||canvas.width;canvas.width=s;canvas.height=s;
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,s,s);
  if(imageData){const img=new Image();img.onload=function(){ctx.save();ctx.beginPath();ctx.arc(s/2,s/2,s/2,0,Math.PI*2);ctx.clip();ctx.drawImage(img,0,0,s,s);ctx.restore();};img.src=imageData;}
  else{const colors=avatarColorForName(username||'?');const g=ctx.createLinearGradient(0,0,s,s);g.addColorStop(0,colors[0]);g.addColorStop(1,colors[1]);ctx.fillStyle=g;ctx.beginPath();ctx.arc(s/2,s/2,s/2,0,Math.PI*2);ctx.fill();const initials=(username||'?').slice(0,2).toUpperCase();ctx.fillStyle='rgba(255,255,255,0.92)';ctx.font=`bold ${Math.round(s*0.36)}px "Plus Jakarta Sans",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(initials,s/2,s/2);}
}
async function getAvatarData(username){if(!username)return null;try{const v=localStorage.getItem('fm_avatar_'+username);if(v)return v;}catch(e){}if(db){try{const snap=await db.ref('users/'+username+'/avatar').once('value');const v=snap.val();if(v){try{localStorage.setItem('fm_avatar_'+username,v);}catch(e){};return v;}}catch(e){}}return null;}
function cacheAvatarData(username,data){try{localStorage.setItem('fm_avatar_'+username,data||'');}catch(e){}}

function updateHeaderUI(){
  const li=document.getElementById('hdrLoginBtn'),re=document.getElementById('hdrRegBtn'),ub=document.getElementById('hdrUserBtn');
  if(session){li.style.display='none';re.style.display='none';ub.style.display='flex';document.getElementById('hdrUserName').textContent=session.displayName||session.username;document.getElementById('acctMenuDispName').textContent=session.displayName||session.username;document.getElementById('acctMenuUsername').textContent='@'+session.username;const av=localStorage.getItem('fm_avatar_'+session.username)||null;drawAvatarCanvas(document.getElementById('hdrAvatarCanvas'),session.username,av,24);drawAvatarCanvas(document.getElementById('acctMenuAvatarCanvas'),session.username,av,38);}
  else{li.style.display='flex';re.style.display='flex';ub.style.display='none';}
}
function toggleAcctMenu(){document.getElementById('acctMenu').classList.toggle('open');}
function closeAcctMenu(){document.getElementById('acctMenu').classList.remove('open');}
document.addEventListener('click',function(e){const m=document.getElementById('acctMenu');if(m&&!m.contains(e.target)&&e.target!==document.getElementById('hdrUserBtn')&&!document.getElementById('hdrUserBtn').contains(e.target))m.classList.remove('open');});
function logout(){clearSession();updateHeaderUI();showToast('ログアウトしました');goHome();}

let authMode='login';
function showAuth(mode){switchAuthTab(mode||'login');showView('auth');setTimeout(()=>document.getElementById('authUser').focus(),100);}
function switchAuthTab(mode){authMode=mode;document.getElementById('authTabLogin').classList.toggle('on',mode==='login');document.getElementById('authTabReg').classList.toggle('on',mode==='reg');document.getElementById('authConfirmWrap').style.display=mode==='reg'?'block':'none';document.getElementById('authGenWrap').style.display=mode==='reg'?'block':'none';document.getElementById('authBtn').textContent=mode==='login'?'ログイン':'アカウントを作成';document.getElementById('authErr').classList.remove('show');}
function showAuthErr(msg){const el=document.getElementById('authErr');el.textContent=msg;el.classList.add('show');}
async function authSubmit(){
  const username=document.getElementById('authUser').value.trim().toLowerCase(),pass=document.getElementById('authPass').value;
  document.getElementById('authErr').classList.remove('show');
  if(!username){showAuthErr('ユーザー名を入力してください');return;}
  if(username.length<2||username.length>20){showAuthErr('ユーザー名は2〜20文字にしてください');return;}
  if(!/^[a-zA-Z0-9_]+$/.test(username)){showAuthErr('ユーザー名は英数字・アンダースコアのみ使用可能です');return;}
  if(pass.length<6){showAuthErr('パスワードは6文字以上にしてください');return;}
  if(authMode==='reg'){const c=document.getElementById('authPassConfirm').value;if(pass!==c){showAuthErr('パスワードが一致しません');return;}const gen=document.getElementById('authGen').value;if(!gen){showAuthErr('期を選択してください');return;}await doRegister(username,pass,gen);}
  else await doLogin(username,pass);
}
async function doRegister(username,pass,gen){
  const btn=document.getElementById('authBtn');btn.textContent='登録中...';btn.disabled=true;
  try{const hash=await hashPass(pass);if(db){const snap=await db.ref('users/'+username).once('value');if(snap.exists()){showAuthErr('このユーザー名はすでに使われています');return;}await db.ref('users/'+username).set({username,hash,displayName:username,bio:'',avatar:'',gen:gen||'',created:Date.now()});}else{const users=JSON.parse(localStorage.getItem('fm_users')||'{}');if(users[username]){showAuthErr('このユーザー名はすでに使われています');return;}users[username]={username,hash,displayName:username,bio:'',avatar:'',gen:gen||'',created:Date.now()};localStorage.setItem('fm_users',JSON.stringify(users));}
  saveSession({uid:username,username,displayName:username,gen:gen||''});updateHeaderUI();showToast('アカウントを作成しました！');goHome();}
  catch(e){showAuthErr('エラー: '+e.message);}finally{btn.textContent='アカウントを作成';btn.disabled=false;}
}
async function doLogin(username,pass){
  const btn=document.getElementById('authBtn');btn.textContent='確認中...';btn.disabled=true;
  try{const hash=await hashPass(pass);let stored=null;if(db){const snap=await db.ref('users/'+username).once('value');stored=snap.val();}else{const users=JSON.parse(localStorage.getItem('fm_users')||'{}');stored=users[username]||null;}if(!stored||stored.hash!==hash){showAuthErr('ユーザー名またはパスワードが間違っています');return;}
  const sData={uid:username,username,displayName:stored.displayName||username,gen:stored.gen||''};saveSession(sData);if(stored.avatar){cacheAvatarData(username,stored.avatar);}await loadFavorites();await loadMyFollowing();updateHeaderUI();showToast('ログインしました！');goHome();}
  catch(e){showAuthErr('エラー: '+e.message);}finally{btn.textContent='ログイン';btn.disabled=false;}
}

async function loadFavorites(){if(!session){myFavs={};return;}if(db){try{const snap=await db.ref('favs/'+session.uid).once('value');myFavs=snap.val()||{};return;}catch(e){}}try{myFavs=JSON.parse(localStorage.getItem('fm_favs_'+session.uid)||'{}')}catch(e){myFavs={};}}
async function toggleFav(deckId){
  if(!session){showToast('お気に入りにはログインが必要です');showAuth('login');return;}
  const was=!!myFavs[deckId];if(was)delete myFavs[deckId];else myFavs[deckId]=true;
  const btn=document.querySelector('.dk-fav[data-id="'+deckId+'"]'),cnt=document.querySelector('.fav-cnt[data-id="'+deckId+'"]');
  if(btn){btn.classList.toggle('on',!was);btn.innerHTML=was?'☆':'★';}
  const curCnt=parseInt((cnt&&cnt.textContent)||'0');if(cnt){cnt.textContent=Math.max(0,curCnt+(was?-1:1));}
  showToast(was?'お気に入りから削除しました':'★ お気に入りに追加しました！');
  if(db){try{if(was)await db.ref('favs/'+session.uid+'/'+deckId).remove();else await db.ref('favs/'+session.uid+'/'+deckId).set(true);const newFc=Math.max(0,curCnt+(was?-1:1));await db.ref('decks/'+deckId+'/fc').set(newFc);cDel('fm_dcache');}catch(e){}}
  const ls=JSON.parse(localStorage.getItem('fm_favs_'+session.uid)||'{}');if(was)delete ls[deckId];else ls[deckId]=true;localStorage.setItem('fm_favs_'+session.uid,JSON.stringify(ls));
}

function lsD(){try{return JSON.parse(localStorage.getItem('fm_decks')||'{}')}catch(e){return{}}}
function lsSD(d){localStorage.setItem('fm_decks',JSON.stringify(d))}
function lsC(id){try{return JSON.parse(localStorage.getItem('fm_c_'+id)||'{}')}catch(e){return{}}}
function lsSC(id,c){localStorage.setItem('fm_c_'+id,JSON.stringify(c))}
function lsDD(id){const d=lsD();delete d[id];lsSD(d);localStorage.removeItem('fm_c_'+id);}
function withTimeout(p,ms){return Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),ms))]);}
async function fetchDecks(force){if(!force){const c=cGet('fm_dcache',TTL_D);if(c)return c;}if(db){try{const snap=await withTimeout(db.ref('decks').limitToLast(MAX_LOAD).once('value'),LOAD_TIMEOUT);const data=snap.val()||{};cSet('fm_dcache',data);return data;}catch(e){if(e.message==='timeout')throw e;}}return lsD();}
async function fetchCards(id,force){if(!force){const c=cGet('fm_cc_'+id,TTL_C);if(c)return c;}if(db){try{const snap=await withTimeout(db.ref('cards/'+id).once('value'),LOAD_TIMEOUT);const data=snap.val()||{};cSet('fm_cc_'+id,data);return data;}catch(e){}}return lsC(id);}
async function writeDeck(id,data){if(db){try{await db.ref('decks/'+id).set(data);cDel('fm_dcache');}catch(e){}}const d=lsD();d[id]=data;lsSD(d);}
async function writeCards(id,cards){if(db){try{await db.ref('cards/'+id).set(cards);cDel('fm_cc_'+id);}catch(e){}}lsSC(id,cards);}
async function deleteDeckData(id){if(db){try{await db.ref('decks/'+id).remove();await db.ref('cards/'+id).remove();cDel('fm_dcache');cDel('fm_cc_'+id);}catch(e){}}lsDD(id);}
async function incrementViewCount(deckId){try{if(db){await db.ref('decks/'+deckId+'/vc').transaction(v=>(v||0)+1);cDel('fm_dcache');}const d=lsD();if(d[deckId]){d[deckId].vc=(d[deckId].vc||0)+1;lsSD(d);}}catch(e){}}

function lsB(){try{return JSON.parse(localStorage.getItem('fm_blogs')||'{}')}catch(e){return{}}}
function lsSB(d){localStorage.setItem('fm_blogs',JSON.stringify(d))}
function lsDB(id){const d=lsB();delete d[id];lsSB(d);}
async function fetchBlogs(force){if(!force){const c=cGet('fm_bcache',TTL_D);if(c)return c;}if(db){try{const snap=await withTimeout(db.ref('blogs').limitToLast(MAX_LOAD).once('value'),LOAD_TIMEOUT);const data=snap.val()||{};cSet('fm_bcache',data);return data;}catch(e){if(e.message==='timeout')throw e;}}return lsB();}
async function writeBlog(id,data){if(db){try{await db.ref('blogs/'+id).set(data);cDel('fm_bcache');}catch(e){}}const d=lsB();d[id]=data;lsSB(d);}
async function deleteBlogData(id){if(db){try{await db.ref('blogs/'+id).remove();cDel('fm_bcache');}catch(e){}}lsDB(id);}

async function logHistory(deckId,deckName,mode,correct,total){const uid=session?session.uid:'guest';const entry={deckId,deckName,mode,correct,total,score:total>0?Math.round(correct/total*100):0,ts:Date.now(),date:new Date().toISOString().slice(0,10)};if(db&&session){try{await db.ref('logs/'+uid).push(entry);}catch(e){}}try{const key='fm_logs_'+uid;const logs=JSON.parse(localStorage.getItem(key)||'[]');logs.push(entry);if(logs.length>300)logs.splice(0,logs.length-300);localStorage.setItem(key,JSON.stringify(logs));}catch(e){}}
async function fetchHistory(){const uid=session?session.uid:'guest';if(db&&session){try{const snap=await withTimeout(db.ref('logs/'+uid).limitToLast(200).once('value'),LOAD_TIMEOUT);return snap.val()?Object.values(snap.val()):[];}catch(e){}}try{return JSON.parse(localStorage.getItem('fm_logs_'+uid)||'[]')}catch(e){return[];}}

async function fetchUserProfile(username){if(db){try{const snap=await db.ref('users/'+username).once('value');return snap.val();}catch(e){}}try{const u=JSON.parse(localStorage.getItem('fm_users')||'{}');return u[username]||null;}catch(e){return null;}}
async function updateUserProfile(username,updates){if(db){try{await db.ref('users/'+username).update(updates);}catch(e){}}try{const u=JSON.parse(localStorage.getItem('fm_users')||'{}');u[username]={...u[username],...updates};localStorage.setItem('fm_users',JSON.stringify(u));}catch(e){}}

let _viewingUsername='';
async function openMyProfile(){if(!session){showAuth('login');return;}await openProfileByUsername(session.username);}
async function openProfileByUsername(username){
  if(!username)return;
  _viewingUsername=username;
  const isOwn=session&&session.username===username;
  showView('profile');
  document.getElementById('profileViewLabel').textContent=isOwn?'マイプロフィール':username+'のプロフィール';
  document.getElementById('profileAvatarEditBtn').style.display=isOwn?'flex':'none';
  const profile=await fetchUserProfile(username);
  const displayName=(profile&&profile.displayName)||username;
  const bio=(profile&&profile.bio)||'';
  const avatar=(profile&&profile.avatar)||null;
  if(avatar)cacheAvatarData(username,avatar);
  const cachedAv=localStorage.getItem('fm_avatar_'+username)||avatar||null;
  drawAvatarCanvas(document.getElementById('profileBigAvatar'),username,cachedAv,96);
  document.getElementById('profileDisplayName').textContent=displayName;
  document.getElementById('profileUsernameLabel').textContent='@'+username;
  document.getElementById('profileBio').textContent=bio;
  const actEl=document.getElementById('profileActions');
  if(isOwn){actEl.innerHTML='<button class="btn btn-primary btn-sm" onclick="openProfileEdit()">✎ プロフィールを編集</button>';}
  else if(session){const isFollowing=!!_myFollowing[username];actEl.innerHTML='<button id="followBtn" class="follow-btn '+(isFollowing?'unfollow':'follow')+'" onclick="toggleFollow(''+esc(username)+'')">'+(isFollowing?'フォロー中':'フォローする')+'</button>';}
  else{actEl.innerHTML='<button class="btn btn-ghost btn-sm" onclick="showAuth('login')">フォローする</button>';}
  if(db){db.ref('follows').once('value').then(snap=>{const all=snap.val()||{};const followers=Object.values(all).filter(v=>v&&v[username]).length;document.getElementById('profileFollowerCount').textContent=followers;}).catch(()=>{});db.ref('follows/'+username).once('value').then(snap=>{document.getElementById('profileFollowingCount').textContent=Object.keys(snap.val()||{}).length;}).catch(()=>{});}
  const [allDecks,allBlogs]=await Promise.all([fetchDecks(false),fetchBlogs(false)]);
  const userDecks=Object.entries(allDecks||{}).filter(([,d])=>d.uid===username);
  const userBlogs=Object.entries(allBlogs||{}).filter(([,b])=>b.uid===username);
  const totalFavs=userDecks.reduce((s,[,d])=>s+(d.fc||0),0);
  document.getElementById('profileDeckCount').textContent=userDecks.length;
  document.getElementById('profileBlogCount').textContent=userBlogs.length;
  document.getElementById('profileTotalFavs').textContent=totalFavs;
  loadProfileStreak(username);
  const dGrid=document.getElementById('profileDeckGrid');const dEmpty=document.getElementById('profileDeckEmpty');
  if(userDecks.length){dGrid.style.display='grid';dEmpty.style.display='none';dGrid.innerHTML='';userDecks.sort((a,b)=>(b[1].fc||0)-(a[1].fc||0));userDecks.forEach(([id,d])=>{dGrid.appendChild(mkDeckCard(id,d,isOwn));});}
  else{dGrid.style.display='none';dEmpty.style.display='block';}
  const bGrid=document.getElementById('profileBlogGrid');const bEmpty=document.getElementById('profileBlogEmpty');
  if(userBlogs.length){bGrid.style.display='grid';bEmpty.style.display='none';bGrid.innerHTML='';userBlogs.sort((a,b)=>(b[1].ut||0)-(a[1].ut||0));userBlogs.forEach(([id,b])=>{bGrid.appendChild(mkBlogCard(id,b,isOwn));});}
  else{bGrid.style.display='none';bEmpty.style.display='block';}
}

function openProfileEdit(){if(!session)return;_pendingAvatarData=null;const cachedAv=localStorage.getItem('fm_avatar_'+session.username)||null;drawAvatarCanvas(document.getElementById('profileEditAvatarPreview'),session.username,cachedAv,72);document.getElementById('profileEditDisplayName').value=session.displayName||session.username;fetchUserProfile(session.username).then(p=>{document.getElementById('profileEditBio').value=(p&&p.bio)||'';});document.getElementById('profileEditOv').classList.add('open');}
function closeProfileEdit(){document.getElementById('profileEditOv').classList.remove('open');_pendingAvatarData=null;}
function handleProfileEditAvatar(event){const file=event.target.files[0];if(!file)return;if(file.size>2*1024*1024){showToast('画像は2MB以下にしてください');return;}const reader=new FileReader();reader.onload=function(e){const img=new Image();img.onload=function(){const canvas=document.createElement('canvas');canvas.width=canvas.height=200;const ctx=canvas.getContext('2d');const s=Math.min(img.width,img.height);const ox=(img.width-s)/2,oy=(img.height-s)/2;ctx.drawImage(img,ox,oy,s,s,0,0,200,200);_pendingAvatarData=canvas.toDataURL('image/jpeg',0.8);drawAvatarCanvas(document.getElementById('profileEditAvatarPreview'),session.username,_pendingAvatarData,72);};img.src=e.target.result;};reader.readAsDataURL(file);}
async function saveProfile(){if(!session)return;const displayName=document.getElementById('profileEditDisplayName').value.trim().slice(0,20)||session.username;const bio=document.getElementById('profileEditBio').value.trim().slice(0,140);const updates={displayName,bio};if(_pendingAvatarData){updates.avatar=_pendingAvatarData;cacheAvatarData(session.username,_pendingAvatarData);}await updateUserProfile(session.username,updates);session.displayName=displayName;saveSession(session);updateHeaderUI();closeProfileEdit();showToast('プロフィールを更新しました ✓');if(document.getElementById('view-profile').classList.contains('active')){await openProfileByUsername(session.username);}}
async function handleAvatarUpload(event){const file=event.target.files[0];if(!file)return;if(file.size>2*1024*1024){showToast('画像は2MB以下にしてください');return;}const reader=new FileReader();reader.onload=function(e){const img=new Image();img.onload=async function(){const canvas=document.createElement('canvas');canvas.width=canvas.height=200;const ctx=canvas.getContext('2d');const s=Math.min(img.width,img.height);const ox=(img.width-s)/2,oy=(img.height-s)/2;ctx.drawImage(img,ox,oy,s,s,0,0,200,200);const data=canvas.toDataURL('image/jpeg',0.8);cacheAvatarData(session.username,data);await updateUserProfile(session.username,{avatar:data});session.displayName=session.displayName||session.username;saveSession(session);updateHeaderUI();drawAvatarCanvas(document.getElementById('profileBigAvatar'),session.username,data,96);showToast('プロフィール画像を更新しました ✓');};img.src=e.target.result;};reader.readAsDataURL(file);}

function setTagFilter(tag){currentTagFilter=tag;document.querySelectorAll('.tag-chip').forEach(el=>el.classList.toggle('on',el.dataset.tag===tag));renderCurrentContent();}
function setSort(s){currentSort=s;document.getElementById('sortBtnPopular').classList.toggle('on',s==='popular');document.getElementById('sortBtnNew').classList.toggle('on',s==='new');renderCurrentContent();}
function selectTag(tag,type){if(type==='deck'){selectedTag=(selectedTag===tag)?'':tag;document.querySelectorAll('#deckTagGrid .tag-opt').forEach(el=>el.classList.toggle('on',el.dataset.tag===selectedTag));}else{selectedBlogTag=(selectedBlogTag===tag)?'':tag;document.querySelectorAll('#blogTagGrid .tag-opt').forEach(el=>el.classList.toggle('on',el.dataset.tag===selectedBlogTag));}}

let _cachedDecks={},_cachedBlogs={};
async function loadHome(force){
  showView('home');
  document.getElementById('spinner').style.display='flex';
  document.getElementById('deckSection').style.display='none';
  document.getElementById('blogSection').style.display='none';
  
  
  document.getElementById('dividerDB').style.display=(deckEntries.length>0&&blogEntries.length>0)?'block':'none';
  document.getElementById('loadErr').classList.remove('show');
  await loadFavorites();await loadMyFollowing();
  try{[_cachedDecks,_cachedBlogs]=await Promise.all([fetchDecks(force),fetchBlogs(force)]);renderCurrentContent();}
  catch(e){document.getElementById('spinner').style.display='none';document.getElementById('loadErr').classList.add('show');}
}
function retryLoad(){loadHome(true);}
function renderCurrentContent(){renderAll(_cachedDecks,_cachedBlogs);}

const TAG_COLOR={'代数':'#7B6CF6','幾何':'#4B8DEA','甲':'#E87B22','乙':'#D48822','漢文':'#D65589','歴史':'#C97438','地理':'#28A878','物理':'#4478E0','生物':'#22A88A','英語A':'#D48822','英語B':'#C87018','ロシア語':'#D65589','Python':'#7B6CF6','C':'#7B6CF6','その他':'#AAA'};

function renderAll(allDecks,allBlogs){
  document.getElementById('spinner').style.display='none';
  document.getElementById('loadErr').classList.remove('show');
  let deckEntries=Object.entries(allDecks||{});let blogEntries=Object.entries(allBlogs||{});
  if(currentTab==='mine'){deckEntries=deckEntries.filter(([,d])=>session&&d.uid===session.uid);blogEntries=blogEntries.filter(([,b])=>session&&b.uid===session.uid);}
  if(currentTab==='fav'){deckEntries=deckEntries.filter(([id])=>myFavs[id]);blogEntries=[];}
  if(currentTagFilter){deckEntries=deckEntries.filter(([,d])=>d.tag===currentTagFilter);blogEntries=blogEntries.filter(([,b])=>b.tag===currentTagFilter);}
  if(currentSort==='popular'){deckEntries.sort((a,b)=>{const sa=((a[1].fc||0)*3+(a[1].vc||0));const sb=((b[1].fc||0)*3+(b[1].vc||0));return sb-sa||(b[1].ut||0)-(a[1].ut||0);});}
  else{deckEntries.sort((a,b)=>(b[1].ut||0)-(a[1].ut||0));}
  blogEntries.sort((a,b)=>(b[1].ut||0)-(a[1].ut||0));
  const HERO={all:'みんなのコンテンツ',mine:'マイコンテンツ',fav:'★ お気に入り'};
  const SUB={all:'単語帳・解説ブログを学習しよう',mine:'自分が作ったコンテンツ',fav:'お気に入り登録した単語帳'};
  document.getElementById('heroTitle').textContent=(currentTagFilter?currentTagFilter+' — ':'')+HERO[currentTab];
  document.getElementById('heroSub').textContent=currentTagFilter?'タグ「'+currentTagFilter+'」で絞り込み中':SUB[currentTab];
  const total=deckEntries.length+blogEntries.length;
  document.getElementById('heroNum').textContent=String(total).padStart(2,'0');
  renderDeckSection(deckEntries);renderBlogSection(blogEntries);
  
  document.getElementById('dividerDB').style.display=(deckEntries.length>0&&blogEntries.length>0)?'block':'none';
  document.getElementById('deckSection').style.display='block';
  
  document.getElementById('blogSection').style.display=currentTab!=='fav'?'block':'none';
}

function mkDeckCard(id,d,isOwn){
  const cnt=d.cc||0,fc=d.fc||0,vc=d.vc||0,tag=d.tag||'';
  const date=d.ut?new Date(d.ut).toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'}):'';
  const isFaved=!!myFavs[id];const prog=getProgress(id);const accentColor=TAG_COLOR[tag]||'var(--primary)';
  const el=document.createElement('div');el.className='dk';
  const tagHTML=tag?'<span class="dk-tag tag-'+esc(tag)+'">'+esc(tag)+'</span><br>':'';
  const progHTML=(prog.study||prog.quiz)?'<div class="dk-progress">'+(prog.study?'<span class="prog-chip prog-chip-study">✓ 単語帳</span>':'')+(prog.quiz?'<span class="prog-chip prog-chip-quiz">✓ クイズ</span>':'')+'</div>':'';
  const isCollab=session&&d.collabs&&d.collabs[session.username];const canEdit=isOwn||isCollab;
  const collabBadge=isCollab&&!isOwn?'<span style="font-size:10px;font-weight:700;color:var(--green);background:var(--green-l);padding:2px 6px;border-radius:var(--r-xl);margin-left:4px">共同編集</span>':'';
  const ownHTML=canEdit?'<button class="dk-action-btn" title="編集" onclick="openEdit(''+id+'')">✎</button>'+(isOwn?'<button class="dk-action-btn" title="削除" onclick="confirmDelete(''+id+'')">\ud83d\uddd1</button>':''):'';
  el.innerHTML='<div class="dk-accent-line" style="background:'+accentColor+'"></div><div class="dk-body"><div class="dk-top"><div class="dk-name">'+esc(d.name)+collabBadge+'</div><div class="dk-cnt">'+cnt+'枚</div></div>'+tagHTML+progHTML+'<div class="dk-desc">'+esc(d.desc||'')+'</div><div class="dk-stats"><span class="dk-stat"><span class="dk-stat-icon">★</span>'+fc+'</span><span class="dk-stat"><span class="dk-stat-icon">\ud83d\udc41</span>'+vc+'</span></div><div class="dk-meta"><span class="dk-author-link" onclick="openProfileByUsername(''+esc(d.uid||d.author||'')+'')" title="プロフィールを見る">'+esc(d.author||'ゲスト')+'</span>'+(date?' · '+date:'')+'</div><div class="dk-actions"><button class="dk-study" onclick="openStudy(''+id+'')">▶ 学習する</button><button class="dk-action-btn dk-fav'+(isFaved?' on':'')+'" data-id="'+id+'" onclick="toggleFav(''+id+'')" title="お気に入り">'+(isFaved?'★':'☆')+'</button><span class="fav-cnt" data-id="'+id+'">'+fc+'</span>'+ownHTML+'</div></div>';
  return el;
}
function mkBlogCard(id,b,isOwn){
  const tag=b.tag||'';const date=b.ut?new Date(b.ut).toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'}):'';const preview=stripMd(b.content||'').slice(0,120);
  const el=document.createElement('div');el.className='blog-card';const tagHTML=tag?'<span class="blog-card-tag">'+esc(tag)+'</span>':'<span></span>';
  const ownHTML=isOwn?'<button class="dk-action-btn" title="編集" onclick="event.stopPropagation();openBlogEditById(''+id+'')">✎</button><button class="dk-action-btn" title="削除" onclick="event.stopPropagation();confirmDeleteBlog(''+id+'')">\ud83d\uddd1</button>':'';
  el.innerHTML='<div class="blog-card-accent"></div><div class="blog-card-inner"><div class="blog-card-top">'+tagHTML+'</div><div class="blog-card-title">'+esc(b.title||'無題')+'</div><div class="blog-card-preview">'+esc(preview)+'</div><div class="blog-card-meta"><span class="blog-author-link" onclick="event.stopPropagation();openProfileByUsername(''+esc(b.uid||b.author||'')+'')">'+esc(b.author||'ゲスト')+'</span><span>'+(date?date:'')+'</span></div><div class="blog-card-actions"><button class="blog-read-btn" onclick="openBlogPost(''+id+'')">\ud83d\udcd6 読む</button>'+ownHTML+'</div></div>';
  return el;
}

function renderDeckSection(entries){
  document.getElementById('deckCountLbl').textContent=entries.length;
  const emptyEl=document.getElementById('emptyDecks');const grid=document.getElementById('deckGrid');
  if(!entries.length){const MSG={all:['単語帳がありません','最初のデッキを作りましょう'],mine:['まだデッキがありません','＋ ボタンからデッキを作成しよう'],fav:['お気に入りがありません','★ ボタンでお気に入りに追加しよう']};document.getElementById('emptyDecksTitle').textContent=currentTagFilter?'「'+currentTagFilter+'」の単語帳がありません':MSG[currentTab][0];document.getElementById('emptyDecksSub').textContent=currentTagFilter?'別のタグも試してみましょう':MSG[currentTab][1];emptyEl.style.display='flex';grid.style.display='none';return;}
  emptyEl.style.display='none';grid.style.display='grid';grid.innerHTML='';entries.forEach(([id,d])=>{const own=session&&d.uid===session.uid;grid.appendChild(mkDeckCard(id,d,own));});
}
function renderBlogSection(entries){
  document.getElementById('blogCountLbl').textContent=entries.length;const emptyEl=document.getElementById('emptyBlogs');const grid=document.getElementById('blogGrid');
  if(!entries.length){document.getElementById('emptyBlogsTitle').textContent=currentTagFilter?'「'+currentTagFilter+'」のブログがありません':'解説ブログがありません';document.getElementById('emptyBlogsSub').textContent=currentTagFilter?'別のタグも試してみましょう':'最初のブログを書きましょう';emptyEl.style.display='flex';grid.style.display='none';return;}
  emptyEl.style.display='none';grid.style.display='grid';grid.innerHTML='';entries.forEach(([id,b])=>{const own=session&&b.uid===session.uid;grid.appendChild(mkBlogCard(id,b,own));});
}
function stripMd(text){return text.replace(/```[\s\S]*?```/g,'[コードブロック]').replace(/`[^`]+`/g,'').replace(/#{1,6}\s/g,'').replace(/\*\*([^*]+)\*\*/g,'$1').replace(/\*([^*]+)\*/g,'$1').replace(/>\s/g,'').replace(/\|\|([^|]+)\|\|/g,'[ネタバレ]').replace(/[-*]\s/g,'').trim();}

function openCreateModal(){if(!session){showToast('デッキの作成にはログインが必要です');showAuth('login');return;}document.getElementById('createOv').classList.add('open');setTimeout(()=>document.getElementById('newName').focus(),50);}
function closeCreateModal(){document.getElementById('createOv').classList.remove('open');document.getElementById('newName').value='';document.getElementById('newDesc').value='';selectedTag='';document.querySelectorAll('#deckTagGrid .tag-opt').forEach(el=>el.classList.remove('on'));}
async function createDeck(){const name=document.getElementById('newName').value.trim().slice(0,MAX_NAME);if(!name){showToast('デッキ名を入力してください');return;}const id='dk_'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);const deck={name,desc:document.getElementById('newDesc').value.trim().slice(0,200),tag:selectedTag||'',author:session.username,uid:session.uid,cc:0,fc:0,vc:0,ct:Date.now(),ut:Date.now()};await writeDeck(id,deck);closeCreateModal();showToast('デッキを作成しました');await openEdit(id);}
async function confirmDelete(id){if(!confirm('このデッキを削除しますか？'))return;await deleteDeckData(id);showToast('削除しました');loadHome(true);}

async function openEdit(id){
  currentDeckId=id;const all=await fetchDecks(false);const deck=all[id]||lsD()[id];if(!deck)return;
  const isOwner=session&&deck.uid===session.uid;const isCollab=session&&deck.collabs&&deck.collabs[session.username];
  if(!session||(!isOwner&&!isCollab)){showToast('編集権限がありません');return;}
  document.getElementById('editName').value=deck.name||'';document.getElementById('editTagSel').value=deck.tag||'';currentDeckName=deck.name||'';
  const raw=await fetchCards(id,false);editCards=Object.entries(raw).map(([cid,c])=>({id:cid,f:c.f||'',b:c.b||'',fi:c.fi||'',bi:c.bi||''}));
  renderEditList();showView('edit');
}
function renderEditList(){
  const list=document.getElementById('editList');list.innerHTML='';const cnt=editCards.length;
  document.getElementById('editCntLbl').textContent=cnt;document.getElementById('editWarn').classList.toggle('show',cnt>=MAX_CARDS);
  editCards.forEach(function(card,i){
    const row=document.createElement('div');row.className='crow';row.setAttribute('draggable','true');
    const handle=document.createElement('div');handle.className='crow-handle';handle.title='ドラッグして並び替え';handle.innerHTML='<span class="drag-icon">⠿</span>';
    const numCell=document.createElement('div');numCell.className='crow-num';numCell.textContent=String(i+1).padStart(2,'0');
    const fi=document.createElement('input');fi.className='crow-inp';fi.type='text';fi.placeholder='表面のテキスト';fi.value=card.f;fi.oninput=function(){editCards[i].f=this.value.slice(0,MAX_FIELD);};
    const fiBtnWrap=document.createElement('div');fiBtnWrap.style.cssText='display:flex;align-items:center;justify-content:center;border-right:1px solid var(--border);';
    const fiBtn=document.createElement('button');fiBtn.className='crow-img-btn'+(card.fi?' has-img':'');fiBtn.title=card.fi?'表面画像を変更/削除':'表面に画像を追加';fiBtn.textContent=card.fi?'\ud83d\uddbc':'\ud83d\udcf7';fiBtn.onclick=function(){openCardImgPicker(i,'f');};fiBtnWrap.appendChild(fiBtn);
    const bi=document.createElement('input');bi.className='crow-inp';bi.type='text';bi.placeholder='裏面のテキスト';bi.value=card.b;bi.oninput=function(){editCards[i].b=this.value.slice(0,MAX_FIELD);};
    const bkDiv=document.createElement('div');bkDiv.className='crow-bk';bkDiv.appendChild(bi);
    const biBtnWrap=document.createElement('div');biBtnWrap.style.cssText='display:flex;align-items:center;justify-content:center;border-right:1px solid var(--border);background:var(--primary-l);';
    const biBtn=document.createElement('button');biBtn.className='crow-img-btn'+(card.bi?' has-img':'');biBtn.title=card.bi?'裏面画像を変更/削除':'裏面に画像を追加';biBtn.textContent=card.bi?'\ud83d\uddbc':'\ud83d\udcf7';biBtn.onclick=function(){openCardImgPicker(i,'b');};biBtnWrap.appendChild(biBtn);
    const del=document.createElement('button');del.className='crow-del';del.textContent='✕';del.onclick=function(){delRow(i);};
    row.appendChild(handle);row.appendChild(numCell);row.appendChild(fi);row.appendChild(fiBtnWrap);row.appendChild(bkDiv);row.appendChild(biBtnWrap);row.appendChild(del);
    list.appendChild(row);
    row.addEventListener('dragstart',function(e){dragSrcIdx=i;e.dataTransfer.effectAllowed='move';setTimeout(()=>row.classList.add('dragging'),0);});
    row.addEventListener('dragend',function(){row.classList.remove('dragging');document.querySelectorAll('.crow').forEach(r=>r.classList.remove('drag-over'));dragSrcIdx=null;});
    row.addEventListener('dragover',function(e){e.preventDefault();e.dataTransfer.dropEffect='move';document.querySelectorAll('.crow').forEach(r=>r.classList.remove('drag-over'));if(dragSrcIdx!==i)row.classList.add('drag-over');});
    row.addEventListener('drop',function(e){e.preventDefault();e.stopPropagation();if(dragSrcIdx!==null&&dragSrcIdx!==i){const moved=editCards.splice(dragSrcIdx,1)[0];editCards.splice(i,0,moved);renderEditList();showToast('並び替えました');}});
    handle.addEventListener('touchstart',function(e){e.preventDefault();touchDragIdx=i;touchDragOriginEl=row;touchDragActive=true;row.classList.add('dragging');const touch=e.touches[0];touchDragGhost=document.createElement('div');touchDragGhost.className='touch-drag-ghost';touchDragGhost.textContent=(editCards[i].f||'（空）').slice(0,28);touchDragGhost.style.top=(touch.clientY-22)+'px';document.body.appendChild(touchDragGhost);},{passive:false});
    handle.addEventListener('touchmove',function(e){if(!touchDragActive)return;e.preventDefault();const touch=e.touches[0];if(touchDragGhost)touchDragGhost.style.top=(touch.clientY-22)+'px';document.querySelectorAll('.crow').forEach(r=>r.classList.remove('drag-over'));const el2=document.elementFromPoint(touch.clientX,touch.clientY);const targetRow=el2?el2.closest('.crow'):null;if(targetRow&&targetRow!==touchDragOriginEl)targetRow.classList.add('drag-over');},{passive:false});
    handle.addEventListener('touchend',function(e){if(!touchDragActive)return;const touch=e.changedTouches[0];if(touchDragGhost){touchDragGhost.remove();touchDragGhost=null;}if(touchDragOriginEl)touchDragOriginEl.classList.remove('dragging');document.querySelectorAll('.crow').forEach(r=>r.classList.remove('drag-over'));touchDragActive=false;const el2=document.elementFromPoint(touch.clientX,touch.clientY);const targetRow=el2?el2.closest('.crow'):null;if(targetRow&&targetRow!==touchDragOriginEl){const rows=[...document.querySelectorAll('.crow')];const targetIdx=rows.indexOf(targetRow);if(targetIdx>=0&&targetIdx!==touchDragIdx){const moved=editCards.splice(touchDragIdx,1)[0];editCards.splice(targetIdx,0,moved);renderEditList();showToast('並び替えました ✓');}}touchDragIdx=null;touchDragOriginEl=null;});
  });
}
function addRow(){if(editCards.length>=MAX_CARDS){showToast('カードの上限（150枚）に達しました');return;}editCards.push({id:'c_'+Date.now().toString(36)+Math.random().toString(36).slice(2,4),f:'',b:'',fi:'',bi:''});renderEditList();const rows=document.querySelectorAll('.crow');if(rows.length)rows[rows.length-1].querySelector('input').focus();}
function delRow(i){editCards.splice(i,1);renderEditList();}
async function saveDeck(){
  const name=document.getElementById('editName').value.trim().slice(0,MAX_NAME);if(!name){showToast('デッキ名を入力してください');return;}
  const newTag=document.getElementById('editTagSel').value;const valid=editCards.filter(c=>(c.f||'').trim()||(c.b||'').trim());const cardsObj={};valid.forEach(c=>{const cd={f:(c.f||'').slice(0,MAX_FIELD),b:(c.b||'').slice(0,MAX_FIELD)};if(c.fi)cd.fi=c.fi;if(c.bi)cd.bi=c.bi;cardsObj[c.id]=cd;});
  const all=await fetchDecks(false);const ex=all[currentDeckId]||lsD()[currentDeckId]||{};await writeDeck(currentDeckId,{...ex,name,tag:newTag,cc:valid.length,ut:Date.now()});await writeCards(currentDeckId,cardsObj);currentDeckName=name;showToast('保存しました ✓');loadHome(true);
}

function openCreateBlogModal(){if(!session){showToast('ブログの作成にはログインが必要です');showAuth('login');return;}document.getElementById('createBlogOv').classList.add('open');setTimeout(()=>document.getElementById('newBlogTitle').focus(),50);}
function closeCreateBlogModal(){document.getElementById('createBlogOv').classList.remove('open');document.getElementById('newBlogTitle').value='';selectedBlogTag='';document.querySelectorAll('#blogTagGrid .tag-opt').forEach(el=>el.classList.remove('on'));}
async function createBlog(){const title=document.getElementById('newBlogTitle').value.trim().slice(0,MAX_NAME);if(!title){showToast('タイトルを入力してください');return;}const id='bl_'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);const blog={title,tag:selectedBlogTag||'',content:'',author:session.username,uid:session.uid,ct:Date.now(),ut:Date.now()};await writeBlog(id,blog);closeCreateBlogModal();showToast('ブログを作成しました');openBlogEditById(id);}
async function openBlogEditById(id){const all=await fetchBlogs(false);const blog=all[id]||lsB()[id];if(!blog)return;const isOwner=session&&blog.uid===session.uid;const isCollab=session&&blog.collabs&&blog.collabs[session.username];if(!session||(!isOwner&&!isCollab)){showToast('編集権限がありません');return;}currentBlogId=id;currentBlogData={...blog};document.getElementById('blogEditTitle').value=blog.title||'';document.getElementById('blogEditTag').value=blog.tag||'';document.getElementById('blogEditContent').value=blog.content||'';switchBlogEditTab('write');showView('blog-edit');}
async function openBlogEdit(){if(currentBlogId)openBlogEditById(currentBlogId);}
async function saveBlog(){const title=document.getElementById('blogEditTitle').value.trim().slice(0,MAX_NAME);if(!title){showToast('タイトルを入力してください');return;}const tag=document.getElementById('blogEditTag').value;const content=document.getElementById('blogEditContent').value.slice(0,50000);const all=await fetchBlogs(false);const ex=all[currentBlogId]||lsB()[currentBlogId]||{};await writeBlog(currentBlogId,{...ex,title,tag,content,ut:Date.now()});showToast('公開しました ✓');loadHome(true);}
async function confirmDeleteBlog(id){if(!confirm('このブログを削除しますか？'))return;await deleteBlogData(id);showToast('削除しました');loadHome(true);}
async function deleteBlogPost(){if(currentBlogId)await confirmDeleteBlog(currentBlogId);}

async function openBlogPost(id){
  const all=await fetchBlogs(false);const blog=all[id]||lsB()[id];if(!blog)return;
  currentBlogId=id;currentBlogData=blog;_currentBlogAuthorUid=blog.uid||blog.author||'';
  const tag=blog.tag||'';document.getElementById('blogPostTag').textContent=tag||'ブログ';document.getElementById('blogPostTag').style.display=tag?'inline-flex':'none';
  document.getElementById('blogPostTitle').textContent=blog.title||'無題';document.getElementById('blogPostAuthorLink').textContent=blog.author||'ゲスト';document.getElementById('blogPostDate').textContent=blog.ut?new Date(blog.ut).toLocaleDateString('ja-JP',{year:'numeric',month:'long',day:'numeric'}):'';
  document.getElementById('blogPostBody').innerHTML=renderMarkdown(blog.content||'');
  document.getElementById('blogPostOwnerActions').style.display=(session&&blog.uid===session.uid)?'flex':'none';
  document.querySelectorAll('#blogPostBody .spoiler').forEach(el=>el.addEventListener('click',function(){this.classList.toggle('revealed');}));
  showView('blog-post');await loadComments(id);
}
function switchBlogEditTab(tab){document.getElementById('blogTabWrite').classList.toggle('on',tab==='write');document.getElementById('blogTabPreview').classList.toggle('on',tab==='preview');document.getElementById('blogWritePane').style.display=tab==='write'?'block':'none';document.getElementById('blogPreviewPane').style.display=tab==='preview'?'block':'none';if(tab==='preview')livePreview();}
function livePreview(){const content=document.getElementById('blogEditContent').value;document.getElementById('livePreviewBody').innerHTML=renderMarkdown(content);document.querySelectorAll('#livePreviewBody .spoiler').forEach(el=>el.addEventListener('click',function(){this.classList.toggle('revealed');}));}

function renderMarkdown(text){
  if(!text)return'';let html=esc(text);const codeBlocks=[];
  html=html.replace(/```(\w*)
?([\s\S]*?)```/g,function(_,lang,code){const idx=codeBlocks.length;codeBlocks.push('<pre><code'+(lang?' class="lang-'+esc(lang)+'"':'')+'>'+(code.trim())+'</code></pre>');return '\x00CB'+idx+'\x00';});
  const inlineCodes=[];html=html.replace(/`([^`]+)`/g,function(_,code){const idx=inlineCodes.length;inlineCodes.push('<code>'+code+'</code>');return '\x00IC'+idx+'\x00';});
  html=html.replace(/\|\|([^|]+)\|\|/g,'<span class="spoiler">$1</span>');html=html.replace(/\*\*([^*
]+)\*\*/g,'<strong>$1</strong>');html=html.replace(/\*([^*
]+)\*/g,'<em>$1</em>');html=html.replace(/_([^_
]+)_/g,'<em>$1</em>');html=html.replace(/~~([^~
]+)~~/g,'<s>$1</s>');html=html.replace(/__([^_
]+)__/g,'<u>$1</u>');
  const lines=html.split('
');const out=[];let inList=false,inOl=false,inBlockquote=false;
  function closeList(){if(inList){out.push('</ul>');inList=false;}if(inOl){out.push('</ol>');inOl=false;}}
  function closeBq(){if(inBlockquote){out.push('</blockquote>');inBlockquote=false;}}
  for(let i=0;i<lines.length;i++){const line=lines[i];
    if(/^#{6}\s/.test(line)){closeList();closeBq();out.push('<h3>'+line.replace(/^#{6}\s/,'')+'</h3>');continue;}
    if(/^#{5}\s/.test(line)){closeList();closeBq();out.push('<h3>'+line.replace(/^#{5}\s/,'')+'</h3>');continue;}
    if(/^#{4}\s/.test(line)){closeList();closeBq();out.push('<h3>'+line.replace(/^#{4}\s/,'')+'</h3>');continue;}
    if(/^###\s/.test(line)){closeList();closeBq();out.push('<h3>'+line.replace(/^###\s/,'')+'</h3>');continue;}
    if(/^##\s/.test(line)){closeList();closeBq();out.push('<h2>'+line.replace(/^##\s/,'')+'</h2>');continue;}
    if(/^#\s/.test(line)){closeList();closeBq();out.push('<h1>'+line.replace(/^#\s/,'')+'</h1>');continue;}
    if(/^---+$/.test(line.trim())||/^\*\*\*+$/.test(line.trim())){closeList();closeBq();out.push('<hr>');continue;}
    if(/^&gt;\s/.test(line)){closeList();if(!inBlockquote){out.push('<blockquote>');inBlockquote=true;}out.push(line.replace(/^&gt;\s/,''));continue;}else if(inBlockquote&&line.trim()===''){closeBq();out.push('');continue;}else{closeBq();}
    if(/^\d+\.\s/.test(line)){closeList();if(!inOl){out.push('<ol>');inOl=true;}out.push('<li>'+line.replace(/^\d+\.\s/,'')+'</li>');continue;}
    if(/^[-*]\s/.test(line)){if(inOl){out.push('</ol>');inOl=false;}if(!inList){out.push('<ul>');inList=true;}out.push('<li>'+line.replace(/^[-*]\s/,'')+'</li>');continue;}
    closeList();if(line.trim()===''){out.push('<br>');continue;}out.push('<p>'+line+'</p>');
  }
  closeList();closeBq();let result=out.join('
');
  inlineCodes.forEach((code,i)=>{result=result.split('\x00IC'+i+'\x00').join(code);});codeBlocks.forEach((block,i)=>{result=result.split('\x00CB'+i+'\x00').join(block);});
  result=result.replace(/(?<!\=["'])(https?:\/\/[^\s<>"']+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>');return result;
}

async function openStudy(id){currentDeckId=id;const all=await fetchDecks(false);const deck=all[id]||lsD()[id]||{};currentDeckName=deck.name||'デッキ';document.getElementById('modeDeckName').textContent=currentDeckName;incrementViewCount(id);showView('mode');}
async function startMode(mode){
  const raw=await fetchCards(currentDeckId,false);let arr=Object.entries(raw).map(([cid,c])=>({id:cid,f:c.f||'—',b:c.b||'—'}));
  if(!arr.length){showToast('カードがありません');return;}
  if(mode==='quiz'){if(arr.length<2){showToast('クイズには最低2枚必要です');return;}studyCards=shuffle(arr);quizCards=shuffle([...studyCards]);quizIdx=0;quizScore=0;showView('quiz');renderQuizQ();return;}
  studyCards=mode==='random'?shuffle(arr):arr;studyIdx=0;studyFlipped=false;studySeenAll=false;studyCorrect=0;document.getElementById('studyDone').classList.remove('show');showView('study');updateStudyCard();
}
function updateStudyCard(){
  if(!studyCards.length){document.getElementById('fFront').textContent='カードがありません';document.getElementById('fBack').textContent='デッキにカードを追加してください';document.getElementById('studyLbl').textContent='0 / 0';return;}
  const card=studyCards[studyIdx];
  const ffEl=document.getElementById('fFront');ffEl.textContent=card.f;const fImgEl=document.getElementById('fFrontImg');
  if(card.fi){fImgEl.src=card.fi;fImgEl.style.display='block';}else{fImgEl.src='';fImgEl.style.display='none';}
  const fbEl=document.getElementById('fBack');fbEl.textContent=card.b;const bImgEl=document.getElementById('fBackImg');
  if(card.bi){bImgEl.src=card.bi;bImgEl.style.display='block';}else{bImgEl.src='';bImgEl.style.display='none';}
  document.getElementById('card3d').classList.remove('flipped');studyFlipped=false;
  const pct=((studyIdx+1)/studyCards.length*100).toFixed(1);document.getElementById('studyProg').style.width=pct+'%';document.getElementById('studyLbl').textContent=(studyIdx+1)+' / '+studyCards.length;
  if(studyIdx===studyCards.length-1&&!studySeenAll){studySeenAll=true;markProgress(currentDeckId,'study');logHistory(currentDeckId,currentDeckName,'study',studyCorrect,studyCards.length);setTimeout(()=>document.getElementById('studyDone').classList.add('show'),700);}
}
function flipCard(){studyFlipped=!studyFlipped;document.getElementById('card3d').classList.toggle('flipped',studyFlipped);}
function nextCard(){studyIdx=(studyIdx+1)%studyCards.length;updateStudyCard();}
function prevCard(){studyIdx=(studyIdx-1+studyCards.length)%studyCards.length;updateStudyCard();}
function mark(ok){if(ok)studyCorrect++;showToast(ok?'✓ 覚えた！':'↺ もう一度！');nextCard();}
function restartStudy(){studyCards=shuffle(studyCards);studyIdx=0;studySeenAll=false;studyCorrect=0;document.getElementById('studyDone').classList.remove('show');updateStudyCard();}

function setupStudySwipe(){
  const scene=document.getElementById('studyScene');if(!scene)return;
  let sx=0,sy=0,st=0,touching=false;const THRESH=50,TAP_MS=300,TAP_DIST=18;
  const hintKnow=document.getElementById('hintKnow');const hintAgain=document.getElementById('hintAgain');
  function clearHints(){hintKnow&&hintKnow.classList.remove('show');hintAgain&&hintAgain.classList.remove('show');}
  scene.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;sy=e.touches[0].clientY;st=Date.now();touching=true;},{passive:true});
  scene.addEventListener('touchmove',function(e){if(!touching)return;const dy=e.touches[0].clientY-sy,dx=e.touches[0].clientX-sx;const ady=Math.abs(dy),adx=Math.abs(dx);if(ady>28&&ady>adx){if(dy<0){clearHints();hintKnow&&hintKnow.classList.add('show');}else{clearHints();hintAgain&&hintAgain.classList.add('show');}}else{clearHints();}},{passive:true});
  scene.addEventListener('touchend',function(e){if(!touching)return;touching=false;clearHints();e.preventDefault();if(!document.getElementById('view-study').classList.contains('active'))return;const t=e.changedTouches[0];const dx=t.clientX-sx,dy=t.clientY-sy,dt=Date.now()-st;const adx=Math.abs(dx),ady=Math.abs(dy);if(adx<TAP_DIST&&ady<TAP_DIST&&dt<TAP_MS){flipCard();return;}if(adx>THRESH&&adx>ady*1.2){dx>0?prevCard():nextCard();return;}if(ady>THRESH&&ady>adx*1.2){dy<0?mark(true):mark(false);}},{passive:false});
  scene.addEventListener('click',function(){flipCard();});
}

function startQuiz(){if(studyCards.length<2){showToast('クイズには最低2枚必要です');return;}quizCards=shuffle([...studyCards]);quizIdx=0;quizScore=0;showView('quiz');renderQuizQ();}
function renderQuizQ(){
  const body=document.getElementById('quizBody');
  if(quizIdx>=quizCards.length){markProgress(currentDeckId,'quiz');logHistory(currentDeckId,currentDeckName,'quiz',quizScore,quizCards.length);const pct=Math.round(quizScore/quizCards.length*100);const msg=pct>=80?'素晴らしい！\ud83c\udf89':pct>=50?'もう少し！\ud83d\udcaa':'練習を続けよう \ud83d\udcda';body.innerHTML='<div class="quiz-result"><div class="qr-top"><div class="qr-pct">'+pct+'%</div><div class="qr-sub">'+quizScore+' / '+quizCards.length+' 正解</div></div><div class="qr-body"><div class="qr-title">'+msg+'</div><div class="qr-desc">クイズ終了</div><div class="qr-acts"><button class="btn btn-primary btn-sm" onclick="startQuiz()">もう一度クイズ</button><button class="btn btn-outline btn-sm" onclick="showView('mode')">モード選択へ</button><button class="btn btn-ghost btn-sm" onclick="goHome()">ホームへ</button></div></div></div>';document.getElementById('quizProg').style.width='100%';return;}
  const q=quizCards[quizIdx];const others=quizCards.filter((_,i)=>i!==quizIdx);shuffle(others);const opts=shuffle([q.b,...others.slice(0,3).map(c=>c.b)]);const lbls=['A','B','C','D'];
  document.getElementById('quizProg').style.width=(quizIdx/quizCards.length*100)+'%';document.getElementById('quizLbl').textContent=(quizIdx+1)+' / '+quizCards.length;
  const frag=document.createDocumentFragment();const qBox=document.createElement('div');qBox.className='quiz-q';const qn=document.createElement('div');qn.className='quiz-qn';qn.textContent='Q '+(quizIdx+1);const qt=document.createElement('div');qt.className='quiz-qt';qt.textContent=q.f;qBox.appendChild(qn);qBox.appendChild(qt);frag.appendChild(qBox);
  const optsDiv=document.createElement('div');optsDiv.className='quiz-opts';const correctBtn={ref:null};
  opts.forEach(function(opt,i){const btn=document.createElement('button');btn.className='qopt';const lbl=document.createElement('span');lbl.className='qopt-lbl';lbl.textContent=lbls[i]||'';const txt=document.createElement('span');txt.textContent=opt;btn.appendChild(lbl);btn.appendChild(txt);if(opt===q.b)correctBtn.ref=btn;btn.onclick=function(){checkAns(btn,opt,q.b,correctBtn.ref);};optsDiv.appendChild(btn);});
  frag.appendChild(optsDiv);const fb=document.createElement('div');fb.className='quiz-fb';fb.id='quizFb';frag.appendChild(fb);body.innerHTML='';body.appendChild(frag);
}
function checkAns(el,chosen,correct,correctEl){document.querySelectorAll('.qopt').forEach(b=>b.disabled=true);const fb=document.getElementById('quizFb');if(chosen===correct){el.classList.add('correct');fb.className='quiz-fb ok';fb.textContent='⭕  正解！';quizScore++;}else{el.classList.add('wrong');if(correctEl)correctEl.classList.add('correct');fb.className='quiz-fb ng';fb.textContent='✗  不正解 — 正解: '+correct;}setTimeout(function(){quizIdx++;renderQuizQ();},1900);}

async function showHistoryView(){showView('history');setAllTabsOff();document.getElementById('tab-hist').classList.add('on');const logs=await fetchHistory();renderHistoryStats(logs);renderHistoryChart(logs);renderHistoryList(logs);document.getElementById('histNoLogin').style.display=session?'none':'block';}
function renderHistoryStats(logs){document.getElementById('statTotal').textContent=logs.length;const dates=new Set(logs.map(l=>l.date));let streak=0;const today=new Date();for(let i=0;i<60;i++){const d=new Date(today);d.setDate(d.getDate()-i);if(dates.has(d.toISOString().slice(0,10)))streak++;else if(i>0)break;}document.getElementById('statStreak').textContent=streak;const quizLogs=logs.filter(l=>l.mode==='quiz'&&l.total>0);document.getElementById('statAvg').textContent=quizLogs.length?Math.round(quizLogs.reduce((s,l)=>s+l.score,0)/quizLogs.length)+'':'—';}
function renderHistoryChart(logs){
  const canvas=document.getElementById('histChart'),emptyEl=document.getElementById('chartEmpty');if(!canvas)return;
  const N=14;const dates=[];const today=new Date();for(let i=N-1;i>=0;i--){const d=new Date(today);d.setDate(d.getDate()-i);dates.push(d.toISOString().slice(0,10));}
  const studyByDay={},quizByDay={};logs.forEach(l=>{if(!dates.includes(l.date))return;if(l.mode==='study'||l.mode==='ordered'||l.mode==='random')studyByDay[l.date]=(studyByDay[l.date]||0)+1;else if(l.mode==='quiz')quizByDay[l.date]=(quizByDay[l.date]||0)+1;});
  const maxVal=Math.max(1,...dates.map(d=>(studyByDay[d]||0)+(quizByDay[d]||0)));const hasData=dates.some(d=>(studyByDay[d]||0)+(quizByDay[d]||0)>0);
  if(!hasData){canvas.style.display='none';emptyEl.style.display='flex';return;}
  canvas.style.display='block';emptyEl.style.display='none';
  const dpr=window.devicePixelRatio||1;const W=canvas.parentElement.clientWidth-40,H=180;canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';
  const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
  const isDark=document.documentElement.getAttribute('data-theme')==='dark';const primaryColor=isDark?'#9D8EFF':'#7B6CF6';const accentColor=isDark?'#FF9674':'#F5835B';const textColor=isDark?'#5A576E':'#B2AFCA';const lineColor=isDark?'rgba(255,255,255,0.04)':'rgba(123,108,246,0.07)';
  const PAD_L=8,PAD_R=8,PAD_T=10,PAD_B=32;const chartW=W-PAD_L-PAD_R,chartH=H-PAD_T-PAD_B;const barGroupW=chartW/N,barW=Math.min(16,(barGroupW-6)/2),gap=2;let progress=0;
  function draw(p){ctx.clearRect(0,0,W,H);ctx.strokeStyle=lineColor;ctx.lineWidth=1;for(let i=0;i<=4;i++){const y=PAD_T+chartH*(1-i/4);ctx.beginPath();ctx.moveTo(PAD_L,y);ctx.lineTo(W-PAD_R,y);ctx.stroke();}dates.forEach((date,i)=>{const sv=studyByDay[date]||0,qv=quizByDay[date]||0;const cx=PAD_L+i*barGroupW+barGroupW/2;if(sv>0){const bh=chartH*(sv/maxVal)*p,x=cx-barW-gap/2,y=PAD_T+chartH-bh,r2=Math.min(3,bh/2);ctx.fillStyle=primaryColor;ctx.beginPath();ctx.roundRect(x,y,barW,bh,r2);ctx.fill();}if(qv>0){const bh=chartH*(qv/maxVal)*p,x=cx+gap/2,y=PAD_T+chartH-bh,r2=Math.min(3,bh/2);ctx.fillStyle=accentColor;ctx.beginPath();ctx.roundRect(x,y,barW,bh,r2);ctx.fill();}if(i%2===0||N<=7){ctx.fillStyle=textColor;ctx.font='10px "DM Mono","Plus Jakarta Sans",sans-serif';ctx.textAlign='center';const d=new Date(date);ctx.fillText((d.getMonth()+1)+'/'+(d.getDate()),cx,H-6);}});}
  function animate(){progress+=0.06;if(progress>=1){draw(1);return;}draw(progress);requestAnimationFrame(animate);}animate();
}
function renderHistoryList(logs){const list=document.getElementById('histList');if(!logs.length){list.innerHTML='<div style="color:var(--text3);font-size:13px;padding:12px 0;">まだ学習記録がありません</div>';return;}const recent=[...logs].sort((a,b)=>b.ts-a.ts).slice(0,20);list.innerHTML='';recent.forEach(function(log){const isQuiz=log.mode==='quiz';const dt=new Date(log.ts);const dtStr=dt.toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'})+' '+dt.toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'});const el=document.createElement('div');el.className='hist-item';el.innerHTML='<div class="hist-item-icon '+(isQuiz?'hist-icon-quiz':'hist-icon-study')+'">'+(isQuiz?'\ud83c\udfaf':'\ud83d\udcd6')+'</div><div class="hist-item-info"><div class="hist-item-deck">'+esc(log.deckName||'—')+'</div><div class="hist-item-meta">'+(isQuiz?'クイズ':'単語帳')+' · '+dtStr+'</div></div>'+(isQuiz?'<div class="hist-item-score">'+log.score+'%</div>':'');list.appendChild(el);});}

function setAllTabsOff(){['tab-all','tab-mine','tab-fav','tab-hist'].forEach(t=>document.getElementById(t).classList.remove('on'));}
function showView(name){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById('view-'+name).classList.add('active');window.scrollTo({top:0,behavior:'smooth'});setAllTabsOff();if(name==='home')document.getElementById('tab-'+currentTab).classList.add('on');if(name==='history')document.getElementById('tab-hist').classList.add('on');}
function goHome(){loadHome(false);}
function switchTab(tab){currentTab=tab;setAllTabsOff();document.getElementById('tab-'+tab).classList.add('on');if(!document.getElementById('view-home').classList.contains('active'))loadHome(false);else renderCurrentContent();}

['createOv','createBlogOv','profileEditOv','followListOv','collabOv'].forEach(id=>{document.getElementById(id).addEventListener('click',function(e){if(e.target===this)this.classList.remove('open');"
    },
    "message": "Running command",
    "integration_name": null,
    "integration_icon_url": null,
    "icon_name": "commandLine",
    "context": null,
    "display_content": {
      "type": "json_block",
      "json_block": "{"language": "bash", "code": "cat > /home/claude/hgsite/study/study.js << 'JSEOF'
const FIREBASE_CONFIG_BIN = "01111011 00100010 01100001 01110000 01101001 01001011 01100101 01111001 00100010 00111010 00100010 01000001 01001001 01111010 01100001 01010011 01111001 01000011 01100110 00111000 01010000 01001010 01011001 01111000 01000011 01001010 01000011 01000110 01000011 01000100 00110001 01110000 01101000 01000100 01011111 00101101 01011000 01010110 01010101 01011010 00111001 00110010 01000100 01010011 01010110 01110101 01010010 01100001 01110101 01010101 00100010 00101100 00100010 01100001 01110101 01110100 01101000 01000100 01101111 01101101 01100001 01101001 01101110 00100010 00111010 00100010 01101000 01100111 01110011 01110100 01110101 01100100 01111001 00101101 00110001 00111000 01100101 00110010 00110011 00101110 01100110 01101001 01110010 01100101 01100010 01100001 01110011 01100101 01100001 01110000 01110000 00101110 01100011 01101111 01101101 00100010 00101100 00100010 01100100 01100001 01110100 01100001 01100010 01100001 01110011 01100101 01010101 01010010 01001100 00100010 00111010 00100010 01101000 01110100 01110100 01110000 01110011 00111010 00101111 00101111 01101000 01100111 01110011 01110100 01110101 01100100 01111001 00101101 00110001 00111000 01100101 00110010 00110011 00101101 01100100 01100101 01100110 01100001 01110101 01101100 01110100 00101101 01110010 01110100 01100100 01100010 00101110 01100001 01110011 01101001 01100001 00101101 01110011 01101111 01110101 01110100 01101000 01100101 01100001 01110011 01110100 00110001 00101110 01100110 01101001 01110010 01100101 01100010 01100001 01110011 01100101 01100100 01100001 01110100 01100001 01100010 01100001 01110011 01100101 00101110 01100001 01110000 01110000 00100010 00101100 00100010 01110000 01110010 01101111 01101010 01100101 01100011 01110100 01001001 01100100 00100010 00111010 00100010 01101000 01100111 01110011 01110100 01110101 01100100 01111001 00101101 00110001 00111000 01100101 00110010 00110011 00100010 00101100 00100010 01110011 01110100 01101111 01110010 01100001 01100111 01100101 01000010 01110101 01100011 01101011 01100101 01110100 00100010 00111010 00100010 01101000 01100111 01110011 01110100 01110101 01100100 01111001 00101101 00110001 00111000 01100101 00110010 00110011 00101110 01100110 01101001 01110010 01100101 01100010 01100001 01110011 01100101 01110011 01110100 01101111 01110010 01100001 01100111 01100101 00101110 01100001 01110000 01110000 00100010 00101100 00100010 01101101 01100101 01110011 01110011 01100001 01100111 01101001 01101110 01100111 01010011 01100101 01101110 01100100 01100101 01110010 01001001 01100100 00100010 00111010 00100010 00110111 00110010 00110000 00110001 00110101 00110000 00110111 00110001 00110010 00110111 00110111 00110101 00100010 00101100 00100010 01100001 01110000 01110000 01001001 01100100 00100010 00111010 00100010 00110001 00111010 00110111 00110010 00110000 00110001 00110101 00110000 00110111 00110001 00110010 00110111 00110111 00110101 00111010 01110111 01100101 01100010 00111010 00110110 00110011 00110010 01100010 00110010 01100010 01100100 00110110 01100110 00110000 00110100 00110100 00110001 01100001 00111000 00110011 01100100 00110111 00110100 00111001 01100101 00110010 00100010 00101100 00100010 01101101 01100101 01100001 01110011 01110101 01110010 01100101 01101101 01100101 01101110 01110100 01001001 01100100 00100010 00111010 00100010 01000111 00101101 01011001 00110000 00110101 00110110 00110001 00110001 00110110 01010010 01010001 01001101 00100010 01111101";

function bin2str(b){const c=b.replace(/[^01]/g,'');if(!c)return'';return c.match(/.{1,8}/g).filter(x=>x.length===8).map(b=>String.fromCharCode(parseInt(b,2))).join('');}

const MAX_CARDS=150,MAX_FIELD=500,MAX_NAME=80,MAX_LOAD=50;
const TTL_D=3*60*1000,TTL_C=10*60*1000,LOAD_TIMEOUT=5000;

let db=null,session=null,myFavs={};
let currentTab='all',currentTagFilter='',currentSort='popular',selectedTag='',selectedBlogTag='';
let currentDeckId=null,currentDeckName='',editCards=[];
let currentBlogId=null,currentBlogData=null;
let _currentBlogAuthorUid='';
let studyCards=[],studyIdx=0,studyFlipped=false,studySeenAll=false,studyCorrect=0;
let quizCards=[],quizIdx=0,quizScore=0;
let dragSrcIdx=null;
let touchDragActive=false,touchDragIdx=null,touchDragGhost=null,touchDragOriginEl=null;
let _pendingAvatarData=null;

function setCookie(name,value,days){try{const exp=days?'; expires='+new Date(Date.now()+days*864e5).toUTCString():'';const secure=location.protocol==='https:'?'; Secure':'';document.cookie=name+'='+encodeURIComponent(value)+exp+'; path=/; SameSite=Lax'+secure;}catch(e){}}
function getCookie(name){try{const match=document.cookie.split('; ').find(row=>row.startsWith(name+'='));return match?decodeURIComponent(match.split('=').slice(1).join('=')):null;}catch(e){return null;}}
function deleteCookie(name){document.cookie=name+'=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';}

function cSet(k,v){try{localStorage.setItem(k,JSON.stringify({ts:Date.now(),v}))}catch(e){}}
function cGet(k,ttl){try{const r=JSON.parse(localStorage.getItem(k)||'null');return r&&Date.now()-r.ts<ttl?r.v:null}catch(e){return null}}
function cDel(k){localStorage.removeItem(k);}

async function hashPass(pw){const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('hgstudy:'+pw));return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');}

function initFirebase(){
  let cfg=null;
  if(FIREBASE_CONFIG_BIN&&FIREBASE_CONFIG_BIN.trim().length>20){try{cfg=JSON.parse(bin2str(FIREBASE_CONFIG_BIN))}catch(e){}}
  if(!cfg){try{cfg=JSON.parse(localStorage.getItem('fm_cfg')||'null')}catch(e){}}
  if(!cfg||!cfg.apiKey){db=null;return false;}
  try{if(!firebase.apps.length)firebase.initializeApp(cfg);db=firebase.database();localStorage.setItem('fm_cfg',JSON.stringify(cfg));return true;}
  catch(e){db=null;return false;}
}

function loadSession(){
  try{
    let s=null;
    const cookieVal=getCookie('hg_session');
    const lsVal=localStorage.getItem('hg_session_ls');
    if(cookieVal){try{s=JSON.parse(cookieVal);}catch(e){}}
    if(!s&&lsVal){try{s=JSON.parse(lsVal);}catch(e){}}
    if(s&&s.uid)session=s;
  }catch(e){}
  updateHeaderUI();
}
function saveSession(s){session=s;const str=JSON.stringify(s);setCookie('hg_session',str,30);try{localStorage.setItem('hg_session_ls',str);}catch(e){}}
function clearSession(){session=null;deleteCookie('hg_session');try{localStorage.removeItem('hg_session_ls');}catch(e){};myFavs={};}

const AVATAR_COLORS=[['#7B6CF6','#B06EF6'],['#F5835B','#F6C344'],['#52C4A3','#3B82F6'],['#E65B9A','#F5835B'],['#4B8DEA','#52C4A3'],['#A068F5','#F5835B']];
function avatarColorForName(name){let hash=0;for(let i=0;i<name.length;i++)hash=(hash*31+name.charCodeAt(i))&0xffff;return AVATAR_COLORS[hash%AVATAR_COLORS.length];}
function drawAvatarCanvas(canvas,username,imageData,size){
  if(!canvas)return;
  const s=size||canvas.width;canvas.width=s;canvas.height=s;
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,s,s);
  if(imageData){const img=new Image();img.onload=function(){ctx.save();ctx.beginPath();ctx.arc(s/2,s/2,s/2,0,Math.PI*2);ctx.clip();ctx.drawImage(img,0,0,s,s);ctx.restore();};img.src=imageData;}
  else{const colors=avatarColorForName(username||'?');const g=ctx.createLinearGradient(0,0,s,s);g.addColorStop(0,colors[0]);g.addColorStop(1,colors[1]);ctx.fillStyle=g;ctx.beginPath();ctx.arc(s/2,s/2,s/2,0,Math.PI*2);ctx.fill();const initials=(username||'?').slice(0,2).toUpperCase();ctx.fillStyle='rgba(255,255,255,0.92)';ctx.font=`bold ${Math.round(s*0.36)}px "Plus Jakarta Sans",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(initials,s/2,s/2);}
}
async function getAvatarData(username){if(!username)return null;try{const v=localStorage.getItem('fm_avatar_'+username);if(v)return v;}catch(e){}if(db){try{const snap=await db.ref('users/'+username+'/avatar').once('value');const v=snap.val();if(v){try{localStorage.setItem('fm_avatar_'+username,v);}catch(e){};return v;}}catch(e){}}return null;}
function cacheAvatarData(username,data){try{localStorage.setItem('fm_avatar_'+username,data||'');}catch(e){}}

function updateHeaderUI(){
  const li=document.getElementById('hdrLoginBtn'),re=document.getElementById('hdrRegBtn'),ub=document.getElementById('hdrUserBtn');
  if(session){li.style.display='none';re.style.display='none';ub.style.display='flex';document.getElementById('hdrUserName').textContent=session.displayName||session.username;document.getElementById('acctMenuDispName').textContent=session.displayName||session.username;document.getElementById('acctMenuUsername').textContent='@'+session.username;const av=localStorage.getItem('fm_avatar_'+session.username)||null;drawAvatarCanvas(document.getElementById('hdrAvatarCanvas'),session.username,av,24);drawAvatarCanvas(document.getElementById('acctMenuAvatarCanvas'),session.username,av,38);}
  else{li.style.display='flex';re.style.display='flex';ub.style.display='none';}
}
function toggleAcctMenu(){document.getElementById('acctMenu').classList.toggle('open');}
function closeAcctMenu(){document.getElementById('acctMenu').classList.remove('open');}
document.addEventListener('click',function(e){const m=document.getElementById('acctMenu');if(m&&!m.contains(e.target)&&e.target!==document.getElementById('hdrUserBtn')&&!document.getElementById('hdrUserBtn').contains(e.target))m.classList.remove('open');});
function logout(){clearSession();updateHeaderUI();showToast('\ロ\グ\ア\ウ\ト\し\ま\し\た');goHome();}

let authMode='login';
function showAuth(mode){switchAuthTab(mode||'login');showView('auth');setTimeout(()=>document.getElementById('authUser').focus(),100);}
function switchAuthTab(mode){authMode=mode;document.getElementById('authTabLogin').classList.toggle('on',mode==='login');document.getElementById('authTabReg').classList.toggle('on',mode==='reg');document.getElementById('authConfirmWrap').style.display=mode==='reg'?'block':'none';document.getElementById('authGenWrap').style.display=mode==='reg'?'block':'none';document.getElementById('authBtn').textContent=mode==='login'?'\ロ\グ\イ\ン':'\ア\カ\ウ\ン\ト\を\作\成';document.getElementById('authErr').classList.remove('show');}
function showAuthErr(msg){const el=document.getElementById('authErr');el.textContent=msg;el.classList.add('show');}
async function authSubmit(){
  const username=document.getElementById('authUser').value.trim().toLowerCase(),pass=document.getElementById('authPass').value;
  document.getElementById('authErr').classList.remove('show');
  if(!username){showAuthErr('\ユ\ー\ザ\ー\名\を\入\力\し\て\く\だ\さ\い');return;}
  if(username.length<2||username.length>20){showAuthErr('\ユ\ー\ザ\ー\名\は2\〜20\文\字\に\し\て\く\だ\さ\い');return;}
  if(!/^[a-zA-Z0-9_]+$/.test(username)){showAuthErr('\ユ\ー\ザ\ー\名\は\英\数\字\・\ア\ン\ダ\ー\ス\コ\ア\の\み\使\用\可\能\で\す');return;}
  if(pass.length<6){showAuthErr('\パ\ス\ワ\ー\ド\は6\文\字\以\上\に\し\て\く\だ\さ\い');return;}
  if(authMode==='reg'){const c=document.getElementById('authPassConfirm').value;if(pass!==c){showAuthErr('\パ\ス\ワ\ー\ド\が\一\致\し\ま\せ\ん');return;}const gen=document.getElementById('authGen').value;if(!gen){showAuthErr('\期\を\選\択\し\て\く\だ\さ\い');return;}await doRegister(username,pass,gen);}
  else await doLogin(username,pass);
}
async function doRegister(username,pass,gen){
  const btn=document.getElementById('authBtn');btn.textContent='\登\録\中...';btn.disabled=true;
  try{const hash=await hashPass(pass);if(db){const snap=await db.ref('users/'+username).once('value');if(snap.exists()){showAuthErr('\こ\の\ユ\ー\ザ\ー\名\は\す\で\に\使\わ\れ\て\い\ま\す');return;}await db.ref('users/'+username).set({username,hash,displayName:username,bio:'',avatar:'',gen:gen||'',created:Date.now()});}else{const users=JSON.parse(localStorage.getItem('fm_users')||'{}');if(users[username]){showAuthErr('\こ\の\ユ\ー\ザ\ー\名\は\す\で\に\使\わ\れ\て\い\ま\す');return;}users[username]={username,hash,displayName:username,bio:'',avatar:'',gen:gen||'',created:Date.now()};localStorage.setItem('fm_users',JSON.stringify(users));}
  saveSession({uid:username,username,displayName:username,gen:gen||''});updateHeaderUI();showToast('\ア\カ\ウ\ン\ト\を\作\成\し\ま\し\た\！');goHome();}
  catch(e){showAuthErr('\エ\ラ\ー: '+e.message);}finally{btn.textContent='\ア\カ\ウ\ン\ト\を\作\成';btn.disabled=false;}
}
async function doLogin(username,pass){
  const btn=document.getElementById('authBtn');btn.textContent='\確\認\中...';btn.disabled=true;
  try{const hash=await hashPass(pass);let stored=null;if(db){const snap=await db.ref('users/'+username).once('value');stored=snap.val();}else{const users=JSON.parse(localStorage.getItem('fm_users')||'{}');stored=users[username]||null;}if(!stored||stored.hash!==hash){showAuthErr('\ユ\ー\ザ\ー\名\ま\た\は\パ\ス\ワ\ー\ド\が\間\違\っ\て\い\ま\す');return;}
  const sData={uid:username,username,displayName:stored.displayName||username,gen:stored.gen||''};saveSession(sData);if(stored.avatar){cacheAvatarData(username,stored.avatar);}await loadFavorites();await loadMyFollowing();updateHeaderUI();showToast('\ロ\グ\イ\ン\し\ま\し\た\！');goHome();}
  catch(e){showAuthErr('\エ\ラ\ー: '+e.message);}finally{btn.textContent='\ロ\グ\イ\ン';btn.disabled=false;}
}

async function loadFavorites(){if(!session){myFavs={};return;}if(db){try{const snap=await db.ref('favs/'+session.uid).once('value');myFavs=snap.val()||{};return;}catch(e){}}try{myFavs=JSON.parse(localStorage.getItem('fm_favs_'+session.uid)||'{}')}catch(e){myFavs={};}}
async function toggleFav(deckId){
  if(!session){showToast('\お\気\に\入\り\に\は\ロ\グ\イ\ン\が\必\要\で\す');showAuth('login');return;}
  const was=!!myFavs[deckId];if(was)delete myFavs[deckId];else myFavs[deckId]=true;
  const btn=document.querySelector('.dk-fav[data-id="'+deckId+'"]'),cnt=document.querySelector('.fav-cnt[data-id="'+deckId+'"]');
  if(btn){btn.classList.toggle('on',!was);btn.innerHTML=was?'\☆':'\★';}
  const curCnt=parseInt((cnt&&cnt.textContent)||'0');if(cnt){cnt.textContent=Math.max(0,curCnt+(was?-1:1));}
  showToast(was?'\お\気\に\入\り\か\ら\削\除\し\ま\し\た':'\★ \お\気\に\入\り\に\追\加\し\ま\し\た\！');
  if(db){try{if(was)await db.ref('favs/'+session.uid+'/'+deckId).remove();else await db.ref('favs/'+session.uid+'/'+deckId).set(true);const newFc=Math.max(0,curCnt+(was?-1:1));await db.ref('decks/'+deckId+'/fc').set(newFc);cDel('fm_dcache');}catch(e){}}
  const ls=JSON.parse(localStorage.getItem('fm_favs_'+session.uid)||'{}');if(was)delete ls[deckId];else ls[deckId]=true;localStorage.setItem('fm_favs_'+session.uid,JSON.stringify(ls));
}

function lsD(){try{return JSON.parse(localStorage.getItem('fm_decks')||'{}')}catch(e){return{}}}
function lsSD(d){localStorage.setItem('fm_decks',JSON.stringify(d))}
function lsC(id){try{return JSON.parse(localStorage.getItem('fm_c_'+id)||'{}')}catch(e){return{}}}
function lsSC(id,c){localStorage.setItem('fm_c_'+id,JSON.stringify(c))}
function lsDD(id){const d=lsD();delete d[id];lsSD(d);localStorage.removeItem('fm_c_'+id);}
function withTimeout(p,ms){return Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),ms))]);}
async function fetchDecks(force){if(!force){const c=cGet('fm_dcache',TTL_D);if(c)return c;}if(db){try{const snap=await withTimeout(db.ref('decks').limitToLast(MAX_LOAD).once('value'),LOAD_TIMEOUT);const data=snap.val()||{};cSet('fm_dcache',data);return data;}catch(e){if(e.message==='timeout')throw e;}}return lsD();}
async function fetchCards(id,force){if(!force){const c=cGet('fm_cc_'+id,TTL_C);if(c)return c;}if(db){try{const snap=await withTimeout(db.ref('cards/'+id).once('value'),LOAD_TIMEOUT);const data=snap.val()||{};cSet('fm_cc_'+id,data);return data;}catch(e){}}return lsC(id);}
async function writeDeck(id,data){if(db){try{await db.ref('decks/'+id).set(data);cDel('fm_dcache');}catch(e){}}const d=lsD();d[id]=data;lsSD(d);}
async function writeCards(id,cards){if(db){try{await db.ref('cards/'+id).set(cards);cDel('fm_cc_'+id);}catch(e){}}lsSC(id,cards);}
async function deleteDeckData(id){if(db){try{await db.ref('decks/'+id).remove();await db.ref('cards/'+id).remove();cDel('fm_dcache');cDel('fm_cc_'+id);}catch(e){}}lsDD(id);}
async function incrementViewCount(deckId){try{if(db){await db.ref('decks/'+deckId+'/vc').transaction(v=>(v||0)+1);cDel('fm_dcache');}const d=lsD();if(d[deckId]){d[deckId].vc=(d[deckId].vc||0)+1;lsSD(d);}}catch(e){}}

function lsB(){try{return JSON.parse(localStorage.getItem('fm_blogs')||'{}')}catch(e){return{}}}
function lsSB(d){localStorage.setItem('fm_blogs',JSON.stringify(d))}
function lsDB(id){const d=lsB();delete d[id];lsSB(d);}
async function fetchBlogs(force){if(!force){const c=cGet('fm_bcache',TTL_D);if(c)return c;}if(db){try{const snap=await withTimeout(db.ref('blogs').limitToLast(MAX_LOAD).once('value'),LOAD_TIMEOUT);const data=snap.val()||{};cSet('fm_bcache',data);return data;}catch(e){if(e.message==='timeout')throw e;}}return lsB();}
async function writeBlog(id,data){if(db){try{await db.ref('blogs/'+id).set(data);cDel('fm_bcache');}catch(e){}}const d=lsB();d[id]=data;lsSB(d);}
async function deleteBlogData(id){if(db){try{await db.ref('blogs/'+id).remove();cDel('fm_bcache');}catch(e){}}lsDB(id);}

async function logHistory(deckId,deckName,mode,correct,total){const uid=session?session.uid:'guest';const entry={deckId,deckName,mode,correct,total,score:total>0?Math.round(correct/total*100):0,ts:Date.now(),date:new Date().toISOString().slice(0,10)};if(db&&session){try{await db.ref('logs/'+uid).push(entry);}catch(e){}}try{const key='fm_logs_'+uid;const logs=JSON.parse(localStorage.getItem(key)||'[]');logs.push(entry);if(logs.length>300)logs.splice(0,logs.length-300);localStorage.setItem(key,JSON.stringify(logs));}catch(e){}}
async function fetchHistory(){const uid=session?session.uid:'guest';if(db&&session){try{const snap=await withTimeout(db.ref('logs/'+uid).limitToLast(200).once('value'),LOAD_TIMEOUT);return snap.val()?Object.values(snap.val()):[];}catch(e){}}try{return JSON.parse(localStorage.getItem('fm_logs_'+uid)||'[]')}catch(e){return[];}}

async function fetchUserProfile(username){if(db){try{const snap=await db.ref('users/'+username).once('value');return snap.val();}catch(e){}}try{const u=JSON.parse(localStorage.getItem('fm_users')||'{}');return u[username]||null;}catch(e){return null;}}
async function updateUserProfile(username,updates){if(db){try{await db.ref('users/'+username).update(updates);}catch(e){}}try{const u=JSON.parse(localStorage.getItem('fm_users')||'{}');u[username]={...u[username],...updates};localStorage.setItem('fm_users',JSON.stringify(u));}catch(e){}}

let _viewingUsername='';
async function openMyProfile(){if(!session){showAuth('login');return;}await openProfileByUsername(session.username);}
async function openProfileByUsername(username){
  if(!username)return;
  _viewingUsername=username;
  const isOwn=session&&session.username===username;
  showView('profile');
  document.getElementById('profileViewLabel').textContent=isOwn?'\マ\イ\プ\ロ\フ\ィ\ー\ル':username+'\の\プ\ロ\フ\ィ\ー\ル';
  document.getElementById('profileAvatarEditBtn').style.display=isOwn?'flex':'none';
  const profile=await fetchUserProfile(username);
  const displayName=(profile&&profile.displayName)||username;
  const bio=(profile&&profile.bio)||'';
  const avatar=(profile&&profile.avatar)||null;
  if(avatar)cacheAvatarData(username,avatar);
  const cachedAv=localStorage.getItem('fm_avatar_'+username)||avatar||null;
  drawAvatarCanvas(document.getElementById('profileBigAvatar'),username,cachedAv,96);
  document.getElementById('profileDisplayName').textContent=displayName;
  document.getElementById('profileUsernameLabel').textContent='@'+username;
  document.getElementById('profileBio').textContent=bio;
  const actEl=document.getElementById('profileActions');
  if(isOwn){actEl.innerHTML='<button class="btn btn-primary btn-sm" onclick="openProfileEdit()">\✎ \プ\ロ\フ\ィ\ー\ル\を\編\集</button>';}
  else if(session){const isFollowing=!!_myFollowing[username];actEl.innerHTML='<button id="followBtn" class="follow-btn '+(isFollowing?'unfollow':'follow')+'" onclick="toggleFollow(\''+esc(username)+'\')">'+(isFollowing?'\フ\ォ\ロ\ー\中':'\フ\ォ\ロ\ー\す\る')+'</button>';}
  else{actEl.innerHTML='<button class="btn btn-ghost btn-sm" onclick="showAuth(\'login\')">\フ\ォ\ロ\ー\す\る</button>';}
  if(db){db.ref('follows').once('value').then(snap=>{const all=snap.val()||{};const followers=Object.values(all).filter(v=>v&&v[username]).length;document.getElementById('profileFollowerCount').textContent=followers;}).catch(()=>{});db.ref('follows/'+username).once('value').then(snap=>{document.getElementById('profileFollowingCount').textContent=Object.keys(snap.val()||{}).length;}).catch(()=>{});}
  const [allDecks,allBlogs]=await Promise.all([fetchDecks(false),fetchBlogs(false)]);
  const userDecks=Object.entries(allDecks||{}).filter(([,d])=>d.uid===username);
  const userBlogs=Object.entries(allBlogs||{}).filter(([,b])=>b.uid===username);
  const totalFavs=userDecks.reduce((s,[,d])=>s+(d.fc||0),0);
  document.getElementById('profileDeckCount').textContent=userDecks.length;
  document.getElementById('profileBlogCount').textContent=userBlogs.length;
  document.getElementById('profileTotalFavs').textContent=totalFavs;
  loadProfileStreak(username);
  const dGrid=document.getElementById('profileDeckGrid');const dEmpty=document.getElementById('profileDeckEmpty');
  if(userDecks.length){dGrid.style.display='grid';dEmpty.style.display='none';dGrid.innerHTML='';userDecks.sort((a,b)=>(b[1].fc||0)-(a[1].fc||0));userDecks.forEach(([id,d])=>{dGrid.appendChild(mkDeckCard(id,d,isOwn));});}
  else{dGrid.style.display='none';dEmpty.style.display='block';}
  const bGrid=document.getElementById('profileBlogGrid');const bEmpty=document.getElementById('profileBlogEmpty');
  if(userBlogs.length){bGrid.style.display='grid';bEmpty.style.display='none';bGrid.innerHTML='';userBlogs.sort((a,b)=>(b[1].ut||0)-(a[1].ut||0));userBlogs.forEach(([id,b])=>{bGrid.appendChild(mkBlogCard(id,b,isOwn));});}
  else{bGrid.style.display='none';bEmpty.style.display='block';}
}

function openProfileEdit(){if(!session)return;_pendingAvatarData=null;const cachedAv=localStorage.getItem('fm_avatar_'+session.username)||null;drawAvatarCanvas(document.getElementById('profileEditAvatarPreview'),session.username,cachedAv,72);document.getElementById('profileEditDisplayName').value=session.displayName||session.username;fetchUserProfile(session.username).then(p=>{document.getElementById('profileEditBio').value=(p&&p.bio)||'';});document.getElementById('profileEditOv').classList.add('open');}
function closeProfileEdit(){document.getElementById('profileEditOv').classList.remove('open');_pendingAvatarData=null;}
function handleProfileEditAvatar(event){const file=event.target.files[0];if(!file)return;if(file.size>2*1024*1024){showToast('\画\像\は2MB\以\下\に\し\て\く\だ\さ\い');return;}const reader=new FileReader();reader.onload=function(e){const img=new Image();img.onload=function(){const canvas=document.createElement('canvas');canvas.width=canvas.height=200;const ctx=canvas.getContext('2d');const s=Math.min(img.width,img.height);const ox=(img.width-s)/2,oy=(img.height-s)/2;ctx.drawImage(img,ox,oy,s,s,0,0,200,200);_pendingAvatarData=canvas.toDataURL('image/jpeg',0.8);drawAvatarCanvas(document.getElementById('profileEditAvatarPreview'),session.username,_pendingAvatarData,72);};img.src=e.target.result;};reader.readAsDataURL(file);}
async function saveProfile(){if(!session)return;const displayName=document.getElementById('profileEditDisplayName').value.trim().slice(0,20)||session.username;const bio=document.getElementById('profileEditBio').value.trim().slice(0,140);const updates={displayName,bio};if(_pendingAvatarData){updates.avatar=_pendingAvatarData;cacheAvatarData(session.username,_pendingAvatarData);}await updateUserProfile(session.username,updates);session.displayName=displayName;saveSession(session);updateHeaderUI();closeProfileEdit();showToast('\プ\ロ\フ\ィ\ー\ル\を\更\新\し\ま\し\た \✓');if(document.getElementById('view-profile').classList.contains('active')){await openProfileByUsername(session.username);}}
async function handleAvatarUpload(event){const file=event.target.files[0];if(!file)return;if(file.size>2*1024*1024){showToast('\画\像\は2MB\以\下\に\し\て\く\だ\さ\い');return;}const reader=new FileReader();reader.onload=function(e){const img=new Image();img.onload=async function(){const canvas=document.createElement('canvas');canvas.width=canvas.height=200;const ctx=canvas.getContext('2d');const s=Math.min(img.width,img.height);const ox=(img.width-s)/2,oy=(img.height-s)/2;ctx.drawImage(img,ox,oy,s,s,0,0,200,200);const data=canvas.toDataURL('image/jpeg',0.8);cacheAvatarData(session.username,data);await updateUserProfile(session.username,{avatar:data});session.displayName=session.displayName||session.username;saveSession(session);updateHeaderUI();drawAvatarCanvas(document.getElementById('profileBigAvatar'),session.username,data,96);showToast('\プ\ロ\フ\ィ\ー\ル\画\像\を\更\新\し\ま\し\た \✓');};img.src=e.target.result;};reader.readAsDataURL(file);}

function setTagFilter(tag){currentTagFilter=tag;document.querySelectorAll('.tag-chip').forEach(el=>el.classList.toggle('on',el.dataset.tag===tag));renderCurrentContent();}
function setSort(s){currentSort=s;document.getElementById('sortBtnPopular').classList.toggle('on',s==='popular');document.getElementById('sortBtnNew').classList.toggle('on',s==='new');renderCurrentContent();}
function selectTag(tag,type){if(type==='deck'){selectedTag=(selectedTag===tag)?'':tag;document.querySelectorAll('#deckTagGrid .tag-opt').forEach(el=>el.classList.toggle('on',el.dataset.tag===selectedTag));}else{selectedBlogTag=(selectedBlogTag===tag)?'':tag;document.querySelectorAll('#blogTagGrid .tag-opt').forEach(el=>el.classList.toggle('on',el.dataset.tag===selectedBlogTag));}}

let _cachedDecks={},_cachedBlogs={};
async function loadHome(force){
  showView('home');
  document.getElementById('spinner').style.display='flex';
  document.getElementById('deckSection').style.display='none';
  document.getElementById('blogSection').style.display='none';
  
  
  document.getElementById('dividerDB').style.display=(deckEntries.length>0&&blogEntries.length>0)?'block':'none';
  document.getElementById('loadErr').classList.remove('show');
  await loadFavorites();await loadMyFollowing();
  try{[_cachedDecks,_cachedBlogs]=await Promise.all([fetchDecks(force),fetchBlogs(force)]);renderCurrentContent();}
  catch(e){document.getElementById('spinner').style.display='none';document.getElementById('loadErr').classList.add('show');}
}
function retryLoad(){loadHome(true);}
function renderCurrentContent(){renderAll(_cachedDecks,_cachedBlogs);}

const TAG_COLOR={'\代\数':'#7B6CF6','\幾\何':'#4B8DEA','\甲':'#E87B22','\乙':'#D48822','\漢\文':'#D65589','\歴\史':'#C97438','\地\理':'#28A878','\物\理':'#4478E0','\生\物':'#22A88A','\英\語A':'#D48822','\英\語B':'#C87018','\ロ\シ\ア\語':'#D65589','Python':'#7B6CF6','C':'#7B6CF6','\そ\の\他':'#AAA'};

function renderAll(allDecks,allBlogs){
  document.getElementById('spinner').style.display='none';
  document.getElementById('loadErr').classList.remove('show');
  let deckEntries=Object.entries(allDecks||{});let blogEntries=Object.entries(allBlogs||{});
  if(currentTab==='mine'){deckEntries=deckEntries.filter(([,d])=>session&&d.uid===session.uid);blogEntries=blogEntries.filter(([,b])=>session&&b.uid===session.uid);}
  if(currentTab==='fav'){deckEntries=deckEntries.filter(([id])=>myFavs[id]);blogEntries=[];}
  if(currentTagFilter){deckEntries=deckEntries.filter(([,d])=>d.tag===currentTagFilter);blogEntries=blogEntries.filter(([,b])=>b.tag===currentTagFilter);}
  if(currentSort==='popular'){deckEntries.sort((a,b)=>{const sa=((a[1].fc||0)*3+(a[1].vc||0));const sb=((b[1].fc||0)*3+(b[1].vc||0));return sb-sa||(b[1].ut||0)-(a[1].ut||0);});}
  else{deckEntries.sort((a,b)=>(b[1].ut||0)-(a[1].ut||0));}
  blogEntries.sort((a,b)=>(b[1].ut||0)-(a[1].ut||0));
  const HERO={all:'\み\ん\な\の\コ\ン\テ\ン\ツ',mine:'\マ\イ\コ\ン\テ\ン\ツ',fav:'\★ \お\気\に\入\り'};
  const SUB={all:'\単\語\帳\・\記\述\式\問\題\・\解\説\ブ\ロ\グ\を\学\習\し\よ\う',mine:'\自\分\が\作\っ\た\コ\ン\テ\ン\ツ',fav:'\お\気\に\入\り\登\録\し\た\単\語\帳'};
  document.getElementById('heroTitle').textContent=(currentTagFilter?currentTagFilter+' \— ':'')+HERO[currentTab];
  document.getElementById('heroSub').textContent=currentTagFilter?'\タ\グ\「'+currentTagFilter+'\」\で\絞\り\込\み\中':SUB[currentTab];
  const total=deckEntries.length+blogEntries.length;
  document.getElementById('heroNum').textContent=String(total).padStart(2,'0');
  renderDeckSection(deckEntries);renderBlogSection(blogEntries);
  
  document.getElementById('dividerDB').style.display=(deckEntries.length>0&&blogEntries.length>0)?'block':'none';
  document.getElementById('deckSection').style.display='block';
  
  document.getElementById('blogSection').style.display=currentTab!=='fav'?'block':'none';
}

function mkDeckCard(id,d,isOwn){
  const cnt=d.cc||0,fc=d.fc||0,vc=d.vc||0,tag=d.tag||'';
  const date=d.ut?new Date(d.ut).toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'}):'';
  const isFaved=!!myFavs[id];const prog=getProgress(id);const accentColor=TAG_COLOR[tag]||'var(--primary)';
  const el=document.createElement('div');el.className='dk';
  const tagHTML=tag?'<span class="dk-tag tag-'+esc(tag)+'">'+esc(tag)+'</span><br>':'';
  const progHTML=(prog.study||prog.quiz)?'<div class="dk-progress">'+(prog.study?'<span class="prog-chip prog-chip-study">\✓ \単\語\帳</span>':'')+(prog.quiz?'<span class="prog-chip prog-chip-quiz">\✓ \ク\イ\ズ</span>':'')+'</div>':'';
  const isCollab=session&&d.collabs&&d.collabs[session.username];const canEdit=isOwn||isCollab;
  const collabBadge=isCollab&&!isOwn?'<span style="font-size:10px;font-weight:700;color:var(--green);background:var(--green-l);padding:2px 6px;border-radius:var(--r-xl);margin-left:4px">\共\同\編\集</span>':'';
  const ownHTML=canEdit?'<button class="dk-action-btn" title="\編\集" onclick="openEdit(\''+id+'\')">\✎</button>'+(isOwn?'<button class="dk-action-btn" title="\削\除" onclick="confirmDelete(\''+id+'\')">\ud83d\uddd1</button>':''):'';
  el.innerHTML='<div class="dk-accent-line" style="background:'+accentColor+'"></div><div class="dk-body"><div class="dk-top"><div class="dk-name">'+esc(d.name)+collabBadge+'</div><div class="dk-cnt">'+cnt+'\枚</div></div>'+tagHTML+progHTML+'<div class="dk-desc">'+esc(d.desc||'')+'</div><div class="dk-stats"><span class="dk-stat"><span class="dk-stat-icon">\★</span>'+fc+'</span><span class="dk-stat"><span class="dk-stat-icon">\ud83d\udc41</span>'+vc+'</span></div><div class="dk-meta"><span class="dk-author-link" onclick="openProfileByUsername(\''+esc(d.uid||d.author||'')+'\')" title="\プ\ロ\フ\ィ\ー\ル\を\見\る">'+esc(d.author||'\ゲ\ス\ト')+'</span>'+(date?' \· '+date:'')+'</div><div class="dk-actions"><button class="dk-study" onclick="openStudy(\''+id+'\')">\▶ \学\習\す\る</button><button class="dk-action-btn dk-fav'+(isFaved?' on':'')+'" data-id="'+id+'" onclick="toggleFav(\''+id+'\')" title="\お\気\に\入\り">'+(isFaved?'\★':'\☆')+'</button><span class="fav-cnt" data-id="'+id+'">'+fc+'</span>'+ownHTML+'</div></div>';
  return el;
}
function mkBlogCard(id,b,isOwn){
  const tag=b.tag||'';const date=b.ut?new Date(b.ut).toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'}):'';const preview=stripMd(b.content||'').slice(0,120);
  const el=document.createElement('div');el.className='blog-card';const tagHTML=tag?'<span class="blog-card-tag">'+esc(tag)+'</span>':'<span></span>';
  const ownHTML=isOwn?'<button class="dk-action-btn" title="\編\集" onclick="event.stopPropagation();openBlogEditById(\''+id+'\')">\✎</button><button class="dk-action-btn" title="\削\除" onclick="event.stopPropagation();confirmDeleteBlog(\''+id+'\')">\ud83d\uddd1</button>':'';
  el.innerHTML='<div class="blog-card-accent"></div><div class="blog-card-inner"><div class="blog-card-top">'+tagHTML+'</div><div class="blog-card-title">'+esc(b.title||'\無\題')+'</div><div class="blog-card-preview">'+esc(preview)+'</div><div class="blog-card-meta"><span class="blog-author-link" onclick="event.stopPropagation();openProfileByUsername(\''+esc(b.uid||b.author||'')+'\')">'+esc(b.author||'\ゲ\ス\ト')+'</span><span>'+(date?date:'')+'</span></div><div class="blog-card-actions"><button class="blog-read-btn" onclick="openBlogPost(\''+id+'\')">\ud83d\udcd6 \読\む</button>'+ownHTML+'</div></div>';
  return el;
}

function renderDeckSection(entries){
  document.getElementById('deckCountLbl').textContent=entries.length;
  const emptyEl=document.getElementById('emptyDecks');const grid=document.getElementById('deckGrid');
  if(!entries.length){const MSG={all:['\単\語\帳\が\あ\り\ま\せ\ん','\最\初\の\デ\ッ\キ\を\作\り\ま\し\ょ\う'],mine:['\ま\だ\デ\ッ\キ\が\あ\り\ま\せ\ん','\＋ \ボ\タ\ン\か\ら\デ\ッ\キ\を\作\成\し\よ\う'],fav:['\お\気\に\入\り\が\あ\り\ま\せ\ん','\★ \ボ\タ\ン\で\お\気\に\入\り\に\追\加\し\よ\う']};document.getElementById('emptyDecksTitle').textContent=currentTagFilter?'\「'+currentTagFilter+'\」\の\単\語\帳\が\あ\り\ま\せ\ん':MSG[currentTab][0];document.getElementById('emptyDecksSub').textContent=currentTagFilter?'\別\の\タ\グ\も\試\し\て\み\ま\し\ょ\う':MSG[currentTab][1];emptyEl.style.display='flex';grid.style.display='none';return;}
  emptyEl.style.display='none';grid.style.display='grid';grid.innerHTML='';entries.forEach(([id,d])=>{const own=session&&d.uid===session.uid;grid.appendChild(mkDeckCard(id,d,own));});
}
function renderBlogSection(entries){
  document.getElementById('blogCountLbl').textContent=entries.length;const emptyEl=document.getElementById('emptyBlogs');const grid=document.getElementById('blogGrid');
  if(!entries.length){document.getElementById('emptyBlogsTitle').textContent=currentTagFilter?'\「'+currentTagFilter+'\」\の\ブ\ロ\グ\が\あ\り\ま\せ\ん':'\解\説\ブ\ロ\グ\が\あ\り\ま\せ\ん';document.getElementById('emptyBlogsSub').textContent=currentTagFilter?'\別\の\タ\グ\も\試\し\て\み\ま\し\ょ\う':'\最\初\の\ブ\ロ\グ\を\書\き\ま\し\ょ\う';emptyEl.style.display='flex';grid.style.display='none';return;}
  emptyEl.style.display='none';grid.style.display='grid';grid.innerHTML='';entries.forEach(([id,b])=>{const own=session&&b.uid===session.uid;grid.appendChild(mkBlogCard(id,b,own));});
}
function stripMd(text){return text.replace(/```[\s\S]*?```/g,'[\コ\ー\ド\ブ\ロ\ッ\ク]').replace(/`[^`]+`/g,'').replace(/#{1,6}\s/g,'').replace(/\*\*([^*]+)\*\*/g,'$1').replace(/\*([^*]+)\*/g,'$1').replace(/>\s/g,'').replace(/\|\|([^|]+)\|\|/g,'[\ネ\タ\バ\レ]').replace(/[-*]\s/g,'').trim();}

function openCreateModal(){if(!session){showToast('\デ\ッ\キ\の\作\成\に\は\ロ\グ\イ\ン\が\必\要\で\す');showAuth('login');return;}document.getElementById('createOv').classList.add('open');setTimeout(()=>document.getElementById('newName').focus(),50);}
function closeCreateModal(){document.getElementById('createOv').classList.remove('open');document.getElementById('newName').value='';document.getElementById('newDesc').value='';selectedTag='';document.querySelectorAll('#deckTagGrid .tag-opt').forEach(el=>el.classList.remove('on'));}
async function createDeck(){const name=document.getElementById('newName').value.trim().slice(0,MAX_NAME);if(!name){showToast('\デ\ッ\キ\名\を\入\力\し\て\く\だ\さ\い');return;}const id='dk_'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);const deck={name,desc:document.getElementById('newDesc').value.trim().slice(0,200),tag:selectedTag||'',author:session.username,uid:session.uid,cc:0,fc:0,vc:0,ct:Date.now(),ut:Date.now()};await writeDeck(id,deck);closeCreateModal();showToast('\デ\ッ\キ\を\作\成\し\ま\し\た');await openEdit(id);}
async function confirmDelete(id){if(!confirm('\こ\の\デ\ッ\キ\を\削\除\し\ま\す\か\？'))return;await deleteDeckData(id);showToast('\削\除\し\ま\し\た');loadHome(true);}

async function openEdit(id){
  currentDeckId=id;const all=await fetchDecks(false);const deck=all[id]||lsD()[id];if(!deck)return;
  const isOwner=session&&deck.uid===session.uid;const isCollab=session&&deck.collabs&&deck.collabs[session.username];
  if(!session||(!isOwner&&!isCollab)){showToast('\編\集\権\限\が\あ\り\ま\せ\ん');return;}
  document.getElementById('editName').value=deck.name||'';document.getElementById('editTagSel').value=deck.tag||'';currentDeckName=deck.name||'';
  const raw=await fetchCards(id,false);editCards=Object.entries(raw).map(([cid,c])=>({id:cid,f:c.f||'',b:c.b||'',fi:c.fi||'',bi:c.bi||''}));
  renderEditList();showView('edit');
}
function renderEditList(){
  const list=document.getElementById('editList');list.innerHTML='';const cnt=editCards.length;
  document.getElementById('editCntLbl').textContent=cnt;document.getElementById('editWarn').classList.toggle('show',cnt>=MAX_CARDS);
  editCards.forEach(function(card,i){
    const row=document.createElement('div');row.className='crow';row.setAttribute('draggable','true');
    const handle=document.createElement('div');handle.className='crow-handle';handle.title='\ド\ラ\ッ\グ\し\て\並\び\替\え';handle.innerHTML='<span class="drag-icon">\⠿</span>';
    const numCell=document.createElement('div');numCell.className='crow-num';numCell.textContent=String(i+1).padStart(2,'0');
    const fi=document.createElement('input');fi.className='crow-inp';fi.type='text';fi.placeholder='\表\面\の\テ\キ\ス\ト';fi.value=card.f;fi.oninput=function(){editCards[i].f=this.value.slice(0,MAX_FIELD);};
    const fiBtnWrap=document.createElement('div');fiBtnWrap.style.cssText='display:flex;align-items:center;justify-content:center;border-right:1px solid var(--border);';
    const fiBtn=document.createElement('button');fiBtn.className='crow-img-btn'+(card.fi?' has-img':'');fiBtn.title=card.fi?'\表\面\画\像\を\変\更/\削\除':'\表\面\に\画\像\を\追\加';fiBtn.textContent=card.fi?'\ud83d\uddbc':'\ud83d\udcf7';fiBtn.onclick=function(){openCardImgPicker(i,'f');};fiBtnWrap.appendChild(fiBtn);
    const bi=document.createElement('input');bi.className='crow-inp';bi.type='text';bi.placeholder='\裏\面\の\テ\キ\ス\ト';bi.value=card.b;bi.oninput=function(){editCards[i].b=this.value.slice(0,MAX_FIELD);};
    const bkDiv=document.createElement('div');bkDiv.className='crow-bk';bkDiv.appendChild(bi);
    const biBtnWrap=document.createElement('div');biBtnWrap.style.cssText='display:flex;align-items:center;justify-content:center;border-right:1px solid var(--border);background:var(--primary-l);';
    const biBtn=document.createElement('button');biBtn.className='crow-img-btn'+(card.bi?' has-img':'');biBtn.title=card.bi?'\裏\面\画\像\を\変\更/\削\除':'\裏\面\に\画\像\を\追\加';biBtn.textContent=card.bi?'\ud83d\uddbc':'\ud83d\udcf7';biBtn.onclick=function(){openCardImgPicker(i,'b');};biBtnWrap.appendChild(biBtn);
    const del=document.createElement('button');del.className='crow-del';del.textContent='\✕';del.onclick=function(){delRow(i);};
    row.appendChild(handle);row.appendChild(numCell);row.appendChild(fi);row.appendChild(fiBtnWrap);row.appendChild(bkDiv);row.appendChild(biBtnWrap);row.appendChild(del);
    list.appendChild(row);
    row.addEventListener('dragstart',function(e){dragSrcIdx=i;e.dataTransfer.effectAllowed='move';setTimeout(()=>row.classList.add('dragging'),0);});
    row.addEventListener('dragend',function(){row.classList.remove('dragging');document.querySelectorAll('.crow').forEach(r=>r.classList.remove('drag-over'));dragSrcIdx=null;});
    row.addEventListener('dragover',function(e){e.preventDefault();e.dataTransfer.dropEffect='move';document.querySelectorAll('.crow').forEach(r=>r.classList.remove('drag-over'));if(dragSrcIdx!==i)row.classList.add('drag-over');});
    row.addEventListener('drop',function(e){e.preventDefault();e.stopPropagation();if(dragSrcIdx!==null&&dragSrcIdx!==i){const moved=editCards.splice(dragSrcIdx,1)[0];editCards.splice(i,0,moved);renderEditList();showToast('\並\び\替\え\ま\し\た');}});
    handle.addEventListener('touchstart',function(e){e.preventDefault();touchDragIdx=i;touchDragOriginEl=row;touchDragActive=true;row.classList.add('dragging');const touch=e.touches[0];touchDragGhost=document.createElement('div');touchDragGhost.className='touch-drag-ghost';touchDragGhost.textContent=(editCards[i].f||'\（\空\）').slice(0,28);touchDragGhost.style.top=(touch.clientY-22)+'px';document.body.appendChild(touchDragGhost);},{passive:false});
    handle.addEventListener('touchmove',function(e){if(!touchDragActive)return;e.preventDefault();const touch=e.touches[0];if(touchDragGhost)touchDragGhost.style.top=(touch.clientY-22)+'px';document.querySelectorAll('.crow').forEach(r=>r.classList.remove('drag-over'));const el2=document.elementFromPoint(touch.clientX,touch.clientY);const targetRow=el2?el2.closest('.crow'):null;if(targetRow&&targetRow!==touchDragOriginEl)targetRow.classList.add('drag-over');},{passive:false});
    handle.addEventListener('touchend',function(e){if(!touchDragActive)return;const touch=e.changedTouches[0];if(touchDragGhost){touchDragGhost.remove();touchDragGhost=null;}if(touchDragOriginEl)touchDragOriginEl.classList.remove('dragging');document.querySelectorAll('.crow').forEach(r=>r.classList.remove('drag-over'));touchDragActive=false;const el2=document.elementFromPoint(touch.clientX,touch.clientY);const targetRow=el2?el2.closest('.crow'):null;if(targetRow&&targetRow!==touchDragOriginEl){const rows=[...document.querySelectorAll('.crow')];const targetIdx=rows.indexOf(targetRow);if(targetIdx>=0&&targetIdx!==touchDragIdx){const moved=editCards.splice(touchDragIdx,1)[0];editCards.splice(targetIdx,0,moved);renderEditList();showToast('\並\び\替\え\ま\し\た \✓');}}touchDragIdx=null;touchDragOriginEl=null;});
  });
}
function addRow(){if(editCards.length>=MAX_CARDS){showToast('\カ\ー\ド\の\上\限\（150\枚\）\に\達\し\ま\し\た');return;}editCards.push({id:'c_'+Date.now().toString(36)+Math.random().toString(36).slice(2,4),f:'',b:'',fi:'',bi:''});renderEditList();const rows=document.querySelectorAll('.crow');if(rows.length)rows[rows.length-1].querySelector('input').focus();}
function delRow(i){editCards.splice(i,1);renderEditList();}
async function saveDeck(){
  const name=document.getElementById('editName').value.trim().slice(0,MAX_NAME);if(!name){showToast('\デ\ッ\キ\名\を\入\力\し\て\く\だ\さ\い');return;}
  const newTag=document.getElementById('editTagSel').value;const valid=editCards.filter(c=>(c.f||'').trim()||(c.b||'').trim());const cardsObj={};valid.forEach(c=>{const cd={f:(c.f||'').slice(0,MAX_FIELD),b:(c.b||'').slice(0,MAX_FIELD)};if(c.fi)cd.fi=c.fi;if(c.bi)cd.bi=c.bi;cardsObj[c.id]=cd;});
  const all=await fetchDecks(false);const ex=all[currentDeckId]||lsD()[currentDeckId]||{};await writeDeck(currentDeckId,{...ex,name,tag:newTag,cc:valid.length,ut:Date.now()});await writeCards(currentDeckId,cardsObj);currentDeckName=name;showToast('\保\存\し\ま\し\た \✓');loadHome(true);
}

function openCreateBlogModal(){if(!session){showToast('\ブ\ロ\グ\の\作\成\に\は\ロ\グ\イ\ン\が\必\要\で\す');showAuth('login');return;}document.getElementById('createBlogOv').classList.add('open');setTimeout(()=>document.getElementById('newBlogTitle').focus(),50);}
function closeCreateBlogModal(){document.getElementById('createBlogOv').classList.remove('open');document.getElementById('newBlogTitle').value='';selectedBlogTag='';document.querySelectorAll('#blogTagGrid .tag-opt').forEach(el=>el.classList.remove('on'));}
async function createBlog(){const title=document.getElementById('newBlogTitle').value.trim().slice(0,MAX_NAME);if(!title){showToast('\タ\イ\ト\ル\を\入\力\し\て\く\だ\さ\い');return;}const id='bl_'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);const blog={title,tag:selectedBlogTag||'',content:'',author:session.username,uid:session.uid,ct:Date.now(),ut:Date.now()};await writeBlog(id,blog);closeCreateBlogModal();showToast('\ブ\ロ\グ\を\作\成\し\ま\し\た');openBlogEditById(id);}
async function openBlogEditById(id){const all=await fetchBlogs(false);const blog=all[id]||lsB()[id];if(!blog)return;const isOwner=session&&blog.uid===session.uid;const isCollab=session&&blog.collabs&&blog.collabs[session.username];if(!session||(!isOwner&&!isCollab)){showToast('\編\集\権\限\が\あ\り\ま\せ\ん');return;}currentBlogId=id;currentBlogData={...blog};document.getElementById('blogEditTitle').value=blog.title||'';document.getElementById('blogEditTag').value=blog.tag||'';document.getElementById('blogEditContent').value=blog.content||'';switchBlogEditTab('write');showView('blog-edit');}
async function openBlogEdit(){if(currentBlogId)openBlogEditById(currentBlogId);}
async function saveBlog(){const title=document.getElementById('blogEditTitle').value.trim().slice(0,MAX_NAME);if(!title){showToast('\タ\イ\ト\ル\を\入\力\し\て\く\だ\さ\い');return;}const tag=document.getElementById('blogEditTag').value;const content=document.getElementById('blogEditContent').value.slice(0,50000);const all=await fetchBlogs(false);const ex=all[currentBlogId]||lsB()[currentBlogId]||{};await writeBlog(currentBlogId,{...ex,title,tag,content,ut:Date.now()});showToast('\公\開\し\ま\し\た \✓');loadHome(true);}
async function confirmDeleteBlog(id){if(!confirm('\こ\の\ブ\ロ\グ\を\削\除\し\ま\す\か\？'))return;await deleteBlogData(id);showToast('\削\除\し\ま\し\た');loadHome(true);}
async function deleteBlogPost(){if(currentBlogId)await confirmDeleteBlog(currentBlogId);}

async function openBlogPost(id){
  const all=await fetchBlogs(false);const blog=all[id]||lsB()[id];if(!blog)return;
  currentBlogId=id;currentBlogData=blog;_currentBlogAuthorUid=blog.uid||blog.author||'';
  const tag=blog.tag||'';document.getElementById('blogPostTag').textContent=tag||'\ブ\ロ\グ';document.getElementById('blogPostTag').style.display=tag?'inline-flex':'none';
  document.getElementById('blogPostTitle').textContent=blog.title||'\無\題';document.getElementById('blogPostAuthorLink').textContent=blog.author||'\ゲ\ス\ト';document.getElementById('blogPostDate').textContent=blog.ut?new Date(blog.ut).toLocaleDateString('ja-JP',{year:'numeric',month:'long',day:'numeric'}):'';
  document.getElementById('blogPostBody').innerHTML=renderMarkdown(blog.content||'');
  document.getElementById('blogPostOwnerActions').style.display=(session&&blog.uid===session.uid)?'flex':'none';
  document.querySelectorAll('#blogPostBody .spoiler').forEach(el=>el.addEventListener('click',function(){this.classList.toggle('revealed');}));
  showView('blog-post');await loadComments(id);
}
function switchBlogEditTab(tab){document.getElementById('blogTabWrite').classList.toggle('on',tab==='write');document.getElementById('blogTabPreview').classList.toggle('on',tab==='preview');document.getElementById('blogWritePane').style.display=tab==='write'?'block':'none';document.getElementById('blogPreviewPane').style.display=tab==='preview'?'block':'none';if(tab==='preview')livePreview();}
function livePreview(){const content=document.getElementById('blogEditContent').value;document.getElementById('livePreviewBody').innerHTML=renderMarkdown(content);document.querySelectorAll('#livePreviewBody .spoiler').forEach(el=>el.addEventListener('click',function(){this.classList.toggle('revealed');}));}

function renderMarkdown(text){
  if(!text)return'';let html=esc(text);const codeBlocks=[];
  html=html.replace(/```(\w*)\
?([\s\S]*?)```/g,function(_,lang,code){const idx=codeBlocks.length;codeBlocks.push('<pre><code'+(lang?' class="lang-'+esc(lang)+'"':'')+'>'+(code.trim())+'</code></pre>');return '\x00CB'+idx+'\x00';});
  const inlineCodes=[];html=html.replace(/`([^`]+)`/g,function(_,code){const idx=inlineCodes.length;inlineCodes.push('<code>'+code+'</code>');return '\x00IC'+idx+'\x00';});
  html=html.replace(/\|\|([^|]+)\|\|/g,'<span class="spoiler">$1</span>');html=html.replace(/\*\*([^*\
]+)\*\*/g,'<strong>$1</strong>');html=html.replace(/\*([^*\
]+)\*/g,'<em>$1</em>');html=html.replace(/_([^_\
]+)_/g,'<em>$1</em>');html=html.replace(/~~([^~\
]+)~~/g,'<s>$1</s>');html=html.replace(/__([^_\
]+)__/g,'<u>$1</u>');
  const lines=html.split('\
');const out=[];let inList=false,inOl=false,inBlockquote=false;
  function closeList(){if(inList){out.push('</ul>');inList=false;}if(inOl){out.push('</ol>');inOl=false;}}
  function closeBq(){if(inBlockquote){out.push('</blockquote>');inBlockquote=false;}}
  for(let i=0;i<lines.length;i++){const line=lines[i];
    if(/^#{6}\s/.test(line)){closeList();closeBq();out.push('<h3>'+line.replace(/^#{6}\s/,'')+'</h3>');continue;}
    if(/^#{5}\s/.test(line)){closeList();closeBq();out.push('<h3>'+line.replace(/^#{5}\s/,'')+'</h3>');continue;}
    if(/^#{4}\s/.test(line)){closeList();closeBq();out.push('<h3>'+line.replace(/^#{4}\s/,'')+'</h3>');continue;}
    if(/^###\s/.test(line)){closeList();closeBq();out.push('<h3>'+line.replace(/^###\s/,'')+'</h3>');continue;}
    if(/^##\s/.test(line)){closeList();closeBq();out.push('<h2>'+line.replace(/^##\s/,'')+'</h2>');continue;}
    if(/^#\s/.test(line)){closeList();closeBq();out.push('<h1>'+line.replace(/^#\s/,'')+'</h1>');continue;}
    if(/^---+$/.test(line.trim())||/^\*\*\*+$/.test(line.trim())){closeList();closeBq();out.push('<hr>');continue;}
    if(/^&gt;\s/.test(line)){closeList();if(!inBlockquote){out.push('<blockquote>');inBlockquote=true;}out.push(line.replace(/^&gt;\s/,''));continue;}else if(inBlockquote&&line.trim()===''){closeBq();out.push('');continue;}else{closeBq();}
    if(/^\d+\.\s/.test(line)){closeList();if(!inOl){out.push('<ol>');inOl=true;}out.push('<li>'+line.replace(/^\d+\.\s/,'')+'</li>');continue;}
    if(/^[-*]\s/.test(line)){if(inOl){out.push('</ol>');inOl=false;}if(!inList){out.push('<ul>');inList=true;}out.push('<li>'+line.replace(/^[-*]\s/,'')+'</li>');continue;}
    closeList();if(line.trim()===''){out.push('<br>');continue;}out.push('<p>'+line+'</p>');
  }
  closeList();closeBq();let result=out.join('\
');
  inlineCodes.forEach((code,i)=>{result=result.split('\x00IC'+i+'\x00').join(code);});codeBlocks.forEach((block,i)=>{result=result.split('\x00CB'+i+'\x00').join(block);});
  result=result.replace(/(?<!\=["'])(https?:\/\/[^\s<>"']+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>');return result;
}

async function openStudy(id){currentDeckId=id;const all=await fetchDecks(false);const deck=all[id]||lsD()[id]||{};currentDeckName=deck.name||'\デ\ッ\キ';document.getElementById('modeDeckName').textContent=currentDeckName;incrementViewCount(id);showView('mode');}
async function startMode(mode){
  const raw=await fetchCards(currentDeckId,false);let arr=Object.entries(raw).map(([cid,c])=>({id:cid,f:c.f||'\—',b:c.b||'\—'}));
  if(!arr.length){showToast('\カ\ー\ド\が\あ\り\ま\せ\ん');return;}
  if(mode==='quiz'){if(arr.length<2){showToast('\ク\イ\ズ\に\は\最\低2\枚\必\要\で\す');return;}studyCards=shuffle(arr);quizCards=shuffle([...studyCards]);quizIdx=0;quizScore=0;showView('quiz');renderQuizQ();return;}
  studyCards=mode==='random'?shuffle(arr):arr;studyIdx=0;studyFlipped=false;studySeenAll=false;studyCorrect=0;document.getElementById('studyDone').classList.remove('show');showView('study');updateStudyCard();
}
function updateStudyCard(){
  if(!studyCards.length){document.getElementById('fFront').textContent='\カ\ー\ド\が\あ\り\ま\せ\ん';document.getElementById('fBack').textContent='\デ\ッ\キ\に\カ\ー\ド\を\追\加\し\て\く\だ\さ\い';document.getElementById('studyLbl').textContent='0 / 0';return;}
  const card=studyCards[studyIdx];
  const ffEl=document.getElementById('fFront');ffEl.textContent=card.f;const fImgEl=document.getElementById('fFrontImg');
  if(card.fi){fImgEl.src=card.fi;fImgEl.style.display='block';}else{fImgEl.src='';fImgEl.style.display='none';}
  const fbEl=document.getElementById('fBack');fbEl.textContent=card.b;const bImgEl=document.getElementById('fBackImg');
  if(card.bi){bImgEl.src=card.bi;bImgEl.style.display='block';}else{bImgEl.src='';bImgEl.style.display='none';}
  document.getElementById('card3d').classList.remove('flipped');studyFlipped=false;
  const pct=((studyIdx+1)/studyCards.length*100).toFixed(1);document.getElementById('studyProg').style.width=pct+'%';document.getElementById('studyLbl').textContent=(studyIdx+1)+' / '+studyCards.length;
  if(studyIdx===studyCards.length-1&&!studySeenAll){studySeenAll=true;markProgress(currentDeckId,'study');logHistory(currentDeckId,currentDeckName,'study',studyCorrect,studyCards.length);setTimeout(()=>document.getElementById('studyDone').classList.add('show'),700);}
}
function flipCard(){studyFlipped=!studyFlipped;document.getElementById('card3d').classList.toggle('flipped',studyFlipped);}
function nextCard(){studyIdx=(studyIdx+1)%studyCards.length;updateStudyCard();}
function prevCard(){studyIdx=(studyIdx-1+studyCards.length)%studyCards.length;updateStudyCard();}
function mark(ok){if(ok)studyCorrect++;showToast(ok?'\✓ \覚\え\た\！':'\↺ \も\う\一\度\！');nextCard();}
function restartStudy(){studyCards=shuffle(studyCards);studyIdx=0;studySeenAll=false;studyCorrect=0;document.getElementById('studyDone').classList.remove('show');updateStudyCard();}

function setupStudySwipe(){
  const scene=document.getElementById('studyScene');if(!scene)return;
  let sx=0,sy=0,st=0,touching=false;const THRESH=50,TAP_MS=300,TAP_DIST=18;
  const hintKnow=document.getElementById('hintKnow');const hintAgain=document.getElementById('hintAgain');
  function clearHints(){hintKnow&&hintKnow.classList.remove('show');hintAgain&&hintAgain.classList.remove('show');}
  scene.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;sy=e.touches[0].clientY;st=Date.now();touching=true;},{passive:true});
  scene.addEventListener('touchmove',function(e){if(!touching)return;const dy=e.touches[0].clientY-sy,dx=e.touches[0].clientX-sx;const ady=Math.abs(dy),adx=Math.abs(dx);if(ady>28&&ady>adx){if(dy<0){clearHints();hintKnow&&hintKnow.classList.add('show');}else{clearHints();hintAgain&&hintAgain.classList.add('show');}}else{clearHints();}},{passive:true});
  scene.addEventListener('touchend',function(e){if(!touching)return;touching=false;clearHints();e.preventDefault();if(!document.getElementById('view-study').classList.contains('active'))return;const t=e.changedTouches[0];const dx=t.clientX-sx,dy=t.clientY-sy,dt=Date.now()-st;const adx=Math.abs(dx),ady=Math.abs(dy);if(adx<TAP_DIST&&ady<TAP_DIST&&dt<TAP_MS){flipCard();return;}if(adx>THRESH&&adx>ady*1.2){dx>0?prevCard():nextCard();return;}if(ady>THRESH&&ady>adx*1.2){dy<0?mark(true):mark(false);}},{passive:false});
  scene.addEventListener('click',function(){flipCard();});
}

function startQuiz(){if(studyCards.length<2){showToast('\ク\イ\ズ\に\は\最\低2\枚\必\要\で\す');return;}quizCards=shuffle([...studyCards]);quizIdx=0;quizScore=0;showView('quiz');renderQuizQ();}
function renderQuizQ(){
  const body=document.getElementById('quizBody');
  if(quizIdx>=quizCards.length){markProgress(currentDeckId,'quiz');logHistory(currentDeckId,currentDeckName,'quiz',quizScore,quizCards.length);const pct=Math.round(quizScore/quizCards.length*100);const msg=pct>=80?'\素\晴\ら\し\い\！\ud83c\udf89':pct>=50?'\も\う\少\し\！\ud83d\udcaa':'\練\習\を\続\け\よ\う \ud83d\udcda';body.innerHTML='<div class="quiz-result"><div class="qr-top"><div class="qr-pct">'+pct+'%</div><div class="qr-sub">'+quizScore+' / '+quizCards.length+' \正\解</div></div><div class="qr-body"><div class="qr-title">'+msg+'</div><div class="qr-desc">\ク\イ\ズ\終\了</div><div class="qr-acts"><button class="btn btn-primary btn-sm" onclick="startQuiz()">\も\う\一\度\ク\イ\ズ</button><button class="btn btn-outline btn-sm" onclick="showView(\'mode\')">\モ\ー\ド\選\択\へ</button><button class="btn btn-ghost btn-sm" onclick="goHome()">\ホ\ー\ム\へ</button></div></div></div>';document.getElementById('quizProg').style.width='100%';return;}
  const q=quizCards[quizIdx];const others=quizCards.filter((_,i)=>i!==quizIdx);shuffle(others);const opts=shuffle([q.b,...others.slice(0,3).map(c=>c.b)]);const lbls=['A','B','C','D'];
  document.getElementById('quizProg').style.width=(quizIdx/quizCards.length*100)+'%';document.getElementById('quizLbl').textContent=(quizIdx+1)+' / '+quizCards.length;
  const frag=document.createDocumentFragment();const qBox=document.createElement('div');qBox.className='quiz-q';const qn=document.createElement('div');qn.className='quiz-qn';qn.textContent='Q '+(quizIdx+1);const qt=document.createElement('div');qt.className='quiz-qt';qt.textContent=q.f;qBox.appendChild(qn);qBox.appendChild(qt);frag.appendChild(qBox);
  const optsDiv=document.createElement('div');optsDiv.className='quiz-opts';const correctBtn={ref:null};
  opts.forEach(function(opt,i){const btn=document.createElement('button');btn.className='qopt';const lbl=document.createElement('span');lbl.className='qopt-lbl';lbl.textContent=lbls[i]||'';const txt=document.createElement('span');txt.textContent=opt;btn.appendChild(lbl);btn.appendChild(txt);if(opt===q.b)correctBtn.ref=btn;btn.onclick=function(){checkAns(btn,opt,q.b,correctBtn.ref);};optsDiv.appendChild(btn);});
  frag.appendChild(optsDiv);const fb=document.createElement('div');fb.className='quiz-fb';fb.id='quizFb';frag.appendChild(fb);body.innerHTML='';body.appendChild(frag);
}
function checkAns(el,chosen,correct,correctEl){document.querySelectorAll('.qopt').forEach(b=>b.disabled=true);const fb=document.getElementById('quizFb');if(chosen===correct){el.classList.add('correct');fb.className='quiz-fb ok';fb.textContent='\⭕  \正\解\！';quizScore++;}else{el.classList.add('wrong');if(correctEl)correctEl.classList.add('correct');fb.className='quiz-fb ng';fb.textContent='\✗  \不\正\解 \— \正\解: '+correct;}setTimeout(function(){quizIdx++;renderQuizQ();},1900);}

async function showHistoryView(){showView('history');setAllTabsOff();document.getElementById('tab-hist').classList.add('on');const logs=await fetchHistory();renderHistoryStats(logs);renderHistoryChart(logs);renderHistoryList(logs);document.getElementById('histNoLogin').style.display=session?'none':'block';}
function renderHistoryStats(logs){document.getElementById('statTotal').textContent=logs.length;const dates=new Set(logs.map(l=>l.date));let streak=0;const today=new Date();for(let i=0;i<60;i++){const d=new Date(today);d.setDate(d.getDate()-i);if(dates.has(d.toISOString().slice(0,10)))streak++;else if(i>0)break;}document.getElementById('statStreak').textContent=streak;const quizLogs=logs.filter(l=>l.mode==='quiz'&&l.total>0);document.getElementById('statAvg').textContent=quizLogs.length?Math.round(quizLogs.reduce((s,l)=>s+l.score,0)/quizLogs.length)+'':'\—';}
function renderHistoryChart(logs){
  const canvas=document.getElementById('histChart'),emptyEl=document.getElementById('chartEmpty');if(!canvas)return;
  const N=14;const dates=[];const today=new Date();for(let i=N-1;i>=0;i--){const d=new Date(today);d.setDate(d.getDate()-i);dates.push(d.toISOString().slice(0,10));}
  const studyByDay={},quizByDay={};logs.forEach(l=>{if(!dates.includes(l.date))return;if(l.mode==='study'||l.mode==='ordered'||l.mode==='random')studyByDay[l.date]=(studyByDay[l.date]||0)+1;else if(l.mode==='quiz')quizByDay[l.date]=(quizByDay[l.date]||0)+1;});
  const maxVal=Math.max(1,...dates.map(d=>(studyByDay[d]||0)+(quizByDay[d]||0)));const hasData=dates.some(d=>(studyByDay[d]||0)+(quizByDay[d]||0)>0);
  if(!hasData){canvas.style.display='none';emptyEl.style.display='flex';return;}
  canvas.style.display='block';emptyEl.style.display='none';
  const dpr=window.devicePixelRatio||1;const W=canvas.parentElement.clientWidth-40,H=180;canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';
  const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
  const isDark=document.documentElement.getAttribute('data-theme')==='dark';const primaryColor=isDark?'#9D8EFF':'#7B6CF6';const accentColor=isDark?'#FF9674':'#F5835B';const textColor=isDark?'#5A576E':'#B2AFCA';const lineColor=isDark?'rgba(255,255,255,0.04)':'rgba(123,108,246,0.07)';
  const PAD_L=8,PAD_R=8,PAD_T=10,PAD_B=32;const chartW=W-PAD_L-PAD_R,chartH=H-PAD_T-PAD_B;const barGroupW=chartW/N,barW=Math.min(16,(barGroupW-6)/2),gap=2;let progress=0;
  function draw(p){ctx.clearRect(0,0,W,H);ctx.strokeStyle=lineColor;ctx.lineWidth=1;for(let i=0;i<=4;i++){const y=PAD_T+chartH*(1-i/4);ctx.beginPath();ctx.moveTo(PAD_L,y);ctx.lineTo(W-PAD_R,y);ctx.stroke();}dates.forEach((date,i)=>{const sv=studyByDay[date]||0,qv=quizByDay[date]||0;const cx=PAD_L+i*barGroupW+barGroupW/2;if(sv>0){const bh=chartH*(sv/maxVal)*p,x=cx-barW-gap/2,y=PAD_T+chartH-bh,r2=Math.min(3,bh/2);ctx.fillStyle=primaryColor;ctx.beginPath();ctx.roundRect(x,y,barW,bh,r2);ctx.fill();}if(qv>0){const bh=chartH*(qv/maxVal)*p,x=cx+gap/2,y=PAD_T+chartH-bh,r2=Math.min(3,bh/2);ctx.fillStyle=accentColor;ctx.beginPath();ctx.roundRect(x,y,barW,bh,r2);ctx.fill();}if(i%2===0||N<=7){ctx.fillStyle=textColor;ctx.font='10px "DM Mono","Plus Jakarta Sans",sans-serif';ctx.textAlign='center';const d=new Date(date);ctx.fillText((d.getMonth()+1)+'/'+(d.getDate()),cx,H-6);}});}
  function animate(){progress+=0.06;if(progress>=1){draw(1);return;}draw(progress);requestAnimationFrame(animate);}animate();
}
function renderHistoryList(logs){const list=document.getElementById('histList');if(!logs.length){list.innerHTML='<div style="color:var(--text3);font-size:13px;padding:12px 0;">\ま\だ\学\習\記\録\が\あ\り\ま\せ\ん</div>';return;}const recent=[...logs].sort((a,b)=>b.ts-a.ts).slice(0,20);list.innerHTML='';recent.forEach(function(log){const isQuiz=log.mode==='quiz';const dt=new Date(log.ts);const dtStr=dt.toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'})+' '+dt.toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'});const el=document.createElement('div');el.className='hist-item';el.innerHTML='<div class="hist-item-icon '+(isQuiz?'hist-icon-quiz':'hist-icon-study')+'">'+(isQuiz?'\ud83c\udfaf':'\ud83d\udcd6')+'</div><div class="hist-item-info"><div class="hist-item-deck">'+esc(log.deckName||'\—')+'</div><div class="hist-item-meta">'+(isQuiz?'\ク\イ\ズ':'\単\語\帳')+' \· '+dtStr+'</div></div>'+(isQuiz?'<div class="hist-item-score">'+log.score+'%</div>':'');list.appendChild(el);});}

function setAllTabsOff(){['tab-all','tab-mine','tab-fav','tab-hist'].forEach(t=>document.getElementById(t).classList.remove('on'));}
function showView(name){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById('view-'+name).classList.add('active');window.scrollTo({top:0,behavior:'smooth'});setAllTabsOff();if(name==='home')document.getElementById('tab-'+currentTab).classList.add('on');if(name==='history')document.getElementById('tab-hist').classList.add('on');}
function goHome(){loadHome(false);}
function switchTab(tab){currentTab=tab;setAllTabsOff();document.getElementById('tab-'+tab).classList.add('on');if(!document.getElementById('view-home').classList.contains('active'))loadHome(false);else renderCurrentContent();}
// ── Modal overlay close handlers ──
['createOv','createBlogOv','profileEditOv','followListOv','collabOv'].forEach(id=>{
  const el=document.getElementById(id);
  if(el)el.addEventListener('click',function(e){if(e.target===this)this.classList.remove('open');});
});

// ── Follow system ──
let _myFollowing={};
async function loadMyFollowing(){
  if(!session){_myFollowing={};return;}
  if(db){try{const snap=await db.ref('follows/'+session.username).once('value');_myFollowing=snap.val()||{};return;}catch(e){}}
  try{_myFollowing=JSON.parse(localStorage.getItem('fm_following_'+session.username)||'{}')}catch(e){_myFollowing={};}
}
async function toggleFollow(username){
  if(!session){showToast('フォローにはログインが必要です');showAuth('login');return;}
  const was=!!_myFollowing[username];
  if(was)delete _myFollowing[username]; else _myFollowing[username]=true;
  const btn=document.getElementById('followBtn');
  if(btn){btn.textContent=was?'フォローする':'フォロー中';btn.className='follow-btn '+(was?'follow':'unfollow');}
  showToast(was?'フォローを解除しました':'フォローしました ✓');
  if(db){try{if(was)await db.ref('follows/'+session.username+'/'+username).remove();else await db.ref('follows/'+session.username+'/'+username).set(true);}catch(e){}}
  try{const ls=JSON.parse(localStorage.getItem('fm_following_'+session.username)||'{}');if(was)delete ls[username];else ls[username]=true;localStorage.setItem('fm_following_'+session.username,JSON.stringify(ls));}catch(e){}
}
async function openFollowList(username,type){
  document.getElementById('followListTitle').textContent=type==='followers'?'フォロワー':'フォロー中';
  document.getElementById('followListOv').classList.add('open');
  const content=document.getElementById('followListContent');
  content.innerHTML='<div style="padding:20px;text-align:center;color:var(--text3)">読み込み中...</div>';
  try{
    let names=[];
    if(db){
      if(type==='followers'){
        const snap=await db.ref('follows').once('value');const all=snap.val()||{};
        names=Object.keys(all).filter(u=>all[u]&&all[u][username]);
      } else {
        const snap=await db.ref('follows/'+username).once('value');names=Object.keys(snap.val()||{});
      }
    }
    if(!names.length){content.innerHTML='<div style="padding:20px;text-align:center;color:var(--text3)">なし</div>';return;}
    content.innerHTML='';
    names.forEach(n=>{
      const el=document.createElement('div');
      el.style.cssText='padding:10px 16px;cursor:pointer;display:flex;align-items:center;gap:10px;';
      el.innerHTML='<canvas width="32" height="32" style="border-radius:50%"></canvas><span style="font-size:.9rem;font-weight:500">'+esc(n)+'</span>';
      el.onclick=()=>{closeFollowList();openProfileByUsername(n);};
      const cv=el.querySelector('canvas');const av=localStorage.getItem('fm_avatar_'+n)||null;
      drawAvatarCanvas(cv,n,av,32);
      content.appendChild(el);
    });
  }catch(e){content.innerHTML='<div style="padding:20px;text-align:center;color:var(--text3)">エラー</div>';}
}
function closeFollowList(){document.getElementById('followListOv').classList.remove('open');}

// ── Collab system ──
let _collabTarget='deck';
function openCollabModal(type){
  _collabTarget=type||'deck';
  document.getElementById('collabOv').classList.add('open');
  renderCollabList();
}
function closeCollabModal(){document.getElementById('collabOv').classList.remove('open');}
async function renderCollabList(){
  const list=document.getElementById('collabList');list.innerHTML='';
  const id=_collabTarget==='deck'?currentDeckId:currentBlogId;
  if(!id)return;
  let collabs={};
  if(db){try{const snap=await db.ref((_collabTarget==='deck'?'decks':'blogs')+'/'+id+'/collabs').once('value');collabs=snap.val()||{};}catch(e){}}
  Object.keys(collabs).forEach(u=>{
    const el=document.createElement('div');el.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);';
    el.innerHTML='<span style="font-size:.875rem">'+esc(u)+'</span><button onclick="removeCollab(''+esc(u)+'')" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:.8rem">削除</button>';
    list.appendChild(el);
  });
  if(!Object.keys(collabs).length)list.innerHTML='<div style="color:var(--text3);font-size:.85rem;padding:8px 0">共同編集者なし</div>';
}
async function addCollab(){
  const username=document.getElementById('collabInput').value.trim().toLowerCase();
  if(!username){showToast('ユーザー名を入力してください');return;}
  const id=_collabTarget==='deck'?currentDeckId:currentBlogId;
  if(!id)return;
  if(db){try{await db.ref((_collabTarget==='deck'?'decks':'blogs')+'/'+id+'/collabs/'+username).set(true);showToast(username+' を追加しました');document.getElementById('collabInput').value='';renderCollabList();}catch(e){showToast('エラー: '+e.message);}}
}
async function removeCollab(username){
  const id=_collabTarget==='deck'?currentDeckId:currentBlogId;
  if(!id)return;
  if(db){try{await db.ref((_collabTarget==='deck'?'decks':'blogs')+'/'+id+'/collabs/'+username).remove();renderCollabList();}catch(e){}}
}

// ── Comments ──
async function loadComments(blogId){
  const box=document.getElementById('commentsBox');if(!box)return;
  box.innerHTML='<div style="color:var(--text3);font-size:.85rem">読み込み中...</div>';
  if(!db){box.innerHTML='';return;}
  try{
    const snap=await db.ref('comments/'+blogId).orderByChild('ts').limitToLast(50).once('value');
    const data=snap.val()||{};
    const entries=Object.entries(data).sort((a,b)=>a[1].ts-b[1].ts);
    box.innerHTML='';
    if(!entries.length){box.innerHTML='<div style="color:var(--text3);font-size:.85rem;padding:8px 0">コメントはありません</div>';return;}
    entries.forEach(([cid,c])=>{
      const el=document.createElement('div');el.className='comment-item';
      const dt=c.ts?new Date(c.ts).toLocaleDateString('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'';
      const canDel=session&&(session.username===c.uid||session.username===(currentBlogData&&currentBlogData.uid));
      el.innerHTML='<div class="comment-header"><span class="comment-author" onclick="openProfileByUsername(''+esc(c.uid||'')+'')" style="cursor:pointer">'+esc(c.displayName||c.uid||'ゲスト')+'</span><span class="comment-date">'+dt+'</span>'+(canDel?'<button onclick="deleteComment(''+blogId+'',''+cid+'')" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:.8rem;margin-left:auto">✕</button>':'')+'</div><div class="comment-body">'+esc(c.body||'')+'</div>';
      box.appendChild(el);
    });
  }catch(e){box.innerHTML='';}
}
async function addComment(){
  if(!session){showToast('コメントにはログインが必要です');return;}
  const inp=document.getElementById('commentInput');const body=(inp&&inp.value||'').trim().slice(0,500);
  if(!body){showToast('コメントを入力してください');return;}
  if(!currentBlogId||!db)return;
  try{await db.ref('comments/'+currentBlogId).push({uid:session.username,displayName:session.displayName||session.username,body,ts:Date.now()});inp.value='';await loadComments(currentBlogId);}
  catch(e){showToast('エラー: '+e.message);}
}
async function deleteComment(blogId,cid){
  if(!db)return;
  try{await db.ref('comments/'+blogId+'/'+cid).remove();await loadComments(blogId);}catch(e){}
}

// ── Progress tracking ──
function getProgress(deckId){
  try{const p=JSON.parse(localStorage.getItem('fm_prog_'+deckId)||'{}');return p;}catch(e){return{};}
}
function markProgress(deckId,mode){
  try{const p=getProgress(deckId);p[mode]=true;localStorage.setItem('fm_prog_'+deckId,JSON.stringify(p));}catch(e){}
}

// ── Profile streak ──
async function loadProfileStreak(username){
  const el=document.getElementById('profileStreakCount');if(!el)return;
  try{
    const uid=username;let logs=[];
    if(db&&session&&session.username===username){const snap=await db.ref('logs/'+uid).limitToLast(100).once('value');logs=snap.val()?Object.values(snap.val()):[]}
    else{try{logs=JSON.parse(localStorage.getItem('fm_logs_'+uid)||'[]');}catch(e){}}
    const dates=new Set(logs.map(l=>l.date));let streak=0;const today=new Date();
    for(let i=0;i<60;i++){const d=new Date(today);d.setDate(d.getDate()-i);if(dates.has(d.toISOString().slice(0,10)))streak++;else if(i>0)break;}
    el.textContent=streak;
  }catch(e){if(el)el.textContent='0';}
}

// ── Image card picker ──
function openCardImgPicker(idx,side){
  const inp=document.createElement('input');inp.type='file';inp.accept='image/*';
  inp.onchange=function(e){
    const file=e.target.files[0];if(!file)return;
    if(file.size>2*1024*1024){showToast('画像は2MB以下にしてください');return;}
    const reader=new FileReader();
    reader.onload=function(ev){
      const img=new Image();img.onload=function(){
        const canvas=document.createElement('canvas');
        const MAX=600;const scale=Math.min(1,MAX/Math.max(img.width,img.height));
        canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);
        canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
        const data=canvas.toDataURL('image/jpeg',0.7);
        if(side==='f')editCards[idx].fi=data; else editCards[idx].bi=data;
        renderEditList();showToast('画像を設定しました ✓');
      };img.src=ev.target.result;
    };reader.readAsDataURL(file);
  };inp.click();
}

// ── Settings ──
function openSettings(){document.getElementById('settingsOv').classList.add('open');}
function closeSettings(){document.getElementById('settingsOv').classList.remove('open');}
function toggleTheme(){
  const cur=document.documentElement.getAttribute('data-theme')||'dark';
  const next=cur==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',next);
  try{localStorage.setItem('hg_theme',next);}catch(e){}
}
function saveSettings(){
  closeSettings();showToast('設定を保存しました ✓');
}
function loadTheme(){
  try{const t=localStorage.getItem('hg_theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}
}

// ── Push Notifications (PWA) ──
let _latestDeckTs = 0;
let _deckWatchActive = false;

function initServiceWorker(){
  if(!('serviceWorker' in navigator))return;
  navigator.serviceWorker.register('../sw.js').then(reg=>{
    console.log('[SW] registered');
    reg.addEventListener('updatefound',()=>{
      const w=reg.installing;
      w.addEventListener('statechange',()=>{
        if(w.state==='installed'&&navigator.serviceWorker.controller)showToast('アップデートがあります。再読み込みしてください。');
      });
    });
  }).catch(e=>console.warn('[SW]',e));

  window.addEventListener('beforeinstallprompt',e=>{
    e.preventDefault();window._deferredInstall=e;
    if(!localStorage.getItem('study_pwa_dismissed'))showInstallBanner();
  });
  window.addEventListener('appinstalled',()=>{hideInstallBanner();showToast('✓ ホーム画面に追加しました');});
}

function showInstallBanner(){const b=document.getElementById('studyInstallBanner');if(b)b.classList.add('show');}
function hideInstallBanner(){const b=document.getElementById('studyInstallBanner');if(b)b.classList.remove('show');}
function installStudyPWA(){
  if(window._deferredInstall){window._deferredInstall.prompt();window._deferredInstall.userChoice.then(r=>{if(r.outcome==='accepted')hideInstallBanner();window._deferredInstall=null;});}
  else{showToast('Safari の「共有」→「ホーム画面に追加」でインストールできます');hideInstallBanner();}
}
function dismissStudyInstall(){hideInstallBanner();localStorage.setItem('study_pwa_dismissed','1');}

async function requestPushPermission(){
  if(!('Notification' in window)){showToast('このブラウザは通知に対応していません');return;}
  const r=await Notification.requestPermission();
  if(r==='granted'){showToast('🔔 通知を許可しました');startDeckWatch();}
  else showToast('通知はブロックされました');
  document.getElementById('notifPromptBar')?.classList.remove('show');
  localStorage.setItem('notif_asked','1');
}

function showNotifPrompt(){
  if(!session)return;
  if(localStorage.getItem('notif_asked'))return;
  if(!('Notification' in window))return;
  if(Notification.permission==='granted'){startDeckWatch();return;}
  if(Notification.permission==='denied')return;
  const bar=document.getElementById('notifPromptBar');if(bar)bar.classList.add('show');
}

function dismissNotifPrompt(){
  document.getElementById('notifPromptBar')?.classList.remove('show');
  localStorage.setItem('notif_asked','1');
}

// Watch for new decks from followed users
function startDeckWatch(){
  if(!db||!session||_deckWatchActive)return;
  _deckWatchActive=true;

  db.ref('decks').orderByChild('ct').limitToLast(1).once('value').then(snap=>{
    const data=snap.val();
    if(data)_latestDeckTs=Math.max(...Object.values(data).map(d=>d.ct||0));

    db.ref('decks').orderByChild('ct').startAfter(_latestDeckTs).on('child_added',snap=>{
      const deck=snap.val();if(!deck||!deck.ct)return;
      if(deck.ct<=_latestDeckTs)return;
      _latestDeckTs=deck.ct;
      if(!deck.uid||deck.uid===session.username)return;
      if(!_myFollowing[deck.uid])return;

      // Followed user posted a new deck!
      const msg=(deck.uid)+'さんが新しい単語帳「'+(deck.name||'無題')+'」を作成しました';
      if(document.visibilityState==='visible'){
        showToast('🔔 '+msg);
      } else if(Notification.permission==='granted'){
        sendDeckNotification(deck.uid,deck.name||'無題',snap.key);
      }
    });
  }).catch(()=>{});
}

async function sendDeckNotification(author,deckName,deckId){
  if(!('serviceWorker' in navigator))return;
  try{
    const reg=await navigator.serviceWorker.ready;
    reg.showNotification('HGStudy — 新着デッキ',{
      body:author+'さんが「'+deckName+'」を公開しました',
      icon:'../icons/icon-192.png',
      badge:'../icons/icon-192.png',
      tag:'hgstudy-deck-'+deckId,
      renotify:true,
      vibrate:[200,100,200],
      data:{url:location.href}
    });
  }catch(e){console.warn('[Notif]',e);}
}

// ── Boot ──
async function boot(){
  loadTheme();
  const ok=initFirebase();
  loadSession();
  if(!ok)showToast('オフラインモードで動作中');
  await loadHome(false);
  setupStudySwipe();
  initServiceWorker();
  setTimeout(showNotifPrompt,2000);
}
document.addEventListener('DOMContentLoaded',boot);
