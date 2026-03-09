const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

const COUNTRY_LANGUAGE_MAP = {
  US: ["English"], GB: ["English"], DE: ["English"], FR: ["French"], ES: ["Spanish"], IT: ["Italian"],
  PL: ["Polish"], TR: ["Turkish"], UA: ["Ukrainian"], RU: ["Russian"], UZ: ["Russian", "Uzbek"],
  KZ: ["Russian", "Kazakh"], CN: ["Chinese"], JP: ["Japanese"], KR: ["Korean"], IN: ["English", "Hindi"],
  BR: ["Portuguese"], SA: ["Arabic"]
};

const RANKS = [
  { minXp: 0, name: "Anfänger", icon: "icons/rank1.png" },
  { minXp: 20, name: "Schüler", icon: "icons/rank2.png" },
  { minXp: 40, name: "Sprachfreund", icon: "icons/rank3.png" },
  { minXp: 60, name: "Experte", icon: "icons/rank4.png" },
  { minXp: 80, name: "Meister", icon: "icons/rank5.png" },
  { minXp: 100, name: "Legende", icon: "icons/rank6.png" }
];

const CHEST_CONFIG = {
  bronze: { label: "Bronze Chest", emoji: "🟤", rewards: [{ xp: 5, chance: 70 }, { xp: 10, chance: 25 }, { xp: 20, chance: 5 }] },
  silver: { label: "Silver Chest", emoji: "⚪", rewards: [{ xp: 10, chance: 50 }, { xp: 20, chance: 40 }, { xp: 50, chance: 10 }] },
  gold: { label: "Gold Chest", emoji: "🟡", rewards: [{ xp: 20, chance: 50 }, { xp: 50, chance: 30 }, { xp: 100, chance: 20 }] },
  legendary: { label: "Legendary Chest", emoji: "🟣", rewards: [{ xp: 50, chance: 60 }, { xp: 100, chance: 30 }, { xp: 200, chance: 10 }] }
};
const DAILY_CHEST_LIMIT = 3;
const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const BASE_WORDS = [
  { german: "der Apfel", translation: { English: "apple", Russian: "яблоко", French: "pomme", Spanish: "manzana", Italian: "mela", Turkish: "elma", Ukrainian: "яблуко", Polish: "jabłko", Portuguese: "maçã", Arabic: "تفاحة", Chinese: "苹果", Japanese: "りんご", Korean: "사과", Hindi: "सेब", Uzbek: "olma", Kazakh: "алма" } },
  { german: "das Haus", translation: { English: "house", Russian: "дом", French: "maison", Spanish: "casa", Italian: "casa", Turkish: "ev", Ukrainian: "будинок", Polish: "dom", Portuguese: "casa", Arabic: "منزل", Chinese: "房子", Japanese: "家", Korean: "집", Hindi: "घर", Uzbek: "uy", Kazakh: "үй" } },
  { german: "das Wasser", translation: { English: "water", Russian: "вода", French: "eau", Spanish: "agua", Italian: "acqua", Turkish: "su", Ukrainian: "вода", Polish: "woda", Portuguese: "água", Arabic: "ماء", Chinese: "水", Japanese: "水", Korean: "물", Hindi: "पानी", Uzbek: "suv", Kazakh: "су" } },
  { german: "der Baum", translation: { English: "tree", Russian: "дерево", French: "arbre", Spanish: "árbol", Italian: "albero", Turkish: "ağaç", Ukrainian: "дерево", Polish: "drzewo", Portuguese: "árvore", Arabic: "شجرة", Chinese: "树", Japanese: "木", Korean: "나무", Hindi: "पेड़", Uzbek: "daraxt", Kazakh: "ағаш" } },
  { german: "die Schule", translation: { English: "school", Russian: "школа", French: "école", Spanish: "escuela", Italian: "scuola", Turkish: "okul", Ukrainian: "школа", Polish: "szkoła", Portuguese: "escola", Arabic: "مدرسة", Chinese: "学校", Japanese: "学校", Korean: "학교", Hindi: "स्कूल", Uzbek: "maktab", Kazakh: "мектеп" } }
];

