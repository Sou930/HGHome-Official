/* ═══════════════════════════════════════
   HGHome Official Script  —  Fixed
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

const decode = b => b.map(v => String.fromCharCode(v)).join("")

const firebaseConfig = {
  apiKey:           decode(_cfg.apiKey),
  authDomain:       decode(_cfg.authDomain),
  databaseURL:      decode(_cfg.databaseURL),
  projectId:        decode(_cfg.projectId),
  storageBucket:    decode(_cfg.storageBucket),
  messagingSenderId:"720150712775",
  appId:            decode(_cfg.appId)
}

/* ── Firebase Init ───────────────── */

firebase.initializeApp(firebaseConfig)

const auth = firebase.auth()
const db   = firebase.database()

/* ── State ───────────────── */

let session      = null
let newsListener = null
let authMode     = 'login'   // 'login' | 'register'
let selectedCat  = 'info'
const seenNews   = new Set()
const pageLoadTime = Date.now()

/* ── Helpers ───────────────── */

const $ = id => document.getElementById(id)

function esc(s) {
  return (s || "")
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
}

function formatDate(ts) {
  if (!ts) return ""
  const d = new Date(ts)
  return d.toLocaleDateString("ja-JP", { year:"numeric", month:"2-digit", day:"2-digit" })
       + " " + d.toLocaleTimeString("ja-JP", { hour:"2-digit", minute:"2-digit" })
}

/* ── Toast ───────────────── */

let toastTimer = null

function showToast(msg, type = "") {
  const t = $("toast")
  if (!t) return
  t.textContent = msg
  t.className   = "toast" + (type ? " " + type : "")
  // Force reflow so transition re-triggers when called rapidly
  void t.offsetWidth
  t.classList.add("show")
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => t.classList.remove("show"), 3200)
}

/* ── Theme ───────────────── */

const THEMES   = ["dark", "light", "glass"]
const THEME_ICONS = { dark:"🌙", light:"☀️", glass:"💎" }

function toggleTheme() {
  const html = document.documentElement
  const cur  = html.getAttribute("data-theme") || "dark"
  const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length]
  html.setAttribute("data-theme", next)
  const btn = $("themeBtn")
  if (btn) btn.textContent = THEME_ICONS[next] || "🌙"
  try { localStorage.setItem("hghome-theme", next) } catch(_) {}
}

function loadTheme() {
  try {
    const saved = localStorage.getItem("hghome-theme")
    if (saved && THEMES.includes(saved)) {
      document.documentElement.setAttribute("data-theme", saved)
      const btn = $("themeBtn")
      if (btn) btn.textContent = THEME_ICONS[saved] || "🌙"
    }
  } catch(_) {}
}

/* ── Auth Modal ───────────────── */

function openAuthModal(mode = "login") {
  authMode = mode
  $("authModal").classList.add("active")
  $("authError").classList.remove("visible")
  $("authError").textContent = ""
  $("authUsername").value = ""
  $("authPassword").value = ""
  updateAuthMode()
  setTimeout(() => $("authUsername").focus(), 80)
}

function closeAuthModal() {
  $("authModal").classList.remove("active")
}

function switchAuthMode() {
  authMode = authMode === "login" ? "register" : "login"
  updateAuthMode()
}

function updateAuthMode() {
  const isLogin = authMode === "login"
  $("authTitle").textContent        = isLogin ? "ログイン" : "新規登録"
  $("authSubmitBtn").textContent    = isLogin ? "[ ログイン ]" : "[ 登録する ]"
  $("authSwitchText").innerHTML     = isLogin
    ? 'アカウントをお持ちでない方は <a onclick="switchAuthMode()">新規登録</a>'
    : 'すでにアカウントをお持ちの方は <a onclick="switchAuthMode()">ログイン</a>'
}

/* ── News Modal ───────────────── */

function openNewsModal() {
  if (!session?.isAdmin) return
  $("newsModal").classList.add("active")
  $("newsError").classList.remove("visible")
  $("newsError").textContent = ""
  $("newsTitle").value   = ""
  $("newsContent").value = ""
  $("newsPinned").checked = false
  selectCategory("info", document.querySelector('.cat-btn[data-cat="info"]'))
  setTimeout(() => $("newsTitle").focus(), 80)
}

function closeNewsModal() {
  $("newsModal").classList.remove("active")
}

function selectCategory(cat, btn) {
  selectedCat = cat
  document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"))
  if (btn) btn.classList.add("active")
}

/* ── Notification Banner ───────────────── */

let bannerTimer = null

