import { useState, useEffect, useCallback, useRef } from "react";

// ============================================================
// HALO MVP — Psychological Compatibility Dating App
// ============================================================
// Stack: React + Tailwind (single-file prototype)
// Features: Onboarding, Enneagram Assessment, Attachment Style,
//           Compatibility Algorithm, Match Results
// ============================================================

// ── Fonts ────────────────────────────────────────────────────
const FONT_LINK = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300;1,9..40,400&display=swap";

// ── Color Palette ────────────────────────────────────────────
const COLORS = {
  bg: "#0A0A0F",
  surface: "#12121A",
  surfaceLight: "#1A1A26",
  border: "#2A2A3A",
  accent: "#C8A97E",      // warm gold
  accentSoft: "#C8A97E22",
  accentMid: "#C8A97E44",
  text: "#E8E4DF",
  textMuted: "#8A8698",
  textDim: "#5A5668",
  success: "#7EC89A",
  warning: "#E8C87E",
  rose: "#C87E8A",
  violet: "#8A7EC8",
};

// ── Enneagram Data ───────────────────────────────────────────
const ENNEAGRAM_TYPES = [
  { num: 1, name: "The Reformer", core: "Integrity & Purpose", fear: "Being corrupt or defective", desire: "To be good and have integrity", icon: "⚖️" },
  { num: 2, name: "The Helper", core: "Love & Connection", fear: "Being unwanted or unloved", desire: "To feel loved and needed", icon: "💛" },
  { num: 3, name: "The Achiever", core: "Authenticity & Worth", fear: "Being worthless or without value", desire: "To feel valuable and worthwhile", icon: "⭐" },
  { num: 4, name: "The Individualist", core: "Identity & Depth", fear: "Having no identity or significance", desire: "To find themselves and their significance", icon: "🌊" },
  { num: 5, name: "The Investigator", core: "Knowledge & Mastery", fear: "Being useless or incapable", desire: "To be competent and capable", icon: "🔭" },
  { num: 6, name: "The Loyalist", core: "Security & Trust", fear: "Being without support or guidance", desire: "To have security and support", icon: "🛡️" },
  { num: 7, name: "The Enthusiast", core: "Freedom & Joy", fear: "Being deprived or trapped in pain", desire: "To be satisfied and content", icon: "✨" },
  { num: 8, name: "The Challenger", core: "Strength & Control", fear: "Being harmed or controlled by others", desire: "To protect themselves and be in control", icon: "🔥" },
  { num: 9, name: "The Peacemaker", core: "Peace & Harmony", fear: "Loss and separation from others", desire: "To have inner stability and peace", icon: "☮️" },
];

// ── Attachment Styles ────────────────────────────────────────
const ATTACHMENT_STYLES = [
  { id: "secure", name: "Secure", desc: "Comfortable with intimacy and independence", color: COLORS.success },
  { id: "anxious", name: "Anxious-Preoccupied", desc: "Seeks high levels of closeness and approval", color: COLORS.warning },
  { id: "avoidant", name: "Dismissive-Avoidant", desc: "Values self-sufficiency and emotional distance", color: COLORS.violet },
  { id: "fearful", name: "Fearful-Avoidant", desc: "Desires closeness but fears vulnerability", color: COLORS.rose },
];

