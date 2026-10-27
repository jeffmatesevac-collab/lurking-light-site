/* Lurking Light v1.1 — shared script for every page. All demo data lives here. No network calls.
   Each block only runs if its markup is on the current page. */
(() => {
"use strict";
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const has = s => !!document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

/* ---------- progress (localStorage) ---------- */
const RANKS = [
  { name: "Lurker",      at: 0,   blurb: "watching from the rocks" },
  { name: "Drifter",     at: 40,  blurb: "floating closer" },
  { name: "Glimmer",     at: 100, blurb: "you've started to glow" },
  { name: "Beacon",      at: 200, blurb: "people find the lobby by you" },
  { name: "Lightbearer", at: 350, blurb: "you hold the lure up" },
];
const QUESTS = [
  { id: "lobby",  label: "Peek into tonight's lobby", xp: 10 },
  { id: "studio", label: "Check out the studio",     xp: 10 },
  { id: "guild",  label: "Find the guild",           xp: 10 },
  { id: "forums", label: "Wander into the forums",   xp: 10 },
  { id: "wiki",   label: "Read a wiki page",         xp: 10 },
  { id: "games",  label: "Find your game's hub",     xp: 10 },
  { id: "face",   label: "Flip between Studio and Guild", xp: 5 },
  { id: "rsvp",   label: "RSVP to Friday Hang",      xp: 15 },
  { id: "post",   label: "Make your first post",     xp: 25 },
  { id: "spark",  label: "Give someone a spark",     xp: 5 },
  { id: "lure",   label: "Poke the lure",            xp: 5 },
  { id: "secret", label: "???",                      xp: 30 },
];
const BADGES = [
  { id: "first-post", label: "First Words" },
  { id: "sparky",     label: "Spark Plug (5 sparks)" },
  { id: "tourist",    label: "Full Tour" },
  { id: "rsvp",       label: "Friday Regular" },
  { id: "lights-out", label: "Lights Out" },
  { id: "deep",       label: "Deep Diver" },
];
const KEY = "ll.v1";
const fresh = () => ({ xp: 0, quests: {}, badges: {}, sparks: 10, given: 0, posts: 0, streak: 1, lastDay: today(), rsvp: false, myPosts: {}, myReacts: {} });
function today(){ return new Date().toISOString().slice(0,10); }
let S;
try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || "{}")); } catch { S = fresh(); }
// streak
(() => {
  const t = today();
  if (S.lastDay !== t) {
    const diff = Math.round((new Date(t) - new Date(S.lastDay)) / 864e5);
    S.streak = diff === 1 ? S.streak + 1 : 1;
    S.lastDay = t; S.sparks = Math.max(S.sparks, 10);
  }
})();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };

const rankFor = xp => RANKS.reduce((r, x) => xp >= x.at ? x : r, RANKS[0]);
const nextRank = xp => RANKS.find(r => r.at > xp);

function toast(title, body){
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `<b>${esc(title)}</b>${esc(body)}`;
  $("#toasts").append(t);
  setTimeout(() => t.remove(), 3800);
}
function addXP(n, why){
  const before = rankFor(S.xp).name;
  S.xp += n; save(); renderHUD();
  const hud = $("#hudBtn"); hud.classList.remove("bump"); void hud.offsetWidth; hud.classList.add("bump");
  const after = rankFor(S.xp).name;
  if (after !== before) toast("RANK UP", `You're a ${after} now. ${rankFor(S.xp).blurb}.`);
  else if (why) toast(`+${n} glow`, why);
}
function quest(id){
  if (S.quests[id]) return;
  const q = QUESTS.find(q => q.id === id); if (!q) return;
  S.quests[id] = true; addXP(q.xp, q.label === "???" ? "You found a secret." : q.label);
  if (["lobby","studio","guild","forums","wiki","games"].every(k => S.quests[k])) badge("tourist");
}
function badge(id){
  if (S.badges[id]) return;
  S.badges[id] = true; save(); renderMe();
  const b = BADGES.find(b => b.id === id);
  setTimeout(() => toast("BADGE", b.label), 400);
}

