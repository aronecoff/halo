// ═══════════════════════════════════════════════════════════
// HALO · Agent-Mediated Human Connection Protocol
// Data Layer · IRIS (Intelligent Relational Inference System)
// ═══════════════════════════════════════════════════════════

// === IRIS Identity ===
export const agentName = "IRIS";

// === Color Palette (from Design Spec) ===
export const palette = {
  void: "#07070D",
  deepSpace: "#0A0A14",
  obsidian: "#0F0F1A",
  charcoal: "#1A1A2E",
  iris: "#7C3AED",
  crown: "#6D28D9",
  orchid: "#8B5CF6",
  lavender: "#A78BFA",
  mist: "#C4B5FD",
  success: "#4ADE80",
  successDeep: "#16A34A",
  warning: "#FBBF24",
  alert: "#EF4444",
  infoBlue: "#3B82F6",
  matchPink: "#EC4899",
  textPrimary: "#F3F4F6",
  textBody: "#E0E0E0",
  textSecondary: "#D1D5DB",
  textMuted: "#9CA3AF",
  textDim: "#6B7280",
  textGhost: "#4B5563",
};

// ═══════════════════════════════════════════════════════════
// SEEDED RANDOM NUMBER GENERATOR
// Each user name produces a unique deterministic sequence
// so every person who opens the link gets different results
// ═══════════════════════════════════════════════════════════

function hashName(name: string): number {
  let hash = 5381;
  const n = name.toLowerCase().trim();
  for (let i = 0; i < n.length; i++) {
    hash = ((hash << 5) + hash) + n.charCodeAt(i);
    hash = hash & 0x7fffffff;
  }
  return hash || 1;
}

function createRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function pickSeeded<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ═══════════════════════════════════════════════════════════
// DATA POOLS (available for selection per user)
// ═══════════════════════════════════════════════════════════

const venuePool = [
  { name: "Saint Frank Coffee", area: "Russian Hill, SF", short: "Saint Frank" },
  { name: "Sightglass Coffee", area: "SoMa, SF", short: "Sightglass" },
  { name: "The Mill", area: "NoPa, SF", short: "The Mill" },
  { name: "Equator Coffees", area: "Fort Mason, SF", short: "Equator" },
  { name: "Andytown Coffee", area: "Outer Sunset, SF", short: "Andytown" },
  { name: "Hollow", area: "Inner Sunset, SF", short: "Hollow" },
];

const matchPool = [
  { name: "Jordan", contextLine: "Works in sustainable design" },
  { name: "Riley", contextLine: "Runs a small design studio" },
  { name: "Morgan", contextLine: "Writes for a tech publication" },
  { name: "Quinn", contextLine: "Product designer at a startup" },
  { name: "Avery", contextLine: "Teaches yoga and builds apps" },
];

const starterPool = [
  "Ask them what book changed how they see the world.",
  "Ask them about the last time they felt completely present.",
  "Ask them what they would build if money was not a factor.",
  "Ask them about the best conversation they have had this year.",
  "Ask them what they are most curious about right now.",
];