function showNotifBanner(n) {
  const banner = $("notifBanner")
  if (!banner) return
  $("notifBannerTag").textContent   = (n.category || "info").toUpperCase()
  $("notifBannerTitle").textContent = n.title || ""
  banner.className = "notif-banner show"
  clearTimeout(bannerTimer)
  bannerTimer = setTimeout(closeNotifBanner, 6000)
}

function closeNotifBanner() {
  const banner = $("notifBanner")
  if (banner) banner.classList.remove("show")
}

/* ── Login / Register ───────────────── */

async function login(username, password) {
  const email = `${username}@hghome.app`
  return auth.signInWithEmailAndPassword(email, password)
}

async function register(username, password) {
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    throw new Error("ユーザー名は3〜20文字の半角英数字・アンダーバーのみです")
  }
  const email = `${username}@hghome.app`
  const cred  = await auth.createUserWithEmailAndPassword(email, password)
  await db.ref("users/" + username).set({
    uid:       cred.user.uid,
    username,
    createdAt: Date.now(),
    isAdmin:   false
  })
}

/* ── Logout ───────────────── */

async function handleLogout() {
  await auth.signOut()
  session = null
  updateUI()
  showToast("ログアウトしました")
}

/* ── Auth State ───────────────── */

auth.onAuthStateChanged(async user => {
  if (!user) {
    session = null
    updateUI()
    return
  }

  const username = user.email.replace("@hghome.app", "")
  let isAdmin    = false

  try {
    const snap = await db.ref("users/" + username).once("value")
    if (snap.val()) isAdmin = !!snap.val().isAdmin
  } catch(_) {}

  session = { uid: user.uid, username, isAdmin }
  updateUI()
})

/* ── UI Update ───────────────── */

function updateUI() {
  if (!session) {
    $("navLoginBtn").style.display = ""
    $("navUser").style.display     = "none"
    document.querySelectorAll(".post-btn")
      .forEach(b => b.classList.remove("visible"))
    return
  }

  $("navLoginBtn").style.display = "none"
  $("navUser").style.display     = "flex"

  const name = $("navUsername")
  name.textContent = session.username + (session.isAdmin ? " [ADMIN]" : "")
  name.className   = "nav-username" + (session.isAdmin ? " admin" : "")

  document.querySelectorAll(".post-btn")
    .forEach(b => b.classList.toggle("visible", session.isAdmin))
}

/* ── News Listener ───────────────── */

function startNews() {
  if (newsListener) db.ref("news").off("value", newsListener)

  const ref = db.ref("news").orderByChild("ts").limitToLast(20)

  newsListener = ref.on("value", snap => {
    const raw   = snap.val() || {}
    const items = Object.entries(raw)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => {
        // Pinned first, then newest
        if (b.pinned !== a.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
        return b.ts - a.ts
      })

    items.forEach(n => {
      if (!seenNews.has(n.id) && n.ts > pageLoadTime) {
        showNotifBanner(n)
        notify(n)
      }
      seenNews.add(n.id)
    })

    renderNews(items)
  })
}

/* ── Render News ───────────────── */

function renderNews(list) {
  const grid = $("newsGrid")
  if (!grid) return

  if (!list.length) {
    grid.innerHTML = '<div class="news-empty">まだニュースはありません</div>'
    return
  }

  grid.innerHTML = ""

  list.forEach(n => {
    const cat    = n.category || "info"
    const card   = document.createElement("div")
    card.className = "news-card category-" + esc(cat) + (n.pinned ? " pinned" : "")

    const catLabel = { info:"INFO", update:"UPDATE", event:"EVENT" }[cat] || cat.toUpperCase()

    card.innerHTML = `
      <div class="news-card-top">
        <span class="news-category cat-${esc(cat)}">${catLabel}</span>
        ${n.pinned ? '<span class="news-pin">📌 固定</span>' : ""}
        <span class="news-meta">${formatDate(n.ts)}</span>
      </div>
      <div class="news-title">${esc(n.title)}</div>
      <div class="news-content">${esc(n.content)}</div>
      ${session?.isAdmin ? `
        <div class="news-card-actions">
          <button class="news-del-btn" onclick="deleteNews('${esc(n.id)}')">削除</button>
        </div>` : ""}
    `

    grid.appendChild(card)
  })
}

/* ── Post News ───────────────── */

async function postNews(title, content, category = "info", pinned = false) {
  if (!session?.isAdmin) return

  await db.ref("news").push({
    title,
    content,
    category,
    author: session.username,
    pinned,
    ts: Date.now()
  })
}

