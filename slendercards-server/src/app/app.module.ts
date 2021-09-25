import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Flashcard, FlashcardSchema } from 'src/flashcards/flashcard.schema';
import { FlashcardsController } from 'src/flashcards/flashcards.controller';
import { FlashcardsService } from 'src/flashcards/flashcards.service';
import { ScrapeController } from 'src/flashcards/scrape.controller';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/flashcards'),
    MongooseModule.forFeature([
      {
        name: Flashcard.name,
        schema: FlashcardSchema,
      },
    ]),
  ],
  controllers: [FlashcardsController, ScrapeController],
  providers: [FlashcardsService],
})
export class AppModule {}
