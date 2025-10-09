#!/usr/bin/env tsx

/**
 * Data Migration Script: Local Storage to Supabase
 * 
 * This script migrates all data from your local JSON storage to Supabase
 * Run with: npx tsx scripts/migrate-to-supabase.ts [path-to-db.json]
 * Default path: ./server/data/db.json
 */

// Load environment variables first BEFORE any other imports
import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';

// Now import Supabase modules after env is loaded
import { supabaseAdmin } from '../server/supabase';
import {
  createUser,
  createPrompt,
  createPromptComment,
  createLibraryResource,
  createNotification,
  createOTPChallenge,
  createTrack,
  createTrackModule,
  createTrackLesson,
  createDiscussion,
  createDiscussionReply,
  createChallenge,
  createChallengeEntry,
  getUserByEmail,
  recordPromptInteraction,
  User,
  Prompt,
  LibraryResource,
  PromptComment,
  NotificationItem,
  OTPChallenge,
  Track,
  TrackModule,
  TrackLesson,
  Discussion,
  DiscussionReply,
  Challenge,
  ChallengeEntry,
} from '../server/storage-supabase';

// Local storage interface (based on your actual data structure)
interface LocalDB {
  users: Array<{
    id: string;
    email: string;
    name: string;
    passwordHash?: string;
    salt?: string;
    role: "student" | "instructor" | "admin";
    createdAt: string;
    isVerified?: boolean;
  }>;
  prompts: Array<{
    id: string;
    title: string;
    content: string;
    authorId: string;
    tags: string[];
    difficulty: "beginner" | "intermediate" | "advanced";
    likes: number;
    saves: number;
    views: number;
    runs: number;
    createdAt: string;
  }>;
  promptComments: Array<{
    id: string;
    promptId: string;
    userId: string;
    content: string;
    createdAt: string;
  }>;
  promptLikes?: Array<{
    promptId: string;
    userId: string;
  }>;
  promptSaves?: Array<{
    promptId: string;
    userId: string;
  }>;
  resources?: Array<{
    id: string;
    type: "prompt" | "template" | "guide" | "video";
    title: string;
    tags: string[];
    createdAt: string;
    content?: string;
    url?: string;
    description?: string;
    author?: string;
    category?: string;
    duration?: string;
  }>;
  notifications?: Array<{
    id: string;
    userId: string;
    type: "system" | "like" | "reply" | "save" | "achievement";
    title: string;
    body?: string;
    href?: string;
    createdAt: string;
    readAt?: string;
  }>;
  otps?: Array<{
    id: string;
    pendingId: string;
    email: string;
    userId?: string;
    purpose: "signup" | "login" | "reset";
    code: string;
    expiresAt: string;
    consumedAt?: string;
  }>;
  certificates?: any[];
  tracks?: Array<{
    id: string;
    title: string;
    description?: string;
    role?: string;
    level: "beginner" | "intermediate" | "advanced";
    estimatedHours?: number;
    certificateAvailable?: boolean;
    modules: Array<{
      id: string;
      title: string;
      description: string;
      estimatedHours?: number;
      lessons: Array<{
        id: string;
        title: string;
        type: "video" | "text" | "reading" | "sandbox" | "quiz" | "interactive";
        durationMin: number;
        level?: "beginner" | "intermediate" | "advanced";
        content?: string;
        videoUrl?: string;
      }>;
    }>;
  }>;
  libraryAcademy?: Array<{
    id: string;
    type: "prompt" | "template" | "guide" | "video";
    title: string;
    tags: string[];
    createdAt: string;
    content?: string;
    url?: string;
    description?: string;
    author?: string;
    category?: string;
    duration?: string;
  }>;
  discussions?: Array<{
    id: string;
    title: string;
    authorId: string;
    category: string;
    tags: string[];
    views: number;
    replies: number;
    isPinned?: boolean;
    createdAt: string;
    lastActivityAt: string;
  }>;
  discussionReplies?: Array<{
    id: string;
    discussionId: string;
    authorId: string;
    content: string;
    createdAt: string;
  }>;
  challenges?: Array<{
    id: string;
    title: string;
    description: string;
    startAt: string;
    endAt: string;
    criteria: {
      likesWeight: number;
      savesWeight: number;
      runsWeight: number;
      viewsWeight: number;
    };
  }>;
  challengeEntries?: Array<{
    id: string;
    challengeId: string;
    authorId: string;
    title: string;
    content: string;
    likesCount: number;
    savesCount: number;
    runsCount: number;
    viewsCount: number;
    createdAt: string;
  }>;
}

