const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(helmet());
app.use(rateLimit({ /* ...options... */ }));

app.get('/', (req, res) => res.send('Hello world'));

const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`🚀 Server listening on port ${port}`));
