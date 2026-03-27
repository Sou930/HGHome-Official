// ═══════════════════════════════════════════════════════════
// 祖語 — 30概念
// ═══════════════════════════════════════════════════════════
const PROTO = {
  '水':      'akuva',
  '火':      'apiru',
  '空':      'okelo',
  '土':      'atela',
  '太陽':    'asora',
  '月':      'seluna',
  '星':      'astori',
  '山':      'morava',
  '川':      'rivoka',
  '雨':      'plovera',
  '木':      'odoru',
  '草':      'veridu',
  '魚':      'apiska',
  '鳥':      'avoru',
  '獣':      'bestalu',
  '手':      'amanu',
  '目':      'okuli',
  '血':      'sangova',
  '歯':      'dentiru',
  '子':      'pirvanu',
  '母':      'matela',
  '石':      'opedu',
  '家':      'dometu',
  '食べる':  'omandu',
  '歩く':    'akamu',
  '話す':    'paroletu',
  '与える':  'donamu',
  '一':      'onuma',
  '良い':    'abonu',
  '新しい':  'novelu',
};
const CONCEPTS = Object.keys(PROTO);

// ═══════════════════════════════════════════════════════════
// 集落定義 — 10集落
// ═══════════════════════════════════════════════════════════
const VDEFS = [
  { id:'arka',   name:'アルカ',   px:320, py:232, desc:'中央交易都市',    prestige:2.2, iso:false,
    params:{vo:0.32,fd:0.18,vs:0.24,dv:0.14,pal:0.12},
    trait:'音変化・借用のバランス型。高い威信により周辺集落への語彙伝播が多い' },
  { id:'nubo',   name:'ヌボ',     px:218, py:74,  desc:'北の山岳集落',    prestige:0.9, iso:false,
    params:{vo:0.04,fd:0.10,vs:0.14,dv:0.72,pal:0.00},
    trait:'無声化が極めて強く音が硬質化。山岳という閉鎖環境が変化を保守的にする' },
  { id:'foren',  name:'フォレン', px:80,  py:100, desc:'北西の高地集落',  prestige:0.8, iso:false,
    params:{vo:0.14,fd:0.28,vs:0.20,dv:0.28,pal:0.10},
    trait:'語末脱落と無声化が共存。ヌボとセルヴァの中間的性質を持つ遷移地帯' },
  { id:'serva',  name:'セルヴァ', px:78,  py:218, desc:'西の深森集落',    prestige:1.0, iso:false,
    params:{vo:0.62,fd:0.14,vs:0.12,dv:0.04,pal:0.08},
    trait:'有声化が顕著。アルカとの活発な交易で借用語が多く蓄積される' },
  { id:'vera',   name:'ヴェラ',   px:130, py:348, desc:'南西の湿地帯',    prestige:0.7, iso:false,
    params:{vo:0.28,fd:0.46,vs:0.16,dv:0.04,pal:0.06},
    trait:'語末脱落と有声化が合わさる。湿地という地形が集落間の交流を制限する' },
  { id:'marina', name:'マリナ',   px:270, py:398, desc:'南の海岸集落',    prestige:1.1, iso:false,
    params:{vo:0.20,fd:0.68,vs:0.08,dv:0.02,pal:0.02},
    trait:'語末の音が次々と脱落する極端な「侵食型」。語形が極端に短縮される' },
  { id:'terra',  name:'テラ',     px:450, py:330, desc:'東南の大平原',    prestige:1.2, iso:false,
    params:{vo:0.24,fd:0.16,vs:0.38,dv:0.14,pal:0.08},
    trait:'母音推移が中心。豊かな農業地帯で語彙変化は緩やかだが着実に進む' },
  { id:'kairo',  name:'カイロ',   px:598, py:266, desc:'東の孤立した島嶼', prestige:0.5, iso:true,
    params:{vo:0.08,fd:0.58,vs:0.22,dv:0.08,pal:0.04},
    trait:'完全孤立による急速な独自進化。語末侵食が激しく原形をとどめない語が多い' },
  { id:'petra',  name:'ペトラ',   px:524, py:130, desc:'東北の孤立した岩峰', prestige:0.6, iso:true,
    params:{vo:0.12,fd:0.52,vs:0.42,dv:0.18,pal:0.04},
    trait:'母音変化と語末脱落が激しい。孤立のため変化速度は全集落中最速' },
  { id:'sara',   name:'サラ',     px:420, py:110, desc:'北東の農耕集落',  prestige:0.9, iso:false,
    params:{vo:0.18,fd:0.14,vs:0.48,dv:0.12,pal:0.08},
    trait:'母音推移が際立つ。ペトラとアルカ双方からの影響を受ける交差点的存在' },
];

// 接続グラフ（隣接する集落間の言語接触）
const CONNS = [
  ['arka','nubo'], ['arka','serva'], ['arka','marina'],
  ['arka','terra'], ['arka','sara'],
  ['serva','foren'], ['serva','vera'],
  ['nubo','foren'], ['nubo','sara'],
  ['marina','vera'], ['marina','terra'],
  ['terra','kairo'], ['sara','petra'],
];

