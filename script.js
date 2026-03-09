/* ═══════════════════════════════════════
   HGHome Official Script  —  REST Auth
   Firebase Auth SDK不使用・REST API方式
═══════════════════════════════════════ */

/* ── Firebase Config (REST) ─────────── */

const DB_URL = "https://hgstudy-18e23-default-rtdb.asia-southeast1.firebasedatabase.app"

/* ── DB REST Helpers ─────────────────── */

async function dbGet(path) {
  const res = await fetch(`${DB_URL}/${path}.json`)
  if (!res.ok) throw new Error("DB読み込みエラー")
  return res.json()
}

async function dbSet(path, data) {
  const res = await fetch(`${DB_URL}/${path}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error("DB書き込みエラー")
  return res.json()
}

async function dbPush(path, data) {
  const res = await fetch(`${DB_URL}/${path}.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error("DB書き込みエラー")
  return res.json()
}

async function dbDelete(path) {
  const res = await fetch(`${DB_URL}/${path}.json`, { method: "DELETE" })
  if (!res.ok) throw new Error("DB削除エラー")
}

/* ── SHA-256 Hash ────────────────────── */

async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("")
}

/* ── State ───────────────────────────── */

let session      = null
let authMode     = "login"
let selectedCat  = "info"
let newsPolling  = null
const seenNews   = new Set()
const pageLoadTime = Date.now()

/* ── Session persistence ─────────────── */

function saveSession(s) {
  try { sessionStorage.setItem("hghome-session", JSON.stringify(s)) } catch(_) {}
}

function restoreSession() {
  try {
    const raw = sessionStorage.getItem("hghome-session")
    if (raw) return JSON.parse(raw)
  } catch(_) {}
  return null
}

function clearSession() {
  try { sessionStorage.removeItem("hghome-session") } catch(_) {}
}

/* ── Helpers ─────────────────────────── */

const $ = id => document.getElementById(id)

