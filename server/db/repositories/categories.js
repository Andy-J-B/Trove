// Handles category queries
export class CategoryRepository {
  constructor(db) {
    this.db = db;
  }

  // ------------------------
  // CREATE
  // ------------------------
  async create(name, description, icon = "") {
    if (!name || !description) {
      throw new Error("Missing required fields: name and description");
    }

    const normalizedName = name.toLowerCase().trim();

    const result = await this.db.run(
      `
      INSERT INTO categories (name, description, icon)
      VALUES (?, ?, ?)
      `,
      [normalizedName, description.trim(), icon]
    );

    return this.getById(result.lastID);
  }

  // ------------------------
  // READ
  // ------------------------
  async getAll() {
    return this.db.all(`
      SELECT *
      FROM categories
      ORDER BY name ASC
    `);
  }

  async getById(id) {
    return this.db.get(
      `
      SELECT *
      FROM categories
      WHERE id = ?
    `,
      [id]
    );
  }

  async getByName(name) {
    return this.db.get(
      `
      SELECT *
      FROM categories
      WHERE name = ?
    `,
      [name.toLowerCase()]
    );
  }

  async exists(name) {
    const row = await this.db.get(
      `
      SELECT 1
      FROM categories
      WHERE name = ?
    `,
      [name.toLowerCase()]
    );
    return !!row;
  }

  async count() {
    const row = await this.db.get(`SELECT COUNT(*) AS count FROM categories`);
    return row.count;
  }

  // Optional helper to count linked products
  async countProducts(categoryId) {
    const row = await this.db.get(
      `
      SELECT COUNT(*) AS count
      FROM products
      WHERE category_id = ?
    `,
      [categoryId]
    );
    return row.count;
  }

  // ------------------------
  // UPDATE
  // ------------------------
  async update(id, updates) {
    const { name, description, icon } = updates;
    const set = [];
    const values = [];

    if (name) {
      set.push("name = ?");
      values.push(name.toLowerCase().trim());
    }
    if (description !== undefined) {
      set.push("description = ?");
      values.push(description.trim());
    }
    if (icon !== undefined) {
      set.push("icon = ?");
      values.push(icon);
    }

    if (set.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id);

    await this.db.run(
      `UPDATE categories SET ${set.join(", ")} WHERE id = ?`,
      values
    );

    return this.getById(id);
  }

  // ------------------------
  // DELETE
  // ------------------------
  async delete(id) {
    // Cascade delete products in that category
    await this.db.run("DELETE FROM products WHERE category_id = ?", [id]);
    await this.db.run("DELETE FROM categories WHERE id = ?", [id]);
    return { deleted: true };
  }

  async deleteAll() {
    await this.db.exec("DELETE FROM products");
    await this.db.exec("DELETE FROM categories");
    return { deleted: true };
  }
}
