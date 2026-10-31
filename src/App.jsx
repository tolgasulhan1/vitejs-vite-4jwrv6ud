import { useState, useEffect, useRef, useCallback, useMemo, useId } from "react";

const W = 400;
const H = 500;
const PLAYER_W = 70;
const PLAYER_H = 36;
const BLOCK_SIZE = 44;
const CANDY_COLORS = ["#fb7185", "#fde047", "#c084fc", "#4ade80", "#fb923c", "#22d3ee"];
const SHAPES = ["wrapped", "lolli", "choco", "gummy"];
const SPARKLE_COUNT = 30;
const BULLET_SPEED = 11;
const BASE_FIRE_COOLDOWN = 180;
const CANDY_PTS = 5;
const GOLD_PTS = 25;
const JELLY_PTS = 12;
const COMBO_WINDOW = 1500;
const MAX_COMBO = 5;
const MAX_LIVES = 5;
const BASE_LIVES = 3;
const INVULN_MS = 1200;
const MIN_SPAWN = 16;
const HEART_CHANCE = 0.05;
const POWER_CHANCE = 0.035;
const JELLY_CHANCE = 0.1;
const JELLY_FROM_LEVEL = 8;
const POWER_MS = 6000;
const LEVEL_COUNT = 60;
const NODE_GAP = 96;
const DAILY_REWARD = 25;
const CROWN_REWARD = 100;
const MELODY = [523, 659, 784, 659, 523, 587, 698, 587, 494, 587, 784, 659];
const SAVE_KEY = "candy-save";

const POWERS = {
  multi: { icon: "⚡", name: "Çoklu atış", color: "#fde047" },
  slow: { icon: "🐌", name: "Yavaş zaman", color: "#67e8f9" },
  magnet: { icon: "🧲", name: "Altın mıknatısı", color: "#f9a8d4" },
};

const KING_LINES = [
  "Hoş geldin, genç şövalye! Sarayımın kapıları sana açık.",
  "Krallığım şekerlerin istilası altında. Bana yardım eder misin?",
  "Her taç, bir dünyanın kurtuluşudur. Devam et!",
  "Odalarımı onarırsan saray eskisi gibi parlayacak.",
];

const CSS = `
@keyframes cdFloat { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-8px) rotate(3deg); } }
@keyframes cdWobble { 0%,100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
@keyframes cdBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes cdDrift { 0% { transform: translate(0,0); } 100% { transform: translate(var(--dx), var(--dy)); } }
@keyframes cdTitle { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-6px) scale(1.03); } }
@keyframes cdPop { 0% { transform: scale(0.4); opacity: 0; } 60% { transform: scale(1.12); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
@keyframes cdGlow { 0%,100% { box-shadow: 0 0 10px rgba(253,224,71,0.5); } 50% { box-shadow: 0 0 22px rgba(253,224,71,0.95); } }
@keyframes cdHue { from { filter: hue-rotate(0deg) drop-shadow(0 4px 4px rgba(0,0,0,0.3)); } to { filter: hue-rotate(360deg) drop-shadow(0 4px 4px rgba(0,0,0,0.3)); } }
@keyframes cdShield { 0%,100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.06); opacity: 1; } }
@keyframes cdCurrent { 0%,100% { box-shadow: 0 0 0 0 rgba(244,114,182,0.7); } 50% { box-shadow: 0 0 0 12px rgba(244,114,182,0); } }
@keyframes cdOrb { 0%,100% { transform: scale(1) rotate(0deg); } 50% { transform: scale(1.1) rotate(6deg); } }
@keyframes cdFlag { 0%,100% { transform: skewX(0deg); } 50% { transform: skewX(-10deg); } }
@keyframes cdSparkle { 0%,100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
@keyframes cdBokeh { 0%,100% { transform: translateY(0); opacity: 0.5; } 50% { transform: translateY(-14px); opacity: 0.9; } }
`;

const WORLDS = [
  {
    name: "Tatlı Tarla", icon: "🌸", hero: "Lila", bg: ["#ffe4f1", "#f0abfc", "#8b5cf6"], glow: "#fbcfe8", hills: "#c4b5fd", decor: ["🌸", "🌼", "🦋", "☁️", "🌷"], accent: "#be185d",
    story: "Lila, Tatlı Tarla'nın bekçisi. Bir sabah tarladaki bütün renkli bonbonlar gökyüzüne uçmuş. Onları yakalayıp geri getirmen gerekiyor.",
  },
  {
    name: "Çikolata Nehri", icon: "🍫", hero: "Pofi", bg: ["#fde68a", "#fb923c", "#7c2d12"], glow: "#fef3c7", hills: "#92400e", decor: ["🫧", "💧", "🍯", "🌰", "🫧"], accent: "#7c2d12",
    story: "Nehir çikolatayla doldu ama akıntı çok hızlı. Pofi tekneyle yola çıkıyor, sen de düşen şekerleri patlatarak yolunu açıyorsun.",
  },
  {
    name: "Şeker Fırtınası", icon: "⛈️", hero: "Mira", bg: ["#c4b5fd", "#6366f1", "#1e1b4b"], glow: "#a5b4fc", hills: "#312e81", decor: ["⭐", "✨", "⚡", "☁️", "🌟"], accent: "#4338ca",
    story: "Mira'nın gözlemevinin üstünde şeker fırtınası patlak verdi. Fırtınayı durdurmak için gökteki parlak şekerleri toplaman gerekiyor.",
  },
  {
    name: "Gece Pastanesi", icon: "🌙", hero: "Dolunay", bg: ["#312e81", "#1e1b4b", "#0f172a"], glow: "#c7d2fe", hills: "#1e1b4b", decor: ["🌙", "⭐", "🧁", "✨", "🍰"], accent: "#4f46e5",
    story: "Gece Pastanesi yalnızca ay ışığında açılır. Dolunay, pastaneyi karanlığa gömen jöleleri temizlemen için seni bekliyor.",
  },
  {
    name: "Karamel Kalesi", icon: "🏰", hero: "Kraliçe Tatlı", bg: ["#fef3c7", "#d97706", "#78350f"], glow: "#fde68a", hills: "#92400e", decor: ["🍮", "🏰", "🍯", "🪙", "🍬"], accent: "#92400e",
    story: "Kraliçe Tatlı, kalenin son kapısını açmak için altın şekerlerin tamamını istiyor. Bu son bölüm, tüm krallığın kaderini belirliyor.",
  },
  {
    name: "Yıldız Sahili", icon: "🐚", hero: "Nerea", bg: ["#bae6fd", "#38bdf8", "#0c4a6e"], glow: "#e0f2fe", hills: "#0369a1", decor: ["🐚", "⭐", "🐠", "🌊", "🦀"], accent: "#0369a1",
    story: "Sahilde yıldız şekerler dalgalarla birlikte denize sürüklenmiş. Nerea, kumsaldaki bütün yıldızları geri toplamak için sana yardım istiyor.",
  },
  {
    name: "Buz Kristal Dağı", icon: "❄️", hero: "Eylül", bg: ["#e0f2fe", "#7dd3fc", "#1e3a8a"], glow: "#f0f9ff", hills: "#1e40af", decor: ["❄️", "💎", "🧊", "⛄", "✨"], accent: "#1e40af",
    story: "Dağın zirvesindeki kristal kale donmuş şekerlerle kaplanmış. Eylül, buzu eritecek altın şekerleri toplaman için seni bekliyor.",
  },
  {
    name: "Kurabiye Ormanı", icon: "🍪", hero: "Tarçın", bg: ["#fef3c7", "#d6a86b", "#5b3a1e"], glow: "#fde68a", hills: "#78350f", decor: ["🍪", "🌲", "🦔", "🍂", "🥜"], accent: "#78350f",
    story: "Kurabiye Ormanı'nın ağaçları tatlı meyvelerini kaybetti. Tarçın, ormanın yollarını açmak için düşen şekerlere karşı senin kılavuzluğuna ihtiyaç duyuyor.",
  },
  {
    name: "Lale Vadisi", icon: "🌷", hero: "Zambak", bg: ["#ffe4e6", "#fda4af", "#9f1239"], glow: "#fecdd3", hills: "#be123c", decor: ["🌷", "🌹", "🐝", "🦢", "🌿"], accent: "#be123c",
    story: "Lale Vadisi'nin çiçekleri renklerini yitirdi. Zambak, vadiyi eski haline getirmek için şekerlerin arasından bir yol açmanı istiyor.",
  },
  {
    name: "Kaymak Gölü", icon: "🥛", hero: "Sütlü", bg: ["#fdfcfa", "#e0d7ff", "#4c1d95"], glow: "#ffffff", hills: "#6d28d9", decor: ["🥛", "🦢", "☁️", "🍮", "🌙"], accent: "#6d28d9",
    story: "Göl, kaymak gibi yoğun bir sisle örtülmüş. Sütlü, gölün ortasındaki adayı bulmak için gökyüzünden düşen şekerleri patlatmanı istiyor.",
  },
  {
    name: "Volkan Şekeri", icon: "🌋", hero: "Eda", bg: ["#fecaca", "#f97316", "#450a0a"], glow: "#fed7aa", hills: "#7c2d12", decor: ["🔥", "🌋", "🍬", "💥", "🪨"], accent: "#9a3412",
    story: "Volkan ağzından erimiş karamel fışkırıyor. Eda, püskürmeyi durdurmak için düşen ateş şekerlerini hızla patlatmanı istiyor.",
  },
  {
    name: "Gökkuşağı Köprüsü", icon: "🌈", hero: "Renkli Ozan", bg: ["#fdf4ff", "#c084fc", "#312e81"], glow: "#f5d0fe", hills: "#4338ca", decor: ["🌈", "🦄", "⭐", "🎈", "💫"], accent: "#7e22ce",
    story: "Gökkuşağı köprüsü parçalara ayrılmış. Renkli Ozan, köprünün her rengini şekerlerle yeniden örmek için senin yanında olacak.",
  },
];

const OBJECTIVES = ["score", "gold", "survive"];

function levelConfig(n) {
  const world = WORLDS[Math.min(WORLDS.length - 1, Math.floor((n - 1) / 5))];
  const type = OBJECTIVES[(n - 1) % 3];
  return {
    n,
    world,
    type,
    speed: Math.min(4.2, 1.2 + n * 0.1),
    spawn: Math.max(18, 62 - n * 1.8),
    target: 60 + n * 30,
    goldNeed: 2 + Math.floor(n / 2),
    surviveMs: (18 + n * 2) * 1000,
    goldChance: type === "gold" ? 0.16 : 0.08,
    zigzag: n >= 5,
    double: n >= 10,
    jelly: n >= JELLY_FROM_LEVEL,
    zigChance: Math.min(0.5, 0.1 + n * 0.02),
  };
}

const ROOMS = [
  { id: "taht", name: "Taht Odası", icon: "👑", costs: [120, 220, 380], desc: (l) => `Her galibiyette +${l * 5}% coin` },
  { id: "firin", name: "Kraliyet Mutfağı", icon: "🥐", costs: [100, 200, 350], desc: (l) => `Her galibiyette +${l * 10}% coin` },
  { id: "bahce", name: "Kraliyet Bahçesi", icon: "🌷", costs: [90, 180, 300], desc: (l) => `Günlük ödül +${l * 10}%` },
  { id: "kule", name: "Gözetleme Kulesi", icon: "🗼", costs: [140, 260, 420], desc: (l) => `Her koşuda %${l * 10} ihtimalle ücretsiz kalkan` },
];

const DAILY_QUESTS = [
  { id: "kills", text: "Bugün 60 şeker patlat", goal: 60, reward: 30 },
  { id: "golds", text: "Bugün 10 altın şeker topla", goal: 10, reward: 30 },
  { id: "combo", text: "Bir koşuda 4'lü kombo yap", goal: 4, reward: 30 },
];

const SKINS = [
  { id: "blue", name: "Mavi Bonbon", price: 0, color: "#38bdf8" },
  { id: "pink", name: "Pembe Bonbon", price: 50, color: "#f472b6" },
  { id: "gold", name: "Altın Bonbon", price: 120, color: "#facc15" },
  { id: "mint", name: "Nane Bonbon", price: 120, color: "#34d399" },
  { id: "strawberry", name: "Çilek Bonbon", price: 90, color: "#f43f5e" },
  { id: "lavender", name: "Lavanta Bonbon", price: 90, color: "#a78bfa" },
  { id: "night", name: "Gece Bonbonu", price: 200, color: "#334155" },
  { id: "rainbow", name: "Gökkuşağı Bonbon", price: 300, color: "#f472b6", rainbow: true },
];

