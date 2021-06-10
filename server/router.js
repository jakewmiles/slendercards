const express = require('express');
const router = express.Router();
const { postNewFlashcard, getAllFlashcards, deleteFlashcard } = require('./controllers/flashcardController');

router.post('/flashcards', postNewFlashcard);
router.get('/flashcards', getAllFlashcards)
router.delete('/flashcards/:id', deleteFlashcard)

module.exports = router;