class DataMigrator {
  private stats = {
    users: 0,
    prompts: 0,
    comments: 0,
    resources: 0,
    notifications: 0,
    otps: 0,
    interactions: 0,
    tracks: 0,
    modules: 0,
    lessons: 0,
    libraryResources: 0,
    discussions: 0,
    discussionReplies: 0,
    challenges: 0,
    challengeEntries: 0,
    errors: 0,
  };

  async migrate(localDbPath: string = './server/data/db.json') {
    console.log('🚀 Starting migration from local storage to Supabase...');
    console.log(`📁 Reading from: ${localDbPath}`);

    try {
      // Check if local database exists
      if (!fs.existsSync(localDbPath)) {
        console.log('⚠️  Local database file not found. Creating sample data path...');
        console.log(`Expected path: ${path.resolve(localDbPath)}`);
        
        // Try common locations
        const possiblePaths = [
          './data.json',
          './server/data/db.json',
          './server/data.json',
          './data/db.json',
          '../data.json',
          './db.json',
          'server\\data\\db.json', // Windows path
          'server/data/db.json'   // Unix-style path
        ];
        
        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(possiblePath)) {
            console.log(`✅ Found database at: ${possiblePath}`);
            localDbPath = possiblePath;
            break;
          }
        }
        
        if (!fs.existsSync(localDbPath)) {
          console.log('❌ No local database found. Please check the path.');
          process.exit(1);
        }
      }

      // Load local data
      const localDataRaw = fs.readFileSync(localDbPath, 'utf8');
      const localData: LocalDB = JSON.parse(localDataRaw);

      console.log('📊 Found local data:');
      console.log(`  Users: ${localData.users?.length || 0}`);
      console.log(`  Prompts: ${localData.prompts?.length || 0}`);
      console.log(`  Comments: ${localData.promptComments?.length || 0}`);
      console.log(`  Resources: ${localData.resources?.length || 0}`);
      console.log(`  Notifications: ${localData.notifications?.length || 0}`);
      console.log(`  OTPs: ${localData.otps?.length || 0}`);
      console.log(`  Tracks: ${localData.tracks?.length || 0}`);
      console.log(`  Library Resources: ${localData.libraryAcademy?.length || 0}`);
      console.log(`  Discussions: ${localData.discussions?.length || 0}`);
      console.log(`  Discussion Replies: ${localData.discussionReplies?.length || 0}`);
      console.log(`  Challenges: ${localData.challenges?.length || 0}`);
      console.log(`  Challenge Entries: ${localData.challengeEntries?.length || 0}`);

      // Test Supabase connection
      console.log('🔗 Testing Supabase connection...');
      try {
        // Simple table access test instead of count query
        const { data: testData, error: testError } = await supabaseAdmin
          .from('users')
          .select('*')
          .limit(0);
        
        if (testError) {
          console.error('❌ Supabase connection failed:', testError.message || testError);
          console.error('Make sure you have run the database schema in Supabase SQL Editor:');
          console.error('1. Run database/schema.sql');
          console.error('2. Run database/rls_policies.sql');
          process.exit(1);
        }
        console.log('✅ Supabase connection successful');
      } catch (error) {
        console.error('❌ Supabase connection error:', error);
        console.error('Make sure your Supabase project is set up and environment variables are correct.');
        process.exit(1);
      }