function renderHUD(){
  const r = rankFor(S.xp), n = nextRank(S.xp);
  const pct = n ? ((S.xp - r.at) / (n.at - r.at)) * 100 : 100;
  $("#hudRank").textContent = r.name;
  $("#hudXp").textContent = S.xp;
  $("#hudFill").style.width = pct + "%";
  renderMe(pct, r, n);
  renderQuests();
}
function renderMe(pct, r, n){
  if (!has("#meRank")) return;
  r = r || rankFor(S.xp); n = n === undefined ? nextRank(S.xp) : n;
  if (pct === undefined) pct = n ? ((S.xp - r.at) / (n.at - r.at)) * 100 : 100;
  $("#meRank").textContent = r.name;
  $("#meXp").textContent = S.xp;
  $("#meNext").textContent = n ? `${n.at - S.xp} to ${n.name}` : "max rank. the lure is yours.";
  $("#meFill").style.width = pct + "%";
  $("#meBar").setAttribute("aria-valuenow", Math.round(pct));
  $("#meSparks").textContent = S.sparks;
  $("#meStreak").textContent = S.streak;
  $("#mePosts").textContent = S.posts;
  $("#ranks").innerHTML = RANKS.map(x => `<li class="${S.xp >= x.at ? "got" : ""} ${x.name === r.name ? "cur" : ""}">${x.name}<span>${x.at}</span></li>`).join("");
  $("#badges").innerHTML = BADGES.map(b => `<li class="${S.badges[b.id] ? "got" : ""}">${S.badges[b.id] ? b.label : "???"}</li>`).join("");
}
function renderQuests(){
  if (!has("#quests")) return;
  $("#quests").innerHTML = QUESTS.map(q => `<li class="${S.quests[q.id] ? "done" : ""}">${esc(S.quests[q.id] || q.id !== "secret" ? q.label : "??? (old habits)")}<span>+${q.xp}</span></li>`).join("");
}
$("#hudBtn").addEventListener("click", () => $("#profile").showModal());
if (has("#resetBtn")) $("#resetBtn").addEventListener("click", () => { if (confirm("Reset your demo glow, posts, and badges?")) { localStorage.removeItem(KEY); location.reload(); } });

