// ═══════════════════════════════════════════════════════════
// 言語の漂流 v2c — 科学的精度強化版
//
// 実装した言語学的モデル:
//  [1] 音韻規則の環境条件化 (Neogrammarian + 環境依存)
//  [2] 語彙頻度・神聖度による変化抵抗
//  [3] 連鎖音変化 (chain shift)
//  [4] 社会階層モデル (elite / middle / common)
//  [5] ダイグロシア (H-form威信形 / L-form口語形 の分岐)
//  [6] 言語接触抵抗段階 (語彙→形態→音韻, Thomason & Kaufman)
//  [7] クレオール化 (均衡接触 → 混合語発生)
//  [8] 典礼語の凍結 (ラテン語効果)
//  [9] 書記言語の乖離 (書き言葉 vs 話し言葉)
// [10] 人口動態 (成長・衰退・戦争置換・集落分裂)
// ═══════════════════════════════════════════════════════════

// ── 祖語 ────────────────────────────────────────────────
const PROTO = {
  '水':'akuva','火':'apiru','空':'okelo','土':'atela','太陽':'asora',
  '月':'seluna','星':'astori','山':'morava','川':'rivoka','雨':'plovera',
  '木':'odoru','草':'veridu','魚':'apiska','鳥':'avoru','獣':'bestalu',
  '手':'amanu','目':'okuli','血':'sangova','歯':'dentiru','子':'pirvanu',
  '母':'matela','石':'opedu','家':'dometu','食べる':'omandu','歩く':'akamu',
  '話す':'paroletu','与える':'donamu','一':'onuma','良い':'abonu','新しい':'novelu',
};
const CONCEPTS = Object.keys(PROTO);

// ── 語彙メタデータ ───────────────────────────────────────
// freq: 高頻度語ほど変化しにくい (Zipfの法則)
// sacred: 典礼語として凍結される可能性
// domain: 'body'|'nature'|'social'|'number' — 借用しやすさに影響
const LEXICON_META = {
  '水':    {freq:0.92,sacred:0.40,domain:'nature'},
  '火':    {freq:0.88,sacred:0.50,domain:'nature'},
  '空':    {freq:0.70,sacred:0.30,domain:'nature'},
  '土':    {freq:0.75,sacred:0.35,domain:'nature'},
  '太陽':  {freq:0.85,sacred:0.80,domain:'nature'},  // 宗教的
  '月':    {freq:0.80,sacred:0.75,domain:'nature'},  // 宗教的
  '星':    {freq:0.60,sacred:0.60,domain:'nature'},
  '山':    {freq:0.72,sacred:0.25,domain:'nature'},
  '川':    {freq:0.70,sacred:0.20,domain:'nature'},
  '雨':    {freq:0.75,sacred:0.30,domain:'nature'},
  '木':    {freq:0.80,sacred:0.10,domain:'nature'},
  '草':    {freq:0.65,sacred:0.05,domain:'nature'},
  '魚':    {freq:0.70,sacred:0.15,domain:'nature'},
  '鳥':    {freq:0.68,sacred:0.20,domain:'nature'},
  '獣':    {freq:0.65,sacred:0.15,domain:'nature'},
  '手':    {freq:0.95,sacred:0.10,domain:'body'},   // 高頻度・身体
  '目':    {freq:0.93,sacred:0.15,domain:'body'},
  '血':    {freq:0.85,sacred:0.70,domain:'body'},   // 宗教的
  '歯':    {freq:0.88,sacred:0.05,domain:'body'},
  '子':    {freq:0.90,sacred:0.20,domain:'social'},
  '母':    {freq:0.92,sacred:0.30,domain:'social'},
  '石':    {freq:0.72,sacred:0.10,domain:'nature'},
  '家':    {freq:0.90,sacred:0.20,domain:'social'},
  '食べる':{freq:0.95,sacred:0.10,domain:'body'},
  '歩く':  {freq:0.90,sacred:0.05,domain:'body'},
  '話す':  {freq:0.88,sacred:0.25,domain:'social'},
  '与える':{freq:0.75,sacred:0.40,domain:'social'},
  '一':    {freq:0.98,sacred:0.15,domain:'number'}, // 数詞は最も保守的
  '良い':  {freq:0.85,sacred:0.20,domain:'social'},
  '新しい':{freq:0.70,sacred:0.05,domain:'social'},
};

// ── 集落定義 ────────────────────────────────────────────
const VDEFS = [
  { id:'arka',  name:'アルカ',  px:320,py:232, desc:'中央交易都市',
    prestige:2.2, iso:false, pop:8000,
    social:{elite:0.12,religious:0.85,literacy:0.40},
    params:{vo:0.32,fd:0.18,vs:0.24,dv:0.14,pal:0.12},
    trait:'交易と宗教の中心。高識字率と宗教権威が典礼語を保守化する' },
  { id:'nubo',  name:'ヌボ',   px:218,py:74,  desc:'北の山岳集落',
    prestige:0.9, iso:false, pop:1200,
    social:{elite:0.05,religious:0.60,literacy:0.08},
    params:{vo:0.04,fd:0.10,vs:0.14,dv:0.72,pal:0.00},
    trait:'低識字・低宗教権威。口語変化が最も速く進む' },
  { id:'foren', name:'フォレン',px:80,py:100,  desc:'北西の高地集落',
    prestige:0.8, iso:false, pop:900,
    social:{elite:0.04,religious:0.45,literacy:0.06},
    params:{vo:0.14,fd:0.28,vs:0.20,dv:0.28,pal:0.10},
    trait:'遷移地帯。方言的中間形が生まれやすい' },
  { id:'serva', name:'セルヴァ',px:78,py:218,  desc:'西の深森集落',
    prestige:1.0, iso:false, pop:2200,
    social:{elite:0.07,religious:0.50,literacy:0.12},
    params:{vo:0.62,fd:0.14,vs:0.12,dv:0.04,pal:0.08},
    trait:'有声化が顕著。アルカとの交易で借用語が蓄積' },
  { id:'vera',  name:'ヴェラ', px:130,py:348,  desc:'南西の湿地帯',
    prestige:0.7, iso:false, pop:1100,
    social:{elite:0.04,religious:0.35,literacy:0.05},
    params:{vo:0.28,fd:0.46,vs:0.16,dv:0.04,pal:0.06},
    trait:'語末脱落が進み短縮形が口語に定着' },
  { id:'marina',name:'マリナ', px:270,py:398,  desc:'南の海岸集落',
    prestige:1.1, iso:false, pop:3500,
    social:{elite:0.09,religious:0.40,literacy:0.18},
    params:{vo:0.20,fd:0.68,vs:0.08,dv:0.02,pal:0.02},
    trait:'海上交易で外来語が多い。語末侵食型の極端な口語' },
  { id:'terra', name:'テラ',   px:450,py:330,  desc:'東南の大平原',
    prestige:1.2, iso:false, pop:5000,
    social:{elite:0.10,religious:0.55,literacy:0.22},
    params:{vo:0.24,fd:0.16,vs:0.38,dv:0.14,pal:0.08},
    trait:'農業地帯。書記言語が発達し話し言葉との乖離が進む' },
  { id:'kairo', name:'カイロ', px:598,py:266,  desc:'東の孤立した島嶼',
    prestige:0.5, iso:true,  pop:600,
    social:{elite:0.03,religious:0.30,literacy:0.04},
    params:{vo:0.08,fd:0.58,vs:0.22,dv:0.08,pal:0.04},
    trait:'完全孤立。クレオール化の条件に近い急速な変化' },
  { id:'petra', name:'ペトラ', px:524,py:130,  desc:'東北の孤立した岩峰',
    prestige:0.6, iso:true,  pop:500,
    social:{elite:0.03,religious:0.25,literacy:0.03},
    params:{vo:0.12,fd:0.52,vs:0.42,dv:0.18,pal:0.04},
    trait:'最速の変化。孤立により系統分岐が最も進む' },
  { id:'sara',  name:'サラ',   px:420,py:110,  desc:'北東の農耕集落',
    prestige:0.9, iso:false, pop:2800,
    social:{elite:0.08,religious:0.65,literacy:0.20},
    params:{vo:0.18,fd:0.14,vs:0.48,dv:0.12,pal:0.08},
    trait:'宗教的権威とアルカの影響で書記形が発達' },
];