      // Start migration
      await this.migrateUsers(localData.users || []);
      await this.migratePrompts(localData.prompts || []);
      await this.migrateComments(localData.promptComments || []);
      await this.migratePromptInteractions(localData.promptLikes || [], 'like');
      await this.migratePromptInteractions(localData.promptSaves || [], 'save');
      await this.migrateResources(localData.resources || []);
      await this.migrateNotifications(localData.notifications || []);
      await this.migrateOTPs(localData.otps || []);
      await this.migrateTracks(localData.tracks || []);
      await this.migrateLibraryResources(localData.libraryAcademy || []);
      await this.migrateDiscussions(localData.discussions || []);
      await this.migrateDiscussionReplies(localData.discussionReplies || []);
      await this.migrateChallenges(localData.challenges || []);
      await this.migrateChallengeEntries(localData.challengeEntries || []);

      // Print summary
      this.printSummary();

      // Create backup
      const backupPath = `${localDbPath}.backup.${Date.now()}`;
      fs.copyFileSync(localDbPath, backupPath);
      console.log(`💾 Created backup at: ${backupPath}`);

      console.log('✅ Migration completed successfully!');

    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  }

  private async migrateUsers(users: LocalDB['users']) {
    console.log('👤 Migrating users...');

    for (const localUser of users) {
      try {
        // Check if user already exists
        const existingUser = await getUserByEmail(localUser.email);
        if (existingUser) {
          console.log(`  ⏭️  User ${localUser.email} already exists, skipping`);
          continue;
        }

        // Create user in Supabase
        await createUser({
          email: localUser.email,
          name: localUser.name,
          role: localUser.role,
          is_verified: localUser.isVerified ?? true,
        });

        this.stats.users++;
        console.log(`  ✅ Migrated user: ${localUser.email}`);

      } catch (error) {
        console.error(`  ❌ Failed to migrate user ${localUser.email}:`, error);
        this.stats.errors++;
      }
    }
  }

  private async migratePrompts(prompts: LocalDB['prompts']) {
    console.log('💡 Migrating prompts...');

    for (const localPrompt of prompts) {
      try {
        // Create prompt in Supabase
        const prompt = await createPrompt({
          title: localPrompt.title,
          content: localPrompt.content,
          author_id: localPrompt.authorId,
          tags: localPrompt.tags || [],
          difficulty: localPrompt.difficulty,
        });

        // Migrate interactions (likes, saves, views, runs) as separate records
        if (localPrompt.likes > 0) {
          // Note: We can't perfectly migrate who liked what without individual records
          // This creates placeholder interactions for counts
          for (let i = 0; i < localPrompt.likes; i++) {
            try {
              await recordPromptInteraction(prompt.id, localPrompt.authorId, 'like');
            } catch (e) {
              // Ignore duplicates
            }
          }
        }

        this.stats.prompts++;
        console.log(`  ✅ Migrated prompt: ${localPrompt.title}`);

      } catch (error) {
        console.error(`  ❌ Failed to migrate prompt ${localPrompt.title}:`, error);
        this.stats.errors++;
      }
    }
  }

  private async migrateComments(comments: LocalDB['promptComments']) {
    console.log('💬 Migrating comments...');

    for (const localComment of comments) {
      try {
        await createPromptComment({
          prompt_id: localComment.promptId,
          user_id: localComment.userId,
          content: localComment.content,
        });

        this.stats.comments++;
        console.log(`  ✅ Migrated comment for prompt: ${localComment.promptId}`);

      } catch (error) {
        console.error(`  ❌ Failed to migrate comment:`, error);
        this.stats.errors++;
      }
    }
  }

  private async migratePromptInteractions(interactions: Array<{promptId: string, userId: string}>, type: 'like' | 'save') {
    console.log(`👍 Migrating prompt ${type}s...`);

    for (const interaction of interactions) {
      try {
        await recordPromptInteraction(interaction.promptId, interaction.userId, type);

        this.stats.interactions++;
        console.log(`  ✅ Migrated ${type} for prompt: ${interaction.promptId}`);

      } catch (error) {
        console.error(`  ❌ Failed to migrate ${type}:`, error);
        this.stats.errors++;
      }
    }
  }

  private async migrateResources(resources: LocalDB['resources']) {
    console.log('📚 Migrating library resources...');

    if (!resources || resources.length === 0) {
      console.log('  ⚠️  No resources to migrate');
      return;
    }

    for (const localResource of resources) {
      try {
        await createLibraryResource({
          type: localResource.type,
          title: localResource.title,
          content: localResource.content,
          url: localResource.url,
          description: localResource.description,
          author: localResource.author,
          category: localResource.category,
          duration: localResource.duration,
          tags: localResource.tags || [],
        });

        this.stats.resources++;
        console.log(`  ✅ Migrated resource: ${localResource.title}`);

      } catch (error) {
        console.error(`  ❌ Failed to migrate resource ${localResource.title}:`, error);
        this.stats.errors++;
      }
    }
  }

  private async migrateNotifications(notifications: LocalDB['notifications']) {
    console.log('🔔 Migrating notifications...');

    if (!notifications || notifications.length === 0) {
      console.log('  ⚠️  No notifications to migrate');
      return;
    }

    for (const localNotification of notifications) {
      try {
        await createNotification({
          user_id: localNotification.userId,
          type: localNotification.type,
          title: localNotification.title,
          body: localNotification.body,
          href: localNotification.href,
          read_at: localNotification.readAt,
        });

        this.stats.notifications++;
        console.log(`  ✅ Migrated notification: ${localNotification.title}`);

      } catch (error) {
        console.error(`  ❌ Failed to migrate notification:`, error);
        this.stats.errors++;
      }
    }
  }

  private async migrateOTPs(otps: LocalDB['otps']) {
    console.log('🔐 Migrating OTP challenges...');

    if (!otps || otps.length === 0) {
      console.log('  ⚠️  No OTPs to migrate');
      return;
    }

    for (const localOTP of otps) {
      try {
        // Only migrate non-expired, non-consumed OTPs
        const isExpired = new Date(localOTP.expiresAt) < new Date();
        if (isExpired || localOTP.consumedAt) {
          console.log(`  ⏭️  Skipping expired/consumed OTP: ${localOTP.pendingId}`);
          continue;
        }

        await createOTPChallenge({
          pending_id: localOTP.pendingId,
          email: localOTP.email,
          user_id: localOTP.userId,
          purpose: localOTP.purpose,
          code: localOTP.code,
          expires_at: localOTP.expiresAt,
          consumed_at: localOTP.consumedAt,
        });

        this.stats.otps++;
        console.log(`  ✅ Migrated OTP: ${localOTP.pendingId}`);

      } catch (error) {
        console.error(`  ❌ Failed to migrate OTP:`, error);
        this.stats.errors++;
      }
    }
  }

  private printSummary() {
    console.log('\n📈 Migration Summary:');
    console.log('====================');
    console.log(`✅ Users: ${this.stats.users}`);
    console.log(`✅ Prompts: ${this.stats.prompts}`);
    console.log(`✅ Comments: ${this.stats.comments}`);
    console.log(`✅ Resources: ${this.stats.resources}`);
    console.log(`✅ Notifications: ${this.stats.notifications}`);
    console.log(`✅ OTPs: ${this.stats.otps}`);
    console.log(`✅ Interactions: ${this.stats.interactions}`);
    console.log(`✅ Tracks: ${this.stats.tracks}`);
    console.log(`✅ Modules: ${this.stats.modules}`);
    console.log(`✅ Lessons: ${this.stats.lessons}`);
    console.log(`✅ Library Resources: ${this.stats.libraryResources}`);
    console.log(`✅ Discussions: ${this.stats.discussions}`);
    console.log(`✅ Discussion Replies: ${this.stats.discussionReplies}`);
    console.log(`✅ Challenges: ${this.stats.challenges}`);
    console.log(`✅ Challenge Entries: ${this.stats.challengeEntries}`);
    console.log(`❌ Errors: ${this.stats.errors}`);
    console.log('====================');
  }

  private async migrateTracks(tracks: LocalDB['tracks']) {
    console.log('🛤️ Migrating learning tracks...');

    if (!tracks || tracks.length === 0) {
      console.log('  ⚠️  No tracks to migrate');
      return;
    }

    for (const localTrack of tracks) {
      try {
        // Create the track
        const track = await createTrack({
          title: localTrack.title,
          description: localTrack.description,
          level: localTrack.level,
          role: localTrack.role,
          estimated_hours: localTrack.estimatedHours,
          certificate_available: localTrack.certificateAvailable,
        });

        this.stats.tracks++;
        console.log(`  ✅ Migrated track: ${localTrack.title}`);

        // Migrate modules for this track
        if (localTrack.modules && localTrack.modules.length > 0) {
          for (let moduleIndex = 0; moduleIndex < localTrack.modules.length; moduleIndex++) {
            const localModule = localTrack.modules[moduleIndex];
            try {
              const trackModule = await createTrackModule({
                track_id: track.id,
                title: localModule.title,
                description: localModule.description,
                estimated_hours: localModule.estimatedHours,
                order_index: moduleIndex,
              });

              this.stats.modules++;
              console.log(`    ✅ Migrated module: ${localModule.title}`);

              // Migrate lessons for this module
              if (localModule.lessons && localModule.lessons.length > 0) {
                for (let lessonIndex = 0; lessonIndex < localModule.lessons.length; lessonIndex++) {
                  const localLesson = localModule.lessons[lessonIndex];
                  try {
                    await createTrackLesson({
                      module_id: trackModule.id,
                      title: localLesson.title,
                      duration_minutes: localLesson.durationMin,
                      type: localLesson.type,
                      level: localLesson.level,
                      content: localLesson.content,
                      video_url: localLesson.videoUrl,
                      order_index: lessonIndex,
                    });

                    this.stats.lessons++;
                    console.log(`      ✅ Migrated lesson: ${localLesson.title}`);
                  } catch (error) {
                    console.error(`      ❌ Failed to migrate lesson ${localLesson.title}:`, error);
                    this.stats.errors++;
                  }
                }
              }
            } catch (error) {
              console.error(`    ❌ Failed to migrate module ${localModule.title}:`, error);
              this.stats.errors++;
            }
          }
        }
      } catch (error) {
        console.error(`  ❌ Failed to migrate track ${localTrack.title}:`, error);
        this.stats.errors++;
      }
    }
  }

  private async migrateLibraryResources(resources: LocalDB['libraryAcademy']) {
    console.log('📚 Migrating library resources...');

    if (!resources || resources.length === 0) {
      console.log('  ⚠️  No library resources to migrate');
      return;
    }

    for (const localResource of resources) {
      try {
        await createLibraryResource({
          type: localResource.type,
          title: localResource.title,
          content: localResource.content,
          url: localResource.url,
          description: localResource.description,
          author: localResource.author,
          category: localResource.category,
          duration: localResource.duration,
          tags: localResource.tags || [],
        });

        this.stats.libraryResources++;
        console.log(`  ✅ Migrated library resource: ${localResource.title}`);
      } catch (error) {
        console.error(`  ❌ Failed to migrate library resource ${localResource.title}:`, error);
        this.stats.errors++;
      }
    }
  }

  private async migrateDiscussions(discussions: LocalDB['discussions']) {
    console.log('💬 Migrating discussions...');

    if (!discussions || discussions.length === 0) {
      console.log('  ⚠️  No discussions to migrate');
      return;
    }

    // Create a system user for orphaned content if needed
    const systemUserId = '00000000-0000-4000-8000-000000000000';
    let systemUserCreated = false;

    for (const localDiscussion of discussions) {
      try {
        // Check if authorId is a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        let authorId = localDiscussion.authorId;
        
        // If not a valid UUID, use system user and create it if needed
        if (!uuidRegex.test(authorId)) {
          authorId = systemUserId;
          console.log(`    ⚠️  Converting invalid authorId '${localDiscussion.authorId}' to system UUID`);
          
          // Create system user if not already created
          if (!systemUserCreated) {
            try {
              await createUser({
                id: systemUserId,
                email: 'system@aifirst.academy',
                name: 'System User',
                role: 'admin',
                is_verified: true,
              } as any);
              systemUserCreated = true;
              console.log(`    ✅ Created system user for orphaned content`);
            } catch (error) {
              // System user might already exist, ignore error
              systemUserCreated = true;
            }
          }
        }

        await createDiscussion({
          title: localDiscussion.title,
          author_id: authorId,
          category: localDiscussion.category,
          tags: localDiscussion.tags || [],
          views_count: localDiscussion.views || 0,
          replies_count: localDiscussion.replies || 0,
          is_pinned: localDiscussion.isPinned || false,
        });

        this.stats.discussions++;
        console.log(`  ✅ Migrated discussion: ${localDiscussion.title}`);
      } catch (error) {
        console.error(`  ❌ Failed to migrate discussion ${localDiscussion.title}:`, error);
        this.stats.errors++;
      }
    }
  }

  private async migrateDiscussionReplies(replies: LocalDB['discussionReplies']) {
    console.log('💬 Migrating discussion replies...');

    if (!replies || replies.length === 0) {
      console.log('  ⚠️  No discussion replies to migrate');
      return;
    }

    for (const localReply of replies) {
      try {
        await createDiscussionReply({
          discussion_id: localReply.discussionId,
          author_id: localReply.authorId,
          content: localReply.content,
        });

        this.stats.discussionReplies++;
        console.log(`  ✅ Migrated discussion reply`);
      } catch (error) {
        console.error(`  ❌ Failed to migrate discussion reply:`, error);
        this.stats.errors++;
      }
    }
  }

  private async migrateChallenges(challenges: LocalDB['challenges']) {
    console.log('🏆 Migrating challenges...');

    if (!challenges || challenges.length === 0) {
      console.log('  ⚠️  No challenges to migrate');
      return;
    }

    for (const localChallenge of challenges) {
      try {
        await createChallenge({
          title: localChallenge.title,
          description: localChallenge.description,
          starts_at: localChallenge.startAt,
          ends_at: localChallenge.endAt,
          likes_weight: localChallenge.criteria.likesWeight,
          saves_weight: localChallenge.criteria.savesWeight,
          runs_weight: localChallenge.criteria.runsWeight,
          views_weight: localChallenge.criteria.viewsWeight,
        });

        this.stats.challenges++;
        console.log(`  ✅ Migrated challenge: ${localChallenge.title}`);
      } catch (error) {
        console.error(`  ❌ Failed to migrate challenge ${localChallenge.title}:`, error);
        this.stats.errors++;
      }
    }
  }

  private async migrateChallengeEntries(entries: LocalDB['challengeEntries']) {
    console.log('🏆 Migrating challenge entries...');

    if (!entries || entries.length === 0) {
      console.log('  ⚠️  No challenge entries to migrate');
      return;
    }

    for (const localEntry of entries) {
      try {
        await createChallengeEntry({
          challenge_id: localEntry.challengeId,
          author_id: localEntry.authorId,
          title: localEntry.title,
          content: localEntry.content,
          likes_count: localEntry.likesCount,
          saves_count: localEntry.savesCount,
          runs_count: localEntry.runsCount,
          views_count: localEntry.viewsCount,
        });

        this.stats.challengeEntries++;
        console.log(`  ✅ Migrated challenge entry: ${localEntry.title}`);
      } catch (error) {
        console.error(`  ❌ Failed to migrate challenge entry ${localEntry.title}:`, error);
        this.stats.errors++;
      }
    }
  }
}

// Run migration - always execute when script is run
const migrator = new DataMigrator();

// Get path from command line argument or use default
const dbPath = process.argv[2] || './server/data/db.json';

migrator.migrate(dbPath).catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});

export { DataMigrator };
