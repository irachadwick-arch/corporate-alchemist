/* Tabby Alchemist — engine. Content lives in data.js (loaded first). */

const RECIPES = {};
RAW.forEach(([a, b, r]) => { RECIPES[[a, b].sort().join("+")] = r; });
const key = (a, b) => [a, b].sort().join("+");

const BASES = Object.keys(ELEMENTS).filter(id => ELEMENTS[id].base);
const TOTAL_RECIPES = RAW.length;
const SAVE_KEY = "tabbyAlchemist.v1";
const HINT_COOLDOWN_MS = 30000;
const CLEAR_MS = 2600;
const FAIL_CLEAR_MS = 1300;

/* ---------------------------------------------------------------- state */

let discovered, justNew, foundRecipes, foundSet, hintsUsed, startedAt, wonAt;
let slots = [null, null];
let clearTimer = null;
let hintReadyAt = 0;
let hintTicker = null;
let activeTab = "elements";
let resetArmed = false;
let resetTimer = null;

function freshState() {
  discovered = new Set(BASES);
  justNew = new Set();
  foundRecipes = [];
  foundSet = new Set();
  hintsUsed = 0;
  startedAt = null;
  wonAt = null;
}

/* Storage can throw (Safari private mode, some file:// contexts). A failure to
   save or load must never break the game — fall back to an in-memory run. */
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      discovered: [...discovered],
      justNew: [...justNew],
      foundRecipes,
      hintsUsed,
      startedAt,
      wonAt,
    }));
  } catch (e) { /* storage unavailable — keep playing in memory */ }
}

function load() {
  freshState();
  let raw;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { return; }
  if (!raw) return;

  let s;
  try { s = JSON.parse(raw); } catch (e) { return; }
  if (!s || typeof s !== "object") return;

  // Validate against current content: ids and recipe keys that no longer exist
  // are dropped, so editing data.js can never corrupt an existing save.
  if (Array.isArray(s.discovered)) {
    s.discovered.filter(id => ELEMENTS[id]).forEach(id => discovered.add(id));
  }
  BASES.forEach(id => discovered.add(id));

  // NEW is a transient highlight — never restored from a save, so badges
  // don't pile up across sessions.
  if (Array.isArray(s.foundRecipes)) {
    foundRecipes = s.foundRecipes.filter(k => typeof k === "string" && RECIPES[k]);
    foundSet = new Set(foundRecipes);
  }
  if (typeof s.hintsUsed === "number" && s.hintsUsed >= 0) hintsUsed = s.hintsUsed;
  if (typeof s.startedAt === "number") startedAt = s.startedAt;
  if (typeof s.wonAt === "number") wonAt = s.wonAt;
}

/* ------------------------------------------------------------------ dom */

const grid = document.getElementById("grid");
const book = document.getElementById("book");
const search = document.getElementById("search");
const resultBox = document.getElementById("result");
const hintMsg = document.getElementById("hintMsg");
const hintBtn = document.getElementById("hintBtn");
const shareBtn = document.getElementById("shareBtn");
const resetBtn = document.getElementById("resetBtn");
const legend = document.getElementById("legend");
const tabElements = document.getElementById("tabElements");
const tabRecipes = document.getElementById("tabRecipes");
const winBox = document.getElementById("win");

document.getElementById("total").textContent = Object.keys(ELEMENTS).length;

/* -------------------------------------------------------------- render */

function renderGrid() {
  const q = search.value.trim().toLowerCase();
  grid.innerHTML = "";
  const ids = [...discovered].sort((a, b) => ELEMENTS[a].n.localeCompare(ELEMENTS[b].n, "en"));
  ids.forEach(id => {
    const el = ELEMENTS[id];
    if (q && !el.n.toLowerCase().includes(q)) return;
    const d = document.createElement("div");
    d.className = "el" + (el.tabby ? " tabby" : "") + (justNew.has(id) ? " isnew" : "");
    d.innerHTML = `<span class="e">${el.e}</span><span>${el.n}</span>` +
      (justNew.has(id) ? `<span class="badge">NEW</span>` : "");
    if (el.f) d.title = el.f;
    d.onclick = () => pick(id);
    grid.appendChild(d);
  });
  document.getElementById("count").textContent = discovered.size;
  document.getElementById("tabElCount").textContent = discovered.size;
}

