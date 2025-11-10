BEGIN;

INSERT INTO track_modules (id, track_id, title, description, estimated_hours, order_index) VALUES (
  uuid_generate_v4(),
  (SELECT id FROM tracks WHERE title = 'Marketing Prompt Track'),
  'Customer Research and Insights',
  'Master AI-powered customer research methodologies including persona development, market research automation, competitor analysis, and customer journey mapping to fuel data-driven marketing strategies.',
  10,
  2
);

INSERT INTO track_lessons (id, module_id, title, duration_minutes, type, level, content, video_url, order_index) VALUES

(uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Customer Research and Insights'), 'Persona Development Through AI', 60, 'video', 'beginner',
'# Persona Development Through AI

## Learning Objectives
- Understand why detailed personas are vital for marketing performance
- Use prompt engineering to drive AI-based persona research
- Uncover motivations, objections, and behavior patterns
- Micro-segment customer personas for campaign precision
- Link personas to every major marketing strategy and channel
- Validate and keep personas current with real-world data

## Introduction

Welcome to Persona Development Through AI. We''ll move from broad, outdated customer stereotypes to data-powered, evolving personas that guide every marketing decision.

Most marketers think of personas as "nice-to-have" but struggle beyond simple demographic sketches. Failure to build useful personas leads to wasted spend, flat campaigns, and misaligned teams.

## What is a Modern Marketing Persona?

A modern persona is:
- A composite sketch based on real data and behavior
- A living document updated as new insights arrive
- The "conversation partner" for every important marketing decision
- The foundation for segmentation, targeting, message, offer, channel, and content

### Persona Impact in Numbers

- Marketers using detailed personas achieve **3x higher email open rates** and **2x higher conversion rates**
- Companies that revisit personas quarterly see **campaign ROI increase by 25%**
- Persona-driven content gets shared **twice as often** as non-targeted content

## Why Personas Matter

### Case Study Timeline

**Year 1:** Company launches campaign using surface personas → Weak CTR, ad fatigue, high acquisition cost

**Year 2:** Company rebuilds personas using AI with psychographics, purchase barriers, channel preferences → **+33% lead quality, -21% CAC**, and NPS climbs

## AI Prompt Engineering Fundamentals

### Three-Part Prompt Framework

**Context:** Who is the AI, what''s the business/brand/vertical, who is the audience?

**Action:** What exactly do you want—persona creation, synthesis, segmentation?

**Result:** What detail level, sections, and insights are expected?

### Example Prompt

```
Context:
You are a senior market and behavioral researcher in the fitness app industry.

Action:
Synthesize a persona for "busy, 25-40 year-old working professional" using reviews, app analytics, and social comments.

Result:
Include demographics, daily routine, trigger for using app, decision-makers, top frustrations, channels where ads are clicked, trusted influencers, buying time, response to new features.
```

## From Prompt to Persona - Real Example

**Persona:**
- Name: Emily Carter
- Age: 31
- Role: Freelance designer, remote, focused on digital wellness
- Routine: Morning meditation, checks health blogs during breakfast, works hybrid
- Pain Points: "Overwhelmed by too many health choices, worries about realness of reviews, won''t try without return option"
- Preferred Content: Instagram Reels, Skimm newsletter, Reddit fitness forums
- Objection: Hates long onboarding, dislikes pushy discount popups
- Buying Trigger: Social proof, limited-edition launches

## Interactive Exercise

Draft your own persona prompt using the three-part structure:
1. Choose one real audience for your business
2. Specify at least five unique attributes
3. Generate with AI and review output

**[PAUSE MARKER: 3 minutes for practice]**

## Extracting Deep Psychological Insights

### The Interview Technique

Engage AI persona in virtual "interview" to evoke authentic, first-person answers:

```
Imagine you are Emily Carter from the persona created earlier.
Answer in first person:

1. What frustrates you most when looking for products like ours?
2. What prevents you from completing a purchase?
3. Which brands do you trust and why?
4. Describe a recent positive purchase experience
5. What message or content grabs your attention?
6. How do you prefer to receive information?
```

### Sample AI Output

"I get frustrated by hidden fees and slow delivery... I dread pushy sales tactics and prefer honest customer opinions... I love brands that share real behind-the-scenes stories..."

## Emotional Drivers & Purchase Barriers

Key considerations:
- **Fear of loss:** Wasting money or time?
- **Social proof:** How much do reviews matter?
- **Trust triggers:** Guarantees, certifications, sourcing?
- **Effort:** Sensitivity to complexity or confusing UX?
- **Relevance:** What messaging feels authentic?

## Interactive Exercise

Create 3 interview-style questions for your AI persona to reveal hidden purchase emotions and barriers.

**[PAUSE MARKER: 4 minutes for practice]**

## Micro-Segmentation for Maximum Relevance

Build micro-segments: distinct variations based on life stage, values, or channel behaviors.

### Why Micro-Segmentation?

- Enhances message precision
- Tailors offers and channels appropriately
- Enables hyper-personalization
- Drives higher engagement and conversion

### Micro-Segment Example Table

| Segment | Key Trait | Content Preference | Primary Objection | Channel | CTA Style |
|---------|-----------|-------------------|-------------------|---------|-----------|
| New Parents | Time-starved | Quick tips, family-friendly | Price sensitivity | Facebook, Email | Save time with simple buys |
| Remote Workers | Tech savvy | Video demos, workflow hacks | Delivery speed | LinkedIn, Instagram | Get expert tips now |
| Eco-conscious | Sustainability | Brand stories, ethical sourcing | Greenwashing fears | TikTok, Twitter | Join the eco movement |

### Prompt for Micro-Segments

```
From persona Emily Carter, create two micro-segments based on life stage and media consumption.
Describe their buying pain points, content preferences, and ideal CTA for each.
```

## Interactive Exercise

Create at least two micro-segments for your persona. Fill worksheet with insights and messaging strategies.

**[PAUSE MARKER: 5 minutes]**

## Mapping Personas to Strategies

### Persona-to-Strategy Framework

1. **Pain Point → Content Angle:** "comparison fatigue" → "Head-to-head video demos"
2. **Media Habit → Placement:** TikTok themes vs. LinkedIn whitepapers
3. **Trust Barriers → Social Proof:** Reviews, guarantee badges, user UGC
4. **Objection → Offer Structure:** Trial, no-card checkout, trust logos
5. **Emotional Driver → CTA Framing:** "Be first" (early adopters) vs. "Rest easy" (skeptics)

## Interactive Exercise

Map your persona to campaign elements:
1. Name one key frustration
2. Develop content theme to address it
3. Choose best channel
4. Write ad headline with motivator
5. Specify tailored CTA

**[PAUSE MARKER: 4 minutes]**

## Pro Example Board - Campaign Elements

| Persona | Message Hook | Best Channel | Offer Type | Social Proof |
|---------|-------------|--------------|------------|-------------|
| Sophia | "Saves you 2+ hours/week" | YouTube | Calendar templates | "Used by 20,000 planners" |
| Ravi | "Digest in 3 mins on commute" | WhatsApp | Infographic | Peer voice notes |
| Gemma | "Certified plastic-free" | Instagram | Unboxing Reel | Eco-influencer collab |

## Validating and Evolving Personas

### Validation Techniques

1. **Behavioral Validation:** Compare assumptions with analytics
2. **Conversion Check:** Line up persona needs with abandonment reasons
3. **Synthetic Testing:** AI role-play scenarios

### Validation Prompt

```
Present this landing page copy to persona Ravi.
Ask: "What do you like?" "What''s missing?" "What would you need to click Buy?"
Record answers and revise copy accordingly.
```

## Interactive Exercise

1. Select campaign landing page
2. Feed to persona via AI simulation
3. Capture feedback for mismatches
4. List two concrete revisions

**[PAUSE MARKER: 3 minutes]**

## Persona Evolution Timeline

- **Q1:** Initial persona → First campaign
- **Q2:** Analytics comparison, pain point update
- **Q3:** A/B creative and content tests
- **Q4:** Persona refresh and next-year mapping

## Key Takeaways

- Prompt quality = Persona depth
- Psychological depth enables emotional targeting
- Micro-segmenting unlocks mass personalization
- Persona-to-campaign mapping maximizes ROI
- Ongoing data validation keeps personas alive

## Assignment

Submit two fully developed personas with:
- Demographics and psychographics
- Day-in-life narrative
- Three micro-segments
- Message mapping grid
- AI-driven synthetic feedback simulation
',
null, 1),

(uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Customer Research and Insights'), 'Market Research Automation', 45, 'interactive', 'beginner',
'# Market Research Automation

## Learning Objectives
- Automate competitive intelligence and market trend analysis using AI
- Design prompts that synthesize data from multiple sources
- Identify market gaps and opportunities at scale
- Create comprehensive market reports in minutes instead of weeks
- Build ongoing market monitoring systems

## Introduction

Market research traditionally requires weeks of manual data collection, analysis, and synthesis. AI-powered automation transforms this into minutes of strategic prompting, enabling real-time market intelligence.

## The Market Research Challenge

Traditional market research faces:
- **Time constraints:** Weeks to gather and analyze data
- **Cost barriers:** Expensive research firms and tools
- **Data overload:** Too much information, hard to synthesize
- **Staleness:** Reports outdated by publication
- **Limited scope:** Can''t monitor continuously

## AI-Powered Market Research Framework

### Five Core Research Types

1. **Market Sizing:** TAM, SAM, SOM analysis
2. **Competitive Intelligence:** Feature comparison, positioning analysis
3. **Trend Identification:** Emerging patterns and shifts
4. **Customer Sentiment:** Voice of customer across channels
5. **Opportunity Gaps:** Unmet needs and white space

## Market Sizing Prompts

### Total Addressable Market (TAM) Prompt

```
Analyze the total addressable market for [product/service] in [geographic region]:

Calculate:
- Total potential customers in target demographic
- Average customer lifetime value
- Market growth rate (last 3 years)
- Projected growth (next 5 years)

Include:
- Primary data sources used
- Assumptions made
- Confidence levels
- Risk factors affecting market size

Present findings in:
- Executive summary (3 key numbers)
- Detailed breakdown by segment
- Visual representation concept
- Strategic implications
```

### Serviceable Addressable Market (SAM) Prompt

```
From the TAM calculated above, determine SAM for [product]:

Filter by:
- Geographic reach (where we can actually operate)
- Customer segments we can serve
- Price point accessibility
- Distribution channel limitations
- Regulatory constraints

Calculate realistic market we can capture:
- Number of reachable customers
- Revenue potential
- Market share benchmarks
- Competitive density in SAM
```

## Competitive Intelligence Automation

### Competitor Analysis Prompt

```
Conduct comprehensive competitor analysis for [company/product]:

Analyze top 5 competitors:

For each competitor provide:
1. Core Value Proposition
   - Main messaging themes
   - Differentiation claims
   - Target audience positioning

2. Product/Service Features
   - Feature matrix comparison
   - Pricing tiers
   - Unique capabilities
   - Notable gaps

3. Marketing Strategy
   - Channel mix (social, paid, content)
   - Content themes and frequency
   - Brand voice and tone
   - Campaign examples

4. Customer Perception
   - Review sentiment analysis
   - Common praise points
   - Frequent complaints
   - NPS indicators

5. Strategic Position
   - Market share estimates
   - Growth trajectory
   - Recent pivots or launches
   - Vulnerabilities

Present as:
- Competitor matrix table
- SWOT for each competitor
- Competitive positioning map
- Strategic recommendations
```

## Interactive Exercise

Create a competitor analysis prompt for your industry. Include at least 3 competitors and 5 analysis dimensions.

**[PAUSE MARKER: 5 minutes]**

## Trend Identification and Analysis

### Emerging Trend Research Prompt

```
Identify and analyze emerging trends in [industry/market]:

Research methodology:
- Social media trend analysis (hashtags, discussions)
- News and publication monitoring
- Search volume data patterns
- Industry report synthesis
- Expert opinion aggregation

For each trend identified:

1. Trend Description
   - What is changing
   - Key drivers
   - Timeline of emergence

2. Impact Assessment
   - Potential market impact (high/medium/low)
   - Affected customer segments
   - Required business adaptations
   - Competitive implications

3. Opportunity Analysis
   - First-mover advantages
   - Revenue potential
   - Investment required
   - Risk factors

4. Action Recommendations
   - Immediate next steps
   - Resource requirements
   - Timeline for action
   - Success metrics

Present trends ranked by:
- Impact potential
- Urgency to act
- Alignment with capabilities
```

## Customer Sentiment Analysis

### Voice of Customer Synthesis Prompt

```
Synthesize customer sentiment from multiple sources for [product/category]:

Data sources to analyze:
- Product reviews (Amazon, G2, Capterra, etc.)
- Social media mentions and discussions
- Support ticket themes
- Community forum conversations
- Survey responses (if available)

Extract:

1. Sentiment Distribution
   - Overall positive/neutral/negative percentages
   - Sentiment by feature or aspect
   - Sentiment trends over time

2. Key Themes
   - Top 5 praise points with examples
   - Top 5 complaint areas with examples
   - Feature requests and frequency
   - Comparison mentions (vs. competitors)

3. Customer Language
   - Common phrases and terminology
   - Pain point descriptions
   - Success story patterns
   - Decision trigger words

4. Insight Synthesis
   - Unmet needs identified
   - Moments of delight
   - Friction points
   - Improvement priorities

Deliver as:
- Executive summary
- Detailed theme analysis
- Verbatim quote collection
- Strategic recommendations
```

## Market Gap Analysis

### Opportunity Gap Identification Prompt

```
Identify market gaps and unmet needs in [industry/category]:

Analysis framework:

1. Customer Job-to-be-Done Analysis
   - What customers are trying to accomplish
   - Current solutions they use
   - Workarounds and hacks
   - Satisfaction gaps

2. Feature Gap Analysis
   - Features customers want but don''t exist
   - Features poorly executed by current solutions
   - Emerging needs from trend analysis
   - Technology enablement opportunities

3. Segment Gap Analysis
   - Underserved customer segments
   - Over-served segments (opportunity for simplification)
   - New segments forming
   - Cross-segment opportunities

4. Channel Gap Analysis
   - Distribution channels not utilized
   - Content types missing
   - Engagement methods underused
   - Platform opportunities

5. Price/Value Gap Analysis
   - Price points not addressed
   - Value configurations missing
   - Business model innovations possible

For each gap identified:
- Size of opportunity (customers affected)
- Revenue potential
- Competitive intensity
- Barriers to entry
- Strategic fit with our capabilities
- Investment required
- Time to market
- Risk assessment

Prioritize gaps by:
- Impact (revenue potential)
- Feasibility (time + resources)
- Strategic alignment
- Competitive advantage potential
```

## Interactive Exercise

Conduct a market gap analysis for your product category. Identify at least 3 significant gaps and rank by opportunity size.

**[PAUSE MARKER: 8 minutes]**

## Automated Market Monitoring System

### Ongoing Monitoring Prompt Template

```
Create a weekly market intelligence briefing for [company/product]:

Monitor and report on:

1. Competitive Moves
   - New product launches
   - Pricing changes
   - Marketing campaign themes
   - Partnership announcements
   - Leadership changes

2. Market Trends
   - Search volume shifts
   - Social conversation topics
   - News coverage themes
   - Industry event insights

3. Customer Sentiment Shifts
   - Review sentiment changes
   - New complaint themes
   - Praise point evolution
   - Feature request trends

4. Regulatory/Industry Changes
   - New regulations affecting market
   - Industry standard updates
   - Economic indicators
   - Technology shifts

5. Opportunity Alerts
   - Competitor vulnerabilities identified
   - Emerging customer needs
   - Channel opportunities
   - Partnership possibilities

Format as:
- Executive summary (key insights)
- Detailed sections by category
- Action items requiring attention
- Long-term strategic implications

Delivery: Weekly summary, urgent alerts as needed
```

## Synthesizing Multiple Data Sources

### Multi-Source Synthesis Prompt

```
Synthesize comprehensive market picture from these data sources:

Sources:
1. Industry reports: [list reports]
2. Competitor analysis: [findings]
3. Customer research: [survey results]
4. Social listening: [sentiment data]
5. Sales data: [win/loss patterns]
6. Support tickets: [theme analysis]

Create integrated analysis:

1. Consistent Themes
   - What all sources agree on
   - High-confidence insights
   - Strategic certainties

2. Conflicting Signals
   - Where sources disagree
   - Explanation of conflicts
   - Additional research needed

3. Unique Insights
   - Discoveries from specific sources
   - Unexpected patterns
   - Hidden opportunities

4. Strategic Narrative
   - Coherent market story
   - Key forces shaping market
   - Future trajectory
   - Our positioning opportunity

5. Action Plan
   - Immediate priorities
   - Medium-term initiatives
   - Long-term strategic moves
   - Resource allocation guidance
```

## Pro Example Board - Research Applications

| Research Type | Prompt Focus | Key Output | Strategic Use |
|--------------|-------------|------------|---------------|
| Market Sizing | TAM/SAM/SOM calculation | $500M TAM, $50M SAM | Investment decision, goal setting |
| Competitive | Feature gaps, positioning | 3 key differentiators | Product roadmap, messaging |
| Trend Analysis | Emerging patterns | Remote work tools trend | New product development |
| Sentiment | Customer pain points | Top 5 frustrations | Product improvement priority |
| Gap Analysis | Unmet needs | Underserved SMB segment | Market entry strategy |

## Key Takeaways

- AI transforms weeks of research into minutes of strategic prompting
- Multi-source synthesis provides comprehensive market intelligence
- Automated monitoring enables real-time market awareness
- Gap analysis reveals strategic opportunities
- Structured prompts ensure consistent, actionable insights
- Regular research cadence maintains competitive advantage

## Assignment

Create a comprehensive market research report:
1. Market sizing for your product category
2. Competitive intelligence on top 3 competitors
3. Trend analysis identifying 2 emerging trends
4. Customer sentiment synthesis
5. Gap analysis with 3 prioritized opportunities
6. Weekly monitoring system design
',
null, 2),

(uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Customer Research and Insights'), 'Competitor Analysis Prompts', 40, 'sandbox', 'beginner',
'# Competitor Analysis Prompts

## Learning Objectives
- Design AI prompts for deep competitive intelligence
- Analyze competitor strategies across all marketing channels
- Identify competitive advantages and vulnerabilities
- Create actionable competitive positioning strategies
- Monitor competitors continuously for strategic shifts

## Introduction

Competitive intelligence separates market leaders from followers. AI-powered competitor analysis enables continuous, comprehensive competitive monitoring at scale.

## Comprehensive Competitor Framework

### Four-Layer Analysis Model

1. **Product/Service Layer:** Features, pricing, positioning
2. **Marketing Layer:** Channels, messaging, campaigns
3. **Customer Layer:** Reviews, sentiment, loyalty
4. **Strategic Layer:** Business model, partnerships, direction

## Product Competitive Analysis

### Feature Comparison Prompt

```
Create comprehensive feature comparison for [product category]:

Competitors to analyze: [List 3-5 competitors]

For each competitor document:

1. Core Features
   - Feature list with descriptions
   - Unique capabilities
   - Feature quality ratings
   - Recent additions

2. Pricing Structure
   - Pricing tiers
   - Feature-to-price mapping
   - Discounting strategies
   - Free trial offerings

3. User Experience
   - Onboarding flow
   - Interface complexity
   - Mobile experience
   - Integration capabilities

4. Technical Specs
   - Performance benchmarks
   - Scalability
   - Security features
   - API availability

Present as:
- Feature comparison matrix
- Competitive positioning map
- Gap analysis
- Strategic recommendations
```

## Marketing Strategy Analysis

### Channel Mix Analysis Prompt

```
Analyze competitor marketing channel strategy:

Competitor: [Company name]

Research across:

1. Paid Advertising
   - Platforms used (Google, Facebook, LinkedIn, etc.)
   - Ad formats and creative themes
   - Estimated budget allocation
   - Target keywords and audiences
   - Ad copy themes and CTAs

2. Content Marketing
   - Blog frequency and topics
   - Content formats (articles, videos, podcasts)
   - SEO strategy and keyword targeting
   - Content quality and depth
   - Engagement metrics

3. Social Media
   - Platform presence and activity
   - Posting frequency
   - Content themes
   - Engagement rates
   - Influencer partnerships

4. Email Marketing
   - Email frequency
   - Subject line patterns
   - Content structure
   - CTA strategies
   - Automation sequences

5. Events and Partnerships
   - Event participation
   - Strategic partnerships
   - Co-marketing initiatives
   - Community building

Synthesize:
- Channel effectiveness ranking
- Budget allocation estimates
- Strategic focus areas
- Opportunity gaps for us
```

## Customer Perception Analysis

### Review Sentiment Comparison Prompt

```
Compare customer sentiment across competitors in [category]:

Competitors: [List]

For each competitor analyze:

1. Overall Sentiment
   - Positive/neutral/negative distribution
   - Average rating across platforms
   - Sentiment trend (improving/declining)

2. Praise Themes
   - Top 5 strengths mentioned
   - Frequency of each theme
   - Verbatim examples
   - Consistency across platforms

3. Complaint Themes
   - Top 5 pain points
   - Severity and frequency
   - Resolution patterns
   - Recurring issues

4. Feature Discussions
   - Most mentioned features
   - Sentiment by feature
   - Feature requests
   - Competitive comparisons in reviews

5. Customer Segments
   - Who loves them (personas)
   - Who struggles (anti-personas)
   - Use case patterns
   - Industry/company size patterns

Create:
- Sentiment comparison matrix
- Competitive review analysis
- Opportunity identification
- Messaging implications
```

## Strategic Positioning Analysis

### Business Model Analysis Prompt

```
Analyze competitive business model and strategy:

Competitor: [Company]

Examine:

1. Revenue Model
   - Primary revenue streams
   - Pricing philosophy
   - Customer acquisition approach
   - Monetization innovations

2. Market Strategy
   - Target segments prioritized
   - Geographic focus
   - Vertical specialization
   - Market entry approach

3. Growth Strategy
   - Customer acquisition channels
   - Expansion approach
   - Product development philosophy
   - M&A activity

4. Competitive Moat
   - Defensible advantages
   - Network effects
   - Switching costs
   - Brand strength
   - Technology barriers

5. Vulnerabilities
   - Strategic weaknesses
   - Market exposure risks
   - Operational constraints
   - Customer dissatisfaction areas

Deliver:
- Strategic assessment
- Competitive positioning
- Attack vectors for us
- Defensive priorities
```

## Interactive Exercise

Create a comprehensive competitor analysis for your top competitor covering all four layers (Product, Marketing, Customer, Strategic).

**[PAUSE MARKER: 10 minutes]**

## Competitive Monitoring System

### Continuous Monitoring Prompt

```
Design competitor monitoring dashboard:

Track weekly:

1. Product Changes
   - New features announced
   - Pricing adjustments
   - Product discontinuations
   - Beta program launches

2. Marketing Activity
   - New campaigns detected
   - Content themes shifts
   - Channel strategy changes
   - Partnership announcements

3. Customer Sentiment Shifts
   - Review rating changes
   - Emerging complaint themes
   - Praise pattern evolution
   - Support response quality

4. Strategic Signals
   - Executive changes
   - Funding announcements
   - Market expansion moves
   - Technology acquisitions

Alert immediately on:
- Major product launches
- Significant pricing changes
- Negative sentiment spikes
- Strategic pivots

Format: Weekly digest + urgent alerts
```

## Pro Example Board - Competitive Insights

| Analysis Type | Key Finding | Strategic Implication | Our Action |
|--------------|-------------|---------------------|------------|
| Feature Gap | Competitor lacks mobile app | Mobile-first opportunity | Accelerate mobile dev |
| Pricing | All competitors $99-$199/mo | Price ceiling identified | Premium positioning at $149 |
| Sentiment | 40% complain about support | Service differentiation | Invest in support excellence |
| Channel | Weak LinkedIn presence | B2B opportunity | Double LinkedIn investment |

## Key Takeaways

- Four-layer analysis provides complete competitive picture
- Continuous monitoring catches strategic shifts early
- Customer sentiment reveals positioning opportunities
- Feature gap analysis guides product roadmap
- Channel analysis identifies underutilized opportunities
- Business model understanding reveals strategic vulnerabilities
',
null, 3),

(uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Customer Research and Insights'), 'Customer Journey Mapping', 35, 'video', 'beginner',
'# Customer Journey Mapping

## Learning Objectives
- Create comprehensive customer journey maps using AI
- Identify touchpoints, emotions, and pain points at each stage
- Design interventions to improve journey experiences
- Map journeys for multiple personas and segments
- Use journey insights to optimize marketing and product

## Introduction

Customer journey mapping reveals how customers actually experience your brand across all touchpoints, not how you think they do. AI accelerates journey mapping from weeks to hours while enabling deeper insights.

## The Customer Journey Framework

### Five-Stage Journey Model

1. **Awareness:** First encounter with problem or solution
2. **Consideration:** Research and evaluation phase
3. **Decision:** Purchase or commitment moment
4. **Experience:** Product usage and value realization
5. **Advocacy:** Renewal, expansion, or referral

## Journey Mapping Fundamentals

### Comprehensive Journey Map Prompt

```
Create detailed customer journey map for [persona] buying [product/service]:

For each stage (Awareness, Consideration, Decision, Experience, Advocacy):

1. Customer Actions
   - What they''re doing
   - Where they''re looking
   - Who they''re talking to
   - Questions they have

2. Touchpoints
   - Channels encountered
   - Content consumed
   - People involved
   - Tools used

3. Customer Thoughts
   - Internal dialogue
   - Concerns and fears
   - Hopes and desires
   - Decision criteria evolving

4. Emotions
   - Emotional state
   - Frustrations
   - Moments of delight
   - Confidence level

5. Pain Points
   - Friction experienced
   - Obstacles encountered
   - Information gaps
   - Process difficulties

6. Opportunities
   - Intervention points
   - Improvement possibilities
   - Competitive advantages
   - Innovation potential

Present as:
- Visual journey map concept
- Stage-by-stage narrative
- Touchpoint inventory
- Priority intervention list
```

## Awareness Stage Deep Dive

### Awareness Research Prompt

```
Map awareness stage for [persona] discovering [category/problem]:

Explore:

1. Problem Recognition
   - How do they realize they have this problem?
   - What triggers awareness?
   - Who influences recognition?
   - Urgency level at recognition

2. Initial Research
   - First information sources consulted
   - Search queries used
   - People asked for advice
   - Content types consumed

3. Solution Discovery
   - How do they find potential solutions?
   - Brand discovery moments
   - Influencer impact
   - Peer recommendations

4. Emotional Journey
   - Initial feelings (confusion, frustration, hope)
   - Confidence in finding solution
   - Skepticism levels
   - Motivation drivers

5. Key Touchpoints
   - Search engines
   - Social media
   - Review sites
   - Industry publications
   - Peer conversations

Identify:
- Highest-impact touchpoints
- Content gaps
- Messaging opportunities
- Competitive presence
```

## Interactive Exercise

Map the awareness stage for your primary persona. Identify 5 key touchpoints and the emotions at each.

**[PAUSE MARKER: 5 minutes]**

## Multi-Persona Journey Comparison

### Comparative Journey Prompt

```
Compare customer journeys for three personas:

Persona 1: [Description]
Persona 2: [Description]
Persona 3: [Description]

For each stage, compare:

1. Journey Length
   - Time from awareness to decision
   - Research intensity
   - Touchpoint quantity

2. Key Differences
   - Unique touchpoints
   - Decision criteria variations
   - Information needs
   - Emotional patterns

3. Common Elements
   - Shared touchpoints
   - Universal pain points
   - Consistent emotions
   - Similar questions

4. Intervention Priorities
   - Persona-specific optimizations
   - Universal improvements
   - Segment-specific content needs

Create:
- Comparison matrix
   - Journey length
   - Key touchpoints
   - Critical moments
   - Opportunity areas
```

## Touchpoint Optimization

### Touchpoint Analysis Prompt

```
Analyze and optimize key touchpoints in customer journey:

Touchpoint: [Specific touchpoint, e.g., "Product demo call"]

Evaluate:

1. Current State
   - What happens now
   - Customer expectations
   - Actual experience delivered
   - Gap between expectation and reality

2. Customer Perspective
   - What they need at this point
   - Questions they have
   - Concerns to address
   - Desired outcomes

3. Friction Points
   - Where do they get stuck?
   - What causes confusion?
   - What creates doubt?
   - What delays progress?

4. Moments of Truth
   - Critical decision moments
   - Trust-building opportunities
   - Value demonstration points
   - Relationship deepening chances

5. Optimization Opportunities
   - Quick wins (easy, high impact)
   - Strategic improvements
   - Innovation possibilities
   - Competitive differentiators

Provide:
- Current vs. ideal state comparison
- Prioritized improvement list
- Implementation roadmap
- Success metrics
```

## Emotional Journey Mapping

### Emotion Tracking Prompt

```
Map emotional journey for [persona] through [journey stage]:

Track emotional progression:

1. Entry Emotions
   - How do they feel entering this stage?
   - Confidence level
   - Anxiety sources
   - Hope and excitement

2. Emotional Transitions
   - What causes emotional shifts?
   - Positive triggers
   - Negative triggers
   - Neutral moments

3. Peak Emotions
   - Highest highs (delight moments)
   - Lowest lows (frustration peaks)
   - Surprising emotions
   - Unexpected reactions

4. Exit Emotions
   - How do they feel leaving this stage?
   - Emotional trajectory
   - Unresolved concerns
   - Carried forward feelings

5. Design Interventions
   - How to amplify positive emotions
   - How to mitigate negative emotions
   - How to build confidence
   - How to maintain momentum

Create emotional journey curve visualization concept with key moments marked.
```

## Key Takeaways

- Journey mapping reveals reality vs. assumptions
- Five stages provide comprehensive view
- Emotions drive decisions as much as logic
- Touchpoint optimization has multiplier effect
- Multi-persona comparison reveals priorities
- Continuous journey research keeps insights fresh
',
null, 4),

(uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Customer Research and Insights'), 'Survey and Interview Design', 30, 'video', 'beginner',
'# Survey and Interview Design

## Learning Objectives
- Design effective surveys that generate actionable insights
- Create interview guides that elicit deep customer understanding
- Use AI to analyze qualitative and quantitative research data
- Avoid common survey and interview biases
- Scale research insights across customer segments

## Introduction

Great surveys and interviews uncover the "why" behind customer behavior. AI helps design better research instruments and analyzes results faster while maintaining research rigor.

## Survey Design Fundamentals

### Comprehensive Survey Design Prompt

```
Design customer research survey for [objective]:

Survey Goal: [Specific research question]
Target Audience: [Persona/segment]
Expected Responses: [Number]

Create survey including:

1. Screening Questions (2-3)
   - Qualify right respondents
   - Segment for analysis
   - Detect attention/quality

2. Core Questions (10-15)
   - Mix of multiple choice, scale, and open-ended
   - Logical flow and grouping
   - Avoid leading questions
   - Include attention checks

3. Demographic Questions (3-5)
   - Essential segments only
   - Non-intrusive
   - Optional where appropriate

For each question provide:
- Question text
- Response options
- Question type
- Analysis approach
- Why this question matters

Include:
- Opening message (purpose, time)
- Closing message (thanks, next steps)
- Estimated completion time
- Mobile-friendly considerations
```

## Question Type Selection

### Question Design Framework

**Use Multiple Choice when:**
- Need quantifiable data
- Want easy analysis
- Have clear option set
- Tracking over time

**Use Scale Questions when:**
- Measuring satisfaction
- Assessing importance
- Rating features
- Tracking sentiment

**Use Open-Ended when:**
- Need qualitative depth
- Exploring new territory
- Want verbatim quotes
- Understanding "why"

### Example Questions by Type

**Multiple Choice:**
"Which best describes how you discovered our product?"
- Search engine
- Social media
- Recommendation
- Advertisement
- Other: ___

**Scale (1-5):**
"How likely are you to recommend our product?"
1 (Not likely) → 5 (Very likely)

**Open-Ended:**
"What almost prevented you from purchasing?"

## Avoiding Survey Bias

### Bias Prevention Checklist

❌ **Leading Questions:** "Don''t you agree our product is great?"
✅ **Neutral Alternative:** "How would you rate your experience?"

❌ **Double-Barreled:** "Is the product fast and easy to use?"
✅ **Separate:** "How would you rate speed?" + "How would you rate ease of use?"

❌ **Loaded Language:** "How much do you love our amazing new feature?"
✅ **Neutral:** "How would you rate the new feature?"

❌ **Assumption-Based:** "What do you like about our customer service?"
✅ **Open:** "Describe your customer service experience."

## Interview Guide Design

### Interview Guide Prompt

```
Create interview guide for [research objective]:

Research Question: [Specific goal]
Interviewee Profile: [Persona/role]
Interview Length: 30-45 minutes

Design guide with:

1. Opening (5 min)
   - Build rapport
   - Explain purpose
   - Set expectations
   - Permission to record

2. Background Questions (5-10 min)
   - Role and responsibilities
   - Current situation/context
   - Relevant history
   - Decision-making authority

3. Core Topic Exploration (20-25 min)
   - Main research questions
   - Follow-up probes
   - Story elicitation
   - Specific examples

4. Depth Questions (5-10 min)
   - "Why" exploration
   - Emotional drivers
   - Barrier identification
   - Alternative considerations

5. Closing (5 min)
   - Anything missed
   - Final thoughts
   - Next steps
   - Thank you

For each question include:
- Primary question
- 2-3 follow-up probes
- What you''re really trying to learn
- Red flags to listen for
```

## Interview Techniques

### Active Listening Framework

**Key Techniques:**

1. **Silence:** Pause after answers - they''ll fill silence with gold
2. **Echo:** Repeat last few words - prompts elaboration
3. **Clarifying:** "Tell me more about..."
4. **Challenging:** "You said X, but also Y. Help me understand..."
5. **Emotional Probing:** "How did that make you feel?"

### Probe Question Library

- "Can you give me a specific example?"
- "Walk me through what happened..."
- "What were you thinking at that moment?"
- "What would have made that better?"
- "Why is that important to you?"
- "What almost stopped you?"
- "If you could change one thing..."

## Interactive Exercise

Design a 10-question survey OR a 30-minute interview guide for your product research need.

**[PAUSE MARKER: 8 minutes]**

## Survey Analysis with AI

### Quantitative Analysis Prompt

```
Analyze survey results:

Survey Topic: [Topic]
Responses: [Number]

Analyze:

1. Response Distribution
   - Key finding percentages
   - Segment breakdowns
   - Notable patterns
   - Outliers

2. Cross-Tabulation
   - How demographics correlate with responses
   - Segment differences
   - Cohort patterns

3. Statistical Significance
   - Confidence intervals
   - Significant differences
   - Trend strength

4. Open-Ended Themes
   - Common themes
   - Sentiment analysis
   - Quote categories
   - Frequency counts

Deliver:
- Executive summary
- Key insights
- Segment analysis
- Recommendations
```

## Key Takeaways

- Question design determines data quality
- Mix quantitative and qualitative
- Avoid leading and biased questions
- Probing questions reveal depth
- AI accelerates analysis
- Iterate surveys based on results
',
null, 5),

(uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Customer Research and Insights'), 'Data Analysis Conversations', 45, 'interactive', 'beginner',
'# Data Analysis Conversations

## Learning Objectives
- Use AI as data analysis partner for marketing insights
- Transform raw data into actionable strategic recommendations
- Design prompts that extract patterns from complex datasets
- Create data visualizations and reports through AI
- Ask better analytical questions to uncover hidden insights

## Introduction

AI transforms data analysis from technical barrier to conversational exploration. Non-technical marketers can now interrogate data like seasoned analysts through strategic prompting.

## Conversational Data Analysis Framework

### The Three-Question Method

1. **What happened?** Descriptive analysis
2. **Why did it happen?** Diagnostic analysis
3. **What should we do?** Prescriptive analysis

## Descriptive Analysis Prompts

### Campaign Performance Analysis

```
Analyze marketing campaign performance data:

Campaign: [Name]
Date Range: [Period]
Channels: [List]

Data provided:
- Impressions: [number]
- Clicks: [number]
- Conversions: [number]
- Spend: [amount]
- Revenue: [amount]

Analyze:

1. Performance Overview
   - CTR, conversion rate, CPA, ROAS
   - Performance vs. benchmarks
   - Trend direction

2. Channel Breakdown
   - Performance by channel
   - Channel efficiency comparison
   - Budget allocation vs. results

3. Temporal Patterns
   - Day-of-week performance
   - Time-of-day analysis
   - Weekly trends

4. Cohort Analysis
   - New vs. returning customer performance
   - Segment-level results
   - Geographic patterns

Deliver:
- Executive summary
- Key metrics dashboard
- Performance insights
- Anomaly identification
```

## Diagnostic Analysis Prompts

### Root Cause Analysis

```
Investigate performance issue:

Observation: [Specific metric decline/issue]
Context: [Relevant background]

Analyze potential causes:

1. Campaign Factors
   - Creative fatigue signals
   - Targeting changes
   - Budget/bid adjustments
   - Competitive pressure

2. External Factors
   - Seasonality patterns
   - Market conditions
   - Industry trends
   - Economic indicators

3. Technical Factors
   - Tracking issues
   - Website performance
   - User experience problems
   - Conversion funnel leaks

4. Audience Factors
   - Audience quality changes
   - Segment shifts
   - Behavior pattern changes
   - Saturation signals

Provide:
- Most likely causes (ranked)
- Supporting evidence
- Tests to confirm
- Immediate actions
```

## Pattern Recognition Prompts

### Trend Identification

```
Identify patterns and trends in data:

Dataset: [Description]
Time Period: [Range]
Metrics: [List]

Find:

1. Obvious Patterns
   - Clear trends (up/down/stable)
   - Seasonal cycles
   - Day/time patterns
   - Recurring events

2. Hidden Patterns
   - Subtle correlations
   - Leading indicators
   - Unexpected relationships
   - Anomalous events

3. Segment Patterns
   - Customer behavior differences
   - Geographic variations
   - Channel preferences
   - Device/platform trends

4. Predictive Signals
   - Early warning indicators
   - Growth acceleration signs
   - Saturation signals
   - Opportunity indicators

Present:
- Pattern catalog
- Statistical significance
- Business implications
- Action recommendations
```

## Interactive Exercise

Take a recent campaign data set. Use AI to conduct descriptive, diagnostic, and prescriptive analysis.

**[PAUSE MARKER: 8 minutes]**

## Prescriptive Analysis Prompts

### Optimization Recommendations

```
Generate optimization recommendations:

Current State:
- Performance metrics: [data]
- Resource constraints: [limitations]
- Goals: [objectives]

Analyze and recommend:

1. Quick Wins (Immediate actions, low effort)
   - Specific changes
   - Expected impact
   - Implementation steps
   - Success metrics

2. High-Impact Improvements (Strategic, higher effort)
   - Major optimizations
   - Resource requirements
   - Timeline estimates
   - Risk assessment

3. Testing Priorities
   - Hypotheses to test
   - Test design
   - Sample size needs
   - Decision criteria

4. Long-term Strategic Shifts
   - Structural changes
   - Investment areas
   - Capability building
   - Transformation roadmap

Prioritize by:
- Impact potential
- Implementation ease
- Resource requirements
- Risk level
```

## Data Visualization Prompts

### Chart and Dashboard Design

```
Design data visualization for [purpose]:

Data: [Description]
Audience: [Stakeholders]
Goal: [What decision/insight needed]

Create visualization concept:

1. Chart Selection
   - Chart types for each metric
   - Justification for choices
   - Interaction needs
   - Drill-down capabilities

2. Dashboard Layout
   - Information hierarchy
   - Key metrics prominent
   - Supporting details accessible
   - Filters and controls

3. Design Specifications
   - Color scheme
   - Labels and annotations
   - Legends and keys
   - Responsive considerations

4. Narrative Flow
   - Story the data tells
   - Insights highlighted
   - Action prompts
   - Decision support

Deliver:
- Dashboard mockup description
- Chart specifications
- Data refresh requirements
- Access and distribution plan
```

## Cohort Analysis Prompts

### Customer Cohort Analysis

```
Perform cohort analysis on customer data:

Cohort Definition: [e.g., signup month]
Metrics: [retention, LTV, engagement]
Time Period: [range]

Analyze:

1. Cohort Performance
   - Retention curves by cohort
   - LTV progression
   - Engagement patterns
   - Behavior evolution

2. Cohort Comparison
   - Best vs. worst performing
   - Improvement trends
   - Degradation signals
   - Anomalous cohorts

3. Leading Indicators
   - Early signals of retention
   - Churn prediction factors
   - Expansion opportunities
   - At-risk indicators

4. Segment Insights
   - Cohort characteristics
   - Acquisition source impact
   - Product usage patterns
   - Support interaction patterns

Recommendations:
- Retention improvement tactics
- Onboarding enhancements
- Expansion opportunities
- Churn prevention strategies
```

## Pro Example Board - Analysis Applications

| Analysis Type | Business Question | Key Insight | Action Taken |
|--------------|------------------|-------------|-------------|
| Descriptive | What''s our CTR? | 2.1%, down 15% | Investigate creative fatigue |
| Diagnostic | Why fewer conversions? | Mobile UX issues | Fix mobile checkout |
| Predictive | Will Q4 hit goal? | 85% probability | Increase spend 20% |
| Prescriptive | How to optimize? | Shift budget to email | Reallocate £10K |

## Key Takeaways

- Conversational approach democratizes data analysis
- Three-question framework provides structure
- Pattern recognition reveals hidden opportunities
- Prescriptive analysis drives action
- Visualization makes insights accessible
- Cohort analysis uncovers retention drivers
',
null, 6),

(uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Customer Research and Insights'), 'Trend Analysis and Prediction', 40, 'interactive', 'beginner',
'# Trend Analysis and Prediction

## Learning Objectives
- Identify emerging trends before competitors
- Use AI to synthesize signals across multiple data sources
- Predict trend trajectories and market impacts
- Distinguish signal from noise in trend data
- Create trend monitoring and alert systems

## Introduction

Trend spotting separates market leaders from followers. AI enables real-time trend detection and impact prediction at scale previously impossible.

## Trend Detection Framework

### Multi-Source Trend Identification

```
Identify emerging trends in [industry/category]:

Monitor across:

1. Social Media Signals
   - Hashtag growth rates
   - Discussion volume trends
   - Sentiment shifts
   - Influencer topics
   - Platform-specific patterns

2. Search Behavior
   - Query volume changes
   - Related search evolution
   - Geographic patterns
   - Search intent shifts

3. News and Publications
   - Coverage frequency
   - Topic prominence
   - Expert commentary
   - Industry event themes

4. Customer Behavior
   - Purchase pattern shifts
   - Product interest changes
   - Feature request themes
   - Support inquiry topics

5. Technology Signals
   - New tool adoption
   - Platform changes
   - Integration demands
   - Innovation announcements

For each trend identified:
- Emergence timeline
- Growth rate
- Current adoption stage
- Projected trajectory
- Market impact potential
```

## Signal vs. Noise Analysis

### Trend Validation Prompt

```
Evaluate if [observed pattern] is genuine trend or noise:

Pattern Description: [Details]
Observation Period: [Timeframe]
Data Sources: [Where seen]

Assess:

1. Strength Indicators
   - Consistent across sources?
   - Growing or stable?
   - Geographic spread?
   - Demographic breadth?

2. Sustainability Factors
   - Underlying need driving it?
   - Technology enablement?
   - Economic viability?
   - Behavioral shift depth?

3. Noise Characteristics
   - Single-source phenomenon?
   - Event-driven spike?
   - Influencer-manufactured?
   - Fading quickly?

4. Historical Context
   - Similar past patterns?
   - Cyclical nature?
   - Previous outcomes?
   - Lesson learned?

Classification:
- Strong trend (invest now)
- Emerging trend (watch closely)
- Weak signal (monitor)
- Noise (ignore)

Confidence Level: [High/Medium/Low]
Reasoning: [Explanation]
```

## Trend Impact Analysis

### Market Impact Assessment

```
Assess market impact of trend: [Trend name]

Analyze:

1. Market Size Implications
   - Affected customer segments
   - Revenue opportunity size
   - Growth potential
   - Timeline to maturity

2. Competitive Dynamics
   - Current player positions
   - Entry barrier changes
   - Advantage shifts
   - Disruption potential

3. Business Model Impact
   - Revenue model changes
   - Cost structure shifts
   - Value chain evolution
   - Partnership opportunities

4. Customer Behavior Changes
   - Expectation shifts
   - Decision criteria evolution
   - Channel preference changes
   - Price sensitivity impacts

5. Required Capabilities
   - Technology needs
   - Skill requirements
   - Process adaptations
   - Resource investments

Strategic Implications:
- Threat level (high/medium/low)
- Opportunity size
- Urgency to act
- Investment required
- Competitive advantage potential
```

## Predictive Trend Analysis

### Trend Trajectory Prediction

```
Predict future trajectory of trend: [Trend]

Current State:
- Adoption level: [percentage/description]
- Growth rate: [rate]
- Market penetration: [extent]

Forecast:

1. Short-term (3-6 months)
   - Adoption progression
   - Market momentum
   - Key milestones
   - Inflection points

2. Medium-term (6-18 months)
   - Mainstream adoption timeline
   - Market standardization
   - Competitive shakeout
   - Consolidation patterns

3. Long-term (18-36 months)
   - Maturity indicators
   - Next evolution stage
   - Replacement threats
   - Legacy transition

Scenarios:
- Best case: [Optimistic trajectory]
- Base case: [Most likely trajectory]
- Worst case: [Conservative trajectory]

Probability distribution across scenarios
Key assumption dependencies
Early indicators to track
Pivot points requiring strategy adjustment
```

## Interactive Exercise

Identify one emerging trend in your industry. Validate it as signal vs. noise and assess its market impact.

**[PAUSE MARKER: 10 minutes]**

## Trend Monitoring System

### Automated Trend Tracking

```
Design trend monitoring dashboard:

Trends to Track: [List 5-10 trends]

For each trend monitor:

1. Quantitative Metrics
   - Search volume (weekly)
   - Social mention count
   - News article frequency
   - Customer inquiry rate

2. Qualitative Signals
   - Sentiment direction
   - Discussion sophistication
   - Expert opinion evolution
   - Mainstream awareness

3. Competitive Activity
   - Competitor investments
   - Product launches aligned
   - Marketing focus
   - Partnership activity

4. Market Readiness
   - Technology maturity
   - Customer willingness
   - Economic feasibility
   - Regulatory clarity

Alert Triggers:
- 50%+ growth in any metric (investigate)
- Major competitor move (assess impact)
- Negative sentiment spike (understand cause)
- Acceleration signal (consider action)

Reporting:
- Weekly trend dashboard
- Monthly deep-dive report
- Quarterly strategy review
- Urgent alerts as needed
```

## Micro-Trend Identification

### Niche Trend Spotting

```
Identify micro-trends within [segment/niche]:

Look for:

1. Behavioral Micro-Shifts
   - Small usage pattern changes
   - Feature utilization evolution
   - Content preference shifts
   - Communication style changes

2. Segment-Specific Trends
   - Geographic peculiarities
   - Industry-specific adoptions
   - Company size patterns
   - Role-based preferences

3. Early Adopter Signals
   - Power user behavior
   - Beta tester feedback
   - Community requests
   - Expert predictions

4. Adjacent Market Spillover
   - Trends from related industries
   - Cross-category influences
   - Technology transfers
   - Practice adoptions

Assessment:
- Niche trend strength
- Mainstream potential
- Timeline to broader adoption
- Strategic relevance
```

## Pro Example Board - Trend Analysis

| Trend | Signal Strength | Impact Level | Action Priority | Timeline |
|-------|----------------|-------------|----------------|----------|
| AI Content Tools | Strong | High | Immediate | Adopt now |
| Voice Commerce | Emerging | Medium | Monitor | 12-18 months |
| Micro-Influencers | Established | High | Optimize | Ongoing |
| Web3 Marketing | Weak | Low | Watch | 24+ months |

## Key Takeaways

- Multi-source analysis validates trends
- Distinguish signal from noise systematically
- Impact assessment guides investment
- Predictive analysis enables proactive strategy
- Continuous monitoring catches shifts early
- Micro-trends can become macro opportunities
',
null, 7),

(uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Customer Research and Insights'), 'Customer Feedback Synthesis', 35, 'interactive', 'beginner',
'# Customer Feedback Synthesis

## Learning Objectives
- Aggregate feedback from multiple sources into cohesive insights
- Extract actionable themes from unstructured feedback
- Prioritize feedback for maximum impact
- Close the feedback loop with customers
- Build continuous feedback systems

## Introduction

Customer feedback gold is scattered across reviews, support tickets, social media, surveys, and conversations. AI synthesis transforms fragments into strategic intelligence.

## Multi-Source Feedback Aggregation

### Comprehensive Feedback Synthesis

```
Synthesize customer feedback from multiple sources:

Sources:
1. Product reviews: [platform links]
2. Support tickets: [summary or data]
3. Survey responses: [results]
4. Social media: [mentions]
5. Sales conversations: [notes]
6. Community forums: [discussions]

Extract:

1. Core Themes
   - Top 10 themes across all sources
   - Frequency by theme
   - Severity/urgency indicators
   - Trend direction (increasing/stable/decreasing)

2. Sentiment Analysis
   - Overall sentiment distribution
   - Sentiment by theme
   - Sentiment by customer segment
   - Sentiment evolution over time

3. Feature-Specific Feedback
   - Praise points by feature
   - Complaint areas by feature
   - Feature request patterns
   - Feature usage correlation

4. Customer Segment Patterns
   - Feedback differences by segment
   - Segment-specific pain points
   - Segment priorities
   - Satisfaction variations

5. Competitive Mentions
   - Competitive comparisons made
   - Win/loss themes
   - Feature gap mentions
   - Switching reasons cited

Deliver:
- Executive summary
- Theme priority matrix
- Verbatim quote library
- Action recommendation roadmap
```

## Theme Extraction and Categorization

### Thematic Analysis Prompt

```
Extract themes from unstructured customer feedback:

Feedback Data: [Raw feedback text]
Feedback Volume: [Number of responses]

Analyze:

1. Theme Identification
   - Primary themes (mentioned >20%)
   - Secondary themes (mentioned 5-20%)
   - Emerging themes (growing frequency)
   - Niche themes (segment-specific)

2. Theme Relationships
   - Co-occurring themes
   - Theme hierarchies
   - Root cause connections
   - Sequential patterns

3. Theme Characteristics
   - Emotional intensity
   - Actionability level
   - Business impact potential
   - Implementation complexity

4. Supporting Evidence
   - Verbatim examples for each theme
   - Frequency counts
   - Segment breakdown
   - Source distribution

Create:
- Theme hierarchy map
- Priority matrix (impact vs. frequency)
- Quote library by theme
- Action priority list
```

## Feedback Prioritization Framework

### Impact vs. Effort Matrix

```
Prioritize customer feedback items:

Feedback List: [Items identified]

For each item assess:

1. Customer Impact
   - How many affected (reach)
   - Pain severity (intensity)
   - Frequency of occurrence
   - Segment importance

2. Business Impact
   - Revenue effect
   - Retention influence
   - Acquisition impact
   - Brand perception effect

3. Implementation Effort
   - Development complexity
   - Resource requirements
   - Timeline to delivery
   - Risk level

4. Strategic Alignment
   - Product vision fit
   - Market differentiation
   - Competitive positioning
   - Long-term value

Plot on matrix:
- Quick Wins (high impact, low effort) → Do immediately
- Strategic Investments (high impact, high effort) → Plan carefully
- Fill-ins (low impact, low effort) → Do when possible
- Time Wasters (low impact, high effort) → Deprioritize

Deliver prioritized roadmap with rationale
```

## Interactive Exercise

Synthesize feedback from 3 different sources for your product. Extract top 5 themes and prioritize using impact vs. effort matrix.

**[PAUSE MARKER: 8 minutes]**

## Closing the Feedback Loop

### Customer Communication Prompt

```
Design feedback loop closure communication:

Feedback Received: [Theme/request]
Action Taken: [What was built/changed]
Customer Segment: [Who provided feedback]

Create communication:

1. Acknowledgment
   - Thank customers for specific feedback
   - Quote representative feedback
   - Explain what we heard

2. Action Explanation
   - What we built/changed
   - Why this approach
   - How it addresses feedback
   - Timeline delivered

3. Invitation to Experience
   - How to access new solution
   - Getting started guidance
   - Support resources
   - Feedback on the solution

4. Continued Engagement
   - Request for continued feedback
   - Other areas we''re exploring
   - Community invitation
   - Relationship building

Channels:
- Email to feedback providers
- In-app announcement
- Blog post (for major changes)
- Social media update
- Community forum post
```

## Continuous Feedback Systems

### Feedback Collection System Design

```
Design continuous feedback collection system:

Objectives:
- Capture feedback at key moments
- Minimize customer friction
- Ensure representative samples
- Enable rapid response

System Components:

1. Collection Points
   - Post-purchase survey (satisfaction)
   - Feature usage feedback (in-app)
   - Support resolution follow-up
   - Periodic relationship check-ins
   - Exit/cancellation interviews

2. Collection Methods
   - Microsurveys (1-2 questions)
   - NPS tracking (quarterly)
   - Feature ratings (in-context)
   - Open feedback channels (always available)

3. Analysis Automation
   - Sentiment detection
   - Theme extraction
   - Alert triggers
   - Dashboard updates

4. Response Protocols
   - Urgent issue escalation
   - Positive feedback celebration
   - Feature request cataloging
   - Regular synthesis reviews

5. Action Workflows
   - Product team routing
   - Support team protocols
   - Executive visibility
   - Customer communication

Implementation:
- Phased rollout plan
- Tool requirements
- Team responsibilities
- Success metrics
```

## Feedback-Driven Innovation

### Innovation Opportunity Mining

```
Mine customer feedback for innovation opportunities:

Feedback Sources: [All available]

Identify:

1. Workaround Patterns
   - How customers hack solutions
   - Complementary tools used
   - Process adaptations made
   - Unintended feature uses

2. Aspiration Statements
   - "I wish I could..."
   - "It would be great if..."
   - "Why can''t it..."
   - Future state descriptions

3. Pain Point Clusters
   - Related frustrations
   - Sequential problems
   - Recurring obstacles
   - Breaking points

4. Comparison References
   - "X does this better..."
   - "I came from Y because..."
   - "Unlike Z, this doesn''t..."
   - Feature envy expressed

5. Unexpected Use Cases
   - Novel applications
   - Unintended customer types
   - Surprising value discovery
   - Cross-industry applications

Transform into:
- Innovation hypotheses
- Product concepts
- Feature ideas
- Strategic pivots
- Market expansion opportunities
```

## Pro Example Board - Feedback Actions

| Feedback Theme | Frequency | Severity | Action Taken | Impact |
|---------------|-----------|----------|-------------|---------|
| Slow mobile load | 35% | High | Optimized assets | +15% mobile conversion |
| Confusing onboarding | 28% | Medium | Rebuilt flow | +40% activation |
| Missing integrations | 45% | High | Built top 3 | +20% enterprise deals |
| Pricing complexity | 22% | Medium | Simplified tiers | +12% conversions |

## Key Takeaways

- Multi-source synthesis reveals complete picture
- Thematic analysis organizes chaos
- Prioritization focuses resources on highest impact
- Closing the loop builds customer loyalty
- Continuous systems enable proactive response
- Feedback mining uncovers innovation opportunities
- AI scales analysis without losing depth
',
null, 8);

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
AND tm.title = 'Customer Research and Insights'
GROUP BY t.id, t.title, tm.id, tm.title;