function esc(s) {
  return (s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function formatDate(ts) {
  if (!ts) return ""
  const d = new Date(ts)
  return d.toLocaleDateString("ja-JP", { year:"numeric", month:"2-digit", day:"2-digit" })
       + " " + d.toLocaleTimeString("ja-JP", { hour:"2-digit", minute:"2-digit" })
}

/* ── Toast ───────────────────────────── */

let toastTimer = null

function showToast(msg, type = "") {
  const t = $("toast")
  if (!t) return
  t.textContent = msg
  t.className   = "toast" + (type ? " " + type : "")
  void t.offsetWidth
  t.classList.add("show")
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => t.classList.remove("show"), 3200)
}

/* ── Theme ───────────────────────────── */

const THEMES      = ["dark", "light", "glass"]
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

/* ── Auth Modal ──────────────────────── */

function openAuthModal(mode = "login") {
  authMode = mode || "login"
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
  $("authTitle").textContent     = isLogin ? "ログイン" : "新規登録"
  $("authSubmitBtn").textContent = isLogin ? "[ ログイン ]" : "[ 登録する ]"
  $("authSwitchText").innerHTML  = isLogin
    ? 'アカウントをお持ちでない方は <a onclick="switchAuthMode()">新規登録</a>'
    : 'すでにアカウントをお持ちの方は <a onclick="switchAuthMode()">ログイン</a>'
}

/* ── News Modal ──────────────────────── */

function openNewsModal() {
  if (!session?.isAdmin) return
  $("newsModal").classList.add("active")
  $("newsError").classList.remove("visible")
  $("newsError").textContent = ""
  $("newsTitle").value    = ""
  $("newsContent").value  = ""
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

/* ── Notification Banner ─────────────── */

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

/* ── Login ───────────────────────────── */

async function login(username, password) {
  if (!username || !password) throw new Error("ユーザー名とパスワードを入力してください")

  const userData = await dbGet(`users/${username}`)
  if (!userData) throw new Error("ユーザーが見つかりません")

  const hash = await sha256(password)
  if (userData.passwordHash !== hash) throw new Error("パスワードが正しくありません")

  return { username, isAdmin: !!userData.isAdmin }
}

/* ── Register ────────────────────────── */

async function register(username, password) {
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    throw new Error("ユーザー名は3〜20文字の半角英数字・アンダーバーのみです")
  }
  if (password.length < 6) {
    throw new Error("パスワードは6文字以上にしてください")
  }

  const existing = await dbGet(`users/${username}`)
  if (existing) throw new Error("このユーザー名はすでに使われています")

  const hash = await sha256(password)
  await dbSet(`users/${username}`, {
    username,
    passwordHash: hash,
    createdAt:    Date.now(),
    isAdmin:      false
  })
}

/* ── Logout ──────────────────────────── */

function handleLogout() {
  session = null
  clearSession()
  updateUI()
  showToast("ログアウトしました")
}

/* ── UI Update ───────────────────────── */

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

/* ── News Polling ────────────────────── */

async function fetchNews() {
  try {
    const raw = await dbGet("news")
    if (!raw) return renderNews([])

    const items = Object.entries(raw)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => {
        if (b.pinned !== a.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
        return b.ts - a.ts
      })
      .slice(0, 20)

    items.forEach(n => {
      if (!seenNews.has(n.id) && n.ts > pageLoadTime) {
        showNotifBanner(n)
        notify(n)
      }
      seenNews.add(n.id)
    })

    renderNews(items)
  } catch(e) {
    console.warn("[News] fetch error:", e)
  }
}

function startNews() {
  fetchNews()
  newsPolling = setInterval(fetchNews, 30000)
}

/* ── Render News ─────────────────────── */

function renderNews(list) {
  const grid = $("newsGrid")
  if (!grid) return

  if (!list.length) {
    grid.innerHTML = '<div class="news-empty">まだニュースはありません</div>'
    return
  }

  grid.innerHTML = ""

  list.forEach(n => {
    const cat  = n.category || "info"
    const card = document.createElement("div")
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

/* ── Post News ───────────────────────── */

async function postNews(title, content, category = "info", pinned = false) {
  if (!session?.isAdmin) return
  await dbPush("news", {
    title, content, category,
    author: session.username,
    pinned,
    ts: Date.now()
  })
  await fetchNews()
}

/* ── Delete News ─────────────────────── */

async function deleteNews(id) {
  if (!session?.isAdmin) return
  if (!confirm("このニュースを削除しますか？")) return
  try {
    await dbDelete(`news/${id}`)
    showToast("削除しました", "success")
    await fetchNews()
  } catch(e) {
    showToast("削除に失敗しました: " + e.message, "error")
  }
}

/* ── Notification ────────────────────── */

function notify(n) {
  if (Notification.permission !== "granted") return
  new Notification("HGHome", { body: n.title, icon: "/favicon.ico" })
}

/* ── Form Handlers ───────────────────── */

function setupForms() {

  const authForm = $("authForm")
  if (authForm) {
    authForm.addEventListener("submit", async e => {
      e.preventDefault()
      const errEl = $("authError")
      const btn   = $("authSubmitBtn")
      errEl.classList.remove("visible")
      errEl.textContent = ""
      btn.disabled    = true
      btn.textContent = "[ 処理中... ]"

      const username = $("authUsername").value.trim()
      const password = $("authPassword").value

      try {
        if (authMode === "login") {
          const user = await login(username, password)
          session = user
          saveSession(session)
          updateUI()
          showToast("ログインしました", "success")
        } else {
          await register(username, password)
          session = { username, isAdmin: false }
          saveSession(session)
          updateUI()
          showToast("登録しました！", "success")
        }
        closeAuthModal()
      } catch(err) {
        errEl.textContent = err.message
        errEl.classList.add("visible")
      } finally {
        btn.disabled = false
        updateAuthMode()
      }
    })
  }

  const newsForm = $("newsForm")
  if (newsForm) {
    newsForm.addEventListener("submit", async e => {
      e.preventDefault()
      const errEl = $("newsError")
      const btn   = $("newsSubmitBtn")
      errEl.classList.remove("visible")
      errEl.textContent = ""
      btn.disabled = true

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

/* ── Modal dismiss & keyboard ────────── */

function setupModalDismiss() {
  [$("authModal"), $("newsModal")].forEach(overlay => {
    if (!overlay) return
    overlay.addEventListener("click", e => {
      if (e.target === overlay) overlay.classList.remove("active")
    })
  })
}

function setupKeyboard() {
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      $("authModal")?.classList.remove("active")
      $("newsModal")?.classList.remove("active")
    }
  })
}

/* ── Service Worker ──────────────────── */

function registerSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js")
      .then(reg => console.log("[SW] registered:", reg.scope))
      .catch(err => console.warn("[SW] failed:", err))
  }
}

/* ── Expose to global (for onclick="") ── */

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

/* ── Init ────────────────────────────── */

document.addEventListener("DOMContentLoaded", () => {
  loadTheme()

  const saved = restoreSession()
  if (saved) {
    session = saved
    updateUI()
  }

  setupForms()
  setupModalDismiss()
  setupKeyboard()
  startNews()
  registerSW()

  if (Notification.permission === "default") {
    Notification.requestPermission()
  }
})
