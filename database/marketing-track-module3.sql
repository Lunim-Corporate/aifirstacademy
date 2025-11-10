BEGIN;

INSERT INTO track_modules (id, track_id, title, description, estimated_hours, order_index) VALUES (
  uuid_generate_v4(),
  (SELECT id FROM tracks WHERE title = 'Marketing Prompt Track'),
  'Campaign Strategy and Planning',
  'Master comprehensive campaign planning from SMART objectives through multi-channel integration, budget optimization, KPI framework design, A/B testing strategy, influencer partnerships, and crisis communication preparation.',
  10,
  3
);

INSERT INTO track_lessons (id, module_id, title, duration_minutes, type, level, content, video_url, order_index) VALUES

(uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Campaign Strategy and Planning'), 'Campaign Strategy Development', 40, 'interactive', 'beginner',
'# Campaign Strategy Development

## Learning Objectives
- Define SMART objectives for marketing campaigns
- Build comprehensive audience personas aligned with campaign goals
- Craft compelling value propositions that resonate with target audiences
- Map buyer journeys to optimize touchpoint strategies
- Create strategic campaign blueprints that align with organizational objectives

## Introduction

A strong strategy ensures campaigns remain focused, efficient, and aligned with brand purpose. Strategic campaigns connect objectives, audience, and execution into cohesive plans that drive measurable results.

## SMART Objectives Framework

**S - Specific:** Clear, concrete goal with no ambiguity
**M - Measurable:** Quantifiable metrics to track progress
**A - Achievable:** Realistic given resources and constraints
**R - Relevant:** Aligned with broader business objectives
**T - Time-bound:** Defined timeline for completion

### Examples of SMART Campaign Objectives

**Weak Objective:** "Increase brand awareness"
**SMART Objective:** "Increase brand awareness among 25-40 year-old professionals in London by 25% (measured by aided recall) within Q2 2025 through targeted LinkedIn and Instagram campaigns"

### SMART Objectives by Campaign Type

| Campaign Type | SMART Objective Example |
|--------------|------------------------|
| Product Launch | Achieve 10,000 product page visits and 500 pre-orders within first 2 weeks of launch |
| Lead Generation | Generate 300 MQLs with 15% sales-qualified rate at £50 CPL within Q1 |
| Brand Awareness | Increase unaided brand recall from 12% to 20% among target demographic within 6 months |
| Retention | Reduce churn rate from 5% to 3% among annual subscribers through re-engagement campaign in Q2 |
| Event Registration | Drive 500 webinar registrations with 60% attendance rate within 30 days |

## Interactive Exercise

Create 3 SMART objectives for a campaign of your choice. Ensure each includes all five SMART elements.

**[PAUSE MARKER: 5 minutes for practice]**

## Creating Comprehensive Personas

Effective personas capture:
- **Demographics:** Age, location, income, job title, company size
- **Psychographics:** Values, motivations, pain points, goals, information sources
- **Behavioral Patterns:** Buying behaviors, media preferences, purchase triggers, technology usage

### Persona Development Prompt

```
Create detailed marketing persona for [product/service]:

Demographics:
- Age, location, role, income level

Psychographics:
- Core values and motivations
- Primary pain points (3-5)
- Goals and desired outcomes
- Information sources trusted

Behaviors:
- Typical day in life
- Media and content preferences
- Purchase decision process
- Objections and barriers

Include:
- Name and brief background story
- Quote that captures their mindset
- Preferred marketing channels
- Key messaging themes that resonate
```

## Buyer Journey Mapping

Map customer journey across four key stages:

**1. Awareness Stage**
- Customer realizes they have a problem
- Seeking educational content
- Touchpoints: Blog posts, social media, search
- Goal: Build awareness and establish authority

**2. Consideration Stage**
- Researching solution options
- Comparing alternatives
- Touchpoints: Case studies, comparison guides, webinars
- Goal: Position your solution favorably

**3. Decision Stage**
- Ready to make purchase decision
- Seeking validation and proof
- Touchpoints: Product demos, trials, testimonials
- Goal: Remove final objections and close sale

**4. Retention Stage**
- Post-purchase experience
- Seeking value realization
- Touchpoints: Onboarding, support, community
- Goal: Drive satisfaction, retention, advocacy

### Journey Mapping Prompt

```
Map the buyer journey for [persona] purchasing [product/service]:

For each stage (Awareness, Consideration, Decision, Retention):

1. Customer Mindset
   - What they''re thinking
   - Questions they have
   - Concerns and fears

2. Content Needs
   - Information required
   - Format preferences
   - Depth and complexity

3. Touchpoints
   - Channels they use
   - Content types consumed
   - Interactions expected

4. Marketing Actions
   - Content to create
   - Messages to deliver
   - CTAs to present

5. Success Metrics
   - KPIs for this stage
   - Conversion goals
   - Engagement indicators

Create:
- Comparison matrix
   - Journey length
   - Key touchpoints
   - Critical moments
   - Opportunity areas
```

## Crafting Value Propositions

**Formula:** For [target customer] who [statement of need], our [product/service] provides [key benefit] unlike [competitive alternative] we [unique differentiator].

### Example Value Proposition

"For busy marketing managers who struggle to create consistent social content, our AI-powered content calendar generates 30 days of platform-optimized posts in 10 minutes. Unlike generic scheduling tools, we combine AI creativity with your brand voice to ensure every post authentically represents your brand while saving you 10+ hours weekly."

### Elements of Strong Value Propositions

**1. Target Audience Specificity:** Who exactly is this for?
**2. Problem Statement:** What specific pain do they experience?
**3. Core Benefit:** What primary outcome do you deliver?
**4. Differentiation:** How are you different from alternatives?
**5. Proof Element:** What evidence supports your claim?

## Key Takeaways

- SMART objectives provide focus and accountability
- Deep audience understanding enables relevance
- Value propositions differentiate and persuade
- Journey mapping optimizes touchpoint strategy
- Strategic blueprints integrate all elements cohesively
',
null, 1),

(uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Campaign Strategy and Planning'), 'Multi-Channel Integration Prompts', 45, 'interactive', 'beginner',
'# Multi-Channel Integration Prompts

## Learning Objectives
- Develop AI prompts that adapt messaging across multiple digital channels
- Maintain brand consistency while optimizing for platform-specific best practices
- Design integrated campaign flows that guide customers through the buyer journey
- Create channel-specific content that works together as unified strategy
- Measure and optimize cross-channel campaign performance

## Introduction

Customers interact with brands across multiple touchpoints before making decisions. Multi-channel integration ensures consistent messaging while respecting each platform''s unique characteristics.

## Understanding Multi-Channel Impact

**Multi-Touch Reality:**
- Average customer encounters 6-8 touchpoints before purchase
- 73% of consumers use multiple channels during shopping journey
- Integrated campaigns deliver 3x higher engagement than single-channel
- Consistent cross-channel experiences increase revenue by 23%

## Channel-Specific Prompt Patterns

### Email Marketing Prompts

```
Create email sequence for [campaign]:

Email 1 - Awareness (Day 0)
Subject line: [3 options testing different approaches]
Preview text: [Complement subject line]
Body:
- Personal greeting
- Hook (problem or benefit)
- Educational value
- Soft CTA
- Length: 150 words max

Email 2 - Consideration (Day 3)
Subject: [Build on Email 1 engagement]
Body:
- Reference previous email
- Deeper dive into solution
- Social proof element
- Clear value demonstration
- Stronger CTA
- Length: 200 words

Email 3 - Conversion (Day 7)
Subject: [Urgency or exclusivity element]
Body:
- Recap value delivered
- Limited-time offer
- Remove objections
- Multiple CTAs
- Guarantee or risk reversal
- Length: 250 words

Personalization tokens: [Name, company, behavior]
Brand voice: [Tone attributes]
```

### Social Media Prompts

**Instagram:**
```
Create Instagram campaign content:

Feed Post:
- Caption: 150 characters max
- Hook first line
- Value in middle
- CTA and hashtags at end
- Emojis: 2-3 strategically placed
- Hashtags: 5-10 mix of branded and discovery
- Image concept: [Description]

Story Sequence (3 slides):
Slide 1: Pattern interrupt
Slide 2: Value or entertainment
Slide 3: Swipe-up CTA
- Interactive elements: Poll, question, quiz
- Brand colors and fonts

Reel:
- Hook: First 3 seconds script
- Value: 15-second demonstration
- CTA: Final 5 seconds
- On-screen text: Key points
- Trending audio suggestion
```

**LinkedIn:**
```
Create LinkedIn thought leadership post:

Opening: Surprising stat or contrarian view
Body:
- Personal insight or story
- 3 key points with line breaks
- Each point: 2-3 sentences
- Professional but conversational tone
Length: 200-250 words

Include:
- One question for engagement
- Relevant hashtags (3-5)
- Strategic @mentions if applicable
- Comment prompt that encourages discussion
```

### Paid Advertising Prompts

**Google Search Ads:**
```
Create Google Search ad set for [keyword theme]:

Ad Variation 1 - Benefit-Focused:
Headline 1: [Primary benefit + outcome]
Headline 2: [Social proof or trust signal]
Headline 3: [Urgency or offer]
Description: [Expanded benefit + clear CTA]

Ad Variation 2 - Problem-Focused:
Headline 1: [Pain point question]
Headline 2: [Solution statement]
Headline 3: [Differentiator]
Description: [How you solve problem + next step]

Ad Variation 3 - Offer-Focused:
Headline 1: [Specific offer + value]
Headline 2: [Limited availability]
Headline 3: [Brand trust element]
Description: [Offer details + easy action]

Include:
- Sitelink extensions (4)
- Callout extensions (4)
- Structured snippets
```

## Campaign Timeline Framework

**Week 1 - Awareness Phase:**
- Email: Initial announcement
- Social: Teaser content (3-5 posts)
- Paid: Reach campaigns, lookalike audiences
- Content: Educational blog posts
- Goal: Build awareness, generate interest

**Week 2 - Engagement Phase:**
- Email: Educational nurture
- Social: Interactive content (polls, questions)
- Paid: Engagement campaigns, video content
- Content: Comparison guides, webinars
- Goal: Drive deeper engagement

**Week 3 - Conversion Phase:**
- Email: Offer announcement with urgency
- Social: Testimonials, results, offer posts
- Paid: Conversion campaigns, retargeting
- Content: Case studies, product demos
- Goal: Drive conversions

**Week 4 - Retention Phase:**
- Email: Thank you, onboarding
- Social: User-generated content, community
- Paid: Retention/upsell audiences
- Content: Usage tips, advanced guides
- Goal: Maximize value, encourage advocacy

## Interactive Exercise

Choose one campaign and develop tailored prompts for Instagram, Email, and Google Ads. Assign timing for each.

**[PAUSE MARKER: 8 minutes]**

## Key Takeaways

- Multi-channel integration amplifies campaign impact
- Platform-specific adaptation respects audience context
- Timing and sequencing guide customer journey
- Consistency builds brand recognition and trust
- Coordination requires strategic planning
',
null, 2),

(uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Campaign Strategy and Planning'), 'Budget Allocation Optimization', 35, 'interactive', 'beginner',
'# Budget Allocation Optimization

## Learning Objectives
- Allocate marketing budgets effectively using cost metrics
- Apply the 70-20-10 budgeting framework
- Calculate and optimize key cost metrics (CPC, CPL, CAC, ROI)
- Make data-driven reallocation decisions
- Build budget scenarios and contingency plans

## Introduction

Budget allocation determines campaign success as much as creative and targeting. Smart allocation maximizes ROI by investing where returns are highest while maintaining strategic balance.

## The 70-20-10 Framework

**70% - Core Proven Channels**
- Established performers with predictable ROI
- Lower risk and consistent volume

**20% - Experimental Channels**
- Promising new opportunities with moderate risk
- Growth potential with testing

**10% - Emerging/Innovation**
- Cutting-edge platforms with high risk but potential
- Future positioning and competitive advantage

### Budget Allocation by Campaign Goal

| Goal | Suggested Split | Focus |
|------|----------------|-------|
| Awareness | Paid Social 40%, Display 30%, Content 20%, PR 10% | Reach and frequency |
| Lead Gen | Paid Search 35%, Email 25%, Content 20%, Social 20% | Cost per lead efficiency |
| Sales | Paid Search 40%, Retargeting 25%, Email 20%, Social 15% | Direct ROI |
| Retention | Email 40%, Content 30%, Community 20%, Events 10% | Customer lifetime value |

## Key Cost Metrics

**CPC (Cost Per Click):**
- Formula: Total Spend ÷ Total Clicks
- Purpose: Efficiency of traffic generation
- Benchmark: £0.50-£5.00 typical

**CPL (Cost Per Lead):**
- Formula: Total Spend ÷ Total Leads
- Purpose: Lead generation efficiency
- Benchmark: £30-£150 B2B, £10-£50 B2C

**CAC (Customer Acquisition Cost):**
- Formula: Total Marketing Spend ÷ New Customers
- Purpose: Full-funnel conversion efficiency
- Target: < 1/3 of Customer Lifetime Value

**ROI (Return on Investment):**
- Formula: (Revenue - Cost) ÷ Cost × 100
- Purpose: Overall campaign profitability
- Target: 300%+ for sustainable growth

**ROAS (Return on Ad Spend):**
- Formula: Revenue from Ads ÷ Ad Spend
- Purpose: Paid campaign effectiveness
- Target: 4:1 minimum, 6:1+ ideal

## Budget Allocation Exercise

You have £75,000 to allocate across 4 channels for a B2B SaaS product launch:

**Channel Performance Data:**

| Channel | Estimated CPL | Conversion Rate | Expected Volume |
|---------|--------------|----------------|-----------------|
| Social | £45 | 3% | High |
| Search | £65 | 8% | Medium |
| Email | £25 | 5% | Medium |
| Display | £35 | 2% | High |

**Exercise Tasks:**
1. Draft initial budget split with rationale
2. Calculate expected outcomes at each level
3. Suggest one reallocation based on performance

## Key Takeaways

- 70-20-10 framework balances stability and innovation
- Cost metrics guide allocation decisions
- Performance data drives continuous optimization
- Dynamic reallocation maximizes ROI
- Documentation enables learning and improvement
',
null, 3),

(uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Campaign Strategy and Planning'), 'Timeline and Project Management', 30, 'interactive', 'beginner',
'# Timeline and Project Management

## Learning Objectives
- Organize campaigns efficiently using project management frameworks
- Create comprehensive campaign timelines with milestones
- Assign tasks and ownership for accountability
- Use project management tools effectively
- Manage dependencies and critical paths

## Introduction

Campaign success requires meticulous planning and coordination. Strong project management ensures on-time delivery, prevents bottlenecks, and keeps teams aligned.

## Project Phases

**1. Planning Phase (Weeks 1-2)**
- Objectives and strategy
- Audience research
- Budget allocation
- Channel selection
- Success metrics definition

**2. Creative Development (Weeks 3-5)**
- Concept development
- Asset creation
- Copy writing
- Design and production
- Review and approval

**3. Setup and Testing (Week 6)**
- Platform configuration
- Tracking implementation
- QA and testing
- Soft launch preparation
- Contingency planning

**4. Launch (Week 7)**
- Campaign activation
- Monitoring dashboard
- Real-time optimization
- Issue resolution
- Performance tracking

**5. Optimization (Weeks 8-11)**
- Performance analysis
- A/B testing
- Budget reallocation
- Creative refresh
- Continuous improvement

**6. Reporting and Analysis (Week 12)**
- Results compilation
- ROI analysis
- Insights documentation
- Recommendations
- Next campaign planning

## Creating Campaign Timelines

### Gantt Chart Structure

Visualize:
- Task dependencies
- Parallel workstreams
- Critical path
- Milestone dates
- Resource allocation

### Timeline Creation Prompt

```
Create 12-week campaign timeline for [campaign name]:

Campaign Details:
- Type: [Awareness/Lead Gen/Sales]
- Channels: [List]
- Budget: [Amount]
- Team: [Roles and sizes]

Generate timeline including:

Planning Phase:
- Strategy workshop (Week 1)
- Audience research (Week 1-2)
- Budget finalization (Week 2)

Creative Phase:
- Concept development (Week 3)
- Copywriting (Week 3-4)
- Design (Week 4-5)
- Review cycles (Week 5)

Execution Phase:
- Setup (Week 6)
- Launch (Week 7)
- Optimization (Week 8-11)
- Reporting (Week 12)

For each task specify:
- Owner/responsible party
- Dependencies
- Duration
- Deliverables
- Review checkpoints
```

## Project Management Tools

**Trello** - Visual, card-based workflow
Best for: Simple campaigns, small teams

**Asana** - Task and project tracking
Best for: Complex campaigns, larger teams

**Monday.com** - Customizable workflows
Best for: Multi-campaign management

**Notion** - All-in-one workspace
Best for: Documentation + project management

## Interactive Exercise

Draft a 12-week campaign timeline including phases, tasks, owners, dates, and resources.

**[PAUSE MARKER: 6 minutes]**

## Key Takeaways

- Detailed timelines prevent delays and confusion
- Clear ownership drives accountability
- Dependencies require careful management
- Tools enable coordination and visibility
- Regular checkpoints ensure alignment
',
null, 4),

(uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Campaign Strategy and Planning'), 'KPI and Measurement Framework', 30, 'interactive', 'beginner',
'# KPI and Measurement Framework

## Learning Objectives
- Design comprehensive performance measurement systems
- Select appropriate KPIs for different campaign goals
- Create automated reporting dashboards
- Establish data-driven decision frameworks
- Build continuous improvement loops

## Introduction

Effective KPI frameworks transform campaign data into actionable intelligence that drives continuous optimization and business results.

## KPI Selection by Campaign Goal

### Awareness Campaign KPIs

**Primary Metrics:**
- Reach (unique users exposed)
- Impressions (total exposures)
- Brand lift (aided/unaided recall)
- Share of voice

**Secondary Metrics:**
- CPM (cost per thousand impressions)
- Frequency (average exposures per user)
- Video completion rate
- Social sentiment

### Engagement Campaign KPIs

**Primary Metrics:**
- CTR (click-through rate)
- Engagement rate
- Time on site
- Pages per session

**Secondary Metrics:**
- Bounce rate
- Social interactions (likes, shares, comments)
- Content downloads
- Video views (>50%)

### Conversion Campaign KPIs

**Primary Metrics:**
- Conversion rate
- Cost per conversion
- Revenue
- ROAS

**Secondary Metrics:**
- Add-to-cart rate
- Checkout abandonment
- Average order value
- Customer acquisition cost

## Building Measurement Frameworks

### Campaign Dashboard Structure

**Executive View (High-Level)**
- Total spend vs. budget
- Primary KPI vs. goal
- ROI/ROAS
- Key trends (up/down arrows)

**Performance View (Detailed)**
- KPIs by channel
- Conversion funnel metrics
- Audience segment performance
- Creative performance

**Diagnostic View (Analysis)**
- Time-series trends
- Cohort analysis
- Attribution data
- Quality metrics

### KPI Framework Prompt

```
Design KPI measurement framework for [campaign]:

Campaign Details:
- Objective: [Primary goal]
- Budget: [Amount]
- Duration: [Timeframe]
- Channels: [List]

Create framework including:

1. Success Metrics Hierarchy
   - North Star Metric (primary success measure)
   - Secondary KPIs (supporting indicators)
   - Health Metrics (early warning signals)

2. Metric Definitions
   - How each KPI is calculated
   - Data sources required
   - Tracking methodology
   - Benchmark/target for each

3. Reporting Structure
   - Daily monitoring metrics
   - Weekly review metrics
   - Monthly strategic metrics
   - Dashboard visualization concepts

4. Alert Thresholds
   - When to take action
   - Escalation procedures
   - Automated alert triggers

5. Attribution Model
   - How credit is assigned
   - Multi-touch considerations
   - Channel interaction effects
```

## Interactive Exercise

Create a mini-report summarizing last week''s campaign KPIs and recommend 3 data-driven actions.

**[PAUSE MARKER: 5 minutes]**

## Key Takeaways

- KPIs must align with campaign objectives
- Measurement frameworks enable accountability
- Automated reporting saves time and ensures consistency
- Data-driven decisions outperform gut instinct
- Continuous monitoring enables proactive optimization
',
null, 5),

(uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Campaign Strategy and Planning'), 'A/B Testing Strategy Design', 40, 'interactive', 'beginner',
'# A/B Testing Strategy Design

## Learning Objectives
- Design rigorous A/B tests that generate valid insights
- Prioritize test hypotheses using systematic frameworks
- Calculate required sample sizes for statistical significance
- Avoid common testing pitfalls and biases
- Build organizational testing culture

## Introduction

A/B testing transforms marketing from guesswork to science. Systematic experimentation reveals what actually works, enabling continuous improvement and competitive advantage.

## A/B Testing Fundamentals

### The Scientific Method for Marketing

**1. Observe:** Notice performance patterns or opportunities
**2. Question:** Form testable question
**3. Hypothesize:** Predict outcome with reasoning
**4. Experiment:** Design and run controlled test
**5. Analyze:** Evaluate results statistically
**6. Conclude:** Apply learnings, iterate

### Testing Best Practices

**✅ Test One Variable at a Time**
- Isolates causal factors
- Enables clear conclusions
- Builds replicable knowledge

**✅ Ensure Statistical Significance**
- Adequate sample size
- Sufficient test duration
- Confidence level >95%

**✅ Define Success Metrics Before Testing**
- Primary metric (decision driver)
- Secondary metrics (context)
- Guardrail metrics (protect against harm)

**✅ Document Everything**
- Hypothesis, test design, results, insights

## Test Prioritization with PIE Framework

### PIE Scoring System

**P - Potential:** How much improvement possible? (1-10)
**I - Importance:** How valuable is this page/element? (1-10)
**E - Ease:** How simple to implement and test? (1-10)

**PIE Score = (P + I + E) / 3**

### Example PIE Scoring

| Test Idea | Potential | Importance | Ease | PIE Score | Priority |
|-----------|-----------|------------|------|-----------|----------|
| Homepage headline | 8 | 9 | 9 | 8.7 | 1 |
| Checkout button color | 3 | 10 | 10 | 7.7 | 2 |
| Product page layout | 9 | 8 | 4 | 7.0 | 3 |
| Footer links | 2 | 2 | 10 | 4.7 | 4 |

## High-Impact Test Ideas

**Headlines:**
- Benefit-focused vs. feature-focused
- Question vs. statement
- Specific numbers vs. general claims
- Social proof integration

**CTAs:**
- Button copy ("Buy Now" vs. "Start Free Trial")
- Color and size
- Placement (sticky vs. static)
- Urgency language

**Images:**
- Product alone vs. in context
- Lifestyle vs. technical
- With people vs. without
- Different emotional tones

**Forms:**
- Fewer fields vs. qualification fields
- Single-step vs. multi-step
- Optional fields visibility
- Social login options

## Key Takeaways

- Testing transforms opinions into evidence
- One variable at a time isolates causality
- PIE framework prioritizes highest-value tests
- Statistical rigor ensures valid conclusions
- Documentation builds organizational knowledge
- Continuous testing drives continuous improvement
',
null, 6),

(uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Campaign Strategy and Planning'), 'Influencer Partnership Planning', 45, 'interactive', 'beginner',
'# Influencer Partnership Planning

## Learning Objectives
- Develop influencer collaboration strategies that enhance brand credibility
- Identify and vet influencers aligned with brand values
- Structure partnership agreements and deliverables
- Create effective influencer briefs
- Measure influencer campaign performance

## Introduction

Influencer partnerships leverage trusted voices to reach engaged audiences authentically. Strategic partnerships drive awareness, credibility, and conversions more effectively than traditional advertising.

## Influencer Tiers

**Nano-Influencers (1K-10K followers)**
- Highest engagement rates (7-10%), niche audiences, affordable, strong authenticity

**Micro-Influencers (10K-100K followers)**
- High engagement (5-7%), strong niche authority, cost-effective, authentic

**Mid-Tier (100K-500K followers)**
- Solid engagement (3-5%), broader reach, professional content, moderate investment

**Macro-Influencers (500K-1M followers)**
- Lower engagement (2-3%), significant reach, higher costs, brand awareness focus

**Mega-Influencers (1M+ followers)**
- Lowest engagement (1-2%), massive reach, highest costs, celebrity status

## Influencer Vetting Criteria

**Alignment (Most Important)**
- Values match brand
- Audience matches target
- Content style compatible
- Authentic product use

**Engagement Quality**
- Real comments (not just emojis)
- Authentic conversations
- Audience responsiveness
- Community feel

**Content Quality**
- Professional production
- Consistent aesthetic
- Strong storytelling
- Platform optimization

**Track Record**
- Previous partnerships
- Campaign results
- Brand safety
- Reliability

## Partnership Structure

### Compensation Models

**Flat Fee:** Fixed payment per deliverable, simple contracts
**Commission-Based:** Payment tied to sales/conversions, performance-aligned
**Product/Service Exchange:** No cash payment, builds relationships
**Hybrid Models:** Base fee + performance bonus, balances security and incentive

### Typical Deliverables

**Social Media Posts:**
- Instagram feed posts (1-3)
- Instagram stories (3-10 slides)
- TikTok videos (1-3)
- YouTube dedicated video or mention

**Content Rights:**
- Usage rights duration
- Platforms where brand can repost
- Advertising usage rights
- Exclusivity terms

## Creating Effective Influencer Briefs

### Brief Structure

**1. Campaign Overview:** Brand intro, product details, goals, timeline
**2. Creative Direction:** Key messages, tone, required mentions, hashtags
**3. Specific Deliverables:** Content pieces, formats, posting schedule
**4. Do''s and Don''ts:** Brand guidelines, prohibited content, disclosure requirements
**5. Success Metrics:** How performance is measured, reporting requirements

## Partnership Timeline

**Weeks 1-2: Onboarding**
- Contract finalization, product shipping, brief delivery, Q&A

**Weeks 3-4: Content Creation**
- Influencer creates content, draft review, feedback, revisions

**Week 5: Launch**
- Content goes live, brand amplification, monitoring, optimization

**Week 6: Analysis**
- Performance data collection, ROI calculation, learnings documentation

## Measuring Influencer ROI

**Awareness Metrics:**
- Reach and impressions
- Profile visits
- Brand mention volume
- Audience growth

**Engagement Metrics:**
- Likes, comments, shares
- Engagement rate
- Story completion rate
- Click-through rate

**Conversion Metrics:**
- Clicks to site
- Conversions attributed
- Revenue generated
- Customer acquisition cost

**ROI Calculation:**
ROI = (Revenue - Investment) / Investment × 100

## Interactive Exercise

Write an influencer brief using the template for a sustainable skincare product launch.

**[PAUSE MARKER: 8 minutes]**

## Key Takeaways

- Alignment trumps follower count
- Clear briefs enable great content
- Creative freedom produces authenticity
- Fair partnerships build long-term value
- Measurement proves ROI and guides optimization
',
null, 7),

(uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Campaign Strategy and Planning'), 'Crisis Communication Preparation', 35, 'interactive', 'beginner',
'# Crisis Communication Preparation

## Learning Objectives
- Prepare crisis response frameworks to protect brand integrity
- Identify potential crisis scenarios and develop response playbooks
- Create pre-approved message templates
- Establish escalation protocols and communication chains
- Use AI to assist with crisis response while maintaining authenticity

## Introduction

Every brand faces potential crises. Preparation determines whether you emerge with trust intact or reputation damaged.

## Crisis Preparedness Fundamentals

### Types of Marketing Crises

**Product/Service Issues:** Defects, recalls, safety concerns, quality problems
**Operational Crises:** Data breaches, privacy violations, delivery failures, system downtime
**Communication Missteps:** Offensive content, insensitive messaging, tone-deaf campaigns, social mistakes
**External Issues:** Customer complaints going viral, negative press, influencer backlash, competitive attacks

### Crisis Impact Levels

**Level 1 - Minor:** Limited awareness, contained to single channel, quick resolution possible
**Level 2 - Moderate:** Growing social discussion, multi-channel spread, potential media interest
**Level 3 - Major:** Widespread negative coverage, media attention, significant business impact

## Crisis Response Framework

### The 4 R''s of Crisis Management

**1. Rapid Response:** Acknowledge immediately (within 1-2 hours), show engagement
**2. Responsible Ownership:** Accept accountability, avoid blame-shifting, show empathy
**3. Remediation Plan:** Explain specific actions, provide timeline, offer compensation
**4. Reassurance:** Communicate preventive measures, rebuild trust, follow up with resolution

## Crisis Response Team

**Core Team:**
- Crisis Lead (CMO or Communications Director)
- Legal Counsel
- Social Media Manager
- Customer Service Lead
- PR Manager

**Roles:**
- Situation assessment
- Message development
- Approval workflow
- Channel management
- Media relations
- Internal communications

## Crisis Communication Playbooks

### Playbook Structure

For each potential crisis scenario:

**1. Scenario Description:** What happened, discovery, potential impact
**2. Immediate Actions:** First 15 minutes, first hour, first 24 hours
**3. Response Messages:** Holding statement, full statement, FAQ responses, social responses
**4. Communication Channels:** Response priorities, channel-specific considerations
**5. Escalation Triggers:** When to elevate, who to involve, external support needed

## Channel-Specific Crisis Responses

**Twitter/X:**
- Acknowledge within 1-2 hours
- Thread format for complex issues
- Pin important updates
- Monitor replies closely

**Facebook:**
- Longer-form statement appropriate
- Enable comments for transparency
- Monitor and respond to questions
- Update post with developments

**Email:**
- To affected customers with clear explanation
- Specific impacts on this customer
- Concrete actions being taken
- Next steps for customer

## Post-Crisis Actions

**1. Resolution Communication:** Announce resolution, thank stakeholders, reaffirm commitment
**2. Lessons Learned:** Internal debrief, process improvements, training updates
**3. Reputation Rebuilding:** Positive content push, customer appreciation, trust initiatives
**4. Monitoring:** Track sentiment recovery, watch for recurring issues, measure brand health

## Interactive Exercise

Create crisis response for this scenario:

"Your company experiences a data breach affecting 10,000 customer email addresses."

Write:
1. Initial 50-word social response
2. Email to affected customers
3. FAQ answering top 5 questions

**[PAUSE MARKER: 8 minutes]**

## Key Takeaways

- Preparation prevents panic
- Speed of response matters
- Empathy and transparency build trust
- Own mistakes, explain actions
- Have playbooks ready
- Recovery requires sustained effort
- Learn and improve from every crisis
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
AND tm.title = 'Campaign Strategy and Planning'
GROUP BY t.id, t.title, tm.id, tm.title;