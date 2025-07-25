// utils/db.js
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new sqlite3.Database(path.resolve(__dirname, '../deckchatbot.db'), (err) => {
  if (err) {
    console.error('❌ Failed to connect to DB:', err.message);
    process.exit(1); // Exit if database connection fails
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Add graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS deck_drawings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_notes TEXT,
      detected_shape TEXT,
      dimensions_json TEXT,
      processed_area REAL
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS upload_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS area_calculations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      drawing_id INTEGER,
      method TEXT NOT NULL,
      input_data TEXT NOT NULL,
      calculated_area REAL NOT NULL,
      corrected_by_user REAL,
      FOREIGN KEY (drawing_id) REFERENCES deck_drawings(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS improvement_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      area_calc_id INTEGER,
      feedback_type TEXT NOT NULL,
      comments TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (area_calc_id) REFERENCES area_calculations(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT,
      deck_area REAL NOT NULL,
      material TEXT,
      price_estimate REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS material_estimates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deck_id INTEGER,
      material_type TEXT,
      sq_ft_rate REAL,
      total_cost REAL,
      FOREIGN KEY (deck_id) REFERENCES deck_drawings(id)
    )
  `);
});

export default db;
