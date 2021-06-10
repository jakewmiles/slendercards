const Flashcard = require('../models/Flashcard');
const express = require('express');
const app = express();
app.use(express.json());

exports.postNewFlashcard = async (req, res) => {
  try {
    const { srcLang, targLang, srcSentence, targSentence } = req.body
    const currDate = Date.now();
    const newFlashcard = new Flashcard({
      srcLang,
      targLang,
      srcSentence,
      targSentence,
      dateCreated: currDate,
      dateToBeReviewed: currDate
    })
    await newFlashcard.save();
    res.status(200).send(newFlashcard);
  } catch (err) {
    res.status(400);
    console.error(err);
  }
}

exports.getAllFlashcards = async (req, res) => {
  try {
    const flashcards = await Flashcard.find();
    res.status(200).send(flashcards);
  } catch (err) {
    res.status(400);
    console.error(err);
  }
}

exports.deleteFlashcard = async (req, res) => {
  try {
    await Flashcard.findByIdAndRemove(req.params.id);
    res.status(204).send('Got a delete request');
  } catch (err) {
    res.status(400);
    console.error(err);
  }
}