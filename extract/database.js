import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

class ProductDatabase {
  constructor() {
    this.db = null;
    this.categories = ['clothing', 'skincare', 'haircare', 'makeup', 'lebron quotes', 'faker quotes'];
  }

  async init() {
    this.db = await open({
      filename: path.join(process.cwd(), 'products.db'),
      driver: sqlite3.Database
    });

    await this.createTables();
    console.log('Database initialized successfully');
  }

  async createTables() {
    // Create categories table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create products table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category_id INTEGER NOT NULL,
        description TEXT,
        mentioned_context TEXT,
        tiktok_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id),
        UNIQUE(name, category_id)
      )
    `);

    // Insert default categories
    for (const category of this.categories) {
      await this.db.run(
        'INSERT OR IGNORE INTO categories (name) VALUES (?)',
        [category]
      );
    }
  }

  async addProduct(productData) {
    const { name, category, description, mentioned_context, tiktok_url } = productData;
    
    // Get category ID
    const categoryRow = await this.db.get(
      'SELECT id FROM categories WHERE name = ?',
      [category.toLowerCase()]
    );

    if (!categoryRow) {
      throw new Error(`Invalid category: ${category}. Must be one of: ${this.categories.join(', ')}`);
    }

    try {
      const result = await this.db.run(
        `INSERT INTO products (name, category_id, description, mentioned_context, tiktok_url) 
         VALUES (?, ?, ?, ?, ?)`,
        [name, categoryRow.id, description, mentioned_context, tiktok_url]
      );

      return { id: result.lastID, ...productData };
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error(`Product "${name}" already exists in category "${category}"`);
      }
      throw error;
    }
  }

  async getProductsByCategory(categoryName) {
    return await this.db.all(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      JOIN categories c ON p.category_id = c.id 
      WHERE c.name = ?
      ORDER BY p.created_at DESC
    `, [categoryName.toLowerCase()]);
  }

  async getAllProducts() {
    return await this.db.all(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      JOIN categories c ON p.category_id = c.id 
      ORDER BY c.name, p.created_at DESC
    `);
  }

  async getProductStats() {
    return await this.db.all(`
      SELECT c.name as category, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);
  }

  // CRUD for Categories
  async createCategory(name) {
    const result = await this.db.run(
      'INSERT INTO categories (name) VALUES (?)',
      [name.toLowerCase()]
    );
    return { id: result.lastID, name: name.toLowerCase() };
  }

  async getAllCategories() {
    return await this.db.all('SELECT * FROM categories ORDER BY name');
  }

  async getCategoryById(id) {
    return await this.db.get('SELECT * FROM categories WHERE id = ?', [id]);
  }

  async updateCategory(id, name) {
    await this.db.run(
      'UPDATE categories SET name = ? WHERE id = ?',
      [name.toLowerCase(), id]
    );
    return { id, name: name.toLowerCase() };
  }

  async deleteCategory(id) {
    // First delete all products in this category
    await this.db.run('DELETE FROM products WHERE category_id = ?', [id]);
    
    // Then delete the category
    await this.db.run('DELETE FROM categories WHERE id = ?', [id]);
    return { deleted: true };
  }

  // CRUD for Products
  async createProduct(productData) {
    return await this.addProduct(productData);
  }

  async getProductById(id) {
    return await this.db.get(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `, [id]);
  }

  async updateProduct(id, productData) {
    const { name, category, description, mentioned_context } = productData;
    
    // Get category ID if category is provided
    let categoryId;
    if (category) {
      const categoryRow = await this.db.get(
        'SELECT id FROM categories WHERE name = ?',
        [category.toLowerCase()]
      );
      if (!categoryRow) {
        throw new Error(`Invalid category: ${category}`);
      }
      categoryId = categoryRow.id;
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    
    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (categoryId) {
      updates.push('category_id = ?');
      values.push(categoryId);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (mentioned_context !== undefined) {
      updates.push('mentioned_context = ?');
      values.push(mentioned_context);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    
    await this.db.run(
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return await this.getProductById(id);
  }

  async deleteProduct(id) {
    await this.db.run('DELETE FROM products WHERE id = ?', [id]);
    return { deleted: true };
  }

  async close() {
    if (this.db) {
      await this.db.close();
    }
  }
}

export default ProductDatabase;