// ═══════════════════════════════════════════════════════════
// 音素素性行列
// ═══════════════════════════════════════════════════════════
const PHF = {
  a:[0,1], e:[1,0], i:[2,0], o:[1,2], u:[2,2],
  p:[0,0,0], b:[0,0,1], t:[1,0,0], d:[1,0,1],
  k:[2,0,0], g:[2,0,1], m:[0,1,1], n:[1,1,1],
  r:[1,2,1], l:[1,3,1], s:[1,4,0], v:[0,4,1],
};
const VOWELS = new Set('aeiou');

function phonDist(a, b) {
  if (a === b) return 0;
  const fa = PHF[a], fb = PHF[b];
  if (!fa || !fb) return 1;
  const av = VOWELS.has(a), bv = VOWELS.has(b);
  if (av !== bv) return 1;
  let d = 0;
  for (let i = 0; i < fa.length; i++) d += Math.abs(fa[i] - fb[i]);
  return Math.min(d / (av ? 4 : 7), 1);
}

function wEditDist(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({length:m+1}, (_,i) =>
    Array.from({length:n+1}, (_,j) => i===0 ? j*0.8 : j===0 ? i*0.8 : 0)
  );
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    dp[i][j] = Math.min(
      dp[i-1][j] + 0.8,
      dp[i][j-1] + 0.8,
      dp[i-1][j-1] + phonDist(a[i-1], b[j-1])
    );
  return dp[m][n];
}

function sim(v1, v2) {
  let tot = 0;
  for (const c of CONCEPTS) {
    const a = v1.vocab[c], b = v2.vocab[c];
    const maxL = Math.max(a.length, b.length) * 0.8;
    tot += Math.max(0, 1 - wEditDist(a, b) / maxL);
  }
  return tot / CONCEPTS.length;
}

// ═══════════════════════════════════════════════════════════
// 音変化規則エンジン
// ═══════════════════════════════════════════════════════════
const VOWEL_SHIFT = {a:'e', e:'i', i:'u', o:'a', u:'o'};

function buildRules(p) {
  return [
    {
      name: '有声化', prob: p.vo * 0.007,
      fn: w => w.replace(/([aeiou])p([aeiou])/g,'$1b$2')
                .replace(/([aeiou])t([aeiou])/g,'$1d$2')
                .replace(/([aeiou])k([aeiou])/g,'$1g$2')
    },
    {
      name: '語末脱落', prob: p.fd * 0.005,
      fn: w => {
        if (w.length <= 3) return w;
        const last = w[w.length-1], prev = w[w.length-2];
        if (!VOWELS.has(last)) return w.slice(0,-1);
        if (w.length > 4 && !VOWELS.has(prev)) return w.slice(0,-1);
        return w;
      }
    },
    {
      name: '母音推移', prob: p.vs * 0.006,
      fn: w => {
        const present = [...new Set([...w].filter(c => VOWELS.has(c)))];
        if (!present.length) return w;
        const target = present[Math.floor(Math.random() * present.length)];
        return w.replace(new RegExp(target,'g'), VOWEL_SHIFT[target] || target);
      }
    },
    {
      name: '無声化', prob: p.dv * 0.007,
      fn: w => w.replace(/b/g,'p').replace(/d/g,'t').replace(/g/g,'k')
    },
    {
      name: '口蓋化', prob: p.pal * 0.005,
      fn: w => w.replace(/([aeiou])r([aeiou])/g,'$1s$2')
                .replace(/nk/g,'ng').replace(/mp/g,'mb')
    },
  ];
}

function adaptBorrow(word, village) {
  if (Math.random() > 0.45) return word;
  const rules = buildRules(village.params);
  const dominant = rules.reduce((a,b) => a.prob > b.prob ? a : b);
  const adapted = dominant.fn(word);
  return adapted.length >= 3 ? adapted : word;
}

// ═══════════════════════════════════════════════════════════
// 社会的事象
// ═══════════════════════════════════════════════════════════
const SOC_EVENTS = [
  { name:'交易路開通',   prob:0.0016,
    msg: v => `${v.name}に新たな交易路が開通。威信上昇`,
    eff: v => { v._pBoost = true; v._pEnd = state.year + 300; } },
  { name:'疫病・孤立化', prob:0.0009,
    msg: v => `${v.name}で疫病が流行。一時的孤立化`,
    eff: v => { if (!v.iso) { v._tmpIso = true; v._isoEnd = state.year + 200; } } },
  { name:'権威集落化',   prob:0.0012,
    msg: v => `${v.name}の文化的威信が高まる`,
    eff: v => { v._pBoost = true; v._pEnd = state.year + 250; } },
  { name:'大移住',       prob:0.0007,
    msg: v => `${v.name}近辺で大規模な人口移動が発生`,
    eff: () => {} },
];

// ═══════════════════════════════════════════════════════════
// 状態
// ═══════════════════════════════════════════════════════════
let villages = [];
let elog = [];
let simCache = {};
let driftHistory = []; // [{year, snap:{id->pct}}]
const state = { year:0, running:false, ypt:10, tms:420, timer:null, sel:null, tab:'vocab' };

function gv(id) { return villages.find(v => v.id === id); }

function initV() {
  villages = VDEFS.map(d => ({
    ...d,
    vocab: {...PROTO},
    lc: {}, ct: {},
    _tmpIso: false, _isoEnd: 0,
    _pBoost: false, _pEnd: 0,
  }));
  elog = [];
  simCache = {};
  driftHistory = [];
}

