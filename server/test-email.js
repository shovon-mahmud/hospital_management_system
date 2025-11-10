/**
 * Email Testing Utility
 * Tests SMTP configuration and email sending without affecting database
 * 
 * Usage: node test-email.js [test-type]
 * 
 * Test types:
 *   connection  - Test SMTP connection only
 *   verification - Send test verification email
 *   welcome     - Send test welcome email
 *   login       - Send test login greeting email
 *   all         - Run all tests
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { verifyEmailTemplate, welcomeEmailTemplate, loginGreetingTemplate } from './src/utils/emailTemplates.js';

dotenv.config();

const SMTP_CONFIG = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.SMTP_FROM || 'HMS <no-reply@hms.local>',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  appName: process.env.APP_NAME || 'HMS'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printConfig() {
  log('\n=== SMTP Configuration ===', 'cyan');
  log(`Host: ${SMTP_CONFIG.host || 'NOT SET'}`, SMTP_CONFIG.host ? 'green' : 'red');
  log(`Port: ${SMTP_CONFIG.port}`, 'green');
  log(`User: ${SMTP_CONFIG.user || 'NOT SET'}`, SMTP_CONFIG.user ? 'green' : 'red');
  log(`Pass: ${SMTP_CONFIG.pass ? '***' + SMTP_CONFIG.pass.slice(-4) : 'NOT SET'}`, SMTP_CONFIG.pass ? 'green' : 'red');
  log(`From: ${SMTP_CONFIG.from}`, 'green');
  log(`Frontend URL: ${SMTP_CONFIG.frontendUrl}`, 'green');
  log(`App Name: ${SMTP_CONFIG.appName}`, 'green');
  console.log('');
}

async function testConnection() {
  log('\n[TEST 1/4] Testing SMTP Connection...', 'bright');
  
  if (!SMTP_CONFIG.host || !SMTP_CONFIG.user || !SMTP_CONFIG.pass) {
    log('❌ FAILED: SMTP credentials not configured in .env file', 'red');
    log('Required: SMTP_HOST, SMTP_USER, SMTP_PASS', 'yellow');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_CONFIG.host,
      port: SMTP_CONFIG.port,
      secure: SMTP_CONFIG.port === 465,
      auth: {
        user: SMTP_CONFIG.user,
        pass: SMTP_CONFIG.pass
      },
      debug: true, // Show SMTP conversation
      logger: true // Log to console
    });

    log('Verifying SMTP connection...', 'yellow');
    await transporter.verify();
    log('✅ SMTP connection successful!', 'green');
    log(`   Connected to ${SMTP_CONFIG.host}:${SMTP_CONFIG.port}`, 'green');
    return transporter;
  } catch (error) {
    log('❌ SMTP connection failed!', 'red');
    log(`   Error: ${error.message}`, 'red');
    
    if (error.code === 'EAUTH') {
      log('\n💡 Authentication Error - Common Fixes:', 'yellow');
      log('   1. For Gmail: Use App Password, not regular password', 'yellow');
      log('   2. Enable "Less secure app access" (if using regular password)', 'yellow');
      log('   3. Check that 2FA is enabled and App Password is generated', 'yellow');
      log('   4. Visit: https://myaccount.google.com/apppasswords', 'yellow');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
      log('\n💡 Connection Error - Common Fixes:', 'yellow');
      log('   1. Check firewall settings', 'yellow');
      log('   2. Verify SMTP_HOST and SMTP_PORT are correct', 'yellow');
      log('   3. Try port 465 (SSL) instead of 587 (TLS)', 'yellow');
    }
    
    return null;
  }
}

async function testVerificationEmail(transporter, testEmail) {
  log('\n[TEST 2/4] Testing Verification Email...', 'bright');
  
  try {
    const verifyToken = 'test-token-' + Date.now();
    const verifyUrl = `${SMTP_CONFIG.frontendUrl}/verify-email?token=${verifyToken}`;
    const { html, text } = verifyEmailTemplate({
      name: 'Test User',
      verifyUrl,
      expiresInHours: 24
    });

    log('Sending verification email...', 'yellow');
    const info = await transporter.sendMail({
      from: SMTP_CONFIG.from,
      to: testEmail,
      subject: '[TEST] Verify your HMS account',
      html,
      text
    });

    log('✅ Verification email sent!', 'green');
    log(`   Message ID: ${info.messageId}`, 'green');
    log(`   To: ${testEmail}`, 'green');
    log(`   Subject: [TEST] Verify your HMS account`, 'green');
    
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      log(`   Preview: ${previewUrl}`, 'cyan');
    }
    
    return true;
  } catch (error) {
    log('❌ Failed to send verification email!', 'red');
    log(`   Error: ${error.message}`, 'red');
    return false;
  }
}

async function testWelcomeEmail(transporter, testEmail) {
  log('\n[TEST 3/4] Testing Welcome Email...', 'bright');
  
  try {
    const dashboardUrl = `${SMTP_CONFIG.frontendUrl}/`;
    const { html, text } = welcomeEmailTemplate({
      name: 'Test User',
      role: 'Patient',
      appName: SMTP_CONFIG.appName,
      dashboardUrl
    });

    log('Sending welcome email...', 'yellow');
    const info = await transporter.sendMail({
      from: SMTP_CONFIG.from,
      to: testEmail,
      subject: `[TEST] Welcome to ${SMTP_CONFIG.appName}`,
      html,
      text
    });

    log('✅ Welcome email sent!', 'green');
    log(`   Message ID: ${info.messageId}`, 'green');
    log(`   To: ${testEmail}`, 'green');
    
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      log(`   Preview: ${previewUrl}`, 'cyan');
    }
    
    return true;
  } catch (error) {
    log('❌ Failed to send welcome email!', 'red');
    log(`   Error: ${error.message}`, 'red');
    return false;
  }
}

async function testLoginGreetingEmail(transporter, testEmail) {
  log('\n[TEST 4/4] Testing Login Greeting Email...', 'bright');
  
  try {
    const dashboardUrl = `${SMTP_CONFIG.frontendUrl}/`;
    const { html, text } = loginGreetingTemplate({
      name: 'Test User',
      role: 'Patient',
      appName: SMTP_CONFIG.appName,
      when: new Date(),
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Test Browser)',
      lastLoginAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      dashboardUrl
    });

    log('Sending login greeting email...', 'yellow');
    const info = await transporter.sendMail({
      from: SMTP_CONFIG.from,
      to: testEmail,
      subject: `[TEST] Login notification - ${SMTP_CONFIG.appName}`,
      html,
      text
    });

    log('✅ Login greeting email sent!', 'green');
    log(`   Message ID: ${info.messageId}`, 'green');
    log(`   To: ${testEmail}`, 'green');
    
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      log(`   Preview: ${previewUrl}`, 'cyan');
    }
    
    return true;
  } catch (error) {
    log('❌ Failed to send login greeting email!', 'red');
    log(`   Error: ${error.message}`, 'red');
    return false;
  }
}

async function runTests(testType = 'all') {
  log('\n╔═══════════════════════════════════════╗', 'bright');
  log('║    HMS Email System Testing Tool     ║', 'bright');
  log('╚═══════════════════════════════════════╝', 'bright');
  
  printConfig();

  // Get test email from user
  const testEmail = process.env.SMTP_USER || 'test@example.com';
  log(`Test emails will be sent to: ${testEmail}`, 'cyan');
  log('(Emails will be sent to SMTP_USER from .env)\n', 'yellow');

  const results = {
    connection: false,
    verification: false,
    welcome: false,
    loginGreeting: false
  };

  // Test 1: Connection
  if (testType === 'all' || testType === 'connection') {
    const transporter = await testConnection();
    results.connection = !!transporter;
    
    if (!transporter) {
      log('\n❌ Cannot proceed with email tests - SMTP connection failed', 'red');
      printSummary(results);
      process.exit(1);
    }

    // Test 2-4: Email sending
    if (testType === 'all' || testType === 'verification') {
      results.verification = await testVerificationEmail(transporter, testEmail);
    }
    
    if (testType === 'all' || testType === 'welcome') {
      results.welcome = await testWelcomeEmail(transporter, testEmail);
    }
    
    if (testType === 'all' || testType === 'login') {
      results.loginGreeting = await testLoginGreetingEmail(transporter, testEmail);
    }
  }

  printSummary(results);
}

function printSummary(results) {
  log('\n╔═══════════════════════════════════════╗', 'bright');
  log('║          Test Summary                 ║', 'bright');
  log('╚═══════════════════════════════════════╝', 'bright');
  
  const tests = [
    { name: 'SMTP Connection', result: results.connection },
    { name: 'Verification Email', result: results.verification },
    { name: 'Welcome Email', result: results.welcome },
    { name: 'Login Greeting Email', result: results.loginGreeting }
  ];

  tests.forEach(test => {
    if (test.result !== null && test.result !== undefined) {
      const status = test.result ? '✅' : '❌';
      const color = test.result ? 'green' : 'red';
      log(`${status} ${test.name}`, color);
    }
  });

  const passedCount = Object.values(results).filter(r => r === true).length;
  const totalCount = Object.values(results).filter(r => r !== null && r !== undefined).length;
  
  log(`\nPassed: ${passedCount}/${totalCount}`, passedCount === totalCount ? 'green' : 'yellow');
  
  if (passedCount === totalCount && totalCount > 0) {
    log('\n🎉 All tests passed! Email system is working correctly.', 'green');
    log('💡 Check your inbox (and spam folder) for test emails.', 'cyan');
  } else {
    log('\n⚠️  Some tests failed. Please check the errors above.', 'yellow');
  }
  
  console.log('');
}

// Parse command line arguments
const testType = process.argv[2] || 'all';
const validTypes = ['all', 'connection', 'verification', 'welcome', 'login'];

if (!validTypes.includes(testType)) {
  log(`Invalid test type: ${testType}`, 'red');
  log(`Valid options: ${validTypes.join(', ')}`, 'yellow');
  log('\nUsage: node test-email.js [test-type]', 'cyan');
  process.exit(1);
}

// Run tests
runTests(testType).catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
