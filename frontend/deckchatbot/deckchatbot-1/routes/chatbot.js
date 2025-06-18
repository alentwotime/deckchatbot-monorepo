const express = require('express');
const { chatbot, upload, getHistory } = require('../controllers/chatbotController');

const router = express.Router();

router.post('/chatbot', upload.single('image'), chatbot);
router.get('/history', getHistory);

module.exports = router;
