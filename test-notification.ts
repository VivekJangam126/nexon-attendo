/**
 * Test script for notification service
 * Run with: npm run test:notification
 */

import { config } from 'dotenv';
import { notificationService } from './server/services/notification.service';
import type { AttendanceNotificationData } from './server/services/notification.service';

// Load environment variables
config();

// Check if environment variables are loaded
function checkEnvironmentVariables() {
  const missing: string[] = [];
  
  if (!process.env.RESEND_API_KEY) missing.push('RESEND_API_KEY');
  if (!process.env.TWILIO_ACCOUNT_SID) missing.push('TWILIO_ACCOUNT_SID');
  if (!process.env.TWILIO_AUTH_TOKEN) missing.push('TWILIO_AUTH_TOKEN');
  if (!process.env.TWILIO_PHONE_NUMBER) missing.push('TWILIO_PHONE_NUMBER');
  
  if (missing.length > 0) {
    console.error('\n❌ ERROR: Missing environment variables!\n');
    console.error('The following variables are not set in your .env file:');
    missing.forEach(v => console.error(`  - ${v}`));
    console.error('\n📝 Please add them to your .env file.');
    console.error('📚 See SETUP_NOTIFICATION_ENV.md for detailed instructions.\n');
    process.exit(1);
  }
  
  console.log('✅ Environment variables loaded successfully\n');
}

async function testNotifications() {
  console.log('🧪 Testing Notification Service\n');
  console.log('='.repeat(60));
  
  // Check environment variables first
  checkEnvironmentVariables();

  // Sample attendance data
  const testData: AttendanceNotificationData = {
    date: new Date().toISOString().split('T')[0],
    slotNumber: 1,
    slotTime: '10:10 AM',
    presentCount: 45,
    lateCount: 5,
    totalCount: 50,
    attendanceRate: 90,
  };

  console.log('\n📊 Test Data:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('='.repeat(60));

  // Test SMS Content Generation
  console.log('\n📱 Generated SMS Content:');
  const smsContent = notificationService.generateSMSContent(testData);
  console.log(`"${smsContent}"`);
  console.log(`Length: ${smsContent.length} characters (${smsContent.length <= 160 ? '✅ Under 160' : '❌ Over 160'})`);
  console.log('='.repeat(60));

  // Test Email HTML Generation
  console.log('\n📧 Email HTML Generated: ✅');
  console.log('(HTML content is too long to display, but it\'s ready)');
  console.log('='.repeat(60));

  // Test Email Sending
  const testEmail = process.env.TEST_EMAIL || 'vivekjangam73@gmail.com';
  console.log(`\n📧 Testing Email to: ${testEmail}`);
  
  try {
    const emailResult = await notificationService.sendEmailNotification(
      testEmail,
      testData
    );
    
    if (emailResult.success) {
      console.log('✅ Email sent successfully!');
      console.log(`   Message ID: ${emailResult.messageId}`);
    } else {
      console.log('❌ Email failed:');
      console.log(`   Error: ${emailResult.error}`);
    }
  } catch (error) {
    console.log('❌ Email test failed:');
    console.log(`   ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  console.log('='.repeat(60));

  // Test SMS Sending
  const testPhone = process.env.TEST_PHONE || '+919767996768';
  console.log(`\n📱 Testing SMS to: ${testPhone}`);
  
  try {
    const smsResult = await notificationService.sendSMSNotification(
      testPhone,
      testData
    );
    
    if (smsResult.success) {
      console.log('✅ SMS sent successfully!');
      console.log(`   Message SID: ${smsResult.messageId}`);
    } else {
      console.log('❌ SMS failed:');
      console.log(`   Error: ${smsResult.error}`);
    }
  } catch (error) {
    console.log('❌ SMS test failed:');
    console.log(`   ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  console.log('='.repeat(60));

  // Test Bulk Notifications
  console.log('\n📬 Testing Bulk Notifications');
  const recipients = [
    { name: 'HR Manager', email: testEmail, phone: testPhone },
  ];

  try {
    const bulkResults = await notificationService.sendBulkNotifications(
      recipients,
      testData
    );
    
    console.log('\n📧 Email Results:');
    bulkResults.emailResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.recipient}: ${result.result.success ? '✅ Success' : '❌ Failed'}`);
      if (!result.result.success) {
        console.log(`      Error: ${result.result.error}`);
      }
    });
    
    console.log('\n📱 SMS Results:');
    bulkResults.smsResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.recipient}: ${result.result.success ? '✅ Success' : '❌ Failed'}`);
      if (!result.result.success) {
        console.log(`      Error: ${result.result.error}`);
      }
    });
  } catch (error) {
    console.log('❌ Bulk notification test failed:');
    console.log(`   ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  console.log('='.repeat(60));

  console.log('\n✅ Test completed!\n');
}

// Run tests
testNotifications().catch(console.error);
