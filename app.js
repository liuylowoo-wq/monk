const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const TILE = 32;
const SAVE_VERSION = "mainline-momo-v3";
const SAVE_INDEX_KEY = "glyphbound-save-slots";
const CURRENT_SLOT_KEY = "glyphbound-current-slot";
const CLOUD_RIDE_COST = 100;
const PINYIN_STREAM = { start: 4020, end: 4700, surfaceY: 414, height: 86 };
const CLOUD_LAKE = { start: 5200, end: 6800, waterStart: 5480, waterEnd: 6620, surfaceY: 340, height: 170 };
const FISHING_SPOT = { x: 5428, y: 358 };
const LAKE_HOME = { x: 6660, y: 338, doorX: 6660, doorY: 394 };
const keys = new Set();
let frame = 0;
let music = null;
let currentSlotId = null;

const cast = {
  narrator: { name: "Narrator", portrait: "momo", expression: "thinking" },
  lina: { name: "Xiao Wu", portrait: "lina", expression: "confident" },
  momo: { name: "Momo", portrait: "momo", expression: "happy" },
  mei: { name: "Master Yun", portrait: "mei", expression: "thinking" },
  wuyin: { name: "Wuyin", portrait: "wuyin", expression: "angry" },
  ayi: { name: "Ayi Fen", portrait: "ayi", expression: "happy" },
  linPo: { name: "Lin Po", portrait: "linpo", expression: "happy" },
  tao: { name: "Tao", portrait: "tao", expression: "thinking" },
  an: { name: "An", portrait: "an", expression: "thinking" },
  guard: { name: "Guard Bo", portrait: "guard", expression: "confident" },
  chef: { name: "Chef Rui", portrait: "chef", expression: "happy" },
  echo: { name: "Nana", portrait: "ayi", expression: "happy" },
  villager: { name: "Valley Child", portrait: "an", expression: "thinking" },
  shadow: { name: "Silent Shadow", portrait: "wuyin", expression: "angry" }
};

const momoColors = {
  black: { label: "Black Momo", body: "#111827", shadow: "#0b1020", eye: "#fff7d7", glyph: "#fff7d7" },
  yellow: { label: "Yellow Momo", body: "#f1c550", shadow: "#c9902f", eye: "#172033", glyph: "#172033" },
  blue: { label: "Blue Momo", body: "#2f8fd8", shadow: "#1f5f9a", eye: "#fff7d7", glyph: "#fff7d7" }
};

const regions = [
  {
    id: "village",
    name: "Beginner Village",
    start: 0,
    end: 2300,
    theme: "Greetings",
    sky: "#7ad1ff",
    ground: "#64bf62"
  },
  {
    id: "forest",
    name: "Forest Region",
    start: 2300,
    end: 3400,
    theme: "Nature",
    sky: "#6fb7e8",
    ground: "#4fa96a"
  },
  {
    id: "market",
    name: "Pinyin Valley",
    start: 3400,
    end: 5200,
    theme: "Sounds",
    sky: "#f3c978",
    ground: "#8ebf79"
  },
  {
    id: "cloudLake",
    name: "Cloud Lake",
    start: 5200,
    end: 6800,
    theme: "Lake Words",
    sky: "#8dd7e8",
    ground: "#88b987"
  }
];

const lakeCatches = [
  { id: "worm", glyph: "虫", pinyin: "chóng", english: "worm", kind: "first" },
  { id: "waterGrass", glyph: "水草", pinyin: "shuǐ cǎo", english: "water grass", kind: "plant" },
  { id: "fish", glyph: "鱼", pinyin: "yú", english: "fish", kind: "river" },
  { id: "shrimp", glyph: "虾", pinyin: "xiā", english: "shrimp", kind: "river" },
  { id: "crab", glyph: "蟹", pinyin: "xiè", english: "crab", kind: "river" }
];

const pinyinLessons = [
  {
    id: "ma",
    title: "ma / mǎ",
    stage: "1 / 6",
    glyph: "马",
    releaseCost: 8,
    card: "A glowing seal trembles beside the valley gate. The sound ma is hidden inside it. Say the right pinyin to free the horse.",
    prompt: "Choose the pinyin for 马 to release the little horse.",
    options: ["mā", "má", "mǎ", "mà"],
    answer: "mǎ",
    success: "The light shell cracks open. A small horse shakes its mane and runs toward the village.",
    fail: "Almost. 马 uses the third tone: mǎ.",
    creature: { id: "horse", emoji: "🐴", hanzi: "马", pinyin: "mǎ", english: "horse", kind: "animal", source: "orb", x: 3790, y: 370 }
  },
  {
    id: "mao",
    title: "mao / māo",
    stage: "2 / 6",
    glyph: "猫",
    releaseCost: 10,
    card: "A sealed flower bud trembles beside the temple path. A cat is curled inside the sound mao.",
    prompt: "Choose the pinyin for 猫 to open the bud and release the cat.",
    options: ["mǎo", "māo", "miāo", "máo"],
    answer: "māo",
    success: "The bud opens with a pop. A tiny cat jumps down and starts patrolling the path.",
    fail: "Cat is 猫, pronounced māo with the first tone.",
    creature: { id: "cat", emoji: "🐱", hanzi: "猫", pinyin: "māo", english: "cat", kind: "animal", source: "bud", x: 3970, y: 318 }
  },
  {
    id: "yu",
    title: "yu / yú",
    stage: "3 / 6",
    glyph: "鱼",
    releaseCost: 12,
    card: "The river surface glows but no fish can swim through. The fish is waiting inside the rising sound yu.",
    prompt: "Choose the pinyin for 鱼 to let the fish swim out.",
    options: ["yū", "yú", "yǔ", "yù"],
    answer: "yú",
    success: "Silver light ripples across the river. A little fish slips free and circles happily.",
    fail: "鱼 is yú, second tone, like the sound is climbing.",
    creature: { id: "fish", emoji: "🐟", hanzi: "鱼", pinyin: "yú", english: "fish", kind: "animal", source: "river", x: 4100, y: 434 }
  },
  {
    id: "niao",
    title: "niao / niǎo",
    stage: "4 / 6",
    glyph: "鸟",
    releaseCost: 14,
    card: "A branch shakes without song. A bird is trapped in the sound niao.",
    prompt: "Choose the pinyin for 鸟 to wake the bird.",
    options: ["niāo", "niáo", "niǎo", "niào"],
    answer: "niǎo",
    success: "The branch flashes. A bird bursts out and begins circling over the valley.",
    fail: "鸟 is niǎo, third tone.",
    creature: { id: "bird", emoji: "🐦", hanzi: "鸟", pinyin: "niǎo", english: "bird", kind: "animal", source: "branch", x: 4210, y: 286 }
  },
  {
    id: "hua",
    title: "hua / huā",
    stage: "5 / 6",
    glyph: "花",
    releaseCost: 16,
    card: "A patch of earth has forgotten how to bloom. The flowers are sealed inside hua.",
    prompt: "Choose the pinyin for 花 to make the flowers bloom.",
    options: ["huā", "huá", "huǎ", "huà"],
    answer: "huā",
    success: "Flowers unfold across the path. Color returns to the valley floor.",
    fail: "花 is huā, first tone.",
    creature: { id: "flower", emoji: "🌸", hanzi: "花", pinyin: "huā", english: "flower", kind: "plant", source: "flower", x: 4445, y: 400 }
  },
  {
    id: "shu",
    title: "shu / shù",
    stage: "6 / 6",
    glyph: "树",
    releaseCost: 18,
    card: "A small earth seal waits near the final path. The sound shu restores the valley's living ground.",
    prompt: "Choose the pinyin for 树 to restore the living ground.",
    options: ["sù", "shū", "shǔ", "shù"],
    answer: "shù",
    success: "Green light spreads across the ground. The Silent Shadow's gate begins to loosen.",
    fail: "树 is shù, fourth tone.",
    creature: { id: "livingGround", emoji: "✦", hanzi: "树", pinyin: "shù", english: "tree", kind: "plant", source: "ground", x: 4630, y: 392 }
  }
];

const mapLocations = [
  { id: "monastery", chapter: 1, name: "Monastery Gate", label: "Start", x: 8, y: 66, unlock: (chapter) => chapter.openingDone || player.x > 100 },
  { id: "momoMartMap", chapter: 1, name: "Momo Mart", label: "Momo", x: 16, y: 50, unlock: (chapter) => chapter.companionJoined || player.x > 620 },
  { id: "memoryBridgeMap", chapter: 1, name: "Memory Bridge", label: "Bridge", x: 32, y: 60, unlock: (chapter) => chapter.bridgeSolved || player.x > 1900 },
  { id: "wuxingForestMap", chapter: 1, name: "Wuxing Forest", label: "Forest", x: 42, y: 40, unlock: (chapter) => chapter.stageOneCleared || player.x > 2500 },
  { id: "pinyinGateMap", chapter: 2, name: "Pinyin Valley Gate", label: "Gate", x: 55, y: 62, unlock: (chapter) => chapter.pinyin?.introSeen || player.x > 3600 },
  { id: "soundTempleMap", chapter: 2, name: "Sound Temple", label: "Temple", x: 60, y: 38, unlock: (chapter) => (chapter.pinyin?.completed?.length || 0) >= 1 || player.x > 3900 },
  { id: "lifeValleyMap", chapter: 2, name: "Living Valley", label: "Life", x: 67, y: 57, unlock: (chapter) => (chapter.pinyin?.completed?.length || 0) >= 3 || player.x > 4300 },
  { id: "silentShadowMap", chapter: 2, name: "Silent Shadow Gate", label: "Boss", x: 74, y: 36, unlock: (chapter) => chapter.pinyin?.bossUnlocked || chapter.pinyin?.bossDefeated },
  { id: "cloudLakeMap", chapter: 3, name: "Cloud Lake", label: "湖", x: 86, y: 58, unlock: (chapter) => chapter.lake?.unlocked || player.x > CLOUD_LAKE.start },
  { id: "lakeHomeMap", chapter: 3, name: "Lakeside Home", label: "家", x: 94, y: 44, anchor: "lakeHome", unlock: (chapter) => chapter.lake?.homeBuilt || chapter.lake?.homeDiscovered }
];

const spirits = {
  ren: { glyph: "人", name: "Ren", rarity: "Common", group: "people", ability: "Friend Call", meaning: "person", level: 1 },
  jin: { glyph: "金", name: "Jin", rarity: "Element", group: "metal", ability: "Bell Guard", meaning: "metal / gold", level: 1 },
  mu: { glyph: "木", name: "Mu", rarity: "Element", group: "wood", ability: "Root Step", meaning: "wood / tree", level: 1 },
  shui: { glyph: "水", name: "Shui", rarity: "Common", group: "nature", ability: "Clear Flow", meaning: "water", level: 1 },
  huo: { glyph: "火", name: "Huo", rarity: "Common", group: "elements", ability: "Flame Strike", meaning: "fire", level: 1 },
  tu: { glyph: "土", name: "Tu", rarity: "Element", group: "earth", ability: "Stone Breath", meaning: "earth / soil", level: 1 },
  yue: { glyph: "月", name: "Yue", rarity: "Rare", group: "night", ability: "Moon Path", meaning: "moon", level: 1 },
  meng: { glyph: "梦", name: "Meng", rarity: "Rare", group: "dreams", ability: "Memory Light", meaning: "dream", level: 1 }
};

const quests = [
  {
    id: "buyMomo",
    title: "Visit Momo Mart",
    objective: "Visit Momo Mart and wake the ink-spirit companion.",
    done: false
  },
  {
    id: "collectElements",
    title: "Collect the Five Elements",
    objective: "Gather 金, 木, 水, 火, and 土 to open the first chapter path.",
    done: false
  },
  {
    id: "collectRen",
    title: "Collect 人",
    objective: "Rescue the first character spirit.",
    done: false
  },
  {
    id: "defeatForgotten",
    title: "Defeat a Forgotten Word",
    objective: "Use Chinese knowledge to strengthen a combat skill.",
    done: false
  },
  {
    id: "openForest",
    title: "Repair the Memory Bridge",
    objective: "Use the five element spirits to repair the bridge.",
    done: false
  },
  {
    id: "enterForest",
    title: "Enter the Element Forest",
    objective: "Cross the bridge and find the corrupted word blocking the forest path.",
    done: false
  },
  {
    id: "festival",
    title: "Cross Into Wuxing Forest",
    objective: "Cross the bridge and continue toward Wuxing Forest.",
    done: false
  },
  {
    id: "incident",
    title: "Follow the Black Bell",
    objective: "Investigate the sound from the sealed shrine.",
    done: false
  },
  {
    id: "chapterBoss",
    title: "Defeat the Bell Eater",
    objective: "Use character spirits to protect Beginner Village.",
    done: false
  },
  {
    id: "enterPinyinValley",
    title: "Enter Pinyin Valley",
    objective: "Follow Momo beyond Wuxing Forest and listen for the lost voices.",
    done: false
  },
  {
    id: "restoreVoices",
    title: "Restore Valley Voices",
    objective: "Finish the small pinyin lessons for the silent villagers.",
    done: false
  },
  {
    id: "silentShadow",
    title: "Cleanse Silent Shadow",
    objective: "Review initials, finals, tones, and blending to return the valley's sound.",
    done: false
  },
  {
    id: "enterCloudLake",
    title: "Reach Cloud Lake",
    objective: "Use 云 (yún, cloud) to reach the quiet lake beyond Pinyin Valley.",
    done: false
  },
  {
    id: "lakeFishing",
    title: "Fish at Cloud Lake",
    objective: "Sit by the lakeside chair and press Space to fish up lake words.",
    done: false
  },
  {
    id: "buildLakeHome",
    title: "Build a Lakeside Home",
    objective: "Ride the cloud across Cloud Lake and inspect the empty house on the far shore.",
    done: false
  }
];

const npcs = [
  {
    id: "mei",
    name: "Master Yun",
    x: 360,
    y: 356,
    glyph: "师",
    color: "#4aa7ff",
    actor: "mei",
    job: "Wandering master",
    personality: "dry humor, patient, sharper than he looks",
    favoritePlace: "the cracked bell",
    activity: "read",
    sprite: { skin: "#d6a27f", hair: "#d8d1c4", coat: "#4aa7ff", trim: "#fff7d7", pants: "#2f405f", prop: "scroll" },
    schedule: [
      { start: 0, end: 1, x: 360, y: 356, activity: "read" }
    ],
    lines: [
      { actor: "mei", expression: "thinking", text: "Xiao Wu, go to Momo Mart first." },
      { actor: "mei", expression: "confident", text: "Wake Momo from the ink shelf. It can help read strange characters." }
    ]
  },
  {
    id: "vendor",
    name: "Ayi Fen",
    x: 2500,
    y: 356,
    glyph: "买",
    color: "#f1c550",
    actor: "ayi",
    job: "traveling merchant",
    personality: "warm, practical, suspiciously good at bargaining",
    favoritePlace: "market awning",
    activity: "carryBox",
    sprite: { skin: "#c98a68", hair: "#2f2430", coat: "#f1c550", trim: "#b85f42", pants: "#314160", prop: "box" },
    schedule: [
      { start: 0, end: 0.45, x: 2500, y: 356, activity: "carryBox" },
      { start: 0.45, end: 0.75, x: 2360, y: 356, activity: "sell" },
      { start: 0.75, end: 1, x: 2585, y: 356, activity: "countCoins" }
    ],
    lines: [
      { actor: "ayi", expression: "happy", text: "Every morning I buy noodles from the old woman near the bridge." },
      { actor: "ayi", expression: "thinking", text: "She says the river remembers every word ever spoken." },
      { actor: "momo", expression: "happy", text: "If the river remembers, it may know where the lost words drifted." },
      { actor: "ayi", expression: "confident", text: "In this village, 买 means buy, 钱 means money. Learn both before the stalls start arguing." }
    ]
  }
];

const pickups = [
  {
    id: "jin",
    spirit: "jin",
    x: 920,
    y: 370,
    collected: false,
    hint: "金",
    line: "The 金 spirit rings like a tiny bell. 金 means metal."
  },
  {
    id: "mu",
    spirit: "mu",
    x: 1180,
    y: 342,
    collected: false,
    hint: "木",
    line: "The 木 spirit rustles awake. 木 means wood."
  },
  {
    id: "ren",
    spirit: "ren",
    x: 1420,
    y: 370,
    collected: false,
    hint: "人",
    line: "The 人 spirit joins you. 人 means person."
  },
  {
    id: "shui",
    spirit: "shui",
    x: 1660,
    y: 338,
    collected: false,
    hint: "水",
    line: "The 水 spirit joins you. 水 means water."
  },
  {
    id: "tu",
    spirit: "tu",
    x: 1900,
    y: 370,
    collected: false,
    hint: "土",
    line: "The 土 spirit settles into your palm. 土 means earth."
  },
  {
    id: "yue",
    spirit: "yue",
    x: 1320,
    y: 292,
    collected: false,
    hint: "月",
    secret: true,
    line: "A hidden 月 spirit wakes under the old roof. 月 means moon."
  }
];

const interactables = [
  {
    id: "bell",
    name: "Cracked Bell",
    x: 170,
    y: 330,
    glyph: "钟",
    color: "#8d99ae",
    lines: [
      { actor: "lina", expression: "thinking", text: "The bell is split, but I can still hear something inside it." },
      { actor: "momo", expression: "thinking", text: "It is not sound. It is meaning trying to remember its shape." }
    ]
  },
  {
    id: "well",
    name: "Old Well",
    x: 1460,
    y: 362,
    glyph: "井",
    color: "#405c86",
    lines: [
      { actor: "narrator", expression: "thinking", text: "The old well reflects a sky with no clouds. Someone scratched 人 into the stone rim." },
      { actor: "momo", expression: "surprised", text: "That is not a scratch. It is a footprint left by a character spirit." }
    ]
  },
  {
    id: "momoMart",
    name: "Momo Mart",
    x: 700,
    y: 338,
    glyph: "墨",
    color: "#111827",
    action: "buyMomo",
    lines: [
      { actor: "narrator", expression: "thinking", text: "A handwritten sign reads: Momo Mart. Ink charms and travel goods." }
    ]
  },
  {
    id: "bridge",
    name: "Memory Bridge",
    x: 2140,
    y: 370,
    glyph: "桥",
    color: "#7b5238",
    action: "bridgePuzzle",
    lines: [
      { actor: "mei", expression: "thinking", text: "This bridge was built from names. It will not hold weight until the first three spirits remember each other." }
    ]
  },
  {
    id: "lanternGame",
    name: "Memory Charm Stand",
    x: 2550,
    y: 364,
    glyph: "灯",
    color: "#f1c550",
    action: "lanternGame",
    festivalOnly: true,
    lines: [
      { actor: "ayi", expression: "happy", text: "Each charm carries a village memory. Match the word, and the memory can rise." }
    ]
  },
  {
    id: "sealedShrine",
    name: "Sealed Shrine",
    x: 3350,
    y: 342,
    glyph: "封",
    color: "#7756d8",
    action: "incident",
    lines: [
      { actor: "momo", expression: "sad", text: "The shrine is humming in a language I do not want to understand." }
    ]
  },
  {
    id: "forestShrine",
    name: "Element Forest Shrine",
    x: 2580,
    y: 342,
    glyph: "林",
    color: "#8d99ae",
    action: "forestShrine",
    lines: [
      { actor: "momo", expression: "thinking", text: "This is the entrance to Wuxing Forest." },
      { actor: "momo", expression: "confident", text: "The five spirits opened the bridge, but the forest path is still blocked by a corrupted word." },
      { actor: "lina", expression: "thinking", text: "So we cross the bridge, find that corrupted word, and purify it?" },
      { actor: "momo", expression: "happy", text: "Yes. I will help you read the signs on the path." }
    ]
  },
  {
    id: "pinyinGate",
    name: "Pinyin Valley Gate",
    x: 3680,
    y: 350,
    glyph: "音",
    color: "#5f8f74",
    action: "pinyinIntro",
    lines: [
      { actor: "momo", expression: "thinking", text: "The forest opens into a very quiet valley." }
    ]
  },
  {
    id: "voiceBell",
    name: "Sound Temple",
    x: 3960,
    y: 318,
    glyph: "⌂",
    color: "#d8b16a",
    action: "pinyinLesson",
    lines: [
      { actor: "villager", expression: "thinking", text: "..." }
    ]
  },
  {
    id: "silentShadowGate",
    name: "Silent Shadow",
    x: 4840,
    y: 338,
    glyph: "嘘",
    color: "#65507a",
    action: "pinyinBoss",
    lines: [
      { actor: "shadow", expression: "angry", text: "The valley does not need voices." }
    ]
  },
  {
    id: "cloudSeal",
    name: "Cloud Seal",
    x: 4864,
    y: 338,
    glyph: "云",
    color: "#fff7d7",
    action: "cloudSkill",
    lines: [
      { actor: "momo", expression: "thinking", text: "A soft cloud seal floats here. The character is 云." }
    ]
  },
  {
    id: "lakeHome",
    name: "Abandoned Lakeside House",
    x: LAKE_HOME.x,
    y: LAKE_HOME.y,
    glyph: "⌂",
    color: "#caa574",
    action: "lakeHome",
    lines: [
      { actor: "momo", expression: "thinking", text: "An empty house by the lake. It looks forgotten, but the walls are still warm." }
    ]
  }
];

