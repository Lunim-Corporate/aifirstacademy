#!/usr/bin/env node

/**
 * Test script for OTP email functionality
 * Run with: node test-email.js
 */

import { sendMail } from './server/utils/mailer.js';
import { createOtpCode, createId } from './server/storage.js';

async function testEmailSystem() {
  console.log('🧪 Testing AI-First Academy Email System\n');
  
  const testEmail = {
    id: createId('mail'),
    to: 'test@example.com',
    subject: 'Test OTP Code',
    text: `Test OTP Email\n\nYour code: ${createOtpCode()}\n\nThis is a test email.`,
    html: `
      <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:520px;margin:24px auto;padding:24px;border:1px solid #eee;border-radius:12px">
        <h2 style="margin:0 0 8px 0">Test OTP Code</h2>
        <p style="color:#64748b;margin:0 0 16px 0">This is a test email for the OTP system.</p>
        <div style="font-size:32px;letter-spacing:6px;font-weight:700;background:#f1f5f9;border-radius:8px;padding:12px 16px;text-align:center">${createOtpCode()}</div>
        <p style="color:#64748b;margin-top:16px">If this works, your email system is configured correctly!</p>
      </div>`,
    createdAt: new Date().toISOString()
  };
  
  try {
    console.log('🚀 Attempting to send test email...\n');
    const success = await sendMail(testEmail);
    
    if (success) {
      console.log('✅ Email system test completed successfully!');
      console.log('🎉 Your OTP authentication should work correctly.');
    } else {
      console.log('⚠️  Email system test completed with fallback to console.');
      console.log('📝 This is still functional for development.');
    }
  } catch (error) {
    console.error('❌ Email system test failed:', error);
    process.exit(1);
  }
}

// Run the test
testEmailSystem().then(() => {
  console.log('\n📋 Next Steps:');
  console.log('1. Start the server with: pnpm dev');
  console.log('2. Test signup/login on the frontend');
  console.log('3. Look for OTP codes in the console output');
  console.log('4. Configure a production email service if needed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
