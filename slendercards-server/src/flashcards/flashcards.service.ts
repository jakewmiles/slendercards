import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FlashcardInterface } from './flashcard.dto';
import { Flashcard, FlashcardDocument } from './flashcard.schema';

@Injectable()
export class FlashcardsService {
  constructor(
    @InjectModel(Flashcard.name)
    private flashcardModel: Model<FlashcardDocument>,
  ) {}
  async findAll(): Promise<Flashcard[]> {
    return await this.flashcardModel.find().sort({ overallScore: 1 }).exec();
  }
  async create(flashcard: FlashcardInterface): Promise<Flashcard> {
    return await new this.flashcardModel(flashcard).save();
  }
  async delete(id: string): Promise<Flashcard> {
    return await this.flashcardModel.findByIdAndRemove(id);
  }
  async update(id: string, incValue: number): Promise<Flashcard> {
    return await this.flashcardModel.findByIdAndUpdate(
      id,
      { $inc: { timesSeen: 1, overallScore: incValue } },
      { new: true },
    );
  }
}