function cachedSim(id1, id2) {
  const key = id1 < id2 ? `${id1}|${id2}` : `${id2}|${id1}`;
  if (!(key in simCache)) simCache[key] = sim(gv(id1), gv(id2));
  return simCache[key];
}

// ═══════════════════════════════════════════════════════════
// 進化ループ
// ═══════════════════════════════════════════════════════════
const BORROW_BASE = 0.0026;

function evolve(yrs) {
  for (let y = 0; y < yrs; y++) {
    state.year++;
    const yr = state.year;
    simCache = {};

    for (const v of villages) {
      const isIso = v.iso || v._tmpIso;
      const mult = isIso ? 1.75 : 1.0;
      const rules = buildRules(v.params);

      for (const rule of rules) {
        if (Math.random() < rule.prob * mult) {
          const changes = [];
          for (const c of CONCEPTS) {
            const old = v.vocab[c];
            const nw = rule.fn(old);
            if (nw !== old && nw.length >= 3) {
              v.vocab[c] = nw;
              v.lc[c] = yr;
              v.ct[c] = 'p';
              changes.push({ c, old, to:nw });
            }
          }
          if (changes.length > 0) {
            const preview = changes.slice(0,3).map(x=>`${x.c}:${x.old}→${x.to}`).join(' / ');
            const extra = changes.length > 3 ? ` 他${changes.length-3}語` : '';
            elog.unshift({ yr, type:'sys',
              html:`<span class="vn">${v.name}</span> <em>${rule.name}</em>が体系的に発生 (${changes.length}語) — ${preview}${extra}` });
          }
        }
      }
    }

    for (const [aid, bid] of CONNS) {
      for (const c of CONCEPTS) {
        if (Math.random() < BORROW_BASE) {
          const va = gv(aid), vb = gv(bid);
          const ap = va.prestige * (va._pBoost ? 1.6 : 1.0);
          const bp = vb.prestige * (vb._pBoost ? 1.6 : 1.0);
          const [don, rec] = Math.random() < ap/(ap+bp) ? [va,vb] : [vb,va];
          if (don.vocab[c] !== rec.vocab[c]) {
            const old = rec.vocab[c];
            const adapted = adaptBorrow(don.vocab[c], rec);
            if (adapted !== old && adapted.length >= 3) {
              rec.vocab[c] = adapted;
              rec.lc[c] = yr;
              rec.ct[c] = 'b';
              elog.unshift({ yr, type:'brw',
                html:`<span class="bn">${rec.name}</span>が<span class="vn">${don.name}</span>から「${c}」を借用: ${old}→<b>${adapted}</b>` });
            }
          }
        }
      }
    }

    if (yr % 10 === 0) {
      for (const ev of SOC_EVENTS) {
        for (const v of villages) {
          if (Math.random() < ev.prob) {
            if (ev.eff) ev.eff(v);
            const msg = ev.msg(v);
            elog.unshift({ yr, type:'evt', html:`<span class="ev">◆ ${msg}</span>` });
            showTicker(msg);
          }
        }
      }
      for (const v of villages) {
        if (v._tmpIso && state.year >= v._isoEnd) v._tmpIso = false;
        if (v._pBoost && state.year >= v._pEnd) v._pBoost = false;
      }
    }

    if (elog.length > 320) elog.length = 320;

    // 乖離率を50年ごとに記録
    if (state.year % 50 === 0) {
      const snap = {};
      for (const v of villages)
        snap[v.id] = CONCEPTS.filter(c => v.vocab[c] !== PROTO[c]).length / CONCEPTS.length;
      driftHistory.push({ year: state.year, snap });
      if (driftHistory.length > 100) driftHistory.shift();
    }
  }
}

function tick() { evolve(state.ypt); render(); }

// ═══════════════════════════════════════════════════════════
// イベントティッカー
// ═══════════════════════════════════════════════════════════
let tickTimer = null;
function showTicker(msg) {
  const el = document.getElementById('evtick');
  el.textContent = '◆ ' + msg;
  el.classList.add('show');
  clearTimeout(tickTimer);
  tickTimer = setTimeout(() => el.classList.remove('show'), 4500);
}

