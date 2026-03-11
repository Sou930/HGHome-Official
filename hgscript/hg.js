/* ════════════════════════════════════════════
   HGScript v0.1 — hg.js
   Discord Bot DSL Playground Logic
════════════════════════════════════════════ */

'use strict';

/* ════════════════════════════════════════════
   SAMPLE CODE SNIPPETS
════════════════════════════════════════════ */
const SAMPLES = {
  basic: `# ── Hello コマンド ──────────────────
command(hello: string? name) {
    permission moderator
    cooldown 5

    if name == "" {
        reply "Hello, World!"
    }
    else {
        reply "Hello, " + name + "!"
    }
}`,

  calc: `# ── 計算コマンド ────────────────────
command(add: int a int b) {
    int result = a + b
    reply {
        content "Result: " + result
        ephemeral true
    }
}

command(divide: float a float b) {
    if b == 0 {
        reply {
            content "Error: Division by zero"
            ephemeral true
        }
    }
    else {
        float result = a / b
        reply result
    }
}`,

  economy: `# ── Economy システム ────────────────
command(balance) {
    let coins = load coins
    reply {
        content "Your balance: " + coins
        ephemeral true
    }
}

command(earn) {
    cooldown 60
    let current = load coins
    int bonus = 100
    int total = current + bonus
    store coins = total
    reply "You earned " + bonus + " coins!"
}

command(pay: user target int amount) {
    permission admin
    store coins = amount
    reply "Paid " + amount + " coins to " + target
}`,

  embed: `# ── Embed + Button ──────────────────
command(info) {
    embed {
        title "Bot Information"
        description "HGScript powered Discord Bot"
        color 0x6c63ff
    }

    button "Click Me" {
        reply {
            content "Button was clicked!"
            ephemeral true
        }
    }

    select difficulty {
        option "Easy"
        option "Normal"
        option "Hard"
    }
}`,

  event: `# ── イベントハンドラ ─────────────────
event join {
    reply "Welcome to the server!"
}

event leave {
    reply "Goodbye!"
}

event message {
    # メッセージイベント処理
    let data = await fetch "https://api.example.com/check"
    store last_msg = data
}`,
};

