import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vocabulary } from './entities/vocabulary.entity';
import { CreateVocabularyDto } from './dto/create-vocabulary.dto';

@Injectable()
export class VocabularyService {
  constructor(
    @InjectRepository(Vocabulary)
    private vocabularyRepository: Repository<Vocabulary>,
  ) {}

  async create(createVocabularyDto: CreateVocabularyDto): Promise<Vocabulary> {
    const vocabulary = this.vocabularyRepository.create(createVocabularyDto);
    return await this.vocabularyRepository.save(vocabulary);
  }

  async findAll(): Promise<Vocabulary[]> {
    return await this.vocabularyRepository.find();
  }

  async findByLesson(level: string, lesson: string): Promise<Vocabulary[]> {
    return await this.vocabularyRepository.find({
      where: { level, lesson },
    });
  }

  async update(id: number, updateData: Partial<Vocabulary>): Promise<Vocabulary> {
    await this.vocabularyRepository.update(id, updateData);
    return await this.vocabularyRepository.findOne({ where: { id } });
  }

  async delete(id: number): Promise<void> {
    await this.vocabularyRepository.delete(id);
  }

  async getDifficultWords(): Promise<Vocabulary[]> {
    return await this.vocabularyRepository.find({
      where: { isDifficult: true },
    });
  }
} 