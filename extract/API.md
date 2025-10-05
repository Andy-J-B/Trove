# Product Database API

REST API endpoints for React Native app to manage categories and products.

## Base URL
```
http://localhost:3000/api
```

## Response Format
All responses follow this format:
```json
{
  "success": true|false,
  "data": {...},
  "error": "error message" // only on failure
}
```

## Categories Endpoints

### GET /api/categories
Get all categories
```bash
curl http://localhost:3000/api/categories
```

### GET /api/categories/:id
Get category by ID
```bash
curl http://localhost:3000/api/categories/1
```

### POST /api/categories
Create new category
```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "electronics"}'
```

### PUT /api/categories/:id
Update category
```bash
curl -X PUT http://localhost:3000/api/categories/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "updated-name"}'
```

### DELETE /api/categories/:id
Delete category (only if no products exist)
```bash
curl -X DELETE http://localhost:3000/api/categories/1
```

## Products Endpoints

### GET /api/products
Get all products or filter by category
```bash
# All products
curl http://localhost:3000/api/products

# Products by category
curl http://localhost:3000/api/products?category=skincare
```

### GET /api/products/:id
Get product by ID
```bash
curl http://localhost:3000/api/products/1
```

### POST /api/products
Create new product
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CeraVe Cleanser",
    "category": "skincare",
    "description": "Gentle daily cleanser",
    "mentioned_context": "Recommended in morning routine"
  }'
```

### PUT /api/products/:id
Update product (partial updates allowed)
```bash
curl -X PUT http://localhost:3000/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Product Name",
    "description": "Updated description"
  }'
```

### DELETE /api/products/:id
Delete product
```bash
curl -X DELETE http://localhost:3000/api/products/1
```

## Stats Endpoint

### GET /api/stats
Get product count by category
```bash
curl http://localhost:3000/api/stats
```

## React Native Examples

### Fetch Categories
```javascript
const getCategories = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/categories');
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error);
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
};
```

### Create Product
```javascript
const createProduct = async (productData) => {
  try {
    const response = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error);
  } catch (error) {
    console.error('Error creating product:', error);
  }
};
```

### Get Products by Category
```javascript
const getProductsByCategory = async (category) => {
  try {
    const response = await fetch(`http://localhost:3000/api/products?category=${category}`);
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error);
  } catch (error) {
    console.error('Error fetching products:', error);
  }
};
```

## Error Handling
- 400: Bad Request (missing required fields, validation errors)
- 404: Not Found (resource doesn't exist)
- 500: Internal Server Error

All errors return:
```json
{
  "success": false,
  "error": "Error message"
}
```