// ── Assessment Questions ─────────────────────────────────────
const ENNEAGRAM_QUESTIONS = [
  {
    q: "When facing a major decision, your first instinct is to...",
    options: [
      { text: "Analyze every angle before committing", types: [5, 6] },
      { text: "Trust your gut and move decisively", types: [8, 3] },
      { text: "Consider how it affects everyone involved", types: [2, 9] },
      { text: "Look for the most creative or unconventional path", types: [4, 7] },
    ],
  },
  {
    q: "In relationships, you're most afraid of...",
    options: [
      { text: "Losing your independence or being controlled", types: [5, 8] },
      { text: "Being abandoned or found unworthy", types: [2, 6] },
      { text: "Losing your sense of self or uniqueness", types: [4, 3] },
      { text: "Missing out on meaningful experiences", types: [7, 1] },
    ],
  },
  {
    q: "At your best, people would describe you as...",
    options: [
      { text: "Deeply principled and reliable", types: [1, 6] },
      { text: "Warm, generous, and nurturing", types: [2, 9] },
      { text: "Insightful, creative, and authentic", types: [4, 5] },
      { text: "Energetic, confident, and inspiring", types: [3, 7, 8] },
    ],
  },
  {
    q: "Under stress, you tend to...",
    options: [
      { text: "Withdraw and overthink", types: [4, 5, 9] },
      { text: "Become controlling or confrontational", types: [1, 8] },
      { text: "Seek reassurance from others", types: [2, 6] },
      { text: "Distract yourself with activity or pleasure", types: [3, 7] },
    ],
  },
  {
    q: "Your ideal weekend looks like...",
    options: [
      { text: "Deep conversation and meaningful connection", types: [4, 5, 6] },
      { text: "Adventure, spontaneity, new experiences", types: [7, 8] },
      { text: "Helping others or community involvement", types: [1, 2] },
      { text: "Relaxing, recharging, going with the flow", types: [3, 9] },
    ],
  },
  {
    q: "The quality you value most in a partner is...",
    options: [
      { text: "Emotional depth and authenticity", types: [4, 6] },
      { text: "Loyalty and dependability", types: [1, 2, 6] },
      { text: "Intelligence and competence", types: [3, 5] },
      { text: "Spontaneity and passion", types: [7, 8] },
    ],
  },
  {
    q: "When someone criticizes you, you...",
    options: [
      { text: "Reflect deeply — it might haunt you for days", types: [1, 4] },
      { text: "Consider if it's valid, then move on", types: [5, 9] },
      { text: "Feel hurt but try to understand their perspective", types: [2, 6] },
      { text: "Push back or prove them wrong", types: [3, 7, 8] },
    ],
  },
  {
    q: "Your core motivation in life is to...",
    options: [
      { text: "Understand the world and yourself deeply", types: [4, 5] },
      { text: "Create something meaningful and lasting", types: [1, 3] },
      { text: "Experience life fully and avoid suffering", types: [7, 9] },
      { text: "Protect and empower yourself and loved ones", types: [2, 6, 8] },
    ],
  },
];

const ATTACHMENT_QUESTIONS = [
  {
    q: "When a partner doesn't text back for hours, you...",
    options: [
      { text: "Don't really notice — you're busy with your own thing", style: "avoidant", weight: 2 },
      { text: "Check your phone a few times but trust they'll respond", style: "secure", weight: 2 },
      { text: "Start wondering if something is wrong between you", style: "anxious", weight: 2 },
      { text: "Feel a mix of worry and urge to pull away", style: "fearful", weight: 2 },
    ],
  },
  {
    q: "When a relationship starts getting serious, you...",
    options: [
      { text: "Feel excited and lean in naturally", style: "secure", weight: 2 },
      { text: "Feel a strong need to merge and be close", style: "anxious", weight: 2 },
      { text: "Start feeling suffocated and need space", style: "avoidant", weight: 2 },
      { text: "Want closeness but feel terrified simultaneously", style: "fearful", weight: 2 },
    ],
  },
  {
    q: "After an argument with a partner, you typically...",
    options: [
      { text: "Want to talk it through right away and reconnect", style: "anxious", weight: 2 },
      { text: "Need time alone to process before reconnecting", style: "avoidant", weight: 2 },
      { text: "Can stay present and work toward resolution together", style: "secure", weight: 2 },
      { text: "Fluctuate between wanting to fix it and wanting to flee", style: "fearful", weight: 2 },
    ],
  },
  {
    q: "Your ideal level of togetherness in a relationship is...",
    options: [
      { text: "High interdependence with strong individual identities", style: "secure", weight: 2 },
      { text: "Very close — sharing everything and always connected", style: "anxious", weight: 2 },
      { text: "Parallel lives that overlap comfortably", style: "avoidant", weight: 2 },
      { text: "It depends on the day — sometimes close, sometimes distant", style: "fearful", weight: 2 },
    ],
  },
];

