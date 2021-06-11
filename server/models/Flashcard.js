const mongoose = require('./index');

const Schema = mongoose.Schema;

const flashcardSchema = new Schema({
  srcLang: {
    required: true,
    type: String,
  },
  targLang: {
    required: true,
    type: String,
  },
  srcSentence: {
    required: true,
    type: String,
  },
  targSentence: {
    required: true,
    type: String,
  },
  dateCreated: {
    required: true,
    type: Date,
  },
  overallScore: {
    require: true,
    type: Number,
    default: 0,
  },
  timesSeen: {
    required: true,
    type: Number,
    default: 0,
  },
  grade: {
    required: true,
    type: Number,
    default: 0,
  }
});

module.exports = mongoose.model('Flashcard', flashcardSchema);