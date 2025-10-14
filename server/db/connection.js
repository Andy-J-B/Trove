// Handles DB Connection
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

let dbInstance = null;

export async function connectDB() {
  if (dbInstance) return dbInstance;

  dbInstance = await open({
    filename: path.join(process.cwd(), "products.db"),
    driver: sqlite3.Database,
  });

  console.log("✅ SQLite connected:", dbInstance.config.filename);
  return dbInstance;
}

export async function closeDB() {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
    console.log("🛑 SQLite connection closed");
  }
}
