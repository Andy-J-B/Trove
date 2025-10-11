// db/index.js
import { connectDB } from "./connection.js";
import { migrateAndSeed } from "./migrations.js";
import { ProductRepository } from "./repositories/products.js";
import { CategoryRepository } from "./repositories/categories.js";

let dbInstance = null;

export async function initDatabase() {
  if (dbInstance) return dbInstance; // Prevent multiple inits

  const db = await connectDB();
  await migrateAndSeed(db);

  dbInstance = {
    products: new ProductRepository(db),
    categories: new CategoryRepository(db),
    db,
  };

  return dbInstance;
}

// Default export — resolves to the initialized DB
export default await initDatabase();
