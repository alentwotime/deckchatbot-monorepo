const path = require('path');
const Database = require('better-sqlite3');
const config = require('./config');

const dbFile = config.MEM_DB || path.join(__dirname, 'memory.sqlite');
let db;
let inMemoryMessages = [];
let inMemoryMeasurements = [];
try {
  db = new Database(dbFile);
} catch (err) {
  console.error('Failed to initialize the database, falling back to in-memory storage:', err.message);
  db = null;
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
 * @param {'user'|'assistant'} role
 * @param {string} content
 */
function addMessage(role, content) {
  const entry = { role, content, timestamp: Date.now() };
  if (db) {
    try {
      const stmt = db.prepare(
        'INSERT INTO messages (role, content, timestamp) VALUES (?, ?, ?)'
      );
      stmt.run(role, content, entry.timestamp);
    } catch (err) {
      console.error('Error adding message to database:', err);
    }
  } else {
    inMemoryMessages.push(entry);
  }
}
/**
 * Adds a measurement to the database.
 * @param {any} data - The measurement data to store (will be stringified as JSON).
 */
function addMeasurement(data) {
  const entry = { id: Date.now(), data, timestamp: Date.now() };
  if (db) {
    try {
      const stmt = db.prepare('INSERT INTO measurements (data, timestamp) VALUES (?, ?)');
      stmt.run(JSON.stringify(data), entry.timestamp);
    } catch (err) {
      console.error('Error adding measurement to database:', err);
      throw err;
    }
  } else {
    inMemoryMeasurements.push(entry);
  }
}

/**
 * Retrieves all measurements from the database.
 * @returns {({id: number, data: any, timestamp: number})[]}
 */
function getAllMeasurements() {
  if (db) {
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
  return [...inMemoryMeasurements];
}

/**
 * Clears all messages and measurements from the database.
 */
function clearMemory() {
  if (db) {
    try {
      db.prepare('DELETE FROM messages').run();
      db.prepare('DELETE FROM measurements').run();
    } catch (err) {
      console.error('Error clearing memory:', err);
      throw err;
    }
  } else {
    inMemoryMessages = [];
    inMemoryMeasurements = [];
  }
}

/**
 * Retrieves the most recent messages from the database.
 * @param {number} [limit=10] - The maximum number of messages to retrieve.
 * @returns {Array<{id: number, role: string, content: string, timestamp: number}>}
 */
function getRecentMessages(limit = 10) {
  if (db) {
    try {
      const stmt = db.prepare('SELECT * FROM messages ORDER BY timestamp DESC LIMIT ?');
      return stmt.all(limit);
    } catch (err) {
      console.error('Error retrieving recent messages:', err);
      return [];
    }
  }
  return inMemoryMessages.slice(-limit).reverse();
}

/**
 * Cleans up temporary files created during processing.
 * @param {string} filePath - The path to the temporary file to delete.
 */
function cleanTempFile(filePath) {
  try {
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error('Error cleaning temp file:', err);
  }
}

module.exports = {
  addMessage,
  addMeasurement,
  getAllMeasurements,
  clearMemory,
  getRecentMessages,
  cleanTempFile
};