// ── Compatibility Matrix ─────────────────────────────────────
// Scores 1-10 based on Enneagram growth theory & relationship dynamics
const COMPAT_MATRIX = {
  "1-1": 6, "1-2": 8, "1-3": 5, "1-4": 6, "1-5": 7, "1-6": 7, "1-7": 8, "1-8": 6, "1-9": 9,
  "2-2": 5, "2-3": 7, "2-4": 8, "2-5": 5, "2-6": 7, "2-7": 6, "2-8": 8, "2-9": 7,
  "3-3": 5, "3-4": 6, "3-5": 6, "3-6": 7, "3-7": 8, "3-8": 7, "3-9": 8,
  "4-4": 5, "4-5": 8, "4-6": 6, "4-7": 6, "4-8": 7, "4-9": 9,
  "5-5": 6, "5-6": 7, "5-7": 7, "5-8": 7, "5-9": 8,
  "6-6": 6, "6-7": 7, "6-8": 7, "6-9": 9,
  "7-7": 6, "7-8": 7, "7-9": 8,
  "8-8": 5, "8-9": 8,
  "9-9": 7,
};

const getEnneagramCompat = (a, b) => {
  const key1 = `${Math.min(a, b)}-${Math.max(a, b)}`;
  return COMPAT_MATRIX[key1] || 5;
};

const ATTACH_COMPAT = {
  "secure-secure": 10, "secure-anxious": 7, "secure-avoidant": 7, "secure-fearful": 6,
  "anxious-anxious": 4, "anxious-avoidant": 3, "anxious-fearful": 4,
  "avoidant-avoidant": 5, "avoidant-fearful": 3,
  "fearful-fearful": 3,
};

const getAttachCompat = (a, b) => {
  const key1 = `${a}-${b}`;
  const key2 = `${b}-${a}`;
  return ATTACH_COMPAT[key1] || ATTACH_COMPAT[key2] || 5;
};

// ── Sample Profiles for Demo ─────────────────────────────────
const SAMPLE_PROFILES = [
  { id: 1, name: "Maya", age: 27, photo: "🧘‍♀️", enneagram: 4, attachment: "secure", interests: ["meditation", "art", "hiking"], bio: "Searching for depth in a shallow world. Let's talk about what keeps you up at night.", location: "SF" },
  { id: 2, name: "Jordan", age: 29, photo: "🎸", enneagram: 7, attachment: "secure", interests: ["music", "travel", "cooking"], bio: "Life's too short for boring dates. Adventure buddy seeking co-pilot.", location: "SF" },
  { id: 3, name: "Priya", age: 26, photo: "📚", enneagram: 5, attachment: "avoidant", interests: ["philosophy", "chess", "film"], bio: "INTJ who thinks the best dates are long walks debating consciousness.", location: "Palo Alto" },
  { id: 4, name: "Kai", age: 28, photo: "🌿", enneagram: 9, attachment: "secure", interests: ["yoga", "nature", "writing"], bio: "Peace-seeker. Plant parent. Believes the best conversations happen in silence.", location: "SF" },
  { id: 5, name: "Luna", age: 25, photo: "🎨", enneagram: 4, attachment: "anxious", interests: ["painting", "poetry", "astrology"], bio: "Emotional depth is my love language. Let me read your chart.", location: "Oakland" },
  { id: 6, name: "Alex", age: 30, photo: "🏔️", enneagram: 8, attachment: "secure", interests: ["climbing", "startups", "debate"], bio: "Direct communicator. If we can disagree well, we can do anything.", location: "SF" },
  { id: 7, name: "Sage", age: 27, photo: "🔬", enneagram: 1, attachment: "secure", interests: ["science", "running", "volunteering"], bio: "Improving the world one system at a time. Looking for a partner in purpose.", location: "Berkeley" },
  { id: 8, name: "River", age: 26, photo: "🎭", enneagram: 3, attachment: "anxious", interests: ["theater", "fitness", "fashion"], bio: "Ambitious dreamer with a soft center. Impress me with your authenticity.", location: "SF" },
];

