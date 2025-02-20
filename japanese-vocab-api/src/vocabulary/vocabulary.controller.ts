import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { VocabularyService } from './vocabulary.service';
import { CreateVocabularyDto } from './dto/create-vocabulary.dto';
import { Vocabulary } from './entities/vocabulary.entity';

@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Post()
  async create(@Body() createVocabularyDto: CreateVocabularyDto): Promise<Vocabulary> {
    return await this.vocabularyService.create(createVocabularyDto);
  }

  @Get()
  async findAll(): Promise<Vocabulary[]> {
    return await this.vocabularyService.findAll();
  }

  @Get('lesson')
  async findByLesson(
    @Query('level') level: string,
    @Query('lesson') lesson: string,
  ): Promise<Vocabulary[]> {
    return await this.vocabularyService.findByLesson(level, lesson);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateData: Partial<Vocabulary>,
  ): Promise<Vocabulary> {
    return await this.vocabularyService.update(id, updateData);
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<void> {
    return await this.vocabularyService.delete(id);
  }

  @Get('difficult')
  async getDifficultWords(): Promise<Vocabulary[]> {
    return await this.vocabularyService.getDifficultWords();
  }
} 