const SYN_ANT = [
  { word: "schnell", mode: "syn", correct: "rasch", options: ["rasch", "langsam", "klein", "billig"] },
  { word: "groß", mode: "syn", correct: "riesig", options: ["klein", "riesig", "alt", "eng"] },
  { word: "schön", mode: "syn", correct: "hübsch", options: ["hübsch", "dunkel", "spät", "eng"] },
  { word: "glücklich", mode: "ant", correct: "traurig", options: ["fröhlich", "traurig", "mutig", "warm"] },
  { word: "kalt", mode: "ant", correct: "warm", options: ["warm", "nass", "kurz", "heiß"] },
  { word: "neu", mode: "ant", correct: "alt", options: ["lang", "alt", "teuer", "ruhig"] }
];

const state = {
  firebaseReady: false,
  auth: null,
  db: null,
  user: null,
  profile: { name: "Гость", xp: 0, streak: 0, dailyCorrect: 0, chests: 0, lang: "English", cefrLevel: "A1", dailyChestCount: 0, chestDayKey: "" },
  currentWord: null,
  duel: { roomId: null, words: [], index: 0, score: 0, startTime: 0, timer: null },
  myWords: [],
  words: [...BASE_WORDS],
  pendingChestReward: null
};



const particleFx = {
  canvas: null,
  ctx: null,
  stars: [],
  bursts: [],
  w: 0,
  h: 0
};
const $ = (id) => document.getElementById(id);
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const todayKey = () => new Date().toISOString().slice(0, 10);

function safeAudioPlay(audioEl) {
  audioEl?.play?.().catch(() => {});
}

function getRank(xp) {
  return [...RANKS].reverse().find((r) => xp >= r.minXp) || RANKS[0];
}

function getDetectedLanguages() {
  const locale = navigator.language || "en-US";
  const cc = locale.split("-")[1]?.toUpperCase() || "US";
  return COUNTRY_LANGUAGE_MAP[cc] || ["English"];
}

function initFirebase() {
  const looksConfigured = !Object.values(firebaseConfig).some((v) => String(v).includes("YOUR_"));
  if (!looksConfigured || typeof firebase === "undefined") return;
  firebase.initializeApp(firebaseConfig);
  firebase.analytics();
  state.auth = firebase.auth();
  state.db = firebase.firestore();
  state.firebaseReady = true;
}

async function signIn(type) {
  if (state.firebaseReady) {
    if (type === "google") return state.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    if (type === "facebook") return state.auth.signInWithPopup(new firebase.auth.FacebookAuthProvider());
    if (type === "email") {
      const email = prompt("Email:", "player@r1ntax.dev");
      const pass = prompt("Password (min 6):", "123456");
      if (!email || !pass) return;
      try { await state.auth.signInWithEmailAndPassword(email, pass); }
      catch { await state.auth.createUserWithEmailAndPassword(email, pass); }
      return;
    }
    if (type === "phone") return alert("Phone auth требует reCAPTCHA и настройки провайдера Firebase.");
    if (type === "telegram") return alert("Telegram login реализован как demo-кнопка (через custom token backend)." );
  }

  state.user = {
    uid: "local-user",
    displayName: `${type.toUpperCase()} Player`
  };
  localStorage.setItem("r1ntaxUser", JSON.stringify(state.user));
  await loadProfile();
  onLoginComplete();
}

async function loadProfile() {
  if (state.firebaseReady && state.auth.currentUser) {
    state.user = state.auth.currentUser;
    const ref = state.db.collection("users").doc(state.user.uid);
    const snap = await ref.get();
    const defaults = {
      name: state.user.displayName || state.user.email || "Spieler",
      xp: 0,
      streak: 0,
      chests: 0,
      dailyCorrect: 0,
      lastActiveDate: todayKey(),
      lang: getDetectedLanguages()[0],
      cefrLevel: "A1",
      chestInventory: { bronze: 0, silver: 0, gold: 0, legendary: 0 },
      dailyChestCount: 0,
      chestDayKey: todayKey()
    };
    if (!snap.exists) await ref.set(defaults);
    state.profile = { ...defaults, ...(snap.exists ? snap.data() : {}) };
    return;
  }

  const saved = JSON.parse(localStorage.getItem("r1ntaxProfile") || "null");
  state.profile = saved || {
    name: state.user?.displayName || "Local Spieler",
    xp: 0,
    streak: 0,
    chests: 0,
    dailyCorrect: 0,
    lastActiveDate: todayKey(),
    lang: getDetectedLanguages()[0],
    cefrLevel: "A1",
    chestInventory: { bronze: 0, silver: 0, gold: 0, legendary: 0 },
    dailyChestCount: 0,
    chestDayKey: todayKey()
  };
}

