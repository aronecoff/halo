// ═══════════════════════════════════════════════════════════
// HALO Matching Engine v1
// Multi-dimensional compatibility analysis
// ═══════════════════════════════════════════════════════════
//
// The insight: dating apps match on what people SAY they want.
// HALO matches on how people ACTUALLY connect — inferred from
// how they communicate, what they value, and what they need.
//
// Six dimensions, weighted by relationship science:
//   1. Attachment Compatibility  (25%) — how they bond
//   2. Communication Resonance   (20%) — how they talk
//   3. Values Alignment          (20%) — what they live for
//   4. Emotional Intelligence    (15%) — how they regulate
//   5. Growth Trajectory         (10%) — where they're headed
//   6. Intent Alignment          (10%) — what they want now

export interface Profile {
  user_id: string;
  summary?: string;
  eq_score?: number;
  traits?: Array<{ label: string; value: string }>;
  personality_nodes?: Array<{
    id: string;
    label: string;
    domain: string;
    value: string;
    confidence: number;
  }>;
  personality_edges?: Array<{
    source: string;
    target: string;
    weight: number;
  }>;
  intent_profile?: {
    classification?: string;
    confidence?: number;
    breakdown?: Record<string, number>;
    signals?: Array<{ signal: string; weight: string; direction: string }>;
  };
  core_values?: string[];
  raw_conversation?: Array<{ role: string; content: string }>;
}

export interface MatchResult {
  score: number;
  dimensions: DimensionScore[];
  sharedTraits: string[];
  complementaryTraits: string[];
  riskFactors: string[];
  irisNarrative: string;
  conversationStarter: string;
}

interface DimensionScore {
  name: string;
  score: number;
  weight: number;
  weighted: number;
  insight: string;
}

// ─── Dimension Weights (sum to 1.0) ──────────────────────
const WEIGHTS = {
  attachment: 0.25,
  communication: 0.20,
  values: 0.20,
  emotional: 0.15,
  growth: 0.10,
  intent: 0.10,
};

// ─── Attachment Theory ───────────────────────────────────
// Secure-secure is gold. Anxious-avoidant is a trap.
// Complementary insecure styles can work IF both are self-aware.
const ATTACHMENT_MATRIX: Record<string, Record<string, number>> = {
  secure:    { secure: 95, anxious: 72, avoidant: 68, disorganized: 55 },
  anxious:   { secure: 78, anxious: 45, avoidant: 25, disorganized: 35 },
  avoidant:  { secure: 74, anxious: 25, avoidant: 50, disorganized: 30 },
  disorganized: { secure: 60, anxious: 35, avoidant: 30, disorganized: 20 },
};

// Aliases: IRIS outputs varied language, normalize it
const ATTACHMENT_ALIASES: Record<string, string> = {
  "secure": "secure",
  "secure leaning": "secure",
  "secure-leaning": "secure",
  "securely attached": "secure",
  "anxious": "anxious",
  "anxious-preoccupied": "anxious",
  "preoccupied": "anxious",
  "anxious leaning": "anxious",
  "avoidant": "avoidant",
  "dismissive": "avoidant",
  "dismissive-avoidant": "avoidant",
  "fearful": "disorganized",
  "fearful-avoidant": "disorganized",
  "disorganized": "disorganized",
};

function normalizeAttachment(raw: string): string {
  const lower = raw.toLowerCase().trim();
  return ATTACHMENT_ALIASES[lower] || "secure"; // default secure if unknown
}