const villagers = [
  {
    id: "linPo",
    name: "Lin Po",
    x: 675,
    y: 356,
    glyph: "面",
    color: "#d77955",
    actor: "linPo",
    job: "noodle grandmother",
    personality: "teasing, kind, remembers recipes nobody else can read",
    favoritePlace: "steam cart",
    activity: "cook",
    sprite: { skin: "#d6a27f", hair: "#e5dfd0", coat: "#d77955", trim: "#fff7d7", pants: "#543b36", prop: "ladle" },
    lines: [
      { actor: "linPo", expression: "happy", text: "Every morning I sell noodles to people who cannot remember the word for hunger." },
      { actor: "linPo", expression: "sad", text: "They still smile after the first bite. Maybe taste remembers what words forget." },
      { actor: "momo", expression: "thinking", text: "Food remembers what speech forgets." }
    ],
    schedule: [
      { start: 0, end: 1, x: 675, y: 356, activity: "cook" }
    ]
  },
  {
    id: "riverBoy",
    name: "Tao",
    x: 960,
    y: 356,
    glyph: "水",
    color: "#2f8fd8",
    actor: "tao",
    job: "paper-boat fisherman",
    personality: "quiet, observant, brave when nobody is looking",
    favoritePlace: "river stones",
    activity: "fish",
    sprite: { skin: "#c98a68", hair: "#253047", coat: "#2f8fd8", trim: "#c7e6ff", pants: "#263047", prop: "rod" },
    lines: [
      { actor: "tao", expression: "thinking", text: "I keep paper boats in my pocket. Each one carries a word my sister forgot." },
      { actor: "lina", expression: "sad", text: "I will bring one back if I can." }
    ],
    schedule: [
      { start: 0, end: 1, x: 960, y: 356, activity: "fish" }
    ]
  },
  {
    id: "quietGirl",
    name: "An",
    x: 360,
    y: 356,
    glyph: "安",
    color: "#58c475",
    actor: "an",
    job: "kite-mender",
    personality: "shy, poetic, notices everything overhead",
    favoritePlace: "monastery roof",
    activity: "kite",
    sprite: { skin: "#f1c0a0", hair: "#2b1e2c", coat: "#58c475", trim: "#f1c550", pants: "#405c86", prop: "kite" },
    lines: [
      { actor: "an", expression: "thinking", text: "My kite is patched with 月. It only flies when the moon is hidden." },
      { actor: "momo", expression: "happy", text: "The character still shines. She has kept it safe." }
    ],
    schedule: [
      { start: 0, end: 1, x: 360, y: 356, activity: "kite" }
    ]
  },
  {
    id: "guardBo",
    name: "Guard Bo",
    x: 1110,
    y: 356,
    glyph: "守",
    color: "#8d99ae",
    actor: "guard",
    job: "bridge guard",
    personality: "stern, secretly sentimental",
    favoritePlace: "memory bridge",
    activity: "guard",
    sprite: { skin: "#b9795f", hair: "#1c2234", coat: "#8d99ae", trim: "#f1c550", pants: "#253047", prop: "spear" },
    lines: [
      { actor: "guard", expression: "confident", text: "I guard the bridge until it remembers the road." },
      { actor: "guard", expression: "sad", text: "My daughter used to write 木 on every door. Said trees made houses less lonely." }
    ],
    schedule: [
      { start: 0, end: 1, x: 1110, y: 356, activity: "guard" }
    ]
  },
  {
    id: "chefRui",
    name: "Chef Rui",
    x: 805,
    y: 356,
    glyph: "饭",
    color: "#c85f32",
    actor: "chef",
    job: "festival cook",
    personality: "loud, generous, dramatic about soup",
    favoritePlace: "Momo Mart doorway",
    activity: "cook",
    sprite: { skin: "#d69a76", hair: "#fff7d7", coat: "#c85f32", trim: "#fff7d7", pants: "#543b36", prop: "pan" },
    lines: [
      { actor: "chef", expression: "happy", text: "Soup tastes different when the right words are spoken over it." },
      { actor: "chef", expression: "angry", text: "If the word for salt vanishes, the whole village will know." }
    ],
    schedule: [
      { start: 0, end: 1, x: 805, y: 356, activity: "cook" }
    ]
  }
];

const enemies = [
  {
    id: "forgottenWord",
    name: "Forgotten Word",
    glyph: "忘",
    x: 2050,
    y: 356,
    hp: 48,
    maxHp: 48,
    defeated: false,
    skill: {
      name: "火焰攻击",
      prompt: "Power 火焰攻击 by choosing the pinyin for 火.",
      options: ["huǒ", "huó", "hòu"],
      answer: "huǒ",
      success: "火 means fire. The Huo spirit burns through the corruption.",
      fail: "The tone slips. Xiao Wu still strikes, but the flame is weak."
    },
    quiz: [
      {
        name: "火焰攻击",
        prompt: "The monster shivers at fire. Choose the pinyin for 火.",
        options: ["huǒ", "huó", "hòu"],
        answer: "huǒ",
        success: "火 is huǒ. The flame lands cleanly.",
        fail: "The tone slips. 火 is huǒ."
      },
      {
        name: "Name Break",
        prompt: "The monster is made from 忘. What does 忘 mean?",
        options: ["forget", "buy", "moon"],
        answer: "forget",
        success: "忘 means forget. Its shell cracks.",
        fail: "忘 means forget. The monster hides inside that meaning."
      },
      {
        name: "Human Voice",
        prompt: "Momo says a remembered person can weaken it. Choose 人.",
        options: ["人", "水", "土"],
        answer: "人",
        success: "人 means person. A voice returns to the village.",
        fail: "人 is the character for person."
      }
    ]
  },
  {
    id: "muddyMemory",
    name: "Muddy Memory",
    glyph: "浑",
    x: 2860,
    y: 356,
    hp: 60,
    maxHp: 60,
    defeated: false,
    skill: {
      name: "水流术",
      prompt: "Choose the meaning of 水 to clear the path.",
      options: ["water", "wood", "moon"],
      answer: "water",
      success: "水 means water. A clean wave restores the memory.",
      fail: "The water spirit flickers. The enemy remains partly corrupted."
    },
    quiz: [
      {
        name: "水流术",
        prompt: "The mud monster thickens. Choose the meaning of 水.",
        options: ["water", "wood", "moon"],
        answer: "water",
        success: "水 means water. The mud loosens.",
        fail: "水 means water. Let the sound flow."
      },
      {
        name: "Clear Sound",
        prompt: "Choose the pinyin for 水.",
        options: ["shuǐ", "shuí", "suǐ"],
        answer: "shuǐ",
        success: "水 is shuǐ. A clear stream cuts through.",
        fail: "水 is shuǐ, with the third tone."
      },
      {
        name: "Muddy Word",
        prompt: "浑 feels cloudy and mixed. Which word is closest?",
        options: ["muddy", "gold", "peace"],
        answer: "muddy",
        success: "浑 carries a muddy, unclear feeling. The monster staggers.",
        fail: "浑 points toward muddy or unclear."
      }
    ]
  },
  {
    id: "bellEater",
    name: "Bell Eater",
    glyph: "噬",
    x: 3420,
    y: 340,
    hp: 72,
    maxHp: 72,
    boss: true,
    hidden: true,
    defeated: false,
    skill: {
      name: "三字破魔",
      prompt: "Wuyin twists the seal. Choose the character that means person.",
      options: ["人", "水", "火"],
      answer: "人",
      success: "人 answers first. The boss staggers as the village voices return.",
      fail: "The wrong spirit flashes. The Bell Eater swallows the echo."
    }
  }
];

const world = {
  width: 6800,
  floor: 420,
  cameraX: 0,
  activeDialogue: null,
  dialogueIndex: 0,
  battle: null,
  challenge: null,
  pinyinLesson: null,
  lifeBurst: null,
  transition: null,
  interior: null,
  fishing: null,
  valleyShopOpen: false,
  momoCheer: 0,
  momoPicker: false,
  menuOpen: true,
  toastTimer: 0,
  toastText: "",
  savedAt: null,
  time: 0,
  weather: "drizzle",
  shake: 0,
  chapter: {
    scene: 1,
    openingDone: false,
    companionJoined: false,
    chapterStarted: false,
    bridgeSolved: false,
    festivalStarted: false,
    lanternsLit: 0,
    incidentStarted: false,
    bossUnlocked: false,
    endingSeen: false,
    stageOneCleared: false,
    pinyin: {
      unlocked: false,
      introSeen: false,
      completed: [],
      unlockedCreatures: [],
      villagersRestored: 0,
      bossUnlocked: false,
      bossDefeated: false,
      nextChapterOpen: false,
      cloudLessonSeen: false,
      cloudRideUnlocked: false
    },
    lake: {
      unlocked: false,
      area: "valley",
      introSeen: false,
      catches: [],
      fishingCount: 0,
      homeDiscovered: false,
      homeBuilt: false
    },
    map: {
      discovered: ["monastery"]
    }
  },
  inspected: new Set()
};

const player = {
  x: 130,
  y: 352,
  w: 34,
  h: 58,
  vx: 0,
  speed: 3.2,
  facing: 1,
  moving: false,
  level: 1,
  xp: 0,
  hp: 36,
  maxHp: 36,
  spirits: ["huo"],
  momoColor: "black",
  coins: 0,
  skills: {
    cloudRide: false
  },
  cloudRiding: false,
  cosmetics: {
    purchased: [],
    equipped: {
      playerHat: null,
      playerHand: null,
      momoItem: null,
      decor: []
    }
  }
};

const initialState = {
  player: JSON.parse(JSON.stringify(player)),
  chapter: JSON.parse(JSON.stringify(world.chapter)),
  quests: quests.map(({ id, done }) => ({ id, done })),
  pickups: pickups.map(({ id, collected }) => ({ id, collected })),
  enemies: enemies.map(({ id, hp, defeated, hidden }) => ({ id, hp, defeated, hidden }))
};

const musicState = {
  enabled: true,
  mode: "menu",
  started: false,
  muted: false,
  ctx: null,
  timers: [],
  nodes: [],
  master: null
};

const els = {
  gameFrame: document.querySelector(".game-frame"),
  hpBar: document.getElementById("hpBar"),
  xpBar: document.getElementById("xpBar"),
  levelText: document.getElementById("levelText"),
  chapterPill: document.getElementById("chapterPill"),
  walletText: document.getElementById("walletText"),
  chromeToggle: document.getElementById("chromeToggle"),
  musicButton: document.getElementById("musicButton"),
  mapPanel: document.getElementById("mapPanel"),
  worldMap: document.getElementById("worldMap"),
  questPanel: document.getElementById("questPanel"),
  questList: document.getElementById("questList"),
  bagPanel: document.getElementById("bagPanel"),
  spiritGrid: document.getElementById("spiritGrid"),
  codexGrid: document.getElementById("codexGrid"),
  momoPicker: document.getElementById("momoPicker"),
  momoColorOptions: document.getElementById("momoColorOptions"),
  dialogue: document.getElementById("dialogue"),
  portrait: document.getElementById("portrait"),
  speaker: document.getElementById("speaker"),
  dialogueText: document.getElementById("dialogueText"),
  dialogueNext: document.getElementById("dialogueNext"),
  battle: document.getElementById("battle"),
  enemyName: document.getElementById("enemyName"),
  enemyGlyph: document.getElementById("enemyGlyph"),
  enemyHpBar: document.getElementById("enemyHpBar"),
  skillName: document.getElementById("skillName"),
  rewardText: document.getElementById("rewardText"),
  skillPrompt: document.getElementById("skillPrompt"),
  battleOptions: document.getElementById("battleOptions"),
  toast: document.getElementById("toast"),
  chapterCard: document.getElementById("chapterCard"),
  chapterKicker: document.getElementById("chapterKicker"),
  chapterTitle: document.getElementById("chapterTitle"),
  screenFade: document.getElementById("screenFade"),
  startMenu: document.getElementById("startMenu"),
  mainMenuActions: document.getElementById("mainMenuActions"),
  newSavePanel: document.getElementById("newSavePanel"),
  loadSavePanel: document.getElementById("loadSavePanel"),
  settingsPanel: document.getElementById("settingsPanel"),
  saveNameInput: document.getElementById("saveNameInput"),
  saveList: document.getElementById("saveList"),
  pinyinPanel: document.getElementById("pinyinPanel"),
  pinyinTitle: document.getElementById("pinyinTitle"),
  pinyinStage: document.getElementById("pinyinStage"),
  pinyinCardTitle: document.getElementById("pinyinCardTitle"),
  pinyinCardText: document.getElementById("pinyinCardText"),
  pinyinPrompt: document.getElementById("pinyinPrompt"),
  pinyinOptions: document.getElementById("pinyinOptions"),
  pinyinFeedback: document.getElementById("pinyinFeedback")
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function ensureChapterTwoDefaults() {
  if (!world.chapter.pinyin) {
    world.chapter.pinyin = {};
  }
  world.chapter.pinyin = {
    unlocked: Boolean(world.chapter.stageOneCleared || world.chapter.pinyin.unlocked),
    introSeen: Boolean(world.chapter.pinyin.introSeen),
    completed: Array.isArray(world.chapter.pinyin.completed) ? world.chapter.pinyin.completed : [],
    unlockedCreatures: Array.isArray(world.chapter.pinyin.unlockedCreatures) ? world.chapter.pinyin.unlockedCreatures : [],
    villagersRestored: Number(world.chapter.pinyin.villagersRestored) || 0,
    bossUnlocked: Boolean(world.chapter.pinyin.bossUnlocked),
    bossDefeated: Boolean(world.chapter.pinyin.bossDefeated),
    nextChapterOpen: Boolean(world.chapter.pinyin.nextChapterOpen),
    cloudLessonSeen: Boolean(world.chapter.pinyin.cloudLessonSeen),
    cloudRideUnlocked: Boolean(world.chapter.pinyin.cloudRideUnlocked || player.skills?.cloudRide)
  };
  ensurePlayerSkillDefaults();
  world.chapter.pinyin.completed.forEach((id) => {
    const lesson = pinyinLessons.find((item) => item.id === id);
    const creatureId = lesson?.creature?.id;
    if (creatureId && !world.chapter.pinyin.unlockedCreatures.includes(creatureId)) {
      world.chapter.pinyin.unlockedCreatures.push(creatureId);
    }
  });
  const releasedCount = pinyinLessons.filter((lesson) => world.chapter.pinyin.unlockedCreatures.includes(lesson.creature.id)).length;
  if ((world.chapter.pinyin.completed.length >= pinyinLessons.length || releasedCount >= pinyinLessons.length) && !world.chapter.pinyin.bossDefeated) {
    world.chapter.pinyin.bossUnlocked = true;
  }
  if (!world.chapter.lake) world.chapter.lake = {};
  const lakeArea = world.chapter.lake.area === "lake" && player.x >= CLOUD_LAKE.start - 40
    ? "lake"
    : "valley";
  world.chapter.lake = {
    unlocked: Boolean(world.chapter.lake.unlocked || player.x >= CLOUD_LAKE.start),
    area: player.x >= CLOUD_LAKE.start ? "lake" : lakeArea,
    introSeen: Boolean(world.chapter.lake.introSeen),
    catches: Array.isArray(world.chapter.lake.catches) ? world.chapter.lake.catches : [],
    fishingCount: Number(world.chapter.lake.fishingCount) || 0,
    homeDiscovered: Boolean(world.chapter.lake.homeDiscovered),
    homeBuilt: Boolean(world.chapter.lake.homeBuilt)
  };
  syncLakeQuestCompletion();
  if (!world.chapter.map) world.chapter.map = {};
  if (!Array.isArray(world.chapter.map.discovered)) world.chapter.map.discovered = ["monastery"];
  discoverMapLocations({ quiet: true });
}

function discoverMapLocation(id, options = {}) {
  if (!world.chapter.map) world.chapter.map = { discovered: [] };
  if (!Array.isArray(world.chapter.map.discovered)) world.chapter.map.discovered = [];
  if (world.chapter.map.discovered.includes(id)) return false;
  world.chapter.map.discovered.push(id);
  if (!options.quiet) showToast("Map updated.");
  return true;
}

function discoverMapLocations(options = {}) {
  if (!world.chapter.map) world.chapter.map = { discovered: [] };
  let changed = false;
  mapLocations.forEach((location) => {
    if (location.unlock(world.chapter)) {
      changed = discoverMapLocation(location.id, { quiet: true }) || changed;
    }
  });
  if (changed && !options.quiet) showToast("Map updated.");
  return changed;
}

function isMapDiscovered(id) {
  return world.chapter.map?.discovered?.includes(id);
}

function ensurePlayerSkillDefaults() {
  if (!player.skills) player.skills = {};
  player.skills.cloudRide = Boolean(player.skills.cloudRide || world.chapter.pinyin?.cloudRideUnlocked);
  player.cloudRiding = Boolean(player.cloudRiding && player.skills.cloudRide);
  if (player.skills.cloudRide && world.chapter.pinyin) world.chapter.pinyin.cloudRideUnlocked = true;
}

function ensureCosmeticDefaults() {
  player.cosmetics = {
    purchased: [],
    equipped: {
      playerHat: null,
      playerHand: null,
      momoItem: null,
      decor: []
    }
  };
}

function ownsCosmetic() {
  return false;
}

function equipCosmetic() {
  ensureCosmeticDefaults();
}

function cosmeticEquipment() {
  ensureCosmeticDefaults();
  return {
    playerHat: null,
    playerHand: null,
    momoItem: null,
    decor: []
  };
}

function midiToFreq(note) {
  return 440 * 2 ** ((note - 69) / 12);
}

function clearMusicTimers() {
  musicState.timers.forEach((timer) => clearTimeout(timer));
  musicState.timers = [];
}

function trackMusicNode(node) {
  musicState.nodes.push(node);
  node.addEventListener("ended", () => {
    musicState.nodes = musicState.nodes.filter((item) => item !== node);
  });
}

function stopScheduledMusic() {
  clearMusicTimers();
  musicState.nodes.forEach((node) => {
    try {
      node.stop(0);
    } catch {
      // The node may have already ended naturally.
    }
  });
  musicState.nodes = [];
}

function updateMusicButton() {
  if (!els.musicButton) return;
  if (!musicState.started && !musicState.muted) {
    els.musicButton.textContent = "Start Music";
    return;
  }
  els.musicButton.textContent = musicState.muted ? "Music On" : "Music Off";
}

function playTone(note, start, duration, type, volume) {
  if (!musicState.ctx || !musicState.master) return;
  const osc = musicState.ctx.createOscillator();
  const gain = musicState.ctx.createGain();
  osc.type = type;
  osc.frequency.value = midiToFreq(note);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(musicState.master);
  trackMusicNode(osc);
  osc.start(start);
  osc.stop(start + duration + 0.04);
}

function playNoise(start, duration, volume) {
  if (!musicState.ctx || !musicState.master) return;
  const buffer = musicState.ctx.createBuffer(1, musicState.ctx.sampleRate * duration, musicState.ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const source = musicState.ctx.createBufferSource();
  const gain = musicState.ctx.createGain();
  source.buffer = buffer;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(gain);
  gain.connect(musicState.master);
  trackMusicNode(source);
  source.start(start);
  source.stop(start + duration + 0.04);
}

function scheduleMenuLoop() {
  if (!musicState.started || musicState.mode !== "menu") return;
  const now = musicState.ctx.currentTime + 0.05;
  const melody = [
    64, null, 67, 69, 72, null, 69, 67,
    62, null, 64, 67, 69, null, 67, 64,
    60, 62, 64, null, 67, 69, 72, null,
    69, 67, 64, null, 62, 60, null, null
  ];
  const guqin = [48, 55, 60, 55, 50, 57, 62, 57, 48, 55, 60, 64, 50, 57, 62, 57];
  const bells = [76, 79, 81, 84, 81, 79, 76, 72];
  melody.forEach((note, i) => {
    if (note) playTone(note, now + i * 0.72, 0.42, "sine", 0.038);
  });
  guqin.forEach((note, i) => playTone(note, now + i * 1.44, 1.05, "triangle", 0.032));
  bells.forEach((note, i) => playTone(note, now + 0.36 + i * 2.88, 0.42, "triangle", 0.024));
  musicState.timers.push(setTimeout(scheduleMenuLoop, 23200));
}

function scheduleVillageLoop() {
  if (!musicState.started || musicState.mode !== "village") return;
  const now = musicState.ctx.currentTime + 0.05;
  const melody = [
    67, 69, 72, 74, 72, 69, 67, null,
    64, 67, 69, 72, 74, 76, 74, null,
    72, 76, 79, 81, 79, 76, 72, 69,
    67, 69, 64, 62, 64, 67, null, null
  ];
  const chimes = [79, 81, 84, 86, 84, 81, 79, 76, 79, 84, 86, 88, 86, 84, 81, 79];
  const drone = [43, 50, 55, 50, 45, 52, 57, 52, 47, 55, 59, 55, 43, 50, 55, 50];
  melody.forEach((note, i) => {
    if (note) playTone(note, now + i * 0.84, 0.58, "sine", 0.048);
  });
  chimes.forEach((note, i) => playTone(note, now + 0.42 + i * 1.68, 0.3, "triangle", 0.026));
  drone.forEach((note, i) => playTone(note, now + i * 1.68, 1.3, "triangle", 0.032));
  musicState.timers.push(setTimeout(scheduleVillageLoop, 27600));
}

function scheduleBattleLoop() {
  if (!musicState.started || musicState.mode !== "battle") return;
  const now = musicState.ctx.currentTime + 0.05;
  const melody = [
    72, 74, 76, 79, 76, 74, 72, null,
    69, 72, 76, 79, 81, 79, 76, null,
    74, 76, 79, 83, 81, 79, 76, 74,
    72, 74, 76, null, 79, 76, 72, null
  ];
  const bass = [36, 43, 45, 43, 38, 45, 47, 45, 36, 43, 48, 47, 40, 47, 45, 43];
  melody.forEach((note, i) => {
    if (note) playTone(note, now + i * 0.28, 0.18, "triangle", 0.055);
  });
  bass.forEach((note, i) => playTone(note, now + i * 0.56, 0.4, "sine", 0.052));
  for (let i = 0; i < 16; i += 1) {
    if (i % 2 === 0) playNoise(now + i * 0.56, 0.035, 0.007);
  }
  musicState.timers.push(setTimeout(scheduleBattleLoop, 9200));
}

function switchMusic(mode) {
  if (!musicState.enabled) return;
  if (musicState.mode === mode && musicState.started) return;
  musicState.mode = mode;
  if (!musicState.started) return;
  const now = musicState.ctx?.currentTime || 0;
  if (musicState.master && musicState.ctx) {
    musicState.master.gain.cancelScheduledValues(now);
    musicState.master.gain.setValueAtTime(0.0001, now);
    musicState.master.gain.exponentialRampToValueAtTime(0.65, now + 0.08);
  }
  stopScheduledMusic();
  if (mode === "battle") scheduleBattleLoop();
  else if (mode === "menu") scheduleMenuLoop();
  else scheduleVillageLoop();
}

async function startMusic() {
  if (!musicState.enabled || musicState.muted) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  if (!musicState.ctx) {
    musicState.ctx = new AudioContextClass();
    musicState.master = musicState.ctx.createGain();
    musicState.master.gain.value = 0.65;
    musicState.master.connect(musicState.ctx.destination);
  }
  if (musicState.ctx.state === "suspended") {
    await musicState.ctx.resume();
  }
  if (musicState.started) return;
  musicState.started = true;
  const now = musicState.ctx.currentTime + 0.02;
  playTone(72, now, 0.16, "sine", 0.08);
  playTone(79, now + 0.16, 0.24, "triangle", 0.065);
  if (musicState.mode === "battle") scheduleBattleLoop();
  else if (musicState.mode === "menu") scheduleMenuLoop();
  else scheduleVillageLoop();
  updateMusicButton();
}

function stopMusic() {
  stopScheduledMusic();
  musicState.started = false;
  if (musicState.ctx && musicState.ctx.state !== "closed") musicState.ctx.suspend();
}

function toggleMusic() {
  if (!musicState.started && !musicState.muted) {
    startMusic();
    return;
  }
  if (musicState.muted) {
    musicState.muted = false;
    startMusic();
  } else {
    musicState.muted = true;
    stopMusic();
  }
  updateMusicButton();
}

function rectsTouch(a, b, padding = 0) {
  return a.x < b.x + (b.w || 48) + padding &&
    a.x + a.w + padding > b.x &&
    a.y < b.y + (b.h || 64) + padding &&
    a.y + a.h + padding > b.y;
}

function regionAt(x) {
  return regions.find((region) => x >= region.start && x < region.end) || regions[0];
}

function completeQuest(id) {
  const quest = quests.find((item) => item.id === id);
  if (quest && !quest.done) {
    quest.done = true;
    showToast(`Quest complete: ${quest.title}`);
    return true;
  }
  return false;
}

function isQuestDone(id) {
  return Boolean(quests.find((item) => item.id === id)?.done);
}

function isLakeFishingComplete() {
  const lakeCatchCount = world.chapter.lake?.catches?.filter((id) => id !== "worm").length || 0;
  return isQuestDone("lakeFishing") || lakeCatchCount >= 4;
}

function isLakeHomeAvailable() {
  ensureChapterTwoDefaults();
  return Boolean(world.chapter.lake.unlocked && world.chapter.lake.area === "lake" && isLakeFishingComplete());
}

function syncLakeQuestCompletion() {
  if (!world.chapter.lake) return;
  const lakeCatchCount = world.chapter.lake.catches?.filter((id) => id !== "worm").length || 0;
  if (lakeCatchCount >= 4) {
    const quest = quests.find((item) => item.id === "lakeFishing");
    if (quest) quest.done = true;
  }
}

function hasFiveElements() {
  return ["jin", "mu", "shui", "huo", "tu"].every((id) => player.spirits.includes(id));
}

function visibleQuests() {
  if (!world.chapter.companionJoined) {
    return quests.filter((quest) => quest.id === "buyMomo");
  }
  if (!hasFiveElements()) {
    return quests.filter((quest) => ["buyMomo", "collectElements"].includes(quest.id));
  }
  if (!world.chapter.bridgeSolved) {
    return quests.filter((quest) => ["collectElements", "openForest"].includes(quest.id));
  }
  if (!world.chapter.stageOneCleared) {
    return quests.filter((quest) => ["enterForest"].includes(quest.id));
  }
  ensureChapterTwoDefaults();
  if (!world.chapter.pinyin.introSeen) return quests.filter((quest) => ["enterPinyinValley"].includes(quest.id));
  if (!world.chapter.pinyin.bossUnlocked) return quests.filter((quest) => ["restoreVoices"].includes(quest.id));
  if (!world.chapter.pinyin.bossDefeated) return quests.filter((quest) => ["silentShadow"].includes(quest.id));
  if (!world.chapter.lake?.unlocked) return quests.filter((quest) => ["enterCloudLake"].includes(quest.id));
  if (!isLakeFishingComplete()) return quests.filter((quest) => ["lakeFishing"].includes(quest.id));
  if (!world.chapter.lake?.homeBuilt) return quests.filter((quest) => ["buildLakeHome"].includes(quest.id));
  return quests.filter((quest) => ["buildLakeHome"].includes(quest.id));
}

function visibleNpcs() {
  return npcs.filter((npc) => npc.id === "mei");
}

function isFestivalActive() {
  return false;
}

function visibleInteractables() {
  return interactables.filter((item) => {
    if (item.id === "momoMart") return true;
    if (item.id === "bridge") return world.chapter.companionJoined && hasFiveElements();
    if (item.id === "forestShrine") return world.chapter.bridgeSolved;
    if (["pinyinGate", "voiceBell"].includes(item.id)) return world.chapter.stageOneCleared;
    if (item.id === "silentShadowGate") {
      ensureChapterTwoDefaults();
      return world.chapter.pinyin.bossUnlocked && !world.chapter.pinyin.bossDefeated;
    }
    if (item.id === "cloudSeal") {
      ensureChapterTwoDefaults();
      return world.chapter.pinyin.bossDefeated;
    }
    if (item.id === "lakeHome") return isLakeHomeAvailable();
    return false;
  });
}

function setScene(scene, text) {
  world.chapter.scene = scene;
  if (text) showToast(text);
}

function showChapterCard(kicker, title) {
  els.chapterKicker.textContent = kicker;
  els.chapterTitle.textContent = title;
  els.chapterCard.hidden = false;
  setTimeout(() => {
    els.chapterCard.hidden = true;
  }, 2800);
}

function clearStageOne() {
  if (world.chapter.stageOneCleared) return;
  world.chapter.stageOneCleared = true;
  ensureChapterTwoDefaults();
  world.chapter.pinyin.unlocked = true;
  world.chapter.scene = 2;
  completeQuest("enterForest");
  showChapterCard("第一关通过", "五行林入口已净化");
  showToast("Progress saved.");
  saveGame({ quiet: true });
  startDialogue({
    actor: "momo",
    lines: [
      { actor: "momo", expression: "happy", text: "First gate clear. The forest path can breathe again." },
      { actor: "lina", expression: "confident", text: "Then the next valley is real." },
      { actor: "momo", expression: "thinking", text: "I saved our progress. We can return from here." }
    ]
  });
}

function showToast(text) {
  world.toastText = text;
  world.toastTimer = 160;
  els.toast.textContent = text;
  els.toast.hidden = false;
}

function gainXp(amount) {
  player.xp += amount;
  if (player.xp >= 100) {
    player.xp -= 100;
    player.level += 1;
    player.maxHp += 8;
    player.hp = player.maxHp;
    showToast(`Level up! Xiao Wu reached Lv. ${player.level}`);
  }
}

function gainCoins(amount, label = "Correct answer") {
  player.coins = (player.coins || 0) + amount;
  showToast(`${label}: +${amount} coins`);
  renderPanels();
}

function renderEnemyHp(enemy) {
  if (!enemy || !els.enemyHpBar) return;
  els.enemyHpBar.style.width = `${clamp(enemy.hp / enemy.maxHp, 0, 1) * 100}%`;
}

function flashBattleEnemy() {
  els.enemyGlyph.classList.add("hit");
  setTimeout(() => els.enemyGlyph.classList.remove("hit"), 180);
}

function startDialogue(npc) {
  world.activeDialogue = npc;
  world.dialogueIndex = 0;
  renderDialogue();
}

function normalizeLine(line, fallbackActor = "narrator") {
  if (typeof line === "string") {
    return { actor: fallbackActor, text: line, expression: cast[fallbackActor]?.expression || "thinking" };
  }
  return {
    actor: line.actor || fallbackActor,
    text: line.text,
    expression: line.expression || cast[line.actor || fallbackActor]?.expression || "thinking"
  };
}

function renderDialogue() {
  const npc = world.activeDialogue;
  if (!npc) return;
  const fallbackActor = npc.actor || (npc.id === "mei" ? "mei" : npc.id === "vendor" ? "ayi" : "narrator");
  const line = normalizeLine(npc.lines[world.dialogueIndex], fallbackActor);
  const actor = cast[line.actor] || { name: npc.name, portrait: "lina", expression: "thinking" };
  els.speaker.textContent = actor.name;
  els.dialogueText.textContent = line.text;
  const momoClass = actor.portrait === "momo" ? ` momo-${player.momoColor || "black"}` : "";
  els.portrait.className = `portrait ${actor.portrait} ${line.expression}${momoClass}`;
  els.dialogue.hidden = false;
}

function closeDialogue() {
  const npc = world.activeDialogue;
  els.dialogue.hidden = true;
  world.activeDialogue = null;
  if (npc?.quest) completeQuest(npc.quest);
  if (npc?.onClose) npc.onClose();
  renderPanels();
}

function collectPickup(item) {
  if (item.collected) return;
  item.collected = true;
  if (!player.spirits.includes(item.spirit)) player.spirits.push(item.spirit);
  if (item.spirit === "ren") completeQuest("collectRen");
  if (hasFiveElements()) {
    completeQuest("collectElements");
    if (!world.chapter.chapterStarted) {
      world.chapter.chapterStarted = true;
      showChapterCard("Chapter 1", "Five Elements, One Bell");
      startDialogue({
        actor: "mei",
        lines: [
          { actor: "mei", expression: "thinking", text: "金木水火土. Five answers, one road." },
          { actor: "momo", expression: "confident", text: "The first path is open. Stay close to the five spirits." },
          { actor: "mei", expression: "confident", text: "Take the five elements to the Memory Bridge. If it accepts them, the forest path will open." }
        ]
      });
    }
  }
  gainXp(30);
  showToast(item.line);
  if (item.secret) {
    startDialogue({
      actor: "momo",
      lines: [
        { actor: "momo", expression: "surprised", text: "A hidden 月 spirit. It must have been waiting in the old roof's shadow." },
        { actor: "lina", expression: "thinking", text: "So 月 is not just a shape. It carries the moon's meaning." },
        { actor: "momo", expression: "happy", text: "Exactly. 月 means moon. When you know the meaning, the spirit knows where to shine." }
      ]
    });
  }
  renderPanels();
}

function startBattle(enemy) {
  if (enemy.hidden) return;
  if (enemy.boss) {
    startBossBattle(enemy);
    return;
  }
  switchMusic("battle");
  world.battle = {
    enemy,
    playerTurn: true,
    questionIndex: enemy.questionIndex || 0
  };
  renderBattleQuestion();
  els.battle.hidden = false;
}

function currentEnemyQuestion(enemy, index = 0) {
  const questions = enemy.quiz || [enemy.skill];
  return questions[index % questions.length];
}

function renderBattleQuestion() {
  const battle = world.battle;
  if (!battle) return;
  const enemy = battle.enemy;
  const question = currentEnemyQuestion(enemy, battle.questionIndex);
  els.enemyName.textContent = enemy.name;
  els.enemyGlyph.textContent = enemy.glyph;
  els.enemyGlyph.classList.remove("silent-shadow-battle");
  renderEnemyHp(enemy);
  els.skillName.textContent = question.name;
  els.rewardText.textContent = `+${question.reward || enemy.skill.reward || 12} coins`;
  els.skillPrompt.textContent = question.prompt;
  els.battleOptions.innerHTML = "";
  question.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option;
    button.addEventListener("click", () => resolveBattleOption(option));
    els.battleOptions.appendChild(button);
  });
}