function renderBook() {
  const q = search.value.trim().toLowerCase();
  book.innerHTML = "";

  const rows = foundRecipes.map(k => {
    const [a, b] = k.split("+");
    return [a, b, RECIPES[k]];
  }).filter(([a, b, r]) =>
    !q || [a, b, r].some(id => ELEMENTS[id].n.toLowerCase().includes(q))
  );

  rows.forEach(([a, b, r]) => {
    const d = document.createElement("div");
    d.className = "row";
    d.innerHTML =
      `<span class="e">${ELEMENTS[a].e}</span><span>${ELEMENTS[a].n}</span>` +
      `<span class="op">+</span>` +
      `<span class="e">${ELEMENTS[b].e}</span><span>${ELEMENTS[b].n}</span>` +
      `<span class="op">→</span>` +
      `<span class="e">${ELEMENTS[r].e}</span><span class="res">${ELEMENTS[r].n}</span>`;
    if (ELEMENTS[r].f) d.title = ELEMENTS[r].f;
    book.appendChild(d);
  });

  // Locked rows are deliberately identical: they show how much is left
  // without leaking which branch it belongs to.
  const locked = TOTAL_RECIPES - foundRecipes.length;
  if (!q) {
    for (let i = 0; i < locked; i++) {
      const d = document.createElement("div");
      d.className = "row locked";
      d.innerHTML = `<span>???</span><span class="op">+</span><span>???</span>` +
        `<span class="op">→</span><span class="res">🔒</span>`;
      book.appendChild(d);
    }
  }

  if (!book.children.length) {
    book.innerHTML = `<div class="empty">No recipes match “${search.value.trim()}”.</div>`;
  }
  document.getElementById("tabRcCount").textContent = foundRecipes.length;
}

function renderSlots() {
  slots.forEach((id, i) => {
    const s = document.getElementById("slot" + i);
    if (id) {
      s.className = "slot filled";
      s.innerHTML = `<span class="e">${ELEMENTS[id].e}</span><span class="n">${ELEMENTS[id].n}</span>`;
    } else {
      s.className = "slot";
      s.innerHTML = `<span class="e">＋</span><span class="n">pick an element</span>`;
    }
  });
}

function renderAll() { renderGrid(); renderBook(); renderSlots(); updateHintBtn(); updateShareBtn(); }

/* --------------------------------------------------------------- tabs */

function setTab(tab) {
  activeTab = tab;
  const onElements = tab === "elements";
  tabElements.classList.toggle("active", onElements);
  tabRecipes.classList.toggle("active", !onElements);
  grid.hidden = !onElements;
  book.hidden = onElements;
  if (legend) legend.hidden = !onElements;
  search.placeholder = onElements ? "search elements…" : "search recipes…";
  renderGrid(); renderBook();
}
tabElements.onclick = () => setTab("elements");
tabRecipes.onclick = () => setTab("recipes");

/* ------------------------------------------------------- lab mechanics */

function scheduleClear(ms) {
  clearTimeout(clearTimer);
  clearTimer = setTimeout(() => {
    slots = [null, null];
    resultBox.innerHTML = "";   // also clear the result card so it doesn't linger
    renderSlots();
  }, ms);
}

/* Combining is driven by "both slots are full", not by which branch filled the
   second slot. Together with cancelling the pending clear on every interaction,
   that removes both the dropped-pick and the soft-lock this used to have. */
function pick(id) {
  clearTimeout(clearTimer);
  justNew.delete(id);

  if (slots[0] !== null && slots[1] !== null) {
    slots = [id, null];
    resultBox.innerHTML = "";
  } else if (slots[0] === null) {
    slots[0] = id;
  } else {
    slots[1] = id;
  }

  renderSlots();
  renderGrid();
  if (slots[0] !== null && slots[1] !== null) combine();
}

document.getElementById("slot0").onclick = () => { clearTimeout(clearTimer); slots[0] = null; renderSlots(); };
document.getElementById("slot1").onclick = () => { clearTimeout(clearTimer); slots[1] = null; renderSlots(); };