const CONNS = [
  ['arka','nubo'],['arka','serva'],['arka','marina'],
  ['arka','terra'],['arka','sara'],
  ['serva','foren'],['serva','vera'],
  ['nubo','foren'],['nubo','sara'],
  ['marina','vera'],['marina','terra'],
  ['terra','kairo'],['sara','petra'],
];

// ═══════════════════════════════════════════════════════════
// [1] 音素素性行列 — 調音特徴ベクトル
// ═══════════════════════════════════════════════════════════
// 母音: [高さ0-2, 前後0-2, 円唇0-1]
// 子音: [調音点0-3, 調音法0-4, 有声0-1, 鼻音0-1]
const PHF = {
  a:[0,1,0], e:[1,0,0], i:[2,0,0], o:[1,2,1], u:[2,2,1],
  p:[0,0,0,0], b:[0,0,1,0], t:[1,0,0,0], d:[1,0,1,0],
  k:[2,0,0,0], g:[2,0,1,0], m:[0,1,1,1], n:[1,1,1,1],
  r:[1,2,1,0], l:[1,3,1,0], s:[1,4,0,0], v:[0,4,1,0],
};
const VOWELS = new Set('aeiou');
const VOWEL_SHIFT = { a:'e', e:'i', i:'u', o:'a', u:'o' };

function phonDist(a, b) {
  if (a === b) return 0;
  const fa = PHF[a], fb = PHF[b];
  if (!fa || !fb) return 1;
  const av = VOWELS.has(a), bv = VOWELS.has(b);
  if (av !== bv) return 1;
  let d = 0;
  for (let i = 0; i < fa.length; i++) d += Math.abs(fa[i] - fb[i]);
  return Math.min(d / (av ? 5 : 8), 1);
}

