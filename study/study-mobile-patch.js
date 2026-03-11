/* ═══════════════════════════════════════════════════════
   HGStudy  —  study-mobile-patch.js  v4.3
═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════
     1. URLシェア機能
  ══════════════════════════════════════════════════════ */

  window.shareDeckUrl = function (deckId) {
    const dk = allPublicDecks[deckId];
    if (!dk) return;

    const url = new URL(location.href);
    url.searchParams.set('deck', deckId);
    const shareUrl = url.toString();

    // iOS/Android: ネイティブシェアシート
    if (navigator.share) {
      navigator.share({
        title: 'HGStudy — ' + (dk.name || 'デッキ'),
        text: dk.desc ? dk.desc.slice(0, 80) : 'フラッシュカードで一緒に学習しよう！',
        url: shareUrl,
      }).catch(() => {});
      return;
    }

    // PC: クリップボードにコピー
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => showToast('🔗 URLをコピーしました！', 'share'))
        .catch(() => _copyFallback(shareUrl));
    } else {
      _copyFallback(shareUrl);
    }
  };

  function _copyFallback(text) {
    const input = document.createElement('input');
    input.value = text;
    Object.assign(input.style, { position: 'fixed', top: '-999px', opacity: '0' });
    document.body.appendChild(input);
    input.focus(); input.select();
    try {
      document.execCommand('copy');
      showToast('🔗 URLをコピーしました！', 'share');
    } catch {
      showToast('コピーに失敗しました', 'error');
    }
    document.body.removeChild(input);
  }

  /* ══════════════════════════════════════════════════════
     2. deckCardHTML — シェアボタン付きに差し替え
  ══════════════════════════════════════════════════════ */

  window.deckCardHTML = function (id, dk) {
    const isMine  = currentSession && dk.owner === currentSession.username;
    const isFav   = !!allFavs[id];
    const cnt     = dk.cardCount  || 0;
    const favCnt  = dk.favCount   || 0;
    const viewCnt = dk.viewCount  || 0;
    const tagHtml = dk.cat
      ? `<span class="dc-tag" style="${catBg(dk.cat)}">${esc(dk.cat)}</span>`
      : '<span></span>';

    return `<div class="deck-card-new" id="dcard_${id}">
      <div class="dc-card-top">${tagHtml}
        ${isMine ? `<div class="dc-owner-btns">
          <button class="dc-action-mini" onclick="openDeckEditPage('${id}')">✏️ 編集</button>
          <button class="dc-action-mini danger" onclick="deleteDeckDirect('${id}')">🗑️</button>
        </div>` : ''}
      </div>
      <div class="dc-title-new">${esc(dk.name || '無題')}</div>
      ${dk.desc ? `<div class="dc-desc-new">${esc(dk.desc)}</div>` : ''}
      <div class="dc-meta-new">
        <span class="dc-author-new" onclick="openUserProfile('${esc(dk.owner || '')}')">@${esc(dk.owner || '')}</span>
        <span>📇 ${cnt}枚</span><span>⭐ ${favCnt}</span><span>👁 ${viewCnt}</span>
        <span>${fmtDate(dk.createdAt)}</span>
      </div>
      <div class="dc-actions-new">
        <button class="study-start-btn-new" onclick="showStudyModeModal('${id}')">▶ 学習する</button>
        <button class="fav-btn-new${isFav ? ' on' : ''}" id="favbtn_${id}" onclick="toggleFav('${id}')">
          ${isFav ? '★' : '☆'} ${favCnt}
        </button>
        <button class="share-btn-new" onclick="event.stopPropagation();shareDeckUrl('${id}')" title="URLをシェア">🔗</button>
      </div>
    </div>`;
  };

  /* ══════════════════════════════════════════════════════
     3. Toast — share タイプ対応
  ══════════════════════════════════════════════════════ */

  const _origShowToast = window.showToast;
  window.showToast = function (msg, type) {
    _origShowToast(msg, type);
    if (type === 'share') {
      const t = document.getElementById('toast');
      if (t) t.classList.add('share');
    }
  };

  /* ══════════════════════════════════════════════════════
     4. URLパラメータからデッキを自動オープン
  ══════════════════════════════════════════════════════ */

  (function parseSharedDeckUrl() {
    const params = new URLSearchParams(location.search);
    const deckId = params.get('deck');
    if (!deckId) return;
    // URLをクリーンにする（ブラウザ履歴を汚さない）
    const newParams = new URLSearchParams(params);
    newParams.delete('deck');
    const cleanUrl = location.pathname + (newParams.toString() ? '?' + newParams.toString() : '');
    history.replaceState({}, '', cleanUrl);
    window._pendingSharedDeck = deckId;
  })();

  /* ══════════════════════════════════════════════════════
     5. ゲストアクセス — ログインなしでデッキ&ブログを閲覧可能
  ══════════════════════════════════════════════════════ */

  // DOMContentLoaded の後に元の初期化を上書き
  // study.js の初期化が走り終えた後に実行する
  const _hookInit = setInterval(function () {
    // study.js が初期化済みかチェック (ge関数の存在で判断)
    if (typeof ge !== 'function' || !ge('welcomeScreen')) return;
    clearInterval(_hookInit);

    // セッションがない場合: ウェルカム画面を非表示にしてデッキを表示
    const sess = typeof loadSession === 'function' ? loadSession() : null;
    if (!sess || !sess.uid) {
      _showGuestDeckBrowser();
    }

    // URLシェアのデッキ自動オープンをフック
    _hookRenderDeckGrid();
  }, 50);

  function _showGuestDeckBrowser() {
    const welcomeEl = ge('welcomeScreen');
    const browserEl = ge('deckBrowser');
    if (!welcomeEl || !browserEl) return;

    welcomeEl.style.display = 'none';
    browserEl.style.display = '';

    // ゲストバナーを挿入 (デッキブラウザの最上部)
    _injectGuestBanner(browserEl);
  }

  function _injectGuestBanner(browserEl) {
    if (document.getElementById('guestBanner')) return;
    const banner = document.createElement('div');
    banner.id = 'guestBanner';
    banner.className = 'guest-banner';
    banner.innerHTML = `
      <span>👋 ゲストとして閲覧中です。ログインするとデッキの作成・お気に入り・学習記録が使えます。</span>
      <div class="guest-banner-btns">
        <button class="guest-banner-btn primary" onclick="openAuthModal('login')">ログイン</button>
        <button class="guest-banner-btn outline" onclick="openAuthModal('register')">新規登録</button>
      </div>
    `;
    browserEl.prepend(banner);
  }

  // ログイン後にバナーを消す
  const _origOnLogin = window.onLogin;
  if (typeof _origOnLogin === 'function') {
    // onLogin はグローバル関数ではなくクロージャなので
    // updateNavUI をフックして代用
  }
  const _origUpdateNavUI = window.updateNavUI;
  window.updateNavUI = function () {
    if (typeof _origUpdateNavUI === 'function') _origUpdateNavUI();
    const banner = document.getElementById('guestBanner');
    if (banner && currentSession) banner.remove();
  };

  /* ══════════════════════════════════════════════════════
     6. showStudyModeModal — ゲストでも閲覧(学習)可能
     お気に入り・編集はログイン必須のまま
  ══════════════════════════════════════════════════════ */
  // study.js の showStudyModeModal はセッション不問で動くので変更不要

  /* ══════════════════════════════════════════════════════
     7. URLシェアのデッキ自動オープン (renderDeckGrid フック)
  ══════════════════════════════════════════════════════ */

  let _sharedDeckHandled = false;

  function _hookRenderDeckGrid() {
    const _origRenderDeckGrid = window.renderDeckGrid;
    if (!_origRenderDeckGrid) return;

    window.renderDeckGrid = function () {
      _origRenderDeckGrid();

      if (!_sharedDeckHandled && window._pendingSharedDeck) {
        _sharedDeckHandled = true;
        const sharedId = window._pendingSharedDeck;
        window._pendingSharedDeck = null;

        setTimeout(() => {
          if (allPublicDecks && allPublicDecks[sharedId]) {
            const card = document.getElementById('dcard_' + sharedId);
            if (card) {
              card.scrollIntoView({ behavior: 'smooth', block: 'center' });
              card.style.transition = 'box-shadow .3s, border-color .3s';
              card.style.boxShadow = '0 0 0 3px var(--primary)';
              card.style.borderColor = 'var(--primary)';
              setTimeout(() => {
                card.style.boxShadow = '';
                card.style.borderColor = '';
              }, 2000);
            }
            showStudyModeModal(sharedId);
          } else {
            showToast('デッキが見つかりませんでした', 'error');
          }
        }, 300);
      }
    };
  }

  /* ══════════════════════════════════════════════════════
     8. モバイルボトムナビ
  ══════════════════════════════════════════════════════ */

  function _injectMobileBottomNav() {
    if (document.getElementById('mobileBottomNav')) return;

    const nav = document.createElement('nav');
    nav.id = 'mobileBottomNav';
    nav.className = 'mobile-bottom-nav';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'メインナビゲーション');
    nav.innerHTML = `
      <button class="mbn-item on" id="mbnStudy"   onclick="mbnSwitch('study')"   aria-label="学習">
        <span class="mbn-icon" aria-hidden="true">📚</span><span>学習</span>
      </button>
      <button class="mbn-item"   id="mbnBlog"    onclick="mbnSwitch('blog')"    aria-label="解説ブログ">
        <span class="mbn-icon" aria-hidden="true">✏️</span><span>ブログ</span>
      </button>
      <button class="mbn-item"   id="mbnHistory" onclick="mbnSwitch('history')" aria-label="学習履歴">
        <span class="mbn-icon" aria-hidden="true">📊</span><span>履歴</span>
      </button>
      <button class="mbn-item"   id="mbnRanking" onclick="mbnSwitch('ranking')" aria-label="ランキング">
        <span class="mbn-icon" aria-hidden="true">🏆</span><span>ランキング</span>
      </button>
    `;
    document.body.appendChild(nav);
  }

  function _updateMbnActive(tab) {
    ['study', 'blog', 'history', 'ranking'].forEach(t => {
      const btn = document.getElementById('mbn' + t.charAt(0).toUpperCase() + t.slice(1));
      if (btn) btn.classList.toggle('on', t === tab);
    });
  }

  window.mbnSwitch = function (tab) {
    _updateMbnActive(tab);
    switchTab(tab);
  };

  // switchTab をラップしてモバイルナビも同期
  const _origSwitchTab = window.switchTab;
  window.switchTab = function (tab) {
    _origSwitchTab(tab);
    _updateMbnActive(tab);
    // ゲスト状態で履歴タブを押したときのメッセージ
    if (tab === 'history' && !currentSession) {
      const body = ge('historyPageBody');
      if (body) {
        body.innerHTML = `<div class="hp-page-login">
          <div class="hp-page-login-icon">📊</div>
          <p>ログインして学習履歴を確認しよう</p>
          <button class="hp-login-btn" onclick="openAuthModal('login')">ログインする</button>
        </div>`;
      }
    }
  };

  /* ══════════════════════════════════════════════════════
     9. 初期化
  ══════════════════════════════════════════════════════ */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _injectMobileBottomNav);
  } else {
    _injectMobileBottomNav();
  }

})();