function combine() {
  const [a, b] = slots;
  const k = key(a, b);
  const res = RECIPES[k];

  if (!res) {
    resultBox.innerHTML = `<div class="card fail"><div class="e">🚫</div>
      <div class="n">No reaction</div>
      <div class="tag fail">${ELEMENTS[a].n} + ${ELEMENTS[b].n} don't combine</div></div>`;
    scheduleClear(FAIL_CLEAR_MS);
    return;
  }

  const isNew = !discovered.has(res);
  discovered.add(res);
  if (isNew) {
    justNew.clear();      // only the latest discovery carries the NEW badge
    justNew.add(res);
    if (startedAt === null) startedAt = Date.now();
  }
  if (!foundSet.has(k)) { foundSet.add(k); foundRecipes.push(k); }

  const el = ELEMENTS[res];
  resultBox.innerHTML = `<div class="card${isNew ? "" : " dup"}"><div class="e">${el.e}</div>
    <div class="n">${el.n}</div>
    <div class="tag ${isNew ? "new" : "dup"}">${isNew ? (el.tabby ? "✨ New Tabby product!" : "✨ New element!") : "already discovered"}</div>
    ${el.f ? `<div class="flavor">${el.f}</div>` : ""}</div>`;

  hintMsg.innerHTML = "";
  renderGrid(); renderBook(); updateHintBtn();

  if (el.final && wonAt === null) {
    wonAt = Date.now();
    updateShareBtn();
    setTimeout(showWin, 500);
  }

  save();
  scheduleClear(CLEAR_MS);
}

/* --------------------------------------------------------------- hints */

function hintCandidates() {
  return RAW.filter(([a, b, r]) => discovered.has(a) && discovered.has(b) && !discovered.has(r));
}

function updateHintBtn() {
  const remaining = Math.max(0, hintReadyAt - Date.now());
  const none = hintCandidates().length === 0;

  if (none) {
    hintBtn.disabled = true;
    hintBtn.textContent = "Hint";
    hintBtn.title = "Nothing left to hint at — you've found everything reachable.";
    return;
  }
  hintBtn.title = "Reveals the two ingredients, never the result.";
  if (remaining > 0) {
    hintBtn.disabled = true;
    hintBtn.textContent = `Hint (${Math.ceil(remaining / 1000)}s)`;
  } else {
    hintBtn.disabled = false;
    hintBtn.textContent = hintsUsed ? `Hint (${hintsUsed} used)` : "Hint";
  }
}

hintBtn.onclick = () => {
  if (Date.now() < hintReadyAt) return;
  const candidates = hintCandidates();
  if (!candidates.length) {
    hintMsg.innerHTML = `<span>You've found everything reachable. 🎉</span>`;
    updateHintBtn();
    return;
  }

  // Reveal both inputs but never the result — the payoff is the result.
  const [a, b] = candidates[Math.floor(Math.random() * candidates.length)];
  hintMsg.innerHTML = `<span>Try</span>` +
    `<span class="chip"><span class="e">${ELEMENTS[a].e}</span>${ELEMENTS[a].n}</span>` +
    `<span class="plus">+</span>` +
    `<span class="chip"><span class="e">${ELEMENTS[b].e}</span>${ELEMENTS[b].n}</span>`;

  hintsUsed++;
  hintReadyAt = Date.now() + HINT_COOLDOWN_MS;
  save();
  updateHintBtn();

  clearInterval(hintTicker);
  hintTicker = setInterval(() => {
    updateHintBtn();
    if (Date.now() >= hintReadyAt) clearInterval(hintTicker);
  }, 250);
};

/* ----------------------------------------------------------- end card */

