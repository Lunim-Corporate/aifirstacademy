-- ========================================
-- AI-First Academy - Learning Content Seeder (FIXED VERSION)
-- ========================================
-- Run this after schema.sql to populate complete curriculum
-- FIXES: All string IDs replaced with proper UUID generation

BEGIN;

/*
-- ========================================
-- ENGINEERING PROMPTING TRACK
-- ========================================

-- Track: Engineering Prompting
INSERT INTO tracks (id, title, description, level, role, estimated_hours, certificate_available) VALUES (
  uuid_generate_v4(),
  'Engineering Prompting Track',
  'Master AI prompting for software development, system design, and technical problem-solving. Learn to use AI as your coding pair-programmer and architecture consultant.',
  'beginner',
  'engineer',
  40,
  true
);

-- Module 1: Code Generation Mastery
INSERT INTO track_modules (id, track_id, title, description, estimated_hours, order_index) VALUES (
  uuid_generate_v4(),
  (SELECT id FROM tracks WHERE title = 'Engineering Prompting Track'),
  'Code Generation Mastery',
  'Master prompts for generating clean, efficient code and debugging through conversational AI.',
  10,
  1
);

-- Lessons for Code Generation Mastery
INSERT INTO track_lessons (id, module_id, title, duration_minutes, type, level, content, video_url, order_index) VALUES 
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Code Generation Mastery'), 'The Engineer''s Prompt Toolkit', 35, 'video', 'beginner', 'Essential prompt patterns for code generation, context setting for technical conversations, and language-specific prompting strategies. Learn the foundational frameworks every engineer needs.', 'https://player.vimeo.com/video/sample1', 1),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Code Generation Mastery'), 'Function Generation Mastery', 40, 'sandbox', 'beginner', 'Practice writing prompts for complex functions, handling edge cases and error conditions, and testing validation prompts through hands-on exercises.', null, 2),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Code Generation Mastery'), 'Code Review Through AI', 45, 'video', 'beginner', 'Learn prompts for code analysis and improvement, security vulnerability detection, and performance optimization conversations with AI assistants.', 'https://player.vimeo.com/video/sample2', 3),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Code Generation Mastery'), 'Debugging Dialogue Techniques', 40, 'interactive', 'beginner', 'Master structured debugging conversations, error analysis prompts, and step-by-step problem resolution methodologies.', null, 4),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Code Generation Mastery'), 'Algorithm Design Conversations', 35, 'video', 'beginner', 'Develop skills in algorithm brainstorming prompts, complexity analysis discussions, and trade-off evaluation techniques.', 'https://player.vimeo.com/video/sample3', 5),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Code Generation Mastery'), 'Documentation Generation', 30, 'sandbox', 'beginner', 'Auto-generate comprehensive documentation, API documentation prompts, and code comment optimization strategies.', null, 6);

-- Module 2: System Architecture Prompting  
INSERT INTO track_modules (id, track_id, title, description, estimated_hours, order_index) VALUES (
  uuid_generate_v4(),
  (SELECT id FROM tracks WHERE title = 'Engineering Prompting Track'),
  'System Architecture Prompting',
  'Design system architectures through AI collaboration, learn infrastructure-as-code prompting, and master deployment conversations.',
  15,
  2
);

-- Lessons for System Architecture Prompting
INSERT INTO track_lessons (id, module_id, title, duration_minutes, type, level, content, video_url, order_index) VALUES 
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'System Architecture Prompting'), 'Architecture Design Dialogue', 40, 'video', 'intermediate', 'Advanced prompts for system design discussions, scalability and reliability considerations, and technology stack selection conversations.', 'https://player.vimeo.com/video/sample4', 1),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'System Architecture Prompting'), 'Database Design Through AI', 45, 'sandbox', 'intermediate', 'Schema design prompts, query optimization conversations, and database technology selection with hands-on practice.', null, 2),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'System Architecture Prompting'), 'Infrastructure Prompting', 50, 'interactive', 'intermediate', 'Docker and Kubernetes prompts, cloud infrastructure conversations, and CI/CD pipeline design methodologies.', null, 3),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'System Architecture Prompting'), 'Microservices Design', 45, 'video', 'intermediate', 'Service boundary identification, communication pattern selection, and data consistency strategies through AI collaboration.', 'https://player.vimeo.com/video/sample5', 4);

-- Module 3: AI-Powered Development Workflows
INSERT INTO track_modules (id, track_id, title, description, estimated_hours, order_index) VALUES (
  uuid_generate_v4(),
  (SELECT id FROM tracks WHERE title = 'Engineering Prompting Track'),
  'AI-Powered Development Workflows',
  'Integrate AI into your daily development workflow with advanced prompting techniques for productivity and quality.',
  15,
  3
);

-- Lessons for AI-Powered Development Workflows
INSERT INTO track_lessons (id, module_id, title, duration_minutes, type, level, content, video_url, order_index) VALUES 
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'AI-Powered Development Workflows'), 'Test-Driven Development with AI', 45, 'video', 'advanced', 'Advanced techniques for AI-assisted TDD, automated test generation, and quality assurance prompting strategies.', 'https://player.vimeo.com/video/sample6', 1),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'AI-Powered Development Workflows'), 'Code Refactoring Mastery', 40, 'sandbox', 'advanced', 'Systematic approach to AI-guided refactoring, technical debt management, and code quality improvement.', null, 2),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'AI-Powered Development Workflows'), 'Performance Optimization', 50, 'interactive', 'advanced', 'AI-powered performance analysis, bottleneck identification, and optimization strategy development.', null, 3),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'AI-Powered Development Workflows'), 'Security-First Development', 45, 'video', 'advanced', 'Security vulnerability assessment prompts, secure coding practices, and AI-assisted penetration testing.', 'https://player.vimeo.com/video/sample7', 4);
*/

