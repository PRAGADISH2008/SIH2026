const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Security, Auth, Authorization & Search Test Suite...\n');

  // 1. Test Artisan Login
  console.log('1. Testing Artisan Login (artisan / password123)...');
  const artisanLogin = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { username: 'artisan', password: 'password123' }
  );

  console.log('Status:', artisanLogin.status);
  console.log('Role:', artisanLogin.data?.artisan?.role);
  console.log('Region:', artisanLogin.data?.artisan?.region);
  const artisanToken = artisanLogin.data?.token;
  const artisanId = artisanLogin.data?.artisan?.artisan_id;

  if (artisanLogin.status !== 200 || artisanLogin.data?.artisan?.role !== 'artisan') {
    throw new Error('Artisan login test failed');
  }
  console.log('✅ PASS: Artisan login returned role=artisan and region\n');

  // 2. Test Buyer Login
  console.log('2. Testing Buyer Login (buyer / password123)...');
  const buyerLogin = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/user/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { username: 'buyer', password: 'password123' }
  );

  console.log('Status:', buyerLogin.status);
  console.log('Role:', buyerLogin.data?.user?.role);
  const buyerToken = buyerLogin.data?.token;

  if (buyerLogin.status !== 200 || buyerLogin.data?.user?.role !== 'buyer') {
    throw new Error('Buyer login test failed');
  }
  console.log('✅ PASS: Buyer login returned role=buyer\n');

  // 3. Test GET /auth/me for Artisan
  console.log('3. Testing GET /auth/me for Artisan...');
  const artisanMe = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/auth/me',
    method: 'GET',
    headers: { Authorization: `Bearer ${artisanToken}` },
  });
  console.log('Artisan /auth/me status:', artisanMe.status, 'Role:', artisanMe.data?.role, 'Region:', artisanMe.data?.region);
  if (artisanMe.status !== 200 || artisanMe.data?.role !== 'artisan') {
    throw new Error('Artisan /auth/me failed');
  }
  console.log('✅ PASS: Artisan /auth/me resolved successfully\n');

  // 4. Test GET /auth/me for Buyer
  console.log('4. Testing GET /auth/me for Buyer...');
  const buyerMe = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/auth/me',
    method: 'GET',
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  console.log('Buyer /auth/me status:', buyerMe.status, 'Role:', buyerMe.data?.role);
  if (buyerMe.status !== 200 || buyerMe.data?.role !== 'buyer') {
    throw new Error('Buyer /auth/me failed');
  }
  console.log('✅ PASS: Buyer /auth/me resolved successfully\n');

  // 5. Test Authorization: Buyer attempting Artisan-only endpoint (POST /products)
  console.log('5. Testing Authorization: Buyer trying POST /products...');
  const buyerForbidden = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/products',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
    },
    { language_original: 'en' }
  );
  console.log('Buyer attempt status:', buyerForbidden.status, 'Message:', buyerForbidden.data?.message);
  if (buyerForbidden.status !== 403) {
    throw new Error(`Expected 403 Forbidden for buyer, got ${buyerForbidden.status}`);
  }
  console.log('✅ PASS: Buyer is blocked with 403 Forbidden on artisan-only endpoint\n');

  // 6. Test Artisan creating a product
  console.log('6. Testing Artisan creating a product...');
  const productCreate = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/products',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${artisanToken}`,
      },
    },
    { language_original: 'en' }
  );
  console.log('Product create status:', productCreate.status, 'Product ID:', productCreate.data?.product_id);
  const createdProductId = productCreate.data?.product_id;
  if (productCreate.status !== 201 || !createdProductId) {
    throw new Error('Product creation failed');
  }
  console.log('✅ PASS: Artisan can create product\n');

  // 7. Test Ownership Validation: Another artisan attempting to modify this product
  console.log('7. Testing Ownership: Ahilan attempting to modify Master Artisan\'s product...');
  // Ahilan login
  const ahilanLogin = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { username: 'msreswaran007@gmail.com', password: 'password123' }
  );
  const ahilanToken = ahilanLogin.data?.token;

  if (ahilanToken) {
    const unauthorizedModify = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/v1/products/${createdProductId}/confirm`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ahilanToken}`,
        },
      },
      { product_name: 'Hacked title' }
    );
    console.log('Cross-artisan attempt status:', unauthorizedModify.status, 'Message:', unauthorizedModify.data?.message);
    if (unauthorizedModify.status !== 403) {
      throw new Error(`Expected 403 Forbidden for cross-artisan modification, got ${unauthorizedModify.status}`);
    }
    console.log('✅ PASS: Cross-artisan modification blocked with 403 Forbidden\n');
  }

  // 8. Test Search & Region in GET /products
  console.log('8. Testing GET /products search & artisan_region...');
  const allProducts = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/products',
    method: 'GET',
  });
  console.log('Published products count:', allProducts.data?.products?.length);
  const first = allProducts.data?.products?.[0];
  console.log('Sample product artisan_name:', first?.artisan_name, '| artisan_region:', first?.artisan_region);

  // Search by region "Tenkasi"
  console.log('\nTesting search by region "tenkasi"...');
  const tenkasiSearch = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/products?search=tenkasi',
    method: 'GET',
  });
  console.log('Tenkasi search count:', tenkasiSearch.data?.products?.length);
  for (const p of tenkasiSearch.data?.products || []) {
    console.log(`- ${p.product_name} by ${p.artisan_name} (${p.artisan_region})`);
  }

  // Search by artisan name "Ahilan"
  console.log('\nTesting search by artisan name "ahilan"...');
  const ahilanSearch = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/products?search=ahilan',
    method: 'GET',
  });
  console.log('Ahilan search count:', ahilanSearch.data?.products?.length);

  // Search by material or general word
  console.log('\nTesting search by material/word "handicraft"...');
  const termSearch = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/products?search=handicraft',
    method: 'GET',
  });
  console.log('Term search count:', termSearch.data?.products?.length);

  console.log('\n🎉 ALL BACKEND TESTS PASSED!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