function scoreAttachment(a: Profile, b: Profile): DimensionScore {
  const attachA = getTraitValue(a, "attachment") || "secure";
  const attachB = getTraitValue(b, "attachment") || "secure";
  const normA = normalizeAttachment(attachA);
  const normB = normalizeAttachment(attachB);

  const raw = ATTACHMENT_MATRIX[normA]?.[normB] ?? 60;

  // Self-awareness bonus: high EQ on insecure styles means they can compensate
  let bonus = 0;
  if (normA !== "secure" && (a.eq_score || 70) > 80) bonus += 5;
  if (normB !== "secure" && (b.eq_score || 70) > 80) bonus += 5;

  const score = Math.min(98, raw + bonus);
  const weighted = score * WEIGHTS.attachment;

  let insight: string;
  if (normA === "secure" && normB === "secure") {
    insight = "Both bring secure attachment patterns. This is the strongest foundation for lasting connection.";
  } else if (normA === normB) {
    insight = `Shared ${normA} patterns — they understand each other's triggers, but may amplify them without awareness.`;
  } else if ((normA === "anxious" && normB === "avoidant") || (normA === "avoidant" && normB === "anxious")) {
    insight = "Anxious-avoidant dynamic detected. Magnetic pull, but high risk of pursue-withdraw cycles without active work.";
  } else {
    const secureOne = normA === "secure" ? "A" : normB === "secure" ? "B" : null;
    if (secureOne) {
      const insecure = secureOne === "A" ? normB : normA;
      insight = `One partner's secure base can help stabilize the other's ${insecure} tendencies. Viable with patience.`;
    } else {
      insight = "Mixed insecure patterns. Workable if both are emotionally intelligent and self-aware.";
    }
  }

  return { name: "Attachment Compatibility", score, weight: WEIGHTS.attachment, weighted, insight };
}

// ─── Communication Resonance ─────────────────────────────
// Not "do they communicate the same way" but "can they hear each other"
// Direct + direct = efficient. Indirect + direct = friction unless there's empathy.
const COMM_MATRIX: Record<string, Record<string, number>> = {
  direct:     { direct: 88, thoughtful: 82, indirect: 55, reserved: 60 },
  thoughtful: { direct: 82, thoughtful: 90, indirect: 75, reserved: 72 },
  indirect:   { direct: 55, thoughtful: 75, indirect: 65, reserved: 58 },
  reserved:   { direct: 60, thoughtful: 72, indirect: 58, reserved: 70 },
};

const COMM_ALIASES: Record<string, string> = {
  "direct": "direct",
  "direct communicator": "direct",
  "blunt": "direct",
  "assertive": "direct",
  "thoughtful": "thoughtful",
  "thoughtful & reciprocal": "thoughtful",
  "reflective": "thoughtful",
  "measured": "thoughtful",
  "careful": "thoughtful",
  "indirect": "indirect",
  "passive": "indirect",
  "hint-based": "indirect",
  "reserved": "reserved",
  "quiet": "reserved",
  "selective": "reserved",
  "withdrawn": "reserved",
};

function normalizeComm(raw: string): string {
  const lower = raw.toLowerCase().trim();
  for (const [alias, norm] of Object.entries(COMM_ALIASES)) {
    if (lower.includes(alias)) return norm;
  }
  return "thoughtful";
}

function scoreCommuncation(a: Profile, b: Profile): DimensionScore {
  const commA = getTraitValue(a, "communication") || "thoughtful";
  const commB = getTraitValue(b, "communication") || "thoughtful";
  const normA = normalizeComm(commA);
  const normB = normalizeComm(commB);

  let score = COMM_MATRIX[normA]?.[normB] ?? 70;

  // Conversation depth bonus: if both produced rich IRIS conversations
  const depthA = conversationDepth(a);
  const depthB = conversationDepth(b);
  if (depthA > 0.7 && depthB > 0.7) score = Math.min(98, score + 8);
  else if (depthA > 0.5 && depthB > 0.5) score = Math.min(98, score + 4);

  const weighted = score * WEIGHTS.communication;

  let insight: string;
  if (normA === normB) {
    insight = `Both are ${normA} communicators. Low friction, natural rhythm.`;
  } else if (score >= 80) {
    insight = `${capitalize(normA)} meets ${normB} — different styles, but high mutual readability.`;
  } else if (score >= 65) {
    insight = `${capitalize(normA)} and ${normB} styles will require patience, but create opportunities for growth.`;
  } else {
    insight = `Communication gap between ${normA} and ${normB} approaches. Will need conscious bridging.`;
  }

  return { name: "Communication Resonance", score, weight: WEIGHTS.communication, weighted, insight };
}