/* ════════════════════════════════════════════
   TRANSPILER — HGScript → Python (discord.py 2.x)
════════════════════════════════════════════ */
function transpile(source) {
  const lines      = source.split('\n');
  const imports    = new Set(['import discord', 'from discord.ext import commands']);
  const linesOut   = [];
  let indentLevel  = 0;
  const blockStack = [];
  let replyBlock   = null;
  let embedBlock   = null;
  let selectName   = null;
  let selectOptions = [];
  let hasStorage   = false;

  const I = n => '    '.repeat(n);

  const TYPE_MAP = {
    int: 'int', float: 'float', string: 'str', bool: 'bool',
    user: 'discord.Member', role: 'discord.Role', channel: 'discord.TextChannel',
  };

  const val        = v => v === 'true' ? 'True' : v === 'false' ? 'False' : v;
  const replaceVal = e => e.replace(/\btrue\b/g, 'True').replace(/\bfalse\b/g, 'False');

  function parseArgs(str) {
    if (!str?.trim()) return [];
    const parts = str.trim().split(/\s+/);
    const args  = [];
    for (let i = 0; i + 1 < parts.length; i += 2) {
      const t   = parts[i], n = parts[i + 1];
      const opt = t.endsWith('?');
      const base = opt ? t.slice(0, -1) : t;
      const pt  = TYPE_MAP[base] || base;
      args.push(opt ? `${n}: ${pt} = None` : `${n}: ${pt}`);
    }
    return args;
  }

  for (let i = 0; i < lines.length; i++) {
    const raw  = lines[i];
    const line = raw.trim();

    if (!line)               { linesOut.push(''); continue; }
    if (line.startsWith('#')) { linesOut.push(I(indentLevel) + line); continue; }

    const top = blockStack[blockStack.length - 1];

    /* ── Close brace ── */
    if (line === '}') {
      const ctx = blockStack.pop();
      indentLevel = Math.max(0, indentLevel - 1);

      if (ctx === 'reply_block' && replyBlock) {
        let r = `await ctx.respond(${replyBlock.content || '""'}`;
        if (replyBlock.ephemeral) r += ', ephemeral=True';
        r += ')';
        linesOut.push(I(indentLevel) + r);
        replyBlock = null;

      } else if (ctx === 'embed_block') {
        linesOut.push(I(indentLevel) + '# embed ready');
        embedBlock = null;

      } else if (ctx === 'select_block') {
        linesOut.push(I(indentLevel) + `${selectName}_options = [`);
        selectOptions.forEach(o => linesOut.push(I(indentLevel + 1) + `discord.SelectOption(label=${o}),`));
        linesOut.push(I(indentLevel) + `]`);
        linesOut.push(I(indentLevel) + `${selectName}_select = discord.ui.Select(options=${selectName}_options)`);
        selectOptions = []; selectName = null;
      }
      continue;
    }

    /* ── Inside reply block ── */
    if (top === 'reply_block') {
      if (!replyBlock) replyBlock = {};
      const mc = line.match(/^content\s+(.+)$/);
      const me = line.match(/^ephemeral\s+(true|false)$/);
      if (mc) replyBlock.content   = val(mc[1]);
      if (me) replyBlock.ephemeral = me[1] === 'true';
      continue;
    }

    /* ── Inside embed block ── */
    if (top === 'embed_block') {
      const mt = line.match(/^title\s+"(.+)"$/);
      const md = line.match(/^description\s+"(.+)"$/);
      const mc = line.match(/^color\s+(0x[\da-fA-F]+|\d+)$/);
      if (mt) linesOut.push(I(indentLevel) + `embed.title = "${mt[1]}"`);
      if (md) linesOut.push(I(indentLevel) + `embed.description = "${md[1]}"`);
      if (mc) linesOut.push(I(indentLevel) + `embed.color = ${mc[1]}`);
      continue;
    }

    /* ── Inside select block ── */
    if (top === 'select_block') {
      const mo = line.match(/^option\s+"(.+)"$/);
      if (mo) selectOptions.push(`"${mo[1]}"`);
      continue;
    }

    let m;

    /* ── command ── */
    if (m = line.match(/^command\((\w+)(?::\s*(.+?))?\)\s*\{?$/)) {
      const args = parseArgs(m[2] || '');
      linesOut.push(I(indentLevel) + `@bot.slash_command(name="${m[1]}", description="${m[1]} command")`);
      linesOut.push(I(indentLevel) + `async def ${m[1]}(ctx${args.length ? ', ' + args.join(', ') : ''}):`);
      blockStack.push('command'); indentLevel++; continue;
    }

    /* ── event ── */
    if (m = line.match(/^event\s+(\w+)\s*\{?$/)) {
      const evtMap = {
        join:    ['on_member_join',   'member: discord.Member'],
        leave:   ['on_member_remove', 'member: discord.Member'],
        message: ['on_message',       'message: discord.Message'],
      };
      const [fn, params] = evtMap[m[1]] || [`on_${m[1]}`, ''];
      linesOut.push(I(indentLevel) + `@bot.event`);
      linesOut.push(I(indentLevel) + `async def ${fn}(${params}):`);
      blockStack.push('event'); indentLevel++; continue;
    }

    /* ── if ── */
    if (m = line.match(/^if\s+(.+?)\s*\{?$/)) {
      linesOut.push(I(indentLevel) + `if ${replaceVal(m[1])}:`);
      blockStack.push('if'); indentLevel++; continue;
    }

    /* ── else ── */
    if (/^else\s*\{?$/.test(line)) {
      indentLevel = Math.max(0, indentLevel - 1); blockStack.pop();
      linesOut.push(I(indentLevel) + 'else:');
      blockStack.push('else'); indentLevel++; continue;
    }

    /* ── for ── */
    if (m = line.match(/^for\s+(\w+)\s+in\s+(\d+)\.\.(\d+)\s*\{?$/)) {
      linesOut.push(I(indentLevel) + `for ${m[1]} in range(${m[2]}, ${parseInt(m[3]) + 1}):`);
      blockStack.push('for'); indentLevel++; continue;
    }

    /* ── reply { block ── */
    if (/^reply\s*\{$/.test(line)) {
      replyBlock = {}; blockStack.push('reply_block'); indentLevel++; continue;
    }

    /* ── reply simple ── */
    if (m = line.match(/^reply\s+(.+)$/)) {
      linesOut.push(I(indentLevel) + `await ctx.respond(${val(m[1])})`); continue;
    }

    /* ── embed { ── */
    if (/^embed\s*\{$/.test(line)) {
      linesOut.push(I(indentLevel) + `embed = discord.Embed()`);
      embedBlock = {}; blockStack.push('embed_block'); indentLevel++; continue;
    }

    /* ── button ── */
    if (m = line.match(/^button\s+"(.+)"\s*\{?$/)) {
      const sn = m[1].replace(/[^a-zA-Z0-9]/g, '_');
      linesOut.push(I(indentLevel) + `class _Btn_${sn}(discord.ui.Button):`);
      linesOut.push(I(indentLevel + 1) + `def __init__(self):`);
      linesOut.push(I(indentLevel + 2) + `super().__init__(label="${m[1]}", style=discord.ButtonStyle.primary)`);
      linesOut.push(I(indentLevel + 1) + `async def callback(self, interaction: discord.Interaction):`);
      blockStack.push('button_block'); indentLevel += 2; continue;
    }

    /* ── select ── */
    if (m = line.match(/^select\s+(\w+)\s*\{?$/)) {
      selectName = m[1]; selectOptions = [];
      blockStack.push('select_block'); indentLevel++; continue;
    }

    /* ── store ── */
    if (m = line.match(/^store\s+(\w+)\s*=\s*(.+)$/)) {
      hasStorage = true;
      linesOut.push(I(indentLevel) + `storage["${m[1]}"] = ${val(m[2])}`); continue;
    }

    /* ── let x = load y ── */
    if (m = line.match(/^let\s+(\w+)\s*=\s*load\s+(\w+)$/)) {
      hasStorage = true;
      linesOut.push(I(indentLevel) + `${m[1]} = storage.get("${m[2]}", 0)`); continue;
    }

    /* ── let x = await fetch ── */
    if (m = line.match(/^let\s+(\w+)\s*=\s*await\s+fetch\s+"(.+)"$/)) {
      imports.add('import aiohttp');
      linesOut.push(I(indentLevel) + `async with aiohttp.ClientSession() as _sess:`);
      linesOut.push(I(indentLevel + 1) + `async with _sess.get("${m[2]}") as _resp:`);
      linesOut.push(I(indentLevel + 2) + `${m[1]} = await _resp.json()`); continue;
    }

    /* ── let x = expr ── */
    if (m = line.match(/^let\s+(\w+)\s*=\s*(.+)$/)) {
      linesOut.push(I(indentLevel) + `${m[1]} = ${replaceVal(m[2])}`); continue;
    }

    /* ── type var = value ── */
    if (m = line.match(/^(int|float|string|bool|user|role|channel)\??\s+(\w+)\s*=\s*(.+)$/)) {
      linesOut.push(I(indentLevel) + `${m[2]}: ${TYPE_MAP[m[1]] || m[1]} = ${replaceVal(m[3])}`); continue;
    }

    /* ── permission ── */
    if (m = line.match(/^permission\s+(\w+)$/)) {
      const pmap = { admin: 'administrator', moderator: 'manage_messages' };
      const p    = pmap[m[1]] || m[1];
      linesOut.push(I(indentLevel) + `if not ctx.author.guild_permissions.${p}:`);
      linesOut.push(I(indentLevel + 1) + `await ctx.respond("権限がありません。", ephemeral=True)`);
      linesOut.push(I(indentLevel + 1) + `return`); continue;
    }

    /* ── cooldown ── */
    if (m = line.match(/^cooldown\s+(\d+)$/)) {
      linesOut.push(I(indentLevel) + `# @commands.cooldown(1, ${m[1]}, commands.BucketType.user)`); continue;
    }

    /* ── await fetch (no assign) ── */
    if (m = line.match(/^await\s+fetch\s+"(.+)"$/)) {
      imports.add('import aiohttp');
      linesOut.push(I(indentLevel) + `async with aiohttp.ClientSession() as _sess:`);
      linesOut.push(I(indentLevel + 1) + `async with _sess.get("${m[1]}") as _resp:`);
      linesOut.push(I(indentLevel + 2) + `await _resp.json()`); continue;
    }

    /* ── fallback ── */
    linesOut.push(I(indentLevel) + `# ${line}`);
  }

  /* Build header */
  const importList = [...imports].filter(Boolean).sort();
  const header = [
    '# Generated by HGScript v0.1 Transpiler',
    '# ─────────────────────────────────────────',
    ...importList, '',
    'bot = commands.Bot(',
    '    command_prefix="!",',
    '    intents=discord.Intents.all()',
    ')', '',
  ];
  if (hasStorage) {
    header.push('# Persistent storage (replace with DB in production)');
    header.push('storage: dict = {}');
    header.push('');
  }
  header.push('');

  return [
    ...header, ...linesOut, '', '',
    `if __name__ == "__main__":`,
    `    bot.run("YOUR_BOT_TOKEN")`,
  ].join('\n');
}

/* ════════════════════════════════════════════
   SYNTAX HIGHLIGHTING — HGScript
════════════════════════════════════════════ */
function highlightHG(code) {
  return escHtml(code)
    .replace(/(#.*)$/gm,  m => `<span class="cmt">${m}</span>`)
    .replace(/("(?:[^"\\]|\\.)*")/g, m => `<span class="str">${m}</span>`)
    .replace(/(0x[0-9a-fA-F]+)/g,   m => `<span class="hex">${m}</span>`)
    .replace(/\b(\d+(?:\.\d+)?)\b/g, m => `<span class="num">${m}</span>`)
    .replace(/\b(command|event|reply|store|load|let|if|else|for|in|embed|button|select|option|await|fetch|permission|cooldown|content|ephemeral|title|description|color)\b/g,
      m => `<span class="kw">${m}</span>`)
    .replace(/\b(int|float|string|bool|user|role|channel)\b/g, m => `<span class="type">${m}</span>`)
    .replace(/\b(true|false)\b/g,    m => `<span class="bool">${m}</span>`);
}

/* ════════════════════════════════════════════
   SYNTAX HIGHLIGHTING — Python
════════════════════════════════════════════ */
function highlightPy(code) {
  return escHtml(code)
    .replace(/(#.*)$/gm,  m => `<span class="py-cmt">${m}</span>`)
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, m => `<span class="py-str">${m}</span>`)
    .replace(/(@\w+(?:\.\w+)*(?:\([^)]*\))?)/g,        m => `<span class="py-dec">${m}</span>`)
    .replace(/\b(\d+(?:\.\d+)?)\b/g, m => `<span class="py-num">${m}</span>`)
    .replace(/\b(import|from|as|def|class|if|else|elif|for|in|while|return|await|async|not|and|or|True|False|None|self|pass)\b/g,
      m => `<span class="py-kw">${m}</span>`)
    .replace(/\b(discord|commands|aiohttp|bot|ctx|embed|interaction)\b/g, m => `<span class="py-cls">${m}</span>`)
    .replace(/\b(\w+)(?=\s*\()/g,    m => `<span class="py-fn">${m}</span>`);
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ════════════════════════════════════════════
   UI CONTROLLER
════════════════════════════════════════════ */
const input    = document.getElementById('hg-input');
const hlLayer  = document.getElementById('highlight-layer');
const pyOut    = document.getElementById('py-output');
const lineNums = document.getElementById('line-numbers');
const errPanel = document.getElementById('error-panel');
let   lastPython = '';

/* ── update ── */
function update() {
  const code = input.value;

  /* highlight */
  hlLayer.innerHTML = highlightHG(code) + '\n';

  /* line numbers */
  const count = (code.match(/\n/g) || []).length + 1;
  lineNums.innerHTML = Array.from({ length: count }, (_, i) =>
    `<div class="line-num">${i + 1}</div>`
  ).join('');

  /* stats */
  document.getElementById('stat-lines').textContent = count;
  document.getElementById('stat-chars').textContent = code.length;

  /* transpile */
  try {
    const python  = transpile(code);
    lastPython    = python;
    pyOut.innerHTML = highlightPy(python);
    document.getElementById('out-lines').textContent = python.split('\n').length;

    const os = document.getElementById('out-status');
    os.textContent = '✓ OK'; os.className = 'stat-ok';
    const ss = document.getElementById('stat-status');
    ss.textContent = '✓ Valid'; ss.className = 'stat-ok';
    errPanel.classList.remove('show');
  } catch (e) {
    const os = document.getElementById('out-status');
    os.textContent = '✗ Error'; os.className = 'stat-err';
    const ss = document.getElementById('stat-status');
    ss.textContent = '✗ Error'; ss.className = 'stat-err';
    errPanel.textContent = '✗ ' + e.message;
    errPanel.classList.add('show');
  }

  syncScroll();
}

function syncScroll() {
  hlLayer.scrollTop  = input.scrollTop;
  hlLayer.scrollLeft = input.scrollLeft;
}

input.addEventListener('input', update);
input.addEventListener('scroll', syncScroll);

/* Tab key → 4 spaces */
input.addEventListener('keydown', e => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const s  = input.selectionStart;
    const en = input.selectionEnd;
    input.value = input.value.substring(0, s) + '    ' + input.value.substring(en);
    input.selectionStart = input.selectionEnd = s + 4;
    update();
  }
});

/* ── sample loader ── */
function loadSample(name, btn) {
  document.querySelectorAll('.sample-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  input.value = SAMPLES[name] || '';
  update();
}

/* ── clear ── */
function clearEditor() {
  document.querySelectorAll('.sample-btn').forEach(b => b.classList.remove('active'));
  input.value = '';
  update();
}

/* ── formatter ── */
function formatCode() {
  let depth = 0;
  input.value = input.value.split('\n').map(l => {
    const t = l.trim();
    if (!t) return '';
    if (t === '}') depth = Math.max(0, depth - 1);
    const r = '    '.repeat(depth) + t;
    if (t.endsWith('{')) depth++;
    return r;
  }).join('\n');
  update();
}

/* ── copy output ── */
async function copyOutput() {
  if (!lastPython) return;
  await navigator.clipboard.writeText(lastPython).catch(() => {});
  const btn = document.getElementById('copy-btn');
  btn.textContent = '✓ コピー完了';
  btn.classList.add('copied');
  showToast('✓ クリップボードにコピーしました');
  setTimeout(() => {
    btn.textContent = '⎘ コピー';
    btn.classList.remove('copied');
  }, 2000);
}

/* ── toast ── */
let _toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ════════════════════════════════════════════
   DOCS PANEL
════════════════════════════════════════════ */
function toggleDocs() {
  const panel   = document.getElementById('docs-panel');
  const overlay = document.getElementById('docs-overlay');
  const btn     = document.getElementById('book-btn');
  panel.classList.toggle('show');
  overlay.classList.toggle('show');
  btn.classList.toggle('open');
}

function showTab(id, btn) {
  document.querySelectorAll('.docs-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.docs-section').forEach(s => s.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  if (btn) btn.classList.add('active');
}

/* ════════════════════════════════════════════
   INIT
════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  loadSample('basic', document.querySelector('.sample-btn'));
  input.focus();
});
