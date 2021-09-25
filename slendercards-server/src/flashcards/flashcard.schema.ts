import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FlashcardDocument = Flashcard & Document;

@Schema()
export class Flashcard {
  @Prop()
  srcLang: string;
  @Prop()
  targLang: string;
  @Prop()
  srcSentence: string;
  @Prop()
  targSentence: string;
  @Prop()
  srcTTS: string;
  @Prop()
  targTTS: string;
  @Prop()
  dateCreated: Date;
  @Prop()
  overallScore: number;
  @Prop()
  timesSeen: number;
}

export const FlashcardSchema = SchemaFactory.createForClass(Flashcard);
