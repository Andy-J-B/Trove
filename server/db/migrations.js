// Handle table creation/seeding
export async function migrateAndSeed(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT "",
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

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
    );
  `);

  const defaultCategories = [
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
  ];

  for (const { name, description, icon } of defaultCategories) {
    await db.run(
      "INSERT OR IGNORE INTO categories (name, description, icon) VALUES (?, ?, ?)",
      [name, description, icon]
    );
  }

  console.log("✅ Database tables created & default categories seeded");
}