-- ========================================
-- MARKETING PROMPTING TRACK
-- ========================================

-- Track: Marketing Prompting
INSERT INTO tracks (id, title, description, level, role, estimated_hours, certificate_available) VALUES (
  uuid_generate_v4(),
  'Marketing Prompting Track', 
  'Transform AI into your creative partner and strategic advisor. Master AI-powered marketing content creation, customer analysis, and campaign optimization.',
  'beginner',
  'marketer',
  38,
  true
);

-- Module 1: Content Creation Mastery
INSERT INTO track_modules (id, track_id, title, description, estimated_hours, order_index) VALUES (
  uuid_generate_v4(),
  (SELECT id FROM tracks WHERE title = 'Marketing Prompting Track'),
  'Content Creation Mastery',
  'Master AI for high-converting marketing copy, brand voice consistency, and multi-channel content creation.',
  12,
  1
);

-- Lessons for Content Creation Mastery
INSERT INTO track_lessons (id, module_id, title, duration_minutes, type, level, content, video_url, order_index) VALUES 
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Content Creation Mastery'), 'The Marketer''s Prompt Arsenal', 35, 'video', 'beginner', 'Essential patterns for marketing copy, brand voice integration techniques, and platform-specific adaptations for maximum impact.', 'https://player.vimeo.com/video/marketing1', 1),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Content Creation Mastery'), 'High-Converting Copy Generation', 40, 'sandbox', 'beginner', 'Sales page prompts that convert, email sequence development, and ad copy optimization techniques with real-world practice.', null, 2),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Content Creation Mastery'), 'Social Media Content Factory', 45, 'interactive', 'beginner', 'Platform-specific content prompts, viral content pattern recognition, and engagement optimization strategies across channels.', null, 3),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Content Creation Mastery'), 'Brand Voice Consistency', 30, 'video', 'beginner', 'Voice and tone development prompts, brand guideline creation, and consistency checking techniques for cohesive messaging.', 'https://player.vimeo.com/video/marketing2', 4),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Content Creation Mastery'), 'Email Marketing Mastery', 45, 'sandbox', 'beginner', 'Subject line optimization, email sequence automation, and personalization at scale through strategic prompting.', null, 5),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Content Creation Mastery'), 'Video Script Creation', 40, 'video', 'beginner', 'Engaging video content prompts, storytelling framework application, and call-to-action optimization for video marketing.', 'https://player.vimeo.com/video/marketing3', 6);

-- Module 2: Customer Research and Insights
INSERT INTO track_modules (id, track_id, title, description, estimated_hours, order_index) VALUES (
  uuid_generate_v4(),
  (SELECT id FROM tracks WHERE title = 'Marketing Prompting Track'),
  'Customer Research and Insights',
  'Leverage AI for deep customer understanding, market research automation, and data-driven marketing strategies.',
  13,
  2
);