// ── Compatibility Engine ─────────────────────────────────────
const calculateCompatibility = (userProfile, candidate) => {
  const enneagramScore = getEnneagramCompat(userProfile.enneagram, candidate.enneagram) * 10;
  const attachScore = getAttachCompat(userProfile.attachment, candidate.attachment) * 10;
  const sharedInterests = userProfile.interests.filter((i) => candidate.interests.includes(i)).length;
  const interestScore = Math.min(sharedInterests * 20, 100);

  // Weighted composite
  const composite = Math.round(enneagramScore * 0.4 + attachScore * 0.35 + interestScore * 0.25);

  // Growth potential — opposites that challenge each other
  const diff = Math.abs(userProfile.enneagram - candidate.enneagram);
  const growthBonus = diff >= 3 && diff <= 6 ? 8 : 0;

  return {
    overall: Math.min(composite + growthBonus, 99),
    enneagram: enneagramScore,
    attachment: attachScore,
    interests: interestScore,
    growthPotential: growthBonus > 0,
  };
};

// ── Shared Components ────────────────────────────────────────

const GlowOrb = ({ style }) => (
  <div
    style={{
      position: "absolute",
      borderRadius: "50%",
      filter: "blur(80px)",
      opacity: 0.15,
      pointerEvents: "none",
      ...style,
    }}
  />
);

const ProgressBar = ({ current, total }) => (
  <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        style={{
          flex: 1,
          height: 3,
          borderRadius: 2,
          background: i <= current ? COLORS.accent : COLORS.border,
          transition: "background 0.4s ease",
        }}
      />
    ))}
  </div>
);

const Button = ({ children, onClick, variant = "primary", disabled, style: extraStyle }) => {
  const [hovered, setHovered] = useState(false);
  const styles = {
    primary: {
      background: hovered ? COLORS.accent : COLORS.accentMid,
      color: hovered ? COLORS.bg : COLORS.accent,
      border: `1px solid ${COLORS.accent}`,
    },
    secondary: {
      background: hovered ? COLORS.surfaceLight : "transparent",
      color: COLORS.textMuted,
      border: `1px solid ${COLORS.border}`,
    },
    ghost: {
      background: "transparent",
      color: COLORS.textMuted,
      border: "none",
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "14px 32px",
        borderRadius: 12,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 15,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.3s ease",
        opacity: disabled ? 0.4 : 1,
        letterSpacing: "0.02em",
        ...styles[variant],
        ...extraStyle,
      }}
    >
      {children}
    </button>
  );
};

const Card = ({ children, style: extraStyle, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: COLORS.surface,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 16,
      padding: 24,
      cursor: onClick ? "pointer" : "default",
      transition: "all 0.3s ease",
      ...extraStyle,
    }}
  >
    {children}
  </div>
);

// ── SCREENS ──────────────────────────────────────────────────

// 1. WELCOME SCREEN
const WelcomeScreen = ({ onStart }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        position: "relative",
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        transition: "opacity 1s ease",
      }}
    >
      <GlowOrb style={{ width: 400, height: 400, background: COLORS.accent, top: -100, right: -100 }} />
      <GlowOrb style={{ width: 300, height: 300, background: COLORS.violet, bottom: -50, left: -50 }} />

      {/* Logo */}
      <div style={{ marginBottom: 16, fontSize: 48, letterSpacing: -2 }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", color: COLORS.accent }}>◎</span>
      </div>

      <h1
        style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: "clamp(48px, 8vw, 72px)",
          color: COLORS.text,
          marginBottom: 8,
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        halo
      </h1>

      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 16,
          color: COLORS.textMuted,
          marginBottom: 8,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        compatibility beyond the surface
      </p>

      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15,
          color: COLORS.textDim,
          maxWidth: 400,
          textAlign: "center",
          lineHeight: 1.7,
          marginBottom: 48,
          marginTop: 16,
        }}
      >
        Halo uses psychological frameworks — Enneagram, attachment theory,
        and values alignment — to match you with people you'll actually connect with.
      </p>

      <Button onClick={onStart}>Begin Your Assessment</Button>

      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          color: COLORS.textDim,
          marginTop: 24,
        }}
      >
        ~ 5 minutes · 12 questions · zero swiping
      </p>
    </div>
  );
};

