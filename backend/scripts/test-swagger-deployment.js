#!/usr/bin/env node

/**
 * Script to test swagger endpoints after deployment
 * Usage: node scripts/test-swagger-deployment.js [stage] [domain]
 */

const https = require('https');
const http = require('http');

async function testEndpoint(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;

    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          size: data.length,
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testSwaggerDeployment(stage = 'dev-heet', domain = null) {
  console.log('🧪 Testing Swagger Deployment');
  console.log('================================');

  // Determine base URL
  let baseUrl;
  if (domain) {
    baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
  } else {
    // Try to read from serverless info or use default
    baseUrl = `https://api-${stage}.yourdomain.com`;
    console.log(`⚠️  Using default domain: ${baseUrl}`);
    console.log('   Pass domain as argument for accurate testing');
  }

  const swaggerUIUrl = `${baseUrl}/${stage}/swagger`;
  const swaggerJSONUrl = `${baseUrl}/${stage}/swagger.json`;

  console.log(`\n📍 Testing URLs:`);
  console.log(`   UI: ${swaggerUIUrl}`);
  console.log(`   JSON: ${swaggerJSONUrl}`);

  // Test Swagger JSON endpoint
  console.log('\n🔍 Testing Swagger JSON...');
  try {
    const jsonResult = await testEndpoint(swaggerJSONUrl);

    if (jsonResult.status === 200) {
      console.log('✅ Swagger JSON endpoint working');

      try {
        const spec = JSON.parse(jsonResult.data);
        const endpoints = Object.keys(spec.paths || {}).length;
        const definitions = Object.keys(spec.definitions || {}).length;
        console.log(`   📊 ${endpoints} endpoints, ${definitions} definitions`);
        console.log(`   📄 Size: ${(jsonResult.size / 1024).toFixed(1)} KB`);
      } catch (e) {
        console.log('⚠️  JSON response is not valid JSON');
      }
    } else {
      console.log(`❌ Swagger JSON failed: HTTP ${jsonResult.status}`);
    }
  } catch (error) {
    console.log(`❌ Swagger JSON error: ${error.message}`);
  }

  // Test Swagger UI endpoint
  console.log('\n🔍 Testing Swagger UI...');
  try {
    const uiResult = await testEndpoint(swaggerUIUrl);

    if (uiResult.status === 200) {
      console.log('✅ Swagger UI endpoint working');
      console.log(`   📄 Size: ${(uiResult.size / 1024).toFixed(1)} KB`);

      if (uiResult.data.includes('swagger-ui')) {
        console.log('   🎨 Contains Swagger UI components');
      }
    } else {
      console.log(`❌ Swagger UI failed: HTTP ${uiResult.status}`);
    }
  } catch (error) {
    console.log(`❌ Swagger UI error: ${error.message}`);
  }

  console.log('\n🔗 Quick Access:');
  console.log(`   Open UI: open "${swaggerUIUrl}"`);
  console.log(`   Get JSON: curl "${swaggerJSONUrl}"`);

  console.log('\n💡 Tips:');
  console.log('   - If endpoints fail, check if deployment completed successfully');
  console.log('   - Verify custom domain configuration if using custom domains');
  console.log('   - Check AWS CloudWatch logs for Lambda errors');
}

// Main execution
if (require.main === module) {
  const stage = process.argv[2] || 'dev-heet';
  const domain = process.argv[3];

  testSwaggerDeployment(stage, domain).catch((error) => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
}

module.exports = { testSwaggerDeployment };