// ═══════════════════════════════════════════════════════════
// 地図描画
// ═══════════════════════════════════════════════════════════
function buildMap() {
  const svg = document.getElementById('map');
  let h = `
  <defs>
    <radialGradient id="bgr" cx="44%" cy="44%" r="62%">
      <stop offset="0%" stop-color="#f2e8d2"/>
      <stop offset="100%" stop-color="#dfd0b2"/>
    </radialGradient>
    <filter id="sh" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="1" dy="1.5" stdDeviation="2.5" flood-color="#60401a" flood-opacity="0.35"/>
    </filter>
    <pattern id="grid" width="38" height="38" patternUnits="userSpaceOnUse">
      <path d="M38 0L0 0 0 38" fill="none" stroke="#c0b090" stroke-width="0.18" opacity="0.28"/>
    </pattern>
  </defs>
  <rect width="690" height="500" fill="url(#bgr)"/>
  <rect width="690" height="500" fill="url(#grid)"/>

  <!-- 山岳地帯（ヌボ付近） -->
  <g opacity="0.38" stroke="none">
    <polygon points="170,88 196,50 222,88" fill="#6a5838"/>
    <polygon points="196,87 222,48 248,87" fill="#6a5838"/>
    <polygon points="150,87 170,60 190,87" fill="#8a7858" opacity="0.55"/>
    <polygon points="218,86 232,64 246,86" fill="#8a7858" opacity="0.45"/>
    <polygon points="178,52 186,66 170,66" fill="#e8e2d8" opacity="0.6"/>
    <polygon points="204,50 212,64 196,64" fill="#e8e2d8" opacity="0.55"/>
  </g>

  <!-- 森林（セルヴァ付近） -->
  <g opacity="0.30" fill="#4a6830">
    <circle cx="28" cy="226" r="20"/><circle cx="52" cy="214" r="17"/>
    <circle cx="36" cy="202" r="15"/><circle cx="20" cy="210" r="14"/>
    <circle cx="56" cy="232" r="13"/><circle cx="40" cy="238" r="12"/>
    <circle cx="24" cy="244" r="11"/>
  </g>

  <!-- 森林（フォレン付近） -->
  <g opacity="0.22" fill="#4a6030">
    <circle cx="36" cy="125" r="14"/><circle cx="54" cy="115" r="11"/>
    <circle cx="42" cy="108" r="10"/><circle cx="24" cy="118" r="11"/>
    <circle cx="60" cy="128" r="8"/>
  </g>

  <!-- 海岸線（マリナ付近） -->
  <path d="M130,470 Q220,428 305,445 Q395,462 475,448 Q555,434 640,450 L690,450 L690,500 L130,500 Z"
        fill="#7aa4b8" opacity="0.24"/>
  <path d="M145,468 Q238,428 315,445 Q405,462 482,448 Q562,434 645,450"
        fill="none" stroke="#4a80a0" stroke-width="1.3" stroke-dasharray="5,4" opacity="0.34"/>
  <path d="M138,476 Q228,436 316,454 Q408,470 484,456"
        fill="none" stroke="#4a80a0" stroke-width="0.7" stroke-dasharray="3,4" opacity="0.2"/>

  <!-- 島（カイロ） -->
  <ellipse cx="598" cy="272" rx="55" ry="40" fill="#7aa4b8" opacity="0.2"/>
  <ellipse cx="598" cy="272" rx="48" ry="34" fill="#c8dce8" opacity="0.14"/>
  <ellipse cx="598" cy="266" rx="28" ry="24" fill="#ede0c0" opacity="0.95"/>

  <!-- 岩場（ペトラ付近） -->
  <g opacity="0.30" fill="#8a7a60">
    <circle cx="568" cy="118" r="8"/><circle cx="582" cy="133" r="7"/>
    <circle cx="558" cy="140" r="9"/><circle cx="576" cy="112" r="5"/>
    <circle cx="548" cy="128" r="6"/>
  </g>

  <!-- 平原（テラ付近） -->
  <g opacity="0.09" stroke="#9a8060" stroke-width="0.6" fill="none">
    <line x1="385" y1="296" x2="526" y2="316"/>
    <line x1="380" y1="312" x2="520" y2="332"/>
    <line x1="375" y1="328" x2="514" y2="348"/>
    <line x1="388" y1="344" x2="504" y2="360"/>
  </g>

  <!-- 河川 -->
  <path d="M248,84 Q288,144 314,232 Q288,328 272,398"
        fill="none" stroke="#7aa4b8" stroke-width="2.2" opacity="0.26"/>
  <path d="M424,120 Q402,178 444,244 Q462,298 450,330"
        fill="none" stroke="#7aa4b8" stroke-width="1.6" opacity="0.2"/>
  <path d="M110,108 Q130,165 100,224"
        fill="none" stroke="#7aa4b8" stroke-width="1.2" opacity="0.18"/>

  <!-- 方位磁針 -->
  <g transform="translate(654,34)" opacity="0.52">
    <polygon points="0,-17 3,-5 0,-8 -3,-5" fill="#4a3820"/>
    <polygon points="0,17 3,5 0,8 -3,5" fill="#4a3820" opacity="0.38"/>
    <polygon points="-17,0 -5,-3 -8,0 -5,3" fill="#4a3820" opacity="0.38"/>
    <polygon points="17,0 5,-3 8,0 5,3" fill="#4a3820" opacity="0.38"/>
    <circle cx="0" cy="0" r="4" fill="none" stroke="#4a3820" stroke-width="1"/>
    <text x="0" y="-22" text-anchor="middle" font-size="9.5" font-family="serif" fill="#4a3820" font-weight="bold">N</text>
  </g>`;

  for (const [aid, bid] of CONNS) {
    const va = gv(aid), vb = gv(bid);
    const s = cachedSim(aid, bid);
    const col = s > 0.72 ? '#4a8050' : s > 0.45 ? '#8a7030' : '#9a3020';
    const op  = (0.22 + s * 0.52).toFixed(2);
    const sw  = (0.6 + s * 2.0).toFixed(1);
    h += `<line x1="${va.px}" y1="${va.py}" x2="${vb.px}" y2="${vb.py}"
            stroke="${col}" stroke-width="${sw}" stroke-dasharray="5,4" opacity="${op}"/>`;
    const mx = (va.px+vb.px)/2, my = (va.py+vb.py)/2 - 7;
    h += `<text x="${mx}" y="${my}" text-anchor="middle" font-size="8.5" font-family="serif"
            fill="#5a4228" opacity="0.72">${Math.round(s*100)}%</text>`;
  }

  for (const v of villages) {
    const sel = state.sel === v.id;
    const isIso = v.iso || v._tmpIso;
    const drift = CONCEPTS.filter(c => v.vocab[c] !== PROTO[c]).length / CONCEPTS.length;
    const r = sel ? 11 : 8;
    const fc = drift > 0.7 ? '#a03020' : drift > 0.4 ? '#7a5a18' : '#362814';
    const sc = sel ? '#e8c040' : isIso ? '#a04020' : '#a09060';
    const sw = sel ? 2.5 : 1.5;
    const tc = sel ? '#7a2010' : '#2e2008';

    const recentChange = Object.values(v.lc).some(yr => state.year - yr < 120);
    if (recentChange) {
      h += `<circle cx="${v.px}" cy="${v.py}" r="${r+6}"
              fill="none" stroke="${v.ct && Object.values(v.ct).includes('b') ? '#3a6ea0' : '#c0332a'}"
              stroke-width="0.8" stroke-dasharray="2,3" opacity="0.45"/>`;
    }
    h += `
    <g style="cursor:pointer" onclick="selectV('${v.id}')">
      <circle cx="${v.px}" cy="${v.py}" r="25" fill="transparent"/>
      <circle cx="${v.px}" cy="${v.py}" r="${r+3}" fill="${fc}" opacity="0.16"/>
      <circle cx="${v.px}" cy="${v.py}" r="${r}" fill="${fc}" stroke="${sc}"
              stroke-width="${sw}" filter="url(#sh)"/>
      ${sel ? `<circle cx="${v.px}" cy="${v.py}" r="${r+6}"
                fill="none" stroke="#e8c040" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.65"/>` : ''}
      <text x="${v.px}" y="${v.py+23}" text-anchor="middle"
            font-size="11.5" font-family="'Palatino Linotype',Georgia,serif"
            fill="${tc}" font-weight="${sel?'bold':'normal'}">${v.name}</text>
      ${isIso ? `<text x="${v.px+14}" y="${v.py-9}" font-size="8" fill="#8c2808" opacity="0.72">孤</text>` : ''}
      ${v._pBoost ? `<text x="${v.px+14}" y="${v.py-9}" font-size="9" fill="#c9a227" opacity="0.85">★</text>` : ''}
    </g>`;
  }

  h += `
  <g transform="translate(10,${500-82})" font-family="'Palatino Linotype',serif">
    <rect x="-5" y="-14" width="148" height="79" fill="#f0e8d0" opacity="0.75" rx="2"/>
    <text font-size="9" fill="#5c4228" y="0" font-weight="bold">相互通話可能度</text>
    <line x1="0" y1="15" x2="28" y2="15" stroke="#4a8050" stroke-width="2.5" stroke-dasharray="4,3"/>
    <text font-size="8" fill="#5c4228" x="32" y="18">高 (70%+)</text>
    <line x1="0" y1="31" x2="28" y2="31" stroke="#8a7030" stroke-width="1.8" stroke-dasharray="4,3"/>
    <text font-size="8" fill="#5c4228" x="32" y="34">中 (45–70%)</text>
    <line x1="0" y1="47" x2="28" y2="47" stroke="#9a3020" stroke-width="1" stroke-dasharray="4,3"/>
    <text font-size="8" fill="#5c4228" x="32" y="50">低 (45%未満)</text>
    <circle cx="5" cy="62" r="4.5" fill="#a03020"/>
    <text font-size="8" fill="#5c4228" x="14" y="65">孤立・大きく変化</text>
  </g>`;

  svg.innerHTML = h;
}

// ═══════════════════════════════════════════════════════════
// 語彙表
// ═══════════════════════════════════════════════════════════
const HOT_WIN = 200;

function renderTable() {
  document.getElementById('vthead').innerHTML =
    `<tr><th class="cc">概念 / 祖語</th>` +
    villages.map(v => `<th title="${v.desc}">${v.name}</th>`).join('') + `</tr>`;

  document.getElementById('vtbody').innerHTML = CONCEPTS.map(c => {
    const cells = villages.map(v => {
      const w = v.vocab[c];
      const hot = v.lc[c] && (state.year - v.lc[c] < HOT_WIN);
      const isBorrow = v.ct[c] === 'b' && hot;
      let cls = '';
      if (isBorrow) cls = 'hot-borrow';
      else if (hot) cls = 'hot';
      else if (w !== PROTO[c]) cls = 'drifted';
      return `<td class="${cls}" title="${v.name}: ${w}\n祖語: ${PROTO[c]}">${w}</td>`;
    }).join('');
    return `<tr><td class="cc" title="祖語形: ${PROTO[c]}">${c} <small style="color:var(--text3);font-family:Courier Prime,monospace;font-size:9px">${PROTO[c]}</small></td>${cells}</tr>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════
// 変化ログ
// ═══════════════════════════════════════════════════════════
function renderLog() {
  document.getElementById('loglist').innerHTML =
    elog.slice(0,130).map(e =>
      `<div class="logitem ${e.type}"><span class="yr">${e.yr}年</span>${e.html}</div>`
    ).join('');
}

// ═══════════════════════════════════════════════════════════
// 統計タブ
// ═══════════════════════════════════════════════════════════
function renderStats() {
  const sorted = [...villages].sort((a,b) => {
    const da = CONCEPTS.filter(c=>a.vocab[c]!==PROTO[c]).length;
    const db = CONCEPTS.filter(c=>b.vocab[c]!==PROTO[c]).length;
    return db - da;
  });

  const driftRows = sorted.map(v => {
    const n = CONCEPTS.filter(c => v.vocab[c] !== PROTO[c]).length;
    const pct = n / CONCEPTS.length;
    const col = pct > 0.7 ? '#c0332a' : pct > 0.45 ? '#b08020' : '#3a7048';
    return `<div class="drift-row">
      <div class="drift-name">${v.name}</div>
      <div class="drift-track"><div class="drift-fill" style="width:${(pct*100).toFixed(0)}%;background:${col}"></div></div>
      <div class="drift-val">${n}/${CONCEPTS.length}</div>
    </div>`;
  }).join('');

  const hdr = `<td class="hlabel" style="background:var(--bg2)"></td>` +
    villages.map(v => `<td class="hlabel">${v.name}</td>`).join('');

  const rows = villages.map((va,i) => {
    const cells = villages.map((vb,j) => {
      if (i===j) return `<td style="background:var(--bg3);color:var(--text3)">—</td>`;
      const s = cachedSim(va.id, vb.id);
      const a = (0.08 + s * 0.65).toFixed(2);
      const bg = i < j ? `rgba(80,145,80,${a})` : `rgba(55,100,170,${a})`;
      return `<td style="background:${bg};color:var(--text)">${Math.round(s*100)}</td>`;
    }).join('');
    return `<tr><td class="mlabel">${va.name}</td>${cells}</tr>`;
  }).join('');

  document.getElementById('stbody').innerHTML = `
    <div class="st-section">
      <div class="st-title">祖語からの乖離率</div>
      ${driftRows}
    </div>
    <div class="st-section">
      <div class="st-title">集落間 語彙類似度（%）— 緑=高類似 / 青=低類似</div>
      <div class="sim-matrix-wrap">
        <table class="sim-matrix">
          <thead><tr>${hdr}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════
// 集落情報パネル + 介入ボタン
// ═══════════════════════════════════════════════════════════
function renderVInfo() {
  const el = document.getElementById('vinfo');
  if (!state.sel) { el.classList.remove('on'); return; }
  const v = gv(state.sel);
  if (!v) return;
  el.classList.add('on');
  const changed = CONCEPTS.filter(c => v.vocab[c] !== PROTO[c]).length;
  document.getElementById('vi-name').textContent = `${v.name}　${v.desc}`;
  document.getElementById('vi-meta').textContent = `語彙変化: ${changed} / ${CONCEPTS.length} 語　威信: ${(v.prestige*(v._pBoost?1.6:1)).toFixed(1)}${v._tmpIso?'　一時孤立中':''}`;
  const p = v.params;
  document.getElementById('vi-bars').innerHTML = [
    {l:'有声化',   val:p.vo,  c:'#5d98cc'},
    {l:'語末脱落', val:p.fd,  c:'#e05540'},
    {l:'母音推移', val:p.vs,  c:'#c9a227'},
    {l:'無声化',   val:p.dv,  c:'#8a8a9a'},
    {l:'口蓋化',   val:p.pal, c:'#52a060'},
  ].map(b =>
    `<div class="vi-bar-item">
      <div class="vi-bar-label">${b.l}</div>
      <div class="vi-bar-track"><div class="vi-bar-fill" style="width:${Math.round(b.val*100)}%;background:${b.c}"></div></div>
    </div>`
  ).join('');
  document.getElementById('vi-trait').textContent = v.trait;

  // ── 介入ボタン ──
  document.getElementById('vi-actions').innerHTML = `
    <button class="vi-btn vi-btn-grn" onclick="intervene('trade','${v.id}')">★ 交易開通</button>
    <button class="vi-btn vi-btn-red" onclick="intervene('isolate','${v.id}')">⚑ 疫病孤立</button>
    <button class="vi-btn vi-btn-blu" onclick="intervene('prestige','${v.id}')">▲ 威信強化</button>
    <button class="vi-btn" onclick="intervene('reset','${v.id}')">↺ 語彙リセット</button>
  `;
}

// ── 介入コマンド実行 ──
function intervene(type, vid) {
  const v = gv(vid);
  if (!v) return;
  const yr = state.year;
  let msg = '';
  switch (type) {
    case 'trade':
      v._pBoost = true; v._pEnd = yr + 400;
      msg = `${v.name}に交易路を開通（400年間 威信×1.6）`;
      elog.unshift({ yr, type:'int', html:`<span class="in">【介入】</span> ${v.name}に交易路が開通。威信が大幅に上昇` });
      break;
    case 'isolate':
      if (!v.iso) { v._tmpIso = true; v._isoEnd = yr + 350; }
      msg = `${v.name}を孤立化（350年間 変化速度×1.75）`;
      elog.unshift({ yr, type:'int', html:`<span class="in">【介入】</span> ${v.name}を疫病で孤立。独自進化が加速` });
      break;
    case 'prestige':
      v.prestige = Math.min(v.prestige * 1.9, 4.5);
      msg = `${v.name}の威信を強化（→ ${v.prestige.toFixed(1)}）`;
      elog.unshift({ yr, type:'int', html:`<span class="in">【介入】</span> ${v.name}の文化的権威が急上昇 → 威信 ${v.prestige.toFixed(1)}` });
      break;
    case 'reset':
      v.vocab = { ...PROTO }; v.lc = {}; v.ct = {};
      msg = `${v.name}の語彙を祖語形にリセット`;
      elog.unshift({ yr, type:'int', html:`<span class="in">【介入】</span> ${v.name}の語彙を祖語にリセット（実験用）` });
      break;
  }
  showToast(msg);
  simCache = {};
  render();
}

// ── トースト通知 ──
let _toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

// ═══════════════════════════════════════════════════════════
// グラフタブ — 乖離率折れ線 + UPGMA系統樹
// ═══════════════════════════════════════════════════════════

// 集落カラーパレット（インデックス対応）
const V_COLORS = [
  '#e8c55a','#5d98cc','#e05540','#52a060',
  '#c9a227','#8a8a9a','#a04020','#3a7048',
  '#7aa4b8','#b08020',
];

function renderChart() {
  renderLineChart();
  renderDendrogram();
}

// ── 折れ線グラフ ──────────────────────────────────────────
function renderLineChart() {
  const canvas = document.getElementById('chart-line');
  if (!canvas) return;
  const W = canvas.clientWidth || 340;
  const H = 140;
  canvas.width = W * devicePixelRatio;
  canvas.height = H * devicePixelRatio;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(devicePixelRatio, devicePixelRatio);

  // 背景
  ctx.fillStyle = '#0f1520';
  ctx.fillRect(0, 0, W, H);

  // グリッド（0% / 50% / 100%）
  ctx.strokeStyle = 'rgba(201,162,39,0.08)';
  ctx.lineWidth = 0.5;
  [0, 0.5, 1].forEach(pct => {
    const y = H - 4 - pct * (H - 20);
    ctx.beginPath(); ctx.moveTo(38, y); ctx.lineTo(W - 4, y); ctx.stroke();
  });

  // Y軸ラベル
  ctx.fillStyle = 'rgba(106,94,74,0.85)';
  ctx.font = `${7 * devicePixelRatio / devicePixelRatio}px serif`;
  ctx.textAlign = 'right';
  ['100%', '50%', '0%'].forEach((lbl, i) => {
    const y = H - 4 - [1, 0.5, 0][i] * (H - 20) + 3;
    ctx.fillText(lbl, 34, y);
  });

  if (driftHistory.length < 2) {
    ctx.fillStyle = 'rgba(106,94,74,0.5)';
    ctx.textAlign = 'center';
    ctx.font = '10px serif';
    ctx.fillText('▶ を押すと記録が始まります（50年ごと）', W / 2, H / 2);
    return;
  }

  const drawX = (i) => 40 + (i / (driftHistory.length - 1)) * (W - 48);
  const drawY = (pct) => H - 4 - pct * (H - 20);

  // 各集落の折れ線
  villages.forEach((v, vi) => {
    const col = V_COLORS[vi % V_COLORS.length];
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    driftHistory.forEach((d, i) => {
      const x = drawX(i), y = drawY(d.snap[v.id] || 0);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 末端ラベル
    const last = driftHistory[driftHistory.length - 1];
    const lx = drawX(driftHistory.length - 1) + 3;
    const ly = drawY(last.snap[v.id] || 0) + 3;
    ctx.fillStyle = col;
    ctx.font = '7.5px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.fillText(v.name, Math.min(lx, W - 30), Math.max(10, Math.min(H - 4, ly)));
  });

  // X軸（年表示）
  ctx.fillStyle = 'rgba(106,94,74,0.7)';
  ctx.font = '7px serif';
  ctx.textAlign = 'center';
  const first = driftHistory[0], lastD = driftHistory[driftHistory.length - 1];
  ctx.fillText(first.year + '年', drawX(0), H - 1);
  ctx.fillText(lastD.year + '年', drawX(driftHistory.length - 1), H - 1);
}

// ── 系統樹（UPGMA） ──────────────────────────────────────
function renderDendrogram() {
  const canvas = document.getElementById('chart-tree');
  if (!canvas) return;
  const W = canvas.clientWidth || 340;
  const H = 200;
  canvas.width = W * devicePixelRatio;
  canvas.height = H * devicePixelRatio;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(devicePixelRatio, devicePixelRatio);

  ctx.fillStyle = '#0d1222';
  ctx.fillRect(0, 0, W, H);

  const n = villages.length;
  if (n < 2) return;

  // 距離行列（1 - 類似度）
  const dist = Array.from({length:n}, (_, i) =>
    Array.from({length:n}, (_, j) => i === j ? 0 : 1 - cachedSim(villages[i].id, villages[j].id))
  );

  // UPGMA クラスタリング
  // 各クラスターを {members: [idx...], height: float} で管理
  let clusters = villages.map((_, i) => ({ members: [i], height: 0 }));
  const mergeLog = []; // {a, b, height, newIdx}

  const avgDist = (ca, cb) => {
    let s = 0;
    for (const i of ca.members) for (const j of cb.members) s += dist[i][j];
    return s / (ca.members.length * cb.members.length);
  };

  while (clusters.length > 1) {
    let best = Infinity, bi = 0, bj = 1;
    for (let i = 0; i < clusters.length; i++)
      for (let j = i + 1; j < clusters.length; j++) {
        const d = avgDist(clusters[i], clusters[j]);
        if (d < best) { best = d; bi = i; bj = j; }
      }
    const merged = {
      members: [...clusters[bi].members, ...clusters[bj].members],
      height: best,
      left: clusters[bi],
      right: clusters[bj],
    };
    const newClusters = clusters.filter((_, k) => k !== bi && k !== bj);
    newClusters.push(merged);
    clusters = newClusters;
  }

  const root = clusters[0];
  const maxH = root.height || 1;

  // 葉の順序を決める（中央順走査）
  const leafOrder = [];
  (function collectLeaves(node) {
    if (!node.left) { leafOrder.push(node.members[0]); return; }
    collectLeaves(node.left);
    collectLeaves(node.right);
  })(root);

  const ML = 46, MR = 10, MT = 12, MB = 18;
  const dW = W - ML - MR, dH = H - MT - MB;

  // X: 距離（左=0, 右=分岐深い）, Y: 葉の順序
  const leafY = (leafIdx) => MT + (leafIdx + 0.5) * (dH / n);
  const nodeX = (h) => ML + (h / maxH) * dW;

  // 再帰描画、各ノードのY中心を返す
  function drawNode(node) {
    if (!node.left) {
      const vi = node.members[0];
      const y = leafY(leafOrder.indexOf(vi));
      // 葉ラベル
      ctx.fillStyle = V_COLORS[vi % V_COLORS.length];
      ctx.font = '8px Cormorant Garamond, serif';
      ctx.textAlign = 'right';
      ctx.fillText(villages[vi].name, ML - 3, y + 3);
      // 横線（葉 → height=0 の位置）
      ctx.strokeStyle = 'rgba(201,162,39,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ML, y); ctx.lineTo(nodeX(0) + 1, y); ctx.stroke();
      return y;
    }

    const ly = drawNode(node.left);
    const ry = drawNode(node.right);
    const x  = nodeX(node.height);
    const lx = nodeX(node.left.height || 0);
    const rx = nodeX(node.right.height || 0);
    const mid = (ly + ry) / 2;

    const col = `rgba(201,162,39,${0.25 + (1 - node.height / maxH) * 0.5})`;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.2;

    // 縦線（左子〜右子をつなぐ）
    ctx.beginPath(); ctx.moveTo(x, ly); ctx.lineTo(x, ry); ctx.stroke();
    // 左子への横線
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(x, ly); ctx.stroke();
    // 右子への横線
    ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(x, ry); ctx.stroke();

    return mid;
  }

  drawNode(root);

  // 軸ラベル
  ctx.fillStyle = 'rgba(106,94,74,0.6)';
  ctx.font = '7px serif';
  ctx.textAlign = 'left';
  ctx.fillText('← 近い', ML + 2, H - 3);
  ctx.textAlign = 'right';
  ctx.fillText('遠い →', W - MR, H - 3);
}

// ═══════════════════════════════════════════════════════════
// レンダー統括
// ═══════════════════════════════════════════════════════════
function render() {
  document.getElementById('yr').textContent = state.year;
  buildMap();
  if (state.tab === 'vocab') renderTable();
  else if (state.tab === 'log') renderLog();
  else if (state.tab === 'stats') renderStats();
  else if (state.tab === 'chart') renderChart();
  renderVInfo();
}

// ═══════════════════════════════════════════════════════════
// コントロール
// ═══════════════════════════════════════════════════════════
function togglePlay() {
  state.running = !state.running;
  document.getElementById('btn-play').textContent = state.running ? '⏸' : '▶';
  if (state.running) loop();
  else clearTimeout(state.timer);
}
function loop() {
  if (!state.running) return;
  tick();
  state.timer = setTimeout(loop, state.tms);
}
function setSpeed(btn) {
  document.querySelectorAll('.btn[data-s]').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  const s = parseInt(btn.dataset.s);
  state.ypt = s;
  state.tms = s <= 10 ? 420 : s <= 50 ? 240 : 95;
}
function setTab(t) {
  state.tab = t;
  ['vocab','log','stats','chart'].forEach(x => {
    document.getElementById('tab-'+x).classList.toggle('on', x===t);
    document.getElementById('pb-'+x).style.display = x===t ? 'block' : 'none';
  });
  render();
}
function selectV(id) {
  state.sel = state.sel === id ? null : id;
  render();
}
function resetGame() {
  clearTimeout(state.timer);
  state.running = false; state.year = 0; state.sel = null;
  document.getElementById('btn-play').textContent = '▶';
  initV(); render();
}

// ── 起動 ──
initV();
render();