async function saveProfile() {
  if (state.firebaseReady && state.user?.uid) {
    await state.db.collection("users").doc(state.user.uid).set(state.profile, { merge: true });
  } else {
    localStorage.setItem("r1ntaxProfile", JSON.stringify(state.profile));
  }
}


async function syncChestAndXpCollections(reason = "update") {
  if (!state.firebaseReady || !state.user?.uid) return;
  const uid = state.user.uid;
  await state.db.collection("user_xp").doc(uid).set({ uid, xp: state.profile.xp, updatedAt: Date.now(), reason }, { merge: true });
  await state.db.collection("user_chests").doc(uid).set({
    uid,
    chestInventory: state.profile.chestInventory,
    total: chestTotal(state.profile.chestInventory),
    dailyChestCount: state.profile.dailyChestCount,
    chestDayKey: state.profile.chestDayKey,
    updatedAt: Date.now(),
    reason
  }, { merge: true });
}

function chestTotal(inv = {}) {
  return (inv.bronze || 0) + (inv.silver || 0) + (inv.gold || 0) + (inv.legendary || 0);
}

function ensureChestDailyReset() {
  const today = todayKey();
  if (state.profile.chestDayKey !== today) {
    state.profile.chestDayKey = today;
    state.profile.dailyChestCount = 0;
  }
}

function refreshProfileUI() {
  const rank = getRank(state.profile.xp);
  $("playerName").textContent = state.profile.name;
  $("rankName").textContent = rank.name;
  $("xpValue").textContent = state.profile.xp;
  $("rankIcon").src = rank.icon;
  $("streakValue").textContent = state.profile.streak;
  $("dailyValue").textContent = `${state.profile.dailyCorrect}/10`;
  state.profile.chestInventory = state.profile.chestInventory || { bronze: 0, silver: 0, gold: 0, legendary: 0 };
  state.profile.chests = chestTotal(state.profile.chestInventory);
  $("chestValue").textContent = state.profile.chests;
  ["bronze", "silver", "gold", "legendary"].forEach((t) => { const el = $(`${t}Count`); if (el) el.textContent = `x${state.profile.chestInventory[t] || 0}`; });
  $("langDisplay").textContent = `German → ${state.profile.lang}`;
}

async function adjustXP(delta) {
  state.profile.xp = Math.max(0, state.profile.xp + delta);
  if (delta > 0) state.profile.dailyCorrect += 1;
  if (state.profile.dailyCorrect >= 10) {
    state.profile.dailyCorrect = 0;
    await maybeGrantChest("daily");
  }
  await saveProfile();
  await syncChestAndXpCollections("xp_change");
  refreshProfileUI();
}

function getWordTranslation(word, lang) {
  return word.translation[lang] || word.translation.English;
}

function getWordsPool() {
  const level = state.profile.cefrLevel || "A1";
  const leveled = state.words.filter((w) => (w.level || "A1") === level);
  if (leveled.length >= 4) return leveled;
  return state.words.length >= 4 ? state.words : BASE_WORDS;
}

function normalizeWordDoc(data) {
  if (!data || typeof data.german !== "string") return null;
  const translation = data.translation || data.translations;
  if (!translation || typeof translation !== "object") return null;
  const level = CEFR_LEVELS.includes(data.level) ? data.level : "A1";
  return { german: data.german.trim(), translation, level };
}

async function loadGlobalWordsDB() {
  if (!state.firebaseReady || !state.db) return;
  try {
    // Firestore path for shared dictionary:
    // collection: words
    // doc fields: german: string, level: A1..C2, translation: { English: "...", Russian: "..." }
    const snap = await state.db.collection("words").limit(5000).get();
    const fromDb = snap.docs
      .map((d) => normalizeWordDoc(d.data()))
      .filter(Boolean);

    if (fromDb.length >= 4) {
      state.words = fromDb;
      console.info(`[R1ntax] Loaded ${fromDb.length} words from Firestore /words`);
      if (fromDb.length < 3000) console.warn("[R1ntax] Рекомендуется загрузить 3000+ слов в коллекцию words.");
    } else {
      console.warn("[R1ntax] Firestore /words has too few valid docs, using local BASE_WORDS fallback.");
    }
  } catch (err) {
    console.warn("[R1ntax] Could not load Firestore /words, using local BASE_WORDS fallback.", err);
  }
}