-- Lessons for Customer Research and Insights  
INSERT INTO track_lessons (id, module_id, title, duration_minutes, type, level, content, video_url, order_index) VALUES 
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Customer Research and Insights'), 'Persona Development Through AI', 40, 'video', 'intermediate', 'Advanced techniques for AI-powered customer persona creation, behavioral analysis, and psychographic profiling.', 'https://player.vimeo.com/video/marketing4', 1),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Customer Research and Insights'), 'Market Research Automation', 45, 'sandbox', 'intermediate', 'Automated competitive analysis, trend identification, and market opportunity assessment through structured prompting.', null, 2),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Customer Research and Insights'), 'Customer Journey Mapping', 35, 'interactive', 'intermediate', 'AI-assisted customer journey visualization, touchpoint optimization, and experience gap identification.', null, 3),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Customer Research and Insights'), 'Data Analysis Conversations', 45, 'video', 'intermediate', 'Transform raw marketing data into actionable insights through strategic AI conversations and analysis prompts.', 'https://player.vimeo.com/video/marketing5', 4);

-- Module 3: Campaign Strategy and Optimization
INSERT INTO track_modules (id, track_id, title, description, estimated_hours, order_index) VALUES (
  uuid_generate_v4(),
  (SELECT id FROM tracks WHERE title = 'Marketing Prompting Track'),
  'Campaign Strategy and Optimization',
  'Design and optimize marketing campaigns with AI-powered strategy development and performance analysis.',
  13,
  3
);

-- Lessons for Campaign Strategy and Optimization
INSERT INTO track_lessons (id, module_id, title, duration_minutes, type, level, content, video_url, order_index) VALUES 
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Campaign Strategy and Optimization'), 'Campaign Strategy Development', 40, 'video', 'advanced', 'Comprehensive campaign planning with AI, multi-channel strategy development, and budget allocation optimization.', 'https://player.vimeo.com/video/marketing6', 1),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Campaign Strategy and Optimization'), 'Performance Analytics Mastery', 45, 'sandbox', 'advanced', 'AI-powered campaign performance analysis, ROI optimization, and predictive marketing analytics.', null, 2),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Campaign Strategy and Optimization'), 'A/B Testing Strategy', 35, 'interactive', 'advanced', 'Design and analyze A/B tests with AI assistance, statistical significance evaluation, and optimization recommendations.', null, 3),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Campaign Strategy and Optimization'), 'Growth Hacking with AI', 50, 'video', 'advanced', 'Innovative growth strategies, viral mechanism design, and scalable acquisition tactics powered by AI insights.', 'https://player.vimeo.com/video/marketing7', 4);

-- ========================================
-- DESIGN PROMPTING TRACK  
-- ========================================

-- Track: Design Prompting
INSERT INTO tracks (id, title, description, level, role, estimated_hours, certificate_available) VALUES (
  uuid_generate_v4(),
  'Design Prompting Track',
  'AI-augmented design process and creative development. Master visual ideation, user experience optimization, and design system creation with AI.',
  'beginner', 
  'designer',
  36,
  true
);

-- Module 1: Creative Ideation Through AI
INSERT INTO track_modules (id, track_id, title, description, estimated_hours, order_index) VALUES (
  uuid_generate_v4(),
  (SELECT id FROM tracks WHERE title = 'Design Prompting Track'),
  'Creative Ideation Through AI',
  'Generate innovative design concepts through AI collaboration and master visual description and iteration prompts.',
  12,
  1
);

-- Lessons for Creative Ideation Through AI
INSERT INTO track_lessons (id, module_id, title, duration_minutes, type, level, content, video_url, order_index) VALUES 
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Creative Ideation Through AI'), 'The Designer''s AI Toolkit', 35, 'video', 'beginner', 'Visual prompting fundamentals, creative brainstorming techniques, and design iteration strategies with AI assistance.', 'https://player.vimeo.com/video/design1', 1),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Creative Ideation Through AI'), 'Concept Generation Mastery', 40, 'sandbox', 'beginner', 'Mood board development prompts, style exploration conversations, and creative constraint navigation techniques.', null, 2),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Creative Ideation Through AI'), 'User Experience Conversations', 45, 'interactive', 'beginner', 'User journey prompting, pain point identification, and solution brainstorming techniques for UX optimization.', null, 3),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Creative Ideation Through AI'), 'Visual Design Iteration', 40, 'video', 'beginner', 'Layout exploration prompts, color and typography discussions, and design refinement strategies.', 'https://player.vimeo.com/video/design2', 4),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Creative Ideation Through AI'), 'Design System Development', 35, 'sandbox', 'beginner', 'Component library planning, consistency framework creation, and scalability considerations for design systems.', null, 5);

