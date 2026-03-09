/* ═══════════════════════════════════════
   HGHome Official Script
═══════════════════════════════════════ */

/* ── Firebase Config ───────────────── */

const _cfg = {
  apiKey:[65,73,122,97,83,121,67,102,56,80,74,89,120,67,74,67,70,67,68,49,112,104,68,95,45,88,86,85,90,57,50,68,83,86,117,82,97,117,85],
  authDomain:[104,103,115,116,117,100,121,45,49,56,101,50,51,46,102,105,114,101,98,97,115,101,97,112,112,46,99,111,109],
  databaseURL:[104,116,116,112,115,58,47,47,104,103,115,116,117,100,121,45,49,56,101,50,51,45,100,101,102,97,117,108,116,45,114,116,100,98,46,97,115,105,97,45,115,111,117,116,104,101,97,115,116,49,46,102,105,114,101,98,97,115,101,100,97,116,97,98,97,115,101,46,97,112,112],
  projectId:[104,103,115,116,117,100,121,45,49,56,101,50,51],
  storageBucket:[104,103,115,116,117,100,121,45,49,56,101,50,51,46,102,105,114,101,98,97,115,101,115,116,111,114,97,103,101,46,97,112,112],
  appId:[49,58,55,50,48,49,53,48,55,49,50,55,55,53,58,119,101,98,58,54,51,50,98,50,98,100,54,102,48,52,52,49,97,56,51,100,55,52,57,101,50]
}

const decode=b=>b.map(v=>String.fromCharCode(v)).join("")

const firebaseConfig={
  apiKey:decode(_cfg.apiKey),
  authDomain:decode(_cfg.authDomain),
  databaseURL:decode(_cfg.databaseURL),
  projectId:decode(_cfg.projectId),
  storageBucket:decode(_cfg.storageBucket),
  messagingSenderId:"720150712775",
  appId:decode(_cfg.appId)
}

/* ── Firebase Init ───────────────── */

firebase.initializeApp(firebaseConfig)

const auth=firebase.auth()
const db=firebase.database()

/* ── State ───────────────── */

let session=null
let newsListener=null
const seenNews=new Set()
const pageLoadTime=Date.now()

/* ── Helpers ───────────────── */

const $=id=>document.getElementById(id)

function esc(s){
 return (s||"")
 .replace(/&/g,"&amp;")
 .replace(/</g,"&lt;")
 .replace(/>/g,"&gt;")
 .replace(/"/g,"&quot;")
}

/* ── Login / Register ───────────────── */

async function login(username,password){

 const email=`${username}@hghome.app`

 return auth.signInWithEmailAndPassword(email,password)

}

async function register(username,password){

 const email=`${username}@hghome.app`

 const cred=await auth.createUserWithEmailAndPassword(email,password)

 await db.ref("users/"+username).set({
  uid:cred.user.uid,
  username,
  createdAt:Date.now(),
  isAdmin:false
 })

}

/* ── Auth State ───────────────── */

auth.onAuthStateChanged(async user=>{

 if(!user){
  session=null
  updateUI()
  return
 }

 const username=user.email.replace("@hghome.app","")

 let isAdmin=false

 try{
  const snap=await db.ref("users/"+username).once("value")
  if(snap.val()) isAdmin=!!snap.val().isAdmin
 }catch{}

 session={
  uid:user.uid,
  username,
  isAdmin
 }

 updateUI()

})

/* ── UI Update ───────────────── */

function updateUI(){

 if(!session){
  $("navLoginBtn").style.display=""
  $("navUser").style.display="none"
  return
 }

 $("navLoginBtn").style.display="none"
 $("navUser").style.display="flex"

 const name=$("navUsername")
 name.textContent=session.username+(session.isAdmin?" [ADMIN]":"")
 name.className="nav-username"+(session.isAdmin?" admin":"")

 document.querySelectorAll(".post-btn")
 .forEach(b=>b.classList.toggle("visible",session.isAdmin))

}

/* ── News Listener ───────────────── */

function startNews(){

 if(newsListener) db.ref("news").off("value",newsListener)

 const ref=db.ref("news").orderByChild("ts").limitToLast(20)

 newsListener=ref.on("value",snap=>{

  const raw=snap.val()||{}

  const items=Object.entries(raw)
  .map(([id,v])=>({id,...v}))
  .sort((a,b)=>b.ts-a.ts)

  items.forEach(n=>{

   if(!seenNews.has(n.id)&&n.ts>pageLoadTime){
    notify(n)
   }

   seenNews.add(n.id)

  })

  renderNews(items)

 })

}

/* ── Render News ───────────────── */

function renderNews(list){

 const grid=$("newsGrid")
 if(!grid)return

 if(!list.length){
  grid.innerHTML='<div class="news-empty">まだニュースはありません</div>'
  return
 }

 grid.innerHTML=""

 list.forEach(n=>{

  const card=document.createElement("div")

  card.className="news-card"

  card.innerHTML=`
  <div class="news-title">${esc(n.title)}</div>
  <div class="news-content">${esc(n.content)}</div>
  `

  grid.appendChild(card)

 })

}

/* ── Post News ───────────────── */

async function postNews(title,content,category="info",pinned=false){

 if(!session?.isAdmin) return

 await db.ref("news").push({
  title,
  content,
  category,
  author:session.username,
  pinned,
  ts:Date.now()
 })

}

/* ── Notification ───────────────── */

function notify(n){

 if(Notification.permission!=="granted")return

 new Notification("HGHome",{
  body:n.title,
  icon:"/favicon.ico"
 })

}

/* ── Init ───────────────── */

document.addEventListener("DOMContentLoaded",()=>{

 startNews()

 if(Notification.permission==="default"){
  Notification.requestPermission()
 }

})