function weightedReward(rewards) {
  const roll = Math.random() * 100;
  let acc = 0;
  for (const item of rewards) {
    acc += item.chance;
    if (roll <= acc) return item.xp;
  }
  return rewards[rewards.length - 1].xp;
}

async function maybeGrantChest(source = "random") {
  ensureChestDailyReset();
  if (state.profile.dailyChestCount >= DAILY_CHEST_LIMIT) return;

  const dropChance = { daily: 100, streak: 60, duel_win: 70, random: 18 }[source] ?? 20;
  if (Math.random() * 100 > dropChance) return;

  const roll = Math.random() * 100;
  const type = roll < 55 ? "bronze" : roll < 82 ? "silver" : roll < 96 ? "gold" : "legendary";
  state.profile.chestInventory = state.profile.chestInventory || { bronze: 0, silver: 0, gold: 0, legendary: 0 };
  state.profile.chestInventory[type] = (state.profile.chestInventory[type] || 0) + 1;
  state.profile.dailyChestCount += 1;
  await saveProfile();
  await syncChestAndXpCollections(`grant_${source}`);
  refreshProfileUI();
}

async function openChest(type) {
  const inv = state.profile.chestInventory || {};
  if (!inv[type]) return;
  inv[type] -= 1;
  const xp = weightedReward(CHEST_CONFIG[type].rewards);
  state.pendingChestReward = xp;

  const visual = $("chestVisual");
  const area = $("chestOpenArea");
  area.classList.remove("hidden");
  visual.textContent = CHEST_CONFIG[type].emoji;
  visual.classList.remove("chest-shake", "chest-open", "chest-glow");
  void visual.offsetWidth;
  visual.classList.add("chest-shake");
  setTimeout(() => visual.classList.add("chest-glow"), 280);
  setTimeout(() => { visual.classList.remove("chest-shake"); visual.classList.add("chest-open"); }, 700);
  setTimeout(() => outcomeAnimation(visual, true), 880);

  $("chestResult").textContent = `You received +${xp} XP`;
  $("collectChestRewardBtn").classList.remove("hidden");

  await saveProfile();
  await syncChestAndXpCollections(`open_${type}`);
  if (state.firebaseReady && state.user?.uid) {
    await state.db.collection("opened_chests").add({
      uid: state.user.uid,
      chestType: type,
      rewardXp: xp,
      openedAt: Date.now()
    });
  }
  refreshProfileUI();
}

async function collectChestReward() {
  if (!state.pendingChestReward) return;
  const reward = state.pendingChestReward;
  state.pendingChestReward = null;
  $("collectChestRewardBtn").classList.add("hidden");
  await adjustXP(reward);
  await syncChestAndXpCollections("collect_reward");
}

function renderOptions(container, options, onClick) {
  container.innerHTML = "";
  options.forEach((text) => {
    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = text;
    b.onclick = () => onClick(text, b);
    container.appendChild(b);
  });
}



function spawnBurst(x, y, color = "#8fd3ff", amount = 18) {
  for (let i = 0; i < amount; i += 1) {
    const angle = (Math.PI * 2 * i) / amount;
    const speed = Math.random() * 1.6 + 0.8;
    particleFx.bursts.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: Math.random() * 28 + 24,
      size: Math.random() * 2.5 + 1.2,
      color
    });
  }
}

