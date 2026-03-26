# HALO: GET PEOPLE ON IT

**March 2026**

---

## THE LINK

```
https://app-eight-alpha-38.vercel.app
```

Works on any device. Phone, laptop, tablet. No app store needed.

---

## THE ASK

You need **10-20 people** to go through IRIS and get matched. That's Level 4 validation. Here's how to make it happen.

---

## MESSAGE TEMPLATES

### Close Friends (Text/iMessage)

> Hey, I need a favor. I'm building a dating thing called Halo — instead of swiping, an AI agent talks to you for 15 min, figures out who you are, and matches you with someone for a real coffee date. I need people to test it. Takes 15 min on your phone. You in?
>
> https://app-eight-alpha-38.vercel.app

### Acquaintances / Wider Network (Text/DM)

> Hey — random ask. I'm working on something called Halo. It's a new approach to dating where an AI agent interviews you, builds a profile, and matches you with compatible people for an actual meetup. No swiping, no photos, no browsing. I need 10-20 people in SF to test it. All you do is open a link and have a 15-min conversation. Interested?
>
> https://app-eight-alpha-38.vercel.app

### LinkedIn / Professional Network

> I'm building Halo — an autonomous matching system that uses AI to deeply understand compatibility and coordinate real-world meetings. Think matchmaker, but powered by a conversational AI agent instead of a human.
>
> We're running our first validation round in SF and I'm looking for 10-20 people willing to spend 15 minutes having a conversation with our AI agent. No app download needed — just a browser.
>
> If you're single, in the Bay Area, and curious about what an AI thinks it knows about you, DM me.

### Group Chat Drop

> Alright who's single and wants to be a guinea pig. I built a thing where an AI talks to you for 15 min, figures out your personality, and matches you with someone for coffee. Need 10+ people to test it. Link: https://app-eight-alpha-38.vercel.app

---

## WHAT THEY'LL EXPERIENCE

1. **Sign in** — Enter email, get a magic link (no password, no app download)
2. **Enter name** — First name only
3. **Talk to IRIS** — 15-minute AI conversation. 5 deep questions about how they connect, what they value, how they handle conflict. IRIS reads between the lines.
4. **See their profile** — EQ score, personality traits, attachment style, values map
5. **Get matched** — When enough people are in, IRIS matches them based on 6 dimensions
6. **You coordinate the meetup** — For now, you manually connect matched pairs for coffee

---

## YOUR PLAYBOOK

### Week 1: Recruit

- [ ] Text 20-30 people using the templates above
- [ ] Target: get 10-20 confirmed "yes I'll do it"
- [ ] Mix of personality types — don't just ask your 10 most similar friends
- [ ] Ideally all in SF (for the meetup part)

### Week 2: Onboard

- [ ] Follow up with anyone who said yes but hasn't opened the link
- [ ] Check Supabase for completed profiles (see Monitoring section below)
- [ ] Answer any questions that come up (see FAQ below)

### Week 3-4: Match + Meet

