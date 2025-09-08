// Test script to check database and authentication
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_FILE = path.join(process.cwd(), 'server/data/db.json');

function hashPassword(password, salt) {
  return crypto.createHash("sha256").update(salt + password).digest("hex");
}

function createId(prefix) {
  return `${prefix}_${crypto.randomBytes(10).toString("hex")}`;
}

function checkDatabase() {
  console.log('Checking database...');
  console.log('DB File path:', DB_FILE);
  
  if (!fs.existsSync(DB_FILE)) {
    console.log('❌ Database file does not exist');
    return;
  }
  
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const db = JSON.parse(data);
    
    console.log('✅ Database file exists');
    console.log('Users count:', db.users ? db.users.length : 0);
    
    if (db.users && db.users.length > 0) {
      console.log('\nUsers in database:');
      db.users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (${user.name}) - Role: ${user.role}`);
        console.log(`     ID: ${user.id}`);
        console.log(`     Verified: ${user.isVerified}`);
        console.log(`     Has password: ${!!user.passwordHash}`);
        console.log('');
      });
    } else {
      console.log('❌ No users found in database');
    }
    
    // Test admin user login
    const adminUser = db.users.find(u => u.email === 'admin@aifirst.academy');
    if (adminUser) {
      console.log('\nTesting admin user:');
      const testPassword = 'admin';
      const testHash = hashPassword(testPassword, adminUser.salt);
      const matches = testHash === adminUser.passwordHash;
      console.log(`Password "${testPassword}" matches:`, matches);
      
      if (!matches) {
        console.log('Admin password hash:', adminUser.passwordHash);
        console.log('Test hash:', testHash);
        console.log('Salt:', adminUser.salt);
      }
    }
    
  } catch (error) {
    console.log('❌ Error reading database:', error.message);
  }
}

function createTestUser() {
  console.log('\nCreating test user...');
  
  try {
    // Ensure directory exists
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    let db = { users: [] };
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(data);
    }
    
    // Check if test user already exists
    const testEmail = 'test@example.com';
    const existingUser = db.users.find(u => u.email.toLowerCase() === testEmail.toLowerCase());
    if (existingUser) {
      console.log('✅ Test user already exists:', testEmail);
      return;
    }
    
    // Create test user
    const salt = createId('salt');
    const password = 'testpass123';
    const passwordHash = hashPassword(password, salt);
    
    const testUser = {
      id: createId('u'),
      email: testEmail,
      name: 'Test User',
      role: 'student',
      salt: salt,
      passwordHash: passwordHash,
      createdAt: new Date().toISOString(),
      isVerified: true,
    };
    
    db.users = db.users || [];
    db.users.push(testUser);
    
    // Ensure other required arrays exist
    db.prompts = db.prompts || [];
    db.promptComments = db.promptComments || [];
    db.promptLikes = db.promptLikes || [];
    db.promptSaves = db.promptSaves || [];
    db.certificates = db.certificates || [];
    db.tracks = db.tracks || [];
    db.libraryAcademy = db.libraryAcademy || [];
    db.libraryByUser = db.libraryByUser || [];
    db.discussions = db.discussions || [];
    db.discussionReplies = db.discussionReplies || [];
    db.challenges = db.challenges || [];
    db.challengeEntries = db.challengeEntries || [];
    db.challengeEntryLikes = db.challengeEntryLikes || [];
    db.challengeEntrySaves = db.challengeEntrySaves || [];
    db.otps = db.otps || [];
    db.notifications = db.notifications || [];
    db.userLearning = db.userLearning || [];
    db.userProfiles = db.userProfiles || [];
    db.notificationSettings = db.notificationSettings || [];
    db.securitySettings = db.securitySettings || [];
    db.billingSettings = db.billingSettings || [];
    db.userPreferences = db.userPreferences || [];
    
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    
    console.log('✅ Test user created successfully');
    console.log('Email:', testEmail);
    console.log('Password:', password);
    console.log('ID:', testUser.id);
    
  } catch (error) {
    console.log('❌ Error creating test user:', error.message);
  }
}

// Run tests
console.log('=== Database and Authentication Test ===\n');
checkDatabase();
createTestUser();
console.log('\n=== Test Complete ===');