// 2. ONBOARDING — Basic Info
const OnboardingScreen = ({ onComplete }) => {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [interests, setInterests] = useState([]);

  const interestOptions = [
    "meditation", "art", "hiking", "music", "travel", "cooking",
    "philosophy", "chess", "film", "yoga", "nature", "writing",
    "painting", "poetry", "astrology", "climbing", "startups",
    "debate", "science", "running", "fitness", "reading",
    "photography", "dancing", "gaming", "fashion",
  ];

  const toggleInterest = (i) => {
    setInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : prev.length < 6 ? [...prev, i] : prev
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "48px 32px",
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          color: COLORS.accent,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        Step 1 of 3
      </p>
      <h2
        style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 32,
          color: COLORS.text,
          marginBottom: 8,
        }}
      >
        The basics
      </h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: COLORS.textMuted, marginBottom: 36, lineHeight: 1.6 }}>
        We'll start simple before we go deep.
      </p>

      {/* Name */}
      <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: COLORS.textMuted, marginBottom: 8 }}>
        First name
      </label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        style={{
          background: COLORS.surfaceLight,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: "14px 18px",
          color: COLORS.text,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15,
          marginBottom: 24,
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
        }}
      />

      {/* Age */}
      <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: COLORS.textMuted, marginBottom: 8 }}>
        Age
      </label>
      <input
        value={age}
        onChange={(e) => setAge(e.target.value)}
        type="number"
        placeholder="26"
        style={{
          background: COLORS.surfaceLight,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: "14px 18px",
          color: COLORS.text,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15,
          marginBottom: 24,
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
        }}
      />

      {/* Interests */}
      <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: COLORS.textMuted, marginBottom: 12 }}>
        Select up to 6 interests
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 36 }}>
        {interestOptions.map((i) => {
          const selected = interests.includes(i);
          return (
            <button
              key={i}
              onClick={() => toggleInterest(i)}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                background: selected ? COLORS.accentSoft : "transparent",
                border: `1px solid ${selected ? COLORS.accent : COLORS.border}`,
                color: selected ? COLORS.accent : COLORS.textMuted,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {i}
            </button>
          );
        })}
      </div>

      <Button
        onClick={() => onComplete({ name, age: parseInt(age), interests })}
        disabled={!name || !age || interests.length < 3}
      >
        Continue →
      </Button>
    </div>
  );
};

// 3. ASSESSMENT SCREEN
const AssessmentScreen = ({ title, subtitle, questions, onComplete, step }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [animating, setAnimating] = useState(false);

  const handleAnswer = (option) => {
    if (animating) return;
    setAnimating(true);
    const newAnswers = [...answers, option];
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentQ + 1 < questions.length) {
        setCurrentQ(currentQ + 1);
        setAnimating(false);
      } else {
        onComplete(newAnswers);
      }
    }, 400);
  };

  const q = questions[currentQ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "48px 32px",
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          color: COLORS.accent,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {step}
      </p>
      <h2
        style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 28,
          color: COLORS.text,
          marginBottom: 4,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: COLORS.textMuted,
          marginBottom: 28,
        }}
      >
        {subtitle}
      </p>

      <ProgressBar current={currentQ} total={questions.length} />

      <p
        style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 20,
          color: COLORS.text,
          lineHeight: 1.5,
          marginBottom: 28,
          minHeight: 60,
          opacity: animating ? 0 : 1,
          transform: animating ? "translateY(-8px)" : "translateY(0)",
          transition: "all 0.3s ease",
        }}
      >
        {q.q}
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          opacity: animating ? 0 : 1,
          transform: animating ? "translateY(12px)" : "translateY(0)",
          transition: "all 0.3s ease",
        }}
      >
        {q.options.map((opt, i) => (
          <OptionButton key={`${currentQ}-${i}`} text={opt.text} onClick={() => handleAnswer(opt)} index={i} />
        ))}
      </div>

      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          color: COLORS.textDim,
          marginTop: 32,
          textAlign: "center",
        }}
      >
        {currentQ + 1} of {questions.length}
      </p>
    </div>
  );
};