function outcomeAnimation(target, ok = true) {
  const rect = target.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  spawnBurst(x, y, ok ? "#74ffb6" : "#ff7390", ok ? 22 : 14);
}
function launchCardsMode() {
  const pool = getWordsPool();
  const word = pool[Math.floor(Math.random() * pool.length)];
  state.currentWord = word;
  $("wordCard").textContent = word.german;
  const correct = getWordTranslation(word, state.profile.lang);
  const wrongs = shuffle(pool.filter((w) => w.german !== word.german)).slice(0, 3).map((w) => getWordTranslation(w, state.profile.lang));
  const variants = shuffle([correct, ...wrongs]);
  renderOptions($("cardOptions"), variants, async (answer) => {
    const feedback = $("cardFeedback");
    if (answer === correct) {
      feedback.className = "feedback ok";
      feedback.textContent = "✅ Верно! +1 XP";
      $("wordCard").classList.add("flash-ok");
      outcomeAnimation($("wordCard"), true);
      safeAudioPlay($("correctSound"));
      await adjustXP(1);
      maybeGrantChest("random");
      setTimeout(() => { $("wordCard").classList.remove("flash-ok"); launchCardsMode(); }, 500);
    } else {
      feedback.className = "feedback bad";
      feedback.textContent = "❌ Неверно. -3 XP. Попробуйте снова.";
      $("wordCard").classList.add("flash-bad");
      outcomeAnimation($("wordCard"), false);
      safeAudioPlay($("wrongSound"));
      await adjustXP(-3);
      setTimeout(() => $("wordCard").classList.remove("flash-bad"), 500);
    }
  });
}

async function loadMyWords() {
  if (state.firebaseReady && state.user?.uid) {
    const snap = await state.db.collection("myWords").where("owner", "==", state.user.uid).limit(50).get();
    state.myWords = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } else {
    state.myWords = JSON.parse(localStorage.getItem("r1ntaxMyWords") || "[]");
  }
  renderMyWords();
}

function renderMyWords() {
  const box = $("myWordsList");
  box.innerHTML = "";
  state.myWords.forEach((w, i) => {
    const row = document.createElement("div");
    row.className = "list-item";
    row.textContent = `${i + 1}. ${w.german} → ${w.translation}`;
    box.appendChild(row);
  });
}

async function addMyWord() {
  const german = $("myGerman").value.trim();
  const translation = $("myTranslation").value.trim();
  if (!german || !translation) return;
  if (state.myWords.length >= 50) return alert("Лимит 50 слов достигнут.");
  const entry = { german, translation, owner: state.user?.uid || "local-user", createdAt: Date.now() };
  if (state.firebaseReady && state.user?.uid) {
    await state.db.collection("myWords").add(entry);
  } else {
    state.myWords.push(entry);
    localStorage.setItem("r1ntaxMyWords", JSON.stringify(state.myWords));
  }
  $("myGerman").value = "";
  $("myTranslation").value = "";
  await loadMyWords();
}

function launchWordRelationMode(mode = "syn") {
  const task = SYN_ANT.filter((x) => x.mode === mode)[Math.floor(Math.random() * SYN_ANT.filter((x) => x.mode === mode).length)];
  const taskEl = mode === "syn" ? $("synTask") : $("antTask");
  const wordEl = mode === "syn" ? $("synWord") : $("antWord");
  const optionsEl = mode === "syn" ? $("synOptions") : $("antOptions");
  const feedbackEl = mode === "syn" ? $("synFeedback") : $("antFeedback");

  taskEl.textContent = mode === "syn" ? "Выберите синоним" : "Выберите антоним";
  wordEl.textContent = task.word;
  renderOptions(optionsEl, shuffle(task.options), async (ans) => {
    if (ans === task.correct) {
      feedbackEl.className = "feedback ok";
      feedbackEl.textContent = "Правильно! +1 XP";
      wordEl.classList.add("flash-ok");
      outcomeAnimation(wordEl, true);
      safeAudioPlay($("correctSound"));
      await adjustXP(1);
    } else {
      feedbackEl.className = "feedback bad";
      feedbackEl.textContent = "Неправильно! -3 XP";
      wordEl.classList.add("flash-bad");
      outcomeAnimation(wordEl, false);
      safeAudioPlay($("wrongSound"));
      await adjustXP(-3);
    }
    setTimeout(() => { wordEl.classList.remove("flash-ok", "flash-bad"); launchWordRelationMode(mode); }, 650);
  });
}

async function runDuelMockOrOnline() {

  $("duelInfo").textContent = "Поиск соперника...";
  state.duel.words = shuffle(getWordsPool()).slice(0, 5);
  state.duel.index = 0;
  state.duel.score = 0;
  state.duel.startTime = performance.now();
  playDuelQuestion();
}

