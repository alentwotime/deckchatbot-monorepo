import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import fs from 'fs';
import config from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFile = config.MEM_DB || path.join(__dirname, 'memory.sqlite');
let db;
try {
  db = new Database(dbFile);
} catch (err) {
  if (err.code === 'SQLITE_CANTOPEN') {
    console.error(`Failed to open or create the database file at "${dbFile}". Please check file permissions or the path exists.`);
  } else {
    console.error('Failed to initialize the database:', err.message);
  }
  process.exit(1);
}

db.exec(`
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data TEXT NOT NULL,
  timestamp INTEGER NOT NULL
);`);

/**
 * Adds a chat message to the database.
 * @param {string} role - Sender role (e.g., 'user' or 'assistant').
 * @param {string} content - Message text.
 */
function addMessage(role, content) {
  try {
    const stmt = db.prepare('INSERT INTO messages (role, content, timestamp) VALUES (?, ?, ?)');
    stmt.run(role, content, Date.now());
  } catch (err) {
    console.error('Error adding message to database:', err);
    throw err;
  }
}
/**
 * Adds a measurement to the database.
 * @param {any} data - The measurement data to store (will be stringified as JSON).
 */
function addMeasurement(data) {
  try {
    const stmt = db.prepare('INSERT INTO measurements (data, timestamp) VALUES (?, ?)');
    stmt.run(JSON.stringify(data), Date.now());
  } catch (err) {
    console.error('Error adding measurement to database:', err);
    throw err;
  }
}

/**
 * Retrieves all measurements from the database.
 * @returns {({id: number, data: any, timestamp: number})[]}
 */
function getAllMeasurements() {
  try {
    const stmt = db.prepare('SELECT * FROM measurements ORDER BY timestamp DESC');
    const rows = stmt.all();
    return rows.map(row => ({
      ...row,
      data: JSON.parse(row.data)
    }));
  } catch (err) {
    console.error('Error retrieving measurements:', err);
    return [];
  }
}

/**
 * Clears all messages and measurements from the database.
 */
function clearMemory() {
  try {
    db.prepare('DELETE FROM messages').run();
    db.prepare('DELETE FROM measurements').run();
  } catch (err) {
    console.error('Error clearing memory:', err);
    throw err;
  }
}

/**
 * Retrieves the most recent messages from the database.
 * @param {number} [limit=10] - The maximum number of messages to retrieve.
 * @returns {Array<{id: number, role: string, content: string, timestamp: number}>}
 */
function getRecentMessages(limit = 10) {
  try {
    const stmt = db.prepare('SELECT role, content FROM messages ORDER BY timestamp ASC LIMIT ?');
    return stmt.all(limit);
  } catch (err) {
    console.error('Error retrieving recent messages:', err);
    return [];
  }
}

/**
 * Cleans up temporary files created during processing.
 * @param {string} filePath - The path to the temporary file to delete.
 */
function cleanTempFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error('Error cleaning temp file:', err);
  }
}

export {
  addMessage,
  addMeasurement,
  getAllMeasurements,
  clearMemory,
  getRecentMessages,
  cleanTempFile
};