// ─── Values Alignment ────────────────────────────────────
// Shared core values are the #1 predictor of long-term satisfaction.
// But values exist in clusters — adjacent values matter too.
const VALUE_CLUSTERS: Record<string, string[]> = {
  depth: ["authenticity", "depth", "honesty", "vulnerability", "truth", "integrity", "transparency"],
  growth: ["growth", "curiosity", "learning", "ambition", "self-improvement", "development", "evolution"],
  connection: ["connection", "empathy", "compassion", "love", "belonging", "community", "intimacy"],
  freedom: ["freedom", "independence", "autonomy", "adventure", "spontaneity", "exploration"],
  stability: ["stability", "security", "consistency", "loyalty", "commitment", "reliability", "trust"],
  creativity: ["creativity", "expression", "art", "beauty", "originality", "innovation", "imagination"],
  purpose: ["purpose", "impact", "meaning", "service", "contribution", "legacy", "mission"],
  joy: ["joy", "humor", "playfulness", "fun", "lightness", "presence", "gratitude"],
};

function getValueCluster(value: string): string | null {
  const lower = value.toLowerCase().trim();
  for (const [cluster, words] of Object.entries(VALUE_CLUSTERS)) {
    if (words.some(w => lower.includes(w))) return cluster;
  }
  return null;
}

function scoreValues(a: Profile, b: Profile): DimensionScore {
  const valsA = (a.core_values || []).map(v => v.toLowerCase().trim());
  const valsB = (b.core_values || []).map(v => v.toLowerCase().trim());

  if (valsA.length === 0 || valsB.length === 0) {
    return { name: "Values Alignment", score: 65, weight: WEIGHTS.values, weighted: 65 * WEIGHTS.values, insight: "Insufficient values data for deep analysis." };
  }

  // Direct matches
  const directMatches = valsA.filter(v => valsB.includes(v));

  // Cluster matches (adjacent values)
  const clustersAArr = valsA.map(getValueCluster).filter((c): c is string => c !== null);
  const clustersBArr = valsB.map(getValueCluster).filter((c): c is string => c !== null);
  const clustersA = new Set(clustersAArr);
  const clustersB = new Set(clustersBArr);
  const clusterOverlap = clustersAArr.filter(c => clustersB.has(c));
  // Deduplicate
  const uniqueClusterOverlap = Array.from(new Set(clusterOverlap));

  // Score: direct matches worth more than cluster matches
  const maxPossible = Math.max(valsA.length, valsB.length);
  const directScore = (directMatches.length / maxPossible) * 60;
  const clusterScore = (uniqueClusterOverlap.length / Math.max(clustersA.size, clustersB.size, 1)) * 40;

  let score = Math.min(98, Math.round(40 + directScore + clusterScore));

  // Conflict detection: freedom vs stability is a tension
  const hasConflict =
    (clustersA.has("freedom") && clustersB.has("stability") && !clustersB.has("freedom")) ||
    (clustersB.has("freedom") && clustersA.has("stability") && !clustersA.has("freedom"));
  if (hasConflict) score = Math.max(45, score - 12);

  const weighted = score * WEIGHTS.values;

  let insight: string;
  if (directMatches.length >= 2) {
    insight = `Strong values alignment: both prioritize ${directMatches.slice(0, 2).join(" and ")}. This is the bedrock.`;
  } else if (uniqueClusterOverlap.length >= 2) {
    insight = `Values orbit the same themes (${uniqueClusterOverlap.slice(0, 2).join(", ")}). Not identical, but resonant.`;
  } else if (hasConflict) {
    insight = "Tension between freedom and stability values. This needs explicit negotiation to work.";
  } else {
    insight = "Different value systems — not incompatible, but requires mutual respect for each other's priorities.";
  }

  return { name: "Values Alignment", score, weight: WEIGHTS.values, weighted, insight };
}