const TRAILS = [
  { id: "yellow", name: "Altın Işık", price: 0, color: "#fde047" },
  { id: "blue", name: "Buz Mavisi", price: 40, color: "#38bdf8" },
  { id: "pink", name: "Pembe Pırıltı", price: 40, color: "#f472b6" },
  { id: "green", name: "Nane Yeşili", price: 60, color: "#4ade80" },
  { id: "purple", name: "Mor Sis", price: 80, color: "#c084fc" },
];

const CONSUMABLES = [
  { id: "shield", name: "Kalkan", desc: "Bir koşuda ilk çarpmayı engeller", price: 40, icon: "🛡️" },
  { id: "extraLife", name: "Ekstra can paketi", desc: "Bir koşuda +1 başlangıç canı", price: 50, icon: "❤️" },
];

const UPGRADES = {
  lives: { name: "Kalıcı ekstra can", desc: "Başlangıçta +1 can (kalıcı)", max: 2, costs: [80, 160] },
  fire: { name: "Hızlı ateş", desc: "Ateş bekleme süresi -30 ms", max: 3, costs: [60, 120, 200] },
};

const ACHIEVEMENTS = [
  { id: "first_win", name: "İlk Zafer", desc: "1 bölüm tamamla", reward: 30, goal: 1, value: (d) => d.stats.wins },
  { id: "golds", name: "Altın Avcısı", desc: "50 altın şeker topla", reward: 60, goal: 50, value: (d) => d.stats.totalGolds },
  { id: "combo", name: "Kombo Ustası", desc: "5'li kombo yap", reward: 50, goal: 5, value: (d) => d.stats.bestCombo },
  { id: "stars", name: "Yıldız Toplayıcı", desc: "5 bölümü 3 yıldızla bitir", reward: 80, goal: 5, value: (d) => Object.values(d.stars).filter((s) => s === 3).length },
  { id: "kills", name: "Şeker Kırıcı", desc: "500 şeker patlat", reward: 100, goal: 500, value: (d) => d.stats.totalKills },
  { id: "collector", name: "Koleksiyoncu", desc: "5 bonbon sahibi ol", reward: 80, goal: 5, value: (d) => d.owned.length },
  { id: "crowns", name: "Kral Dostu", desc: "3 taç kazan", reward: 150, goal: 3, value: (d) => (d.crownsClaimed || []).length },
];

const todayStr = () => new Date().toDateString();

const DEFAULT_SAVE = {
  coins: 0,
  owned: ["blue"],
  skin: "blue",
  ownedTrails: ["yellow"],
  trail: "yellow",
  upgrades: { lives: 0, fire: 0 },
  consumables: { shield: 0, extraLife: 0 },
  rooms: { taht: 0, firin: 0, bahce: 0, kule: 0 },
  unlockedLevel: 1,
  stars: {},
  stats: { wins: 0, totalGolds: 0, totalKills: 0, bestCombo: 0 },
  daily: { date: "", kills: 0, golds: 0, combo: 0, claimed: [] },
  seenStory: [],
  crownsClaimed: [],
  claimed: [],
  lastDaily: "",
  musicOn: true,
  sfxOn: true,
};

const rnd = (a, b) => a + Math.random() * (b - a);

const makeSparkles = () =>
  Array.from({ length: SPARKLE_COUNT }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: 1.5 + Math.random() * 3,
    v: 0.4 + Math.random() * 1.2,
    tw: rnd(1.5, 3.5),
  }));

const initialGame = (sparkles, lives, shield) => ({
  playerX: W / 2 - PLAYER_W / 2,
  prevX: W / 2 - PLAYER_W / 2,
  tilt: 0,
  recoil: 0,
  blocks: [],
  bullets: [],
  particles: [],
  popups: [],
  rings: [],
  sparkles,
  score: 0,
  golds: 0,
  kills: 0,
  maxCombo: 0,
  elapsed: 0,
  lives,
  shield,
  powers: {},
  combo: 0,
  comboTimer: 0,
  invuln: 0,
  spawnTimer: 0,
  lastFire: 0,
  shake: 0,
  flash: 0,
  flashColor: "255,80,120",
});

// Ortak yardımcı: yumuşak gölge filtresi
function SoftShadow({ id }) {
  return (
    <filter id={id} x="-30%" y="-30%" width="160%" height="170%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
      <feOffset dx="0" dy="2.5" result="b" />
      <feComponentTransfer><feFuncA type="linear" slope="0.45" /></feComponentTransfer>
      <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  );
}

function Sparkle4({ size, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" style={{ display: "block", filter: "drop-shadow(0 0 2px rgba(255,255,255,0.9))" }}>
      <path d="M5 0 Q5.5 4.5 10 5 Q5.5 5.5 5 10 Q4.5 5.5 0 5 Q4.5 4.5 5 0 Z" fill={color} />
    </svg>
  );
}

// Kağıda sarılı, folyo kıvrımlı bonbon
function WrappedCandy({ color, width, height, glow }) {
  const uid = useId().replace(/:/g, "");
  const dark = `color-mix(in srgb, ${color} 55%, #000)`;
  const light = `color-mix(in srgb, ${color} 40%, #fff)`;
  return (
    <svg width={width} height={height} viewBox="0 0 60 40" style={{ overflow: "visible", filter: glow ? "drop-shadow(0 0 8px rgba(253,224,71,0.9)) drop-shadow(0 4px 4px rgba(0,0,0,0.35))" : "drop-shadow(0 4px 4px rgba(0,0,0,0.3))" }}>
      <defs>
        <radialGradient id={"b" + uid} cx="32%" cy="26%" r="78%">
          <stop offset="0%" stopColor={light} />
          <stop offset="45%" stopColor={color} />
          <stop offset="100%" stopColor={dark} />
        </radialGradient>
        <linearGradient id={"t" + uid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={dark} />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
        <linearGradient id={"f" + uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <path d="M0 20 L14 8 Q17 20 14 32 Z" fill={`url(#t${uid})`} />
      <path d="M60 20 L46 8 Q43 20 46 32 Z" fill={`url(#t${uid})`} />
      <path d="M1 20 L13 12 M1 20 L13 28" stroke="#fff" strokeWidth="0.8" opacity="0.5" />
      <path d="M59 20 L47 12 M59 20 L47 28" stroke="#fff" strokeWidth="0.8" opacity="0.5" />
      <ellipse cx="30" cy="20" rx="20" ry="14" fill={`url(#b${uid})`} />
      <path d="M14 14 Q22 8 30 10 Q38 8 46 14" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.35" />
      <path d="M14 26 Q22 32 30 30 Q38 32 46 26" fill="none" stroke="#000" strokeWidth="0.8" opacity="0.2" />
      <ellipse cx="30" cy="20" rx="20" ry="14" fill={`url(#f${uid})`} />
      <path d="M16 12 Q30 3 44 12" stroke="#fff" strokeWidth="2" fill="none" opacity="0.7" strokeLinecap="round" />
      <ellipse cx="23" cy="14" rx="6" ry="2.6" fill="#fff" opacity="0.9" />
    </svg>
  );
}

function SkinCandy({ skin, width, height, glow }) {
  if (skin.rainbow) {
    return (
      <div style={{ animation: "cdHue 3s linear infinite", display: "inline-block" }}>
        <WrappedCandy color="#f472b6" width={width} height={height} glow={glow} />
      </div>
    );
  }
  return <WrappedCandy color={skin.color} width={width} height={height} glow={glow} />;
}

// Spiral lolipop: çubuk ve cam gibi parlayan yuvarlak başlık
function Lollipop({ color, size }) {
  const uid = useId().replace(/:/g, "");
  const dark = `color-mix(in srgb, ${color} 50%, #000)`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ overflow: "visible", filter: "drop-shadow(0 4px 4px rgba(0,0,0,0.3))" }}>
      <defs>
        <linearGradient id={"s" + uid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <radialGradient id={"c" + uid} cx="36%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="35%" stopColor={color} />
          <stop offset="100%" stopColor={dark} />
        </radialGradient>
      </defs>
      <rect x="18.4" y="27" width="3.2" height="13" rx="1.6" fill={`url(#s${uid})`} />
      <circle cx="20" cy="18" r="16" fill="#fff" opacity="0.9" />
      <circle cx="20" cy="18" r="14.2" fill={`url(#c${uid})`} />
      <path d="M20 18 m0 -2 a2 2 0 1 1 -2 2 a4 4 0 1 1 6 -2 a6 6 0 1 1 -10 4 a8 8 0 1 1 13 -8" stroke="#fff" strokeWidth="2.4" fill="none" opacity="0.75" strokeLinecap="round" />
      <path d="M20 18 m0 -2 a2 2 0 1 1 -2 2 a4 4 0 1 1 6 -2 a6 6 0 1 1 -10 4 a8 8 0 1 1 13 -8" stroke={dark} strokeWidth="0.6" fill="none" opacity="0.35" />
      <ellipse cx="13" cy="10" rx="4" ry="2.2" fill="#fff" opacity="0.85" />
    </svg>
  );
}

// Bölmeli çikolata tableti: bevel ve kakao tozu parlaklığı
function ChocoBar({ width, height }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg width={width} height={height} viewBox="0 0 40 40" style={{ overflow: "visible", filter: "drop-shadow(0 4px 4px rgba(0,0,0,0.35))" }}>
      <defs>
        <linearGradient id={"c" + uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a16207" />
          <stop offset="45%" stopColor="#6b3a1f" />
          <stop offset="100%" stopColor="#3b1d0c" />
        </linearGradient>
        <linearGradient id={"h" + uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="2" y="4" width="36" height="33" rx="4" fill="#24110a" />
      <rect x="3" y="5" width="34" height="31" rx="3.5" fill={`url(#c${uid})`} />
      {[13.5, 25].map((x) => <line key={x} x1={x} y1="6" x2={x} y2="35" stroke="#24110a" strokeWidth="1.4" />)}
      {[16, 26].map((y) => <line key={y} x1="4" y1={y} x2="36" y2={y} stroke="#24110a" strokeWidth="1.4" />)}
      <rect x="4" y="5.5" width="32" height="12" rx="3" fill={`url(#h${uid})`} />
      <rect x="6" y="7.5" width="6" height="2.5" rx="1.2" fill="#fff" opacity="0.35" />
      <rect x="28" y="28" width="5" height="2" rx="1" fill="#fff" opacity="0.15" />
    </svg>
  );
}

// Jelibon: yarı saydam, içten ışıklı, göz ve parlama
function Gummy({ color, width, height }) {
  const uid = useId().replace(/:/g, "");
  const dark = `color-mix(in srgb, ${color} 55%, #000)`;
  return (
    <svg width={width} height={height} viewBox="0 0 40 40" style={{ overflow: "visible", filter: "drop-shadow(0 4px 4px rgba(0,0,0,0.3))" }}>
      <defs>
        <radialGradient id={"g" + uid} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="30%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={dark} stopOpacity="0.9" />
        </radialGradient>
        <radialGradient id={"gi" + uid} cx="50%" cy="60%" r="40%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M8 38 Q4 38 4 32 L4 20 Q4 4 20 4 Q36 4 36 20 L36 32 Q36 38 32 38 Q28 34 24 38 Q20 34 16 38 Q12 34 8 38 Z" fill={`url(#g${uid})`} />
      <path d="M8 36 Q6 36 6 32 L6 22 Q8 20 20 20 Q34 20 34 22 L34 32 Q34 36 32 36 Z" fill={`url(#gi${uid})`} />
      <path d="M9 13 Q12 8 18 8" stroke="#fff" strokeWidth="2.6" fill="none" opacity="0.8" strokeLinecap="round" />
      <ellipse cx="13" cy="11" rx="2.5" ry="1.5" fill="#fff" opacity="0.9" />
      <ellipse cx="14" cy="21" rx="2.4" ry="2.7" fill="#1f2937" opacity="0.8" />
      <ellipse cx="26" cy="21" rx="2.4" ry="2.7" fill="#1f2937" opacity="0.8" />
      <circle cx="13.2" cy="20" r="0.8" fill="#fff" />
      <circle cx="25.2" cy="20" r="0.8" fill="#fff" />
      <path d="M16 27 Q20 30 24 27" stroke="#1f2937" strokeWidth="1.4" fill="none" opacity="0.55" strokeLinecap="round" />
      {[[11, 31], [25, 34], [31, 17], [8, 23]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1" fill="#fff" opacity="0.75" />)}
    </svg>
  );
}

function Heart({ size }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ overflow: "visible", filter: "drop-shadow(0 0 8px rgba(251,113,133,0.8)) drop-shadow(0 3px 3px rgba(0,0,0,0.3))", animation: "cdBob 1.2s ease-in-out infinite" }}>
      <defs>
        <radialGradient id={"hg" + uid} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fecdd3" />
          <stop offset="50%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#9f1239" />
        </radialGradient>
      </defs>
      <path d="M20 36 C6 26 2 18 2 12 C2 6 7 2 12 2 C16 2 19 4 20 7 C21 4 24 2 28 2 C33 2 38 6 38 12 C38 18 34 26 20 36 Z" fill={`url(#hg${uid})`} stroke="#fff" strokeWidth="1.5" />
      <ellipse cx="11" cy="10" rx="3.5" ry="2" fill="#fff" opacity="0.8" />
    </svg>
  );
}