function playDuelQuestion() {
  const current = state.duel.words[state.duel.index];
  if (!current) {
    const elapsed = ((performance.now() - state.duel.startTime) / 1000).toFixed(1);
    const bonus = Math.max(0, 8 - Number(elapsed));
    const total = state.duel.score + bonus;
    $("duelInfo").textContent = `Финиш! Очки: ${state.duel.score} + speed bonus ${bonus}. Итого: ${total}`;
    adjustXP(Math.max(1, Math.round(total / 4)));
    if (total >= 8) maybeGrantChest("duel_win");
    saveDuelResult(total, elapsed);
    $("duelQuestion").classList.add("hidden");
    return;
  }

  const correct = getWordTranslation(current, state.profile.lang);
  $("duelQuestion").classList.remove("hidden");
  $("duelQuestion").textContent = `(${state.duel.index + 1}/5) ${current.german}`;
  $("duelInfo").textContent = "Дуэль идёт: таймер активен.";
  const wrongs = shuffle(getWordsPool().filter((w) => w.german !== current.german)).slice(0, 3).map((w) => getWordTranslation(w, state.profile.lang));
  renderOptions($("duelOptions"), shuffle([correct, ...wrongs]), (ans) => {
    if (ans === correct) state.duel.score += 2;
    state.duel.index += 1;
    playDuelQuestion();
  });
}

async function saveDuelResult(score, elapsedSec) {
  const record = {
    owner: state.user?.uid || "local-user",
    score,
    elapsedSec,
    at: Date.now()
  };
  if (state.firebaseReady && state.user?.uid) await state.db.collection("duels").add(record);
}

async function refreshLeaderboard() {
  const board = $("leaderboard");
  board.innerHTML = "";
  let rows = [];

  if (state.firebaseReady) {
    const snap = await state.db.collection("users").orderBy("xp", "desc").limit(100).get();
    rows = snap.docs.map((d) => d.data());
  } else {
    rows = [state.profile, ...(JSON.parse(localStorage.getItem("r1ntaxDemoOthers") || "[]"))]
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 100);
  }

  rows.forEach((r, idx) => {
    const rank = getRank(r.xp || 0);
    const item = document.createElement("div");
    item.className = "list-item";
    item.textContent = `${idx + 1}. ${(r.name || "Spieler")} — ${rank.name} — XP ${(r.xp || 0)}`;
    board.appendChild(item);
  });
}

function showMode(mode) {
  document.querySelectorAll(".mode").forEach((m) => m.classList.add("hidden"));
  if (mode === "cards") { $("cardsMode").classList.remove("hidden"); launchCardsMode(); }
  if (mode === "duel") { $("duelMode").classList.remove("hidden"); }
  if (mode === "myWords") { $("myWordsMode").classList.remove("hidden"); loadMyWords(); }
  if (mode === "syn") { $("synMode").classList.remove("hidden"); launchWordRelationMode("syn"); }
  if (mode === "ant") { $("antMode").classList.remove("hidden"); launchWordRelationMode("ant"); }
  if (mode === "chests") { $("chestsMode").classList.remove("hidden"); refreshProfileUI(); }
}

function populateLanguageSelect() {
  const select = $("manualLanguage");
  const langs = ["English", "French", "Spanish", "Italian", "Polish", "Turkish", "Ukrainian", "Russian", "Uzbek", "Kazakh", "Chinese", "Japanese", "Korean", "Hindi", "Portuguese", "Arabic"];
  select.innerHTML = langs.map((l) => `<option value="${l}">${l}</option>`).join("");
  select.value = state.profile.lang;
}

function updateStreak() {
  const today = todayKey();
  const prev = state.profile.lastActiveDate;
  const oneDay = 24 * 3600 * 1000;
  if (!prev) state.profile.streak = 1;
  else {
    const diff = Math.floor((new Date(today) - new Date(prev)) / oneDay);
    if (diff === 1) { state.profile.streak += 1; if (state.profile.streak % 3 === 0) maybeGrantChest("streak"); }
    else if (diff > 1) state.profile.streak = 1;
  }
  state.profile.lastActiveDate = today;
}



function applyAppearSequence() {
  document.querySelector("header.topbar")?.classList.add("appear-seq");
  document.querySelector(".stats-grid")?.classList.add("appear-seq");
  document.querySelector(".menu-grid")?.classList.add("appear-seq");
  $("leaderboard")?.classList.add("appear-seq");
  document.querySelector("section.settings")?.classList.add("appear-seq");
}
function onLoginComplete() {
  $("authSection").classList.add("hidden");
  $("dashboard").classList.remove("hidden");
  populateLanguageSelect();
  $("cefrLevel").value = state.profile.cefrLevel || "A1";
  refreshProfileUI();
  refreshLeaderboard();
  applyAppearSequence();
}

