/**
 * Simulator only: builds a 12 word phrase for teaching.
 * Not a standards compliant BIP39 mnemonic (no checksum).
 */
const POOL = [
    "able", "acid", "agent", "aim", "anchor", "apple", "arrow", "atom", "audit", "axis",
    "badge", "balance", "basic", "beach", "bench", "blade", "blank", "block", "blue", "bolt",
    "brave", "brick", "brief", "bright", "bring", "bronze", "brush", "build", "butter", "cable",
    "calm", "canal", "canvas", "cargo", "carry", "catch", "cause", "chain", "chair", "chalk",
    "chaos", "charm", "chart", "check", "chest", "chief", "child", "chunk", "civil", "claim",
    "clap", "clay", "clean", "clear", "climb", "clock", "close", "cloud", "coach", "coast",
    "color", "comet", "coral", "craft", "crash", "cream", "creek", "crest", "crowd", "crown",
    "curve", "cycle", "daily", "dance", "data", "dawn", "debit", "delta", "depth", "digit",
    "disco", "dodge", "dolphin", "draft", "dream", "drift", "drill", "drive", "dune", "eagle",
    "earth", "eight", "elbow", "email", "empty", "entry", "equal", "error", "event", "extra",
    "fable", "fancy", "fault", "fiber", "field", "final", "flame", "flash", "float", "flora",
    "focus", "forge", "forum", "frame", "fresh", "front", "frost", "fully", "fuzzy", "galaxy",
    "gamma", "gauge", "ghost", "giant", "given", "glass", "globe", "grace", "grain", "graph",
    "grass", "great", "green", "group", "guard", "guide", "habit", "happy", "harbor", "haven",
    "heart", "heavy", "hello", "hobby", "horse", "hotel", "house", "human", "humor", "ideal",
    "image", "index", "inner", "input", "intro", "ivory", "jelly", "jewel", "joint", "judge",
    "juice", "jumbo", "kayak", "kiosk", "knife", "knock", "known", "label", "labor", "large",
    "laser", "later", "layer", "learn", "lemon", "level", "light", "limit", "linen", "liter",
    "local", "logic", "loose", "lover", "lucky", "lunar", "macro", "magic", "major", "maker",
    "maple", "march", "match", "maybe", "medal", "melon", "merit", "metal", "meter", "micro",
    "mimic", "minor", "model", "moist", "month", "motor", "mouse", "movie", "music", "naked",
    "naval", "needs", "nerve", "never", "night", "ninth", "noble", "noise", "north", "noted",
    "novel", "nurse", "ocean", "offer", "often", "olive", "omega", "onion", "opera", "orbit",
    "order", "organ", "other", "outer", "owner", "oxide", "ozone", "paint", "panel", "paper",
    "party", "patch", "pause", "peace", "peach", "pedal", "phase", "phone", "photo", "piano",
    "piece", "pilot", "pinch", "pitch", "pizza", "place", "plain", "plane", "plant", "plate",
    "plaza", "pluck", "point", "polar", "porch", "pouch", "power", "press", "price", "pride",
    "prime", "print", "prior", "prize", "probe", "proof", "proud", "pulse", "pupil", "quack",
    "quant", "queen", "quick", "quiet", "quota", "radar", "radio", "rainy", "ranch", "rapid",
    "ratio", "raven", "reach", "react", "ready", "realm", "rebel", "refer", "relax", "relay",
    "renew", "reply", "reset", "retro", "rider", "ridge", "right", "rigid", "risky", "river",
    "roast", "robot", "rocky", "rodeo", "rough", "round", "route", "royal", "rugby", "rural",
    "rusty", "sadly", "saint", "salad", "salon", "salsa", "sandy", "satin", "sauce", "scale",
    "scarf", "scene", "scent", "scout", "scrap", "scrub", "seeds", "sense", "serve", "seven",
    "shade", "shake", "shape", "share", "sharp", "sheep", "sheet", "shelf", "shell", "shift",
    "shine", "shirt", "shock", "shore", "short", "shout", "shown", "shrug", "sides", "sight",
    "sigma", "silky", "silly", "since", "sixth", "skate", "skill", "skirt", "skull", "slack",
    "slice", "slide", "slope", "small", "smart", "smile", "smoke", "snack", "snake", "snowy",
    "sober", "solar", "solid", "solve", "sonic", "sorry", "sound", "south", "space", "spark",
    "speak", "speed", "spell", "spend", "spice", "spike", "spine", "split", "spoon", "sport",
    "spray", "squad", "stack", "staff", "stage", "stain", "stair", "stake", "stall", "stamp",
    "stand", "stark", "start", "state", "steak", "steam", "steel", "stick", "still", "stock",
    "stone", "stool", "store", "storm", "story", "stove", "strap", "straw", "strip", "study",
    "stuff", "style", "sugar", "suite", "sunny", "super", "surge", "swamp", "swarm", "sweat",
    "sweet", "swift", "swing", "sword", "table", "taste", "teach", "tempo", "tenor", "thank",
    "theft", "theme", "there", "thick", "thing", "think", "third", "those", "three", "thumb",
    "tiger", "tight", "timer", "tired", "title", "toast", "today", "token", "tooth", "topic",
    "torch", "total", "touch", "tough", "towel", "tower", "toxic", "trace", "track", "trade",
    "trail", "train", "trait", "trash", "treat", "trend", "trial", "tribe", "trick", "tried",
    "troop", "truck", "truly", "trunk", "trust", "truth", "tulip", "tutor", "twice", "twist",
    "uncle", "under", "undue", "union", "unity", "until", "upper", "upset", "urban", "usage",
    "usual", "valid", "value", "vault", "venue", "video", "villa", "vinyl", "viola", "virus",
    "visit", "vital", "vivid", "vocal", "vodka", "voice", "voter", "wagon", "waist", "watch",
    "water", "weary", "weave", "wedge", "weird", "whale", "wheat", "wheel", "where", "which",
    "while", "white", "whole", "whose", "width", "windy", "witch", "woman", "world", "worry",
    "worth", "woven", "wrist", "write", "wrong", "yacht", "yearn", "young", "youth", "zebra",
];
function randIndex(max) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % max;
}
export function generateSimRecoveryPhrase() {
    const words = [];
    for (let i = 0; i < 12; i++) {
        words.push(POOL[randIndex(POOL.length)]);
    }
    return words.join(" ");
}
