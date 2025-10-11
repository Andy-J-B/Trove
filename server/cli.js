#!/usr/bin/env node
import ProductDatabase from './database.js';

const db = new ProductDatabase();

async function main() {
  await db.init();
  
  const command = process.argv[2];
  const args = process.argv.slice(3);

  try {
    switch (command) {
      case 'stats':
        const stats = await db.getProductStats();
        console.log('\n📊 Product Statistics:');
        stats.forEach(stat => {
          console.log(`  ${stat.category}: ${stat.product_count} products`);
        });
        break;

      case 'list':
        const category = args[0];
        if (category) {
          const products = await db.getProductsByCategory(category);
          console.log(`\n🛍️  Products in "${category}" category:`);
          products.forEach(product => {
            console.log(`  • ${product.name}`);
            if (product.description) console.log(`    ${product.description}`);
          });
        } else {
          const allProducts = await db.getAllProducts();
          console.log('\n🛍️  All Products:');
          let currentCategory = '';
          allProducts.forEach(product => {
            if (product.category_name !== currentCategory) {
              currentCategory = product.category_name;
              console.log(`\n  ${currentCategory.toUpperCase()}:`);
            }
            console.log(`    • ${product.name}`);
          });
        }
        break;

      case 'add':
        if (args.length < 2) {
          console.log('Usage: node cli.js add <category> <product_name> [description]');
          break;
        }
        const [cat, name, desc] = args;
        const product = await db.addProduct({
          name,
          category: cat,
          description: desc || '',
          mentioned_context: 'Added via CLI'
        });
        console.log(`✅ Added "${name}" to ${cat} category`);
        break;

      default:
        console.log(`
🗄️  Product Database CLI

Commands:
  stats                    - Show product count by category
  list [category]          - List all products or products in a category
  add <category> <name>    - Add a product to a category
  
Categories: clothing, skincare, haircare, makeup, lebron quotes, faker quotes

Examples:
  node cli.js stats
  node cli.js list skincare
  node cli.js add skincare "CeraVe Cleanser" "Gentle daily cleanser"
        `);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.close();
  }
}

main();