function startBossBattle(enemy) {
  if (!world.chapter.bossUnlocked) return;
  startChallenge({
    title: enemy.name,
    steps: [
      {
        name: "Bell Eater: First Mouth",
        glyph: "人",
        prompt: "The boss asks: who still remembers? Choose the character for person.",
        options: ["人", "水", "火"],
        answer: "人",
        success: "人 shines from Xiao Wu's staff. The first mouth cracks.",
        fail: "The mouth laughs. 人 means person."
      },
      {
        name: "Bell Eater: Drowned Bell",
        glyph: "水",
        prompt: "A black river fills the shrine. Choose the meaning of 水.",
        options: ["fire", "water", "moon"],
        answer: "water",
        success: "水 becomes clear. The second mouth loses its voice.",
        fail: "The river thickens. 水 means water."
      },
      {
        name: "Bell Eater: Final Spark",
        glyph: "火",
        prompt: "The final seal burns cold. Choose the pinyin for 火.",
        options: ["huǒ", "huó", "hòu"],
        answer: "huǒ",
        success: "火 answers with the third tone. The shrine bell remembers its name.",
        fail: "The spark bends wrong. 火 is huǒ."
      }
    ],
    onComplete: () => {
      enemy.defeated = true;
      gainXp(80);
      completeQuest("chapterBoss");
      world.chapter.endingSeen = true;
      switchMusic("village");
      startDialogue({
        actor: "wuyin",
        lines: [
          { actor: "wuyin", expression: "angry", text: "A novice monk should not wake a seal that old." },
          { actor: "mei", expression: "surprised", text: "The seal in his staff... I thought that craft was lost before I was born." },
          { actor: "lina", expression: "thinking", text: "Master Yun, why did it sound like my own voice?" },
          { actor: "momo", expression: "sad", text: "Because someone did not steal the words. Someone sealed them inside people." },
          { actor: "narrator", expression: "thinking", text: "Far beyond the village, a second bell wakes under the forest." }
        ]
      });
    }
  });
}

function startChallenge(config) {
  switchMusic("battle");
  world.challenge = {
    ...config,
    index: 0,
    misses: 0
  };
  renderChallengeStep();
  els.battle.hidden = false;
}

function renderChallengeStep() {
  const challenge = world.challenge;
  const step = challenge.steps[challenge.index];
  els.enemyName.textContent = challenge.title;
  const isSilentShadow = challenge.title === "Silent Shadow";
  els.enemyGlyph.classList.toggle("silent-shadow-battle", isSilentShadow);
  els.enemyGlyph.textContent = isSilentShadow ? "" : step.glyph || "?";
  els.enemyHpBar.style.width = `${clamp((challenge.steps.length - challenge.index) / challenge.steps.length, 0, 1) * 100}%`;
  els.skillName.textContent = step.name;
  els.rewardText.textContent = `+${step.reward || 10} coins`;
  els.skillPrompt.textContent = step.prompt;
  els.battleOptions.innerHTML = "";
  step.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option;
    button.addEventListener("click", () => resolveBattleOption(option));
    els.battleOptions.appendChild(button);
  });
}

function resolveBattleOption(option) {
  if (world.challenge) {
    const challenge = world.challenge;
    const step = challenge.steps[challenge.index];
    const correct = option === step.answer;
    if (correct) {
      gainCoins(step.reward || 10);
      challenge.index += 1;
      if (step.success) showToast(`${step.success} +${step.reward || 10} coins`);
      if (challenge.index >= challenge.steps.length) {
        els.battle.hidden = true;
        world.challenge = null;
        switchMusic("village");
        challenge.onComplete();
      } else {
        renderChallengeStep();
      }
    } else {
      challenge.misses += 1;
      player.hp = clamp(player.hp - 3, 0, player.maxHp);
      showToast(step.fail);
    }
    return;
  }

  const battle = world.battle;
  if (!battle) return;
  const enemy = battle.enemy;
  const question = currentEnemyQuestion(enemy, battle.questionIndex);
  const correct = option === question.answer;
  if (correct) gainCoins(question.reward || enemy.skill.reward || 12);
  enemy.hp = clamp(enemy.hp - (correct ? 18 : 0), 0, enemy.maxHp);
  player.hp = clamp(player.hp - (correct ? 3 : 9), 0, player.maxHp);
  world.shake = correct ? 14 : 6;
  enemy.hitFlash = correct ? 18 : 8;
  if (correct) flashBattleEnemy();
  renderEnemyHp(enemy);
  showToast(correct ? `${question.success} +${question.reward || enemy.skill.reward || 12} coins` : question.fail);
  if (enemy.hp <= 0) {
    enemy.defeated = true;
    els.battle.hidden = true;
    world.battle = null;
    switchMusic("village");
    gainXp(55);
    if (enemy.id === "forgottenWord") {
      completeQuest("defeatForgotten");
      startDialogue({
        actor: "momo",
        lines: [
          { actor: "momo", expression: "surprised", text: "That thing was feeding on a broken word." },
          { actor: "lina", expression: "thinking", text: "Master Yun said this monk staff was only for balance. Why did it answer 火?" },
          { actor: "momo", expression: "confident", text: "Because your staff carries a blank seal. Each character you understand gives the seal a new move." }
        ]
      });
    }
    if (enemy.id === "bellEater") {
      completeQuest("chapterBoss");
    }
    if (!player.spirits.includes("meng") && enemy.id === "muddyMemory") player.spirits.push("meng");
    if (enemy.id === "muddyMemory") clearStageOne();
    renderPanels();
    return;
  }
  battle.questionIndex += 1;
  enemy.questionIndex = battle.questionIndex;
  renderBattleQuestion();
  if (player.hp <= 0) {
    player.hp = player.maxHp;
    player.x = 130;
    els.battle.hidden = true;
    world.battle = null;
    switchMusic("village");
    showToast("Xiao Wu wakes at the monastery gate.");
  }
}

function interact() {
  if (world.battle || world.challenge || world.momoPicker || world.pinyinLesson || world.valleyShopOpen) return;
  if (world.activeDialogue) {
    world.dialogueIndex += 1;
    if (world.dialogueIndex >= world.activeDialogue.lines.length) closeDialogue();
    else renderDialogue();
    return;
  }
  if (world.interior) {
    interactInterior();
    return;
  }

  const playerBox = { x: player.x, y: player.y, w: player.w, h: player.h };
  const npc = visibleNpcs().find((item) => {
    const pos = item._pose || item;
    return rectsTouch(playerBox, { x: pos.x, y: pos.y, w: 42, h: 68 }, 38);
  });
  if (npc) {
    startDialogue(npc);
    return;
  }

  const visibleVillagers = isFestivalActive() ? villagers : [];
  const villager = visibleVillagers.find((item) => {
    const pos = item._pose || item;
    return rectsTouch(playerBox, { x: pos.x, y: pos.y, w: 42, h: 68 }, 38);
  });
  if (villager) {
    if (!world.inspected.has(villager.id)) {
      world.inspected.add(villager.id);
      gainXp(5);
    }
    startDialogue(villager);
    return;
  }

  const object = visibleInteractables().find((item) => {
    if (item.festivalOnly && !isFestivalActive()) return false;
    return rectsTouch(playerBox, { x: item.x, y: item.y, w: 54, h: 58 }, 42);
  });
  if (object) {
    if (!world.inspected.has(object.id)) {
      world.inspected.add(object.id);
      if (!object.action || object.action === "lanternGame") gainXp(5);
    }
    if (object.action === "bridgePuzzle") {
      startBridgePuzzle();
      return;
    }
    if (object.action === "buyMomo") {
      buyMomo();
      return;
    }
    if (object.action === "lanternGame") {
      startLanternGame();
      return;
    }
    if (object.action === "forestShrine") {
      completeQuest("enterForest");
      startDialogue(object);
      return;
    }
    if (object.action === "pinyinIntro") {
      startPinyinIntro();
      return;
    }
    if (object.action === "pinyinLesson") {
      startNextPinyinLesson();
      return;
    }
    if (object.action === "pinyinBoss") {
      startPinyinBoss();
      return;
    }
    if (object.action === "cloudSkill") {
      startCloudSealDialogue();
      return;
    }
    if (object.action === "lakeHome") {
      startLakeHomeInteraction();
      return;
    }
    if (object.action === "incident") {
      startIncident();
      return;
    }
    startDialogue(object);
    return;
  }

  const pickup = pickups.find((item) => !item.collected && rectsTouch(playerBox, { x: item.x, y: item.y, w: 42, h: 42 }, 34));
  if (pickup) {
    collectPickup(pickup);
    return;
  }

  const enemy = enemies.find((item) => !item.defeated && rectsTouch(playerBox, { x: item.x, y: item.y, w: 54, h: 62 }, 44));
  if (enemy) startBattle(enemy);
}

function buyMomo() {
  if (world.chapter.companionJoined) {
    openMomoPicker();
    return;
  }
  openMomoPicker();
}

function openMomoPicker() {
  world.momoPicker = true;
  els.momoPicker.hidden = false;
  els.questPanel.hidden = true;
  els.bagPanel.hidden = true;
  els.mapPanel.hidden = true;
}

function chooseMomoColor(colorId) {
  const chosen = momoColors[colorId] || momoColors.black;
  const alreadyJoined = world.chapter.companionJoined;
  player.momoColor = colorId in momoColors ? colorId : "black";
  world.momoPicker = false;
  els.momoPicker.hidden = true;
  world.chapter.companionJoined = true;
  if (!alreadyJoined) {
    completeQuest("buyMomo");
    gainXp(15);
  }
  saveGame({ quiet: true });
  const lines = alreadyJoined ? [
    { actor: "narrator", expression: "thinking", text: "Momo hops between the color charms and settles into a new glow." },
    { actor: "momo", expression: "happy", text: `${chosen.label} it is. I like this look.` }
  ] : [
    { actor: "narrator", expression: "thinking", text: "On the lowest shelf sits a row of tiny ink charms, each glowing with a different color." },
    { actor: "momo", expression: "surprised", text: `${chosen.label}? Good choice. I was beginning to think I would stay on this shelf forever.` },
    { actor: "momo", expression: "happy", text: "I am Momo. I can follow you and help read the strange characters ahead." },
    { actor: "mei", expression: "thinking", text: "Good. Now gather the five element spirits: 金, 木, 水, 火, 土." }
  ];
  startDialogue({
    actor: "momo",
    lines
  });
}

function startPinyinIntro() {
  ensureChapterTwoDefaults();
  if (!world.chapter.stageOneCleared) {
    showToast("Finish Wuxing Forest first.");
    return;
  }
  if (world.chapter.pinyin.introSeen) {
    showToast("Pinyin Valley is listening.");
    return;
  }
  world.chapter.pinyin.introSeen = true;
  world.chapter.pinyin.unlocked = true;
  world.chapter.scene = 2;
  completeQuest("enterPinyinValley");
  showChapterCard("Chapter 2", "Pinyin Valley");
  saveGame({ quiet: true });
  startDialogue({
    actor: "momo",
    lines: [
      { actor: "momo", expression: "thinking", text: "The valley is too quiet. Even the wind is mouthing symbols." },
      { actor: "villager", expression: "thinking", text: "The animals... the flowers... all sealed inside silent light." },
      { actor: "momo", expression: "surprised", text: "Pinyin is sound magic here. Every sound you learn can free one living thing." },
      { actor: "lina", expression: "thinking", text: "So learning ma could bring back 马, and learning yu could bring back 鱼?" },
      { actor: "momo", expression: "happy", text: "Yes. We are not just answering questions. We are returning life to the village." }
    ]
  });
}

function nextPinyinLesson() {
  ensureChapterTwoDefaults();
  return pinyinLessons.find((lesson) => !world.chapter.pinyin.completed.includes(lesson.id));
}

function unlockedCreatureIds() {
  ensureChapterTwoDefaults();
  return world.chapter.pinyin.unlockedCreatures;
}