const OptionButton = ({ text, onClick, index }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "16px 20px",
        borderRadius: 14,
        background: hovered ? COLORS.surfaceLight : COLORS.surface,
        border: `1px solid ${hovered ? COLORS.accent : COLORS.border}`,
        color: hovered ? COLORS.text : COLORS.textMuted,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14,
        textAlign: "left",
        cursor: "pointer",
        transition: "all 0.25s ease",
        lineHeight: 1.5,
        animationDelay: `${index * 0.06}s`,
      }}
    >
      {text}
    </button>
  );
};

// 4. RESULTS / PROFILE REVEAL
const ResultsScreen = ({ profile, onContinue }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setTimeout(() => setVisible(true), 200);
  }, []);

  const enneagramType = ENNEAGRAM_TYPES.find((t) => t.num === profile.enneagram);
  const attachmentStyle = ATTACHMENT_STYLES.find((s) => s.id === profile.attachment);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "48px 32px",
        maxWidth: 520,
        margin: "0 auto",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.8s ease",
      }}
    >
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          color: COLORS.accent,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: 32,
        }}
      >
        Your Halo Profile
      </p>

      {/* Enneagram Result */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>{enneagramType.icon}</div>
        <h2
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 36,
            color: COLORS.text,
            marginBottom: 4,
          }}
        >
          Type {enneagramType.num}
        </h2>
        <p
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 20,
            color: COLORS.accent,
            marginBottom: 8,
          }}
        >
          {enneagramType.name}
        </p>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: COLORS.textMuted,
            lineHeight: 1.6,
          }}
        >
          Core motivation: {enneagramType.core}
        </p>
      </div>

      {/* Attachment Result */}
      <Card style={{ width: "100%", marginBottom: 20 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: COLORS.textDim, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
          Attachment Style
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: attachmentStyle.color }} />
          <div>
            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: COLORS.text }}>{attachmentStyle.name}</p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: COLORS.textMuted }}>{attachmentStyle.desc}</p>
          </div>
        </div>
      </Card>

      {/* Fear & Desire */}
      <div style={{ display: "flex", gap: 12, width: "100%", marginBottom: 40 }}>
        <Card style={{ flex: 1 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: COLORS.rose, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Core Fear</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: COLORS.textMuted, lineHeight: 1.5 }}>{enneagramType.fear}</p>
        </Card>
        <Card style={{ flex: 1 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: COLORS.success, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Core Desire</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: COLORS.textMuted, lineHeight: 1.5 }}>{enneagramType.desire}</p>
        </Card>
      </div>

      <Button onClick={onContinue}>See Your Matches →</Button>
    </div>
  );
};

// 5. MATCHES SCREEN
const MatchesScreen = ({ userProfile, onViewMatch }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setTimeout(() => setVisible(true), 200);
  }, []);

  const matches = SAMPLE_PROFILES.map((p) => ({
    ...p,
    compatibility: calculateCompatibility(userProfile, p),
  }))
    .sort((a, b) => b.compatibility.overall - a.compatibility.overall)
    .slice(0, 6);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "48px 32px",
        maxWidth: 520,
        margin: "0 auto",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.6s ease",
      }}
    >
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          color: COLORS.accent,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        Your Matches
      </p>
      <h2
        style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 28,
          color: COLORS.text,
          marginBottom: 4,
        }}
      >
        Curated for you, {userProfile.name}
      </h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: COLORS.textMuted, marginBottom: 32, lineHeight: 1.6 }}>
        Ranked by psychological compatibility, not just surface-level preferences.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {matches.map((match, i) => (
          <MatchCard key={match.id} match={match} index={i} onClick={() => onViewMatch(match)} />
        ))}
      </div>
    </div>
  );
};