/* ---------- marine snow particles ---------- */
(() => {
  const c = $("#snow"), x = c.getContext("2d");
  let W, H, P = [], mx = -999, my = -999;
  const resize = () => { W = c.width = innerWidth * devicePixelRatio; H = c.height = innerHeight * devicePixelRatio; };
  resize(); addEventListener("resize", resize);
  const N = innerWidth < 700 ? 40 : 90;
  for (let i = 0; i < N; i++) P.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.8 + .4, s: Math.random() * .00025 + .00008, d: Math.random() * Math.PI * 2, a: Math.random() * .5 + .15, cream: Math.random() < .25 });
  addEventListener("pointermove", e => { mx = e.clientX * devicePixelRatio; my = e.clientY * devicePixelRatio; });
  function frame(t){
    x.clearRect(0, 0, W, H);
    for (const p of P) {
      p.y -= p.s; p.x += Math.sin(t / 3000 + p.d) * .00012;
      if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
      let px = p.x * W, py = p.y * H;
      const dx = px - mx, dy = py - my, dist = Math.hypot(dx, dy);
      let glow = 0;
      if (dist < 160 * devicePixelRatio) glow = 1 - dist / (160 * devicePixelRatio);
      x.beginPath();
      x.fillStyle = p.cream || glow > .2 ? `rgba(245,227,189,${p.a + glow * .5})` : `rgba(141,186,184,${p.a})`;
      x.arc(px, py, (p.r + glow * 1.5) * devicePixelRatio, 0, 7); x.fill();
    }
    if (!reduced) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ---------- hero face toggle + Lurker (home only) ---------- */
if (has(".face-toggle")) {
const FACES = {
  guild:  { eyebrow: "// the hangout is open", tag: "Come sit in the dark with us. The light's right here.",
            sub: "A guild of geeks, gamers, and late-night tinkerers. We raid, we roll dice, we argue about lore, and somewhere in there we make games.",
            cta2: ["See who's around", "#lobby"] },
  studio: { eyebrow: "// lurking light studio", tag: "Stories and games, made by nerds who play them.",
            sub: "A small production studio with big teeth. Weird worlds, characters you'll want to hang out with, and games built in public with the people in the lobby.",
            cta2: ["See what we're making", "studio.html"] },
};
function setFace(f, user){
  document.body.dataset.face = f;
  $$(".face-toggle button").forEach(b => b.setAttribute("aria-selected", b.dataset.face === f));
  const F = FACES[f];
  $("#heroEyebrow").textContent = F.eyebrow; $("#heroTag").textContent = F.tag; $("#heroSub").textContent = F.sub;
  $("#ctaSecondary").textContent = F.cta2[0]; $("#ctaSecondary").href = F.cta2[1];
  if (user) quest("face");
}
$$(".face-toggle button").forEach(b => b.addEventListener("click", () => setFace(b.dataset.face, true)));
$(".face-toggle").addEventListener("keydown", e => {
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") { const n = document.body.dataset.face === "guild" ? "studio" : "guild"; setFace(n, true); $(`#tab-${n}`).focus(); }
});

/* ---------- Lurker lines + lure poke ---------- */
const LINES = [
  "Oh, hey. Didn't see you there. (I did.)",
  "The light's free. The snacks are BYO.",
  "Friday Hang. Be there. I'll know.",
  "I have a lot of teeth. I use them for smiling.",
  "Pull up a rock. Any rock.",
  "Deep down, everyone's a lurker. Some of us just own it.",
  "You can stop poking now. Or don't. It tickles.",
];
let poke = 0, speechT;
function say(line){
  const s = $("#speech"); s.textContent = line; s.classList.add("show");
  clearTimeout(speechT); speechT = setTimeout(() => s.classList.remove("show"), 3200);
}
$("#lureHit").addEventListener("click", () => {
  say(LINES[poke % LINES.length]); poke++;
  quest("lure");
  if (poke === 7) lightsOut();
});
setTimeout(() => say("Oh, hey. Didn't see you there. (I did.)"), 1400);
}

/* ---------- easter eggs: lights out + konami ---------- */
function lightsOut(){
  document.body.classList.toggle("lights-out");
  if (document.body.classList.contains("lights-out")) {
    toast("LIGHTS OUT", "You're the lure now. Click the mark in the nav or press Esc to turn the lights back on.");
    badge("lights-out"); quest("secret");
  }
}
addEventListener("pointermove", e => { document.body.style.setProperty("--mx", e.clientX + "px"); document.body.style.setProperty("--my", e.clientY + "px"); });
$("#navMark")?.addEventListener("click", e => { if (document.body.classList.contains("lights-out")) { e.preventDefault(); document.body.classList.remove("lights-out"); } });
const KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
let kpos = 0;
addEventListener("keydown", e => {
  if (e.key === "Escape") document.body.classList.remove("lights-out");
  kpos = (e.key === KONAMI[kpos] || e.key.toLowerCase() === KONAMI[kpos]) ? kpos + 1 : (e.key === KONAMI[0] ? 1 : 0);
  if (kpos === KONAMI.length) { kpos = 0; swim(); }
});
function swim(){
  const s = $("#swimmer"); s.classList.remove("go"); void s.offsetWidth; s.classList.add("go");
  document.body.classList.add("party"); setTimeout(() => document.body.classList.remove("party"), 7000);
  toast("↑↑↓↓←→←→BA", "Lurker does a lap. +30 lives (glow).");
  quest("secret"); badge("deep");
}

/* ---------- visit quests (nav active state is baked into each page's HTML) ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) quest(e.target.dataset.quest); }), { threshold: .2 });
$$("[data-quest]").forEach(s => io.observe(s));

/* ---------- avatar helpers (lobby + forums) ---------- */
const COLORS = ["#8DBAB8","#F5E3BD","#b7d3c9","#e9c99a","#a0c4d8","#d9b8c4","#c5d99a"];
const initials = n => n.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase();
const colorOf = n => COLORS[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];

/* ---------- LOBBY (demo presence, home only) ---------- */
let tick = () => {};
if (has("#members")) {
const MEMBERS = [
  { n: "Grimbolt",    rank: "Lightbearer", st: "online", game: "World of Warcraft", detail: "Mythic+ · +12 Stonevault", voice: "Raid Night" },
  { n: "Skippy",      rank: "Beacon",      st: "online", game: "Skip & Buster",     detail: "playtest build 0.3", voice: "Build Night" },
  { n: "MossyDice",   rank: "Glimmer",     st: "online", game: "Baldur's Gate 3",   detail: "Act 2, making bad choices", voice: null },
  { n: "Nyx",         rank: "Beacon",      st: "online", game: "World of Warcraft", detail: "Mythic+ · +12 Stonevault", voice: "Raid Night" },
  { n: "Tidewalker",  rank: "Drifter",     st: "idle",   game: null, detail: "away · probably snacks", voice: null },
  { n: "pixel_ghoul", rank: "Glimmer",     st: "online", game: "Aseprite",          detail: "drawing Lurker fan art", voice: "Build Night" },
  { n: "Brannigan",   rank: "Lurker",      st: "online", game: "Deep Rock Galactic", detail: "rock and stone", voice: "The Rock (chill)" },
  { n: "Ozzie",       rank: "Glimmer",     st: "dnd",    game: "Elden Ring",        detail: "do not disturb · boss attempt #41", voice: null },
  { n: "Wren",        rank: "Drifter",     st: "online", game: null, detail: "just hanging", voice: "The Rock (chill)" },
  { n: "Hollowfin",   rank: "Beacon",      st: "online", game: "World of Warcraft", detail: "Mythic+ · +12 Stonevault", voice: "Raid Night" },
  { n: "Cass",        rank: "Lurker",      st: "online", game: "Stardew Valley",    detail: "year 3, emotionally attached to a chicken", voice: null },
  { n: "Rook",        rank: "Glimmer",     st: "online", game: "World of Warcraft", detail: "leveling an alt", voice: "The Rock (chill)" },
];
const VOICES = ["Raid Night", "Build Night", "The Rock (chill)", "Tabletop Table"];
const ACTIVITY = [
  m => `<b>${m}</b> joined voice`,
  m => `<b>${m}</b> leveled up to Glimmer`,
  m => `<b>${m}</b> posted in #lfg`,
  m => `<b>${m}</b> gave 3 sparks to a build log`,
  m => `<b>${m}</b> started a game`,
  m => `<b>${m}</b> dropped a meme in #the-rocks`,
  m => `<b>${m}</b> finished a +12 (timed!)`,
  m => `<b>${m}</b> said "one more run"`,
  m => `<b>${m}</b> shared a Skip & Buster bug. It was a feature.`,
];
const GAMES_POOL = ["World of Warcraft","Baldur's Gate 3","Deep Rock Galactic","Elden Ring","Stardew Valley","Helldivers 2","Lethal Company","Balatro"];
let filter = "all", talking = new Set();

function renderMembers(flashName){
  const list = MEMBERS.filter(m => filter === "all" || (filter === "playing" && m.game) || (filter === "voice" && m.voice));
  $("#members").innerHTML = list.map(m => `
    <li class="member ${m.n === flashName ? "flash" : ""}">
      <span class="avatar" style="background:${colorOf(m.n)}">${initials(m.n)}<span class="dot ${m.st}" title="${m.st}"></span></span>
      <div><div class="m-name">${esc(m.n)} <span class="m-rank">${m.rank}</span></div>
      <div class="m-act">${m.game ? `playing <b>${esc(m.game)}</b> · ` : ""}${esc(m.detail)}</div></div>
    </li>`).join("") || `<li class="m-act">Nobody matches. Very lurky of them.</li>`;
  $("#onlineCount").textContent = MEMBERS.filter(m => m.st !== "offline").length;
  renderVoice(); renderGames();
}
function renderVoice(){
  $("#voice").innerHTML = VOICES.map(v => {
    const who = MEMBERS.filter(m => m.voice === v);
    return `<li><div class="vc">🔊 ${esc(v)} <span>${who.length ? who.length + " in" : "empty"}</span></div>
      <div class="who">${who.map(m => `<span class="${talking.has(m.n) ? "talking" : ""}"><i class="dot online"></i>${esc(m.n)}</span>`).join("")}</div></li>`;
  }).join("");
}
function renderGames(){
  const counts = {};
  MEMBERS.forEach(m => m.game && (counts[m.game] = (counts[m.game] || 0) + 1));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = top[0] ? top[0][1] : 1;
  $("#games").innerHTML = top.map(([g, c]) => `<li><span class="gname">${esc(g)}</span><span class="gbar"><i style="width:${c / max * 100}%"></i></span><span class="mono">${c}</span></li>`).join("");
}
function ago(){ const d = new Date(); return d.toTimeString().slice(0, 5); }
tick = function(msg){
  const li = document.createElement("li");
  li.innerHTML = `<time>${ago()}</time>${msg}`;
  const t = $("#ticker"); t.prepend(li);
  while (t.children.length > 12) t.lastChild.remove();
}
$$(".filters .chip").forEach(c => c.addEventListener("click", () => {
  $$(".filters .chip").forEach(x => x.classList.toggle("on", x === c)); filter = c.dataset.filter; renderMembers();
}));
// seed + simulate
for (let i = 0; i < 6; i++) tick(ACTIVITY[i % ACTIVITY.length](MEMBERS[(i * 5) % MEMBERS.length].n));
renderMembers();
const rnd = a => a[Math.floor(Math.random() * a.length)];
setInterval(() => {
  // voice "talking" rings
  talking = new Set(MEMBERS.filter(m => m.voice && Math.random() < .35).map(m => m.n));
  renderVoice();
}, 1500);
setInterval(() => {
  const m = rnd(MEMBERS);
  const r = Math.random();
  if (r < .3) { m.voice = m.voice ? null : rnd(VOICES); tick(m.voice ? `<b>${esc(m.n)}</b> hopped into 🔊 ${esc(m.voice)}` : `<b>${esc(m.n)}</b> left voice`); }
  else if (r < .55) { m.game = rnd(GAMES_POOL); m.detail = "just launched"; m.st = "online"; tick(`<b>${esc(m.n)}</b> started <b>${esc(m.game)}</b>`); }
  else if (r < .7) { m.st = m.st === "idle" ? "online" : "idle"; tick(`<b>${esc(m.n)}</b> is ${m.st === "idle" ? "away" : "back"}`); }
  else tick(rnd(ACTIVITY)(esc(m.n)));
  renderMembers(m.n);
}, 4200);
}

/* ---------- STUDIO projects ---------- */
if (has("#projects")) {
const PROJECTS = [
  { t: "Skip & Buster", s: "playtesting", c: "#8DBAB8", d: "Two goofballs, one very bad plan. A playable thing you can already break.", m: "Guild members get early builds in Discord. Bugs reported count as glow." },
  { t: "Project Gray", s: "worldbuilding", c: "#5f7f8f", d: "A gray-skied fantasy where the color has to be earned back. That's all we're saying.", m: "Lore drops happen in the forums first. Theories encouraged. Being right is not." },
  { t: "Lurker Shorts", s: "in production", c: "#F5E3BD", d: "Tiny animated bits starring our anglerfish. He's friendly. He has a lot of teeth.", m: "Watch for the intro sting on our channels. Lurker approves of nothing and everything." },
  { t: "Forever Progress Addon", s: "idea", c: "#c9ced3", d: "Alt-wide WoW Forever completion plus guild-synced \"what we still need.\" Not another Questie.", m: "Stub only for now. The idea lives on the Tools page." },
  { t: "Something Tabletop", s: "rolling dice", c: "#a58f6b", d: "A one-shot system we keep playing on Friday nights until it turns into a real thing.", m: "Want in on the playtest table? Ask in #tabletop on the Discord." },
];
$("#statProjects").textContent = PROJECTS.length;
$("#projects").innerHTML = PROJECTS.map((p, i) => `
  <button class="panel card" style="--c:${p.c}" aria-expanded="false" data-i="${i}">
    <div class="art" aria-hidden="true"></div>
    <span class="status">● ${esc(p.s)}</span>
    <h3>${esc(p.t)}</h3>
    <p>${esc(p.d)}</p>
    <p class="more">${esc(p.m)}</p>
  </button>`).join("");
$$("#projects .card").forEach(c => c.addEventListener("click", () => {
  const open = !c.classList.contains("open"); c.classList.toggle("open", open); c.setAttribute("aria-expanded", open);
}));
}

/* ---------- GUILD: Friday countdown + RSVP ---------- */
// Placeholder schedule: Fridays 8 PM America/New_York.
function nextFriday(){
  const now = new Date();
  const ny = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const offset = now - ny; // local-vs-NY skew
  const t = new Date(ny); t.setHours(20, 0, 0, 0);
  let add = (5 - ny.getDay() + 7) % 7;
  if (add === 0 && ny >= t) add = 7;
  t.setDate(t.getDate() + add);
  return new Date(t.getTime() + offset);
}
function renderCountdown(){
  const tgt = nextFriday(), ms = tgt - new Date();
  const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
  $("#countdown").textContent = ms < 0 ? "it's on now" : `${d}d ${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`;
  $("#countdownWhen").textContent = tgt.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
}
if (has("#countdown")) { renderCountdown(); setInterval(renderCountdown, 1000); }
const rsvpBtn = $("#rsvpBtn");
if (rsvpBtn) {
const renderRsvp = () => { rsvpBtn.setAttribute("aria-pressed", S.rsvp); rsvpBtn.textContent = S.rsvp ? "✓ You're in. Lurker saved you a rock." : "I'll be there"; };
renderRsvp();
rsvpBtn.addEventListener("click", () => { S.rsvp = !S.rsvp; save(); renderRsvp(); if (S.rsvp) { quest("rsvp"); badge("rsvp"); tick(`<b>you</b> RSVP'd to Friday Hang`); } });
}

/* ---------- FORUMS (preview, local only) ---------- */
if (has("#boards")) {
const BOARDS = [
  { id: "rocks", name: "The Rocks", desc: "general hangout" },
  { id: "lfg",   name: "LFG",       desc: "find a group" },
  { id: "build", name: "Build Logs", desc: "studio + member projects" },
  { id: "lore",  name: "Lore Hole", desc: "theories, worldbuilding" },
];
const REACTS = [["✨","spark"],["🪨","rock and stone"],["😂","lol"],["🐟","lurker approves"]];
const THREADS = [
  { id: 1, b: "rocks", pin: true, t: "Welcome to the dark. Say hi.", a: "Lurker", r: "Lightbearer", xp: 120, posts: [
    { a: "Lurker", r: "Lightbearer", x: "You found the place. Tell us what you're playing, what you're making, or what snack you're eating right now. Wrong answers only.", re: { "✨": 14, "🐟": 9 } },
    { a: "Cass", r: "Lurker", x: "Stardew, year 3, and I would die for this one chicken.", re: { "😂": 6, "✨": 3 } },
    { a: "Grimbolt", r: "Lightbearer", x: "Hi. I tank. I will not stand in the fire. (I will stand in the fire.)", re: { "🪨": 4 } },
  ]},
  { id: 2, b: "lfg", t: "Thursday +10s, need a healer who forgives", a: "Nyx", r: "Beacon", xp: 45, posts: [
    { a: "Nyx", r: "Beacon", x: "Chill keys, 9 PM ET. We time some. We deplete some. Vibes over ilvl.", re: { "✨": 5 } },
    { a: "Hollowfin", r: "Beacon", x: "I'll bring the resto shaman and zero judgment.", re: { "✨": 3, "🐟": 2 } },
  ]},
  { id: 3, b: "build", t: "Skip & Buster 0.3: please break it", a: "Skippy", r: "Beacon", xp: 80, posts: [
    { a: "Skippy", r: "Beacon", x: "New build is in #playtest on Discord. Known issue: Buster can clip into the moon. Unknown issues: your job.", re: { "✨": 11, "😂": 7 } },
    { a: "pixel_ghoul", r: "Glimmer", x: "Buster in the moon is canon now, sorry.", re: { "😂": 12 } },
  ]},
  { id: 4, b: "lore", t: "Why is everything gray in Project Gray? (theories)", a: "MossyDice", r: "Glimmer", xp: 60, posts: [
    { a: "MossyDice", r: "Glimmer", x: "My theory: somebody stole the color and Lurker has it in the lure. Prove me wrong.", re: { "🐟": 8, "✨": 4 } },
  ]},
  { id: 5, b: "rocks", t: "Post your desk setup (cables optional, shame mandatory)", a: "Wren", r: "Drifter", xp: 30, posts: [
    { a: "Wren", r: "Drifter", x: "Mine has three keyboards. I use one.", re: { "😂": 5 } },
  ]},
  { id: 6, b: "lfg", t: "Tabletop one-shot this Friday, 2 seats left", a: "Ozzie", r: "Glimmer", xp: 40, posts: [
    { a: "Ozzie", r: "Glimmer", x: "Spooky fishing village. You will not be eaten. Probably.", re: { "✨": 6, "🐟": 3 } },
  ]},
];
// merge any posts the visitor made earlier
THREADS.forEach(t => (S.myPosts[t.id] || []).forEach(p => t.posts.push(p)));
let board = "rocks";
$("#boards").innerHTML = BOARDS.map(b => `<button role="tab" aria-selected="${b.id === board}" data-b="${b.id}" title="${esc(b.desc)}">${esc(b.name)}</button>`).join("");
$$("#boards button").forEach(btn => btn.addEventListener("click", () => {
  board = btn.dataset.b; $$("#boards button").forEach(x => x.setAttribute("aria-selected", x === btn)); closeThread(); renderThreads();
}));
const sparkTotal = t => t.posts.reduce((a, p) => a + Object.values(p.re || {}).reduce((x, y) => x + y, 0), 0);
function renderThreads(){
  const list = THREADS.filter(t => t.b === board).sort((a, b) => (b.pin|0) - (a.pin|0));
  $("#threads").innerHTML = list.map(t => `
    <li><button class="thread" data-id="${t.id}">
      <span class="t-title">${t.pin ? '<span class="pin">PINNED</span>' : ""}${esc(t.t)}</span>
      <span class="t-nums"><span>💬 <b>${t.posts.length}</b></span><span>✨ <b>${sparkTotal(t)}</b></span></span>
      <span class="t-meta">by ${esc(t.a)} · ${esc(t.r)} · +${t.xp} glow earned</span>
    </button></li>`).join("");
  $$("#threads .thread").forEach(b => b.addEventListener("click", () => openThread(+b.dataset.id)));
}
function openThread(id){
  const t = THREADS.find(t => t.id === id);
  const v = $("#threadView");
  v.innerHTML = `
    <button class="btn small back">← back to ${esc(BOARDS.find(b => b.id === t.b).name)}</button>
    <h3>${esc(t.t)}</h3>
    ${t.posts.map((p, i) => `
      <div class="post">
        <span class="avatar" style="background:${colorOf(p.a)}">${initials(p.a)}</span>
        <div>
          <div class="p-head"><b>${esc(p.a)}</b><span class="m-rank">${esc(p.r)}</span>${p.mine ? '<span class="mono dim">(you · saved in this browser)</span>' : ""}</div>
          <p>${esc(p.x)}</p>
          <div class="reacts">${REACTS.map(([e, label]) => {
            const k = `${t.id}:${i}:${e}`, mine = !!S.myReacts[k];
            return `<button class="react" aria-pressed="${mine}" data-k="${k}" data-i="${i}" data-e="${e}" aria-label="${label}">${e} ${(p.re?.[e] || 0) + (mine ? 1 : 0)}</button>`;
          }).join("")}</div>
        </div>
      </div>`).join("")}
    <form class="reply">
      <label for="replyBox" class="mono dim">reply (+10 glow, first post +25)</label>
      <textarea id="replyBox" maxlength="600" placeholder="Say something. Lurker is listening." required></textarea>
      <div class="row"><span class="mono dim tiny">preview only: posts stay in your browser</span><button class="btn small" type="submit">Post</button></div>
    </form>`;
  $("#threads").hidden = true; v.hidden = false;
  $(".back", v).addEventListener("click", closeThread);
  $$(".react", v).forEach(b => b.addEventListener("click", () => react(t, b)));
  $(".reply", v).addEventListener("submit", e => {
    e.preventDefault();
    const text = $("#replyBox").value.trim(); if (!text) return;
    const p = { a: "you", r: rankFor(S.xp).name, x: text, re: {}, mine: true };
    t.posts.push(p); (S.myPosts[t.id] = S.myPosts[t.id] || []).push(p);
    S.posts++; save();
    if (!S.quests.post) { quest("post"); badge("first-post"); } else addXP(10, "Posted a reply");
    tick(`<b>you</b> replied in "${esc(t.t)}"`);
    openThread(t.id); renderMe();
  });
  v.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
}
function react(t, b){
  const k = b.dataset.k;
  if (S.myReacts[k]) { delete S.myReacts[k]; if (b.dataset.e === "✨") S.sparks++; }
  else {
    if (b.dataset.e === "✨") {
      if (S.sparks <= 0) { toast("Out of sparks", "You get 10 fresh sparks each day you visit. Keep your streak going."); return; }
      S.sparks--; S.given++; quest("spark"); if (S.given >= 5) badge("sparky");
    }
    S.myReacts[k] = true;
  }
  save(); renderMe();
  const i = +b.dataset.i, e = b.dataset.e, mine = !!S.myReacts[k];
  b.setAttribute("aria-pressed", mine);
  b.textContent = `${e} ${(t.posts[i].re?.[e] || 0) + (mine ? 1 : 0)}`;
}
function closeThread(){ $("#threadView").hidden = true; $("#threads").hidden = false; renderThreads(); }
renderThreads();
}

/* ---------- WIKI category filter (wiki index only; search is UI-only) ---------- */
if (has("[data-cat-filter]")) {
  const apply = cat => {
    $$(".wiki-card").forEach(c => c.hidden = cat !== "all" && c.dataset.cat !== cat);
    $$("[data-cat-filter]").forEach(a => a.classList.toggle("on", a.dataset.catFilter === cat));
  };
  $$("[data-cat-filter]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); apply(a.dataset.catFilter); history.replaceState(null, "", "#" + a.dataset.catFilter); }));
  const h = location.hash.slice(1); if (["lore","community"].includes(h)) apply(h); else apply("all");
}

/* ---------- boot ---------- */
if (document.body.dataset.questPage) quest(document.body.dataset.questPage);
$("#yr").textContent = new Date().getFullYear();
renderHUD(); save();
if (S.streak > 1) setTimeout(() => toast(`${S.streak}-day streak`, "Back in the dark again. Lurker noticed."), 2200);
})();