function isCreatureUnlocked(id) {
  return unlockedCreatureIds().includes(id);
}

function startNextPinyinLesson() {
  ensureChapterTwoDefaults();
  if (!world.chapter.pinyin.introSeen) {
    startPinyinIntro();
    return;
  }
  const lesson = nextPinyinLesson();
  if (!lesson) {
    world.chapter.pinyin.bossUnlocked = true;
    completeQuest("restoreVoices");
    showToast("Silent Shadow is waiting beyond the bell.");
    saveGame({ quiet: true });
    return;
  }
  world.pinyinLesson = { id: lesson.id, answered: false };
  renderPinyinLesson();
  els.pinyinPanel.hidden = false;
  els.questPanel.hidden = true;
  els.bagPanel.hidden = true;
  els.mapPanel.hidden = true;
}

function renderPinyinLesson() {
  const state = world.pinyinLesson;
  const lesson = pinyinLessons.find((item) => item.id === state?.id);
  if (!lesson) return;
  els.pinyinTitle.textContent = "Life Seal";
  els.pinyinStage.textContent = lesson.stage;
  els.pinyinCardTitle.textContent = lesson.title;
  els.pinyinCardText.textContent = `${lesson.card} Release cost: ${lesson.releaseCost} coins.`;
  els.pinyinPrompt.textContent = lesson.prompt;
  els.pinyinFeedback.textContent = "";
  els.pinyinOptions.innerHTML = "";
  lesson.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option;
    button.addEventListener("click", () => answerPinyinLesson(option));
    els.pinyinOptions.appendChild(button);
  });
}

function answerPinyinLesson(option) {
  const lesson = pinyinLessons.find((item) => item.id === world.pinyinLesson?.id);
  if (!lesson || world.pinyinLesson.answered) return;
  const correct = option === lesson.answer;
  if (!correct) {
    els.pinyinFeedback.textContent = `${lesson.fail} You can try again.`;
    showToast("Almost. Try once more.");
    return;
  }
  if ((player.coins || 0) < lesson.releaseCost) {
    els.pinyinFeedback.textContent = `The pinyin is right, but the seal needs ${lesson.releaseCost} coins to open. You have ${player.coins || 0}.`;
    showToast("Not enough coins to release it yet.");
    return;
  }
  world.pinyinLesson.answered = true;
  ensureChapterTwoDefaults();
  player.coins -= lesson.releaseCost;
  if (!world.chapter.pinyin.completed.includes(lesson.id)) world.chapter.pinyin.completed.push(lesson.id);
  if (lesson.creature && !world.chapter.pinyin.unlockedCreatures.includes(lesson.creature.id)) {
    world.chapter.pinyin.unlockedCreatures.push(lesson.creature.id);
  }
  world.chapter.pinyin.villagersRestored = Math.max(world.chapter.pinyin.villagersRestored, world.chapter.pinyin.completed.length);
  if (world.chapter.pinyin.completed.length >= pinyinLessons.length) {
    world.chapter.pinyin.bossUnlocked = true;
    completeQuest("restoreVoices");
  }
  world.momoCheer = 44;
  world.lifeBurst = {
    creatureId: lesson.creature?.id,
    source: lesson.creature?.source || "orb",
    x: lesson.creature?.x || 4040,
    y: lesson.creature?.y || 360,
    timer: 150
  };
  gainXp(18);
  renderPanels();
  els.pinyinFeedback.textContent = `${lesson.success} You spent ${lesson.releaseCost} coins and rescued ${lesson.creature?.hanzi || ""} (${lesson.creature?.pinyin || ""}).`;
  els.pinyinOptions.innerHTML = "";
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = world.chapter.pinyin.bossUnlocked ? "Boss Path Opens" : "Continue";
  button.addEventListener("click", closePinyinPanel);
  els.pinyinOptions.appendChild(button);
  saveGame({ quiet: true });
}

function closePinyinPanel() {
  const wasOpen = !els.pinyinPanel.hidden;
  els.pinyinPanel.hidden = true;
  world.pinyinLesson = null;
  if (wasOpen && world.chapter.pinyin?.bossUnlocked && !world.chapter.pinyin.bossDefeated) {
    showToast("Silent Shadow waits at the far end of the valley.");
  }
}

function closeValleyShop() {
  world.valleyShopOpen = false;
}

function toggleCleanUi() {
  const compact = !els.gameFrame.classList.contains("ui-compact");
  els.gameFrame.classList.toggle("ui-compact", compact);
  els.chromeToggle.textContent = compact ? "▼" : "▲";
  els.chromeToggle.setAttribute("aria-label", compact ? "Show UI" : "Hide UI");
  if (compact) {
    els.questPanel.hidden = true;
    els.bagPanel.hidden = true;
    els.mapPanel.hidden = true;
    closePinyinPanel();
    closeValleyShop();
  }
}

function toggleMapPanel() {
  els.mapPanel.hidden = !els.mapPanel.hidden;
  els.questPanel.hidden = true;
  els.bagPanel.hidden = true;
  closePinyinPanel();
  closeValleyShop();
  if (!els.mapPanel.hidden) renderWorldMap();
}

function renderWorldMap() {
  discoverMapLocations({ quiet: true });
  els.worldMap.innerHTML = "";
  [
    { className: "chapter-one", label: "Chapter 1" },
    { className: "chapter-two", label: "Chapter 2" },
    { className: "chapter-three", label: "Chapter 3" }
  ].forEach((chapterLabel) => {
    const label = document.createElement("span");
    label.className = `map-chapter-label ${chapterLabel.className}`;
    label.textContent = chapterLabel.label;
    els.worldMap.appendChild(label);
  });
  const route = document.createElement("div");
  route.className = "map-route";
  els.worldMap.appendChild(route);
  mapLocations.forEach((location) => {
    const node = document.createElement("button");
    node.type = "button";
    node.className = `map-node map-${location.id} ${isMapDiscovered(location.id) ? "discovered" : "locked"}`;
    node.style.left = `${location.x}%`;
    node.style.top = `${location.y}%`;
    node.innerHTML = `<strong>${isMapDiscovered(location.id) ? location.label : "?"}</strong><span>${isMapDiscovered(location.id) ? location.name : "Unexplored"}</span>`;
    node.addEventListener("click", () => {
      showToast(isMapDiscovered(location.id) ? location.name : "This place is still hidden.");
    });
    els.worldMap.appendChild(node);
  });
  const marker = document.createElement("span");
  marker.className = "map-player";
  marker.style.left = `${clamp((player.x / world.width) * 92 + 4, 5, 96)}%`;
  marker.style.top = `${world.interior?.id === "lakeHome" ? 44 : player.x >= CLOUD_LAKE.start ? 58 : player.x > 3400 ? 50 : player.x > 2300 ? 44 : 58}%`;
  marker.textContent = "武";
  els.worldMap.appendChild(marker);
}

function updateScreenFade() {
  if (!els.screenFade) return;
  if (!world.transition) {
    els.screenFade.hidden = true;
    els.screenFade.style.opacity = "0";
    return;
  }
  els.screenFade.textContent = getTransitionMessage();
  const half = world.transition.duration / 2;
  const progress = world.transition.timer <= half
    ? world.transition.timer / half
    : 1 - (world.transition.timer - half) / half;
  els.screenFade.hidden = false;
  els.screenFade.style.opacity = String(clamp(progress, 0, 1));
}

function getTransitionMessage() {
  if (world.transition?.type === "lakeExit") return "The cloud carries you back to Pinyin Valley...";
  if (world.transition?.type === "enterHome") return "Stepping inside the lakeside house...";
  if (world.transition?.type === "exitHome") return "Returning to Cloud Lake...";
  return "The cloud carries you to Cloud Lake...";
}

function startInteriorTransition(type, onMove) {
  if (world.transition) return;
  world.transition = {
    type,
    timer: 0,
    duration: 110,
    moveAt: 55,
    moved: false,
    onMove
  };
  world.activeDialogue = null;
  els.dialogue.hidden = true;
  player.vx = 0;
  player.moving = false;
}

function enterLakeHome() {
  ensureChapterTwoDefaults();
  if (!isLakeHomeAvailable()) return;
  world.chapter.lake.homeDiscovered = true;
  world.chapter.lake.homeBuilt = true;
  completeQuest("buildLakeHome");
  startInteriorTransition("enterHome", () => {
    world.interior = {
      id: "lakeHome",
      title: "Lakeside Home",
      playerX: 480,
      playerY: 394,
      facing: "up"
    };
    player.cloudRiding = false;
    saveGame({ quiet: true });
  });
}

function exitInterior() {
  if (!world.interior) return;
  startInteriorTransition("exitHome", () => {
    world.interior = null;
    world.chapter.lake.area = "lake";
    player.x = LAKE_HOME.doorX;
    player.y = 352;
    player.facing = -1;
    player.cloudRiding = false;
    world.cameraX = clamp(player.x - canvas.width * 0.42, 0, world.width - canvas.width);
    saveGame({ quiet: true });
  });
}

function startLakeHomeInteraction() {
  ensureChapterTwoDefaults();
  if (!world.chapter.lake.homeDiscovered) {
    startDialogue({
      actor: "momo",
      onClose: enterLakeHome,
      lines: [
        { actor: "momo", expression: "thinking", text: "Look, Xiao Wu. There is an empty house by the lake." },
        { actor: "momo", expression: "happy", text: "Maybe this can become our home between journeys." },
        { actor: "narrator", expression: "thinking", text: "The quiet house opens. A new kind of space waits inside." }
      ]
    });
    return;
  }
  enterLakeHome();
}

function homeDoorOpenRatio(surface) {
  const transition = world.transition;
  if (!transition || !["enterHome", "exitHome"].includes(transition.type)) return 0;
  const moveAt = transition.moveAt || transition.duration / 2;
  if (transition.type === "enterHome") {
    if (surface === "exterior" && !transition.moved) return clamp(transition.timer / moveAt, 0, 1);
    if (surface === "interior" && transition.moved) return clamp(1 - (transition.timer - moveAt) / (transition.duration - moveAt), 0, 1);
  }
  if (transition.type === "exitHome") {
    if (surface === "interior" && !transition.moved) return clamp(transition.timer / moveAt, 0, 1);
    if (surface === "exterior" && transition.moved) return clamp(1 - (transition.timer - moveAt) / (transition.duration - moveAt), 0, 1);
  }
  return 0;
}

function interactInterior() {
  if (!world.interior) return;
  const p = { x: world.interior.playerX, y: world.interior.playerY };
  if (p.y > 428 && p.x > 412 && p.x < 548) {
    exitInterior();
    return;
  }
  const spots = [
    {
      id: "homeBed",
      x: 172,
      y: 334,
      r: 84,
      lines: [
        { actor: "narrator", expression: "thinking", text: "A simple bed. The lake wind makes the blanket smell faintly of rain." },
        { actor: "momo", expression: "happy", text: "This feels like a good place to rest between lessons." }
      ]
    },
    {
      id: "homeDesk",
      x: 734,
      y: 330,
      r: 92,
      lines: [
        { actor: "narrator", expression: "thinking", text: "A low writing desk waits by the wall. There is room for new character notes." },
        { actor: "momo", expression: "thinking", text: "Later, we can turn this into a study corner." }
      ]
    },
    {
      id: "homeWaterBowl",
      x: 456,
      y: 286,
      r: 72,
      lines: [
        { actor: "narrator", expression: "thinking", text: "A clear bowl reflects the lake outside." },
        { actor: "momo", expression: "happy", text: "The fish words we learned seem brighter here." }
      ]
    }
  ];
  const spot = spots.find((item) => Math.hypot(p.x - item.x, p.y - item.y) < item.r);
  if (spot) {
    startDialogue({ actor: "momo", lines: spot.lines });
    return;
  }
  showToast("This house is quiet. There is room to build more.");
}

function startPinyinBoss() {
  ensureChapterTwoDefaults();
  if (!world.chapter.pinyin.bossUnlocked) {
    showToast("Restore the small voices first.");
    return;
  }
  if (world.chapter.pinyin.bossDefeated) {
    showToast("The sound spirit hums beside the valley gate.");
    return;
  }
  const helpers = pinyinLessons
    .filter((lesson) => isCreatureUnlocked(lesson.creature.id))
    .map((lesson) => `${lesson.creature.hanzi} ${lesson.creature.pinyin}`)
    .join(", ");
  startChallenge({
    title: "Silent Shadow",
    steps: [
      {
        name: "Round 1: Initials",
        glyph: "马",
        reward: 18,
        prompt: "The horse stamps beside you. Choose the pinyin for 马.",
        options: ["mā", "má", "mǎ", "mà"],
        answer: "mǎ",
        success: "The horse's hoofbeat cracks the silent seal.",
        fail: "马 is mǎ."
      },
      {
        name: "Round 2: Living Echoes",
        glyph: "猫",
        reward: 18,
        prompt: "The cat meows from the branch. Choose the pinyin for 猫.",
        options: ["mǎo", "māo", "miāo", "máo"],
        answer: "māo",
        success: "The cat's voice returns a soft sound to the valley path.",
        fail: "猫 is māo."
      },
      {
        name: "Round 3: Water Voice",
        glyph: "鱼",
        reward: 22,
        prompt: "The fish flashes in the river. Choose the pinyin for 鱼.",
        options: ["yū", "yú", "yǔ", "yù"],
        answer: "yú",
        success: "The river begins to sing under the shadow.",
        fail: "鱼 is yú."
      },
      {
        name: "Final Chorus",
        glyph: "鸟",
        reward: 24,
        prompt: "The bird circles overhead. Choose the pinyin for 鸟.",
        options: ["niāo", "niáo", "niǎo", "niào"],
        answer: "niǎo",
        success: "The bird sings. Silent Shadow remembers it was guarding sound, not stealing it.",
        fail: "鸟 is niǎo."
      }
    ],
    onComplete: () => {
      world.chapter.pinyin.bossDefeated = true;
      world.chapter.pinyin.nextChapterOpen = true;
      world.chapter.scene = 2;
      completeQuest("silentShadow");
      gainXp(90);
      gainCoins(40, "Valley restored");
      switchMusic("village");
      saveGame({ quiet: true });
      startDialogue({
        actor: "momo",
        lines: [
          { actor: "shadow", expression: "thinking", text: "I sealed the voices because I feared they would vanish again..." },
          { actor: "momo", expression: "happy", text: `They came back because Xiao Wu learned their sounds: ${helpers}.` },
          { actor: "villager", expression: "happy", text: "The bird sings. The cat calls. The horse runs. The valley is alive again." },
          { actor: "momo", expression: "thinking", text: `A 云 seal appeared near the restored gate. 云 is yún: cloud. It can teach Cloud Riding for ${CLOUD_RIDE_COST} coins, only if you want it.` },
          { actor: "momo", expression: "happy", text: "The next road is open when you are ready." }
        ]
      });
    }
  });
}

function isNearCloudSeal() {
  const seal = interactables.find((item) => item.id === "cloudSeal");
  if (!seal || !world.chapter.pinyin?.bossDefeated) return false;
  const playerBox = { x: player.x, y: player.y, w: player.w, h: player.h };
  return rectsTouch(playerBox, { x: seal.x, y: seal.y, w: 54, h: 58 }, 56);
}

function startCloudSealDialogue() {
  ensureChapterTwoDefaults();
  world.chapter.pinyin.cloudLessonSeen = true;
  saveGame({ quiet: true });
  if (player.skills?.cloudRide) {
    startDialogue({
      actor: "momo",
      lines: [
        { actor: "narrator", expression: "thinking", text: "The 云 seal drifts softly beside the restored gate." },
        { actor: "momo", expression: "happy", text: "You already learned 云: yún, cloud. Press J whenever you want to ride or land." }
      ]
    });
    return;
  }
  startDialogue({
    actor: "momo",
    lines: [
      { actor: "narrator", expression: "thinking", text: "A pale seal floats inside the mist. The character on it is 云." },
      { actor: "momo", expression: "thinking", text: "云 is yún. It means cloud." },
      { actor: "momo", expression: "happy", text: `If you want Cloud Riding, stand beside this 云 seal and press J again. It costs ${CLOUD_RIDE_COST} coins.` }
    ]
  });
}

function unlockCloudRide() {
  ensureChapterTwoDefaults();
  ensurePlayerSkillDefaults();
  player.coins -= CLOUD_RIDE_COST;
  player.skills.cloudRide = true;
  player.cloudRiding = true;
  world.chapter.pinyin.cloudRideUnlocked = true;
  world.chapter.pinyin.cloudLessonSeen = true;
  renderPanels();
  saveGame({ quiet: true });
  startDialogue({
    actor: "momo",
    onClose: startCloudLakeTransition,
    lines: [
      { actor: "narrator", expression: "thinking", text: `The 云 seal accepts ${CLOUD_RIDE_COST} coins and unfolds into a soft white cloud.` },
      { actor: "momo", expression: "happy", text: "You learned 云: yún, cloud." },
      { actor: "momo", expression: "confident", text: "Cloud Riding unlocked. The cloud will carry us to the lake beyond the valley." }
    ]
  });
}

function handleCloudRideKey() {
  if (world.activeDialogue || world.battle || world.challenge || world.momoPicker || world.pinyinLesson || world.valleyShopOpen) return;
  if (world.interior) {
    showToast("The cloud waits outside.");
    return;
  }
  ensureChapterTwoDefaults();
  ensurePlayerSkillDefaults();

  if (player.skills.cloudRide) {
    if (world.chapter.lake?.area !== "lake" && player.x >= 4720) {
      startCloudLakeTransition();
      return;
    }
    if (player.cloudRiding && isOverCloudLakeWater()) {
      showToast("Land by the shore before leaving the cloud.");
      return;
    }
    player.cloudRiding = !player.cloudRiding;
    showToast(player.cloudRiding ? "Cloud Riding: 云 (yún) lifts you." : "Cloud Riding ended.");
    saveGame({ quiet: true });
    return;
  }

  if (!world.chapter.pinyin.bossDefeated) {
    showToast("Cloud Riding awakens after Silent Shadow is cleansed.");
    return;
  }

  if (!isNearCloudSeal()) {
    showToast("Find the 云 seal in the restored valley to learn Cloud Riding.");
    return;
  }

  if (!world.chapter.pinyin.cloudLessonSeen) {
    startCloudSealDialogue();
    return;
  }

  if ((player.coins || 0) < CLOUD_RIDE_COST) {
    showToast(`Cloud Riding costs ${CLOUD_RIDE_COST} coins. You have ${player.coins || 0}.`);
    return;
  }

  unlockCloudRide();
}

function startCloudLakeTransition() {
  ensureChapterTwoDefaults();
  if (world.transition) return;
  world.transition = {
    type: "cloudLake",
    timer: 0,
    duration: 150,
    moved: false
  };
  world.activeDialogue = null;
  els.dialogue.hidden = true;
  player.cloudRiding = true;
  showToast("The cloud carries Xiao Wu to Cloud Lake...");
}

function startLakeExitTransition() {
  ensureChapterTwoDefaults();
  if (world.transition) return;
  world.transition = {
    type: "lakeExit",
    timer: 0,
    duration: 130,
    moved: false
  };
  world.activeDialogue = null;
  els.dialogue.hidden = true;
  player.cloudRiding = true;
  player.vx = 0;
  player.moving = false;
  showToast("The cloud carries Xiao Wu back to Pinyin Valley...");
}

function finishCloudLakeTransition() {
  ensureChapterTwoDefaults();
  const firstVisit = !world.chapter.lake.unlocked;
  world.chapter.lake.unlocked = true;
  world.chapter.lake.area = "lake";
  if (firstVisit) world.chapter.lake.introSeen = false;
  player.x = 5368;
  player.y = 352;
  player.vx = 0;
  player.moving = false;
  player.cloudRiding = false;
  world.cameraX = clamp(player.x - canvas.width * 0.42, 0, world.width - canvas.width);
  completeQuest("enterCloudLake");
  discoverMapLocation("cloudLakeMap", { quiet: true });
  showChapterCard("Chapter 3", "Cloud Lake");
  saveGame({ quiet: true });
}

function finishLakeExitTransition() {
  ensureChapterTwoDefaults();
  world.chapter.lake.area = "valley";
  player.x = 4888;
  player.y = 352;
  player.vx = 0;
  player.moving = false;
  player.cloudRiding = false;
  world.cameraX = clamp(player.x - canvas.width * 0.42, 0, world.width - canvas.width);
  saveGame({ quiet: true });
}

function startCloudLakeIntro() {
  ensureChapterTwoDefaults();
  if (!world.chapter.lake?.unlocked || world.chapter.lake.introSeen) return;
  world.chapter.lake.introSeen = true;
  saveGame({ quiet: true });
  startDialogue({
    actor: "momo",
    lines: [
      { actor: "momo", expression: "happy", text: "We made it to Cloud Lake. Let's sit down and fish." },
      { actor: "momo", expression: "thinking", text: "Stand near the chair and press Space to cast the rod. Whatever you catch will show its character and pinyin." },
      { actor: "momo", expression: "confident", text: "You cannot walk straight across the lake. Press J to ride the cloud if you need to cross the water." }
    ]
  });
}

function isNearFishingSpot() {
  return world.chapter.lake?.unlocked && world.chapter.lake.area === "lake" && Math.abs(player.x - FISHING_SPOT.x) < 72;
}

function isOverCloudLakeWater() {
  return Boolean(
    world.chapter.lake?.unlocked &&
    world.chapter.lake.area === "lake" &&
    player.x + player.w > CLOUD_LAKE.waterStart - 8 &&
    player.x < CLOUD_LAKE.waterEnd - 26
  );
}

function nextLakeCatch() {
  const count = world.chapter.lake?.fishingCount || 0;
  if (count === 0) return lakeCatches[0];
  return lakeCatches[1 + ((count - 1) % (lakeCatches.length - 1))];
}

function startFishing() {
  ensureChapterTwoDefaults();
  if (!world.chapter.lake?.unlocked) return;
  if (!isNearFishingSpot()) {
    showToast("Sit by the lakeside chair before fishing.");
    return;
  }
  if (world.fishing) return;
  player.cloudRiding = false;
  player.moving = false;
  player.vx = 0;
  player.facing = 1;
  world.fishing = {
    state: "waiting",
    timer: 180,
    catch: null,
    revealTimer: 0
  };
  showToast("Fishing...");
}

function startLakeCloudHint() {
  if (world.activeDialogue) return;
  if (world.inspected.has("lakeCloudHint")) return;
  world.inspected.add("lakeCloudHint");
  startDialogue({
    actor: "momo",
    lines: [
      { actor: "momo", expression: "thinking", text: "This is lake water. We cannot walk through it." },
      { actor: "momo", expression: "confident", text: "Press J to ride the cloud across the surface." }
    ]
  });
}

