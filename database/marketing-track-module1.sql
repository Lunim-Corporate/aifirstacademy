BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

INSERT INTO tracks (id, title, description, level, role, estimated_hours, certificate_available) VALUES (
  uuid_generate_v4(),
  'Marketing Prompt Track',
  'Master AI prompting for high-converting marketing copy, brand voice consistency, and multi-channel content creation. Learn to use AI as your marketing content accelerator and campaign strategist.',
  'beginner',
  'marketer',
  40,
  true
);

INSERT INTO track_modules (id, track_id, title, description, estimated_hours, order_index) VALUES (
  uuid_generate_v4(),
  (SELECT id FROM tracks WHERE title = 'Marketing Prompt Track'),
  'Content Creation Mastery',
  'Master AI for high-converting marketing copy, learn brand voice consistency through prompting, and create multi-channel content efficiently across all major channels and formats.',
  12,
  1
);

INSERT INTO track_lessons (id, module_id, title, duration_minutes, type, level, content, video_url, order_index) VALUES

(uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Content Creation Mastery'), 'The Marketer''s Prompt Arsenal', 45, 'video', 'beginner',
'# The Marketer''s Prompt Arsenal

## Learning Objectives
- Master AI for high-converting marketing copy
- Learn brand voice consistency through prompting
- Create multi-channel content efficiently

## Introduction

Welcome to The Marketer''s Prompt Arsenal. Here, you''ll learn to create precise, creative AI prompts that boost conversion, brand consistency, and campaign impact across channels.

In digital marketing, the quality of your output directly depends on the quality of your prompts. Great prompts transform AI from a basic writing assistant into a strategic marketing partner that understands your brand, your audience, and your goals.

## Essential Patterns for Marketing Copy

Let''s break down the four essential prompt types for marketing:

### 1. Directive Prompts
Clear, action-oriented instructions that specify exactly what you want.

**Prompt Example:**
```
Write a 20-word Facebook ad introducing our eco-friendly app to college students, playful, urgent, memorable.
```

### 2. Role-Based Prompts
Position AI as a specific type of marketing professional.

**Prompt Example:**
```
You are an expert copywriter specializing in SaaS marketing. Write compelling product descriptions that emphasize benefits over features.
```

### 3. Constraint Prompts
Set specific limitations to guide output quality and format.

**Prompt Example:**
```
Create an Instagram caption under 150 characters, include 2 emojis, use conversational tone, end with question to drive engagement.
```

### 4. Format Prompts
Define the exact structure and presentation of the output.

**Prompt Example:**
```
Write 3 email subject lines in this format:
- Pain point + solution
- Social proof + benefit
- Urgency + clear action
```

## Brand Voice Integration Techniques

Merge your brand''s personality into every asset—consistency breeds trust. Always set voice attributes in your prompts.

**Prompt Example:**
```
Rewrite this product description using an authoritative yet humorous tone, maintaining our brand values of sustainability and innovation. Keep sentences under 20 words, use active voice, and include one unexpected metaphor.
```

## Platform-Specific Adaptations

Adapt every prompt to the channel for best-fit content. Instagram loves emotion and visuals; LinkedIn thrives on expertise.

### Platform-Specific Prompt Examples

**LinkedIn:**
```
Draft a LinkedIn post announcing our solution using a professional tone and client testimonial. Lead with industry insight, follow with case study data, end with thought-provoking question. 200-250 words.
```

**Instagram:**
```
Write an Instagram story caption with emoji and trending hashtag announcing our new feature. Emphasize visual appeal and FOMO, keep under 90 characters.
```

## Pro Example Board – Platform Variants

| Platform | Example Prompt | Output Preview |
|----------|---------------|----------------|
| Instagram | "Launch our app to students. Emoji, excitement, FOMO, 90 characters max." | "Meet your new campus hero! 🚀 Download now & win big. #StudentLife" |
| LinkedIn | "Announce product launch, focus on professionalism and long-term benefits." | "Exciting news: Our innovation empowers student success. Discover more…" |
| Twitter | "Share launch using humor and an app-centric hashtag." | "Tired of old apps? Try ours and thank us later! #FreshTech" |

## Interactive Exercise: Prompt Remix

Create three prompts for the same product, tailored for Facebook, Instagram, and LinkedIn. Use AI to generate and compare outputs. Jot down one difference for each.

**[PAUSE MARKER: 2 minutes for learner reflection]**

## Key Takeaways
- Prompt quality = Output quality
- Platform matters: Tailor every prompt to channel characteristics
- Consistency requires discipline: Define and document brand voice in prompts
- Four essential patterns: Directive, Role-based, Constraint, Format
- Build a library: Save and categorize successful prompts for reuse
',
null, 1),

(uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Content Creation Mastery'), 'High-Converting Copy Generation', 50, 'interactive', 'beginner',
'# High-Converting Copy Generation

## Learning Objectives
- Master the psychology of conversion-focused copy
- Create landing pages and sales emails that convert
- Use AI to optimize copy for clarity, trust, and action
- Apply proven copywriting frameworks through AI prompts

## The Power of Conversion Optimization

Success in marketing is all about conversions. Doubling your conversion rate delivers more ROI than doubling your budget. Today, we use prompt engineering to fuel copy that converts.

### The Conversion Rate Impact

**Scenario:** 10,000 monthly visitors to your landing page

| Conversion Rate | Conversions | Impact |
|----------------|-------------|---------|
| 2% | 200 | Baseline |
| 4% | 400 | +100% revenue (same traffic cost) |
| 6% | 600 | +200% revenue (same traffic cost) |

**Key Insight:** Small improvements in conversion copy create massive business impact.

## The Psychology of Conversion Copy

CRO is about understanding psychology:
- **Clarity** — Users know what''s offered
- **Trust** — Promises feel credible
- **Ease** — Action is frictionless

### The CRO Triad Framework

#### 1. Clarity Triggers
- Value proposition stated in < 5 seconds
- Benefits, not features
- Specific, quantifiable outcomes
- Remove ambiguity

**Weak:** "Our software helps businesses"
**Strong:** "Reduce customer support tickets by 40% in 30 days"

#### 2. Trust Signals
- Social proof (testimonials, case studies, user counts)
- Authority markers (certifications, awards, press mentions)
- Guarantees and risk reversals
- Transparent pricing

#### 3. Ease Accelerators
- Minimal form fields
- Clear next steps
- No jargon or technical barriers
- Mobile-optimized
- Fast loading

### AI Prompt for Conversion Analysis

```
Analyze the landing page copy below for clarity, trust, and motivation. Suggest improvements in value proposition and friction reduction.

[PASTE YOUR LANDING PAGE COPY]

Provide:
1. Clarity score (1-10) with specific improvements
2. Trust elements present and missing
3. Friction points that may cause abandonment
4. 3 specific rewrites for highest-impact sections
```

## Interactive Exercise

Select a page or email from your own brand. Mark sections that might cause friction or doubt. Re-write to increase clarity/trust.

**[PAUSE MARKER: 2 minutes to reflect]**

## Practical Sales Page & Email Prompts

Ready for results? Try these proven prompt patterns:

### Landing Page Headline + Subhead

```
Write a landing page headline and subhead for [product/service] that:
- Addresses primary pain point: [specific problem]
- Promises specific outcome: [result + timeframe]
- Includes urgency element
- Adds proof element (statistic or testimonial preview)
- Total length: Headline 6-10 words, Subhead 12-18 words
```

**Example Output:**
*Headline:* "Cut Support Tickets 40% in 30 Days"
*Subhead:* "Join 5,000+ teams using AI-powered helpdesk automation trusted by Fortune 500 companies"

### Email Sequence Prompts

```
Create three onboarding emails for [product/service]:

Email 1 - Warm Welcome (Day 0):
- Gratitude for signup
- Set expectations (what they''ll receive)
- Quick win (immediate value)
- Primary CTA: [action]

Email 2 - Top Usage Tip (Day 3):
- Most valuable feature
- Step-by-step usage guide
- Customer success story
- CTA: [action]

Email 3 - Upgrade Offer (Day 7):
- Recap value received
- Introduce premium features
- Limited-time incentive
- Strong urgency + guarantee
- CTA: [action]

Tone: [specify brand voice]
Length: Each email 150-200 words
```

## Ad Copy Optimization Techniques

Prompt and test ad copy variants:

### Instagram Ad Prompt

```
Write a 3-line ad using social validation for [product/service]:

Line 1: Hook (surprising stat or relatable pain point)
Line 2: Social proof (testimonial snippet or user count)
Line 3: CTA with benefit reminder

Include: 2-3 relevant emojis, 1-2 hashtags
Tone: [specify]
Character limit: 125 total
```

### Google Search Ad Prompt

```
Write a 90-character Google Search ad with urgent tone and clear offer:

Headline 1 (30 chars): Primary benefit + outcome
Headline 2 (30 chars): Urgency or offer
Headline 3 (30 chars): Trust signal or differentiation
Description (90 chars): Expanded benefit + CTA

Keywords to include: [list]
Unique selling point: [specify]
```

## Pro Example Board – CTA & Social Proof Pairings

| Persona | Message Hook | Best Channel | Offer Type | Social Proof Used |
|---------|-------------|--------------|------------|------------------|
| Sophia (Busy Professional) | "Saves you 2+ hours/week" | YouTube | Calendar templates | "Used by 20,000 planners" |
| Ravi (Commuter) | "Digest in 3 mins, on commute" | WhatsApp | Infographic | Peer voice notes |
| Gemma (Eco-conscious) | "Certified plastic-free" | Instagram | Unboxing Reel | Eco-influencer collab |

## Key Takeaways
- Psychology drives conversion: Clarity + Trust + Ease = Conversions
- Frameworks provide structure: Use proven copywriting patterns
- Specificity wins: Vague promises lose to concrete outcomes
- Proof builds trust: Social proof and guarantees reduce risk
- Testing is mandatory: Always create and test multiple variations
- AI accelerates iteration: Generate 10 variations in the time it took to write one
',
null, 2),

(uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Content Creation Mastery'), 'Social Media Content Factory', 45, 'sandbox', 'beginner',
'# Social Media Content Factory

## Learning Objectives
- Master platform-specific content strategies
- Create viral-worthy content using AI prompts
- Build sustainable content production systems
- Design month-long content calendars efficiently

## Part 1: The Social Content Landscape

Great social prompts tap popular topics, emotion, and tailored formats for each platform. The days of "post and pray" are over—strategic content creation combines audience psychology, platform algorithms, and cultural trends.

### Platform-Specific Characteristics

| Platform | Optimal Length | Best Format | Peak Engagement | Audience Mindset |
|----------|---------------|-------------|-----------------|------------------|
| Instagram | 125-150 chars | Reels, Carousels, Stories | 11am, 7pm | Discovery & inspiration |
| TikTok | 100-150 chars | Short video, Trends | 9pm, 12pm | Entertainment & trends |
| LinkedIn | 150-250 words | Text posts, Documents | 8am, 12pm, 5pm | Professional learning |
| Twitter/X | 71-100 chars | Text, Threads | 12pm, 5-6pm | Real-time conversation |

## Part 2: Platform-Specific Prompt Patterns

### Instagram Prompts
```
Create Instagram carousel post (10 slides) for [topic]:
- Slide 1: Bold statement with contrasting background
- Slides 2-9: One tip per slide, consistent layout
- Slide 10: CTA with brand colors
- Design style: Minimalist, bold typography
- Include emoji strategy and hashtag recommendations
```

### TikTok Prompts
```
Create TikTok script for 30-second life hack:
- 00:00-00:03: Pattern interrupt hook
- 00:04-00:15: Problem identification
- 00:16-00:25: Solution demonstration
- 00:26-00:30: CTA with trending sound
- Tone: Energetic, relatable, authentic
```

## Interactive Exercise

Write and test two prompts for scheduled posts. Test on different platforms, note engagement potential.

**[PAUSE MARKER: 3 minutes]**

## Pro Example Board – Social Post Formats

| Platform | Post Type | Prompt Instruction | Output Example |
|----------|-----------|-------------------|----------------|
| Instagram | Carousel | "Write 5 captions: tip, benefit, story, CTA, Q" | "Tip 1: Plan your week..." |
| TikTok | Video Script | "Create 30-sec life hack, energetic tone" | "Ever forget...?" |
| LinkedIn | Thought Post | "Share stat and personal insight, max 3 lines" | "89% of marketers..." |

## Key Takeaways
- Platform-native content wins
- Hooks determine success in first 3 seconds
- Batch creation scales production
- Data drives decisions
',
null, 3),

(uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Content Creation Mastery'), 'Blog and Article Acceleration', 40, 'interactive', 'beginner',
'# Blog and Article Acceleration

## Learning Objectives
- Master structure-first content creation
- Integrate SEO keywords effectively
- Use AI to accelerate blog production
- Create comprehensive article outlines

## Part 1: Structure-First Content

Always prompt for outline first, then fill each section.

### Blog Outline Prompt
```
Write a comprehensive blog outline for "[Topic]":

Structure:
- Introduction (hook with statistic + problem)
- 3-5 main sections with H2 headings
- Each section: 2-3 subsections with H3 headings
- Case study or real example
- Actionable takeaways section
- Strong CTA

SEO Requirements:
- Primary keyword: [keyword]
- Secondary keywords: [list 3-5]
- Target word count: 1500-2000
- Include FAQ section
```

## Interactive Exercise

Pick your next blog topic. Prompt for structure, expand one section, note improvements.

**[PAUSE MARKER: 4 minutes]**

## Part 2: SEO Integration

```
Generate SEO-optimized blog post outline:

Primary Keyword: [keyword]
Secondary Keywords: [list]
Structure: Title with keyword, H2 with variations
Meta description: 150-160 characters
Include internal linking opportunities (3-5)
```

## Pro Example Board – Blog Elements

| Section | Prompt Sample | Output Example |
|---------|--------------|----------------|
| Intro | "Open with statistic and urgent question" | "73%…But how ready are you?" |
| Key Point | "Explain with case study, add expert quote" | "As Lisa Brown notes..." |
| CTA | "Close with action: Download guide" | "Ready? Download now." |

## Key Takeaways
- Structure first, write second
- SEO from the start
- AI accelerates expansion 10x
- Readability matters
',
null, 4),

(uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Content Creation Mastery'), 'Visual Content Prompting', 35, 'interactive', 'beginner',
'# Visual Content Prompting

## Learning Objectives
- Master AI prompts for visual content
- Design infographics using AI assistance
- Create video scripts with visual direction
- Align visuals with brand identity

## Part 1: AI for Visual Design

### Infographic Prompting
```
Create infographic outline for [topic]:

Brand Alignment:
- Brand colors: [hex codes]
- Fonts: [primary and secondary]
- Style: [modern/classic/playful]

Structure:
- Header: Compelling statistic
- 3 benefit blocks with icons
- Visual hierarchy emphasizing benefit 2
- Footer with CTA

Deliverable: Dimensions, format, resolution
```

### Video Script with Visual Direction
```
Write 30-second explainer script:

00:00-00:05 - Hook (surprising question)
00:06-00:15 - Problem identification
00:16-00:25 - Solution showcase
00:26-00:30 - Strong CTA

Include:
- On-screen text suggestions
- Visual direction (what to show)
- Tone indicators for voiceover
```

## Part 2: Platform-Specific Visuals

### Instagram Visual Prompts
```
Create Instagram carousel concept:
- 10 slides, square (1080x1080)
- Slide 1: Bold statement
- Slides 2-9: One tip per slide
- Slide 10: CTA with brand colors
- Design style: Minimalist, bold typography
```

## Interactive Exercise

Create visual prompts for:
1. Instagram Reel thumbnail
2. Presentation slide
3. Email header image

**[PAUSE MARKER: 5 minutes]**

## Key Takeaways
- Specificity is critical for quality
- Brand consistency matters
- Platform optimization essential
- Iterate ruthlessly
',
null, 5),

(uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Content Creation Mastery'), 'Brand Voice Consistency', 30, 'sandbox', 'beginner',
'# Brand Voice Consistency

## Learning Objectives
- Define and document brand voice attributes
- Use AI to maintain voice consistency
- Create brand voice guidelines
- Audit content for voice alignment

## Part 1: The Power of Consistent Voice

Consistency is the engine for trust. Brand voice is how you say what you say.

### Components of Brand Voice

**Tone Attributes:**
- Formal ↔ Casual
- Serious ↔ Playful
- Respectful ↔ Irreverent

**Language Choices:**
- Technical ↔ Simple
- Direct ↔ Descriptive

**Emotional Character:**
- Empathetic ↔ Authoritative
- Optimistic ↔ Realistic

## Part 2: Creating Guidelines

### Brand Voice Definition Prompt
```
Help me define our brand voice:

Company: [name and description]
Target audience: [description]
Values: [core values]

Create guidelines including:
- 3-5 voice attributes with definitions
- DO and DON''T examples for each
- Sample phrases embodying our voice
- Common mistakes to avoid
- Channel-specific adaptations
```

## Part 3: Applying Voice

### Voice Alignment Prompt
```
Rewrite this with optimistic, confident voice:

[PASTE CONTENT]

Brand Voice Attributes:
- [Attribute 1]: [Description]
- [Attribute 2]: [Description]

Key brand words: [list 10-15]
Avoid: [words/phrases to never use]
```

## Interactive Exercise

1. Define brand voice (3-5 attributes)
2. Find 3 existing content pieces
3. Audit for voice consistency
4. Rewrite off-brand sections

**[PAUSE MARKER: 8 minutes]**

## Key Takeaways
- Document your voice
- Consistency builds trust
- AI maintains standards at scale
- Audit regularly
',
null, 6),

(uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Content Creation Mastery'), 'Email Marketing Mastery', 45, 'interactive', 'beginner',
'# Email Marketing Mastery

## Learning Objectives
- Master email subject line optimization
- Create high-converting email sequences
- Personalize at scale using AI
- Design effective automation flows

## Part 1: Email Performance Hierarchy

1. **Subject Line (40%)** - Gets opened
2. **Preview Text (20%)** - Reinforces subject
3. **Email Content (30%)** - Delivers value
4. **CTA (10%)** - Drives action

## Part 2: Subject Line Mastery

```
Create 10 subject lines for [campaign]:

Test psychological triggers:
- Urgency (3 variations)
- Curiosity (3 variations)
- Social Proof (2 variations)
- Personalization (2 variations)

Parameters:
- Length: 30-50 characters
- Avoid spam triggers
- Include power words
- A/B test ready
```

## Part 3: Email Sequences

### Welcome Sequence
```
Create 3-email welcome sequence:

Email 1 (Send: Within 1 hour)
- Welcome and thank you
- Set expectations
- Quick win
- CTA: [first action]

Email 2 (Send: Day 3)
- Feature highlight
- Usage guide
- Success story
- CTA: [engagement]

Email 3 (Send: Day 7)
- Upgrade opportunity
- Limited offer
- Address objections
- CTA: [conversion]
```

## Part 4: Personalization at Scale

```
Create variants for segments:

Segment 1: New Users (0-7 days)
Segment 2: Active Users (last 30 days)
Segment 3: Dormant Users (60+ days)

For each:
- Personalized subject line
- Relevant content
- Segment-specific CTA
```

## Interactive Exercise

Create complete email sequence:
1. Choose type (Welcome/Nurture/Re-engagement)
2. Define audience
3. Write 3-email prompts
4. Generate with AI
5. Add personalization

**[PAUSE MARKER: 10 minutes]**

## Key Takeaways
- Subject lines are critical (40%)
- Sequences outperform one-offs
- Personalization scales with AI
- Test systematically
- Automation saves time
',
null, 7),

(uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Content Creation Mastery'), 'Video Script Creation', 40, 'interactive', 'beginner',
'# Video Script Creation

## Learning Objectives
- Master video script structure
- Create engaging hooks
- Write platform-optimized scripts
- Include visual direction

## Part 1: Hook-Story-Proof-CTA Framework

- **Hook (3 seconds):** Stop the scroll
- **Story/Problem (10-15 seconds):** Identify problem
- **Proof/Solution (20-30 seconds):** Present solution
- **CTA (5-10 seconds):** Clear next step

### Example Prompt
```
Write 60-second explainer script:

Product: [describe]
Audience: [who]
Benefit: [primary value]

Script Format:
00:00-00:05 - Hook
00:06-00:20 - Problem
00:21-00:50 - Solution
00:51-00:60 - CTA

For each: voiceover, on-screen text, visual direction
```

## Part 2: Platform-Specific Scripts

### YouTube (60-90 seconds)
```
Create YouTube explainer:

00:00-00:05 - Hook (surprising question)
00:06-00:30 - Problem (viewer pain point)
00:31-00:70 - Solution (product demo)
00:71-00:90 - Proof + CTA (testimonial)

Include: voiceover style, music, pace, transitions
```

### TikTok/Reels (15-30 seconds)
```
Write TikTok script:

00:00-00:03 - Pattern interrupt
00:04-00:12 - Value delivery
00:13-00:20 - Proof/example
00:21-00:30 - CTA + engagement

Include: trending sound, hashtags, on-screen text
```

## Part 3: Hook Mastery

### 10 Proven Hook Formulas
1. Surprising Statistic: "[X%] don''t know..."
2. Common Mistake: "Stop doing [X]..."
3. Transformation: "Before I found..."
4. Myth-Busting: "Everything you know is wrong"
5. Insider Secret: "What nobody tells you..."
6. Result-First: "I achieved [X] in [time]..."
7. Contrarian: "You don''t need [X]"
8. Story: "This happened last week..."
9. Challenge: "If you can''t [X], watch this"
10. Visual: "Watch what happens when..."

## Interactive Exercise

Create 60-second video script:
1. Choose platform and topic
2. Use Hook-Story-Proof-CTA
3. Include visual direction
4. Add on-screen text
5. Specify music and transitions
6. Create 3 hook variations

**[PAUSE MARKER: 12 minutes]**

## Key Takeaways
- Hook determines success
- Structure provides clarity
- Visual direction is essential
- Platform optimization matters
- CTAs drive action
- Test hooks systematically
',
null, 8),

(uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Content Creation Mastery'), 'Module 1 Practice Project', 60, 'practice', 'beginner',
'# Module 1: Content Creation Mastery - Final Practice Project

## Project Overview

Apply everything learned to create a complete multi-channel content campaign using AI prompting.

## Project Objectives

Demonstrate mastery of:
- Strategic prompt engineering
- Brand voice consistency
- Platform-specific content adaptation
- Multi-channel campaign coordination
- AI-assisted content at scale

## Deliverables

### 1. Campaign Strategy Document
- Campaign objectives (SMART goals)
- Target audience persona (detailed)
- Key messaging pillars (3-5)
- Brand voice guidelines
- Success metrics and KPIs
- Complete prompt library

### 2. Multi-Channel Content Suite

**A. Email Marketing (4 emails)**
- Welcome, nurture, social proof, conversion emails
- 3 subject line variations each
- Preview text and layout notes

**B. Social Media (20 posts)**
- Instagram: 5 posts
- LinkedIn: 5 posts
- Twitter: 5 posts
- TikTok: 5 video scripts

**C. Blog Content (2 articles)**
- Educational piece (1500-2000 words)
- Product-focused (1000-1500 words)

**D. Video Content (2 scripts)**
- 60-second explainer
- 15-30 second social video

**E. Visual Concepts (3 designs)**
- Infographic outline
- Carousel post design
- Email header concept

### 3. Brand Voice Guide
- 3-5 voice attributes
- DO and DON''T examples
- Application examples
- Quality checklist

### 4. Pro Example Boards (2)
- Platform Adaptation Matrix
- Persona-Channel-Message Matrix

### 5. Campaign Calendar
- 30-day content schedule
- Content mix ratios
- Cross-platform coordination
- A/B testing schedule

### 6. Reflective Summary (500-750 words)
- Prompt engineering learnings
- Content quality assessment
- Process improvements
- Strategic insights

## Evaluation Criteria

- **Comprehensiveness (20%):** All components included
- **Content Quality (25%):** Professional-grade execution
- **Brand Consistency (20%):** Voice maintained
- **Strategic Thinking (20%):** Clear rationale
- **AI Utilization (15%):** Effective prompting

## Timeline

**Week 1:** Strategy and planning
**Week 2:** Content creation
**Week 3:** Refinement and submission

## Success Tips

1. Start with strategy
2. Document all prompts
3. Iterate ruthlessly
4. Maintain consistency
5. Think holistically
6. Quality over quantity

This project demonstrates your mastery of AI-powered content creation.

Good luck!
',
null, 9);

COMMIT;

SELECT
    t.title as track_title,
    tm.title as module_title,
    COUNT(tl.id) as lessons_count,
    SUM(tl.duration_minutes) as total_minutes,
    ROUND(SUM(tl.duration_minutes) / 60.0, 1) as total_hours
FROM tracks t
JOIN track_modules tm ON t.id = tm.track_id
LEFT JOIN track_lessons tl ON tm.id = tl.module_id
WHERE t.title = 'Marketing Prompt Track'
AND tm.title = 'Content Creation Mastery'
GROUP BY t.id, t.title, tm.id, tm.title;