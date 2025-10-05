import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

class ProductDatabase {
  constructor() {
    this.db = null;

    // Default categories WITH descriptions
    this.defaultCategories = [
      {
        name: "clothing",
        icon: "👕",
        description: "Apparel, footwear, and accessories mentioned in videos",
      },
      {
        name: "skincare",
        icon: "🧴",
        description: "Products related to skin care routines and treatments",
      },
      {
        name: "haircare",
        icon: "💈",
        description: "Shampoos, conditioners, styling products, and tools",
      },
      {
        name: "makeup",
        icon: "💄",
        description: "Cosmetics and beauty products used on the face and eyes",
      },
      {
        name: "lebron quotes",
        icon: "🏀",
        description: "Memorable LeBron quotes and references",
      },
      {
        name: "faker quotes",
        icon: "🎮",
        description: "Memorable Faker quotes and references",
      },
    ];
  }

  async init() {
    this.db = await open({
      filename: path.join(process.cwd(), "products.db"),
      driver: sqlite3.Database,
    });

    await this.createTables();

    console.log("Database initialized successfully");
  }

  async createTables() {
    // categories with description NOT NULL
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT "",
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // products unchanged
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

    // Insert/seed defaults (idempotent)
    for (const { name, description } of this.defaultCategories) {
      await this.db.run(
        "INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)",
        [name, description]
      );
    }
  }

  // ----------------- Products API -----------------

  async addProduct(productData) {
    const { name, category, description, mentioned_context, tiktok_url } =
      productData;

    // Get category ID
    const categoryRow = await this.db.get(
      "SELECT id FROM categories WHERE name = ?",
      [category.toLowerCase()]
    );

    if (!categoryRow) {
      const allowed = this.defaultCategories.map((c) => c.name).join(", ");
      throw new Error(
        `Invalid category: ${category}. Must be one of: ${allowed}`
      );
    }

    try {
      const result = await this.db.run(
        `INSERT INTO products (name, category_id, description, mentioned_context, tiktok_url) 
   VALUES (?, ?, ?, ?, ?)
   ON CONFLICT(name, category_id) DO NOTHING`,
        [name, categoryRow.id, description, mentioned_context, tiktok_url]
      );

      return { id: result.lastID, ...productData };
    } catch (error) {
      if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
        throw new Error(
          `Product "${name}" already exists in category "${category}"`
        );
      }
      throw error;
    }
  }

  async getProductsByCategory(categoryName) {
    return await this.db.all(
      `
      SELECT p.*, c.name as category_name 
      FROM products p 
      JOIN categories c ON p.category_id = c.id 
      WHERE c.name = ?
      ORDER BY p.created_at DESC
    `,
      [categoryName.toLowerCase()]
    );
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

  async createProduct(productData) {
    return await this.addProduct(productData);
  }

  async getProductById(id) {
    return await this.db.get(
      `
      SELECT p.*, c.name as category_name 
      FROM products p 
      JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `,
      [id]
    );
  }

  async updateProduct(id, productData) {
    const { name, category, description, mentioned_context } = productData;

    let categoryId;
    if (category) {
      const categoryRow = await this.db.get(
        "SELECT id FROM categories WHERE name = ?",
        [category.toLowerCase()]
      );
      if (!categoryRow) {
        throw new Error(`Invalid category: ${category}`);
      }
      categoryId = categoryRow.id;
    }

    const updates = [];
    const values = [];

    if (name) {
      updates.push("name = ?");
      values.push(name);
    }
    if (categoryId) {
      updates.push("category_id = ?");
      values.push(categoryId);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }
    if (mentioned_context !== undefined) {
      updates.push("mentioned_context = ?");
      values.push(mentioned_context);
    }

    if (updates.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id);

    await this.db.run(
      `UPDATE products SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    return await this.getProductById(id);
  }

  async deleteProduct(id) {
    await this.db.run("DELETE FROM products WHERE id = ?", [id]);
    return { deleted: true };
  }

  // ----------------- Categories API (updated) -----------------

  async createCategory(name, description, icon) {
    if (!name) throw new Error("Category name is required");
    if (!description) throw new Error("Category description is required");
    const result = await this.db.run(
      "INSERT INTO categories (name, description) VALUES (?, ?)",
      [name.toLowerCase(), description]
    );
    return { id: result.lastID, name: name.toLowerCase(), description };
  }

  async getAllCategories() {
    return await this.db.all("SELECT * FROM categories ORDER BY name");
  }

  async getCategoryById(id) {
    return await this.db.get("SELECT * FROM categories WHERE id = ?", [id]);
  }

  async updateCategory(id, name, description) {
    // allow updating either/both fields
    const updates = [];
    const values = [];
    if (name) {
      updates.push("name = ?");
      values.push(name.toLowerCase());
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }
    if (updates.length === 0) {
      throw new Error("No fields to update for category");
    }
    values.push(id);
    await this.db.run(
      `UPDATE categories SET ${updates.join(", ")} WHERE id = ?`,
      values
    );
    return await this.getCategoryById(id);
  }

  async deleteCategory(id) {
    await this.db.run("DELETE FROM products WHERE category_id = ?", [id]);
    await this.db.run("DELETE FROM categories WHERE id = ?", [id]);
    return { deleted: true };
  }

  async close() {
    if (this.db) {
      await this.db.close();
    }
  }
}

export default ProductDatabase;