/* ── Delete News ───────────────── */

async function deleteNews(id) {
  if (!session?.isAdmin) return
  if (!confirm("このニュースを削除しますか？")) return
  try {
    await db.ref("news/" + id).remove()
    showToast("削除しました", "success")
  } catch(e) {
    showToast("削除に失敗しました: " + e.message, "error")
  }
}

/* ── Notification ───────────────── */

function notify(n) {
  if (Notification.permission !== "granted") return
  new Notification("HGHome", {
    body: n.title,
    icon: "/favicon.ico"
  })
}

/* ── Form Handlers ───────────────── */

function setupForms() {

  // Auth form
  const authForm = $("authForm")
  if (authForm) {
    authForm.addEventListener("submit", async e => {
      e.preventDefault()
      const errEl = $("authError")
      const btn   = $("authSubmitBtn")
      errEl.classList.remove("visible")
      errEl.textContent = ""
      btn.disabled      = true

      const username = $("authUsername").value.trim()
      const password = $("authPassword").value

      try {
        if (authMode === "login") {
          await login(username, password)
          showToast("ログインしました", "success")
        } else {
          await register(username, password)
          showToast("登録しました！", "success")
        }
        closeAuthModal()
      } catch(err) {
        const msg = translateFirebaseError(err.code) || err.message
        errEl.textContent = msg
        errEl.classList.add("visible")
      } finally {
        btn.disabled = false
      }
    })
  }

  // News form
  const newsForm = $("newsForm")
  if (newsForm) {
    newsForm.addEventListener("submit", async e => {
      e.preventDefault()
      const errEl = $("newsError")
      const btn   = $("newsSubmitBtn")
      errEl.classList.remove("visible")
      errEl.textContent = ""
      btn.disabled      = true

      const title   = $("newsTitle").value.trim()
      const content = $("newsContent").value.trim()
      const pinned  = $("newsPinned").checked

      try {
        await postNews(title, content, selectedCat, pinned)
        showToast("投稿しました！", "success")
        closeNewsModal()
      } catch(err) {
        errEl.textContent = err.message
        errEl.classList.add("visible")
      } finally {
        btn.disabled = false
      }
    })
  }
}

/* ── Firebase Error Translation ───────────────── */

function translateFirebaseError(code) {
  const map = {
    "auth/user-not-found":      "ユーザーが見つかりません",
    "auth/wrong-password":      "パスワードが正しくありません",
    "auth/email-already-in-use":"このユーザー名はすでに使われています",
    "auth/invalid-email":       "メールアドレス形式が正しくありません",
    "auth/weak-password":       "パスワードは6文字以上にしてください",
    "auth/too-many-requests":   "しばらく経ってからもう一度お試しください",
    "auth/invalid-credential":  "ユーザー名またはパスワードが正しくありません",
  }
  return map[code] || null
}

/* ── Service Worker Registration ───────────────── */

function registerSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js")
      .then(reg => console.log("[SW] registered:", reg.scope))
      .catch(err => console.warn("[SW] registration failed:", err))
  }
}

/* ── Modal click-outside to close ───────────────── */

function setupModalDismiss() {
  [$("authModal"), $("newsModal")].forEach(overlay => {
    if (!overlay) return
    overlay.addEventListener("click", e => {
      if (e.target === overlay) {
        overlay.classList.remove("active")
      }
    })
  })
}

/* ── Keyboard shortcuts ───────────────── */

function setupKeyboard() {
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      $("authModal")?.classList.remove("active")
      $("newsModal")?.classList.remove("active")
    }
  })
}

/* ── Expose to global scope (required for onclick="..." in HTML) ── */

window.openAuthModal    = openAuthModal
window.closeAuthModal   = closeAuthModal
window.switchAuthMode   = switchAuthMode
window.openNewsModal    = openNewsModal
window.closeNewsModal   = closeNewsModal
window.selectCategory   = selectCategory
window.handleLogout     = handleLogout
window.toggleTheme      = toggleTheme
window.closeNotifBanner = closeNotifBanner
window.deleteNews       = deleteNews

/* ── Init ───────────────── */

// loadTheme runs immediately (before DOMContentLoaded) so the theme
// is applied before first paint and themeBtn icon is set as soon as
// the element exists.
document.addEventListener("DOMContentLoaded", () => {
  loadTheme()
  setupForms()
  setupModalDismiss()
  setupKeyboard()
  startNews()
  registerSW()

  if (Notification.permission === "default") {
    Notification.requestPermission()
  }
})