function elapsedText() {
  if (startedAt === null || wonAt === null) return "—";
  const secs = Math.max(0, Math.round((wonAt - startedAt) / 1000));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = n => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function statsLine() {
  return `${discovered.size}/${Object.keys(ELEMENTS).length} elements · ` +
    `${hintsUsed} hint${hintsUsed === 1 ? "" : "s"} · ${elapsedText()}`;
}

const EMOJI_FONT = `"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
const TEXT_FONT = `"Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif`;

/* 1200x630 is the standard link-preview ratio, so the card unfurls correctly
   in Slack and still looks right pasted inline. */
function drawCard() {
  const c = document.createElement("canvas");
  c.width = 1200; c.height = 630;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#0c1512";
  ctx.fillRect(0, 0, 1200, 630);
  const glow = ctx.createRadialGradient(880, 40, 0, 880, 40, 720);
  glow.addColorStop(0, "#123529");
  glow.addColorStop(1, "rgba(12,21,18,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1200, 630);

  ctx.textAlign = "center";

  ctx.font = `120px ${EMOJI_FONT}`;
  ctx.fillText("🏆", 600, 190);

  ctx.fillStyle = "#e8f5ef";
  ctx.font = `700 62px ${TEXT_FONT}`;
  ctx.fillText("Product of the Year", 600, 290);

  ctx.fillStyle = "#3fe0a8";
  ctx.font = `500 34px ${TEXT_FONT}`;
  ctx.fillText(statsLine(), 600, 355);

  ctx.fillStyle = "#8fb3a5";
  ctx.font = `400 26px ${TEXT_FONT}`;
  ctx.fillText("Shipped a Tabby super app out of standups, bugs and coffee.", 600, 420);

  // footer rule + wordmark
  ctx.strokeStyle = "#20362e";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(360, 480); ctx.lineTo(840, 480); ctx.stroke();

  ctx.fillStyle = "#3fe0a8";
  ctx.font = `800 28px ${TEXT_FONT}`;
  ctx.fillText("tabby alchemist", 600, 530);

  ctx.fillStyle = "#8fb3a5";
  ctx.font = `400 22px ${TEXT_FONT}`;
  ctx.fillText(new Date(wonAt || Date.now()).toLocaleDateString(), 600, 570);

  return c;
}

function cardBlob(canvas) {
  return new Promise(resolve => canvas.toBlob(resolve, "image/png"));
}

function showWin() {
  document.getElementById("runstats").textContent = statsLine();
  const canvas = drawCard();
  const shot = document.getElementById("shot");
  shot.src = canvas.toDataURL("image/png");
  shot.hidden = false;

  document.getElementById("downloadBtn").onclick = async () => {
    const blob = await cardBlob(canvas);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tabby-alchemist-${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Clipboard images need a secure context, so plain-http hosting won't get
  // this button at all — the download above is always the guaranteed path.
  const copyBtn = document.getElementById("copyBtn");
  const canCopy = window.isSecureContext && navigator.clipboard &&
    typeof navigator.clipboard.write === "function" && typeof window.ClipboardItem === "function";
  copyBtn.hidden = !canCopy;
  if (canCopy) {
    copyBtn.textContent = "Copy image";
    copyBtn.onclick = async () => {
      try {
        const blob = await cardBlob(canvas);
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        copyBtn.textContent = "Copied ✓";
      } catch (e) {
        copyBtn.textContent = "Copy failed";
      }
      setTimeout(() => { copyBtn.textContent = "Copy image"; }, 2000);
    };
  }

  winBox.classList.add("show");
}

function updateShareBtn() { shareBtn.hidden = wonAt === null; }
shareBtn.onclick = showWin;
document.getElementById("winClose").onclick = () => winBox.classList.remove("show");

/* --------------------------------------------------------------- reset */

/* Two-step rather than confirm(): a blocking dialog is worse for players and
   makes the page untestable by automation. */
resetBtn.onclick = () => {
  if (!resetArmed) {
    resetArmed = true;
    resetBtn.textContent = "Sure?";
    resetBtn.classList.add("armed");
    resetTimer = setTimeout(disarmReset, 3000);
    return;
  }
  disarmReset();
  clearTimeout(clearTimer);
  clearInterval(hintTicker);
  freshState();
  slots = [null, null];
  hintReadyAt = 0;
  resultBox.innerHTML = "";
  hintMsg.innerHTML = "";
  winBox.classList.remove("show");
  save();
  renderAll();
};

function disarmReset() {
  clearTimeout(resetTimer);
  resetArmed = false;
  resetBtn.textContent = "Reset";
  resetBtn.classList.remove("armed");
}

/* ---------------------------------------------------------------- boot */

search.oninput = () => { renderGrid(); renderBook(); };

load();
setTab("elements");
renderAll();
