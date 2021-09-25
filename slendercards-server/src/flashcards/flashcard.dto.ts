export interface FlashcardInterface {
  srcLang: string;
  targLang: string;
  srcSentence: string;
  targSentence: string;
  srcTTS: string;
  targTTS: string;
  dateCreated: Date;
  overallScore: number;
  timesSeen: number;
}