function completeFishingCatch() {
  ensureChapterTwoDefaults();
  const caught = nextLakeCatch();
  world.chapter.lake.fishingCount += 1;
  if (!world.chapter.lake.catches.includes(caught.id)) world.chapter.lake.catches.push(caught.id);
  const lakeWordCount = world.chapter.lake.catches.filter((id) => id !== "worm").length;
  const lakeWordsComplete = lakeWordCount >= 4;
  const completedFishingQuest = lakeWordsComplete && completeQuest("lakeFishing");
  world.fishing = {
    state: "caught",
    timer: 0,
    catch: caught,
    revealTimer: 240
  };
  saveGame({ quiet: true });
  const lines = [
    { actor: "momo", expression: "happy", text: `Congratulations! You caught ${caught.english}: ${caught.glyph} (${caught.pinyin}).` }
  ];
  if (caught.id === "worm") {
    lines.push({
      actor: "momo",
      expression: "thinking",
      text: "A worm is useful bait, but it is not a lake word yet. Try fishing again."
    });
  } else if (lakeWordsComplete && !world.chapter.lake.homeBuilt) {
    lines.push({
      actor: "momo",
      expression: "confident",
      text: "Great work. The lake words are awake now. Press J to ride the cloud across Cloud Lake and look for the empty house."
    });
    if (!completedFishingQuest) showToast("Cloud Lake is ready. Ride the cloud across.");
  } else {
    lines.push({
      actor: "momo",
      expression: "thinking",
      text: `${lakeWordCount} lake word${lakeWordCount === 1 ? "" : "s"} awakened. Keep fishing until the lake gives up all its words.`
    });
  }
  startDialogue({
    actor: "momo",
    lines,
    onClose: () => {
      world.fishing = null;
    }
  });
}

function startBridgePuzzle() {
  if (world.chapter.bridgeSolved) {
    showToast("The Memory Bridge hums quietly.");
    return;
  }
  if (!hasFiveElements()) {
    startDialogue({
      actor: "mei",
      lines: [
        { actor: "mei", expression: "thinking", text: "The bridge refuses you. It is waiting for five voices, not one." },
        { actor: "momo", expression: "thinking", text: "It needs 金, 木, 水, 火, and 土 before it can open." }
      ]
    });
    return;
  }
  startChallenge({
    title: "Memory Bridge",
    steps: [
      {
        name: "First Plank",
        glyph: "金",
        prompt: "The bridge asks for metal. Choose 金.",
        options: ["金", "木", "水"],
        answer: "金",
        success: "金 rings. The first plank becomes solid.",
        fail: "The plank fades. 金 is metal."
      },
      {
        name: "River Knot",
        glyph: "水",
        prompt: "The river below whispers 水. Choose its meaning.",
        options: ["moon", "water", "wood"],
        answer: "water",
        success: "水 flows under the bridge without breaking it.",
        fail: "The river splashes ink. 水 means water."
      },
      {
        name: "Lantern Nail",
        glyph: "火",
        prompt: "A cold ember waits. Choose the pinyin for 火.",
        options: ["huǒ", "huó", "hòu"],
        answer: "huǒ",
        success: "火 lights the final nail.",
        fail: "The ember sputters. The third tone matters here."
      },
      {
        name: "Root Step",
        glyph: "木",
        prompt: "Roots hold the final board. Choose the meaning of 木.",
        options: ["earth", "wood", "metal"],
        answer: "wood",
        success: "木 roots the bridge in place.",
        fail: "The roots twist away. 木 means wood."
      },
      {
        name: "Earth Seal",
        glyph: "土",
        prompt: "The bridge asks for 土. Choose its meaning.",
        options: ["fire", "earth", "water"],
        answer: "earth",
        success: "土 settles. The bridge remembers the road.",
        fail: "Dust rises. 土 means earth."
      }
    ],
    onComplete: () => {
      world.chapter.bridgeSolved = true;
      completeQuest("openForest");
      setScene(5, "The Memory Bridge repairs itself.");
      startForestRoad();
    }
  });
}

function startForestRoad() {
  setScene(1);
  startDialogue({
    actor: "mei",
    lines: [
      { actor: "mei", expression: "happy", text: "The bridge is open. Beyond it waits Wuxing Forest." },
      { actor: "momo", expression: "thinking", text: "The forest path is quiet. Something is hiding the next word spirit." },
      { actor: "mei", expression: "thinking", text: "Cross carefully. The five elements will guide you there." }
    ]
  });
}

function startLanternGame() {
  if (world.chapter.lanternsLit >= 3) {
    showToast("All lanterns are lit.");
    return;
  }
  startChallenge({
    title: "Memory Practice",
    steps: [
      {
        name: "Peace Charm",
        glyph: "安",
        prompt: "A charm shows a quiet home. Choose the character for peace.",
        options: ["安", "火", "买"],
        answer: "安",
        success: "A warm charm rises.",
        fail: "The charm dims. 安 carries peace and safety."
      },
      {
        name: "Noodle Memory",
        glyph: "面",
        prompt: "Lin Po laughs. Choose the word connected to noodles.",
        options: ["面", "月", "水"],
        answer: "面",
        success: "The noodle stall cheers.",
        fail: "Momo whispers: 面 can point toward noodles here."
      },
      {
        name: "Moon Memory",
        glyph: "月",
        prompt: "A night charm shows 月. Choose its meaning.",
        options: ["moon", "person", "money"],
        answer: "moon",
        success: "The moon charm opens like an eye.",
        fail: "The sky waits. 月 means moon."
      }
    ],
    onComplete: () => {
      world.chapter.lanternsLit = 3;
      completeQuest("festival");
      setScene(1, "The memory charms rise... then one turns black.");
      startIncident();
    }
  });
}

function startIncident() {
  if (!world.chapter.festivalStarted || world.chapter.lanternsLit < 3) {
    startDialogue({
      actor: "momo",
      lines: [
        { actor: "momo", expression: "thinking", text: "The shrine is sealed. The air around it feels heavy." },
        { actor: "lina", expression: "thinking", text: "We should return after the village lights are awake." }
      ]
    });
    return;
  }
  if (world.chapter.incidentStarted && world.chapter.bossUnlocked) {
    showToast("The Bell Eater waits at the shrine.");
    return;
  }
  world.chapter.incidentStarted = true;
  world.chapter.bossUnlocked = true;
  completeQuest("incident");
  const boss = enemies.find((enemy) => enemy.id === "bellEater");
  if (boss) boss.hidden = false;
  startDialogue({
    actor: "wuyin",
    lines: [
        { actor: "narrator", expression: "thinking", text: "The sealed bell rings without being touched." },
      { actor: "momo", expression: "surprised", text: "That sound is not from the bell. Something is inside it." },
      { actor: "wuyin", expression: "angry", text: "Return the spirits, little monk. The village was quieter before you listened." },
      { actor: "mei", expression: "angry", text: "Xiao Wu, to the sealed shrine. Do not let it swallow the bell's name." }
    ]
  });
}

const elementSpiritIds = new Set(["jin", "mu", "shui", "huo", "tu"]);

function appendBagCategory(container, title, items, createCard) {
  if (!items.length) return;

  const section = document.createElement("section");
  section.className = "bag-category";

  const heading = document.createElement("h3");
  heading.className = "bag-category-title";
  heading.textContent = title;
  section.appendChild(heading);

  const grid = document.createElement("div");
  grid.className = "bag-card-grid";
  items.forEach((item) => grid.appendChild(createCard(item)));
  section.appendChild(grid);

  container.appendChild(section);
}

function createSpiritBagCard(id) {
  const spirit = spirits[id];
  const card = document.createElement("div");
  card.className = "spirit-card";
  card.innerHTML = `<strong>${spirit.glyph}</strong>${spirit.name}<br>${spirit.rarity}<br><span class="meaning-line">Meaning: ${spirit.meaning || spirit.group}</span>`;
  return card;
}

function createCodexBagCard(lesson) {
  const creature = lesson.creature;
  const unlocked = isCreatureUnlocked(creature.id);
  const card = document.createElement("div");
  card.className = unlocked ? "codex-card unlocked" : "codex-card";
  card.innerHTML = unlocked
    ? `<strong>${creature.hanzi}</strong>${creature.pinyin}<br>Unlocked<br><span class="meaning-line">Meaning: ${creature.english}</span>`
    : `<strong>?</strong>${lesson.title}<br>Locked<br><span class="meaning-line">Meaning: hidden</span>`;
  return card;
}

function createSkillBagCard(skill) {
  const card = document.createElement("div");
  card.className = "spirit-card";
  card.innerHTML = `<strong>${skill.glyph}</strong>${skill.name}<br>${skill.type}<br><span class="meaning-line">Meaning: ${skill.meaning}</span>`;
  return card;
}

function createLakeCatchBagCard(catchItem) {
  const card = document.createElement("div");
  card.className = "codex-card unlocked";
  card.innerHTML = `<strong>${catchItem.glyph}</strong>${catchItem.pinyin}<br>${catchItem.english}<br><span class="meaning-line">Meaning: ${catchItem.english}</span>`;
  return card;
}

function renderPanels() {
  ensureChapterTwoDefaults();
  ensureCosmeticDefaults();
  els.levelText.textContent = `Lv. ${player.level}`;
  els.chapterPill.textContent = `Chapter ${getDisplayChapter()}`;
  els.walletText.textContent = `◎ ${player.coins || 0}`;
  els.hpBar.style.width = `${(player.hp / player.maxHp) * 100}%`;
  els.xpBar.style.width = `${player.xp}%`;

  els.questList.innerHTML = "";
  visibleQuests().forEach((quest) => {
    const li = document.createElement("li");
    li.className = quest.done ? "done" : "";
    li.innerHTML = `<strong>${quest.title}</strong><br><span>${quest.objective}</span>`;
    els.questList.appendChild(li);
  });

  els.spiritGrid.innerHTML = "";
  const collectedSpirits = player.spirits.filter((id) => spirits[id]);
  appendBagCategory(
    els.spiritGrid,
    "Elements",
    collectedSpirits.filter((id) => elementSpiritIds.has(id)),
    createSpiritBagCard
  );
  appendBagCategory(
    els.spiritGrid,
    "People & Memory",
    collectedSpirits.filter((id) => !elementSpiritIds.has(id)),
    createSpiritBagCard
  );
  appendBagCategory(
    els.spiritGrid,
    "Skills",
    player.skills?.cloudRide ? [{ glyph: "云", name: "Yun", type: "Cloud Riding", meaning: "cloud" }] : [],
    createSkillBagCard
  );

  if (els.codexGrid) {
    els.codexGrid.innerHTML = "";
    appendBagCategory(
      els.codexGrid,
      "Animals",
      pinyinLessons.filter((lesson) => lesson.creature.kind === "animal"),
      createCodexBagCard
    );
    appendBagCategory(
      els.codexGrid,
      "Nature",
      pinyinLessons.filter((lesson) => lesson.creature.kind !== "animal"),
      createCodexBagCard
    );
    appendBagCategory(
      els.codexGrid,
      "Lake Life",
      lakeCatches.filter((item) => world.chapter.lake?.catches?.includes(item.id)),
      createLakeCatchBagCard
    );
  }
}

function getSaveSlots() {
  try {
    const slots = JSON.parse(localStorage.getItem(SAVE_INDEX_KEY)) || [];
    const seen = new Set();
    const validSlots = slots.filter((slot) => {
      if (!slot?.id || seen.has(slot.id)) return false;
      seen.add(slot.id);
      return Boolean(localStorage.getItem(slotKey(slot.id)));
    });
    if (validSlots.length !== slots.length) setSaveSlots(validSlots);
    return validSlots;
  } catch {
    return [];
  }
}

function setSaveSlots(slots) {
  const seen = new Set();
  const cleanSlots = slots.filter((slot) => {
    if (!slot?.id || seen.has(slot.id)) return false;
    seen.add(slot.id);
    return true;
  });
  localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(cleanSlots));
}

function slotKey(slotId) {
  return `glyphbound-save-${slotId}`;
}

function createSaveData() {
  ensureChapterTwoDefaults();
  ensurePlayerSkillDefaults();
  ensureCosmeticDefaults();
  return {
    version: SAVE_VERSION,
    player,
    chapter: world.chapter,
    interior: world.interior ? {
      id: world.interior.id,
      title: world.interior.title,
      playerX: world.interior.playerX,
      playerY: world.interior.playerY,
      facing: world.interior.facing
    } : null,
    inspected: Array.from(world.inspected),
    quests,
    pickups: pickups.map(({ id, collected }) => ({ id, collected })),
    enemies: enemies.map(({ id, hp, defeated }) => ({ id, hp, defeated }))
  };
}

function resetGameState() {
  Object.assign(player, JSON.parse(JSON.stringify(initialState.player)));
  world.cameraX = 0;
  world.activeDialogue = null;
  world.dialogueIndex = 0;
  world.battle = null;
  world.challenge = null;
  world.pinyinLesson = null;
  world.lifeBurst = null;
  world.transition = null;
  world.interior = null;
  world.fishing = null;
  world.valleyShopOpen = false;
  world.momoCheer = 0;
  world.momoPicker = false;
  world.toastTimer = 0;
  world.toastText = "";
  world.savedAt = null;
  world.weather = "drizzle";
  world.shake = 0;
  world.chapter = JSON.parse(JSON.stringify(initialState.chapter));
  world.inspected = new Set();
  initialState.quests.forEach((saved) => {
    const quest = quests.find((item) => item.id === saved.id);
    if (quest) quest.done = saved.done;
  });
  initialState.pickups.forEach((saved) => {
    const pickup = pickups.find((item) => item.id === saved.id);
    if (pickup) pickup.collected = saved.collected;
  });
  initialState.enemies.forEach((saved) => {
    const enemy = enemies.find((item) => item.id === saved.id);
    if (enemy) {
      enemy.hp = saved.hp;
      enemy.defeated = saved.defeated;
      enemy.hidden = saved.hidden;
      delete enemy.questionIndex;
      delete enemy.hitFlash;
    }
  });
  keys.clear();
  ensureChapterTwoDefaults();
  ensureCosmeticDefaults();
}

function getProgressPercent(chapter = world.chapter) {
  const pinyinDone = Array.isArray(chapter.pinyin?.completed) ? chapter.pinyin.completed.length : 0;
  const lakeCatchCount = Array.isArray(chapter.lake?.catches) ? chapter.lake.catches.length : 0;
  const flags = [
    chapter.companionJoined,
    chapter.chapterStarted,
    chapter.bridgeSolved,
    chapter.stageOneCleared,
    chapter.pinyin?.introSeen,
    pinyinDone >= 2,
    chapter.pinyin?.bossUnlocked,
    chapter.pinyin?.bossDefeated,
    chapter.lake?.unlocked,
    lakeCatchCount >= 2,
    chapter.lake?.homeBuilt
  ];
  return Math.round((flags.filter(Boolean).length / flags.length) * 100);
}

function getDisplayChapter(chapter = world.chapter) {
  if (chapter.lake?.unlocked) return 3;
  return chapter.stageOneCleared || chapter.pinyin?.introSeen ? 2 : 1;
}

function getLocationName(data = { player, chapter: world.chapter }) {
  if (data.interior?.id === "lakeHome") return "Lakeside Home";
  if (data.chapter?.lake?.area === "lake" || data.player?.x >= CLOUD_LAKE.start) return "Cloud Lake";
  if (data.chapter?.pinyin?.bossDefeated) return "Restored Pinyin Valley";
  if (data.chapter?.pinyin?.introSeen || data.player?.x > 3600) return "Pinyin Valley";
  if (data.chapter?.stageOneCleared) return "Five Elements Forest";
  if (data.chapter?.bridgeSolved) return "Forest Gate";
  if (data.player?.x > 2300) return "Market Road";
  if (data.player?.x > 1900) return "Memory Bridge";
  return "Beginner Village";
}

function upsertCurrentSlot(data) {
  if (!currentSlotId) return;
  const slots = getSaveSlots();
  const existing = slots.find((slot) => slot.id === currentSlotId);
  const savedName = localStorage.getItem(`glyphbound-save-name-${currentSlotId}`);
  const now = new Date().toISOString();
  const summary = {
    id: currentSlotId,
    name: existing?.name || savedName || "New Journey",
    level: data.player.level,
    chapter: getDisplayChapter(data.chapter),
    location: getLocationName(data),
    progress: getProgressPercent(data.chapter),
    updatedAt: now
  };
  const nextSlots = [summary, ...slots.filter((slot) => slot.id !== currentSlotId)];
  setSaveSlots(nextSlots);
}

function saveGame(options = {}) {
  const data = createSaveData();
  if (currentSlotId) {
    localStorage.setItem(slotKey(currentSlotId), JSON.stringify(data));
    localStorage.setItem(CURRENT_SLOT_KEY, currentSlotId);
    upsertCurrentSlot(data);
  }
  localStorage.setItem("glyphbound-save", JSON.stringify(data));
  if (!options.quiet) showToast("Game saved.");
}

function loadGame(slotId = currentSlotId) {
  currentSlotId = slotId || localStorage.getItem(CURRENT_SLOT_KEY);
  const raw = currentSlotId ? localStorage.getItem(slotKey(currentSlotId)) : localStorage.getItem("glyphbound-save");
  if (!raw) {
    if (currentSlotId) removeCorruptSaveSlot(currentSlotId);
    return false;
  }
  try {
    const data = JSON.parse(raw);
    if (data.version !== SAVE_VERSION) {
      if (currentSlotId) removeCorruptSaveSlot(currentSlotId);
      localStorage.removeItem("glyphbound-save");
      return false;
    }
    resetGameState();
    Object.assign(player, data.player);
    if (typeof player.coins !== "number") player.coins = 0;
    if (!player.momoColor) player.momoColor = "black";
    ensurePlayerSkillDefaults();
    ensureCosmeticDefaults();
    if (data.chapter) Object.assign(world.chapter, data.chapter);
    world.chapter.festivalStarted = false;
    world.chapter.lanternsLit = 0;
    world.chapter.incidentStarted = false;
    world.chapter.bossUnlocked = false;
    world.interior = data.interior?.id === "lakeHome" ? {
      id: "lakeHome",
      title: "Lakeside Home",
      playerX: clamp(Number(data.interior.playerX) || 480, 96, 864),
      playerY: clamp(Number(data.interior.playerY) || 394, 122, 460),
      facing: data.interior.facing || "up"
    } : null;
    ensureChapterTwoDefaults();
    ensurePlayerSkillDefaults();
    if (world.chapter.pinyin?.introSeen && world.chapter.scene > 2) world.chapter.scene = 2;
    if (data.inspected) world.inspected = new Set(data.inspected);
    data.quests?.forEach((saved) => {
      const quest = quests.find((item) => item.id === saved.id);
      if (quest) quest.done = saved.done;
    });
    syncLakeQuestCompletion();
    data.pickups?.forEach((saved) => {
      const pickup = pickups.find((item) => item.id === saved.id);
      if (pickup) pickup.collected = saved.collected;
    });
    data.enemies?.forEach((saved) => {
      const enemy = enemies.find((item) => item.id === saved.id);
      if (enemy) {
        enemy.hp = saved.hp;
        enemy.defeated = saved.defeated;
        if (!enemy.defeated) enemy.hp = clamp(enemy.hp, Math.ceil(enemy.maxHp * 0.5), enemy.maxHp);
      }
    });
    if (!world.chapter.companionJoined && player.x > 900) player.x = 130;
    if (!world.chapter.bridgeSolved && player.x > 2078) player.x = 2078;
    if (!world.chapter.stageOneCleared && player.x > 3400) player.x = 2860;
    return true;
  } catch {
    if (currentSlotId) removeCorruptSaveSlot(currentSlotId);
    localStorage.removeItem("glyphbound-save");
    return false;
  }
}

function removeCorruptSaveSlot(slotId) {
  localStorage.removeItem(slotKey(slotId));
  localStorage.removeItem(`glyphbound-save-name-${slotId}`);
  setSaveSlots(getSaveSlots().filter((slot) => slot.id !== slotId));
  if (currentSlotId === slotId) currentSlotId = null;
  if (localStorage.getItem(CURRENT_SLOT_KEY) === slotId) localStorage.removeItem(CURRENT_SLOT_KEY);
}

function formatSaveTime(iso) {
  if (!iso) return "--/-- --:--";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--/-- --:--";
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);
}

function showMainMenu() {
  world.menuOpen = true;
  els.startMenu.hidden = false;
  els.mainMenuActions.hidden = false;
  els.newSavePanel.hidden = true;
  els.loadSavePanel.hidden = true;
  els.settingsPanel.hidden = true;
  switchMusic("menu");
}

function showNewSavePanel() {
  els.mainMenuActions.hidden = true;
  els.loadSavePanel.hidden = true;
  els.settingsPanel.hidden = true;
  els.newSavePanel.hidden = false;
  els.saveNameInput.value = "";
  setTimeout(() => els.saveNameInput.focus(), 0);
}

function showSettingsPanel() {
  els.mainMenuActions.hidden = true;
  els.newSavePanel.hidden = true;
  els.loadSavePanel.hidden = true;
  els.settingsPanel.hidden = false;
}

function renderSaveList() {
  const slots = getSaveSlots();
  els.saveList.innerHTML = "";
  if (!slots.length) {
    const empty = document.createElement("div");
    empty.className = "empty-saves";
    empty.textContent = "No saves yet. Create a new monk journey.";
    els.saveList.appendChild(empty);
    return;
  }
  slots.forEach((slot) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "save-card";
    card.innerHTML = `
      <span class="save-avatar">武</span>
      <span>
        <strong>${escapeHtml(slot.name)}</strong>
        <span>Lv. ${slot.level || 1} · Chapter ${slot.chapter || 1} · ${escapeHtml(slot.location || "Beginner Village")}</span>
        <span class="save-progress"><i style="width:${slot.progress || 0}%"></i></span>
      </span>
      <span class="save-time">${slot.progress || 0}%<br>${formatSaveTime(slot.updatedAt)}</span>
      <span class="delete-save" data-delete-slot="${escapeHtml(slot.id)}">Delete</span>
    `;
    card.addEventListener("click", () => enterGame(slot.id));
    card.querySelector(".delete-save").addEventListener("click", (event) => {
      event.stopPropagation();
      deleteSaveSlot(slot.id);
    });
    els.saveList.appendChild(card);
  });
}