- [ ] Once 5+ profiles are complete, check the `matches` table
- [ ] Text each matched pair separately: "Hey, Halo matched you with someone. Free for coffee this week?"
- [ ] Suggest a specific venue + time (don't leave it open-ended)
- [ ] After they meet, ask one question: "How was it? Energizing, neutral, or draining?"

### Week 4+: Collect Data

- [ ] Get feedback from every person who met someone
- [ ] Ask a mutual friend of each tester: "Does this profile sound like them?" (show them the IRIS profile)
- [ ] Compile results into the scorecard below

---

## MONITORING

### Supabase Dashboard

- URL: https://supabase.com/dashboard
- Project ID: fxtcxegxktlmhciljzed

| Table | What to Check |
|-------|--------------|
| `users` | Who has signed up (name, email, created_at) |
| `profiles` | Who completed IRIS (has summary, traits, eq_score) |
| `matches` | Generated matches (user_a, user_b, compatibility_score, status) |
| `match_feedback` | Post-meeting feedback (response, dimension ratings) |

### Quick Health Checks

- **Nobody showing up?** The magic link email might be going to spam. Tell people to check spam/promotions.
- **IRIS conversation seems stuck?** Could be an API rate limit or Anthropic outage. Check Vercel logs.
- **Profile looks empty?** The user may have quit the conversation early. IRIS needs all 5 questions answered.

---

## FAQ (WHAT PEOPLE WILL ASK)

**"Do I need to download an app?"**
No. It's a website. Open the link in your phone's browser.

**"What data do you collect?"**
Just the conversation with IRIS. No photos, no social media, no location tracking. Your conversation is stored to build your profile. You can ask me to delete it anytime.

**"Can I see who I'm matched with before meeting?"**
Not yet. The whole point is that IRIS matches you based on compatibility, not appearance. You'll get a compatibility score and conversation starter, but no photo or last name.

**"Is this a dating app?"**
It starts with dating. The engine works for any type of connection — friendship, mentorship, professional — but we're proving it with dating first because that's where the problem is worst.

**"Why should I trust an AI?"**
You shouldn't yet. That's why we're testing. If people who know you say IRIS got your personality right, and the people you meet say it was worth showing up, then it works. If not, we fix it.

**"Is this safe?"**
Meetings happen in public venues only. No home addresses, no last names shared until after you meet. You can decline any match.

**"The email didn't come through"**
Check spam/promotions folder. The magic link comes from Supabase (noreply@mail.app.supabase.io). If it still doesn't work, try a different email.

---

## SCORECARD

After your test round, fill this in. This is your Level 4 validation data.

| Metric | Target | Actual | Pass? |
|--------|--------|--------|-------|
| People recruited | 10-20 | | |
| Completed IRIS conversation | 80%+ of recruited | | |
| Matches generated | 5+ pairs | | |
| Pairs who met for coffee | 70%+ (7/10) | | |
| Said "worth it" | 50%+ (5/10) | | |
| Profile accuracy (friend-confirmed) | 75%+ | | |
| Want to do it again | 30%+ | | |

**If you hit these numbers, you have proof.** Not projections, not demos — real humans who met through your system and said it worked.

---

## VENUES (SF)

Good spots for a first Halo meetup — public, easy to find, easy to leave:

**Marina:**
- The Interval at Long Now (Fort Mason) — quiet, interesting, low pressure
- Cafe Reveille (North Point) — casual, outdoor seating
- Wrecking Ball Coffee (Union St) — small but good energy

**Castro:**
- Starbucks Reserve (Market & Castro) — big, easy landmark
- Thorough Bread (Church St) — bakery, low-key
- Cafe Flore (Market & Noe) — classic, iconic

**Hayes Valley:**
- Ritual Coffee (Valencia) — spacious
- Sightglass (7th St) — good for longer conversations

Pick the venue for them. Don't ask "where do you want to meet?" — that creates friction and delays.

---

## COST

| Item | Estimate |
|------|----------|
| Anthropic API (20 IRIS conversations) | ~$50-100 |
| Coffee gift cards (10 meetups x $15) | ~$150 |
| Your time (coordination) | ~10-15 hours over 4 weeks |
| **Total** | **~$200-250** |

Not $3K. The earlier estimate was padded. The real cost of Level 4 is a couple hundred bucks and your time.

---

## WHAT TO DO WITH THE RESULTS

Once you have data:

1. **Update the roadmap** — Level 4 goes from "PENDING" to "GO" or "NO-GO" with real numbers
2. **Update pitch materials** — Replace "projected" with "validated" wherever the data supports it
3. **Write a build-in-public post** — Use Variation 3 (Personal) from `11-launch-posts.md`, but now with real results
4. **Start investor conversations** — The story is: "I built this alone, tested it with 20 real people, X% said it worked. Here's what I need to scale it."