function wEditDist(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({length:m+1}, (_,i) =>
    Array.from({length:n+1}, (_,j) => i===0 ? j*0.8 : j===0 ? i*0.8 : 0)
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(
        dp[i-1][j] + 0.8,
        dp[i][j-1] + 0.8,
        dp[i-1][j-1] + phonDist(a[i-1], b[j-1])
      );
  return dp[m][n];
}

function lexSim(v1, v2) {
  // 書記形ではなく口語形で比較
  let tot = 0;
  for (const c of CONCEPTS) {
    const a = v1.spoken[c] || v1.vocab[c];
    const b = v2.spoken[c] || v2.vocab[c];
    const maxL = Math.max(a.length, b.length) * 0.8;
    tot += Math.max(0, 1 - wEditDist(a, b) / maxL);
  }
  return tot / CONCEPTS.length;
}

// ═══════════════════════════════════════════════════════════
// [1] 環境条件付き音変化規則
// 各規則は環境 (env) を持ち、語内の特定位置でのみ発火する
// ═══════════════════════════════════════════════════════════
function buildRules(p) {
  return [
    {
      name: '有声化', type: 'phonological', prob: p.vo * 0.007,
      // 環境: 母音間のみ (intervocalic voicing — Lenition)
      fn: w => w
        .replace(/([aeiou])p([aeiou])/g, '$1b$2')
        .replace(/([aeiou])t([aeiou])/g, '$1d$2')
        .replace(/([aeiou])k([aeiou])/g, '$1g$2'),
      // 語頭・語末は対象外（条件付き）
      condition: (w, c) => w.length >= 4,
    },
    {
      name: '語末脱落', type: 'phonological', prob: p.fd * 0.005,
      // 環境: 語末音節のみ。短い語 (≤3) は保護
      fn: w => {
        if (w.length <= 3) return w;
        const last = w[w.length-1], prev = w[w.length-2];
        // 語末が有声閉鎖音 → まず無声化してから脱落
        if ('bdg'.includes(last)) return w.slice(0,-1) + 'ptk'['bdg'.indexOf(last)];
        if (!VOWELS.has(last)) return w.slice(0,-1);
        if (w.length > 4 && !VOWELS.has(prev)) return w.slice(0,-1);
        return w;
      },
      condition: (w, c) => true,
    },
    {
      name: '母音推移', type: 'chain_shift', prob: p.vs * 0.006,
      // 連鎖: 変化した母音が次の母音推移の「素地」を作る
      fn: (w, chainState) => {
        const present = [...new Set([...w].filter(c => VOWELS.has(c)))];
        if (!present.length) return w;
        // chainState があれば前回変化した母音を優先
        const target = chainState?.lastVowel && present.includes(chainState.lastVowel)
          ? chainState.lastVowel
          : present[Math.floor(Math.random() * present.length)];
        const shifted = VOWEL_SHIFT[target] || target;
        if (chainState) chainState.lastVowel = shifted; // 連鎖の継続
        return w.replace(new RegExp(target, 'g'), shifted);
      },
      condition: (w, c) => true,
    },
    {
      name: '無声化', type: 'phonological', prob: p.dv * 0.007,
      // 環境: 語末・語頭で発火しやすい (Final devoicing — ドイツ語型)
      fn: w => w.replace(/b/g,'p').replace(/d/g,'t').replace(/g/g,'k'),
      condition: (w, c) => true,
    },
    {
      name: '口蓋化', type: 'phonological', prob: p.pal * 0.005,
      // 環境: 前舌母音 (e, i) の前後でのみ発火
      fn: w => w
        .replace(/([ei])r([ei])/g, '$1s$2')
        .replace(/([ei])r([aou])/g, '$1s$2')
        .replace(/nk/g, 'ng')
        .replace(/mp/g, 'mb'),
      condition: (w, c) => /[ei]r|nk|mp/.test(w),
    },
    {
      name: '語頭弱化', type: 'phonological', prob: p.fd * 0.003,
      // 環境: 語頭の無強勢音節 (Apheresis)
      fn: w => {
        if (w.length <= 4) return w;
        // 語頭が短母音+子音 の場合に脱落
        if (VOWELS.has(w[0]) && !VOWELS.has(w[1]) && VOWELS.has(w[2]))
          return w.slice(1);
        return w;
      },
      condition: (w, c) => w.length > 4,
    },
  ];
}

// ═══════════════════════════════════════════════════════════
// [2] 語彙頻度・神聖度による変化抵抗
// ═══════════════════════════════════════════════════════════
function changeResistance(concept, village) {
  const meta = LEXICON_META[concept] || {freq:0.7, sacred:0.2, domain:'social'};
  // 頻度抵抗: 使用頻度が高いほど変化しにくい (Hooper 1976)
  const freqR = meta.freq * 0.6;
  // 神聖度抵抗: 典礼語は凍結される (宗教権威 × 神聖度)
  const sacredR = meta.sacred * village.social.religious * 0.8;
  // 識字率抵抗: 書記形が存在すると口語も保守化
  const litR = village.social.literacy * 0.3;
  return Math.min(freqR + sacredR + litR, 0.97);
}

// ═══════════════════════════════════════════════════════════
// [5] ダイグロシア — H形(威信/書記) と L形(口語) の分岐
// Ferguson (1959) モデル
// ═══════════════════════════════════════════════════════════
function applyDiglossia(village) {
  // 識字率 × 宗教権威 が一定を超えると H形と L形が乖離
  const diglossiaStrength = village.social.literacy * 0.5 + village.social.religious * 0.3;
  if (diglossiaStrength < 0.18) return; // 閾値以下は分岐しない

  for (const c of CONCEPTS) {
    const spoken = village.spoken[c];
    const written = village.vocab[c]; // 書記形 = 変化前の形を保持
    if (spoken === written) continue;

    // L形は口語変化が進んでいる; H形は書記形を保守
    // 差が大きくなるほど「乖離」としてログに残す
    const dist = wEditDist(spoken, written) / Math.max(spoken.length, written.length);
    if (dist > 0.25 && !village._diglossiaLog?.[c]) {
      village._diglossiaLog = village._diglossiaLog || {};
      village._diglossiaLog[c] = state.year;
      elog.unshift({ yr: state.year, type: 'dig',
        html: `<span class="dg">${village.name}</span> 「${c}」が書記形<i>${written}</i>と口語形<i>${spoken}</i>に乖離（ダイグロシア）` });
    }
  }
}

// ═══════════════════════════════════════════════════════════
// [8] 典礼語の凍結 — 宗教的権威がある集落では神聖語彙が固定
// ═══════════════════════════════════════════════════════════
function applyRitualFreeze(village) {
  if (village.social.religious < 0.55) return;
  for (const c of CONCEPTS) {
    const meta = LEXICON_META[c];
    if (!meta || meta.sacred < 0.5) continue;
    // 高神聖度語は書記形（祖語に近い形）に引き戻す圧力
    const prob = meta.sacred * village.social.religious * 0.004;
    if (Math.random() < prob) {
      const frozen = village.vocab[c]; // 書記形を保持
      // 口語形が書記形から離れすぎた場合、宗教的圧力で戻す
      if (village.spoken[c] !== frozen) {
        const dist = wEditDist(village.spoken[c], frozen);
        if (dist > 1.5) {
          village.spoken[c] = frozen; // 口語を書記形に引き戻し
          elog.unshift({ yr: state.year, type: 'rit',
            html: `<span class="rt">${village.name}</span> 「${c}」が典礼権威により古形<i>${frozen}</i>に保守化` });
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════
// [9] 書記言語の乖離 — 書き言葉が話し言葉から独立して変化
// ═══════════════════════════════════════════════════════════
function applyWrittenDrift(village) {
  if (village.social.literacy < 0.15) return;
  // 識字率が高い集落では書記形が独自ルールで変化する
  // （スペルが発音に影響しなくなる — 英語の "knight" 効果）
  for (const c of CONCEPTS) {
    if (Math.random() < village.social.literacy * 0.001) {
      const w = village.vocab[c]; // 書記形
      // 書記的変化: 語源的綴り回帰 or 外来語的スペル
      const drifted = w.replace(/([aeiou])\1/g, '$1') // 二重母音統合
                       .replace(/([aeiou])([aeiou])/g, '$1'); // 母音連続簡略化
      if (drifted !== w && drifted.length >= 3) {
        village.vocab[c] = drifted;
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════
// [3] 言語接触の抵抗段階モデル (Thomason & Kaufman 1988)
// 接触強度 0-1 に応じて借用の深さが決まる
// 0.0-0.3: 語彙のみ借用
// 0.3-0.6: 語彙 + 音韻適応
// 0.6-0.8: 形態素境界の変化
// 0.8+   : クレオール的混合
// ═══════════════════════════════════════════════════════════
function contactIntensity(va, vb) {
  // 人口規模、威信差、孤立度から接触強度を算出
  const popFactor = Math.min(va.pop, vb.pop) / Math.max(va.pop, vb.pop);
  const prestigeDiff = Math.abs(va.prestige - vb.prestige) / 4;
  const isoFactor = (va.iso || va._tmpIso || vb.iso || vb._tmpIso) ? 0.1 : 1.0;
  return popFactor * (1 - prestigeDiff * 0.5) * isoFactor;
}

function adaptBorrow(word, donor, recipient, intensity) {
  if (intensity < 0.3) {
    // 低強度: 語彙借用のみ、音韻適応なし
    return word;
  } else if (intensity < 0.6) {
    // 中強度: 支配的音変化規則で適応
    const rules = buildRules(recipient.params);
    const dominant = rules.reduce((a,b) => a.prob > b.prob ? a : b);
    if (Math.random() > 0.4) {
      const adapted = dominant.fn(word, {});
      return adapted.length >= 3 ? adapted : word;
    }
    return word;
  } else {
    // 高強度: 受容側の音韻体系に完全適応 + 形態素変化
    const rules = buildRules(recipient.params);
    let adapted = word;
    for (const rule of rules) {
      if (Math.random() < rule.prob * 3) adapted = rule.fn(adapted, {});
    }
    // 高強度接触: 語末を受容側の典型的語末に合わせる
    const endings = ['u', 'a', 'i', 'o', 'el', 'an'];
    if (VOWELS.has(adapted[adapted.length-1]) && Math.random() < 0.3) {
      const typical = endings[Math.floor(Math.random() * endings.length)];
      adapted = adapted.slice(0,-1) + typical;
    }
    return adapted.length >= 3 ? adapted : word;
  }
}

// ═══════════════════════════════════════════════════════════
// [7] クレオール化検出
// 2集落の接触強度が高く、類似度が中程度の場合に混合語が発生
// ═══════════════════════════════════════════════════════════
function checkCreolization(va, vb) {
  const intensity = contactIntensity(va, vb);
  const similarity = cachedSim(va.id, vb.id);
  // クレオール化条件: 高接触 × 中程度の語彙差 (0.3-0.7)
  if (intensity > 0.75 && similarity > 0.30 && similarity < 0.70) {
    if (Math.random() < 0.0003) {
      // 新語を混合して生成
      for (const c of CONCEPTS.slice(0, 10)) {
        const wa = va.spoken[c], wb = vb.spoken[c];
        if (wa !== wb && Math.random() < 0.3) {
          // 混合: 前半をa側、後半をb側から取る
          const mid = Math.floor(wa.length / 2);
          const mixed = wa.slice(0, mid) + wb.slice(mid);
          if (mixed.length >= 3) {
            va.spoken[c] = mixed;
            elog.unshift({ yr: state.year, type: 'cre',
              html: `<span class="cr">${va.name}×${vb.name}</span> 「${c}」にクレオール的混合形 <i>${mixed}</i> が発生` });
          }
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════
// [10] 人口動態
// ═══════════════════════════════════════════════════════════
function evolvePop(village) {
  if (village._conquered) return; // 征服済みは独自成長しない
  const r = 0.003 + Math.random() * 0.004 - 0.002; // 年率-0.2%〜+0.5%
  village.pop = Math.max(100, Math.round(village.pop * (1 + r)));
  // 人口が大きいほど変化が遅くなる (集団の慣性)
  // → 各規則の prob に popDampen を掛ける (evolveVillage内で参照)
}

function popDampen(village) {
  // 人口1000が基準。大きいほど変化抵抗↑
  return Math.max(0.25, 1 - Math.log10(village.pop / 1000) * 0.35);
}

// ═══════════════════════════════════════════════════════════
// 社会的事象 (拡張版)
// ═══════════════════════════════════════════════════════════
const SOC_EVENTS = [
  { name:'交易路開通', prob:0.0016,
    msg: v => `${v.name}に新たな交易路が開通。威信上昇`,
    eff: v => { v._pBoost = true; v._pEnd = state.year + 300; } },
  { name:'疫病・孤立化', prob:0.0009,
    msg: v => `${v.name}で疫病が流行。一時的孤立化`,
    eff: v => { if (!v.iso) { v._tmpIso = true; v._isoEnd = state.year + 200; } } },
  { name:'権威集落化', prob:0.0012,
    msg: v => `${v.name}の文化的威信が高まる`,
    eff: v => { v._pBoost = true; v._pEnd = state.year + 250; } },
  { name:'大移住', prob:0.0007,
    msg: v => `${v.name}近辺で大規模な人口移動が発生`,
    eff: v => { v.pop = Math.round(v.pop * (0.6 + Math.random() * 0.8)); } },
  // [6] 戦争・征服による言語置換
  { name:'征服・言語置換', prob:0.0004,
    msg: v => `${v.name}が近隣強国に征服。支配層語彙が流入`,
    eff: v => {
      if (v.prestige < 1.5) {
        v._conquered = true; v._conqueredEnd = state.year + 500;
        // 征服された集落: 威信語彙を支配集落から強制的に借用
        const dominant = villages.reduce((a,b) => b.prestige > a.prestige ? b : a);
        for (const c of CONCEPTS) {
          if (LEXICON_META[c]?.domain === 'social' && Math.random() < 0.7) {
            v.spoken[c] = dominant.spoken[c];
            v.vocab[c] = dominant.vocab[c];
          }
        }
      }
    }},
  // 宗教的権威の台頭
  { name:'宗教改革', prob:0.0006,
    msg: v => `${v.name}で宗教的権威が強まる。典礼語が保護される`,
    eff: v => { v.social.religious = Math.min(v.social.religious + 0.2, 1.0); } },
  // 識字率向上
  { name:'学校設立', prob:0.0005,
    msg: v => `${v.name}に学校が設立。識字率が上昇`,
    eff: v => { v.social.literacy = Math.min(v.social.literacy + 0.1, 0.9); } },
];

// ═══════════════════════════════════════════════════════════
// 状態管理
// ═══════════════════════════════════════════════════════════
let villages = [];
let elog = [];
let simCache = {};
let driftHistory = [];
const state = {
  year: 0, running: false, ypt: 10, tms: 420,
  timer: null, sel: null, tab: 'vocab',
  chainState: {}, // 母音推移の連鎖状態
};

function gv(id) { return villages.find(v => v.id === id); }

function initV() {
  villages = VDEFS.map(d => ({
    ...d,
    vocab:  { ...PROTO }, // 書記形 (H形)
    spoken: { ...PROTO }, // 口語形 (L形) — 最初は同じ
    lc: {}, ct: {},
    _tmpIso: false, _isoEnd: 0,
    _pBoost: false, _pEnd: 0,
    _conquered: false, _conqueredEnd: 0,
    _diglossiaLog: {},
  }));
  elog = [];
  simCache = {};
  driftHistory = [];
  state.chainState = {};
}

function cachedSim(id1, id2) {
  const key = id1 < id2 ? `${id1}|${id2}` : `${id2}|${id1}`;
  if (!(key in simCache)) simCache[key] = lexSim(gv(id1), gv(id2));
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

    // ── [1][2] 体系的音変化（口語形のみ変化、書記形は別）──
    for (const v of villages) {
      const isIso = v.iso || v._tmpIso;
      const mult  = isIso ? 1.75 : 1.0;
      const damp  = popDampen(v); // [10] 人口慣性
      const rules = buildRules(v.params);
      if (!state.chainState[v.id]) state.chainState[v.id] = {};
      const cs = state.chainState[v.id];

      for (const rule of rules) {
        const effectiveProb = rule.prob * mult * damp;
        if (Math.random() < effectiveProb) {
          const changes = [];
          for (const c of CONCEPTS) {
            // [2] 変化抵抗チェック
            const resist = changeResistance(c, v);
            if (Math.random() < resist) continue;
            // [1] 環境条件チェック
            const w = v.spoken[c];
            if (rule.condition && !rule.condition(w, c)) continue;
            const nw = rule.fn(w, rule.type === 'chain_shift' ? cs : {});
            if (nw !== w && nw.length >= 3) {
              v.spoken[c] = nw;
              v.lc[c] = yr; v.ct[c] = 'p';
              changes.push({ c, old: w, to: nw });
            }
          }
          if (changes.length > 0) {
            const preview = changes.slice(0,3).map(x=>`${x.c}:${x.old}→${x.to}`).join(' / ');
            const extra = changes.length > 3 ? ` 他${changes.length-3}語` : '';
            elog.unshift({ yr, type:'sys',
              html:`<span class="vn">${v.name}</span> <em>${rule.name}</em> (${changes.length}語) — ${preview}${extra}` });
          }
        }
      }

      // [5] ダイグロシア処理（書記形と口語形の乖離検出）
      applyDiglossia(v);
      // [8] 典礼語凍結
      applyRitualFreeze(v);
      // [9] 書記言語の独立変化
      applyWrittenDrift(v);
      // [10] 人口動態
      if (yr % 10 === 0) evolvePop(v);
      // 征服期限
      if (v._conquered && yr >= v._conqueredEnd) v._conquered = false;
    }

    // ── [3] 借用（言語接触段階モデル）──
    for (const [aid, bid] of CONNS) {
      const va = gv(aid), vb = gv(bid);
      // [7] クレオール化チェック
      if (yr % 50 === 0) checkCreolization(va, vb);

      for (const c of CONCEPTS) {
        if (Math.random() < BORROW_BASE) {
          const ap = va.prestige * (va._pBoost ? 1.6 : 1.0);
          const bp = vb.prestige * (vb._pBoost ? 1.6 : 1.0);
          const [don, rec] = Math.random() < ap/(ap+bp) ? [va,vb] : [vb,va];
          const donForm = don.spoken[c];
          if (donForm !== rec.spoken[c]) {
            const old = rec.spoken[c];
            const intensity = contactIntensity(don, rec);
            // [3] 接触強度に応じた借用深度
            const adapted = adaptBorrow(donForm, don, rec, intensity);
            if (adapted !== old && adapted.length >= 3) {
              // ドメイン抵抗: 身体語・数詞は借用しにくい
              const meta = LEXICON_META[c];
              const domainR = meta?.domain === 'body' ? 0.35
                            : meta?.domain === 'number' ? 0.15 : 0.85;
              if (Math.random() > domainR) continue;
              rec.spoken[c] = adapted;
              rec.lc[c] = yr; rec.ct[c] = 'b';
              elog.unshift({ yr, type:'brw',
                html:`<span class="bn">${rec.name}</span>←<span class="vn">${don.name}</span> 「${c}」: ${old}→<b>${adapted}</b> (接触強度${(intensity*100).toFixed(0)}%)` });
            }
          }
        }
      }
    }

    // ── 社会的事象 (10年ごと) ──
    if (yr % 10 === 0) {
      for (const ev of SOC_EVENTS) {
        for (const v of villages) {
          if (Math.random() < ev.prob) {
            ev.eff(v);
            const msg = ev.msg(v);
            elog.unshift({ yr, type:'evt', html:`<span class="ev">◆ ${msg}</span>` });
            showTicker(msg);
          }
        }
      }
      for (const v of villages) {
        if (v._tmpIso && state.year >= v._isoEnd) v._tmpIso = false;
        if (v._pBoost && state.year >= v._pEnd)   v._pBoost = false;
      }
    }

    // 乖離率履歴 (50年ごと)
    if (yr % 50 === 0) {
      const snap = {};
      for (const v of villages)
        snap[v.id] = CONCEPTS.filter(c => v.spoken[c] !== PROTO[c]).length / CONCEPTS.length;
      driftHistory.push({ year: yr, snap });
      if (driftHistory.length > 100) driftHistory.shift();
    }

    if (elog.length > 400) elog.length = 400;
  }
}

function tick() { evolve(state.ypt); render(); }

// ── イベントティッカー ──
let tickTimer = null;
function showTicker(msg) {
  const el = document.getElementById('evtick');
  el.textContent = '◆ ' + msg;
  el.classList.add('show');
  clearTimeout(tickTimer);
  tickTimer = setTimeout(() => el.classList.remove('show'), 4500);
}

// ── トースト ──
let _toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
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
  <g opacity="0.38" stroke="none">
    <polygon points="170,88 196,50 222,88" fill="#6a5838"/>
    <polygon points="196,87 222,48 248,87" fill="#6a5838"/>
    <polygon points="150,87 170,60 190,87" fill="#8a7858" opacity="0.55"/>
    <polygon points="178,52 186,66 170,66" fill="#e8e2d8" opacity="0.6"/>
  </g>
  <g opacity="0.30" fill="#4a6830">
    <circle cx="28" cy="226" r="20"/><circle cx="52" cy="214" r="17"/>
    <circle cx="36" cy="202" r="15"/><circle cx="20" cy="210" r="14"/>
  </g>
  <path d="M130,470 Q220,428 305,445 Q395,462 475,448 Q555,434 640,450 L690,450 L690,500 L130,500 Z"
        fill="#7aa4b8" opacity="0.24"/>
  <ellipse cx="598" cy="272" rx="55" ry="40" fill="#7aa4b8" opacity="0.2"/>
  <ellipse cx="598" cy="266" rx="28" ry="24" fill="#ede0c0" opacity="0.95"/>
  <g opacity="0.30" fill="#8a7a60">
    <circle cx="568" cy="118" r="8"/><circle cx="582" cy="133" r="7"/>
    <circle cx="558" cy="140" r="9"/>
  </g>
  <path d="M248,84 Q288,144 314,232 Q288,328 272,398" fill="none" stroke="#7aa4b8" stroke-width="2.2" opacity="0.26"/>
  <path d="M424,120 Q402,178 444,244 Q462,298 450,330" fill="none" stroke="#7aa4b8" stroke-width="1.6" opacity="0.2"/>
  <g transform="translate(654,34)" opacity="0.52">
    <polygon points="0,-17 3,-5 0,-8 -3,-5" fill="#4a3820"/>
    <polygon points="0,17 3,5 0,8 -3,5" fill="#4a3820" opacity="0.38"/>
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
    const sel  = state.sel === v.id;
    const isIso = v.iso || v._tmpIso;
    // 乖離率は口語形で計算
    const drift = CONCEPTS.filter(c => v.spoken[c] !== PROTO[c]).length / CONCEPTS.length;
    // ダイグロシア検出: 書記形と口語形の乖離が大きい集落を特別表示
    const diglossed = CONCEPTS.some(c => v.spoken[c] !== v.vocab[c] &&
      wEditDist(v.spoken[c], v.vocab[c]) > 1.2);
    // 人口を半径に反映（小さい集落は小さく見える）
    const popR = Math.max(5, Math.min(13, 5 + Math.log10(v.pop / 100) * 2));
    const r  = sel ? popR + 3 : popR;
    const fc = v._conquered ? '#5a3080'
              : drift > 0.7 ? '#a03020'
              : drift > 0.4 ? '#7a5a18' : '#362814';
    const sc = sel ? '#e8c040' : isIso ? '#a04020' : diglossed ? '#5d98cc' : '#a09060';
    const sw = sel ? 2.5 : 1.5;
    const tc = sel ? '#7a2010' : '#2e2008';

    const recentChange = Object.values(v.lc).some(yr => state.year - yr < 120);
    if (recentChange) {
      h += `<circle cx="${v.px}" cy="${v.py}" r="${r+6}"
              fill="none" stroke="${v.ct && Object.values(v.ct).includes('b') ? '#3a6ea0' : '#c0332a'}"
              stroke-width="0.8" stroke-dasharray="2,3" opacity="0.45"/>`;
    }
    // 人口規模リング
    h += `<circle cx="${v.px}" cy="${v.py}" r="${r+10}" fill="rgba(201,162,39,${Math.min(0.06, v.pop/200000)})" stroke="none"/>`;

    h += `
    <g style="cursor:pointer" onclick="selectV('${v.id}')">
      <circle cx="${v.px}" cy="${v.py}" r="25" fill="transparent"/>
      <circle cx="${v.px}" cy="${v.py}" r="${r+3}" fill="${fc}" opacity="0.16"/>
      <circle cx="${v.px}" cy="${v.py}" r="${r}" fill="${fc}" stroke="${sc}"
              stroke-width="${sw}" filter="url(#sh)"/>
      ${sel ? `<circle cx="${v.px}" cy="${v.py}" r="${r+6}"
                fill="none" stroke="#e8c040" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.65"/>` : ''}
      <text x="${v.px}" y="${v.py+r+14}" text-anchor="middle"
            font-size="11" font-family="'Palatino Linotype',Georgia,serif"
            fill="${tc}" font-weight="${sel?'bold':'normal'}">${v.name}</text>
      ${isIso ? `<text x="${v.px+r+2}" y="${v.py-r}" font-size="8" fill="#8c2808" opacity="0.72">孤</text>` : ''}
      ${v._pBoost ? `<text x="${v.px+r+2}" y="${v.py-r}" font-size="9" fill="#c9a227" opacity="0.85">★</text>` : ''}
      ${v._conquered ? `<text x="${v.px-r-2}" y="${v.py-r}" font-size="9" fill="#9060c0" opacity="0.85">⚔</text>` : ''}
      ${diglossed ? `<text x="${v.px-r-2}" y="${v.py+r}" font-size="8" fill="#5d98cc" opacity="0.80">二</text>` : ''}
    </g>`;
  }

  h += `
  <g transform="translate(10,${500-100})" font-family="'Palatino Linotype',serif">
    <rect x="-5" y="-14" width="155" height="98" fill="#f0e8d0" opacity="0.75" rx="2"/>
    <text font-size="9" fill="#5c4228" y="0" font-weight="bold">相互通話可能度</text>
    <line x1="0" y1="15" x2="28" y2="15" stroke="#4a8050" stroke-width="2.5" stroke-dasharray="4,3"/>
    <text font-size="8" fill="#5c4228" x="32" y="18">高 (70%+)</text>
    <line x1="0" y1="31" x2="28" y2="31" stroke="#8a7030" stroke-width="1.8" stroke-dasharray="4,3"/>
    <text font-size="8" fill="#5c4228" x="32" y="34">中 (45–70%)</text>
    <line x1="0" y1="47" x2="28" y2="47" stroke="#9a3020" stroke-width="1" stroke-dasharray="4,3"/>
    <text font-size="8" fill="#5c4228" x="32" y="50">低 (45%未満)</text>
    <circle cx="5" cy="62" r="4.5" fill="#a03020"/>
    <text font-size="8" fill="#5c4228" x="14" y="65">孤立・大変化</text>
    <text font-size="8" fill="#5d98cc" x="0" y="80">二 =ダイグロシア　⚔=征服</text>
  </g>`;

  svg.innerHTML = h;
}

// ═══════════════════════════════════════════════════════════
// 語彙表 — 書記形と口語形を併記
// ═══════════════════════════════════════════════════════════
const HOT_WIN = 200;

function renderTable() {
  document.getElementById('vthead').innerHTML =
    `<tr><th class="cc">概念 / 祖語</th>` +
    villages.map(v => `<th title="${v.desc}">${v.name}</th>`).join('') + `</tr>`;

  document.getElementById('vtbody').innerHTML = CONCEPTS.map(c => {
    const cells = villages.map(v => {
      const ws = v.spoken[c]; // 口語形
      const ww = v.vocab[c];  // 書記形
      const hot = v.lc[c] && (state.year - v.lc[c] < HOT_WIN);
      const isBorrow = v.ct[c] === 'b' && hot;
      const isDiglossed = ws !== ww;
      let cls = '';
      if (isBorrow) cls = 'hot-borrow';
      else if (hot) cls = 'hot';
      else if (ws !== PROTO[c]) cls = 'drifted';
      const display = isDiglossed
        ? `${ws}<span class="written-form">${ww}</span>`
        : ws;
      return `<td class="${cls}" title="${v.name}\n口語: ${ws}\n書記: ${ww}\n祖語: ${PROTO[c]}">${display}</td>`;
    }).join('');
    return `<tr><td class="cc" title="祖語形: ${PROTO[c]}">${c} <small style="color:var(--text3);font-family:Courier Prime,monospace;font-size:9px">${PROTO[c]}</small></td>${cells}</tr>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════
// 変化ログ
// ═══════════════════════════════════════════════════════════
function renderLog() {
  document.getElementById('loglist').innerHTML =
    elog.slice(0, 150).map(e =>
      `<div class="logitem ${e.type}"><span class="yr">${e.yr}年</span>${e.html}</div>`
    ).join('');
}

// ═══════════════════════════════════════════════════════════
// 統計タブ — 人口・社会指標も表示
// ═══════════════════════════════════════════════════════════
function renderStats() {
  const sorted = [...villages].sort((a,b) => {
    const da = CONCEPTS.filter(c=>a.spoken[c]!==PROTO[c]).length;
    const db = CONCEPTS.filter(c=>b.spoken[c]!==PROTO[c]).length;
    return db - da;
  });

  const driftRows = sorted.map(v => {
    const n = CONCEPTS.filter(c => v.spoken[c] !== PROTO[c]).length;
    const pct = n / CONCEPTS.length;
    const col = pct > 0.7 ? '#c0332a' : pct > 0.45 ? '#b08020' : '#3a7048';
    const popStr = v.pop >= 1000 ? (v.pop/1000).toFixed(1)+'k' : v.pop;
    const diglossCount = CONCEPTS.filter(c => v.spoken[c] !== v.vocab[c]).length;
    return `<div class="drift-row">
      <div class="drift-name">${v.name}</div>
      <div class="drift-track"><div class="drift-fill" style="width:${(pct*100).toFixed(0)}%;background:${col}"></div></div>
      <div class="drift-val">${n}/${CONCEPTS.length}</div>
      <div style="font-size:8.5px;color:var(--text3);width:32px;text-align:right">👥${popStr}</div>
      ${diglossCount > 0 ? `<div style="font-size:8.5px;color:var(--blue2);width:24px">二${diglossCount}</div>` : ''}
    </div>`;
  }).join('');

  // 社会指標テーブル
  const socialRows = villages.map(v => `
    <tr>
      <td style="font-size:9.5px;color:var(--text2);padding:2px 6px">${v.name}</td>
      <td><div style="width:${Math.round(v.social.religious*50)}px;height:4px;background:#c9a227;border-radius:2px;display:inline-block"></div></td>
      <td><div style="width:${Math.round(v.social.literacy*50)}px;height:4px;background:#5d98cc;border-radius:2px;display:inline-block"></div></td>
      <td style="font-size:8.5px;color:var(--text3);text-align:right;padding-right:4px">${(v.pop/1000).toFixed(1)}k</td>
    </tr>`).join('');

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
      <div class="st-title">口語乖離率 / 人口 / ダイグロシア（二）</div>${driftRows}
    </div>
    <div class="st-section">
      <div class="st-title">社会指標 — 金=宗教権威　青=識字率</div>
      <table style="border-collapse:collapse;width:100%">
        <tr><th style="font-size:8px;color:var(--text3);font-weight:normal;padding:2px 6px;text-align:left">集落</th>
            <th style="font-size:8px;color:var(--gold);font-weight:normal">宗教</th>
            <th style="font-size:8px;color:var(--blue2);font-weight:normal">識字</th>
            <th style="font-size:8px;color:var(--text3);font-weight:normal">人口</th></tr>
        ${socialRows}
      </table>
    </div>
    <div class="st-section">
      <div class="st-title">集落間 語彙類似度（口語形）— 緑=高類似 / 青=低類似</div>
      <div class="sim-matrix-wrap">
        <table class="sim-matrix">
          <thead><tr>${hdr}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════
// グラフタブ
// ═══════════════════════════════════════════════════════════
const V_COLORS = ['#e8c55a','#5d98cc','#e05540','#52a060','#c9a227','#8a8a9a','#a04020','#3a7048','#7aa4b8','#b08020'];

function renderChart() {
  renderLineChart();
  renderDendrogram();
}

function renderLineChart() {
  const canvas = document.getElementById('chart-line');
  if (!canvas) return;
  const W = canvas.clientWidth || 340, H = 140;
  canvas.width = W * devicePixelRatio; canvas.height = H * devicePixelRatio;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(devicePixelRatio, devicePixelRatio);
  ctx.fillStyle = '#0f1520'; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle = 'rgba(201,162,39,0.07)'; ctx.lineWidth = 0.5;
  [0,0.5,1].forEach(p => { const y = H-4-p*(H-20); ctx.beginPath(); ctx.moveTo(38,y); ctx.lineTo(W-4,y); ctx.stroke(); });
  ctx.fillStyle = 'rgba(106,94,74,0.85)'; ctx.font = '7px serif'; ctx.textAlign = 'right';
  ['100%','50%','0%'].forEach((l,i) => ctx.fillText(l, 34, H-4-[1,0.5,0][i]*(H-20)+3));
  if (driftHistory.length < 2) {
    ctx.fillStyle='rgba(106,94,74,0.5)'; ctx.textAlign='center'; ctx.font='10px serif';
    ctx.fillText('▶ を押すと記録が始まります（50年ごと）', W/2, H/2); return;
  }
  const dX = i => 40+(i/(driftHistory.length-1))*(W-48);
  const dY = p => H-4-p*(H-20);
  villages.forEach((v,vi) => {
    const col = V_COLORS[vi%V_COLORS.length];
    ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.lineJoin = 'round';
    ctx.beginPath();
    driftHistory.forEach((d,i) => { const x=dX(i),y=dY(d.snap[v.id]||0); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
    ctx.stroke();
    const last = driftHistory[driftHistory.length-1];
    ctx.fillStyle=col; ctx.font='7.5px Cinzel,serif'; ctx.textAlign='left';
    ctx.fillText(v.name, Math.min(dX(driftHistory.length-1)+3,W-32), Math.max(10,Math.min(H-4,dY(last.snap[v.id]||0)+3)));
  });
  ctx.fillStyle='rgba(106,94,74,0.7)'; ctx.font='7px serif'; ctx.textAlign='center';
  ctx.fillText(driftHistory[0].year+'年', dX(0), H-1);
  ctx.fillText(driftHistory[driftHistory.length-1].year+'年', dX(driftHistory.length-1), H-1);
}

function renderDendrogram() {
  const canvas = document.getElementById('chart-tree');
  if (!canvas) return;
  const W = canvas.clientWidth||340, H = 200;
  canvas.width=W*devicePixelRatio; canvas.height=H*devicePixelRatio;
  canvas.style.width=W+'px'; canvas.style.height=H+'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(devicePixelRatio, devicePixelRatio);
  ctx.fillStyle='#0d1222'; ctx.fillRect(0,0,W,H);
  const n = villages.length;
  if (n<2) return;
  const dist = Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?0:1-cachedSim(villages[i].id,villages[j].id)));
  let clusters = villages.map((_,i)=>({members:[i],height:0}));
  const merges=[];
  const avgD=(ca,cb)=>{let s=0;for(const i of ca.members)for(const j of cb.members)s+=dist[i][j];return s/(ca.members.length*cb.members.length);};
  while(clusters.length>1){
    let best=Infinity,bi=0,bj=1;
    for(let i=0;i<clusters.length;i++)for(let j=i+1;j<clusters.length;j++){const d=avgD(clusters[i],clusters[j]);if(d<best){best=d;bi=i;bj=j;}}
    const merged={members:[...clusters[bi].members,...clusters[bj].members],height:best,left:clusters[bi],right:clusters[bj]};
    merges.push({height:best,left:clusters[bi],right:clusters[bj]});
    clusters=clusters.filter((_,k)=>k!==bi&&k!==bj);
    clusters.push(merged);
  }
  const root=clusters[0], maxH=root.height||1;
  const ML=46,MR=10,MT=12,MB=18;
  const dW=W-ML-MR, dH=H-MT-MB;
  let leafIdx=0;
  const leafOrder=[];
  (function getLeaves(node){if(!node.left){leafOrder.push(node.members[0]);return;}getLeaves(node.left);getLeaves(node.right);})(root);
  function drawNode(node){
    if(!node.left){
      const vi=node.members[0], lIdx=leafOrder.indexOf(vi);
      const y=MT+(lIdx+0.5)*(dH/n);
      ctx.fillStyle=V_COLORS[vi%V_COLORS.length]; ctx.font='8px serif'; ctx.textAlign='right';
      ctx.fillText(villages[vi].name,ML-3,y+3);
      ctx.strokeStyle='rgba(201,162,39,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(ML,y); ctx.lineTo(ML+dW*(node.height/maxH)+1,y); ctx.stroke();
      return y;
    }
    const ly=drawNode(node.left), ry=drawNode(node.right);
    const x=ML+dW*(node.height/maxH);
    const lx=ML+dW*((node.left.height||0)/maxH);
    const rx=ML+dW*((node.right.height||0)/maxH);
    const col=`rgba(201,162,39,${0.25+(1-node.height/maxH)*0.5})`;
    ctx.strokeStyle=col; ctx.lineWidth=1.3;
    ctx.beginPath(); ctx.moveTo(x,ly); ctx.lineTo(x,ry); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(x,ly); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(rx,ry); ctx.lineTo(x,ry); ctx.stroke();
    return (ly+ry)/2;
  }
  try{ drawNode(root); }catch(e){}
  ctx.fillStyle='rgba(106,94,74,0.6)'; ctx.font='7px serif';
  ctx.textAlign='left'; ctx.fillText('← 近い',ML+2,H-3);
  ctx.textAlign='right'; ctx.fillText('遠い →',W-MR,H-3);
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
  const changedSpoken = CONCEPTS.filter(c => v.spoken[c] !== PROTO[c]).length;
  const changedWritten = CONCEPTS.filter(c => v.vocab[c] !== PROTO[c]).length;
  const diglossCount = CONCEPTS.filter(c => v.spoken[c] !== v.vocab[c]).length;
  document.getElementById('vi-name').textContent = `${v.name}　${v.desc}`;
  document.getElementById('vi-meta').innerHTML =
    `口語変化: ${changedSpoken}/${CONCEPTS.length}　書記変化: ${changedWritten}/${CONCEPTS.length}　` +
    (diglossCount > 0 ? `<span style="color:var(--blue2)">ダイグロシア:${diglossCount}語</span>　` : '') +
    `威信: ${(v.prestige*(v._pBoost?1.6:1)).toFixed(1)}　人口: ${(v.pop/1000).toFixed(1)}k` +
    (v._tmpIso ? '　<span style="color:var(--red2)">孤立中</span>' : '') +
    (v._conquered ? '　<span style="color:#9060c0">被征服中</span>' : '');
  const p = v.params;
  document.getElementById('vi-bars').innerHTML = [
    {l:'有声化',   val:p.vo,  c:'#5d98cc'},
    {l:'語末脱落', val:p.fd,  c:'#e05540'},
    {l:'母音推移', val:p.vs,  c:'#c9a227'},
    {l:'無声化',   val:p.dv,  c:'#8a8a9a'},
    {l:'口蓋化',   val:p.pal, c:'#52a060'},
    {l:'宗教権威', val:v.social.religious, c:'#c9a227'},
    {l:'識字率',   val:v.social.literacy,  c:'#5d98cc'},
  ].map(b =>
    `<div class="vi-bar-item">
      <div class="vi-bar-label">${b.l}</div>
      <div class="vi-bar-track"><div class="vi-bar-fill" style="width:${Math.round(b.val*100)}%;background:${b.c}"></div></div>
    </div>`
  ).join('');
  document.getElementById('vi-trait').textContent = v.trait;
  document.getElementById('vi-actions').innerHTML = `
    <button class="vi-btn vi-btn-grn" onclick="intervene('trade','${v.id}')">★ 交易開通</button>
    <button class="vi-btn vi-btn-red" onclick="intervene('isolate','${v.id}')">⚑ 疫病孤立</button>
    <button class="vi-btn vi-btn-blu" onclick="intervene('prestige','${v.id}')">▲ 威信強化</button>
    <button class="vi-btn vi-btn-grn" onclick="intervene('religion','${v.id}')">☩ 宗教権威↑</button>
    <button class="vi-btn vi-btn-blu" onclick="intervene('literacy','${v.id}')">✎ 識字率↑</button>
    <button class="vi-btn" onclick="intervene('reset','${v.id}')">↺ 語彙リセット</button>
  `;
}

// ── 介入コマンド ──
function intervene(type, vid) {
  const v = gv(vid);
  if (!v) return;
  const yr = state.year;
  let msg = '';
  switch (type) {
    case 'trade':
      v._pBoost = true; v._pEnd = yr + 400;
      msg = `${v.name}に交易路を開通（威信×1.6、400年）`;
      elog.unshift({yr,type:'int',html:`<span class="in">【介入】</span>${v.name}に交易路が開通`});
      break;
    case 'isolate':
      if (!v.iso) { v._tmpIso = true; v._isoEnd = yr + 350; }
      msg = `${v.name}を孤立化（変化速度×1.75、350年）`;
      elog.unshift({yr,type:'int',html:`<span class="in">【介入】</span>${v.name}を孤立・独自進化加速`});
      break;
    case 'prestige':
      v.prestige = Math.min(v.prestige * 1.9, 4.5);
      msg = `${v.name}の威信を強化（→${v.prestige.toFixed(1)}）`;
      elog.unshift({yr,type:'int',html:`<span class="in">【介入】</span>${v.name}の威信が急上昇→${v.prestige.toFixed(1)}`});
      break;
    case 'religion':
      v.social.religious = Math.min(v.social.religious + 0.18, 1.0);
      msg = `${v.name}の宗教権威を強化 → 典礼語保守化が加速`;
      elog.unshift({yr,type:'int',html:`<span class="in">【介入】</span>${v.name}の宗教権威上昇→典礼語凍結が強まる`});
      break;
    case 'literacy':
      v.social.literacy = Math.min(v.social.literacy + 0.12, 0.9);
      msg = `${v.name}の識字率を上昇 → ダイグロシア圧力が強まる`;
      elog.unshift({yr,type:'int',html:`<span class="in">【介入】</span>${v.name}の識字率上昇→書記言語乖離が加速`});
      break;
    case 'reset':
      v.spoken = {...PROTO}; v.vocab = {...PROTO}; v.lc = {}; v.ct = {};
      msg = `${v.name}の語彙を祖語形にリセット`;
      elog.unshift({yr,type:'int',html:`<span class="in">【介入】</span>${v.name}の語彙をリセット`});
      break;
  }
  showToast(msg);
  simCache = {};
  render();
}

// ═══════════════════════════════════════════════════════════
// レンダー統括
// ═══════════════════════════════════════════════════════════
function render() {
  document.getElementById('yr').textContent = state.year;
  buildMap();
  if (state.tab === 'vocab')      renderTable();
  else if (state.tab === 'log')   renderLog();
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
