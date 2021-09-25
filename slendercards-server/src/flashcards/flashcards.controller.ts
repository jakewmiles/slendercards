import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import { getTextToSpeech } from '../helpers';

@Controller('flashcards')
export class FlashcardsController {
  constructor(private readonly service: FlashcardsService) {}
  @Get()
  async getAllFlashcards() {
    return await this.service.findAll();
  }
  @Post()
  async postNewFlashcard(
    @Body('srcSentence') srcSentence: string,
    @Body('targSentence') targSentence: string,
    @Body('srcLang') srcLang: string,
    @Body('targLang') targLang: string,
  ) {
    const srcTTSURL = await getTextToSpeech(srcSentence, srcLang);
    const targTTSURL = await getTextToSpeech(targSentence, targLang);
    const newCard = {
      srcLang: srcLang,
      targLang: targLang,
      srcSentence: srcSentence,
      targSentence: targSentence,
      srcTTS: srcTTSURL,
      targTTS: targTTSURL,
      dateCreated: new Date(),
      overallScore: 0,
      timesSeen: 0,
    };
    return await this.service.create(newCard);
  }
  @Delete(':id')
  async deleteFlashcard(@Param('id') id: string) {
    return await this.service.delete(id);
  }
  @Put(':id')
  async updateFlashcardScore(
    @Param('id') id: string,
    @Body('incValue') incValue: number,
  ) {
    return await this.service.update(id, incValue);
  }
}
