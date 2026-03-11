/* ═══════════════════════════════════════════════════════
   HGStudy  —  study-mobile-patch.js  v4.2
   study.js の読み込み後、このファイルを読み込むだけで適用されます
   <script src="study.js"></script>
   <script src="study-mobile-patch.js"></script>  ← これを追加
═══════════════════════════════════════════════════════ */

(function() {
  'use strict';

  /* ══════════════════════════════════════════════════════
     1. URL シェア機能
  ══════════════════════════════════════════════════════ */

  window.shareDeckUrl = function(deckId) {
    const dk = allPublicDecks[deckId];
    if (!dk) return;

    const url = new URL(location.href);
    url.searchParams.set('deck', deckId);
    const shareUrl = url.toString();

    // Web Share API — iOS/Android ネイティブ共有シート
    if (navigator.share) {
      navigator.share({
        title: 'HGStudy — ' + (dk.name || 'デッキ'),
        text: dk.desc ? dk.desc.slice(0, 80) : 'フラッシュカードで学習しよう！',
        url: shareUrl,
      }).catch(() => {});
      return;
    }

    // Clipboard API フォールバック
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
    Object.assign(input.style, { position:'fixed', top:'-999px', opacity:'0' });
    document.body.appendChild(input);
    input.focus();
    input.select();
    try {
      document.execCommand('copy');
      showToast('🔗 URLをコピーしました！', 'share');
    } catch {
      showToast('URLのコピーに失敗しました', 'error');
    }
    document.body.removeChild(input);
  }

  /* ══════════════════════════════════════════════════════
     2. deckCardHTML — シェアボタン付きに差し替え
  ══════════════════════════════════════════════════════ */

  // グローバルスコープの deckCardHTML を上書き
  window._origDeckCardHTML = window.deckCardHTML || null;

  window.deckCardHTML = function(id, dk) {
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
     3. Toast — "share" タイプ対応
  ══════════════════════════════════════════════════════ */

  const _origShowToast = window.showToast;
  window.showToast = function(msg, type) {
    _origShowToast(msg, type);
    // share タイプのクラスを追加
    if (type === 'share') {
      const t = document.getElementById('toast');
      if (t) t.classList.add('share');
    }
  };

  /* ══════════════════════════════════════════════════════
     4. URL パラメータからデッキを自動オープン
  ══════════════════════════════════════════════════════ */

  (function parseSharedDeckUrl() {
    const params = new URLSearchParams(location.search);
    const deckId = params.get('deck');
    if (!deckId) return;

    // URL をクリーン化（ブラウザ履歴を汚さない）
    const cleanUrl = location.pathname + (params.toString().replace(/deck=[^&]*/,'').replace(/^&/,'').replace(/&$/,'') ? '?' + params.toString().replace(/deck=[^&]*/,'').replace(/^&/,'').replace(/&$/,'') : '');
    history.replaceState({}, '', cleanUrl || location.pathname);

    // デッキ読み込み後にオープンするためグローバルに保持
    window._pendingSharedDeck = deckId;
  })();

  /* ══════════════════════════════════════════════════════
     5. loadAllDecks — シェアデッキの自動オープンをフック
  ══════════════════════════════════════════════════════ */

  // renderDeckGrid をフックして、初回呼び出し後に処理
  const _origRenderDeckGrid = window.renderDeckGrid || null;
  let _sharedDeckHandled = false;

  window.renderDeckGrid = function() {
    if (_origRenderDeckGrid) _origRenderDeckGrid();

    // 初回のみ: シェアデッキを自動オープン
    if (!_sharedDeckHandled && window._pendingSharedDeck) {
      _sharedDeckHandled = true;
      const sharedId = window._pendingSharedDeck;
      window._pendingSharedDeck = null;

      setTimeout(() => {
        if (allPublicDecks[sharedId]) {
          const card = document.getElementById('dcard_' + sharedId);
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // ハイライトアニメーション
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

  /* ══════════════════════════════════════════════════════
     6. モバイルボトムナビ
  ══════════════════════════════════════════════════════ */

  function injectMobileBottomNav() {
    if (document.getElementById('mobileBottomNav')) return;

    const nav = document.createElement('nav');
    nav.id = 'mobileBottomNav';
    nav.className = 'mobile-bottom-nav';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'メインナビゲーション');
    nav.innerHTML = `
      <button class="mbn-item on" id="mbnStudy"   onclick="mbnSwitch('study')"   aria-label="学習">
        <span class="mbn-icon" aria-hidden="true">📚</span>
        <span>学習</span>
      </button>
      <button class="mbn-item"    id="mbnBlog"    onclick="mbnSwitch('blog')"    aria-label="解説ブログ">
        <span class="mbn-icon" aria-hidden="true">✏️</span>
        <span>ブログ</span>
      </button>
      <button class="mbn-item"    id="mbnHistory" onclick="mbnSwitch('history')" aria-label="学習履歴">
        <span class="mbn-icon" aria-hidden="true">📊</span>
        <span>履歴</span>
      </button>
      <button class="mbn-item"    id="mbnRanking" onclick="mbnSwitch('ranking')" aria-label="ランキング">
        <span class="mbn-icon" aria-hidden="true">🏆</span>
        <span>ランキング</span>
      </button>
    `;
    document.body.appendChild(nav);
  }

  window.mbnSwitch = function(tab) {
    _updateMbnActive(tab);
    switchTab(tab);
  };

  function _updateMbnActive(tab) {
    ['study', 'blog', 'history', 'ranking'].forEach(t => {
      const id = 'mbn' + t.charAt(0).toUpperCase() + t.slice(1);
      const btn = document.getElementById(id);
      if (btn) btn.classList.toggle('on', t === tab);
    });
  }

  // switchTab をラップしてモバイルナビも同期
  const _origSwitchTab = window.switchTab;
  window.switchTab = function(tab) {
    _origSwitchTab(tab);
    _updateMbnActive(tab);
  };

  /* ══════════════════════════════════════════════════════
     7. 初期化
  ══════════════════════════════════════════════════════ */

  // DOM 読み込み後に実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectMobileBottomNav);
  } else {
    injectMobileBottomNav();
  }

})();