const timePool = ["10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "2:00 PM", "3:00 PM"];
const dayPool = ["Saturday", "Sunday"];

// ═══════════════════════════════════════════════════════════
// SESSION DATA (generated uniquely per user name)
// ═══════════════════════════════════════════════════════════

export interface SessionData {
  venue: { name: string; area: string; short: string };
  match: { name: string; contextLine: string };
  compatibility: number;
  time: string;
  day: string;
  starter: string;
  seed: number;
}

export function generateSession(userName: string): SessionData {
  const seed = hashName(userName);
  const rng = createRng(seed);
  return {
    venue: pickSeeded(venuePool, rng),
    match: pickSeeded(matchPool, rng),
    compatibility: 82 + Math.floor(rng() * 12),
    time: pickSeeded(timePool, rng),
    day: pickSeeded(dayPool, rng),
    starter: pickSeeded(starterPool, rng),
    seed,
  };
}

// ═══════════════════════════════════════════════════════════
// BUILDERS (create personalized data from session)
// ═══════════════════════════════════════════════════════════

export function buildMatchData(session: SessionData) {
  return {
    irisDescription: "I found someone worth meeting. You both value depth over surface conversation. You are both emotionally secure. You both recharge alone but push yourselves to connect. Your communication styles are almost identical. Direct, no games, say what you mean. I think this is worth your time.",
    compatibility: session.compatibility,
    sharedTraits: ["Deep curiosity", "Emotional security", "Direct communicator", "Active listener", "Values authenticity", "Physical compatibility"],
    matchName: session.match.name,
    matchPhoto: {
      url: "/photos/match.jpg",
      verified: true,
      verifiedAt: "Feb 2026",
      contextLine: session.match.contextLine,
    },
    venue: session.venue.name,
    venueShort: session.venue.short,
    area: session.venue.area,
    day: session.day,
    time: session.time,
    duration: "~1 hour",
    starter: session.starter,
    reason: "Both deeply curious. Both value depth over surface level conversation.",
    intentMatch: `Both seeking genuine connection. Intent alignment: ${Math.min(session.compatibility + 4, 99)}%.`,
    venueSafety: {
      isPublic: true,
      footTraffic: "high",
      transitAccess: true,
      exitEase: "high",
    },
  };
}

export function buildScanLog(session: SessionData): Array<{ text: string; type: "sys" | "scan" | "filter" | "done"; ms: number }> {
  const rng = createRng(session.seed + 100);
  const agentCount = 2400 + Math.floor(rng() * 800);
  const firstFilter = 300 + Math.floor(rng() * 200);
  const secondFilter = 8 + Math.floor(rng() * 8);
  const thirdFilter = 2 + Math.floor(rng() * 3);

  return [
    { text: "Deploying scanning agents across San Francisco...", type: "sys", ms: 0 },
    { text: `${agentCount.toLocaleString()} active agents in range`, type: "scan", ms: 800 },
    { text: `Layer 1: Dealbreaker filter → ${firstFilter} candidates`, type: "filter", ms: 2000 },
    { text: "Layer 2: Vector similarity (top 50)...", type: "scan", ms: 3200 },
    { text: "Layer 3: Physical alignment verification...", type: "scan", ms: 4000 },
    { text: "Layer 4: Intent alignment filter...", type: "filter", ms: 4800 },
    { text: `Layer 5: Complementarity analysis → ${secondFilter} candidates`, type: "filter", ms: 5600 },
    { text: `Layer 6: Contextual compatibility → ${thirdFilter} candidates`, type: "filter", ms: 6800 },
    { text: "Initiating agent to agent negotiation with top match...", type: "sys", ms: 8000 },
    { text: `Match locked. ${session.compatibility}% compatibility. Awaiting your decision.`, type: "done", ms: 9200 },
  ];
}

export function buildNegotiationSteps(session: SessionData): Array<{ agent: "A" | "B" | "sys"; text: string; ms: number }> {
  return [
    { agent: "sys", text: "Handshake request sent. Session encrypted.", ms: 0 },
    { agent: "A", text: "Sharing encrypted compatibility vector.", ms: 600 },
    { agent: "B", text: "Vector received. Running independent verification...", ms: 1400 },
    { agent: "sys", text: `Both agents agree: ${session.compatibility}% compatibility (±2%).`, ms: 2200 },
    { agent: "sys", text: "Dealbreaker scan: CLEAR on both sides.", ms: 2800 },
    { agent: "A", text: "Emotional state: stable. No risk flags.", ms: 3400 },
    { agent: "B", text: "Attachment pairing: secure × secure leaning. Low friction.", ms: 4000 },
    { agent: "A", text: "Physical compatibility: mutual alignment confirmed.", ms: 4600 },
    { agent: "sys", text: "Intent alignment: both seeking genuine connection. CLEAR.", ms: 5000 },
    { agent: "sys", text: "Risk assessment: 0.12. Proceeding normally.", ms: 5600 },
    { agent: "A", text: `Calendar overlap: ${session.day} 10am to 1pm. Energy peak: morning.`, ms: 6200 },
    { agent: "B", text: "Venue preference: quiet, easy exit, natural light.", ms: 6800 },
    { agent: "sys", text: `Venue locked: ${session.venue.short}, ${session.venue.area.split(",")[0]}. ${session.day} ${session.time}.`, ms: 7400 },
    { agent: "sys", text: "Privacy: No names or contact info exchanged between agents.", ms: 7800 },
    { agent: "sys", text: "Negotiation complete · 3.4s · Awaiting mutual acceptance.", ms: 8400 },
  ];
}

// ═══════════════════════════════════════════════════════════
// PERSONALIZED DEVICE SCAN (numbers vary per user name)
// ═══════════════════════════════════════════════════════════

export interface ScanEntry {
  text: string;
  type: "sys" | "scan" | "filter" | "done" | "intent";
  ms: number;
  phase: number;
}

export const deviceScanPhases = [
  { label: "PERMISSIONS", color: "#8B5CF6" },
  { label: "MESSAGES", color: "#06B6D4" },
  { label: "SOCIAL", color: "#EC4899" },
  { label: "MEDIA", color: "#F59E0B" },
  { label: "BEHAVIOR", color: "#10B981" },
  { label: "INTENT", color: "#A78BFA" },
  { label: "SYNTHESIS", color: "#4ADE80" },
];

export function buildDeviceScanLog(userName: string): ScanEntry[] {
  const seed = hashName(userName);
  const rng = createRng(seed);

  const messageCount = 6000 + Math.floor(rng() * 18000);
  const platforms = 2 + Math.floor(rng() * 3);
  const vocabPercentile = 8 + Math.floor(rng() * 15);
  const priorityPeople = 3 + Math.floor(rng() * 6);
  const conflictCount = 8 + Math.floor(rng() * 30);
  const photoCount = 800 + Math.floor(rng() * 5000);
  const naturePercent = 40 + Math.floor(rng() * 35);
  const socialInner = 4 + Math.floor(rng() * 6);
  const socialOuter = 25 + Math.floor(rng() * 40);
  const socialAcq = 120 + Math.floor(rng() * 200);
  const creativePercent = 25 + Math.floor(rng() * 25);
  const commPercent = 15 + Math.floor(rng() * 20);
  const learningPercent = 10 + Math.floor(rng() * 20);
  const dataPoints = 600 + Math.floor(rng() * 500);
  const profileConf = 85 + Math.floor(rng() * 10);

  const commStyles = ["thoughtful, measured responses", "direct, confident delivery", "warm, emotionally expressive", "analytical, precise phrasing"];
  const commStyle = pickSeeded(commStyles, rng);

  const conflictStyles = ["withdraw, process, return with clarity", "address directly, seeks resolution fast", "listen first, speak measured", "goes quiet, needs space, then engages"];
  const conflictStyle = pickSeeded(conflictStyles, rng);

  const engagementPatterns = ["drawn to creative, thoughtful content", "gravitates toward intellectual, long form content", "engages with culture, design, and personal growth", "attracted to authentic, unfiltered perspectives"];
  const engagement = pickSeeded(engagementPatterns, rng);

  const peakMorning = 5 + Math.floor(rng() * 4);
  const peakEvening = 8 + Math.floor(rng() * 3);
  const intentConf = 88 + Math.floor(rng() * 10);

  const platformList = ["iMessage", "WhatsApp"];
  if (platforms > 2) platformList.push("Instagram DMs");
  if (platforms > 3) platformList.push("Telegram");

  return [
    { text: "Requesting device permissions...", type: "sys", ms: 0, phase: 0 },
    { text: "Access granted: Messages, Social, Photos, Contacts", type: "sys", ms: 800, phase: 0 },
    { text: `Indexing ${platformList.join(", ")}...`, type: "scan", ms: 1600, phase: 1 },
    { text: `${messageCount.toLocaleString()} messages indexed across ${platforms} platforms`, type: "scan", ms: 2400, phase: 1 },
    { text: `Emotional vocabulary density: top ${vocabPercentile}% of analyzed users`, type: "filter", ms: 3000, phase: 1 },
    { text: `Communication cadence: ${commStyle}`, type: "filter", ms: 3600, phase: 1 },
    { text: `Response latency: you prioritize ${priorityPeople} people consistently`, type: "filter", ms: 4200, phase: 1 },
    { text: `Conflict instances: ${conflictCount} analyzed. Style: ${conflictStyle}`, type: "filter", ms: 4800, phase: 1 },
    { text: "Mapping Instagram, Twitter, LinkedIn engagement...", type: "scan", ms: 5600, phase: 2 },
    { text: `Engagement pattern: ${engagement}`, type: "filter", ms: 6200, phase: 2 },
    { text: "Posts rarely but engages deeply. Quality over quantity.", type: "filter", ms: 6800, phase: 2 },
    { text: `Social radius: inner circle ${socialInner}, outer ~${socialOuter}, acquaintances ~${socialAcq}`, type: "filter", ms: 7400, phase: 2 },
    { text: "Analyzing camera roll and saved content...", type: "scan", ms: 8200, phase: 3 },
    { text: `${photoCount.toLocaleString()} photos. ${naturePercent}% nature, urban, creative`, type: "scan", ms: 8800, phase: 3 },
    { text: "Physical presentation: consistent, intentional, above average", type: "filter", ms: 9400, phase: 3 },
    { text: "Lifestyle signals: values experiences over possessions", type: "filter", ms: 10000, phase: 3 },
    { text: "Analyzing device usage and location patterns...", type: "scan", ms: 10800, phase: 4 },
    { text: `Peak activity: ${peakMorning}am and ${peakEvening}pm. Consistent sleep schedule.`, type: "filter", ms: 11400, phase: 4 },
    { text: `App usage: ${creativePercent}% creative, ${commPercent}% communication, ${learningPercent}% learning`, type: "filter", ms: 12000, phase: 4 },
    { text: "Location patterns: frequents quiet, independent venues", type: "filter", ms: 12600, phase: 4 },
    { text: "Classifying relationship intent from behavioral data...", type: "intent", ms: 13400, phase: 5 },
    { text: "Emotional investment in conversations: HIGH", type: "intent", ms: 14000, phase: 5 },
    { text: "Zero engagement with casual encounter platforms", type: "intent", ms: 14600, phase: 5 },
    { text: "Long form conversation preference detected", type: "intent", ms: 15200, phase: 5 },
    { text: `INTENT: GENUINE CONNECTION (${intentConf}% confidence)`, type: "done", ms: 15800, phase: 5 },
    { text: `Cross-referencing ${dataPoints} behavioral data points...`, type: "sys", ms: 16600, phase: 6 },
    { text: `Building personality model. Confidence: ${profileConf}%.`, type: "sys", ms: 17400, phase: 6 },
    { text: "PROFILE CONSTRUCTION COMPLETE", type: "done", ms: 18200, phase: 6 },
  ];
}

// ═══════════════════════════════════════════════════════════
// PERSONALIZED INTENT PROFILE
// ═══════════════════════════════════════════════════════════

export function buildIntentProfile(userName: string) {
  const seed = hashName(userName) + 1000;
  const rng = createRng(seed);
  const genuine = 86 + Math.floor(rng() * 12);
  const casual = 1 + Math.floor(rng() * 8);
  const physical = Math.max(1, 100 - genuine - casual);
  return {
    classification: "Genuine connection",
    confidence: genuine / 100,
    signals: [
      { signal: "Emotional vocabulary depth", weight: "high", direction: "genuine" },
      { signal: "Response investment patterns", weight: "high", direction: "genuine" },
      { signal: "Zero casual platform engagement", weight: "medium", direction: "genuine" },
      { signal: "Long form conversation preference", weight: "high", direction: "genuine" },
      { signal: "Relationship duration patterns", weight: "medium", direction: "genuine" },
    ],
    breakdown: { genuine, casual, physical },
  };
}

// ═══════════════════════════════════════════════════════════
// PERSONALIZED PROFILE COMPOUNDING
// ═══════════════════════════════════════════════════════════

export function buildProfileCompounding(userName: string) {
  const seed = hashName(userName) + 2000;
  const rng = createRng(seed);
  const base = 65 + Math.floor(rng() * 12);
  const s2 = base + 8 + Math.floor(rng() * 5);
  const s3 = s2 + 3 + Math.floor(rng() * 4);
  const s4 = s3 + 2 + Math.floor(rng() * 3);
  const basePoints = 600 + Math.floor(rng() * 400);
  return {
    stages: [
      { label: "Device scan", confidence: base, dataPoints: basePoints },
      { label: "Behavioral analysis", confidence: s2, dataPoints: basePoints + 200 + Math.floor(rng() * 300) },
      { label: "Social graph mapped", confidence: s3, dataPoints: basePoints + 500 + Math.floor(rng() * 400) },
      { label: "Intent verified", confidence: s4, dataPoints: basePoints + 800 + Math.floor(rng() * 400) },
    ],
    projections: [
      { label: "After first meeting", confidence: Math.min(s4 + 4, 98) },
      { label: "After 3 meetings", confidence: Math.min(s4 + 6, 99) },
      { label: "After 10 meetings", confidence: Math.min(s4 + 8, 99) },
    ],
  };
}

// ═══════════════════════════════════════════════════════════
// STATIC DATA (same for all users)
// ═══════════════════════════════════════════════════════════

// === IRIS Onboarding Chat ===
export interface ChatMessage {
  sender: "iris" | "user" | "system";
  text: string;
  delay: number;
  inference?: {
    trait: string;
    domain: string;
    value: string;
    confidence: number;
  };
  isInferenceCallout?: boolean;
}

export const onboardingChat: ChatMessage[] = [
  {
    sender: "iris",
    text: "Hey. I am IRIS, your agent. I am going to learn who you are well enough to find people worth meeting. Not through a quiz. Just talk to me.",
    delay: 0,
  },
  {
    sender: "iris",
    text: "What is something you have been really into lately? Something that makes time disappear when you are doing it.",
    delay: 2500,
  },
  {
    sender: "user",
    text: "Honestly, writing. I have been journaling a lot, processing things from last year. It has been grounding in a way I did not expect.",
    delay: 5500,
  },
  {
    sender: "iris",
    text: "Journaling is not just writing. It is self confrontation. You are choosing to sit with uncomfortable thoughts instead of scrolling past them. That tells me a lot about your depth tolerance and your self awareness. Both are high.",
    delay: 8000,
    isInferenceCallout: true,
    inference: { trait: "Self awareness", domain: "Emotional Intelligence", value: "High", confidence: 0.82 },
  },
  {
    sender: "iris",
    text: "When you really care about someone, how do they know? What do you actually do, not what you think you should.",
    delay: 12000,
  },
  {
    sender: "user",
    text: "I remember the small things. If they mentioned a hard day coming up, I will text them that morning. I am not great at big gestures but I am consistent.",
    delay: 15000,
  },
  {
    sender: "iris",
    text: "Consistency over spectacle. You show love through quiet attention, not performance. That is acts of service paired with quality time. Specifically, you are a listener who converts what you hear into action. That is rare. Most people listen to respond. You listen to remember.",
    delay: 17500,
    isInferenceCallout: true,
    inference: { trait: "Love language", domain: "Love Language", value: "Acts of service (giving)", confidence: 0.78 },
  },
  {
    sender: "iris",
    text: "Think about the last real argument you had with someone you care about. What actually happened?",
    delay: 22000,
  },
  {
    sender: "user",
    text: "I went quiet. I needed to process. They thought I was shutting them out but I was just trying to figure out what I actually felt before I said something I did not mean.",
    delay: 25000,
  },
  {
    sender: "iris",
    text: "Here is what I see. You said honesty matters to you, but you go quiet in conflict. Those coexist, but they create tension. You need someone who can read silence. Someone who knows your quiet is not \"I am fine\" but \"I am processing.\" That is a very specific need, and it narrows my search in a useful way.",
    delay: 27500,
    isInferenceCallout: true,
    inference: { trait: "Conflict style", domain: "Conflict Resolution", value: "Withdraw to process", confidence: 0.85 },
  },
  {
    sender: "iris",
    text: "I have enough to start building your profile. Let me show you what I see so far.",
    delay: 32000,
  },
  {
    sender: "system",
    text: "PROFILE CONSTRUCTION COMPLETE",
    delay: 34000,
  },
];

// === Personality Web (Force-directed graph data) ===
export interface TraitNode {
  id: string;
  label: string;
  domain: string;
  domainColor: string;
  value: string;
  confidence: number;
  x: number;
  y: number;
  size: number;
}

export interface TraitEdge {
  source: string;
  target: string;
  weight: number;
}

export const domainColors: Record<string, string> = {
  "Attachment": "#E11D48",
  "Emotional Intelligence": "#F59E0B",
  "Communication": "#0EA5E9",
  "Values": "#10B981",
  "Lifestyle": "#F97316",
  "Conflict": "#EF4444",
  "Love Language": "#EC4899",
  "Cognitive": "#6366F1",
  "Social": "#14B8A6",
  "Growth": "#84CC16",
  "Physical": "#06B6D4",
  "History": "#8B5CF6",
};

export const personalityNodes: TraitNode[] = [
  { id: "self_aware", label: "Self-Awareness", domain: "Emotional Intelligence", domainColor: "#F59E0B", value: "High", confidence: 0.82, x: 180, y: 120, size: 14 },
  { id: "depth_tol", label: "Depth Tolerance", domain: "Emotional Intelligence", domainColor: "#F59E0B", value: "High", confidence: 0.78, x: 220, y: 90, size: 12 },
  { id: "love_lang", label: "Acts of Service", domain: "Love Language", domainColor: "#EC4899", value: "Primary", confidence: 0.78, x: 100, y: 200, size: 13 },
  { id: "listening", label: "Active Listening", domain: "Communication", domainColor: "#0EA5E9", value: "High", confidence: 0.80, x: 140, y: 260, size: 13 },
  { id: "conflict", label: "Withdraw to Process", domain: "Conflict", domainColor: "#EF4444", value: "Primary", confidence: 0.85, x: 260, y: 240, size: 14 },
  { id: "attach", label: "Secure Leaning", domain: "Attachment", domainColor: "#E11D48", value: "Secure", confidence: 0.72, x: 300, y: 160, size: 12 },
  { id: "honesty", label: "Honesty Priority", domain: "Values", domainColor: "#10B981", value: "Core", confidence: 0.88, x: 80, y: 140, size: 15 },
  { id: "curiosity", label: "Curiosity Depth", domain: "Cognitive", domainColor: "#6366F1", value: "Deep", confidence: 0.75, x: 200, y: 180, size: 12 },
  { id: "introvert", label: "Introversion", domain: "Social", domainColor: "#14B8A6", value: "60/40", confidence: 0.70, x: 320, y: 100, size: 11 },
  { id: "growth", label: "Growth Drive", domain: "Growth", domainColor: "#84CC16", value: "High", confidence: 0.76, x: 60, y: 80, size: 12 },
  { id: "vuln", label: "Vulnerability", domain: "Emotional Intelligence", domainColor: "#F59E0B", value: "Moderate", confidence: 0.65, x: 260, y: 60, size: 10 },
  { id: "consistency", label: "Consistency", domain: "Love Language", domainColor: "#EC4899", value: "Core", confidence: 0.80, x: 50, y: 240, size: 13 },
  { id: "physical", label: "Physical Standards", domain: "Physical", domainColor: "#06B6D4", value: "High", confidence: 0.74, x: 340, y: 220, size: 12 },
];

export const personalityEdges: TraitEdge[] = [
  { source: "self_aware", target: "depth_tol", weight: 0.8 },
  { source: "self_aware", target: "growth", weight: 0.7 },
  { source: "self_aware", target: "conflict", weight: 0.6 },
  { source: "listening", target: "love_lang", weight: 0.9 },
  { source: "listening", target: "curiosity", weight: 0.5 },
  { source: "conflict", target: "attach", weight: 0.7 },
  { source: "conflict", target: "honesty", weight: 0.4 },
  { source: "honesty", target: "vuln", weight: 0.5 },
  { source: "attach", target: "introvert", weight: 0.4 },
  { source: "curiosity", target: "depth_tol", weight: 0.6 },
  { source: "love_lang", target: "consistency", weight: 0.8 },
  { source: "growth", target: "vuln", weight: 0.5 },
  { source: "physical", target: "self_aware", weight: 0.5 },
  { source: "physical", target: "attach", weight: 0.4 },
];

// === User Profile (Post-Onboarding) ===
export const userProfile = {
  name: "",
  profileSummary: "You are a deep processor who values authenticity over performance. You bond slowly but meaningfully. You show love through quiet consistency, not grand gestures. You need someone who reads silence as processing, not withdrawal.",
  eqScore: 87,
  traits: [
    { label: "Communication", value: "Thoughtful & Reciprocal" },
    { label: "Attachment", value: "Secure Leaning" },
    { label: "Social Energy", value: "Ambivert (60/40)" },
    { label: "Conflict Style", value: "Withdraw to Process" },
    { label: "Love Language", value: "Acts of Service" },
    { label: "Ideal Match", value: "Curious, secure, reads silence" },
  ],
  traitInsights: {
    "Communication": "You ask better questions than most. That is rare.",
    "Attachment": "You bond slowly but deeply. IRIS accounts for this.",
    "Social Energy": "You peak in the morning. Meetings scheduled accordingly.",
    "Conflict Style": "Your silence is not avoidance. It is processing. You need someone who knows the difference.",
    "Love Language": "You listen to remember. Then you act on what you heard.",
    "Ideal Match": "This evolved after your last 3 conversations.",
  } as Record<string, string>,
  coreValues: ["Authenticity", "Depth", "Curiosity"],
};

// === Safety Config ===
export const safetyConfig = {
  meetingChecklist: [
    { id: "public_venue", label: "Public venue confirmed", auto: true },
    { id: "identity_verified", label: "Identity verified", auto: true },
    { id: "exit_ease", label: "Easy exit confirmed", auto: true },
    { id: "emergency_contact", label: "Emergency contact set", auto: false },
    { id: "location_shared", label: "Location shared with friend", auto: false },
  ],
  safetyControls: [
    { label: "Share live location", desc: "Send a link to a trusted contact", color: "#14B8A6" },
    { label: "Call emergency contact", desc: "Rings your designated contact", color: "#EF4444" },
    { label: "I need to leave", desc: "Get a discreet excuse notification", color: "#F59E0B" },
    { label: "Report concern", desc: "Flagged for review. Meeting logged.", color: "#EF4444" },
  ],
};

// === Post-Meeting ===
export const postMeetingOptions = [
  { id: "yes", icon: "check", label: "I would meet again", sublabel: "Something clicked" },
  { id: "no", icon: "x", label: "Not for me", sublabel: "No hard feelings" },
  { id: "maybe", icon: "pause", label: "Need time to think", sublabel: "I will let you know" },
];

// === Debrief Data ===
export const debriefItems = [
  { label: "Curiosity depth", before: 0.75, after: 0.88, change: "+0.13" },
  { label: "Communication match", before: 0.80, after: 0.85, change: "+0.05" },
  { label: "Depth tolerance", before: 0.78, after: 0.90, change: "+0.12" },
  { label: "Physical alignment", before: 0.70, after: 0.82, change: "+0.12" },
  { label: "Intent accuracy", before: 0.91, after: 0.96, change: "+0.05" },
  { label: "Attachment fit", before: 0.72, after: 0.78, change: "+0.06" },
];

export const nextMatchCalibration = [
  "Increased weight on conversational depth authenticity",
  "Confirmed preference for quiet, low pressure venues",
  "Secure attachment pairing validated. Continuing pattern.",
  "Morning meeting slots correlated with positive outcome",
  "Physical compatibility confirmed. Maintaining attraction threshold.",
  "Intent alignment strengthened. Genuine connection signal: 96%.",
];
