#!/usr/bin/env node

/**
 * 部署测试脚本
 * 用于测试前后端连接和API可用性
 */

const baseUrl = process.argv[2] || 'http://localhost:3001';

console.log('🧪 Testing deployment...');
console.log('📍 Base URL:', baseUrl);

async function testEndpoint(endpoint, description) {
  try {
    console.log(`\n🔍 Testing ${description}...`);
    const url = `${baseUrl}${endpoint}`;
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url);
    const status = response.status;
    const statusText = response.statusText;
    
    console.log(`   Status: ${status} ${statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success:`, JSON.stringify(data, null, 2).slice(0, 200) + '...');
      return true;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Failed:`, errorText);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log('\n=== 部署测试报告 ===');
  
  const tests = [
    { endpoint: '/health', description: 'Health Check' },
    { endpoint: '/api', description: 'API Root' },
    { endpoint: '/api/parking', description: 'Parking Data API' },
    { endpoint: '/api/parking/status', description: 'Parking Status' }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const success = await testEndpoint(test.endpoint, test.description);
    results.push({ ...test, success });
  }
  
  console.log('\n=== 测试总结 ===');
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.description}: ${result.endpoint}`);
  });
  
  console.log(`\n📊 测试结果: ${passed}/${total} 通过`);
  
  if (passed === total) {
    console.log('🎉 所有测试通过！部署成功。');
  } else {
    console.log('⚠️ 部分测试失败，请检查配置。');
    process.exit(1);
  }
}

runTests().catch(console.error);