function deleteSaveSlot(slotId) {
  const slot = getSaveSlots().find((item) => item.id === slotId);
  if (!window.confirm(`Delete save "${slot?.name || "New Journey"}"?`)) return;
  const slots = getSaveSlots().filter((slot) => slot.id !== slotId);
  setSaveSlots(slots);
  localStorage.removeItem(slotKey(slotId));
  localStorage.removeItem(`glyphbound-save-name-${slotId}`);
  if (currentSlotId === slotId || localStorage.getItem(CURRENT_SLOT_KEY) === slotId) {
    currentSlotId = null;
    localStorage.removeItem(CURRENT_SLOT_KEY);
    localStorage.removeItem("glyphbound-save");
  }
  if (!slots.length) {
    currentSlotId = null;
    localStorage.removeItem(CURRENT_SLOT_KEY);
    localStorage.removeItem("glyphbound-save");
  }
  showToast("Save deleted.");
  els.saveList.innerHTML = "";
  renderSaveList();
}

function showLoadSavePanel() {
  els.mainMenuActions.hidden = true;
  els.newSavePanel.hidden = true;
  els.settingsPanel.hidden = true;
  els.loadSavePanel.hidden = false;
  renderSaveList();
}

function beginOpeningIfNeeded(loadedSave) {
  if (loadedSave && world.chapter.openingDone) return;
  startDialogue({
    name: "Narrator",
    onClose: () => {
      world.chapter.openingDone = true;
      showToast("Find Master Yun, then visit Momo Mart.");
      saveGame({ quiet: true });
    },
    lines: [
      { actor: "narrator", expression: "thinking", text: "Morning in the village. Xiao Wu has just come down from the monastery." },
      { actor: "mei", expression: "thinking", text: "Master Yun is waiting nearby. He has one simple errand before the journey begins." }
    ]
  });
}

function enterGame(slotId) {
  const loadedSave = slotId ? loadGame(slotId) : false;
  if (slotId && !loadedSave) {
    showToast("That save could not be loaded.");
    showLoadSavePanel();
    return;
  }
  world.menuOpen = false;
  els.startMenu.hidden = true;
  els.newSavePanel.hidden = true;
  els.loadSavePanel.hidden = true;
  els.settingsPanel.hidden = true;
  keys.clear();
  renderPanels();
  switchMusic("village");
  updateMusicButton();
  beginOpeningIfNeeded(loadedSave);
}

function returnToStartMenu() {
  if (!world.menuOpen) saveGame({ quiet: true });
  switchMusic("menu");
  keys.clear();
  world.menuOpen = true;
  world.activeDialogue = null;
  world.battle = null;
  world.challenge = null;
  world.pinyinLesson = null;
  world.valleyShopOpen = false;
  world.momoPicker = false;
  els.dialogue.hidden = true;
  els.battle.hidden = true;
  els.momoPicker.hidden = true;
  els.pinyinPanel.hidden = true;
  els.questPanel.hidden = true;
  els.bagPanel.hidden = true;
  els.mapPanel.hidden = true;
  els.startMenu.hidden = false;
  showMainMenu();
  renderSaveList();
}

function createNewSave() {
  const name = els.saveNameInput.value.trim() || "New Journey";
  resetGameState();
  currentSlotId = `slot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const data = createSaveData();
  localStorage.setItem(slotKey(currentSlotId), JSON.stringify(data));
  localStorage.setItem(CURRENT_SLOT_KEY, currentSlotId);
  localStorage.setItem(`glyphbound-save-name-${currentSlotId}`, name);
  setSaveSlots([
    {
      id: currentSlotId,
      name,
      level: player.level,
      chapter: getDisplayChapter(world.chapter),
      location: getLocationName(data),
      progress: getProgressPercent(world.chapter),
      updatedAt: now
    },
    ...getSaveSlots()
  ]);
  enterGame(currentSlotId);
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y;
}

function interiorPlayerBox(x = world.interior?.playerX || 0, y = world.interior?.playerY || 0) {
  return { x: x - 14, y: y - 28, w: 28, h: 34 };
}

function lakeHomeCollisionRects() {
  return [
    { x: 112, y: 132, w: 134, h: 58 },
    { x: 108, y: 306, w: 196, h: 92 },
    { x: 652, y: 312, w: 178, h: 78 },
    { x: 408, y: 260, w: 100, h: 56 }
  ];
}

function updateInterior() {
  if (!world.interior) return;
  const left = keys.has("ArrowLeft") || keys.has("a");
  const right = keys.has("ArrowRight") || keys.has("d");
  const up = keys.has("ArrowUp") || keys.has("w");
  const down = keys.has("ArrowDown") || keys.has("s");
  const speed = 2.7;
  let dx = 0;
  let dy = 0;
  if (left) dx -= speed;
  if (right) dx += speed;
  if (up) dy -= speed;
  if (down) dy += speed;
  if (dx && dy) {
    dx *= 0.72;
    dy *= 0.72;
  }
  if (Math.abs(dx) > Math.abs(dy)) world.interior.facing = dx > 0 ? "right" : "left";
  else if (dy) world.interior.facing = dy > 0 ? "down" : "up";

  const tryMove = (axis, delta) => {
    if (!delta) return;
    const nextX = axis === "x" ? world.interior.playerX + delta : world.interior.playerX;
    const nextY = axis === "y" ? world.interior.playerY + delta : world.interior.playerY;
    const nextBox = interiorPlayerBox(nextX, nextY);
    const insideRoom = nextBox.x >= 72 && nextBox.x + nextBox.w <= 888 && nextBox.y >= 78 && nextBox.y + nextBox.h <= 476;
    const blocked = lakeHomeCollisionRects().some((rect) => rectsOverlap(nextBox, rect));
    if (insideRoom && !blocked) {
      world.interior.playerX = nextX;
      world.interior.playerY = nextY;
    }
  };

  tryMove("x", dx);
  tryMove("y", dy);
  player.moving = Boolean(dx || dy);
  if (world.interior.playerY > 454 && world.interior.playerX > 426 && world.interior.playerX < 534) {
    exitInterior();
  }
}

function update() {
  const inputLocked = world.transition || world.fishing?.state === "waiting";
  if (!world.menuOpen && !inputLocked && !world.activeDialogue && !world.battle && !world.momoPicker && !world.pinyinLesson && !world.valleyShopOpen) {
    if (world.interior) {
      updateInterior();
    } else {
    const left = keys.has("ArrowLeft") || keys.has("a");
    const right = keys.has("ArrowRight") || keys.has("d");
    const swimming = isPlayerSwimming();
    const moveSpeed = player.cloudRiding ? player.speed + 0.9 : swimming ? player.speed * 0.62 : player.speed;
    player.vx = 0;
    if (left) {
      player.vx = -moveSpeed;
      player.facing = -1;
    }
    if (right) {
      player.vx = moveSpeed;
      player.facing = 1;
    }
    player.moving = player.vx !== 0;
    player.x = clamp(player.x + player.vx, 40, world.width - 80);
    if (!world.chapter.bridgeSolved && player.x > 2078) {
      player.x = 2078;
      showToast("The broken bridge blocks the road.");
    }
    if (!world.chapter.stageOneCleared && player.x > 3400) {
      player.x = 3400;
      showToast("A quiet valley waits beyond the forest trial.");
    }
    if (!world.chapter.lake?.unlocked && player.x > CLOUD_LAKE.start - 42) {
      player.x = CLOUD_LAKE.start - 42;
      showToast("The cloud road has not awakened yet.");
    }
    if (world.chapter.lake?.unlocked && world.chapter.lake.area !== "lake" && player.x > CLOUD_LAKE.start - 42) {
      if (player.cloudRiding) {
        startCloudLakeTransition();
      } else {
        player.x = CLOUD_LAKE.start - 42;
        player.vx = 0;
        player.moving = false;
        showToast("Press J to ride the cloud to Cloud Lake.");
      }
    }
    if (world.chapter.lake?.unlocked && world.chapter.lake.area === "lake" && !player.cloudRiding && player.x + player.w > CLOUD_LAKE.waterStart - 8 && player.x < CLOUD_LAKE.waterEnd - 12) {
      player.x = player.vx < 0 && player.x > CLOUD_LAKE.waterStart
        ? CLOUD_LAKE.waterEnd + 12
        : CLOUD_LAKE.waterStart - player.w - 8;
      player.vx = 0;
      player.moving = false;
      startLakeCloudHint();
    }
    if (world.chapter.lake?.unlocked && world.chapter.lake.area === "lake" && player.x >= CLOUD_LAKE.start && player.x < CLOUD_LAKE.start + 22) {
      player.x = CLOUD_LAKE.start + 22;
      startLakeExitTransition();
    }

    pickups.forEach((item) => {
      if (!item.collected && Math.abs(player.x - item.x) < 24) collectPickup(item);
    });

    const nearbyEnemy = enemies.find((item) => !item.hidden && !item.defeated && Math.abs(player.x - item.x) < 34);
    if (nearbyEnemy) startBattle(nearbyEnemy);
    }
  }
  world.time += 0.002;
  frame += 1;

  if (world.transition) {
    world.transition.timer += 1;
    if (!world.transition.moved && world.transition.timer >= (world.transition.moveAt || 70)) {
      world.transition.moved = true;
      if (world.transition.onMove) world.transition.onMove();
      else if (world.transition.type === "lakeExit") finishLakeExitTransition();
      else finishCloudLakeTransition();
    }
    if (world.transition.timer >= world.transition.duration) {
      const transitionType = world.transition.type;
      world.transition = null;
      if (transitionType === "cloudLake") startCloudLakeIntro();
    }
  }
  updateScreenFade();

  if (world.fishing?.state === "waiting") {
    world.fishing.timer -= 1;
    if (world.fishing.timer <= 0) completeFishingCatch();
  } else if (world.fishing?.state === "caught" && world.fishing.revealTimer > 0) {
    world.fishing.revealTimer -= 1;
  }

  if (player.x > regions[1].start + 30 && world.chapter.bridgeSolved) completeQuest("openForest");
  discoverMapLocations({ quiet: true });
  if (!els.mapPanel.hidden && frame % 20 === 0) renderWorldMap();
  world.cameraX = clamp(player.x - canvas.width * 0.42, 0, world.width - canvas.width);

  if (world.toastTimer > 0) {
    world.toastTimer -= 1;
    if (world.toastTimer === 0) els.toast.hidden = true;
  }
  if (world.shake > 0) world.shake -= 1;
  if (world.momoCheer > 0) world.momoCheer -= 1;
  if (world.lifeBurst?.timer > 0) world.lifeBurst.timer -= 1;
  enemies.forEach((enemy) => {
    if (enemy.hitFlash > 0) enemy.hitFlash -= 1;
  });
  renderPanels();
}

function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x - world.cameraX), Math.round(y), w, h);
}

function drawScreenRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function drawText(text, x, y, size = 18, color = "#172033") {
  ctx.fillStyle = color;
  ctx.font = `${size}px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.fillText(text, Math.round(x - world.cameraX), Math.round(y));
}