-- Module 2: User-Centered Design with AI
INSERT INTO track_modules (id, track_id, title, description, estimated_hours, order_index) VALUES (
  uuid_generate_v4(),
  (SELECT id FROM tracks WHERE title = 'Design Prompting Track'),
  'User-Centered Design with AI',
  'Enhance user research, usability testing, and accessibility with AI-powered design methodologies.',
  12,
  2
);

-- Lessons for User-Centered Design with AI
INSERT INTO track_lessons (id, module_id, title, duration_minutes, type, level, content, video_url, order_index) VALUES 
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'User-Centered Design with AI'), 'User Research Automation', 40, 'video', 'intermediate', 'AI-powered user interviews, survey analysis, and behavioral pattern identification for better design decisions.', 'https://player.vimeo.com/video/design3', 1),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'User-Centered Design with AI'), 'Usability Testing Enhancement', 45, 'sandbox', 'intermediate', 'AI-assisted usability test design, feedback analysis, and improvement recommendation generation.', null, 2),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'User-Centered Design with AI'), 'Accessibility-First Design', 35, 'interactive', 'intermediate', 'AI-powered accessibility auditing, inclusive design prompting, and compliance checking strategies.', null, 3),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'User-Centered Design with AI'), 'Information Architecture', 45, 'video', 'intermediate', 'AI-assisted IA development, content organization strategies, and navigation optimization techniques.', 'https://player.vimeo.com/video/design4', 4);

-- Module 3: Advanced Design Innovation
INSERT INTO track_modules (id, track_id, title, description, estimated_hours, order_index) VALUES (
  uuid_generate_v4(),
  (SELECT id FROM tracks WHERE title = 'Design Prompting Track'),
  'Advanced Design Innovation',
  'Push creative boundaries with AI-powered innovation, emerging technology integration, and future-focused design.',
  12,
  3
);

-- Lessons for Advanced Design Innovation
INSERT INTO track_lessons (id, module_id, title, duration_minutes, type, level, content, video_url, order_index) VALUES 
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Advanced Design Innovation'), 'Emerging Tech Integration', 50, 'video', 'advanced', 'Design for AR/VR, AI interfaces, and emerging technologies with forward-thinking prompting strategies.', 'https://player.vimeo.com/video/design5', 1),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Advanced Design Innovation'), 'Design System Scaling', 45, 'sandbox', 'advanced', 'Enterprise-level design system management, cross-platform consistency, and automated design token generation.', null, 2),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Advanced Design Innovation'), 'Creative AI Collaboration', 40, 'interactive', 'advanced', 'Advanced AI-human creative partnerships, generative design techniques, and computational creativity methods.', null, 3);

-- ========================================
-- MANAGEMENT PROMPTING TRACK
-- ========================================

-- Track: Management Prompting  
INSERT INTO tracks (id, title, description, level, role, estimated_hours, certificate_available) VALUES (
  uuid_generate_v4(),
  'Management Prompting Track',
  'AI-enhanced leadership and strategic decision-making. Master team communication, project management, and organizational efficiency through AI.',
  'beginner',
  'manager', 
  42,
  true
);

-- Module 1: Team Management Excellence
INSERT INTO track_modules (id, track_id, title, description, estimated_hours, order_index) VALUES (
  uuid_generate_v4(),
  (SELECT id FROM tracks WHERE title = 'Management Prompting Track'),
  'Team Management Excellence', 
  'Master AI for team communication, motivation, conflict resolution, and performance improvement strategies.',
  14,
  1
);