// ─── Emotional Intelligence ──────────────────────────────
// EQ gap matters more than absolute EQ. Large gaps create resentment.
function scoreEmotional(a: Profile, b: Profile): DimensionScore {
  const eqA = a.eq_score || 70;
  const eqB = b.eq_score || 70;
  const gap = Math.abs(eqA - eqB);
  const avg = (eqA + eqB) / 2;

  // Small gap + high average = gold
  // Large gap = one person always doing the emotional work
  let score: number;
  if (gap <= 5 && avg >= 80) score = 95;
  else if (gap <= 5) score = 80 + (avg - 60) * 0.3;
  else if (gap <= 10) score = 75 + (avg - 60) * 0.2;
  else if (gap <= 15) score = 65 + (avg - 60) * 0.1;
  else score = Math.max(40, 60 - (gap - 15) * 2);

  score = Math.min(98, Math.round(score));
  const weighted = score * WEIGHTS.emotional;

  let insight: string;
  if (gap <= 5 && avg >= 80) {
    insight = "Matched emotional intelligence. Both can read the room and regulate. Rare pairing.";
  } else if (gap <= 10) {
    insight = "Close emotional wavelength. Minor asymmetry won't create friction.";
  } else if (gap > 20) {
    insight = `Significant EQ gap (${gap} points). The higher-EQ partner may feel they're always translating.`;
  } else {
    insight = "Moderate emotional intelligence gap. Manageable with mutual patience.";
  }

  return { name: "Emotional Intelligence", score, weight: WEIGHTS.emotional, weighted, insight };
}

// ─── Growth Trajectory ───────────────────────────────────
// Are they both growing? In compatible directions?
function scoreGrowth(a: Profile, b: Profile): DimensionScore {
  const nodesA = a.personality_nodes || [];
  const nodesB = b.personality_nodes || [];

  // Growth signals: high confidence in growth domain, presence of growth-related nodes
  const growthNodesA = nodesA.filter(n => n.domain?.toLowerCase() === "growth");
  const growthNodesB = nodesB.filter(n => n.domain?.toLowerCase() === "growth");

  const growthSignalA = growthNodesA.length > 0
    ? growthNodesA.reduce((sum, n) => sum + (n.confidence || 0.5), 0) / growthNodesA.length
    : 0.4;
  const growthSignalB = growthNodesB.length > 0
    ? growthNodesB.reduce((sum, n) => sum + (n.confidence || 0.5), 0) / growthNodesB.length
    : 0.4;

  // Both growing = great. One stagnant = risk.
  const bothGrowing = growthSignalA > 0.6 && growthSignalB > 0.6;
  const oneStagnant = (growthSignalA < 0.4 && growthSignalB > 0.7) || (growthSignalB < 0.4 && growthSignalA > 0.7);

  let score: number;
  if (bothGrowing) score = 85 + Math.round((growthSignalA + growthSignalB) * 5);
  else if (oneStagnant) score = 55;
  else score = 70;

  // Values-based growth check
  const growthValues = ["growth", "curiosity", "learning", "self-improvement"];
  const aHasGrowth = (a.core_values || []).some(v => growthValues.some(g => v.toLowerCase().includes(g)));
  const bHasGrowth = (b.core_values || []).some(v => growthValues.some(g => v.toLowerCase().includes(g)));
  if (aHasGrowth && bHasGrowth) score = Math.min(98, score + 8);

  score = Math.min(98, score);
  const weighted = score * WEIGHTS.growth;

  let insight: string;
  if (bothGrowing) {
    insight = "Both on active growth trajectories. They'll push each other forward.";
  } else if (oneStagnant) {
    insight = "Asymmetric growth energy. The growing partner may eventually outpace the other.";
  } else {
    insight = "Moderate growth signals. Neither is stagnant, neither is sprinting.";
  }

  return { name: "Growth Trajectory", score, weight: WEIGHTS.growth, weighted, insight };
}