const MatchCard = ({ match, index, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const enneagramType = ENNEAGRAM_TYPES.find((t) => t.num === match.enneagram);
  const score = match.compatibility.overall;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: 20,
        borderRadius: 16,
        background: hovered ? COLORS.surfaceLight : COLORS.surface,
        border: `1px solid ${hovered ? COLORS.accent : COLORS.border}`,
        cursor: "pointer",
        transition: "all 0.3s ease",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: COLORS.accentSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          flexShrink: 0,
        }}
      >
        {match.photo}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: COLORS.text }}>
            {match.name}, {match.age}
          </p>
          {match.compatibility.growthPotential && (
            <span
              style={{
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 10,
                background: COLORS.violet + "33",
                color: COLORS.violet,
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "0.05em",
              }}
            >
              GROWTH
            </span>
          )}
        </div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: COLORS.textMuted }}>
          Type {match.enneagram} · {enneagramType.name} · {match.location}
        </p>
      </div>

      {/* Score */}
      <div style={{ textAlign: "center", flexShrink: 0 }}>
        <p
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 28,
            color: score >= 75 ? COLORS.success : score >= 55 ? COLORS.accent : COLORS.textMuted,
            lineHeight: 1,
          }}
        >
          {score}
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: COLORS.textDim, letterSpacing: "0.1em" }}>
          MATCH
        </p>
      </div>
    </div>
  );
};

// 6. MATCH DETAIL SCREEN
const MatchDetailScreen = ({ match, userProfile, onBack }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  const enneagramType = ENNEAGRAM_TYPES.find((t) => t.num === match.enneagram);
  const attachStyle = ATTACHMENT_STYLES.find((s) => s.id === match.attachment);
  const compat = match.compatibility;

  const ScoreBar = ({ label, score, color }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: COLORS.textMuted }}>{label}</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: COLORS.text }}>{score}%</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: COLORS.border }}>
        <div
          style={{
            height: "100%",
            borderRadius: 2,
            background: color,
            width: `${score}%`,
            transition: "width 1s ease",
          }}
        />
      </div>
    </div>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "32px 32px",
        maxWidth: 520,
        margin: "0 auto",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease",
      }}
    >
      <Button variant="ghost" onClick={onBack} style={{ padding: "8px 0", marginBottom: 24 }}>
        ← Back to matches
      </Button>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: COLORS.accentSoft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 40,
            margin: "0 auto 16px",
          }}
        >
          {match.photo}
        </div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: COLORS.text }}>
          {match.name}, {match.age}
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: COLORS.textMuted, marginTop: 4 }}>
          {match.location}
        </p>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: COLORS.textMuted,
            marginTop: 12,
            lineHeight: 1.6,
            fontStyle: "italic",
          }}
        >
          "{match.bio}"
        </p>
      </div>

      {/* Overall Score */}
      <Card style={{ textAlign: "center", marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <GlowOrb style={{ width: 200, height: 200, background: COLORS.accent, top: -80, right: -80 }} />
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: COLORS.textDim, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>
          Compatibility Score
        </p>
        <p
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 64,
            color: compat.overall >= 75 ? COLORS.success : COLORS.accent,
            lineHeight: 1,
            marginBottom: 8,
          }}
        >
          {compat.overall}
        </p>
        {compat.growthPotential && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: COLORS.violet }}>
            ✦ High growth potential pairing
          </p>
        )}
      </Card>

      {/* Breakdown */}
      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: COLORS.textDim, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 20 }}>
          Compatibility Breakdown
        </p>
        <ScoreBar label="Enneagram Alignment" score={compat.enneagram} color={COLORS.accent} />
        <ScoreBar label="Attachment Compatibility" score={compat.attachment} color={COLORS.violet} />
        <ScoreBar label="Shared Interests" score={compat.interests} color={COLORS.success} />
      </Card>

      {/* Psych Profile */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <Card style={{ flex: 1 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: COLORS.textDim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            Enneagram
          </p>
          <p style={{ fontSize: 24, marginBottom: 4 }}>{enneagramType.icon}</p>
          <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: COLORS.text }}>Type {match.enneagram}</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: COLORS.textMuted }}>{enneagramType.name}</p>
        </Card>
        <Card style={{ flex: 1 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: COLORS.textDim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            Attachment
          </p>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: attachStyle.color, marginBottom: 4 }} />
          <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: COLORS.text }}>{attachStyle.name}</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: COLORS.textMuted }}>{attachStyle.desc}</p>
        </Card>
      </div>

      {/* Interests */}
      <Card style={{ marginBottom: 32 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: COLORS.textDim, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
          Interests
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {match.interests.map((interest) => {
            const shared = userProfile.interests.includes(interest);
            return (
              <span
                key={interest}
                style={{
                  padding: "6px 14px",
                  borderRadius: 16,
                  background: shared ? COLORS.accentSoft : COLORS.surfaceLight,
                  border: `1px solid ${shared ? COLORS.accent : COLORS.border}`,
                  color: shared ? COLORS.accent : COLORS.textMuted,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                }}
              >
                {shared ? "✦ " : ""}{interest}
              </span>
            );
          })}
        </div>
      </Card>

      {/* CTA */}
      <div style={{ display: "flex", gap: 12 }}>
        <Button variant="secondary" onClick={onBack} style={{ flex: 1 }}>Pass</Button>
        <Button onClick={() => alert(`Connection request sent to ${match.name}! 💫`)} style={{ flex: 1 }}>Connect</Button>
      </div>
    </div>
  );
};

