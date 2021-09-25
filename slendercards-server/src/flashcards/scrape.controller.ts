import { Body, Controller, Post } from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import { getSentences } from '../helpers';

@Controller('scrape')
export class ScrapeController {
  constructor(private readonly service: FlashcardsService) {}
  @Post()
  async getTranslations(
    @Body('srcLang') srcLang: string,
    @Body('targLang') targLang: string,
    @Body('phraseQuery') phraseQuery: string,
  ) {
    return await getSentences(phraseQuery, srcLang, targLang);
  }
}
