#!/usr/bin/env node

/**
 * 🛡️ DDoS & Rate Limiting Security Test Script
 * 
 * Purpose: Test the effectiveness of rate limiting and DDoS protection
 * Usage: node ddos-test.js [test-type] [options]
 * 
 * IMPORTANT: Only use this for testing your own systems!
 * DO NOT use against systems you don't own - that's illegal!
 */

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');

class SecurityTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = {
      total: 0,
      success: 0,
      rateLimited: 0,
      errors: 0,
      avgResponseTime: 0,
      responseStatuses: {}
    };
  }

  // Utility function to make HTTP requests
  async makeRequest(path, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve) => {
      const url = new URL(path, this.baseUrl);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SecurityTester/1.0',
          ...headers
        }
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        const jsonData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(jsonData);
      }

      const startTime = performance.now();
      
      const req = httpModule.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          resolve({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headers: res.headers,
            data: responseData,
            responseTime: responseTime
          });
        });
      });

      req.on('error', (error) => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        resolve({
          statusCode: 0,
          statusMessage: 'ERROR',
          error: error.message,
          responseTime: responseTime
        });
      });

      if (data && (method === 'POST' || method === 'PUT')) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  // Update results statistics
  updateStats(response) {
    this.results.total++;
    
    if (response.statusCode === 429) {
      this.results.rateLimited++;
    } else if (response.statusCode >= 200 && response.statusCode < 300) {
      this.results.success++;
    } else {
      this.results.errors++;
    }

    // Track status codes
    const status = response.statusCode || 'ERROR';
    this.results.responseStatuses[status] = (this.results.responseStatuses[status] || 0) + 1;
    
    // Update average response time
    const currentAvg = this.results.avgResponseTime;
    const newAvg = (currentAvg * (this.results.total - 1) + response.responseTime) / this.results.total;
    this.results.avgResponseTime = newAvg;
  }

  // Test 1: Basic Rate Limiting Test
  async testBasicRateLimit() {
    console.log('\n🔬 Test 1: Basic Rate Limiting');
    console.log('=====================================');
    
    const endpoint = '/auth/login';
    const testData = {
      email: 'test@ddos.com',
      password: 'wrongpassword'
    };

    console.log(`📡 Sending 10 requests to ${endpoint}`);
    console.log('Expected: First 5 should succeed, rest should be rate limited (429)');
    
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        this.makeRequest(endpoint, 'POST', testData)
          .then(response => {
            console.log(`Request ${i + 1}: ${response.statusCode} ${response.statusMessage} (${Math.round(response.responseTime)}ms)`);
            this.updateStats(response);
            return response;
          })
      );
    }

    await Promise.all(promises);
    this.printResults('Basic Rate Limiting Test');
  }

  // Test 2: Burst Attack Simulation
  async testBurstAttack(requestCount = 50, concurrency = 10) {
    console.log('\n🚀 Test 2: Burst Attack Simulation');
    console.log('=====================================');
    
    const endpoint = '/auth/register';
    
    console.log(`📡 Sending ${requestCount} concurrent requests (${concurrency} at a time)`);
    console.log('Expected: Most requests should be rate limited');
    
    const startTime = performance.now();
    
    // Send requests in batches
    for (let batch = 0; batch < requestCount; batch += concurrency) {
      const batchPromises = [];
      
      for (let i = 0; i < concurrency && (batch + i) < requestCount; i++) {
        const testData = {
          name: `User${batch + i}`,
          email: `user${batch + i}@ddos.com`,
          password: 'Test123!@#'
        };
        
        batchPromises.push(
          this.makeRequest(endpoint, 'POST', testData)
            .then(response => {
              const requestNum = batch + i + 1;
              if (requestNum % 10 === 0 || response.statusCode === 429) {
                console.log(`Request ${requestNum}: ${response.statusCode} ${response.statusMessage} (${Math.round(response.responseTime)}ms)`);
              }
              this.updateStats(response);
              return response;
            })
        );
      }
      
      await Promise.all(batchPromises);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    console.log(`\n⏱️ Total test time: ${Math.round(totalTime)}ms`);
    this.printResults('Burst Attack Simulation');
  }

  // Test 3: Sustained Attack Simulation
  async testSustainedAttack(duration = 30000, requestsPerSecond = 5) {
    console.log('\n⏰ Test 3: Sustained Attack Simulation');
    console.log('=====================================');
    
    const endpoint = '/auth/verify-email';
    const interval = 1000 / requestsPerSecond;
    
    console.log(`📡 Sending ${requestsPerSecond} requests/second for ${duration/1000} seconds`);
    console.log('Expected: Consistent rate limiting after initial burst');
    
    const startTime = performance.now();
    let requestCount = 0;
    
    const intervalId = setInterval(async () => {
      requestCount++;
      const testData = {
        email: `user${requestCount}@ddos.com`,
        code: '123456'
      };
      
      const response = await this.makeRequest(endpoint, 'POST', testData);
      
      if (requestCount % 10 === 0 || response.statusCode === 429) {
        console.log(`Request ${requestCount}: ${response.statusCode} ${response.statusMessage} (${Math.round(response.responseTime)}ms)`);
      }
      
      this.updateStats(response);
    }, interval);
    
    // Stop after duration
    setTimeout(() => {
      clearInterval(intervalId);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      console.log(`\n⏱️ Total test time: ${Math.round(totalTime)}ms`);
      console.log(`📊 Total requests sent: ${requestCount}`);
      this.printResults('Sustained Attack Simulation');
    }, duration);
    
    // Wait for test to complete
    await new Promise(resolve => setTimeout(resolve, duration + 1000));
  }

  // Test 4: Multi-endpoint Attack
  async testMultiEndpointAttack() {
    console.log('\n🎯 Test 4: Multi-endpoint Attack');
    console.log('=====================================');
    
    const endpoints = [
      { path: '/auth/login', method: 'POST', data: { email: 'test@ddos.com', password: 'wrong' } },
      { path: '/auth/register', method: 'POST', data: { name: 'Test', email: 'test@ddos.com', password: 'Test123!@#' } },
      { path: '/auth/verify-email', method: 'POST', data: { email: 'test@ddos.com', code: '123456' } },
      { path: '/auth/forgot-password', method: 'POST', data: { email: 'test@ddos.com' } },
      { path: '/auth/reset-password', method: 'POST', data: { email: 'test@ddos.com', code: '123456', newPassword: 'NewPass123!@#' } }
    ];
    
    console.log('📡 Testing rate limits across multiple endpoints');
    console.log('Expected: Each endpoint should have its own rate limiting');
    
    const promises = [];
    
    // Send requests to each endpoint
    for (let i = 0; i < 20; i++) {
      for (const endpoint of endpoints) {
        promises.push(
          this.makeRequest(endpoint.path, endpoint.method, endpoint.data)
            .then(response => {
              if (i % 5 === 0 || response.statusCode === 429) {
                console.log(`${endpoint.path} - Request ${i + 1}: ${response.statusCode} ${response.statusMessage}`);
              }
              this.updateStats(response);
              return response;
            })
        );
      }
      
      // Small delay between rounds
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    await Promise.all(promises);
    this.printResults('Multi-endpoint Attack Test');
  }

  // Test 5: Account Lockout Test
  async testAccountLockout() {
    console.log('\n🔒 Test 5: Account Lockout Test');
    console.log('=====================================');
    
    // First register a user
    const userEmail = `lockout-test-${Date.now()}@ddos.com`;
    const registerData = {
      name: 'Lockout Test',
      email: userEmail,
      password: 'CorrectPass123!@#'
    };
    
    console.log('👤 Step 1: Registering test user...');
    const registerResponse = await this.makeRequest('/auth/register', 'POST', registerData);
    console.log(`Registration: ${registerResponse.statusCode} ${registerResponse.statusMessage}`);
    
    if (registerResponse.statusCode === 429) {
      console.log('❌ Cannot proceed with lockout test - registration rate limited');
      return;
    }
    
    console.log('\n🔑 Step 2: Attempting failed logins...');
    console.log('Expected: Account should lock after 5 failed attempts');
    
    const loginData = {
      email: userEmail,
      password: 'WrongPassword123!@#'
    };
    
    // Try 7 failed logins
    for (let i = 1; i <= 7; i++) {
      const response = await this.makeRequest('/auth/login', 'POST', loginData);
      console.log(`Failed login ${i}: ${response.statusCode} ${response.statusMessage}`);
      
      if (response.statusCode === 429) {
        console.log('⚠️ Rate limited - waiting before next attempt');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else if (response.data) {
        try {
          const data = JSON.parse(response.data);
          if (data.message && data.message.includes('locked')) {
            console.log('🔒 Account successfully locked!');
            break;
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
      
      this.updateStats(response);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.printResults('Account Lockout Test');
  }

  // Print test results
  printResults(testName) {
    console.log(`\n📊 ${testName} Results:`);
    console.log('=====================================');
    console.log(`Total Requests: ${this.results.total}`);
    console.log(`✅ Successful: ${this.results.success} (${((this.results.success / this.results.total) * 100).toFixed(1)}%)`);
    console.log(`🚫 Rate Limited: ${this.results.rateLimited} (${((this.results.rateLimited / this.results.total) * 100).toFixed(1)}%)`);
    console.log(`❌ Errors: ${this.results.errors} (${((this.results.errors / this.results.total) * 100).toFixed(1)}%)`);
    console.log(`⏱️ Avg Response Time: ${Math.round(this.results.avgResponseTime)}ms`);
    
    console.log('\n📈 Status Code Distribution:');
    for (const [status, count] of Object.entries(this.results.responseStatuses)) {
      const percentage = ((count / this.results.total) * 100).toFixed(1);
      console.log(`  ${status}: ${count} (${percentage}%)`);
    }
    
    // Security assessment
    console.log('\n🛡️ Security Assessment:');
    const rateLimitedPercentage = (this.results.rateLimited / this.results.total) * 100;
    
    if (rateLimitedPercentage > 70) {
      console.log('✅ EXCELLENT: Strong rate limiting protection');
    } else if (rateLimitedPercentage > 50) {
      console.log('✅ GOOD: Adequate rate limiting protection');
    } else if (rateLimitedPercentage > 30) {
      console.log('⚠️ MODERATE: Rate limiting could be stronger');
    } else {
      console.log('❌ WEAK: Rate limiting insufficient for DDoS protection');
    }
    
    console.log('\n' + '='.repeat(50));
  }

  // Reset results for next test
  resetResults() {
    this.results = {
      total: 0,
      success: 0,
      rateLimited: 0,
      errors: 0,
      avgResponseTime: 0,
      responseStatuses: {}
    };
  }

  // Run all tests
  async runAllTests() {
    console.log('🔥 Starting Comprehensive DDoS & Security Tests');
    console.log('================================================');
    console.log('⚠️  DISCLAIMER: This is for testing YOUR OWN system only!');
    console.log('⚠️  DO NOT use against systems you don\'t own!');
    console.log('================================================\n');
    
    try {
      // Test server availability
      console.log('🔍 Checking server availability...');
      const healthCheck = await this.makeRequest('/');
      if (healthCheck.statusCode === 0) {
        console.log('❌ Server is not running! Start your NestJS server first.');
        return;
      }
      console.log(`✅ Server is running (${healthCheck.statusCode})`);
      
      // Run tests sequentially
      await this.testBasicRateLimit();
      this.resetResults();
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait between tests
      
      await this.testBurstAttack(30, 5);
      this.resetResults();
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await this.testMultiEndpointAttack();
      this.resetResults();
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await this.testAccountLockout();
      this.resetResults();
      
      // Skip sustained attack in full test (too long)
      // await this.testSustainedAttack(15000, 3);
      
      console.log('\n🎉 All security tests completed!');
      console.log('Check the results above to assess your security posture.');
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  const baseUrl = args[1] || 'http://localhost:3000';
  
  const tester = new SecurityTester(baseUrl);
  
  switch (command) {
    case 'rate-limit':
      await tester.testBasicRateLimit();
      break;
      
    case 'burst':
      const requestCount = parseInt(args[2]) || 50;
      const concurrency = parseInt(args[3]) || 10;
      await tester.testBurstAttack(requestCount, concurrency);
      break;
      
    case 'sustained':
      const duration = parseInt(args[2]) || 30000;
      const rps = parseInt(args[3]) || 5;
      await tester.testSustainedAttack(duration, rps);
      break;
      
    case 'multi-endpoint':
      await tester.testMultiEndpointAttack();
      break;
      
    case 'lockout':
      await tester.testAccountLockout();
      break;
      
    case 'all':
    case 'help':
    default:
      if (command === 'help') {
        console.log('🛡️ DDoS Security Test Script');
        console.log('Usage: node ddos-test.js [command] [options]');
        console.log('\nCommands:');
        console.log('  all              - Run all tests (default)');
        console.log('  rate-limit       - Test basic rate limiting');
        console.log('  burst [count] [concurrency] - Test burst attacks');
        console.log('  sustained [duration] [rps]  - Test sustained attacks');
        console.log('  multi-endpoint   - Test multiple endpoints');
        console.log('  lockout          - Test account lockout');
        console.log('  help             - Show this help');
        console.log('\nExamples:');
        console.log('  node ddos-test.js all');
        console.log('  node ddos-test.js burst 100 20');
        console.log('  node ddos-test.js sustained 60000 10');
        console.log('\nMake sure your NestJS server is running on localhost:3000');
        break;
      }
      await tester.runAllTests();
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = SecurityTester;