-- Lessons for Team Management Excellence
INSERT INTO track_lessons (id, module_id, title, duration_minutes, type, level, content, video_url, order_index) VALUES 
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Team Management Excellence'), 'The Manager''s AI Assistant', 35, 'video', 'beginner', 'Leadership communication patterns, team dynamics analysis, and decision-making frameworks powered by AI.', 'https://player.vimeo.com/video/management1', 1),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Team Management Excellence'), 'One-on-One Optimization', 40, 'sandbox', 'beginner', 'Individual development prompts, career conversation guides, and performance feedback templates for effective 1:1s.', null, 2),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Team Management Excellence'), 'Conflict Resolution Strategies', 45, 'interactive', 'beginner', 'AI-assisted conflict mediation, solution evaluation frameworks, and consensus building techniques.', null, 3),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Team Management Excellence'), 'Team Motivation Mastery', 40, 'video', 'beginner', 'Motivational communication strategies, recognition program design, and engagement optimization with AI insights.', 'https://player.vimeo.com/video/management2', 4),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Team Management Excellence'), 'Performance Management', 50, 'sandbox', 'beginner', 'Goal setting frameworks, performance review optimization, and development plan creation through AI collaboration.', null, 5);

-- Module 2: Strategic Planning and Decision Making
INSERT INTO track_modules (id, track_id, title, description, estimated_hours, order_index) VALUES (
  uuid_generate_v4(),
  (SELECT id FROM tracks WHERE title = 'Management Prompting Track'),
  'Strategic Planning and Decision Making',
  'Develop strategic thinking, data-driven decision making, and organizational planning with AI-powered analysis.',
  14,
  2
);

-- Lessons for Strategic Planning and Decision Making  
INSERT INTO track_lessons (id, module_id, title, duration_minutes, type, level, content, video_url, order_index) VALUES 
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Strategic Planning and Decision Making'), 'Strategic Analysis with AI', 45, 'video', 'intermediate', 'Market analysis, competitive intelligence, and strategic opportunity identification through AI-powered research.', 'https://player.vimeo.com/video/management3', 1),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Strategic Planning and Decision Making'), 'Data-Driven Decision Making', 50, 'sandbox', 'intermediate', 'Business intelligence prompting, predictive analysis techniques, and risk assessment frameworks.', null, 2),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Strategic Planning and Decision Making'), 'Project Planning Mastery', 40, 'interactive', 'intermediate', 'Resource allocation optimization, timeline development, and stakeholder communication strategies.', null, 3),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Strategic Planning and Decision Making'), 'Change Management', 45, 'video', 'intermediate', 'Organizational change strategies, resistance management, and transformation communication with AI support.', 'https://player.vimeo.com/video/management4', 4);

-- Module 3: Organizational Leadership  
INSERT INTO track_modules (id, track_id, title, description, estimated_hours, order_index) VALUES (
  uuid_generate_v4(),
  (SELECT id FROM tracks WHERE title = 'Management Prompting Track'),
  'Organizational Leadership',
  'Advanced leadership techniques, culture building, and organizational development powered by AI insights.',
  14,
  3
);

-- Lessons for Organizational Leadership
INSERT INTO track_lessons (id, module_id, title, duration_minutes, type, level, content, video_url, order_index) VALUES 
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Organizational Leadership'), 'Culture Development', 45, 'video', 'advanced', 'Organizational culture assessment, values integration, and culture change initiatives with AI-powered strategies.', 'https://player.vimeo.com/video/management5', 1),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Organizational Leadership'), 'Executive Communication', 40, 'sandbox', 'advanced', 'Board presentation optimization, stakeholder communication, and executive reporting with AI assistance.', null, 2),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Organizational Leadership'), 'Innovation Leadership', 50, 'interactive', 'advanced', 'Innovation strategy development, creative team management, and disruptive thinking facilitation.', null, 3);

-- ========================================
-- RESEARCH PROMPTING TRACK
-- ========================================

-- Track: Research Prompting
INSERT INTO tracks (id, title, description, level, role, estimated_hours, certificate_available) VALUES (
  uuid_generate_v4(),
  'Research Prompting Track',
  'AI-accelerated research methodology and analysis. Master literature reviews, data analysis, and research synthesis with AI collaboration.',
  'beginner',
  'researcher',
  44,
  true
);

-- Module 1: Research Design and Methodology
INSERT INTO track_modules (id, track_id, title, description, estimated_hours, order_index) VALUES (
  uuid_generate_v4(),
  (SELECT id FROM tracks WHERE title = 'Research Prompting Track'),
  'Research Design and Methodology',
  'Design robust research frameworks, master literature reviews, and develop hypothesis generation with AI assistance.',
  15,
  1
);