function drawScreenText(text, x, y, size = 18, color = "#172033") {
  ctx.fillStyle = color;
  ctx.font = `${size}px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.fillText(text, Math.round(x), Math.round(y));
}

function drawScreenCircle(x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(Math.round(x), Math.round(y), radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawCircle(x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(Math.round(x - world.cameraX), Math.round(y), radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawEllipse(x, y, radiusX, radiusY, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(Math.round(x - world.cameraX), Math.round(y), radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawOutlinedRect(x, y, w, h, color, line = "#171b2b") {
  drawRect(x, y, w, h, line);
  drawRect(x + 4, y + 4, w - 8, h - 8, color);
}

function drawBackground() {
  const region = regionAt(player.x);
  const dayPulse = (Math.sin(world.time) + 1) / 2;
  const sky = ctx.createLinearGradient(0, 0, 0, world.floor);
  sky.addColorStop(0, region.sky);
  sky.addColorStop(0.72, "#d8f2ff");
  sky.addColorStop(1, "#fff0ba");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255, 247, 215, 0.78)";
  ctx.beginPath();
  ctx.arc(780 - world.cameraX * 0.08, 84, 36, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(49, 65, 96, 0.22)";
  for (let i = 0; i < 6; i += 1) {
    const x = ((i * 360 - world.cameraX * 0.18) % 1320) - 180;
    ctx.beginPath();
    ctx.moveTo(x, world.floor);
    ctx.lineTo(x + 130, 225 + (i % 2) * 18);
    ctx.lineTo(x + 300, world.floor);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  for (let i = 0; i < 7; i += 1) {
    const x = ((i * 430 - world.cameraX * 0.35) % 1200) - 140;
    ctx.fillRect(x, 72 + (i % 3) * 38, 80, 22);
    ctx.fillRect(x + 22, 52 + (i % 3) * 38, 42, 42);
    ctx.fillRect(x + 58, 62 + (i % 3) * 38, 34, 34);
  }

  regions.forEach((item) => {
    const sx = item.start - world.cameraX;
    const ex = item.end - world.cameraX;
    if (ex < -100 || sx > canvas.width + 100) return;
    ctx.fillStyle = item.ground;
    ctx.fillRect(sx, world.floor, item.end - item.start, canvas.height - world.floor);
    if (item.id !== "market") {
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.fillRect(sx, world.floor, item.end - item.start, 12);
      ctx.fillStyle = "rgba(0,0,0,0.14)";
      for (let x = item.start; x < item.end; x += TILE) {
        ctx.fillRect(Math.round(x - world.cameraX), world.floor, TILE - 2, 5);
      }
      ctx.fillStyle = "rgba(255,247,215,0.24)";
      for (let x = item.start + 12; x < item.end; x += TILE * 2) {
        ctx.fillRect(Math.round(x - world.cameraX), world.floor + 26, 18, 4);
      }
    }
    drawText(item.name, item.start + 180, 74, 20, "#172033");
    drawText(item.theme, item.start + 180, 100, 15, "#172033");
  });

  for (let x = 180; x < world.width; x += 310) {
    if (x >= 3000) continue;
    const sway = Math.round(Math.sin(frame / 26 + x) * 4);
    drawOutlinedRect(x, 308, 28, 112, "#7b5238");
    drawOutlinedRect(x - 24 + sway, 276, 78, 48, "#2f8f52");
    drawOutlinedRect(x + 10 + sway, 246, 68, 48, "#38a860");
  }

  ctx.fillStyle = `rgba(23, 27, 43, ${0.10 + dayPulse * 0.18})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBuildings() {
  drawOutlinedRect(245, 294, 190, 126, "#b8774d");
  drawOutlinedRect(220, 258, 240, 42, "#7c4637");
  drawOutlinedRect(300, 342, 44, 78, "#4f3240");
  drawOutlinedRect(375, 326, 34, 32, "#ffe6a8");
  drawText("少林院", 340, 354, 28, "#fff7d7");

  drawMomoMart(735, 420);

  const riverWorldX = 2090;
  const waterX = riverWorldX - world.cameraX;
  ctx.fillStyle = "#2f8fd8";
  ctx.fillRect(waterX, 402, 300, 138);
  ctx.fillStyle = "#d9b66f";
  ctx.fillRect(waterX - 36, 402, 36, 138);
  ctx.fillRect(waterX + 300, 402, 36, 138);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  for (let i = 0; i < 7; i += 1) {
    ctx.fillRect(waterX + i * 42 + (frame % 30), 432 + (i % 2) * 18, 26, 5);
  }

  drawOutlinedRect(1275, 270, 116, 28, "#7c4637");
  drawText("月", 1332, 262, 20, "#fff7d7");

  if (!world.chapter.bridgeSolved) {
    drawOutlinedRect(2078, 386, 86, 20, "#7b5238");
    drawOutlinedRect(2214, 386, 86, 20, "#7b5238");
    drawText("桥", 2190, 374, 22, "#fff7d7");
  } else {
    for (let x = 2078; x < 2300; x += 32) drawOutlinedRect(x, 386, 30, 22, "#8a5b39");
    drawOutlinedRect(2460, 312, 34, 108, "#7b5238");
    drawOutlinedRect(2620, 312, 34, 108, "#7b5238");
    drawOutlinedRect(2428, 272, 96, 58, "#2f8f52");
    drawOutlinedRect(2588, 272, 96, 58, "#38a860");
    drawOutlinedRect(2502, 242, 110, 72, "#2f8f52");
    drawText("五行林", 2556, 236, 22, "#172033");
    drawOutlinedRect(2542, 350, 52, 70, "#8d99ae");
    drawText("林", 2568, 392, 28, "#172033");
  }

  if (world.chapter.stageOneCleared) drawPinyinValley();
  if (world.chapter.lake?.unlocked || player.x >= CLOUD_LAKE.start - 200) drawCloudLake();
}

function drawMomoMart(x, groundY) {
  drawEllipse(x, groundY + 2, 96, 8, "rgba(23,27,43,0.12)");
  drawRect(x - 86, groundY - 112, 172, 112, "#314160");
  drawRect(x - 104, groundY - 142, 208, 30, "#b89460");
  drawRect(x - 94, groundY - 156, 188, 18, "#f1c550");
  drawRect(x - 28, groundY - 66, 42, 66, "#111827");
  drawRect(x + 42, groundY - 84, 30, 28, "#fff7d7");
  drawRect(x + 48, groundY - 78, 18, 16, "#c7e6ff");
  drawCircle(x - 56, groundY - 70, 13, "#111827");
  drawCircle(x - 55, groundY - 72, 4, "#fff7d7");
  drawCircle(x - 36, groundY - 78, 9, "#2f8fd8");
  drawCircle(x - 20, groundY - 80, 8, "#f1c550");
  drawText("墨墨", x, groundY - 124, 20, "#172033");
}

function drawPinyinValley() {
  ensureChapterTwoDefaults();
  ensureCosmeticDefaults();
  const streamX = PINYIN_STREAM.start - world.cameraX;
  ctx.fillStyle = "rgba(47,143,216,0.54)";
  ctx.fillRect(streamX, PINYIN_STREAM.surfaceY, PINYIN_STREAM.end - PINYIN_STREAM.start, PINYIN_STREAM.height);
  ctx.fillStyle = "rgba(255,247,215,0.46)";
  for (let i = 0; i < 8; i += 1) {
    ctx.fillRect(streamX + i * 82 + (frame % 40), PINYIN_STREAM.surfaceY + 24 + (i % 2) * 18, 34, 5);
  }

  drawSimpleSoundTemple(3960, 420);
  drawLifeSealOrCreature(pinyinLessons[0], 3830, 374);
  drawLifeSealOrCreature(pinyinLessons[1], 3995, 338);
  drawLifeSealOrCreature(pinyinLessons[2], 4140, 446);
  drawLifeSealOrCreature(pinyinLessons[3], 4260, 292);
  drawLifeSealOrCreature(pinyinLessons[4], 4445, 398);
  drawLifeSealOrCreature(pinyinLessons[5], 4630, 350);
  drawFreeRoamingCreatures();
  drawLifeBurst();

  if (world.chapter.pinyin.bossUnlocked && !world.chapter.pinyin.bossDefeated) {
    drawSilentShadowBoss(4864, 420, pinyinBossHealthRatio());
  } else if (world.chapter.pinyin.bossDefeated) {
    drawCloudSeal(4864, 420);
  }
}

function drawCloudLake() {
  ensureChapterTwoDefaults();
  const waterX = CLOUD_LAKE.waterStart - world.cameraX;
  const waterW = CLOUD_LAKE.waterEnd - CLOUD_LAKE.waterStart;
  ctx.fillStyle = "#2f8fd8";
  ctx.fillRect(waterX, CLOUD_LAKE.surfaceY, waterW, CLOUD_LAKE.height);
  ctx.fillStyle = "rgba(255,247,215,0.38)";
  for (let i = 0; i < 16; i += 1) {
    ctx.fillRect(waterX + i * 74 + (frame % 50), CLOUD_LAKE.surfaceY + 28 + (i % 3) * 34, 36, 5);
  }

  drawEllipse(5368, 422, 122, 10, "rgba(23,27,43,0.13)");
  drawRect(5244, 388, 250, 32, "#88b987");
  drawRect(5420, 380, 250, 26, "#8a5b39");
  drawRect(5426, 384, 238, 5, "#a87345");
  drawRect(5426, 397, 238, 4, "#6a4b2b");
  for (let x = 5434; x < 5660; x += 34) drawRect(x, 378, 9, 34, "#6a4b2b");
  drawText("湖", 5524, 399, 22, "#fff7d7");
  const chairX = FISHING_SPOT.x - 62;
  drawRect(chairX - 6, 404, 76, 10, "#6a4b2b");
  drawRect(chairX + 4, 362, 10, 48, "#7b5238");
  drawRect(chairX + 48, 362, 10, 48, "#7b5238");
  drawRect(chairX - 5, 360, 64, 13, "#8a5b39");
  drawRect(chairX + 2, 382, 52, 13, "#8a5b39");
  drawCircle(chairX - 20, 386 + Math.sin(frame / 24) * 2, 6, "#fff7d7");
  drawCircle(chairX + 72, 386 + Math.cos(frame / 24) * 2, 5, "#fff7d7");

  drawLakeCreatureIcon(lakeCatches[1], 5790, 446 + Math.sin(frame / 28) * 3, 0.7);
  drawLakeCreatureIcon(lakeCatches[2], 5940 + Math.sin(frame / 38) * 30, 410 + Math.sin(frame / 18) * 5, 0.75);
  drawLakeCreatureIcon(lakeCatches[3], 6240 + Math.sin(frame / 44) * 36, 386 + Math.cos(frame / 18) * 5, 0.75);
  drawLakeCreatureIcon(lakeCatches[4], 6420 + Math.sin(frame / 52) * 22, 438, 0.75);
  if (isLakeHomeAvailable()) drawLakeHomeExterior();
}

function drawLakeHomeExterior() {
  const x = LAKE_HOME.x;
  const y = 420;
  const built = world.chapter.lake?.homeBuilt;
  const doorOpen = homeDoorOpenRatio("exterior");
  drawEllipse(x, y + 2, 96, 8, "rgba(23,27,43,0.13)");
  drawRect(x - 86, y - 104, 172, 104, built ? "#caa574" : "#a9896b");
  drawRect(x - 102, y - 132, 204, 34, "#6a4b2b");
  drawRect(x - 84, y - 148, 168, 24, built ? "#8a5b39" : "#6f5a4d");
  drawRect(x - 30, y - 60, 52, 60, "#1b2534");
  drawRect(x - 24 - doorOpen * 26, y - 52, Math.max(12, 40 - doorOpen * 24), 52, "#5f3d2b");
  drawRect(x - 18 - doorOpen * 26, y - 30, 5, 5, "#d8b16a");
  drawRect(x + 42, y - 76, 30, 28, "#fff7d7");
  drawRect(x + 48, y - 70, 18, 16, "#b8e5ff");
  drawRect(x - 66, y - 78, 30, 28, "#fff7d7");
  drawRect(x - 60, y - 72, 18, 16, "#b8e5ff");
  drawText("家", x, y - 114, 22, "#fff7d7");
  drawRect(x - 92, y - 8, 184, 8, "#6a4b2b");
  if (!built) {
    drawRect(x - 78, y - 92, 18, 5, "#6f5a4d");
    drawRect(x + 54, y - 28, 16, 5, "#6f5a4d");
  }
}

function pinyinBossHealthRatio() {
  if (world.challenge?.title === "Silent Shadow") {
    return clamp((world.challenge.steps.length - world.challenge.index) / world.challenge.steps.length, 0, 1);
  }
  return 1;
}

function drawPixelHpBar(x, y, width, ratio) {
  drawRect(x - width / 2, y, width, 10, "#171b2b");
  drawRect(x - width / 2 + 3, y + 3, width - 6, 4, "#fff7d7");
  drawRect(x - width / 2 + 3, y + 3, Math.max(0, (width - 6) * ratio), 4, "#ef5a5a");
}

function drawSilentShadowBoss(x, groundY, hpRatio = 1) {
  const pulse = Math.sin(frame / 18) * 4;
  const y = groundY - 116 + pulse;
  drawPixelHpBar(x, y - 30, 112, hpRatio);
  drawEllipse(x, groundY - 2, 54, 8, "rgba(23,27,43,0.22)");
  drawRect(x - 42, y + 48, 84, 72, "#514070");
  drawRect(x - 34, y + 26, 68, 34, "#65507a");
  drawRect(x - 50, y + 52, 16, 40, "#3f315d");
  drawRect(x + 34, y + 52, 16, 40, "#3f315d");
  drawRect(x - 34, y + 110, 18, 14, "#3f315d");
  drawRect(x + 16, y + 110, 18, 14, "#3f315d");
  drawRect(x - 34, y + 8, 16, 26, "#65507a");
  drawRect(x + 18, y + 8, 16, 26, "#65507a");
  drawRect(x - 28, y + 44, 10, 10, "#fff7d7");
  drawRect(x + 18, y + 44, 10, 10, "#fff7d7");
  drawRect(x - 16, y + 76, 32, 5, "#211a33");
  drawCircle(x - 64, y + 62, 5, "rgba(255,247,215,0.5)");
  drawCircle(x + 64, y + 62, 5, "rgba(255,247,215,0.5)");
}

function drawCloudSeal(x, groundY) {
  const bob = Math.sin(frame / 22) * 5;
  const y = groundY - 66 + bob;
  const learned = Boolean(player.skills?.cloudRide);
  drawEllipse(x, groundY - 2, 48, 7, "rgba(23,27,43,0.14)");
  drawCircle(x - 30, y + 4, 17, "#fffdf0");
  drawCircle(x - 10, y - 8, 22, "#fff7d7");
  drawCircle(x + 16, y - 5, 20, "#f8f3df");
  drawCircle(x + 34, y + 6, 14, "#fffdf0");
  drawRect(x - 34, y + 2, 70, 18, "#fffdf0");
  drawText("云", x, y + 15, 24, learned ? "#5f8f74" : "#b85f42");
  if (!learned) {
    drawText("J 100", x, y - 28, 12, "#5f3d2b");
  }
}

function drawSimpleSoundTemple(x, groundY) {
  const bellBob = Math.sin(frame / 34) * 1.5;
  drawEllipse(x, groundY + 2, 62, 7, "rgba(23,27,43,0.12)");
  drawRect(x - 52, groundY - 18, 104, 18, "#8d99ae");
  drawRect(x - 38, groundY - 68, 76, 50, "#fff7d7");
  drawRect(x - 14, groundY - 42, 28, 42, "#2f405f");
  drawRect(x - 54, groundY - 86, 108, 14, "#8a3f35");
  drawRect(x - 36, groundY - 98, 72, 12, "#b85f42");
  drawRect(x - 28, groundY - 62, 8, 44, "#b89460");
  drawRect(x + 20, groundY - 62, 8, 44, "#b89460");
  drawCircle(x, groundY - 60 + bellBob, 7, "#d8b16a");
}

function drawFreeRoamingCreatures() {
  pinyinLessons.forEach((lesson) => {
    const creature = lesson.creature;
    if (!isCreatureUnlocked(creature.id)) return;
    const t = frame * 0.34 + creature.id.length * 47;
    const landFootY = world.floor + 10;
    if (creature.id === "horse") drawCreature(creature, 3508 + (t * 0.46) % 390, landFootY);
    else if (creature.id === "cat") drawCreature(creature, 3560 + (Math.sin(t / 110) + 1) * 165, landFootY);
    else if (creature.id === "fish") drawCreature(creature, 4070 + (Math.sin(t / 46) + 1) * 260, 446 + Math.sin(t / 12) * 5);
    else if (creature.id === "bird") drawCreature(creature, 3580 + (t * 1.1) % 1380, 230 + Math.sin(t / 24) * 32);
  });
}

function drawLifeSealOrCreature(lesson, x, y) {
  const creature = lesson.creature;
  if (isCreatureUnlocked(creature.id)) {
    if (creature.kind === "animal") return;
    drawCreature(creature, x, y);
    return;
  }
  const glow = 0.45 + Math.sin(frame / 18 + x) * 0.18;
  if (creature.source === "orb") {
    drawEllipse(x, world.floor + 5, 26, 5, "rgba(23,27,43,0.12)");
    drawCircle(x, world.floor - 24 + Math.sin(frame / 18) * 2, 22, `rgba(241,197,80,${glow})`);
    drawCircle(x, world.floor - 24 + Math.sin(frame / 18) * 2, 10, "#fff7d7");
    drawText(creature.hanzi, x, world.floor - 18, 18, "#172033");
  } else if (creature.source === "bud") {
    drawEllipse(x, world.floor + 4, 28, 5, "rgba(23,27,43,0.12)");
    drawRect(x - 3, world.floor - 32, 6, 34, "#7aa35e");
    drawCircle(x - 10, world.floor - 36, 12, "#e995a7");
    drawCircle(x + 8, world.floor - 38, 12, "#f1b0bd");
    drawCircle(x, world.floor - 48 + Math.sin(frame / 20) * 2, 7, `rgba(255,247,215,${glow})`);
  } else if (creature.source === "branch") {
    drawRect(x - 42, y + 20, 84, 6, "#8a5b39");
    drawRect(x - 6, y - 10, 40, 5, "#8a5b39");
    drawCircle(x + 12, y - 22 + Math.sin(frame / 18) * 2, 15, `rgba(241,197,80,${glow})`);
    drawCircle(x + 12, y - 22 + Math.sin(frame / 18) * 2, 6, "#fff7d7");
  } else if (creature.source === "river") {
    drawRect(x - 42, y - 10, 92, 28, "rgba(47,143,216,0.52)");
    drawRect(x - 28 + (frame % 24), y - 2, 34, 4, `rgba(255,247,215,${glow})`);
  } else if (creature.source === "flower") {
    for (let i = 0; i < 5; i += 1) {
      const fx = x - 48 + i * 24;
      drawRect(fx, world.floor - 18, 4, 22, "#7aa35e");
      drawCircle(fx + 2, world.floor - 22 + Math.sin(frame / 24 + i) * 2, 8, i % 2 ? "#e995a7" : "#f1c550");
    }
  } else if (creature.source === "ground") {
    drawCircle(x - 26, world.floor - 8, 7, "#d8b16a");
    drawCircle(x, world.floor - 14, 9, "#f1c550");
    drawCircle(x + 28, world.floor - 7, 6, "#d8b16a");
  } else {
    drawCircle(x, y - 12 + Math.sin(frame / 18) * 2, 20, `rgba(241,197,80,${glow})`);
    drawText(creature.hanzi, x, y - 6, 18, "#172033");
  }
}

function drawCreature(creature, x, y) {
  const walk = Math.sin(frame / 24 + x) * 3;
  if (creature.id === "horse") {
    const footY = y;
    const topY = footY - 48;
    drawEllipse(x + 6, footY + 1, 40, 7, "rgba(23,27,43,0.16)");
    drawRect(x - 24, topY + 8, 52, 24, "#b8774d");
    drawRect(x + 18, topY - 7, 24, 24, "#c98f52");
    drawRect(x + 34, topY - 14, 10, 9, "#543b36");
    drawRect(x - 28, topY + 14, 10, 10, "#543b36");
    drawRect(x - 14, footY - 22, 6, 22 + walk, "#543b36");
    drawRect(x + 12, footY - 22, 6, 22 - walk, "#543b36");
    drawRect(x + 32, footY - 24, 6, 24 + walk, "#543b36");
    drawRect(x - 16, footY - 1, 10, 5, "#2f2430");
    drawRect(x + 10, footY - 1, 10, 5, "#2f2430");
    drawRect(x + 30, footY - 1, 10, 5, "#2f2430");
    drawRect(x + 28, topY + 1, 4, 4, "#171b2b");
  } else if (creature.id === "cat") {
    const footY = y;
    const topY = footY - 38;
    drawEllipse(x + 6, footY + 1, 25, 5, "rgba(23,27,43,0.14)");
    drawRect(x - 12, topY + 10, 34, 18, "#f1c550");
    drawRect(x - 8, topY + 2, 12, 10, "#f1c550");
    drawRect(x + 10, topY + 2, 12, 10, "#f1c550");
    drawRect(x - 4, topY + 10, 5, 5, "#171b2b");
    drawRect(x + 12, topY + 10, 5, 5, "#171b2b");
    drawRect(x + 22, topY + 12, 22, 5, "#f1c550");
    drawRect(x - 4, footY - 12, 5, 12 + walk / 2, "#9f6d35");
    drawRect(x + 14, footY - 12, 5, 12 - walk / 2, "#9f6d35");
    drawRect(x - 6, footY - 1, 9, 4, "#9f6d35");
    drawRect(x + 12, footY - 1, 9, 4, "#9f6d35");
  } else if (creature.id === "fish") {
    drawRect(x - 22, y - 9, 36, 18, "#2f8fd8");
    drawRect(x + 12, y - 5, 16, 10, "#f1c550");
    drawRect(x - 28, y - 4, 10, 8, "#1f5f9a");
    drawRect(x - 9, y - 3, 4, 4, "#fff7d7");
  } else if (creature.id === "bird") {
    drawRect(x, y, 24, 16, "#58c475");
    drawRect(x - 18, y + 5 + Math.sin(frame / 6) * 4, 22, 5, "#73d48a");
    drawRect(x + 22, y + 5 - Math.sin(frame / 6) * 4, 22, 5, "#73d48a");
    drawRect(x + 22, y + 4, 8, 5, "#f1c550");
    drawRect(x + 7, y + 4, 4, 4, "#171b2b");
  } else if (creature.id === "flower") {
    for (let i = 0; i < 8; i += 1) {
      const fx = x - 90 + i * 28;
      drawRect(fx, y + 10, 4, 26, "#b89460");
      drawOutlinedRect(fx - 8, y + 2 + Math.sin(frame / 24 + i) * 2, 20, 16, i % 2 ? "#e995a7" : "#f1c550");
    }
  } else if (creature.id === "livingGround") {
    for (let i = 0; i < 7; i += 1) {
      const gx = x - 84 + i * 28;
      drawRect(gx, y + 20 + Math.sin(frame / 20 + i) * 2, 18, 5, "#d8b16a");
      drawRect(gx + 6, y + 11, 5, 14, "#b89460");
    }
  }
}

function drawLifeBurst() {
  if (!world.lifeBurst || world.lifeBurst.timer <= 0) return;
  const burst = world.lifeBurst;
  const progress = 1 - burst.timer / 150;
  const radius = 18 + progress * 54;
  ctx.strokeStyle = `rgba(255,247,215,${1 - progress})`;
  ctx.lineWidth = 4;
  ctx.strokeRect(Math.round(burst.x - world.cameraX - radius / 2), Math.round(burst.y - radius / 2), radius, radius);
  for (let i = 0; i < 8; i += 1) {
    const dx = Math.cos(i * Math.PI / 4) * radius;
    const dy = Math.sin(i * Math.PI / 4) * radius * 0.55;
    drawRect(burst.x + dx, burst.y + dy, 8, 8, "#fff7d7");
  }
}

function drawNpc(npc) {
  const pose = npcPose(npc);
  const style = npc.sprite || { skin: "#f1c0a0", hair: "#263047", coat: npc.color, trim: "#fff7d7", pants: "#263047", prop: "none" };
  const blink = Math.floor((frame + npc.id.length * 13) / 95) % 8 === 0;
  const breathe = Math.sin(frame / 22 + npc.id.length) * 2;
  const walk = pose.walking ? Math.sin(frame / 6 + npc.id.length) * 4 : 0;
  const talk = world.activeDialogue?.id === npc.id ? Math.sin(frame / 5) * 2 : 0;
  const x = pose.x;
  const y = pose.y + breathe;

  drawRect(x - 4, y + 58, 50, 10, "rgba(23,27,43,0.24)");
  drawRect(x + 5, y + 42, 8, 18 + walk, style.pants);
  drawRect(x + 27, y + 42, 8, 18 - walk, style.pants);
  drawOutlinedRect(x + 2, y - 28, 34, 34, style.skin);
  drawRect(x, y - 34, 38, 16, style.hair);
  drawRect(x - 2, y - 20, 10, 24, style.hair);
  if (npc.id === "mei" || npc.id === "linPo") drawRect(x + 28, y - 18, 10, 24, style.hair);
  drawOutlinedRect(x - 3, y + 4, 44, 42, style.coat);
  drawRect(x + 3, y + 8, 10, 36, style.trim);
  drawRect(x + 21, y + 8, 5, 34, style.trim);
  drawRect(x + 10, y - 10, blink ? 9 : 5, blink ? 2 : 5, "#171b2b");
  drawRect(x + 25, y - 10, blink ? 9 : 5, blink ? 2 : 5, "#171b2b");
  drawRect(x + 17, y + 1 + talk, 10, 3, "#7b5238");
  drawNpcProp(npc, x, y, style, pose.activity);
  drawText(npc.glyph, x + 19, y + 33, 14, "#fff7d7");
}

function npcPose(npc) {
  const schedule = npc.schedule || [{ start: 0, end: 1, x: npc.x, y: npc.y, activity: npc.activity || "idle" }];
  const slot = schedule[0];
  const x = slot.x;
  const y = slot.y;
  npc._pose = { x, y };
  return { x, y, activity: slot.activity || npc.activity || "idle", walking: false };
}

function drawNpcProp(npc, x, y, style, activity) {
  if (activity === "fish") {
    drawRect(x + 38, y - 12, 4, 72, "#7b5238");
    ctx.strokeStyle = "#171b2b";
    ctx.beginPath();
    ctx.moveTo(x + 42 - world.cameraX, y - 10);
    ctx.lineTo(x + 72 - world.cameraX, y + 20);
    ctx.stroke();
  } else if (activity === "cook") {
    drawOutlinedRect(x + 34, y + 20, 24, 18, "#543b36");
    drawRect(x + 40, y + 8, 5, 28, "#8d99ae");
  } else if (activity === "sweep") {
    drawRect(x + 38, y - 2, 5, 66, "#8a5b39");
    drawRect(x + 30, y + 54, 28, 8, "#d8b16a");
  } else if (activity === "read") {
    drawOutlinedRect(x + 29, y + 16, 28, 20, "#fff7d7");
  } else if (activity === "guard" || activity === "patrol") {
    drawRect(x + 38, y - 26, 5, 90, "#8d99ae");
    drawRect(x + 32, y - 30, 18, 10, "#f1c550");
  } else if (activity === "kite") {
    drawRect(x + 38, y - 16, 3, 50, "#fff7d7");
    drawOutlinedRect(x + 48, y - 44, 28, 24, "#58c475");
  } else if (activity === "carryBox") {
    drawOutlinedRect(x + 31, y + 18, 28, 24, "#b8774d");
  } else if (activity === "tea" || activity === "eat") {
    drawOutlinedRect(x + 35, y + 22, 14, 12, "#fff7d7");
  } else if (activity === "watchBell" || activity === "watchSunset" || activity === "watchRiver") {
    drawRect(x + 38, y + 2, 12, 5, style.skin);
  }
}

function drawInteractable(item) {
  if (item.festivalOnly && !isFestivalActive()) return;
  if (["pinyinGate", "voiceBell", "silentShadowGate", "cloudSeal", "lakeHome"].includes(item.id)) return;
  const bob = item.action === "incident" && world.chapter.bossUnlocked ? Math.sin(frame / 8) * 6 : 0;
  drawOutlinedRect(item.x, item.y - 24 + bob, 44, 48, item.color);
  drawText(item.glyph, item.x + 22, item.y + 8 + bob, 21, "#fff7d7");
}

function drawPickup(item) {
  if (item.collected) return;
  const bob = Math.sin(Date.now() / 260) * 5;
  drawRect(item.x, item.y + bob, 42, 42, "#fff7d7");
  ctx.strokeStyle = "#171b2b";
  ctx.lineWidth = 4;
  ctx.strokeRect(Math.round(item.x - world.cameraX), Math.round(item.y + bob), 42, 42);
  drawText(item.hint, item.x + 21, item.y + 30 + bob, 26, "#172033");
}

function drawEnemy(enemy) {
  if (enemy.hidden || enemy.defeated) return;
  const pulse = Math.sin(frame / 12) * 4;
  const x = enemy.x;
  const y = enemy.y + pulse;
  const body = enemy.id === "muddyMemory" ? "#405c86" : "#7756d8";
  const belly = enemy.id === "muddyMemory" ? "#8fd8ff" : "#fff7d7";
  const flash = enemy.hitFlash > 0 && enemy.hitFlash % 4 < 2;
  const width = enemy.boss ? 86 : 62;
  const height = enemy.boss ? 88 : 66;
  drawRect(x - 4, y + height - 12, width + 8, 12, "rgba(23,27,43,0.24)");
  drawOutlinedRect(x + 8, y - 34, width - 16, 24, flash ? "#fff7d7" : body);
  drawRect(x + 12, y - 46, 12, 18, body);
  drawRect(x + width - 24, y - 46, 12, 18, body);
  drawOutlinedRect(x, y - 14, width, height, flash ? "#fff7d7" : body);
  drawOutlinedRect(x + 13, y + 10, width - 26, 32, belly);
  drawRect(x + 16, y + 4, 9, 9, "#171b2b");
  drawRect(x + width - 25, y + 4, 9, 9, "#171b2b");
  drawRect(x + width / 2 - 12, y + 22, 24, 5, "#171b2b");
  drawText(enemy.glyph, x + width / 2, y + 34, enemy.boss ? 30 : 23, "#172033");
  const hpWidth = width;
  drawRect(x, y - 62, hpWidth, 10, "#171b2b");
  drawRect(x + 3, y - 59, Math.max(0, (hpWidth - 6) * (enemy.hp / enemy.maxHp)), 4, "#ef5a5a");
}

function isPlayerSwimming() {
  return Boolean(
    world.chapter.stageOneCleared &&
    !player.cloudRiding &&
    player.x + player.w > PINYIN_STREAM.start + 18 &&
    player.x < PINYIN_STREAM.end - 18
  );
}

function playerVisualY() {
  if (isPlayerSwimming()) return PINYIN_STREAM.surfaceY - 38 + Math.sin(frame / 16) * 3;
  return player.cloudRiding ? 286 + Math.sin(frame / 18) * 5 : player.y;
}

function drawCloudMount(x, y) {
  drawEllipse(x, y + 18, 48, 8, "rgba(23,27,43,0.18)");
  drawCircle(x - 32, y, 18, "#fffdf0");
  drawCircle(x - 12, y - 11, 24, "#fff7d7");
  drawCircle(x + 14, y - 8, 22, "#f8f3df");
  drawCircle(x + 36, y + 2, 16, "#fffdf0");
  drawRect(x - 35, y - 2, 74, 20, "#fffdf0");
  drawRect(x - 18, y + 11, 44, 5, "#d7edf6");
  drawText("云", x + 2, y + 12, 16, "#5f8f74");
}

function drawFishingPlayer() {
  const x = FISHING_SPOT.x - 42;
  const y = 350;
  const bob = Math.sin(frame / 18) * 2;
  drawRect(x + 6, y + 46, 38, 8, "rgba(23,27,43,0.18)");
  drawRect(x + 8, y + 32, 28, 18, "#3b2a24");
  drawOutlinedRect(x + 4, y - 22 + bob, 28, 30, "#f1c0a0");
  drawRect(x + 8, y - 28 + bob, 20, 8, "#2c3142");
  drawOutlinedRect(x - 2, y + 6, 42, 34, "#c85f32");
  drawRect(x + 2, y + 10, 13, 30, "#f1c550");
  drawRect(x + 34, y + 20, 9, 7, "#f1c0a0");
  ctx.strokeStyle = "#5f3d2b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 40 - world.cameraX, y + 22);
  ctx.lineTo(FISHING_SPOT.x + 70 - world.cameraX, CLOUD_LAKE.surfaceY - 70);
  ctx.lineTo(FISHING_SPOT.x + 96 - world.cameraX, CLOUD_LAKE.surfaceY + 42 + Math.sin(frame / 12) * 5);
  ctx.stroke();
  drawCircle(FISHING_SPOT.x + 96, CLOUD_LAKE.surfaceY + 42 + Math.sin(frame / 12) * 5, 4, "#f1c550");
  if (world.fishing?.state === "waiting") {
    const dots = ".".repeat(1 + Math.floor(frame / 28) % 3);
    drawText(`Fishing${dots}`, FISHING_SPOT.x + 24, 306, 15, "#172033");
  }
}

function drawLakeCreatureIcon(catchItem, x, y, scale = 1) {
  const s = scale;
  if (catchItem.id === "worm") {
    drawRect(x - 16 * s, y, 12 * s, 8 * s, "#c98a68");
    drawRect(x - 4 * s, y - 4 * s, 12 * s, 8 * s, "#d6a27f");
    drawRect(x + 8 * s, y, 12 * s, 8 * s, "#c98a68");
    drawRect(x + 18 * s, y - 2 * s, 4 * s, 4 * s, "#171b2b");
  } else if (catchItem.id === "waterGrass") {
    for (let i = 0; i < 5; i += 1) {
      const gx = x - 18 * s + i * 9 * s;
      drawRect(gx, y - (18 + (i % 2) * 8) * s, 5 * s, (22 + (i % 2) * 8) * s, i % 2 ? "#4fa96a" : "#5f8f74");
      drawRect(gx + 3 * s, y - (24 + (i % 2) * 7) * s, 5 * s, 8 * s, "#8ebf79");
    }
  } else if (catchItem.id === "fish") {
    drawRect(x - 24 * s, y - 10 * s, 38 * s, 20 * s, "#2f8fd8");
    drawRect(x + 12 * s, y - 6 * s, 18 * s, 12 * s, "#f1c550");
    drawRect(x - 32 * s, y - 5 * s, 12 * s, 10 * s, "#1f5f9a");
    drawRect(x - 10 * s, y - 4 * s, 5 * s, 5 * s, "#fff7d7");
  } else if (catchItem.id === "shrimp") {
    drawRect(x - 20 * s, y - 7 * s, 34 * s, 14 * s, "#e995a7");
    drawRect(x + 12 * s, y - 4 * s, 12 * s, 8 * s, "#f1b0bd");
    drawRect(x - 26 * s, y - 3 * s, 8 * s, 6 * s, "#b85f42");
    drawRect(x + 23 * s, y - 9 * s, 4 * s, 4 * s, "#171b2b");
    drawRect(x + 28 * s, y - 12 * s, 4 * s, 18 * s, "#e995a7");
  } else if (catchItem.id === "crab") {
    drawRect(x - 18 * s, y - 10 * s, 36 * s, 22 * s, "#d77955");
    drawRect(x - 34 * s, y - 14 * s, 14 * s, 12 * s, "#b85f42");
    drawRect(x + 20 * s, y - 14 * s, 14 * s, 12 * s, "#b85f42");
    drawRect(x - 8 * s, y - 4 * s, 5 * s, 5 * s, "#171b2b");
    drawRect(x + 6 * s, y - 4 * s, 5 * s, 5 * s, "#171b2b");
    drawRect(x - 18 * s, y + 12 * s, 8 * s, 6 * s, "#9f4f3a");
    drawRect(x + 10 * s, y + 12 * s, 8 * s, 6 * s, "#9f4f3a");
  }
}

function drawFishingCatchCard() {
  const caught = world.fishing?.catch;
  if (!caught) return;
  const x = player.x + 18;
  const y = 194 + Math.sin(frame / 18) * 4;
  const glyphSize = caught.glyph.length > 1 ? 24 : 30;
  drawRect(x - 88, y - 70, 176, 128, "rgba(255,247,215,0.95)");
  ctx.strokeStyle = "#171b2b";
  ctx.lineWidth = 4;
  ctx.strokeRect(Math.round(x - 88 - world.cameraX), Math.round(y - 70), 176, 128);
  drawLakeCreatureIcon(caught, x, y - 34, 1.05);
  drawText(caught.glyph, x, y + 12, glyphSize, "#172033");
  drawText(caught.pinyin, x, y + 34, 15, "#5f3d2b");
  drawText(caught.english, x, y + 52, 12, "#6a4b2b");
}

function drawInteriorPlayer() {
  const x = world.interior.playerX;
  const y = world.interior.playerY;
  const step = player.moving ? Math.sin(frame / 5) * 4 : 0;
  drawScreenRect(x - 14, y + 14, 8, 18 + step, "#3b2a24");
  drawScreenRect(x + 6, y + 14, 8, 18 - step, "#3b2a24");
  drawScreenRect(x - 16, y - 32, 32, 32, "#171b2b");
  drawScreenRect(x - 12, y - 28, 24, 26, "#f1c0a0");
  drawScreenRect(x - 18, y - 2, 36, 42, "#c85f32");
  drawScreenRect(x - 11, y, 11, 38, "#f1c550");
  drawScreenRect(x - 8, y - 18, 5, 5, "#171b2b");
  drawScreenRect(x + 5, y - 18, 5, 5, "#171b2b");
  drawScreenText("武", x, y + 31, 14, "#fff7d7");
}

function drawInteriorMomo() {
  if (!world.chapter.companionJoined) return;
  const style = momoColors[player.momoColor] || momoColors.black;
  const x = world.interior.playerX - 44;
  const y = world.interior.playerY + 16 + Math.sin(frame / 18) * 4;
  drawScreenRect(x - 4, y + 28, 40, 7, "rgba(23,27,43,0.18)");
  drawScreenRect(x, y, 34, 30, "#171b2b");
  drawScreenRect(x + 4, y + 4, 26, 22, style.body);
  drawScreenRect(x + 7, y + 8, 6, 6, style.eye);
  drawScreenRect(x + 21, y + 8, 6, 6, style.eye);
  drawScreenRect(x + 12, y + 18, 10, 3, style.eye);
  drawScreenText("墨", x + 17, y + 50, 14, style.glyph);
}

function drawPixelSofa(x, y) {
  drawScreenRect(x + 14, y + 86, 178, 12, "rgba(23,27,43,0.16)");
  drawScreenRect(x + 22, y + 16, 154, 22, "#4f5366");
  drawScreenRect(x + 14, y + 28, 170, 34, "#6b758c");
  drawScreenRect(x + 28, y + 36, 142, 18, "#8ea0b8");
  drawScreenRect(x, y + 44, 32, 42, "#596579");
  drawScreenRect(x + 166, y + 44, 32, 42, "#596579");
  drawScreenRect(x + 26, y + 58, 146, 36, "#8194ad");
  drawScreenRect(x + 32, y + 64, 62, 22, "#d8eef5");
  drawScreenRect(x + 104, y + 64, 62, 22, "#d8eef5");
  drawScreenRect(x + 96, y + 60, 4, 30, "#5d6172");
  drawScreenRect(x + 34, y + 86, 130, 5, "#5d6172");
  drawScreenRect(x + 18, y + 88, 14, 8, "#3f4354");
  drawScreenRect(x + 166, y + 88, 14, 8, "#3f4354");
  drawScreenRect(x + 38, y + 42, 112, 4, "rgba(255,255,255,0.28)");
}

function drawPixelDesk(x, y) {
  drawScreenRect(x + 12, y + 70, 158, 10, "rgba(23,27,43,0.14)");
  drawScreenRect(x + 6, y + 18, 170, 40, "#6a4b2b");
  drawScreenRect(x + 18, y + 8, 146, 24, "#b8774d");
  drawScreenRect(x + 24, y + 14, 132, 8, "#d8b16a");
  drawScreenRect(x + 34, y + 26, 54, 10, "#fff7d7");
  drawScreenRect(x + 104, y + 26, 42, 10, "#fff7d7");
  drawScreenRect(x + 92, y + 10, 28, 14, "#8d99ae");
  drawScreenRect(x + 96, y + 2, 20, 10, "#b8e5ff");
  drawScreenRect(x + 22, y + 58, 12, 26, "#5f3d2b");
  drawScreenRect(x + 146, y + 58, 12, 26, "#5f3d2b");
  drawScreenRect(x + 76, y + 58, 30, 18, "#8a5b39");
  drawScreenRect(x + 84, y + 62, 14, 4, "#d8b16a");
}

function drawPixelCabinet(x, y) {
  drawScreenRect(x + 8, y + 58, 122, 10, "rgba(23,27,43,0.14)");
  drawScreenRect(x, y + 8, 138, 56, "#7b5238");
  drawScreenRect(x + 8, y, 122, 16, "#b89460");
  drawScreenRect(x + 10, y + 18, 34, 34, "#caa574");
  drawScreenRect(x + 52, y + 18, 34, 34, "#caa574");
  drawScreenRect(x + 94, y + 18, 32, 34, "#caa574");
  drawScreenRect(x + 22, y + 32, 6, 6, "#5f3d2b");
  drawScreenRect(x + 64, y + 32, 6, 6, "#5f3d2b");
  drawScreenRect(x + 106, y + 32, 6, 6, "#5f3d2b");
  drawScreenRect(x + 12, y + 4, 104, 4, "rgba(255,247,215,0.28)");
}

function drawPixelWaterBowl(x, y) {
  drawScreenRect(x + 4, y + 52, 94, 8, "rgba(23,27,43,0.16)");
  drawScreenRect(x + 4, y + 20, 96, 34, "#7b8896");
  drawScreenRect(x + 12, y + 12, 80, 18, "#a9b7c0");
  drawScreenRect(x + 18, y + 18, 68, 26, "#b8e5ff");
  drawScreenRect(x + 24, y + 22, 18, 5, "#fff7d7");
  drawScreenCircle(x + 36 + Math.sin(frame / 12) * 8, y + 32, 4, "#2f8fd8");
  drawScreenCircle(x + 64 + Math.cos(frame / 16) * 6, y + 34, 3, "#75a8bf");
}

function drawPixelRug(x, y, color) {
  drawScreenRect(x, y, 96, 58, "rgba(23,27,43,0.08)");
  drawScreenRect(x + 6, y + 4, 84, 50, color);
  drawScreenRect(x + 12, y + 10, 72, 38, "rgba(255,247,215,0.18)");
  drawScreenRect(x + 18, y + 16, 60, 4, "rgba(95,61,43,0.16)");
  drawScreenRect(x + 18, y + 38, 60, 4, "rgba(95,61,43,0.16)");
}

function drawLakeHomeInterior() {
  const doorOpen = homeDoorOpenRatio("interior");
  drawScreenRect(0, 0, canvas.width, canvas.height, "#1b2534");
  drawScreenRect(64, 52, 832, 448, "#eef2eb");
  drawScreenRect(64, 52, 832, 58, "#cfd6d5");
  drawScreenRect(64, 110, 832, 14, "#8d99ae");
  drawScreenRect(64, 484, 832, 16, "#171b2b");
  drawScreenRect(64, 52, 16, 448, "#171b2b");
  drawScreenRect(880, 52, 16, 448, "#171b2b");

  for (let x = 80; x < 880; x += 48) {
    for (let y = 122; y < 484; y += 48) {
      drawScreenRect(x, y, 46, 46, "#dce6e2");
      drawScreenRect(x, y, 46, 2, "#f8fbf7");
      drawScreenRect(x, y + 44, 46, 2, "#c2cdcf");
    }
  }

  drawScreenText("家", 480, 88, 24, "#172033");

  drawScreenRect(430, 452, 100, 32, "#1b2534");
  drawScreenRect(448, 444, 64, 40, "#75a8bf");
  drawScreenRect(448 - doorOpen * 34, 444, Math.max(14, 64 - doorOpen * 38), 40, "#5f3d2b");
  drawScreenRect(500 - doorOpen * 18, 462, 5, 5, "#d8b16a");
  drawScreenRect(470, 462, 20, 4, "#d8b16a");

  drawPixelRug(332, 166, "#d8b16a");
  drawPixelRug(538, 166, "#caa574");
  drawPixelSofa(104, 298);
  drawPixelDesk(652, 306);
  drawPixelCabinet(112, 132);
  drawPixelWaterBowl(408, 260);

  drawInteriorMomo();
  drawInteriorPlayer();
}

function isFishingPoseActive() {
  return Boolean(world.fishing || isNearFishingSpot() && world.chapter.lake?.unlocked && Math.abs(player.x - FISHING_SPOT.x) < 34);
}

function drawSwimmingPlayer() {
  const x = player.x;
  const surfaceY = PINYIN_STREAM.surfaceY + Math.sin(frame / 16) * 2;
  const stroke = player.moving ? Math.sin(frame / 5) * 7 : Math.sin(frame / 18) * 2;

  drawEllipse(x + 18, surfaceY + 7, 52, 8, "rgba(23,27,43,0.15)");
  drawRect(x - 20, surfaceY + 5, 76, 8, "rgba(47,143,216,0.46)");
  drawOutlinedRect(x + 4, surfaceY - 54, 28, 32, "#f1c0a0");
  drawRect(x + 8, surfaceY - 60, 20, 8, "#2c3142");
  drawOutlinedRect(x - 4, surfaceY - 24, 44, 32, "#c85f32");
  drawRect(x + 3, surfaceY - 22, 14, 28, "#f1c550");
  drawRect(x - 16, surfaceY - 10 + stroke / 2, 24, 6, "#f1c0a0");
  drawRect(x + 30, surfaceY - 10 - stroke / 2, 24, 6, "#f1c0a0");
  drawRect(x + 10, surfaceY - 38, 5, 5, "#171b2b");
  drawRect(x + 24, surfaceY - 38, 5, 5, "#171b2b");
  drawText("武", x + 18, surfaceY - 1, 15, "#fff7d7");

  drawRect(x - 26, surfaceY - 4, 88, 18, "rgba(47,143,216,0.78)");
  drawRect(x - 18 + (frame % 18), surfaceY + 1, 24, 4, "rgba(255,247,215,0.7)");
  drawRect(x + 18 - (frame % 14), surfaceY + 8, 20, 4, "rgba(255,247,215,0.52)");
  if (player.moving) {
    drawCircle(x - 26, surfaceY - 3 + Math.sin(frame / 4) * 2, 4, "rgba(255,247,215,0.72)");
    drawCircle(x + 58, surfaceY - 1 + Math.cos(frame / 4) * 2, 3, "rgba(255,247,215,0.62)");
  }
}

function drawPlayer() {
  if (world.fishing) {
    drawFishingPlayer();
    return;
  }
  if (isPlayerSwimming()) {
    drawSwimmingPlayer();
    return;
  }
  const x = player.x;
  const y = playerVisualY();
  const step = player.moving ? Math.sin(frame / 5) * 5 : Math.sin(frame / 28) * 2;
  if (player.cloudRiding) drawCloudMount(x + 18, y + 74);
  drawRect(x + 8, y + 44, 8, 18 + step, "#3b2a24");
  drawRect(x + 24, y + 44, 8, 18 - step, "#3b2a24");
  drawOutlinedRect(x + 4, y - 24, 28, 32, "#f1c0a0");
  drawRect(x + 8, y - 30, 20, 8, "#2c3142");
  drawOutlinedRect(x - 4, y + 6, 44, 42, "#c85f32");
  drawRect(x + 3, y + 8, 14, 40, "#f1c550");
  drawRect(x + (player.facing > 0 ? 36 : -10), y - 18, 6, 80, "#7b5238");
  drawRect(x + (player.facing > 0 ? 28 : -8), y + 16, 12, 24, "#f1c0a0");
  drawRect(x + 14, y + 18, 4, 4, "#f8f3df");
  drawRect(x + 20, y + 23, 4, 4, "#f8f3df");
  drawRect(x + 26, y + 28, 4, 4, "#f8f3df");
  drawRect(x + 10, y - 8, 5, 5, "#171b2b");
  drawRect(x + 24, y - 8, 5, 5, "#171b2b");
  drawText("武", x + 18, y + 38, 16, "#fff7d7");
}

function drawCompanion() {
  if (!world.chapter.companionJoined) return;
  const style = momoColors[player.momoColor] || momoColors.black;
  const cheer = world.momoCheer > 0 ? Math.sin(world.momoCheer / 3) * 12 - 10 : 0;
  const bob = Math.sin(frame / 18) * 8 + cheer;
  const x = player.x - player.facing * 42;
  const y = playerVisualY() - 18 + bob;
  drawRect(x - 4, y + 27, 40, 7, "rgba(23,27,43,0.18)");
  drawOutlinedRect(x, y, 34, 30, style.body);
  drawRect(x + 4, y + 21, 26, 5, style.shadow);
  drawRect(x + 7, y + 8, 6, 6, style.eye);
  drawRect(x + 21, y + 8, 6, 6, style.eye);
  drawRect(x + 12, y + 18, 10, 3, style.eye);
  ctx.strokeStyle = "rgba(255,247,215,0.55)";
  ctx.lineWidth = 2;
  ctx.strokeRect(Math.round(x + 3 - world.cameraX), Math.round(y + 3), 28, 24);
  drawText("墨", x + 17, y + 50, 15, style.glyph);
}

function drawWeather() {
  ctx.strokeStyle = "rgba(255,255,255,0.42)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 46; i += 1) {
    const x = (i * 83 + frame * 5) % canvas.width;
    const y = (i * 47 + frame * 8) % canvas.height;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 10, y + 18);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(241,197,80,0.64)";
  for (let i = 0; i < 12; i += 1) {
    const x = (i * 157 - world.cameraX * 0.2) % canvas.width;
    const y = 130 + Math.sin(frame / 22 + i) * 42;
    ctx.fillRect(x, y, 4, 4);
  }
}