// Metalik altın şeker: kenarlı madeni para görünümü
function GoldCandy({ size }) {
  const uid = useId().replace(/:/g, "");
  return (
    <div style={{ animation: "cdGlow 1.4s ease-in-out infinite", borderRadius: "50%", width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 40 40" style={{ overflow: "visible", animation: "cdWobble 1s ease-in-out infinite", filter: "drop-shadow(0 4px 4px rgba(0,0,0,0.3))" }}>
        <defs>
          <radialGradient id={"gc" + uid} cx="35%" cy="28%" r="75%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="30%" stopColor="#fde047" />
            <stop offset="70%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#713f12" />
          </radialGradient>
          <linearGradient id={"gw" + uid} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a16207" />
            <stop offset="50%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#a16207" />
          </linearGradient>
        </defs>
        <path d="M0 20 L10 11 L10 29 Z" fill={`url(#gw${uid})`} />
        <path d="M40 20 L30 11 L30 29 Z" fill={`url(#gw${uid})`} />
        <circle cx="20" cy="20" r="12.8" fill="#854d0e" />
        <circle cx="20" cy="20" r="12" fill={`url(#gc${uid})`} />
        <circle cx="20" cy="20" r="9.5" fill="none" stroke="#fef08a" strokeWidth="0.8" opacity="0.6" />
        <path d="M13 14 Q20 8 27 14" stroke="#fff" strokeWidth="2" fill="none" opacity="0.8" strokeLinecap="round" />
        <path d="M20 12 L21.6 17.4 L27.2 17.4 L22.7 20.6 L24.4 26 L20 22.8 L15.6 26 L17.3 20.6 L12.8 17.4 L18.4 17.4 Z" fill="#fef9c3" stroke="#a16207" strokeWidth="0.5" opacity="0.95" />
      </svg>
    </div>
  );
}

// Yarı saydam jöle: çatlak ve iç ışıltı
function JellyBlock({ hp }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg width={BLOCK_SIZE} height={BLOCK_SIZE} viewBox="0 0 44 44" style={{ overflow: "visible", filter: "drop-shadow(0 4px 6px rgba(190,24,93,0.45))", opacity: hp === 1 ? 0.8 : 1 }}>
      <defs>
        <radialGradient id={"jg" + uid} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
          <stop offset="35%" stopColor="#f472b6" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#9d174d" stopOpacity="0.9" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="40" height="40" rx="13" fill={`url(#jg${uid})`} stroke="#fdf2f8" strokeWidth="1.5" />
      <rect x="6" y="6" width="32" height="10" rx="5" fill="#fff" opacity="0.3" />
      <circle cx="16" cy="24" r="3" fill="#fff" opacity="0.6" />
      <circle cx="28" cy="27" r="2" fill="#fff" opacity="0.5" />
      {hp === 1 && <path d="M12 10 L20 22 L16 30 L26 36" stroke="#fff" strokeWidth="1.4" fill="none" opacity="0.9" />}
    </svg>
  );
}

function renderBlockContent(b) {
  if (b.kind === "heart") return <Heart size={BLOCK_SIZE} />;
  if (b.kind === "gold") return <GoldCandy size={BLOCK_SIZE} />;
  if (b.kind === "jelly") return <JellyBlock hp={b.hp} />;
  if (b.kind === "power") {
    const p = POWERS[b.power];
    return (
      <div style={{ width: BLOCK_SIZE, height: BLOCK_SIZE, borderRadius: "50%", background: `radial-gradient(circle at 32% 28%, #fff, ${p.color} 55%, color-mix(in srgb, ${p.color} 50%, #000))`, border: "2px solid rgba(255,255,255,0.9)", boxShadow: `0 0 16px ${p.color}, inset 0 -4px 6px rgba(0,0,0,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, animation: "cdOrb 1s ease-in-out infinite" }}>
        {p.icon}
      </div>
    );
  }
  if (b.shape === "wrapped") return <div style={{ animation: "cdWobble 2.2s ease-in-out infinite" }}><WrappedCandy color={b.color} width={BLOCK_SIZE} height={BLOCK_SIZE * 0.66} /></div>;
  if (b.shape === "lolli") return <div style={{ animation: "cdBob 1.8s ease-in-out infinite" }}><Lollipop color={b.color} size={BLOCK_SIZE} /></div>;
  if (b.shape === "choco") return <ChocoBar width={BLOCK_SIZE} height={BLOCK_SIZE} />;
  return <div style={{ animation: "cdBob 2s ease-in-out infinite" }}><Gummy color={b.color} width={BLOCK_SIZE} height={BLOCK_SIZE} /></div>;
}

// Taş dokulu, pencere ışıklı gerçekçi kraliyet sarayı
function CastleArt({ rooms }) {
  const total = Object.values(rooms).reduce((a, b) => a + b, 0);
  const uid = useId().replace(/:/g, "");
  return (
    <svg width="300" height="200" viewBox="0 0 300 200" style={{ overflow: "visible", filter: "drop-shadow(0 12px 14px rgba(30,20,60,0.45))" }}>
      <defs>
        <linearGradient id={"stone" + uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5f3ff" />
          <stop offset="60%" stopColor="#cbb8f5" />
          <stop offset="100%" stopColor="#8b6fd1" />
        </linearGradient>
        <linearGradient id={"roof" + uid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9d174d" />
          <stop offset="50%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#9d174d" />
        </linearGradient>
        <linearGradient id={"gold" + uid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a16207" />
          <stop offset="50%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
        <pattern id={"brick" + uid} width="14" height="8" patternUnits="userSpaceOnUse">
          <rect width="14" height="8" fill="none" />
          <path d="M0 8 H14 M7 0 V8" stroke="#6d28d9" strokeWidth="0.6" opacity="0.35" />
        </pattern>
        <radialGradient id={"win" + uid} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="60%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#ca8a04" stopOpacity="0.6" />
        </radialGradient>
        <linearGradient id={"ground" + uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#15803d" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      <ellipse cx="150" cy="192" rx="140" ry="8" fill="#1e1b4b" opacity="0.35" />
      <path d="M0 176 Q60 160 120 172 T260 168 T300 176 L300 200 L0 200 Z" fill={`url(#ground${uid})`} />

      <rect x="18" y="112" width="264" height="66" rx="4" fill={`url(#stone${uid})`} stroke="#6d28d9" strokeWidth="1.5" />
      <rect x="18" y="112" width="264" height="66" rx="4" fill={`url(#brick${uid})`} />
      <rect x="18" y="112" width="264" height="5" fill="#fff" opacity="0.5" />
      {[34, 60, 88, 212, 240, 266].map((x) => (
        <g key={x}>
          <rect x={x} y="122" width="10" height="16" rx="5" fill="#4c1d95" />
          <rect x={x + 1.5} y="123.5" width="7" height="13" rx="3.5" fill={`url(#win${uid})`} opacity="0.85" />
        </g>
      ))}
      <rect x="122" y="130" width="56" height="48" rx="28" fill="#2e1065" />
      <rect x="128" y="136" width="44" height="42" rx="22" fill="#1e1b4b" />
      <path d="M128 176 L128 146 Q150 128 172 146 L172 176 Z" fill={`url(#win${uid})`} opacity="0.55" />
      <line x1="150" y1="136" x2="150" y2="178" stroke="#4c1d95" strokeWidth="1.5" opacity="0.7" />

      <rect x="56" y="62" width="54" height="56" fill={`url(#stone${uid})`} stroke="#6d28d9" strokeWidth="1.5" />
      <rect x="56" y="62" width="54" height="56" fill={`url(#brick${uid})`} />
      <path d="M46 64 L83 26 L120 64 Z" fill={`url(#roof${uid})`} stroke="#701a75" strokeWidth="1" />
      <path d="M83 26 L120 64 L83 64 Z" fill="#000" opacity="0.12" />

      <rect x="190" y="62" width="54" height="56" fill={`url(#stone${uid})`} stroke="#6d28d9" strokeWidth="1.5" />
      <rect x="190" y="62" width="54" height="56" fill={`url(#brick${uid})`} />
      <path d="M180 64 L217 26 L254 64 Z" fill={`url(#roof${uid})`} stroke="#701a75" strokeWidth="1" />
      <path d="M217 26 L254 64 L217 64 Z" fill="#000" opacity="0.12" />

      <rect x="118" y="32" width="64" height="86" fill={`url(#stone${uid})`} stroke="#6d28d9" strokeWidth="1.5" />
      <rect x="118" y="32" width="64" height="86" fill={`url(#brick${uid})`} />
      <rect x="118" y="32" width="64" height="5" fill="#fff" opacity="0.5" />
      <path d="M108 36 L150 2 L192 36 Z" fill={`url(#gold${uid})`} stroke="#92400e" strokeWidth="1" />
      <path d="M150 2 L192 36 L150 36 Z" fill="#000" opacity="0.14" />
      <circle cx="150" cy="54" r="7" fill="#fef9c3" stroke="#a16207" strokeWidth="1.2" />
      <circle cx="150" cy="54" r="3" fill="#f472b6" />
      <line x1="150" y1="2" x2="150" y2="-18" stroke="#4c1d95" strokeWidth="2" />
      <path d="M150 -18 L176 -11 L150 -4 Z" fill="#f472b6" style={{ transformOrigin: "150px -11px", animation: "cdFlag 1.6s ease-in-out infinite" }} />
      <line x1="83" y1="26" x2="83" y2="8" stroke="#4c1d95" strokeWidth="2" />
      <path d="M83 8 L102 14 L83 20 Z" fill="#67e8f9" style={{ transformOrigin: "83px 14px", animation: "cdFlag 1.9s ease-in-out infinite" }} />
      <line x1="217" y1="26" x2="217" y2="8" stroke="#4c1d95" strokeWidth="2" />
      <path d="M217 8 L236 14 L217 20 Z" fill="#a3e635" style={{ transformOrigin: "217px 14px", animation: "cdFlag 2.1s ease-in-out infinite" }} />

      <path d="M136 42 L140 36 L145 40 L150 34 L155 40 L160 36 L164 42 Z" fill={`url(#gold${uid})`} opacity="0.9" transform="translate(0,-2)" />

      {total >= 4 && <circle cx="150" cy="-24" r="4" fill="#fde047" style={{ animation: "cdSparkle 2s ease-in-out infinite", transformOrigin: "150px -24px" }} />}
      {total >= 8 && <circle cx="83" cy="48" r="3" fill="#fde047" style={{ animation: "cdSparkle 1.8s ease-in-out infinite" }} />}
      {total >= 12 && <circle cx="217" cy="48" r="3" fill="#fde047" style={{ animation: "cdSparkle 2.2s ease-in-out infinite" }} />}
    </svg>
  );
}

// Kral Şekerius: gölgeli, altın taçlı ve pelerinli portre
function KingPortrait({ mood }) {
  const uid = useId().replace(/:/g, "");
  return (
    <div className="relative inline-block" style={{ animation: "cdBob 2.8s ease-in-out infinite" }}>
      <svg width="96" height="106" viewBox="0 0 90 100" style={{ overflow: "visible", filter: "drop-shadow(0 8px 8px rgba(30,20,60,0.45))" }}>
        <defs>
          <linearGradient id={"cape" + uid} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5b21b6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#4c1d95" />
          </linearGradient>
          <radialGradient id={"skin" + uid} cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#fde7cf" />
            <stop offset="100%" stopColor="#d9a77a" />
          </radialGradient>
          <linearGradient id={"crown" + uid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#a16207" />
          </linearGradient>
        </defs>
        <path d="M14 98 Q14 60 45 56 Q76 60 76 98 Z" fill={`url(#cape${uid})`} />
        <path d="M30 56 L45 98 L60 56" fill="#fde047" opacity="0.85" />
        <rect x="36" y="58" width="18" height="34" rx="6" fill="#7c3aed" />
        <circle cx="45" cy="66" r="2" fill="#fde047" />
        <circle cx="45" cy="78" r="2" fill="#fde047" />
        <circle cx="45" cy="42" r="19" fill={`url(#skin${uid})`} />
        <path d="M28 40 Q28 22 45 22 Q62 22 62 40 Q56 30 45 29 Q34 30 28 40 Z" fill="#78350f" opacity="0.9" />
        <path d="M26 36 Q28 60 45 62 Q62 60 64 36 Q62 52 45 54 Q28 52 26 36 Z" fill="#e5e7eb" opacity="0.92" />
        <path d="M24 30 L28 12 L37 22 L45 6 L53 22 L62 12 L66 30 Z" fill={`url(#crown${uid})`} stroke="#92400e" strokeWidth="1" />
        <rect x="24" y="28" width="42" height="5" rx="2" fill="#a16207" />
        <circle cx="45" cy="9" r="2.8" fill="#f472b6" stroke="#fff" strokeWidth="0.6" />
        <circle cx="34" cy="18" r="2" fill="#67e8f9" />
        <circle cx="56" cy="18" r="2" fill="#67e8f9" />
        <ellipse cx="38" cy="42" rx="2.4" ry="2.8" fill="#1f2937" />
        <ellipse cx="52" cy="42" rx="2.4" ry="2.8" fill="#1f2937" />
        <circle cx="38.8" cy="41" r="0.8" fill="#fff" />
        <circle cx="52.8" cy="41" r="0.8" fill="#fff" />
        <path d="M34 36 Q38 34 42 36" stroke="#78350f" strokeWidth="1.2" fill="none" />
        <path d="M48 36 Q52 34 56 36" stroke="#78350f" strokeWidth="1.2" fill="none" />
        <path d="M40 52 Q45 56 50 52" stroke="#7c2d12" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
      <div className="absolute -top-3 -right-16 bg-white rounded-2xl px-3 py-1 text-[11px] font-bold text-fuchsia-800 shadow-lg w-40" style={{ animation: "cdPop 0.4s ease-out" }}>
        {mood}
        <div className="absolute -left-1 bottom-3 w-3 h-3 bg-white rotate-45" />
      </div>
    </div>
  );
}

// Bulanık ışıklar ve uzak tepeler: dünyaya göre katmanlı arka plan
function WorldBackdrop({ world }) {
  const bokeh = useMemo(() => Array.from({ length: 9 }, (_, i) => ({
    id: i,
    left: rnd(0, 90),
    top: rnd(0, 80),
    size: rnd(40, 110),
    delay: rnd(0, 4),
    dur: rnd(5, 9),
  })), [world]);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 0%, ${world.glow} 0%, transparent 60%)`, opacity: 0.85 }} />
      {bokeh.map((b) => (
        <div
          key={b.id}
          style={{
            position: "absolute", left: `${b.left}%`, top: `${b.top}%`, width: b.size, height: b.size, borderRadius: "50%",
            background: `radial-gradient(circle, ${world.glow} 0%, transparent 70%)`, filter: "blur(6px)",
            animation: `cdBokeh ${b.dur}s ease-in-out ${b.delay}s infinite`,
          }}
        />
      ))}
      <svg viewBox="0 0 400 180" preserveAspectRatio="none" style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: 160, opacity: 0.55 }}>
        <path d="M0 110 Q60 60 120 100 T240 90 T400 100 L400 180 L0 180 Z" fill={world.hills} />
        <path d="M0 140 Q80 110 160 135 T320 128 T400 136 L400 180 L0 180 Z" fill={world.hills} opacity="0.8" />
      </svg>
    </div>
  );
}

const btn = "px-5 py-2 bg-gradient-to-b from-white to-fuchsia-50 text-fuchsia-600 font-bold rounded-full shadow-lg ring-2 ring-white/70 hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:hover:scale-100";
const panel = "w-full max-w-[400px] bg-white/85 backdrop-blur rounded-2xl shadow-xl p-4 border border-white";

const objectiveText = (cfg) => {
  if (cfg.type === "score") return `🎯 ${cfg.target} puan topla`;
  if (cfg.type === "gold") return `🌟 ${cfg.goldNeed} altın şeker vur`;
  return `⏱ ${Math.round(cfg.surviveMs / 1000)} saniye hayatta kal`;
};
const objectiveIcon = (cfg) => (cfg.type === "score" ? "🎯" : cfg.type === "gold" ? "🌟" : "⏱");

function DecorLayer({ world }) {
  const items = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    emoji: world.decor[i % world.decor.length],
    left: rnd(0, 95),
    top: rnd(0, 95),
    size: rnd(14, 24),
    dur: rnd(4, 9),
    delay: rnd(0, 5),
    dx: rnd(-25, 25),
    dy: rnd(-40, 40),
    op: rnd(0.3, 0.6),
  })), [world]);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {items.map((d) => (
        <div
          key={d.id}
          style={{
            position: "absolute", left: `${d.left}%`, top: `${d.top}%`, fontSize: d.size, opacity: d.op,
            filter: "blur(0.4px)",
            "--dx": `${d.dx}px`, "--dy": `${d.dy}px`,
            animation: `cdDrift ${d.dur}s ease-in-out ${d.delay}s infinite alternate`,
          }}
        >
          {d.emoji}
        </div>
      ))}
    </div>
  );
}

function Game({ cfg, skin, trailColor, lives, shieldOn, fireCooldown, sfx, onFinish }) {
  const gameRef = useRef(null);
  if (gameRef.current === null) gameRef.current = initialGame(makeSparkles(), lives, shieldOn);
  const [view, setView] = useState(() => ({ ...gameRef.current }));
  const keysRef = useRef({ left: false, right: false });
  const frameRef = useRef(null);
  const doneRef = useRef(false);
  const idRef = useRef(0);
  const propsRef = useRef({});
  propsRef.current = { cfg, fireCooldown, sfx, onFinish };

  const fire = useCallback(() => {
    if (doneRef.current) return;
    const g = gameRef.current;
    const now = performance.now();
    if (now - g.lastFire < propsRef.current.fireCooldown) return;
    g.lastFire = now;
    g.recoil = 120;
    const cx = g.playerX + PLAYER_W / 2;
    const by = H - PLAYER_H - 14;
    if (g.powers.multi > 0) {
      g.bullets.push({ x: cx, y: by, vx: -1.2, trail: [] });
      g.bullets.push({ x: cx, y: by, vx: 0, trail: [] });
      g.bullets.push({ x: cx, y: by, vx: 1.2, trail: [] });
    } else {
      g.bullets.push({ x: cx, y: by, vx: 0, trail: [] });
    }
    g.rings.push({ x: cx, y: H - PLAYER_H - 10, life: 1, color: "255,255,255", size: 0.8 });
    propsRef.current.sfx("fire");
  }, []);

  useEffect(() => {
    const down = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d") keysRef.current.right = true;
      if (e.key === " ") { e.preventDefault(); fire(); }
    };
    const up = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d") keysRef.current.right = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [fire]);

  useEffect(() => {
    let last = performance.now();

    const finish = (won) => {
      doneRef.current = true;
      cancelAnimationFrame(frameRef.current);
      const g = gameRef.current;
      setView({ ...g });
      propsRef.current.onFinish({
        won,
        score: Math.floor(g.score),
        golds: g.golds,
        lives: g.lives,
        kills: g.kills,
        maxCombo: g.maxCombo,
      });
    };

    const loop = (now) => {
      if (doneRef.current) return;
      const ms = Math.min(now - last, 50);
      const dt = ms / 16.67;
      last = now;
      const g = gameRef.current;
      const c = propsRef.current.cfg;
      const slow = g.powers.slow > 0 ? 0.5 : 1;
      const speed = (c.speed + g.score * 0.002) * slow;
      g.elapsed += ms;

      Object.keys(g.powers).forEach((k) => {
        g.powers[k] -= ms;
        if (g.powers[k] <= 0) delete g.powers[k];
      });

      g.prevX = g.playerX;
      if (keysRef.current.left) g.playerX -= 6 * dt;
      if (keysRef.current.right) g.playerX += 6 * dt;
      g.playerX = Math.max(0, Math.min(W - PLAYER_W, g.playerX));
      const dx = g.playerX - g.prevX;
      g.tilt += (Math.max(-14, Math.min(14, dx * 2.2)) - g.tilt) * 0.2 * dt;
      if (g.recoil > 0) g.recoil -= ms;

      g.sparkles = g.sparkles.map((p) => {
        let y = p.y + p.v * dt;
        if (y > H) y = -5;
        return { ...p, y, tw: p.tw + ms / 1000 };
      });

      const makeBlock = (kind, power) => {
        const zig = c.zigzag && (kind === "candy" || kind === "jelly") && Math.random() < c.zigChance;
        return {
          id: idRef.current++,
          x: Math.random() * (W - BLOCK_SIZE),
          y: -BLOCK_SIZE,
          kind,
          power,
          hp: kind === "jelly" ? 2 : undefined,
          zig,
          vx: zig ? (Math.random() < 0.5 ? -1.4 : 1.4) : 0,
          color: CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)],
          shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        };
      };

      g.spawnTimer -= dt;
      if (g.spawnTimer <= 0) {
        const roll = Math.random();
        const pKeys = Object.keys(POWERS);
        let kind = "candy";
        let power;
        let t = c.goldChance;
        if (roll < t) kind = "gold";
        else if (roll < (t += HEART_CHANCE)) kind = "heart";
        else if (roll < (t += POWER_CHANCE)) {
          kind = "power";
          power = pKeys[Math.floor(Math.random() * pKeys.length)];
        } else if (c.jelly && roll < (t += JELLY_CHANCE)) kind = "jelly";
        g.blocks.push(makeBlock(kind, power));
        if (c.double && Math.random() < 0.4) g.blocks.push(makeBlock("candy"));
        g.spawnTimer = Math.max(MIN_SPAWN, c.spawn - g.score * 0.03);
      }

      const magnet = g.powers.magnet > 0;
      const playerCenter = g.playerX + PLAYER_W / 2 - BLOCK_SIZE / 2;
      g.blocks = g.blocks
        .map((b) => {
          let x = b.x;
          let vx = b.vx;
          if (b.zig) {
            x += vx * dt;
            if (x < 0 || x > W - BLOCK_SIZE) { vx = -vx; x = Math.max(0, Math.min(W - BLOCK_SIZE, x)); }
          }
          if (magnet && b.kind === "gold") {
            const diff = playerCenter - x;
            x += Math.sign(diff) * Math.min(Math.abs(diff), 3 * dt);
          }
          return { ...b, x, vx, y: b.y + speed * dt };
        })
        .filter((b) => b.y < H);

      g.bullets = g.bullets
        .map((b) => ({
          ...b,
          x: b.x + (b.vx || 0) * dt,
          y: b.y - BULLET_SPEED * dt,
          trail: [{ y: b.y, x: b.x }, ...b.trail].slice(0, 6),
        }))
        .filter((b) => b.y > -10 && b.x > -10 && b.x < W + 10);

      if (g.comboTimer > 0) {
        g.comboTimer -= ms;
        if (g.comboTimer <= 0) g.combo = 0;
      }
      if (g.invuln > 0) g.invuln -= ms;
      if (g.shake > 0) g.shake -= ms;
      if (g.flash > 0) g.flash -= ms;

      const newParticles = [];
      const newPopups = [];
      const destroyed = new Set();
      const usedBullets = new Set();

      g.bullets.forEach((bl, bi) => {
        const target = g.blocks.find(
          (b) => b.kind !== "heart" && b.kind !== "power" && !destroyed.has(b.id) &&
            bl.x > b.x && bl.x < b.x + BLOCK_SIZE && bl.y > b.y && bl.y < b.y + BLOCK_SIZE
        );
        if (!target) return;
        usedBullets.add(bi);

        const cx = target.x + BLOCK_SIZE / 2;
        const cy = target.y + BLOCK_SIZE / 2;

        if (target.kind === "jelly" && target.hp > 1) {
          target.hp -= 1;
          propsRef.current.sfx("pop");
          for (let k = 0; k < 8; k++) {
            const angle = (Math.PI * 2 * k) / 8;
            newParticles.push({ x: cx, y: cy, vx: Math.cos(angle) * 2, vy: Math.sin(angle) * 2, life: 0.8, color: "#f472b6", star: false, size: 4, rot: 0 });
          }
          newPopups.push({ x: cx, y: cy, text: "Çatladı!", life: 1 });
          return;
        }

        destroyed.add(target.id);

        g.combo = g.comboTimer > 0 ? Math.min(g.combo + 1, 99) : 1;
        g.comboTimer = COMBO_WINDOW;
        g.maxCombo = Math.max(g.maxCombo, g.combo);
        const mult = Math.min(g.combo, MAX_COMBO);
        const isGold = target.kind === "gold";
        const isJelly = target.kind === "jelly";
        const base = isGold ? GOLD_PTS : isJelly ? JELLY_PTS : CANDY_PTS;
        const pts = base * mult;
        g.score += pts;
        g.kills += 1;
        if (isGold) g.golds += 1;
        propsRef.current.sfx(isGold ? "coin" : "pop");

        const count = isGold ? 30 : 18;
        const color = isGold ? "#facc15" : isJelly ? "#f472b6" : target.color;
        for (let k = 0; k < count; k++) {
          const angle = (Math.PI * 2 * k) / count + Math.random() * 0.3;
          const sp = rnd(1.5, 5);
          newParticles.push({
            x: cx, y: cy, vx: Math.cos(angle) * sp, vy: Math.sin(angle) * sp,
            life: 1, color, star: k % 3 === 0, size: rnd(3, 6), rot: rnd(0, 360),
          });
        }
        g.rings.push({ x: cx, y: cy, life: 1, color: isGold ? "250,204,21" : "255,255,255", size: 1.2 });
        newPopups.push({ x: cx, y: cy, text: `+${pts}`, life: 1, big: mult >= 3 });
        if (mult >= 2) newPopups.push({ x: cx, y: cy - 16, text: `KOMBO x${mult}`, life: 1, combo: true });
      });

      if (destroyed.size) {
        g.blocks = g.blocks.filter((b) => !destroyed.has(b.id));
      }
      if (usedBullets.size) {
        g.bullets = g.bullets.filter((_, bi) => !usedBullets.has(bi));
      }

      const py = H - PLAYER_H - 10;
      const touching = (b) =>
        b.y + BLOCK_SIZE > py + 6 && b.y < py + PLAYER_H &&
        b.x + BLOCK_SIZE - 6 > g.playerX && b.x + 6 < g.playerX + PLAYER_W;

      const caught = g.blocks.filter(touching);
      if (caught.length) {
        const ids = new Set(caught.map((b) => b.id));
        g.blocks = g.blocks.filter((b) => !ids.has(b.id));
        caught.forEach((b) => {
          if (b.kind === "heart") {
            g.lives = Math.min(MAX_LIVES, g.lives + 1);
            newPopups.push({ x: b.x + BLOCK_SIZE / 2, y: py, text: "+❤️", life: 1 });
            g.flash = 300;
            g.flashColor = "251,113,133";
            propsRef.current.sfx("heart");
          } else if (b.kind === "power") {
            g.powers[b.power] = POWER_MS;
            newPopups.push({ x: b.x + BLOCK_SIZE / 2, y: py - 8, text: `${POWERS[b.power].icon} ${POWERS[b.power].name}`, life: 1, big: true });
            g.flash = 200;
            g.flashColor = "253,224,71";
            propsRef.current.sfx("heart");
          } else if ((b.kind === "candy" || b.kind === "jelly") && g.invuln <= 0) {
            g.combo = 0;
            g.comboTimer = 0;
            if (g.shield) {
              g.shield = false;
              g.invuln = INVULN_MS;
              g.flash = 250;
              g.flashColor = "125,211,252";
              newPopups.push({ x: g.playerX + PLAYER_W / 2, y: py - 10, text: "🛡️ Kalkan!", life: 1 });
              propsRef.current.sfx("pop");
            } else {
              g.lives -= 1;
              g.invuln = INVULN_MS;
              g.shake = 350;
              g.flash = 400;
              g.flashColor = "220,38,38";
              newPopups.push({ x: g.playerX + PLAYER_W / 2, y: py - 10, text: "-❤️", life: 1 });
              propsRef.current.sfx("hurt");
            }
          }
        });
      }

      g.particles = [...g.particles, ...newParticles]
        .map((p) => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, vx: p.vx * 0.99, vy: p.vy + 0.09 * dt, life: p.life - 0.025 * dt, rot: (p.rot || 0) + 6 * dt }))
        .filter((p) => p.life > 0);
      g.popups = [...g.popups, ...newPopups]
        .map((p) => ({ ...p, y: p.y - 0.9 * dt, life: p.life - 0.018 * dt }))
        .filter((p) => p.life > 0);
      g.rings = g.rings
        .map((r) => ({ ...r, life: r.life - 0.05 * dt }))
        .filter((r) => r.life > 0);

      g.score += 0.1 * dt;

      if (g.lives <= 0) return finish(false);
      const done =
        c.type === "score" ? g.score >= c.target :
        c.type === "gold" ? g.golds >= c.goldNeed :
        g.elapsed >= c.surviveMs;
      if (done) return finish(true);

      setView({
        playerX: g.playerX,
        tilt: g.tilt,
        recoil: g.recoil,
        shield: g.shield,
        powers: { ...g.powers },
        blocks: [...g.blocks],
        bullets: [...g.bullets],
        particles: [...g.particles],
        popups: [...g.popups],
        rings: [...g.rings],
        sparkles: [...g.sparkles],
        score: g.score,
        golds: g.golds,
        elapsed: g.elapsed,
        lives: g.lives,
        combo: g.combo,
        comboTimer: g.comboTimer,
        invuln: g.invuln,
        shake: g.shake,
        flash: g.flash,
        flashColor: g.flashColor,
      });
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => {
      doneRef.current = true;
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const moveTo = (clientX, rect) => {
    if (doneRef.current) return;
    gameRef.current.playerX = Math.max(0, Math.min(W - PLAYER_W, clientX - rect.left - PLAYER_W / 2));
  };

  const score = Math.floor(view.score);
  const mult = Math.min(view.combo, MAX_COMBO);
  let frac = 0;
  let objLabel = "";
  if (cfg.type === "score") { frac = view.score / cfg.target; objLabel = `🎯 Puan ${score} / ${cfg.target}`; }
  else if (cfg.type === "gold") { frac = view.golds / cfg.goldNeed; objLabel = `🌟 Altın ${view.golds} / ${cfg.goldNeed}`; }
  else { frac = view.elapsed / cfg.surviveMs; objLabel = `⏱ ${Math.max(0, Math.ceil((cfg.surviveMs - view.elapsed) / 1000))} sn kaldı`; }
  const progress = Math.min(100, frac * 100);
  const squash = view.recoil > 0 ? 0.92 : 1;
  const activePowers = Object.keys(view.powers || {});

  return (
    <div className="flex flex-col items-center gap-2 p-2">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-between items-center text-sm font-extrabold text-white" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.4)" }}>
          <span>{cfg.world.icon} Bölüm {cfg.n}</span>
          <span>{objLabel}</span>
        </div>
        <div className="w-full h-3 bg-black/25 rounded-full mt-1 overflow-hidden ring-1 ring-white/40 shadow-inner">
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "linear-gradient(to right, #fef08a, #fb923c)", boxShadow: "0 0 10px #fde047, inset 0 1px 0 rgba(255,255,255,0.6)" }} />
        </div>
      </div>
      <div className="flex justify-between items-center w-full max-w-[400px] text-sm font-bold text-white" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.4)" }}>
        <span className="flex gap-0.5 text-base items-center">
          {"❤️".repeat(Math.max(0, view.lives))}
          {view.shield && <span title="Kalkan aktif">🛡️</span>}
          {activePowers.map((k) => <span key={k} title={POWERS[k].name}>{POWERS[k].icon}</span>)}
        </span>
        <span
          className="px-3 py-0.5 rounded-full bg-black/35 backdrop-blur"
          style={{ opacity: view.combo > 1 ? 1 : 0.45, transform: mult >= 3 ? "scale(1.1)" : "scale(1)", transition: "transform 0.2s" }}
        >
          Kombo x{mult || 1} {view.combo > 1 && view.comboTimer > 0 ? "🔥" : ""}
        </span>
      </div>

      <div
        className="relative rounded-3xl overflow-hidden select-none cursor-crosshair"
        style={{
          width: W,
          height: H,
          maxWidth: "100%",
          border: "4px solid rgba(255,255,255,0.85)",
          boxShadow: "0 24px 48px -12px rgba(30,20,60,0.55), inset 0 0 60px rgba(255,255,255,0.2), inset 0 -40px 60px -30px rgba(0,0,0,0.25)",
          background: `linear-gradient(to bottom, ${cfg.world.bg[0]}, ${cfg.world.bg[1]} 55%, ${cfg.world.bg[2]})`,
          transform: view.shake > 0 ? `translate(${Math.random() * 8 - 4}px, ${Math.random() * 8 - 4}px)` : "none",
        }}
        onMouseMove={(e) => moveTo(e.clientX, e.currentTarget.getBoundingClientRect())}
        onTouchMove={(e) => moveTo(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}
        onClick={fire}
        onTouchStart={fire}
      >
        <WorldBackdrop world={cfg.world} />
        <DecorLayer world={cfg.world} />

        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at top, rgba(255,255,255,0.3), transparent 55%)", pointerEvents: "none" }} />

        {view.powers && view.powers.slow > 0 && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(103,232,249,0.12)", pointerEvents: "none" }} />
        )}

        {view.sparkles.map((p, i) => (
          <div key={"s" + i} style={{ position: "absolute", left: p.x, top: p.y, opacity: 0.4 + 0.6 * Math.abs(Math.sin(p.tw)), transform: "translate(-50%,-50%)", pointerEvents: "none" }}>
            <Sparkle4 size={p.r * 4} color="rgba(255,255,255,0.95)" />
          </div>
        ))}

        {view.blocks.map((b) => (
          <div key={b.id} style={{ position: "absolute", left: b.x, top: b.y, width: BLOCK_SIZE, height: BLOCK_SIZE }}>
            {b.zig && <div style={{ position: "absolute", inset: -4, borderRadius: "50%", border: "2px dashed rgba(255,255,255,0.8)", animation: "cdGlow 1s ease-in-out infinite" }} />}
            {renderBlockContent(b)}
          </div>
        ))}

        {view.bullets.map((bl, i) => (
          <div key={"b" + i}>
            {bl.trail.map((t, j) => (
              <div key={"t" + j} style={{ position: "absolute", left: t.x - 3, top: t.y - 3, width: 6, height: 6, borderRadius: "50%", background: trailColor, opacity: (1 - j / 6) * 0.5, filter: "blur(1px)", pointerEvents: "none" }} />
            ))}
            <div style={{ position: "absolute", left: bl.x - 6, top: bl.y - 6, width: 12, height: 12, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${trailColor} 55%, color-mix(in srgb, ${trailColor} 60%, #000) 100%)`, boxShadow: `0 0 12px 3px ${trailColor}` }} />
          </div>
        ))}

        {view.rings.map((r, i) => (
          <div
            key={"r" + i}
            style={{
              position: "absolute", left: r.x, top: r.y, width: 60 * r.size, height: 60 * r.size,
              borderRadius: "50%", border: `2px solid rgba(${r.color},${r.life})`,
              transform: `translate(-50%,-50%) scale(${2 - r.life})`, pointerEvents: "none",
              boxShadow: `0 0 14px rgba(${r.color},${r.life * 0.6})`,
            }}
          />
        ))}

        {view.particles.map((p, i) => (
          <div key={"p" + i} style={{ position: "absolute", left: p.x, top: p.y, transform: `translate(-50%,-50%) rotate(${p.rot || 0}deg)`, opacity: Math.max(0, p.life), pointerEvents: "none" }}>
            {p.star ? (
              <Sparkle4 size={p.size * 2.2} color={p.color} />
            ) : (
              <div style={{ width: p.size, height: p.size, borderRadius: 2, background: `radial-gradient(circle at 30% 30%, #fff, ${p.color})`, boxShadow: `0 0 6px ${p.color}` }} />
            )}
          </div>
        ))}

        {view.popups.map((p, i) => (
          <div
            key={"t" + i}
            style={{
              position: "absolute", left: p.x, top: p.y, transform: "translate(-50%,-50%)",
              fontWeight: 900, whiteSpace: "nowrap", pointerEvents: "none", opacity: Math.max(0, p.life),
              fontSize: p.combo ? 13 : p.big ? 18 : 16,
              color: p.combo ? "#fef08a" : "#fff",
              textShadow: "0 2px 0 #9d174d, 0 0 10px rgba(190,24,93,0.8)",
              animation: "cdPop 0.25s ease-out",
            }}
          >
            {p.text}
          </div>
        ))}

        <div
          style={{
            position: "absolute",
            left: view.playerX,
            top: H - PLAYER_H - 10,
            width: PLAYER_W,
            height: PLAYER_H,
            transform: `rotate(${view.tilt}deg) scaleY(${squash})`,
            transformOrigin: "50% 100%",
            opacity: view.invuln > 0 && Math.floor(view.invuln / 80) % 2 === 0 ? 0.3 : 1,
          }}
        >
          {view.shield && (
            <div
              style={{
                position: "absolute", left: -12, top: -14, width: PLAYER_W + 24, height: PLAYER_H + 26,
                borderRadius: "50%", border: "3px solid rgba(125,211,252,0.95)",
                background: "radial-gradient(circle, rgba(125,211,252,0.25), transparent 70%)",
                boxShadow: "0 0 14px rgba(125,211,252,0.9)", animation: "cdShield 1.5s ease-in-out infinite",
              }}
            />
          )}
          {view.powers && view.powers.magnet > 0 && (
            <div style={{ position: "absolute", left: -20, top: -20, width: PLAYER_W + 40, height: PLAYER_H + 40, borderRadius: "50%", border: "2px dashed #f9a8d4", animation: "cdShield 1s ease-in-out infinite" }} />
          )}
          <SkinCandy skin={skin} width={PLAYER_W} height={PLAYER_H} glow />
        </div>

        <div
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: `radial-gradient(circle, rgba(${view.flashColor},0) 30%, rgba(${view.flashColor},0.55) 100%)`,
            opacity: view.flash > 0 ? Math.min(1, view.flash / 300) : 0,
            transition: "opacity 0.1s",
          }}
        />
      </div>
      <p className="text-xs text-white font-semibold text-center" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
        {objectiveText(cfg)} · Ok tuşları / A-D ile hareket, Boşluk / tıklama ile ateş
      </p>
    </div>
  );
}