// ─── Intent Alignment ────────────────────────────────────
// What are they actually here for? Genuine connection? Casual? Physical?
function scoreIntent(a: Profile, b: Profile): DimensionScore {
  const intentA = a.intent_profile;
  const intentB = b.intent_profile;

  if (!intentA?.breakdown || !intentB?.breakdown) {
    return { name: "Intent Alignment", score: 70, weight: WEIGHTS.intent, weighted: 70 * WEIGHTS.intent, insight: "Limited intent data. Defaulting to neutral." };
  }

  // Compare intent distributions using cosine similarity
  const categories = ["genuine", "casual", "physical"];
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (const cat of categories) {
    const a_val = (intentA.breakdown[cat] || 0) / 100;
    const b_val = (intentB.breakdown[cat] || 0) / 100;
    dotProduct += a_val * b_val;
    magA += a_val * a_val;
    magB += b_val * b_val;
  }

  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  const similarity = magnitude > 0 ? dotProduct / magnitude : 0;

  // Scale to 0-100
  let score = Math.round(similarity * 100);
  score = Math.min(98, Math.max(30, score));

  const weighted = score * WEIGHTS.intent;

  // Determine dominant intent for narrative
  const dominantA = Object.entries(intentA.breakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || "genuine";
  const dominantB = Object.entries(intentB.breakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || "genuine";

  let insight: string;
  if (dominantA === dominantB && score >= 80) {
    insight = `Both seeking ${dominantA} connection. Intent is aligned.`;
  } else if (dominantA === dominantB) {
    insight = `Same primary intent (${dominantA}) but different intensity levels.`;
  } else {
    insight = `Intent mismatch: one leans ${dominantA}, the other ${dominantB}. Needs honest conversation early.`;
  }

  return { name: "Intent Alignment", score, weight: WEIGHTS.intent, weighted, insight };
}

// ─── Composite Scoring ───────────────────────────────────

export function computeMatch(a: Profile, b: Profile): MatchResult {
  const dimensions = [
    scoreAttachment(a, b),
    scoreCommuncation(a, b),
    scoreValues(a, b),
    scoreEmotional(a, b),
    scoreGrowth(a, b),
    scoreIntent(a, b),
  ];

  // Weighted composite
  const rawScore = dimensions.reduce((sum, d) => sum + d.weighted, 0);

  // Apply floor/ceiling penalties
  const lowestDimension = Math.min(...dimensions.map(d => d.score));
  let penalty = 0;
  if (lowestDimension < 40) penalty = 10; // critical weakness
  else if (lowestDimension < 55) penalty = 5;

  const score = Math.min(98, Math.max(35, Math.round(rawScore - penalty)));

  // Extract shared and complementary traits
  const sharedTraits = extractSharedTraits(a, b);
  const complementaryTraits = extractComplementaryTraits(a, b);
  const riskFactors = extractRiskFactors(dimensions);

  // Generate narrative
  const irisNarrative = generateNarrative(a, b, dimensions, score, sharedTraits, complementaryTraits);
  const conversationStarter = generateStarter(a, b, dimensions);

  return {
    score,
    dimensions,
    sharedTraits,
    complementaryTraits,
    riskFactors,
    irisNarrative,
    conversationStarter,
  };
}

// ─── Trait Extraction ────────────────────────────────────

function extractSharedTraits(a: Profile, b: Profile): string[] {
  const shared: string[] = [];

  // Core values overlap
  const valsA = (a.core_values || []).map(v => v.toLowerCase());
  const valsB = (b.core_values || []).map(v => v.toLowerCase());
  for (const v of valsA) {
    if (valsB.includes(v)) shared.push(capitalize(v));
  }

  // Personality node overlap (same domain + similar value)
  const nodesA = a.personality_nodes || [];
  const nodesB = b.personality_nodes || [];
  for (const nA of nodesA) {
    const match = nodesB.find(nB =>
      nB.domain === nA.domain &&
      nB.value?.toLowerCase() === nA.value?.toLowerCase()
    );
    if (match && !shared.includes(nA.label)) {
      shared.push(nA.label);
    }
  }

  return shared.slice(0, 6);
}

function extractComplementaryTraits(a: Profile, b: Profile): string[] {
  const comp: string[] = [];
  const traitsA = a.traits || [];
  const traitsB = b.traits || [];

  // Find traits where they differ meaningfully but complementarily
  for (const tA of traitsA) {
    const tB = traitsB.find(t => t.label === tA.label);
    if (tB && tA.value !== tB.value) {
      comp.push(`${tA.label}: ${tA.value} + ${tB.value}`);
    }
  }

  return comp.slice(0, 4);
}

function extractRiskFactors(dimensions: DimensionScore[]): string[] {
  return dimensions
    .filter(d => d.score < 55)
    .map(d => d.insight);
}

// ─── Narrative Generation ────────────────────────────────

function generateNarrative(
  a: Profile,
  b: Profile,
  dimensions: DimensionScore[],
  score: number,
  shared: string[],
  complementary: string[],
): string {
  const strongest = dimensions.reduce((best, d) => d.score > best.score ? d : best);
  const weakest = dimensions.reduce((worst, d) => d.score < worst.score ? d : worst);

  let narrative = "";

  if (score >= 85) {
    narrative = `High-signal match. ${strongest.insight}`;
    if (shared.length >= 2) {
      narrative += ` Shared foundation in ${shared.slice(0, 2).join(" and ")}.`;
    }
  } else if (score >= 70) {
    narrative = `Strong potential. ${strongest.insight}`;
    if (weakest.score < 60) {
      narrative += ` Watch point: ${weakest.name.toLowerCase()}.`;
    }
  } else if (score >= 55) {
    narrative = `Moderate compatibility with specific strengths. ${strongest.insight}`;
    if (complementary.length > 0) {
      narrative += ` Complementary dynamics in ${complementary[0]}.`;
    }
  } else {
    narrative = `Lower compatibility signal. ${weakest.insight} ${strongest.name} is the bright spot at ${strongest.score}%.`;
  }

  return narrative;
}

function generateStarter(a: Profile, b: Profile, dimensions: DimensionScore[]): string {
  const strongest = dimensions.reduce((best, d) => d.score > best.score ? d : best);

  const startersByDimension: Record<string, string[]> = {
    "Attachment Compatibility": [
      "Ask them what makes them feel most at home with someone.",
      "Ask them how they know when they can trust someone.",
    ],
    "Communication Resonance": [
      "Ask them about the best conversation they have had this year.",
      "Ask them what they notice first about how someone talks.",
    ],
    "Values Alignment": [
      "Ask them what principle they would never compromise on.",
      "Ask them what they would build if they could not fail.",
    ],
    "Emotional Intelligence": [
      "Ask them about a time they changed their mind about someone.",
      "Ask them what emotion they find hardest to express.",
    ],
    "Growth Trajectory": [
      "Ask them what they are most curious about right now.",
      "Ask them what they know now that they wish they knew five years ago.",
    ],
    "Intent Alignment": [
      "Ask them what brought them here today.",
      "Ask them what kind of connection they have been missing.",
    ],
  };

  const options = startersByDimension[strongest.name] || [
    "Ask them what they are most curious about right now.",
  ];

  return options[Math.floor(Math.random() * options.length)];
}

// ─── Helpers ─────────────────────────────────────────────

function getTraitValue(profile: Profile, label: string): string | null {
  const trait = (profile.traits || []).find(
    t => t.label.toLowerCase().includes(label.toLowerCase())
  );
  return trait?.value || null;
}

function conversationDepth(profile: Profile): number {
  const conv = profile.raw_conversation || [];
  if (conv.length === 0) return 0.5;

  const userMessages = conv.filter(m => m.role === "user");
  if (userMessages.length === 0) return 0.3;

  // Average word count of user messages as depth proxy
  const avgWords = userMessages.reduce((sum, m) => sum + m.content.split(/\s+/).length, 0) / userMessages.length;

  // Normalize: <5 words = shallow, >30 words = deep
  return Math.min(1, Math.max(0, (avgWords - 5) / 25));
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