function drawInteractionHint() {
  if (world.activeDialogue || world.battle || world.challenge) return;
  if (world.interior) {
    const p = { x: world.interior.playerX, y: world.interior.playerY };
    const nearDoor = p.y > 428 && p.x > 412 && p.x < 548;
    const nearSpot = [
      { x: 172, y: 334, r: 84 },
      { x: 734, y: 330, r: 92 },
      { x: 456, y: 286, r: 72 }
    ].some((spot) => Math.hypot(p.x - spot.x, p.y - spot.y) < spot.r);
    if (nearDoor || nearSpot) drawScreenText("!", world.interior.playerX, world.interior.playerY - 54, 26, "#f1c550");
    return;
  }
  const box = { x: player.x, y: player.y, w: player.w, h: player.h };
  const nearNpc = visibleNpcs().some((npc) => {
    const pos = npc._pose || npc;
    return rectsTouch(box, { x: pos.x, y: pos.y, w: 42, h: 68 }, 38);
  });
  const visibleVillagers = isFestivalActive() ? villagers : [];
  const nearVillager = visibleVillagers.some((npc) => {
    const pos = npc._pose || npc;
    return rectsTouch(box, { x: pos.x, y: pos.y, w: 42, h: 68 }, 38);
  });
  const nearObject = visibleInteractables().some((item) => rectsTouch(box, { x: item.x, y: item.y, w: 54, h: 58 }, 42));
  const nearFishing = isNearFishingSpot() && !world.fishing;
  const nearEnemy = enemies.some((enemy) => !enemy.hidden && !enemy.defeated && rectsTouch(box, { x: enemy.x, y: enemy.y, w: 54, h: 62 }, 44));
  if (nearNpc || nearVillager || nearObject || nearEnemy || nearFishing) {
    drawText("!", player.x + 18, playerVisualY() - 42, 26, "#f1c550");
  }
}

function drawTransitionOverlay() {
  if (!world.transition) return;
  const half = world.transition.duration / 2;
  const progress = world.transition.timer <= half
    ? world.transition.timer / half
    : 1 - (world.transition.timer - half) / half;
  ctx.fillStyle = `rgba(0,0,0,${clamp(progress, 0, 1)})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (progress > 0.72) {
    ctx.fillStyle = "#fff7d7";
    ctx.font = "18px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(getTransitionMessage(), canvas.width / 2, canvas.height / 2 + 6);
  }
}

function draw() {
  ctx.save();
  if (world.shake > 0) {
    ctx.translate((Math.random() - 0.5) * world.shake, (Math.random() - 0.5) * world.shake);
  }
  if (world.interior?.id === "lakeHome") {
    drawLakeHomeInterior();
    drawInteractionHint();
    ctx.restore();
    drawTransitionOverlay();
    return;
  }
  drawBackground();
  drawBuildings();
  visibleInteractables().forEach(drawInteractable);
  pickups.forEach(drawPickup);
  if (isFestivalActive()) villagers.forEach(drawNpc);
  visibleNpcs().forEach(drawNpc);
  enemies.forEach(drawEnemy);
drawCompanion();
  drawPlayer();
  drawFishingCatchCard();
  drawInteractionHint();
  drawWeather();
  ctx.restore();
  drawTransitionOverlay();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

document.addEventListener("keydown", (event) => {
  if (world.menuOpen) return;
  startMusic();
  if (event.key.toLowerCase() === "j" && !event.repeat) {
    event.preventDefault();
    handleCloudRideKey();
  }
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "d", "w", "s"].includes(event.key)) keys.add(event.key);
  if (event.key === " " && !event.repeat && !world.activeDialogue && !world.transition && !world.fishing && isNearFishingSpot()) {
    event.preventDefault();
    startFishing();
    return;
  }
  if ([" ", "Enter", "e"].includes(event.key)) {
    event.preventDefault();
    interact();
  }
});

document.addEventListener("keyup", (event) => {
  keys.delete(event.key);
});

els.dialogueNext.addEventListener("click", interact);
els.chromeToggle.addEventListener("click", toggleCleanUi);
document.getElementById("questButton").addEventListener("click", () => {
  els.questPanel.hidden = !els.questPanel.hidden;
  els.bagPanel.hidden = true;
  els.mapPanel.hidden = true;
  closePinyinPanel();
  closeValleyShop();
});
document.getElementById("bagButton").addEventListener("click", () => {
  els.bagPanel.hidden = !els.bagPanel.hidden;
  els.questPanel.hidden = true;
  els.mapPanel.hidden = true;
  closePinyinPanel();
  closeValleyShop();
});
document.getElementById("mapButton").addEventListener("click", toggleMapPanel);
document.getElementById("closeMapPanel").addEventListener("click", () => {
  els.mapPanel.hidden = true;
});
document.getElementById("saveButton").addEventListener("click", saveGame);
document.getElementById("menuButton").addEventListener("click", returnToStartMenu);
document.getElementById("closePinyinPanel").addEventListener("click", closePinyinPanel);
els.musicButton.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleMusic();
});
els.momoColorOptions.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-color]");
  if (!button) return;
  chooseMomoColor(button.dataset.color);
});

canvas.addEventListener("click", () => {
  if (world.menuOpen) return;
  startMusic();
  interact();
});

els.startMenu.addEventListener("pointerdown", () => {
  if (!world.menuOpen) return;
  switchMusic("menu");
  startMusic();
});

document.getElementById("newGameButton").addEventListener("click", showNewSavePanel);
document.getElementById("loadGameButton").addEventListener("click", showLoadSavePanel);
document.getElementById("settingsButton").addEventListener("click", showSettingsPanel);
document.getElementById("cancelNewSave").addEventListener("click", showMainMenu);
document.getElementById("backToMainMenu").addEventListener("click", showMainMenu);
document.getElementById("backFromSettings").addEventListener("click", showMainMenu);
document.getElementById("menuMusicToggle").addEventListener("click", toggleMusic);
document.getElementById("newSaveFromList").addEventListener("click", showNewSavePanel);
document.getElementById("confirmNewSave").addEventListener("click", createNewSave);
els.saveNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") createNewSave();
});

renderPanels();
updateMusicButton();
showMainMenu();
loop();