// ── MAIN APP ─────────────────────────────────────────────────
export default function HaloApp() {
  const [screen, setScreen] = useState("welcome");
  const [userProfile, setUserProfile] = useState({});
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Process Enneagram answers → determine type
  const processEnneagram = (answers) => {
    const scores = {};
    answers.forEach((ans) => {
      ans.types.forEach((t) => {
        scores[t] = (scores[t] || 0) + 1;
      });
    });
    return parseInt(
      Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]
    );
  };

  // Process Attachment answers → determine style
  const processAttachment = (answers) => {
    const scores = {};
    answers.forEach((ans) => {
      scores[ans.style] = (scores[ans.style] || 0) + ans.weight;
    });
    return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  };

  const handleScreenTransition = (nextScreen) => {
    setScreen(nextScreen);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      style={{
        background: COLORS.bg,
        minHeight: "100vh",
        position: "relative",
      }}
    >
      <link href={FONT_LINK} rel="stylesheet" />

      {screen === "welcome" && (
        <WelcomeScreen onStart={() => handleScreenTransition("onboarding")} />
      )}

      {screen === "onboarding" && (
        <OnboardingScreen
          onComplete={(data) => {
            setUserProfile((prev) => ({ ...prev, ...data }));
            handleScreenTransition("enneagram");
          }}
        />
      )}

      {screen === "enneagram" && (
        <AssessmentScreen
          step="Step 2 of 3"
          title="Enneagram Assessment"
          subtitle="Choose what resonates most — not what you think is 'right'."
          questions={ENNEAGRAM_QUESTIONS}
          onComplete={(answers) => {
            const type = processEnneagram(answers);
            setUserProfile((prev) => ({ ...prev, enneagram: type }));
            handleScreenTransition("attachment");
          }}
        />
      )}

      {screen === "attachment" && (
        <AssessmentScreen
          step="Step 3 of 3"
          title="Attachment Style"
          subtitle="Think about your patterns in past relationships."
          questions={ATTACHMENT_QUESTIONS}
          onComplete={(answers) => {
            const style = processAttachment(answers);
            setUserProfile((prev) => ({ ...prev, attachment: style }));
            handleScreenTransition("results");
          }}
        />
      )}

      {screen === "results" && (
        <ResultsScreen
          profile={userProfile}
          onContinue={() => handleScreenTransition("matches")}
        />
      )}

      {screen === "matches" && !selectedMatch && (
        <MatchesScreen
          userProfile={userProfile}
          onViewMatch={(match) => {
            setSelectedMatch(match);
            handleScreenTransition("matchDetail");
          }}
        />
      )}

      {screen === "matchDetail" && selectedMatch && (
        <MatchDetailScreen
          match={selectedMatch}
          userProfile={userProfile}
          onBack={() => {
            setSelectedMatch(null);
            handleScreenTransition("matches");
          }}
        />
      )}
    </div>
  );
}
