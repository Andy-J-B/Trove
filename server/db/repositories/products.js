// Handle product queries
export class ProductRepository {
  constructor(db) {
    this.db = db;
  }

  async add(product) {
    const { name, category, description, mentioned_context, tiktok_url } =
      product;

    const categoryRow = await this.db.get(
      "SELECT id FROM categories WHERE name = ?",
      [category.toLowerCase()]
    );

    if (!categoryRow) throw new Error(`Invalid category: ${category}`);

    const result = await this.db.run(
      `INSERT INTO products (name, category_id, description, mentioned_context, tiktok_url)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(name, category_id) DO NOTHING`,
      [name, categoryRow.id, description, mentioned_context, tiktok_url]
    );

    return this.getById(result.lastID);
  }

  async getById(id) {
    return this.db.get(
      `SELECT p.*, c.name AS category_name 
       FROM products p 
       JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [id]
    );
  }

  async getAll() {
    return this.db.all(`
      SELECT p.*, c.name AS category_name 
      FROM products p 
      JOIN categories c ON p.category_id = c.id 
      ORDER BY c.name, p.created_at DESC
    `);
  }

  async getByCategory(categoryName) {
    return this.db.all(
      `SELECT p.*, c.name AS category_name 
       FROM products p 
       JOIN categories c ON p.category_id = c.id 
       WHERE c.name = ?
       ORDER BY p.created_at DESC`,
      [categoryName.toLowerCase()]
    );
  }

  async getStats() {
    return this.db.all(`
      SELECT c.name AS category, COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.name
    `);
  }

  async update(id, updates) {
    const { name, category, description, mentioned_context } = updates;
    const set = [];
    const values = [];

    if (name) {
      set.push("name = ?");
      values.push(name);
    }

    if (category) {
      const row = await this.db.get(
        "SELECT id FROM categories WHERE name = ?",
        [category.toLowerCase()]
      );
      if (!row) throw new Error(`Invalid category: ${category}`);
      set.push("category_id = ?");
      values.push(row.id);
    }

    if (description !== undefined) {
      set.push("description = ?");
      values.push(description);
    }
    if (mentioned_context !== undefined) {
      set.push("mentioned_context = ?");
      values.push(mentioned_context);
    }

    if (!set.length) throw new Error("No fields to update");
    values.push(id);

    await this.db.run(
      `UPDATE products SET ${set.join(", ")} WHERE id = ?`,
      values
    );
    return this.getById(id);
  }

  async delete(id) {
    await this.db.run("DELETE FROM products WHERE id = ?", [id]);
    return { deleted: true };
  }
}
