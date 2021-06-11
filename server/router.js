const express = require('express');
const router = express.Router();
const { postNewFlashcard, getAllFlashcards, deleteFlashcard, updateFlashcardScore } = require('./controllers/flashcardController');

router.post('/flashcards', postNewFlashcard);
router.get('/flashcards', getAllFlashcards);
router.delete('/flashcards/:id', deleteFlashcard);
router.put('/flashcards/:id', updateFlashcardScore);

module.exports = router;