-- Lessons for Research Design and Methodology
INSERT INTO track_lessons (id, module_id, title, duration_minutes, type, level, content, video_url, order_index) VALUES 
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Research Design and Methodology'), 'Research Framework Development', 45, 'video', 'beginner', 'AI-powered research design, methodology selection, and experimental framework development for robust studies.', 'https://player.vimeo.com/video/research1', 1),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Research Design and Methodology'), 'Literature Review Automation', 50, 'sandbox', 'beginner', 'Systematic literature reviews, source evaluation, and synthesis techniques with AI-powered research assistance.', null, 2),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Research Design and Methodology'), 'Hypothesis Generation', 40, 'interactive', 'beginner', 'AI-assisted hypothesis development, research question formulation, and theoretical framework construction.', null, 3),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Research Design and Methodology'), 'Data Collection Strategy', 45, 'video', 'beginner', 'Survey design, interview protocol development, and data collection optimization with AI guidance.', 'https://player.vimeo.com/video/research2', 4),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Research Design and Methodology'), 'Research Ethics and Compliance', 35, 'interactive', 'beginner', 'Ethical consideration frameworks, compliance checking, and responsible research practices with AI tools.', null, 5);

-- Module 2: Data Analysis and Interpretation
INSERT INTO track_modules (id, track_id, title, description, estimated_hours, order_index) VALUES (
  uuid_generate_v4(),
  (SELECT id FROM tracks WHERE title = 'Research Prompting Track'),
  'Data Analysis and Interpretation',
  'Advanced data analysis techniques, statistical interpretation, and insight generation with AI-powered analytics.',
  15,
  2
);

-- Lessons for Data Analysis and Interpretation
INSERT INTO track_lessons (id, module_id, title, duration_minutes, type, level, content, video_url, order_index) VALUES 
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Data Analysis and Interpretation'), 'Statistical Analysis with AI', 50, 'video', 'intermediate', 'AI-powered statistical analysis, significance testing, and advanced analytical technique selection.', 'https://player.vimeo.com/video/research3', 1),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Data Analysis and Interpretation'), 'Qualitative Data Analysis', 45, 'sandbox', 'intermediate', 'Thematic analysis, coding strategies, and qualitative insight generation with AI assistance.', null, 2),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Data Analysis and Interpretation'), 'Data Visualization Mastery', 40, 'interactive', 'intermediate', 'Compelling data visualization, chart selection, and narrative development for research communication.', null, 3),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Data Analysis and Interpretation'), 'Research Synthesis', 45, 'video', 'intermediate', 'Meta-analysis techniques, cross-study comparison, and comprehensive research synthesis methodologies.', 'https://player.vimeo.com/video/research4', 4);

-- Module 3: Research Communication and Impact
INSERT INTO track_modules (id, track_id, title, description, estimated_hours, order_index) VALUES (
  uuid_generate_v4(),
  (SELECT id FROM tracks WHERE title = 'Research Prompting Track'),
  'Research Communication and Impact', 
  'Master research communication, publication strategies, and impact measurement with AI-enhanced techniques.',
  14,
  3
);

-- Lessons for Research Communication and Impact
INSERT INTO track_lessons (id, module_id, title, duration_minutes, type, level, content, video_url, order_index) VALUES 
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Research Communication and Impact'), 'Academic Writing Excellence', 50, 'video', 'advanced', 'AI-assisted academic writing, publication preparation, and peer review optimization strategies.', 'https://player.vimeo.com/video/research5', 1),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Research Communication and Impact'), 'Research Presentation Mastery', 45, 'sandbox', 'advanced', 'Conference presentation development, visual communication, and audience engagement techniques.', null, 2),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Research Communication and Impact'), 'Impact Measurement', 40, 'interactive', 'advanced', 'Research impact assessment, citation analysis, and knowledge transfer optimization with AI tools.', null, 3),
  (uuid_generate_v4(), (SELECT id FROM track_modules WHERE title = 'Research Communication and Impact'), 'Collaborative Research', 45, 'video', 'advanced', 'Multi-disciplinary collaboration, research network building, and knowledge sharing strategies.', 'https://player.vimeo.com/video/research6', 4);

COMMIT;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify content was created successfully
SELECT 
  t.title as track_title,
  t.role,
  t.estimated_hours,
  COUNT(DISTINCT tm.id) as modules_count,
  COUNT(tl.id) as lessons_count
FROM tracks t
LEFT JOIN track_modules tm ON t.id = tm.track_id
LEFT JOIN track_lessons tl ON tm.id = tl.module_id
GROUP BY t.id, t.title, t.role, t.estimated_hours
ORDER BY t.role;