function LevelMap({ data, onPlay, mapRef }) {
  const nodes = Array.from({ length: LEVEL_COUNT }, (_, i) => {
    const n = i + 1;
    const x = 200 + 105 * Math.sin(i * 1.05);
    const y = i * NODE_GAP + 52;
    return { n, x, y, cfg: levelConfig(n) };
  });
  const current = Math.min(data.unlockedLevel, LEVEL_COUNT);
  const pathD = nodes.map((nd, i) => `${i === 0 ? "M" : "L"}${nd.x} ${nd.y}`).join(" ");
  const worlds = Array.from({ length: Math.ceil(LEVEL_COUNT / 5) }, (_, i) => i);

  return (
    <div ref={mapRef} className="w-full max-w-[400px] h-[540px] overflow-y-auto rounded-3xl bg-white/25 border border-white/60 shadow-inner">
      <div className="relative w-full" style={{ height: LEVEL_COUNT * NODE_GAP + 40 }}>
        <svg className="absolute inset-0 pointer-events-none" width="400" height={LEVEL_COUNT * NODE_GAP + 40} viewBox={`0 0 400 ${LEVEL_COUNT * NODE_GAP + 40}`}>
          <path d={pathD} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
          <path d={pathD} fill="none" stroke="#f472b6" strokeWidth="5" strokeDasharray="2 12" strokeLinecap="round" opacity="0.9" />
        </svg>

        {worlds.map((w) => {
          const top = w * 5 * NODE_GAP;
          const wd = WORLDS[w];
          return (
            <div key={"w" + w} className="absolute left-0 right-0 flex justify-center" style={{ top: top + 6 }}>
              <span className="px-3 py-0.5 rounded-full text-xs font-extrabold text-white shadow" style={{ background: `linear-gradient(to right, ${wd.bg[1]}, ${wd.bg[2]})` }}>
                {wd.icon} {wd.name}
              </span>
            </div>
          );
        })}

        {nodes.map((nd) => {
          const unlocked = nd.n <= data.unlockedLevel;
          const stars = data.stars[nd.n] || 0;
          const isCurrent = nd.n === current;
          return (
            <div key={nd.n} className="absolute flex flex-col items-center" style={{ left: nd.x - 36, top: nd.y - 36, width: 72 }}>
              <button
                disabled={!unlocked}
                onClick={() => onPlay(nd.n)}
                className="relative w-14 h-14 rounded-full font-black text-lg text-white transition hover:scale-110 active:scale-95 disabled:hover:scale-100"
                style={{
                  background: !unlocked
                    ? "linear-gradient(to bottom, #cbd5e1, #94a3b8)"
                    : `radial-gradient(circle at 35% 28%, #fff 0%, ${nd.cfg.world.bg[1]} 35%, ${nd.cfg.world.bg[2]} 100%)`,
                  border: "3px solid white",
                  boxShadow: "0 6px 0 rgba(0,0,0,0.2), 0 10px 16px rgba(0,0,0,0.3), inset 0 -4px 6px rgba(0,0,0,0.15)",
                  animation: isCurrent ? "cdCurrent 1.6s ease-out infinite" : undefined,
                  textShadow: "0 2px 3px rgba(0,0,0,0.4)",
                }}
              >
                {unlocked ? nd.n : "🔒"}
              </button>
              <div className="flex gap-0.5 mt-1 text-xs">
                {[1, 2, 3].map((s) => (
                  <span key={s} style={{ opacity: s <= stars ? 1 : 0.3, filter: s <= stars ? "drop-shadow(0 0 3px #facc15)" : "none" }}>⭐</span>
                ))}
              </div>
              {unlocked && (
                <span className="text-[10px] font-bold text-white mt-0.5 px-1.5 rounded-full bg-black/35 whitespace-nowrap">
                  {objectiveIcon(nd.cfg)} {nd.cfg.type === "score" ? nd.cfg.target : nd.cfg.type === "gold" ? nd.cfg.goldNeed : Math.round(nd.cfg.surviveMs / 1000)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CandyDodgeApp() {
  const [screen, setScreen] = useState("menu");
  const [levelNo, setLevelNo] = useState(1);
  const [gameKey, setGameKey] = useState(0);
  const [result, setResult] = useState(null);
  const [runItems, setRunItems] = useState({ shield: false, extra: false });
  const [data, setData] = useState(DEFAULT_SAVE);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState("");
  const [shopTab, setShopTab] = useState("skins");
  const [storyLevel, setStoryLevel] = useState(null);
  const [kingLine, setKingLine] = useState(KING_LINES[0]);
  const dataRef = useRef(data);
  dataRef.current = data;
  const audioRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(SAVE_KEY);
        if (r && r.value) setData({ ...DEFAULT_SAVE, ...JSON.parse(r.value) });
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try { await window.storage.set(SAVE_KEY, JSON.stringify(data)); } catch (e) {}
    })();
  }, [data, loaded]);

  useEffect(() => {
    if (screen === "map" && mapRef.current) {
      const target = (data.unlockedLevel - 1) * NODE_GAP - 200;
      mapRef.current.scrollTop = Math.max(0, target);
    }
    if (screen === "castle") {
      setKingLine(KING_LINES[Math.floor(Math.random() * KING_LINES.length)]);
    }
  }, [screen]);

  const getCtx = () => {
    if (!audioRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioRef.current = new AC();
    }
    if (audioRef.current.state === "suspended") audioRef.current.resume();
    return audioRef.current;
  };

  const tone = (freq, dur, type = "sine", vol = 0.1, slideTo = null) => {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  };

  const sfx = useCallback((name) => {
    if (!dataRef.current.sfxOn) return;
    if (name === "pop") tone(700, 0.12, "sine", 0.15, 200);
    else if (name === "fire") tone(900, 0.08, "triangle", 0.05, 400);
    else if (name === "hurt") tone(220, 0.35, "sawtooth", 0.12, 80);
    else if (name === "coin") { tone(880, 0.1, "square", 0.08); setTimeout(() => tone(1320, 0.15, "square", 0.08), 80); }
    else if (name === "heart") { tone(660, 0.1, "sine", 0.12); setTimeout(() => tone(990, 0.15, "sine", 0.12), 90); }
    else if (name === "win") [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.25, "triangle", 0.15), i * 130));
    else if (name === "over") [392, 330, 262].forEach((f, i) => setTimeout(() => tone(f, 0.3, "sine", 0.15), i * 160));
    else if (name === "buy") [660, 880].forEach((f, i) => setTimeout(() => tone(f, 0.12, "triangle", 0.12), i * 90));
    else if (name === "claim") [784, 988, 1175].forEach((f, i) => setTimeout(() => tone(f, 0.18, "triangle", 0.14), i * 110));
    else if (name === "crown") [523, 659, 784, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.22, "triangle", 0.14), i * 110));
  }, []);

  useEffect(() => {
    if (!data.musicOn) return;
    let i = 0;
    const id = setInterval(() => {
      if (!dataRef.current.musicOn) return;
      tone(MELODY[i % MELODY.length], 0.22, "triangle", 0.035);
      i++;
    }, 260);
    return () => clearInterval(id);
  }, [data.musicOn]);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1600);
  };

  const cons = data.consumables || { shield: 0, extraLife: 0 };
  const rooms = { taht: 0, firin: 0, bahce: 0, kule: 0, ...(data.rooms || {}) };
  const today = todayStr();
  const dailyAvailable = data.lastDaily !== today;
  const dailyState = data.daily && data.daily.date === today
    ? data.daily
    : { date: today, kills: 0, golds: 0, combo: 0, claimed: [] };

  const worldDone = (wi) => {
    const start = wi * 5 + 1;
    for (let n = start; n < start + 5 && n <= LEVEL_COUNT; n++) {
      if (!(data.stars[n] > 0)) return false;
    }
    return true;
  };
  const worldsCount = WORLDS.length;
  const crownsEarned = Array.from({ length: worldsCount }, (_, i) => i).filter((i) => worldDone(i));
  const crownsClaimed = data.crownsClaimed || [];

  const claimCrown = (wi) => {
    if (crownsClaimed.includes(wi) || !worldDone(wi)) return;
    setData((d) => ({ ...d, coins: d.coins + CROWN_REWARD, crownsClaimed: [...(d.crownsClaimed || []), wi] }));
    sfx("crown");
    flash(`👑 ${WORLDS[wi].name} tacı: +${CROWN_REWARD} coin`);
  };

  const claimDaily = () => {
    if (!dailyAvailable) return;
    const bonus = 1 + (rooms.bahce || 0) * 0.1;
    const reward = Math.round(DAILY_REWARD * bonus);
    setData((d) => ({ ...d, coins: d.coins + reward, lastDaily: today }));
    sfx("claim");
    flash(`Günlük ödül: +${reward} coin 🍬`);
  };

  const claimAchievement = (a) => {
    if (data.claimed.includes(a.id)) return;
    setData((d) => ({ ...d, coins: d.coins + a.reward, claimed: [...d.claimed, a.id] }));
    sfx("claim");
    flash(`${a.name} başarımı: +${a.reward} coin`);
  };

  const claimQuest = (q) => {
    const cur = dailyState[q.id] || 0;
    if (cur < q.goal || dailyState.claimed.includes(q.id)) return;
    setData((d) => {
      const ds = d.daily && d.daily.date === today ? d.daily : { date: today, kills: 0, golds: 0, combo: 0, claimed: [] };
      return { ...d, coins: d.coins + q.reward, daily: { ...ds, claimed: [...ds.claimed, q.id] } };
    });
    sfx("claim");
    flash(`Görev tamamlandı: +${q.reward} coin`);
  };

  const upgradeRoom = (r) => {
    const lvl = rooms[r.id] || 0;
    if (lvl >= r.costs.length) return;
    const cost = r.costs[lvl];
    if (data.coins < cost) return flash("Yeterli coin yok!");
    setData((d) => ({ ...d, coins: d.coins - cost, rooms: { ...rooms, [r.id]: lvl + 1 } }));
    sfx("buy");
    flash(`${r.name} onarıldı!`);
  };

  const requestStart = (n) => {
    getCtx();
    const world = Math.floor((n - 1) / 5);
    const isFirst = (n - 1) % 5 === 0;
    if (isFirst && !(data.seenStory || []).includes(world)) {
      setStoryLevel(n);
      return;
    }
    startLevel(n);
  };

  const startLevel = (n) => {
    getCtx();
    const useShield = cons.shield > 0;
    const useExtra = cons.extraLife > 0;
    const towerShield = !useShield && Math.random() < (rooms.kule || 0) * 0.1;
    setRunItems({ shield: useShield || towerShield, extra: useExtra });
    setData((d) => {
      const world = Math.floor((n - 1) / 5);
      const seen = d.seenStory || [];
      return {
        ...d,
        seenStory: seen.includes(world) ? seen : [...seen, world],
        consumables: {
          shield: Math.max(0, (d.consumables?.shield || 0) - (useShield ? 1 : 0)),
          extraLife: Math.max(0, (d.consumables?.extraLife || 0) - (useExtra ? 1 : 0)),
        },
      };
    });
    setStoryLevel(null);
    setLevelNo(n);
    setGameKey((k) => k + 1);
    setScreen("game");
  };

  const finishRun = (res) => {
    const cfg = levelConfig(levelNo);
    const stars = res.won
      ? 1 + (res.lives >= 2 ? 1 : 0) + (res.score >= cfg.target * 1.5 ? 1 : 0)
      : 0;
    const d0 = dataRef.current;
    const r0 = { taht: 0, firin: 0, bahce: 0, kule: 0, ...(d0.rooms || {}) };
    const coinMult = 1 + (r0.firin || 0) * 0.1 + (r0.taht || 0) * 0.05;
    const baseCoins = res.won ? 15 + stars * 10 + cfg.n * 2 : Math.floor(res.score / 10);
    const coins = Math.round(baseCoins * (res.won ? coinMult : 1));

    setData((d) => {
      const prevStars = d.stars[levelNo] || 0;
      const newStars = { ...d.stars, [levelNo]: Math.max(prevStars, stars) };
      const unlockedLevel = res.won ? Math.max(d.unlockedLevel, Math.min(LEVEL_COUNT, levelNo + 1)) : d.unlockedLevel;
      const prev = d.stats || DEFAULT_SAVE.stats;
      const newStats = {
        wins: prev.wins + (res.won ? 1 : 0),
        totalGolds: prev.totalGolds + res.golds,
        totalKills: prev.totalKills + res.kills,
        bestCombo: Math.max(prev.bestCombo, res.maxCombo),
      };
      const ds = d.daily && d.daily.date === today ? d.daily : { date: today, kills: 0, golds: 0, combo: 0, claimed: [] };
      const newDaily = {
        ...ds,
        kills: ds.kills + res.kills,
        golds: ds.golds + res.golds,
        combo: Math.max(ds.combo, res.maxCombo),
      };
      return { ...d, coins: d.coins + coins, stars: newStars, unlockedLevel, stats: newStats, daily: newDaily };
    });
    setResult({ ...res, cfg, stars, coins, coinMult });
    setScreen("result");
    sfx(res.won ? "win" : "over");
  };

  const buyOrEquip = (item, ownedKey, equipKey) => {
    const d0 = dataRef.current;
    if ((d0[ownedKey] || []).includes(item.id)) {
      setData((d) => ({ ...d, [equipKey]: item.id }));
      return;
    }
    if (d0.coins < item.price) return flash("Yeterli coin yok!");
    setData((d) => ({ ...d, coins: d.coins - item.price, [ownedKey]: [...(d[ownedKey] || []), item.id], [equipKey]: item.id }));
    sfx("buy");
    flash(`${item.name} alındı!`);
  };

  const buyConsumable = (item) => {
    const d0 = dataRef.current;
    if (d0.coins < item.price) return flash("Yeterli coin yok!");
    setData((d) => ({
      ...d,
      coins: d.coins - item.price,
      consumables: { ...(d.consumables || { shield: 0, extraLife: 0 }), [item.id]: ((d.consumables || {})[item.id] || 0) + 1 },
    }));
    sfx("buy");
    flash(`${item.name} satın alındı!`);
  };

  const buyUpgrade = (key) => {
    const up = UPGRADES[key];
    const level = data.upgrades[key];
    if (level >= up.max) return;
    const cost = up.costs[level];
    if (data.coins < cost) return flash("Yeterli coin yok!");
    setData((d) => ({ ...d, coins: d.coins - cost, upgrades: { ...d.upgrades, [key]: d.upgrades[key] + 1 } }));
    sfx("buy");
    flash(`${up.name} yükseltildi!`);
  };

  const skin = SKINS.find((s) => s.id === data.skin) || SKINS[0];
  const trail = TRAILS.find((t) => t.id === data.trail) || TRAILS[0];
  const lives = BASE_LIVES + data.upgrades.lives + (runItems.extra ? 1 : 0);
  const fireCooldown = BASE_FIRE_COOLDOWN - data.upgrades.fire * 30;

  const screenBg = "linear-gradient(160deg, #fdf2f8 0%, #f0abfc 50%, #a78bfa 100%)";

  const Header = ({ title, back = "menu" }) => (
    <div className="flex justify-between items-center w-full max-w-[400px]">
      <button onClick={() => setScreen(back)} className="px-3 py-1 bg-white/90 rounded-full text-fuchsia-700 font-bold text-sm shadow">← Geri</button>
      <h2 className="text-xl font-extrabold text-fuchsia-800 drop-shadow">{title}</h2>
      <span className="text-sm font-bold text-fuchsia-800 bg-white/70 px-2 py-0.5 rounded-full">🍬 {data.coins}</span>
    </div>
  );

  const Toast = () => toast ? (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white px-5 py-2 rounded-full shadow-xl text-sm font-bold z-50 max-w-[90%] text-center" style={{ animation: "cdPop 0.3s ease-out" }}>{toast}</div>
  ) : null;

  const StoryModal = () => {
    if (storyLevel === null) return null;
    const cfg = levelConfig(storyLevel);
    const w = cfg.world;
    return (
      <div className="fixed inset-0 bg-fuchsia-950/60 flex items-center justify-center z-50 p-4">
        <div className="max-w-[360px] w-full rounded-3xl p-5 text-center shadow-2xl" style={{ background: `linear-gradient(to bottom, ${w.bg[0]}, ${w.bg[1]})`, animation: "cdPop 0.4s ease-out" }}>
          <p className="text-5xl mb-1" style={{ animation: "cdFloat 2.5s ease-in-out infinite", filter: "drop-shadow(0 4px 4px rgba(0,0,0,0.3))" }}>{w.icon}</p>
          <p className="text-xs font-bold text-fuchsia-900 uppercase tracking-wide">{w.name}</p>
          <h3 className="text-xl font-black mt-1" style={{ color: w.accent }}>{w.hero}</h3>
          <p className="text-sm font-semibold text-fuchsia-950 mt-3 leading-relaxed">{w.story}</p>
          <div className="flex gap-2 justify-center mt-5">
            <button className={btn} onClick={() => setStoryLevel(null)}>Geri dön</button>
            <button className={btn} onClick={() => startLevel(storyLevel)}>Başla ▶</button>
          </div>
        </div>
      </div>
    );
  };

  const totalStars = Object.values(data.stars).reduce((a, b) => a + b, 0);
  const roomLevelSum = Object.values(rooms).reduce((a, b) => a + b, 0);

  let content = null;

  if (screen === "menu") {
    content = (
      <div className="relative flex flex-col items-center justify-center gap-5 min-h-[600px] w-full overflow-hidden">
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} style={{ position: "absolute", left: `${(i * 37) % 95}%`, top: `${(i * 53) % 90}%`, animation: `cdFloat ${4 + (i % 4)}s ease-in-out ${i * 0.4}s infinite`, opacity: 0.75 }}>
              {i % 3 === 0 ? <WrappedCandy color={CANDY_COLORS[i % CANDY_COLORS.length]} width={44} height={30} /> : i % 3 === 1 ? <Lollipop color={CANDY_COLORS[i % CANDY_COLORS.length]} size={34} /> : <Gummy color={CANDY_COLORS[i % CANDY_COLORS.length]} width={32} height={32} />}
            </div>
          ))}
        </div>
        <div className="text-center z-10" style={{ animation: "cdTitle 3s ease-in-out infinite" }}>
          <h1 className="text-5xl font-black" style={{ background: "linear-gradient(to bottom, #ffffff, #fef08a 45%, #fb923c 100%)", WebkitBackgroundClip: "text", color: "transparent", filter: "drop-shadow(0 4px 0 #9d174d) drop-shadow(0 8px 10px rgba(0,0,0,0.35))" }}>
            Şeker Dodge
          </h1>
          <p className="text-fuchsia-950 font-bold mt-2 drop-shadow">Krallığı şekerlerin istilasından kurtar!</p>
        </div>
        {dailyAvailable && (
          <button className={btn + " z-10 animate-pulse"} onClick={claimDaily}>🎁 Günlük ödülü al (+{DAILY_REWARD})</button>
        )}
        <div className="flex flex-col gap-3 items-center z-10">
          <button className={btn} onClick={() => { getCtx(); setScreen("map"); }}>▶ Oyna</button>
          <button className={btn} onClick={() => setScreen("castle")}>🏰 Kraliyet Sarayı</button>
          <button className={btn} onClick={() => setScreen("achievements")}>🏅 Başarımlar</button>
          <button className={btn} onClick={() => setScreen("shop")}>🛒 Mağaza</button>
          <button className={btn} onClick={() => setScreen("settings")}>⚙️ Ayarlar</button>
        </div>
        <div className="z-10 px-4 py-1 rounded-full bg-white/85 text-sm font-extrabold text-fuchsia-800 shadow">
          🍬 {data.coins} · ⭐ {totalStars} / {LEVEL_COUNT * 3} · 👑 {crownsEarned.length} / {worldsCount}
        </div>
      </div>
    );
  }

  if (screen === "castle") {
    content = (
      <div className="flex flex-col items-center gap-4 p-4 w-full">
        <Header title="Kraliyet Sarayı" />
        <div className={panel + " flex flex-col items-center gap-2"}>
          <CastleArt rooms={rooms} />
          <p className="text-xs font-bold text-fuchsia-900">Onarılan oda puanı: {roomLevelSum} / 12</p>
        </div>

        <div className="flex items-end gap-3 justify-center w-full max-w-[400px]">
          <KingPortrait mood={kingLine} />
        </div>

        <p className="text-sm font-extrabold text-fuchsia-900">Odaları onar</p>
        {ROOMS.map((r) => {
          const lvl = rooms[r.id] || 0;
          const maxed = lvl >= r.costs.length;
          return (
            <div key={r.id} className={panel + " flex items-center justify-between gap-3"}>
              <div className="flex items-center gap-3">
                <span className="text-4xl" style={{ animation: "cdBob 2.4s ease-in-out infinite", filter: "drop-shadow(0 4px 4px rgba(0,0,0,0.3))" }}>{r.icon}</span>
                <div>
                  <p className="font-bold text-fuchsia-800">{r.name} <span className="text-xs">({lvl}/{r.costs.length})</span></p>
                  <p className="text-xs text-fuchsia-700 font-semibold">{lvl > 0 ? r.desc(lvl) : "Henüz onarılmadı"}</p>
                  <div className="flex gap-1 mt-1">
                    {r.costs.map((_, i) => (
                      <div key={i} className="h-2 w-8 rounded-full" style={{ background: i < lvl ? "linear-gradient(to right,#f472b6,#fb923c)" : "#e9d5ff" }} />
                    ))}
                  </div>
                </div>
              </div>
              <button className={btn} disabled={maxed} onClick={() => upgradeRoom(r)}>
                {maxed ? "MAX" : `🍬 ${r.costs[lvl]}`}
              </button>
            </div>
          );
        })}

        <p className="text-sm font-extrabold text-fuchsia-900 mt-2">Krallık tacları</p>
        <p className="text-xs text-fuchsia-900 font-semibold text-center max-w-[400px]">Bir dünyanın beş bölümünü de tamamlayınca taç kazanırsın.</p>
        {WORLDS.map((w, wi) => {
          const done = worldDone(wi);
          const claimed = crownsClaimed.includes(wi);
          return (
            <div key={w.name} className={panel + " flex items-center justify-between gap-3"}>
              <div className="flex items-center gap-3">
                <span className="text-3xl" style={{ filter: done ? "drop-shadow(0 0 6px #fde047) drop-shadow(0 3px 3px rgba(0,0,0,0.3))" : "grayscale(1)", opacity: done ? 1 : 0.5 }}>👑</span>
                <div>
                  <p className="font-bold text-fuchsia-800 text-sm">{w.icon} {w.name}</p>
                  <p className="text-xs text-fuchsia-700 font-semibold">{done ? "Dünya kurtarıldı" : "5 bölümü tamamla"}</p>
                </div>
              </div>
              <button className={btn} disabled={!done || claimed} onClick={() => claimCrown(wi)}>
                {claimed ? "✓" : done ? `🍬 ${CROWN_REWARD}` : "🔒"}
              </button>
            </div>
          );
        })}

        <p className="text-sm font-extrabold text-fuchsia-900 mt-2">Günlük görevler</p>
        {DAILY_QUESTS.map((q) => {
          const cur = Math.min(dailyState[q.id] || 0, q.goal);
          const done = cur >= q.goal;
          const claimed = dailyState.claimed.includes(q.id);
          return (
            <div key={q.id} className={panel + " flex items-center justify-between gap-3"}>
              <div className="flex-1">
                <p className="font-bold text-fuchsia-800 text-sm">{q.text}</p>
                <p className="text-xs text-fuchsia-700 font-semibold">{cur} / {q.goal}</p>
                <div className="w-full h-2 bg-fuchsia-100 rounded-full mt-1 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(cur / q.goal) * 100}%`, background: "linear-gradient(to right,#f472b6,#fb923c)" }} />
                </div>
              </div>
              <button className={btn} disabled={!done || claimed} onClick={() => claimQuest(q)}>
                {claimed ? "✓" : done ? `🍬 ${q.reward}` : "🔒"}
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  if (screen === "map") {
    content = (
      <div className="flex flex-col items-center gap-3 p-4">
        <Header title="Seviye Haritası" />
        <p className="text-xs font-bold text-fuchsia-900 bg-white/70 rounded-full px-4 py-1">
          Eşyalarım: 🛡️ {cons.shield} · ❤️ {cons.extraLife} · ⭐ {totalStars}
        </p>
        <LevelMap data={data} onPlay={(n) => requestStart(n)} mapRef={mapRef} />
        <p className="text-[11px] text-fuchsia-900 font-semibold text-center max-w-[400px]">
          Her dünyanın ilk bölümünde hikâye açılır. 8. seviyeden itibaren çatlayan jöleler çıkar.
        </p>
      </div>
    );
  }

  if (screen === "game") {
    const cfg = levelConfig(levelNo);
    content = (
      <div className="flex flex-col items-center p-2">
        <div className="flex justify-start w-full max-w-[400px] mb-1">
          <button onClick={() => setScreen("map")} className="px-3 py-1 bg-white/90 rounded-full text-fuchsia-700 font-bold text-sm shadow">← Harita</button>
        </div>
        <Game
          key={gameKey}
          cfg={cfg}
          skin={skin}
          trailColor={trail.color}
          lives={lives}
          shieldOn={runItems.shield}
          fireCooldown={fireCooldown}
          sfx={sfx}
          onFinish={finishRun}
        />
      </div>
    );
  }

  if (screen === "result" && result) {
    const hasNext = result.won && levelNo < LEVEL_COUNT;
    content = (
      <div className="flex flex-col items-center justify-center gap-5 min-h-[600px] p-4">
        <div className={panel + " text-center"} style={{ animation: "cdPop 0.4s ease-out" }}>
          <p className="text-6xl mb-2" style={{ animation: "cdFloat 2s ease-in-out infinite", filter: "drop-shadow(0 6px 6px rgba(0,0,0,0.3))" }}>{result.won ? "🏆" : "💥"}</p>
          <h2 className="text-2xl font-black text-fuchsia-800">{result.won ? `Bölüm ${levelNo} Tamamlandı!` : "Bölüm Başarısız"}</h2>
          <p className="text-sm text-fuchsia-700 font-semibold mt-1">{objectiveText(result.cfg)}</p>
          <div className="flex justify-center gap-1 text-4xl my-3">
            {[1, 2, 3].map((s) => (
              <span key={s} style={{ opacity: s <= result.stars ? 1 : 0.25, filter: s <= result.stars ? "drop-shadow(0 0 6px #facc15) drop-shadow(0 3px 3px rgba(0,0,0,0.3))" : "grayscale(1)", animation: s <= result.stars ? `cdPop 0.4s ${s * 0.15}s both` : undefined }}>⭐</span>
            ))}
          </div>
          <p className="mt-1 text-fuchsia-800 font-bold">Skor: {result.score}</p>
          <p className="text-fuchsia-800 font-bold">Kazanılan coin: 🍬 +{result.coins}</p>
          {result.won && result.coinMult > 1 && <p className="text-xs text-fuchsia-700 mt-1">Saray bonusu: x{result.coinMult.toFixed(2)}</p>}
          <p className="text-xs text-fuchsia-700 mt-1">Altın: {result.golds} · Kombo: x{Math.min(result.maxCombo, MAX_COMBO)} · Patlatılan: {result.kills}</p>
        </div>
        <div className="flex flex-col gap-2 items-center">
          {hasNext && <button className={btn} onClick={() => requestStart(levelNo + 1)}>Sonraki bölüm ▶</button>}
          <button className={btn} onClick={() => startLevel(levelNo)}>Tekrar oyna</button>
          <button className={btn} onClick={() => setScreen("map")}>Harita</button>
          <button className={btn} onClick={() => setScreen("menu")}>Ana menü</button>
        </div>
      </div>
    );
  }

  if (screen === "achievements") {
    content = (
      <div className="flex flex-col items-center gap-3 p-4">
        <Header title="Başarımlar" />
        {ACHIEVEMENTS.map((a) => {
          const val = Math.min(a.value(data), a.goal);
          const done = val >= a.goal;
          const claimed = data.claimed.includes(a.id);
          return (
            <div key={a.id} className={panel + " flex items-center justify-between gap-3"}>
              <div className="flex-1">
                <p className="font-bold text-fuchsia-800">🏅 {a.name}</p>
                <p className="text-xs text-fuchsia-700 font-semibold">{a.desc} · {val} / {a.goal}</p>
                <div className="w-full h-2 bg-fuchsia-100 rounded-full mt-1 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(val / a.goal) * 100}%`, background: "linear-gradient(to right,#f472b6,#fb923c)" }} />
                </div>
              </div>
              <button className={btn} disabled={!done || claimed} onClick={() => claimAchievement(a)}>
                {claimed ? "✓" : done ? `🍬 ${a.reward}` : "🔒"}
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  if (screen === "shop") {
    const tabs = [
      { id: "skins", label: "Bonbonlar" },
      { id: "trails", label: "Mermi izi" },
      { id: "items", label: "Eşyalar" },
      { id: "upgrades", label: "Yükseltme" },
    ];
    content = (
      <div className="flex flex-col items-center gap-4 p-4 w-full">
        <Header title="Mağaza" />
        <div className="flex gap-2 flex-wrap justify-center">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setShopTab(t.id)}
              className={`px-3 py-1 rounded-full font-bold text-sm shadow ${shopTab === t.id ? "bg-fuchsia-600 text-white" : "bg-white text-fuchsia-700"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {shopTab === "skins" && SKINS.map((s) => {
          const owned = data.owned.includes(s.id);
          const equipped = data.skin === s.id;
          return (
            <div key={s.id} className={panel + " flex items-center justify-between"} style={equipped ? { animation: "cdGlow 2s ease-in-out infinite" } : undefined}>
              <div className="flex items-center gap-3">
                <div style={{ animation: "cdFloat 3s ease-in-out infinite" }}>
                  <SkinCandy skin={s} width={64} height={42} glow={equipped} />
                </div>
                <div>
                  <p className="font-bold text-fuchsia-800">{s.name}{s.rainbow ? " 🌈" : ""}</p>
                  <p className="text-xs text-fuchsia-700 font-semibold">{owned ? (equipped ? "✨ Kullanılıyor" : "Sahipsin") : `🍬 ${s.price}`}</p>
                </div>
              </div>
              <button className={btn} disabled={equipped} onClick={() => buyOrEquip(s, "owned", "skin")}>
                {equipped ? "✓" : owned ? "Kullan" : "Satın al"}
              </button>
            </div>
          );
        })}

        {shopTab === "trails" && TRAILS.map((t) => {
          const owned = (data.ownedTrails || []).includes(t.id);
          const equipped = data.trail === t.id;
          return (
            <div key={t.id} className={panel + " flex items-center justify-between"}>
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-8 flex items-center justify-end">
                  {[0, 1, 2, 3].map((j) => (
                    <div key={j} style={{ position: "absolute", left: 6 + j * 10, width: 8 - j, height: 8 - j, borderRadius: "50%", background: t.color, opacity: 1 - j * 0.2, filter: "blur(0.5px)" }} />
                  ))}
                  <div style={{ position: "absolute", right: 0, width: 14, height: 14, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff, ${t.color} 60%, color-mix(in srgb, ${t.color} 60%, #000))`, boxShadow: `0 0 10px ${t.color}` }} />
                </div>
                <div>
                  <p className="font-bold text-fuchsia-800">{t.name}</p>
                  <p className="text-xs text-fuchsia-700 font-semibold">{owned ? (equipped ? "✨ Kullanılıyor" : "Sahipsin") : `🍬 ${t.price}`}</p>
                </div>
              </div>
              <button className={btn} disabled={equipped} onClick={() => buyOrEquip(t, "ownedTrails", "trail")}>
                {equipped ? "✓" : owned ? "Kullan" : "Satın al"}
              </button>
            </div>
          );
        })}

        {shopTab === "items" && (
          <>
            <p className="text-xs text-fuchsia-900 font-semibold text-center max-w-[400px]">Eşyalar tek koşuluktur. Satın aldığın eşya bir sonraki koşunda otomatik kullanılır.</p>
            {CONSUMABLES.map((c) => (
              <div key={c.id} className={panel + " flex items-center justify-between"}>
                <div className="flex items-center gap-3">
                  <span className="text-4xl" style={{ animation: "cdBob 2s ease-in-out infinite", filter: "drop-shadow(0 4px 4px rgba(0,0,0,0.3))" }}>{c.icon}</span>
                  <div>
                    <p className="font-bold text-fuchsia-800">{c.name} <span className="text-xs">(sende: {cons[c.id] || 0})</span></p>
                    <p className="text-xs text-fuchsia-700 font-semibold">{c.desc}</p>
                  </div>
                </div>
                <button className={btn} onClick={() => buyConsumable(c)}>🍬 {c.price}</button>
              </div>
            ))}
          </>
        )}

        {shopTab === "upgrades" && Object.entries(UPGRADES).map(([key, up]) => {
          const level = data.upgrades[key];
          const maxed = level >= up.max;
          return (
            <div key={key} className={panel + " flex items-center justify-between"}>
              <div>
                <p className="font-bold text-fuchsia-800">{up.name} <span className="text-xs">({level}/{up.max})</span></p>
                <p className="text-xs text-fuchsia-700 font-semibold">{up.desc}</p>
                <div className="flex gap-1 mt-2">
                  {Array.from({ length: up.max }, (_, i) => (
                    <div key={i} className="h-2 w-8 rounded-full" style={{ background: i < level ? "linear-gradient(to right,#f472b6,#fb923c)" : "#e9d5ff" }} />
                  ))}
                </div>
              </div>
              <button className={btn} disabled={maxed} onClick={() => buyUpgrade(key)}>
                {maxed ? "MAX" : `🍬 ${up.costs[level]}`}
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  if (screen === "settings") {
    content = (
      <div className="flex flex-col items-center gap-4 p-4">
        <Header title="Ayarlar" />
        <div className={panel + " flex justify-between items-center"}>
          <span className="font-bold text-fuchsia-800">🎵 Müzik</span>
          <button className={btn} onClick={() => { getCtx(); setData((d) => ({ ...d, musicOn: !d.musicOn })); }}>{data.musicOn ? "Açık" : "Kapalı"}</button>
        </div>
        <div className={panel + " flex justify-between items-center"}>
          <span className="font-bold text-fuchsia-800">🔊 Ses efektleri</span>
          <button className={btn} onClick={() => setData((d) => ({ ...d, sfxOn: !d.sfxOn }))}>{data.sfxOn ? "Açık" : "Kapalı"}</button>
        </div>
        <div className={panel + " flex justify-between items-center"}>
          <span className="font-bold text-fuchsia-800">🗑️ İlerlemeyi sıfırla</span>
          <button className={btn} onClick={() => { if (window.confirm("Tüm ilerleme silinsin mi?")) setData(DEFAULT_SAVE); }}>Sıfırla</button>
        </div>
      </div>
    );
  }

  const bgWorld = screen === "game" ? levelConfig(levelNo).world : null;
  const bg = bgWorld
    ? `linear-gradient(to bottom, ${bgWorld.bg[0]}, ${bgWorld.bg[1]} 55%, ${bgWorld.bg[2]})`
    : screenBg;

  return (
    <div className="min-h-[620px] w-full flex items-start justify-center py-4 rounded-3xl relative overflow-hidden" style={{ background: bg }}>
      <style>{CSS}</style>
      {content}
      <StoryModal />
      <Toast />
    </div>
  );
}