# Founding Engineer (AI/ML) — Potential Co-Founder
## Halo — Building the Autonomous Social Operating System

**Location:** San Francisco (Hybrid)  
**Compensation:** $130K–$180K + 1–3% Equity  
**Role Type:** Full-time, Founding Team Member

---

## About Halo

Halo is building the first autonomous social operating system—AI agents that negotiate meetings, find compatibility, and eliminate the friction of human connection. We're not a dating app. We're not a social network. We're building infrastructure for genuine relationships in an age of digital isolation. Backed by top-tier investors, we're assembling a small, elite team to solve one of the hardest problems in consumer AI.

---

## The Problem

**Loneliness is the defining epidemic of our generation.** 73% of young adults are lonely. Dating apps profit from keeping users single. Social platforms optimize for engagement, not connection. The result? An entire generation that knows how to scroll but has forgotten how to meet.

The fundamental issue: **Humans are terrible at initiating.** We fear rejection. We overthink timing. We let opportunities slip away. Meanwhile, existing platforms exploit this friction rather than solving it.

---

## The Solution

Halo deploys AI agents that act on your behalf. Your agent knows your schedule, your preferences, your social state. It negotiates with other agents to arrange meetings—venue, time, context—before you ever see a proposal. You simply approve or decline. Zero friction. Maximum serendipity.

**We win when users find love, friendship, and belonging.** Not when they stay addicted to our app.

---

## What You'll Build

This is not a maintenance role. You will architect and ship the core systems that power autonomous social coordination:

### 1. The Social State Threshold Engine
You'll build the behavioral modeling system that determines a user's receptivity to matches in real-time. Users exist in one of four dynamic states:
- **Starved** (threshold = 0.4): Accept lower-quality matches when desperate for connection
- **Normal** (threshold = 0.6): Standard quality bar for balanced matching
- **Cautious** (threshold = 0.7): Higher bar when selectively seeking specific connections
- **Overwhelmed** (threshold = 0.8): Only exceptional matches when capacity-constrained

This isn't a static rules engine. You'll build ML models that infer state transitions from behavioral signals—app usage patterns, response latency, calendar density, and implicit engagement metrics.

### 2. The Feedback Loop System
After every meeting, users rate: **"How did that feel?"** (Energizing / Neutral / Draining). You'll architect the reinforcement learning pipeline that translates this sparse, delayed feedback into updated matching weights. This system directly shapes the compatibility model that determines who meets whom. Get this wrong, and the entire product fails. Get this right, and you've built something no competitor can replicate.

### 3. Agent-to-Agent Negotiation Protocols
You'll design the communication layer where Halo agents negotiate meeting parameters—venue, time, context, group composition—before humans ever see a proposal. This requires:
- Multi-agent negotiation algorithms
- Preference aggregation under uncertainty
- Conflict resolution when agent objectives diverge
- Privacy-preserving disclosure protocols

### 4. The Six-Stage Matching Pipeline
Our matching engine runs every 60 seconds, executing:
1. Candidate discovery via geospatial and social graph queries
2. Compatibility scoring: **S = (0.30P + 0.30B + 0.20N + 0.20C)**
   - P = Profile alignment (interests, values, goals)
   - B = Behavioral compatibility (communication style, energy levels)
   - N = Network proximity (mutual connections, social overlap)
   - C = Contextual fit (timing, location, availability)
3. Threshold filtering based on Social State
4. Agent negotiation for logistics
5. Human approval interface
6. Post-meeting feedback ingestion

You'll own the latency, accuracy, and throughput of this entire pipeline.

### 5. Location Intelligence Infrastructure
You'll integrate and optimize the **Foursquare Places API** for real-time venue detection, category classification, and proximity-based matching. This includes:
- Background location processing with 24-hour retention limits (privacy-first)
- Venue fingerprinting for contextual match suggestions
- Geospatial indexing for sub-100ms candidate queries

