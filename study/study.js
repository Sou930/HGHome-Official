<!DOCTYPE html>
<html lang="ja" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HGStudy</title>
  <meta name="description" content="HGStudy — フラッシュカードで学習">
  <meta name="theme-color" content="#ffe600">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="HGStudy">

  <!-- Firebase v8 compat -->
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js"></script>

  <link rel="stylesheet" href="study.css">
</head>
<body>
  <!-- Background mesh -->
  <div class="bg-mesh">
    <div class="bg-static"></div>
  </div>

  <!-- ── Navigation ── -->
  <nav>
    <a href="../hghome-official/index.html" class="nav-logo">
      <span class="accent">←</span> HGHome
    </a>
    <div class="nav-center">
      <span class="nav-title">HGStudy</span>
    </div>
    <div class="nav-actions">
      <div id="navUser" style="display:none;align-items:center;gap:10px;">
        <span id="navUsername" style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--text2);"></span>
        <button class="nav-btn" onclick="handleLogout()">ログアウト</button>
      </div>
      <button class="nav-btn primary" id="navLoginBtn" onclick="openAuthModal('login')">ログイン</button>
      <button class="theme-toggle" id="themeToggle" onclick="toggleTheme()" title="テーマ切替">🌙</button>
    </div>
  </nav>

  <!-- ── Auth Modal ── -->
  <div class="modal-overlay" id="authModal">
    <div class="modal">
      <button class="modal-close" onclick="closeAuthModal()">✕</button>
      <h2 class="modal-title" id="authTitle">ログイン</h2>
      <p class="modal-sub">HGHome アカウントでログイン</p>
      <form id="authForm">
        <div class="form-group">
          <label class="form-label" for="authUsername">ユーザー名</label>
          <input class="form-input" id="authUsername" type="text" autocomplete="username"
                 placeholder="username" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="authPassword">パスワード</label>
          <input class="form-input" id="authPassword" type="password" autocomplete="current-password"
                 placeholder="••••••••" required>
        </div>
        <div class="form-error" id="authError"></div>
        <button class="btn btn-primary" id="authSubmitBtn" type="submit">[ ログイン ]</button>
        <p class="auth-switch" id="authSwitchText">
          アカウントをお持ちでない方は<a onclick="switchAuthMode()">こちら</a>
        </p>
      </form>
    </div>
  </div>

  <!-- ── Main App ── -->
  <div class="app-container">

    <!-- Welcome Screen (logged out) -->
    <div id="welcomeScreen" class="welcome-screen">
      <div class="welcome-badge">
        <span class="badge-dot"></span>
        スマート学習ツール
      </div>
      <h1 class="welcome-title">
        HG<span class="grad-text">STUDY</span>
      </h1>
      <p class="welcome-sub">
        フラッシュカードで効率よく学習。<br>
        間隔反復アルゴリズムで記憶を強化。
      </p>
      <div class="welcome-actions">
        <button class="action-btn primary" onclick="openAuthModal('login')">ログインして始める</button>
        <button class="action-btn outline" onclick="openAuthModal('register')">新規登録</button>
      </div>
    </div>

    <!-- Study Area (logged in) -->
    <div id="studyArea" class="study-area">

      <!-- Toolbar -->
      <div class="study-toolbar">
        <span class="toolbar-label">デッキ:</span>
        <select class="deck-select" id="deckSelect" onchange="onDeckChange(this.value)"></select>
        <button class="tool-btn" onclick="promptNewDeck()">+ 新規</button>
        <button class="tool-btn danger" onclick="confirmDeleteDeck()">削除</button>
        <span class="toolbar-spacer"></span>
        <div class="toolbar-stats" id="toolbarStats"></div>
        <button class="tool-btn" id="editToggleBtn" onclick="toggleEditMode()">カード編集</button>
      </div>

      <!-- Flashcard View -->
      <div id="cardArea" class="card-area">
        <div>
          <div class="flashcard" id="flashcard" onclick="flipCard()">
            <div class="card-side-label">表面</div>
            <div class="card-content" id="cardFront">カードを読み込み中...</div>
            <div id="cardBackArea" style="display:none;">
              <div class="card-side-label" style="margin-top:28px;">裏面</div>
              <div class="card-content" id="cardBack"></div>
            </div>
            <span class="card-flip-hint">クリックでめくる</span>
          </div>
          <div class="progress-bar-wrap">
            <div class="progress-bar" id="progressBar" style="width:0%"></div>
          </div>
          <p class="card-progress" id="cardProgress">0 / 0</p>
          <div class="card-controls">
            <button class="ctrl-btn again" onclick="rateCard(1)" disabled>もう一度</button>
            <button class="ctrl-btn good"  onclick="rateCard(2)" disabled>Good</button>
            <button class="ctrl-btn easy"  onclick="rateCard(3)" disabled>Easy</button>
          </div>
        </div>
      </div>

      <!-- Cards List (Edit Mode) -->
      <div id="cardsListView" class="cards-list-view">
        <form class="add-card-form" onsubmit="handleAddCard(event)">
          <p style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.15em;color:var(--yellow);text-transform:uppercase;">新しいカードを追加</p>
          <div class="form-row">
            <div>
              <label>表面（問題）</label>
              <textarea id="addFront" placeholder="例: こんにちは" required></textarea>
            </div>
            <div>
              <label>裏面（答え）</label>
              <textarea id="addBack" placeholder="例: Hello" required></textarea>
            </div>
          </div>
          <button class="btn btn-primary" type="submit" style="max-width:200px;">+ カードを追加</button>
        </form>
        <div id="cardsList"></div>
      </div>

      <!-- Session Complete -->
      <div id="sessionComplete" class="session-complete">
        <div class="complete-icon">🎉</div>
        <h2 class="complete-title">SESSION COMPLETE</h2>
        <p class="complete-stats"></p>
        <button class="action-btn primary" onclick="restartSession()">もう一度学習する</button>
      </div>

    </div><!-- /studyArea -->
  </div><!-- /app-container -->

  <!-- Toast -->
  <div id="toast" class="toast"></div>

  <script src="study.js"></script>
</body>
</html>
