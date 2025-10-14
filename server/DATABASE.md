# Product Database MVP

A lean SQLite database for storing TikTok-extracted products in 6 categories.

## Categories
- `clothing` - Shirts, pants, shoes, accessories
- `skincare` - Cleansers, moisturizers, serums, sunscreen
- `haircare` - Shampoos, conditioners, styling products
- `makeup` - Foundation, lipstick, mascara
- `lebron quotes` - Quotes from LeBron James
- `faker quotes` - Quotes from Faker (LoL player)

## API Endpoints

### Extract & Store Products
```bash
POST /extract-products
{
  "tiktokUrl": "https://tiktok.com/@user/video/123"
}
```

### Database Management
```bash
# Get all products
GET /products

# Get products by category
GET /products/skincare

# Get statistics
GET /stats

# Manually add product
POST /products
{
  "name": "Product Name",
  "category": "skincare",
  "description": "Product description",
  "mentioned_context": "How it was mentioned"
}
```

## CLI Usage

```bash
# Show statistics
node cli.js stats

# List all products
node cli.js list

# List products in category
node cli.js list skincare

# Add product manually
node cli.js add skincare "CeraVe Cleanser" "Gentle daily cleanser"
```

## Database Schema

### Categories Table
- `id` - Primary key
- `name` - Category name (unique)
- `created_at` - Timestamp

### Products Table
- `id` - Primary key
- `name` - Product name
- `category_id` - Foreign key to categories
- `description` - Product description
- `mentioned_context` - How it was mentioned in video
- `tiktok_url` - Source TikTok URL
- `created_at` - Timestamp

## Files
- `database.js` - Database class with all operations
- `cli.js` - Command line interface
- `test-db.js` - Test script
- `products.db` - SQLite database file (auto-created)

## Quick Start

1. Install dependencies: `npm install`
2. Test database: `node test-db.js`
3. Start server: `npm start`
4. Use CLI: `node cli.js stats`