function initParticles() {
  particleFx.canvas = $("particles");
  particleFx.ctx = particleFx.canvas.getContext("2d");

  function resize() {
    particleFx.w = particleFx.canvas.width = window.innerWidth;
    particleFx.h = particleFx.canvas.height = window.innerHeight;
    particleFx.stars = Array.from({ length: Math.min(170, Math.floor(particleFx.w / 7)) }, () => ({
      x: Math.random() * particleFx.w,
      y: Math.random() * particleFx.h,
      r: Math.random() * 1.9 + 0.2,
      v: Math.random() * 0.25 + 0.06,
      tw: Math.random() * 0.03 + 0.01,
      a: Math.random() * Math.PI * 2
    }));
  }

  function draw() {
    const { ctx, w, h } = particleFx;
    ctx.clearRect(0, 0, w, h);

    particleFx.stars.forEach((s) => {
      s.y += s.v;
      s.a += s.tw;
      if (s.y > h + 2) { s.y = -2; s.x = Math.random() * w; }
      const alpha = 0.35 + (Math.sin(s.a) + 1) * 0.32;
      ctx.fillStyle = `rgba(180,220,255,${alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    particleFx.bursts = particleFx.bursts.filter((p) => p.life > 0);
    particleFx.bursts.forEach((p) => {
      p.life -= 1;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.015;
      const alpha = Math.max(0, p.life / 40);
      ctx.fillStyle = `${p.color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  draw();
}

function attachEvents() {
  document.querySelectorAll(".auth-btn").forEach((b) => b.addEventListener("click", () => signIn(b.dataset.auth)));
  document.querySelectorAll(".mode-btn").forEach((b) => b.addEventListener("click", () => showMode(b.dataset.mode)));
  $("findDuelBtn").addEventListener("click", runDuelMockOrOnline);
  $("addWordBtn").addEventListener("click", addMyWord);
  document.querySelectorAll(".chest-card").forEach((c) => c.addEventListener("click", () => openChest(c.dataset.chest)));
  $("collectChestRewardBtn").addEventListener("click", collectChestReward);

  $("manualLanguage").addEventListener("change", async (e) => {
    state.profile.lang = e.target.value;
    await saveProfile();
    refreshProfileUI();
  });

  $("cefrLevel").addEventListener("change", async (e) => {
    state.profile.cefrLevel = e.target.value;
    await saveProfile();
    if (!$("cardsMode").classList.contains("hidden")) launchCardsMode();
  });

  const bgMusic = $("bgMusic");
  $("musicToggle").addEventListener("click", async () => {
    if (bgMusic.paused) {
      try { await bgMusic.play(); $("musicToggle").textContent = "🎵 Music: ON"; }
      catch { $("musicToggle").textContent = "🎵 Music blocked"; }
    } else {
      bgMusic.pause();
      $("musicToggle").textContent = "🎵 Music: OFF";
    }
  });

  $("logoutBtn").addEventListener("click", async () => {
    if (state.firebaseReady && state.auth.currentUser) await state.auth.signOut();
    state.user = null;
    $("dashboard").classList.add("hidden");
    $("authSection").classList.remove("hidden");
  });
}

async function bootstrap() {
  initFirebase();
  await loadGlobalWordsDB();
  initParticles();
  attachEvents();

  if (state.firebaseReady) {
    state.auth.onAuthStateChanged(async (user) => {
      if (!user) return;
      state.user = user;
      await loadProfile();
      updateStreak();
      await saveProfile();
      onLoginComplete();
    });
  } else {
    const user = JSON.parse(localStorage.getItem("r1ntaxUser") || "null");
    if (user) {
      state.user = user;
      await loadProfile();
      updateStreak();
      await saveProfile();
      onLoginComplete();
    }
  }

  ensureChestDailyReset();
  const detected = getDetectedLanguages();
  $("authHint").textContent = `Автоопределение региона: German → ${detected.join(" / ")}. Можно сменить в настройках.`;
}

bootstrap();
