import ProductDatabase from './database.js';

async function testDatabase() {
  const db = new ProductDatabase();
  
  try {
    await db.init();
    console.log('✅ Database initialized');

    // Test adding products
    const testProducts = [
      {
        name: 'Centella Cleansing Oil',
        category: 'skincare',
        description: 'Removes dirt and oils',
        mentioned_context: 'Used in morning routine'
      },
      {
        name: 'Ampoule Foam Cleanser',
        category: 'skincare', 
        description: 'Korean foam cleanser',
        mentioned_context: 'Second step in double cleansing'
      },
      {
        name: 'Hydrating Ampoule',
        category: 'skincare',
        description: 'Serum for hydration',
        mentioned_context: 'Applied before moisturizer'
      }
    ];

    console.log('\n📝 Adding test products...');
    for (const product of testProducts) {
      try {
        await db.addProduct(product);
        console.log(`  ✅ Added: ${product.name}`);
      } catch (error) {
        console.log(`  ⚠️  ${product.name}: ${error.message}`);
      }
    }

    // Test getting stats
    console.log('\n📊 Database stats:');
    const stats = await db.getProductStats();
    stats.forEach(stat => {
      console.log(`  ${stat.category}: ${stat.product_count} products`);
    });

    // Test getting products by category
    console.log('\n🧴 Skincare products:');
    const skincareProducts = await db.getProductsByCategory('skincare');
    skincareProducts.forEach(product => {
      console.log(`  • ${product.name} - ${product.description}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.close();
  }
}

testDatabase();