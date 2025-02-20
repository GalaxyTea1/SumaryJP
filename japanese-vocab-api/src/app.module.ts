import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { VocabularyModule } from './vocabulary/vocabulary.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    VocabularyModule,
  ],
})
export class AppModule {}
