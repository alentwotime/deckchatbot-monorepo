const express = require('express');
const routes = require('./routes');
const db = require('./utils/db'); // Import the db utility
const app = express();

app.use(express.json());
app.use('/api', routes);

// Add a temporary test route for the database
app.get('/db-test', async (req, res) => {
  try {
    // This query will ask the database for the current time
    const { rows } = await db.query('SELECT NOW()');
    console.log('✅ Database connection test successful!');
    res.json({ success: true, time: rows[0].now });
  } catch (err) {
    console.error('❌ Database connection test failed:', err);
    res.status(500).json({ success: false, error: 'Database connection failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