### 6. Real-Time Communication Architecture
You'll build and scale **WebSocket servers** that enable sub-100ms agent-to-agent communication, supporting thousands of concurrent negotiation sessions with guaranteed message delivery and ordering.

---

## Must-Have Requirements

These are non-negotiable. We need someone who has shipped production systems in these domains:

### Core ML/AI
- **3+ years building recommendation systems** in production environments (not academic projects)
- **Proven experience with behavioral modeling**—predicting user actions from sparse, noisy signals
- Deep understanding of embedding-based retrieval and similarity search

### LLM Integration
- **Production experience with OpenAI API and/or Anthropic Claude APIs**
- Prompt engineering at scale—managing hundreds of prompt variants, A/B testing, and version control
- Understanding of LLM failure modes: hallucination, latency variance, cost optimization

### Vector Databases
- **Hands-on experience with Pinecone, Weaviate, or Chroma**
- Designed and optimized vector indices for high-throughput, low-latency retrieval
- Understanding of embedding model selection and dimensionality tradeoffs

### Location & Geospatial
- **Foursquare API proficiency**—Places API, venue search, category hierarchies
- Background location processing on iOS/Android with privacy-compliant data handling
- Geospatial indexing (PostGIS, Redis Geo, or similar)

### Real-Time Systems
- **WebSocket architecture**—connection management, horizontal scaling, fallback strategies
- Experience with event-driven architectures (Kafka, Redis Streams, or similar)
- Understanding of consensus protocols for distributed state management

### Engineering Fundamentals
- 5+ years of software engineering experience
- Python (data/ML) and TypeScript/Node.js (backend) fluency
- AWS or GCP infrastructure expertise
- Experience with CI/CD, monitoring, and on-call rotations

---

## Nice-to-Have (You'll Learn These If You Don't Know Them)

- Multi-agent reinforcement learning (MARL)
- Graph neural networks for social graph analysis
- iOS/Android native development
- Experience in consumer social, dating, or marketplace products
- Published research in recommender systems or computational social science
- Previous startup experience (especially pre-Series A)

---

## Why This Role Is Different

### You're Not Joining a Company. You're Co-Creating One.
This is a founding engineer role with a clear path to co-founder status. You'll have:
- Direct input on technical architecture, product direction, and company culture
- Board-level visibility within 12 months if you perform
- The opportunity to build a team around you as we scale

### The Technical Challenge Is Genuine
Most "AI startups" are thin wrappers around GPT-4. Halo is different:
- We're building proprietary behavioral models trained on interaction data no one else has
- Our agent negotiation protocols are genuine research problems
- The feedback loop system is a reinforcement learning challenge at the intersection of psychology and machine learning

### The Mission Matters
If we succeed, we don't just build a profitable company—we help solve the loneliness epidemic. Your code will directly determine whether two people who should meet, actually meet. That's a responsibility we take seriously.

### The Equity Is Real
1–3% equity for a founding engineer is substantial. If Halo reaches even modest success ($100M valuation), that's life-changing. If we achieve our ambitions, it's generational wealth.

---

## Interview Process

1. **30-min intro call** with the CEO—mission fit and role alignment
2. **Technical deep-dive** (90 min)—system design focused on our matching pipeline
3. **Take-home exercise** (4-6 hours)—build a simplified version of the Social State Threshold system
4. **Co-founder meeting**—meet the full team, discuss equity and role evolution
5. **Reference checks** and offer

---

## Ready to Build?

If you've read this far and feel the pull—the recognition that this is the problem you were meant to solve, the technical challenge that will stretch you to your limits—we want to talk to you.

**Apply with:**
1. Your resume or LinkedIn
2. A brief note on the hardest technical problem you've solved in a recommendation or behavioral modeling system
3. One specific idea for how you'd approach the Feedback Loop architecture

Send to: [founders@halosocial.ai]

---

*Halo is an equal opportunity employer. We celebrate diversity and are committed to creating an inclusive environment for all team members.*
