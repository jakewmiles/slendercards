const Flashcard = require('../models/Flashcard');
const googleTTS = require('google-tts-api');
const express = require('express');
const app = express();
app.use(express.json());

const languageCodes = {"English":"en-GB", "Spanish":"es-ES", "Italian":"it-IT", "French":"fr-FR", "German":"de-DE", "Polish":"pl-PL", "Russian":"ru-RU", "Portuguese":"pt-PT", "Japanese":"ja" };

const getSrcTextToSpeech = async (phrase, targLang) => {
  try {
    const url = await googleTTS.getAudioUrl(phrase, {
      lang: languageCodes[targLang],
      host: 'https://translate.google.com'
    });
    console.log(url);
    return url;
  } catch (err) {
    console.error(err);
  }
};

exports.postNewFlashcard = async (req, res) => {
  try {
    const { srcLang, targLang, srcSentence, targSentence } = req.body
    const srcTTSURL = await getSrcTextToSpeech(srcSentence, srcLang);
    const targTTSURL = await getSrcTextToSpeech(targSentence, targLang);
    const currDate = Date.now();
    const newFlashcard = new Flashcard({
      srcLang,
      targLang,
      srcSentence,
      targSentence,
      srcTTS: srcTTSURL,
      targTTS: targTTSURL,
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
    const flashcards = await Flashcard.find({}).sort({overallScore: 1});
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

exports.updateFlashcardScore = async (req, res) => {
  console.log('IN HERE');
  const { incValue } = req.body;
  const id = req.params.id;
  console.log(incValue, id);
    try {
      await Flashcard.findByIdAndUpdate(
        id, 
        {$inc: {timesSeen: 1, overallScore: incValue}}, 
        {new: true});
      await Flashcard.find().sort({"overallScore": 1}).exec();
    } catch (err) {
    console.log(err);
  }
}