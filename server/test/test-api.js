// Simple API test script
const BASE_URL = 'http://localhost:3000/api';

async function testAPI() {
  console.log('🧪 Testing CRUD API endpoints...\n');

  try {
    // Test Categories
    console.log('📁 Testing Categories:');
    
    // Get all categories
    let response = await fetch(`${BASE_URL}/categories`);
    let result = await response.json();
    console.log('✅ GET /categories:', result.data.length, 'categories');

    // Create new category
    response = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'test-category' })
    });
    result = await response.json();
    const categoryId = result.data.id;
    console.log('✅ POST /categories:', result.data.name);

    // Update category
    response = await fetch(`${BASE_URL}/categories/${categoryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'updated-category' })
    });
    result = await response.json();
    console.log('✅ PUT /categories:', result.data.name);

    // Test Products
    console.log('\n🛍️  Testing Products:');
    
    // Create product
    response = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Product',
        category: 'skincare',
        description: 'A test product',
        mentioned_context: 'API test'
      })
    });
    result = await response.json();
    const productId = result.data.id;
    console.log('✅ POST /products:', result.data.name);

    // Get product by ID
    response = await fetch(`${BASE_URL}/products/${productId}`);
    result = await response.json();
    console.log('✅ GET /products/:id:', result.data.name);

    // Update product
    response = await fetch(`${BASE_URL}/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Updated Test Product',
        description: 'Updated description'
      })
    });
    result = await response.json();
    console.log('✅ PUT /products:', result.data.name);

    // Get products by category
    response = await fetch(`${BASE_URL}/products?category=skincare`);
    result = await response.json();
    console.log('✅ GET /products?category=skincare:', result.data.length, 'products');

    // Get stats
    response = await fetch(`${BASE_URL}/stats`);
    result = await response.json();
    console.log('✅ GET /stats:', result.data.length, 'categories with counts');

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    
    // Delete product
    response = await fetch(`${BASE_URL}/products/${productId}`, {
      method: 'DELETE'
    });
    result = await response.json();
    console.log('✅ DELETE /products:', result.message);

    // Delete category
    response = await fetch(`${BASE_URL}/categories/${categoryId}`, {
      method: 'DELETE'
    });
    result = await response.json();
    console.log('✅ DELETE /categories:', result.message);

    console.log('\n🎉 All API tests passed!');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

// Run tests
testAPI();