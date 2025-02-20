import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateVocabularyDto {
  @IsNotEmpty()
  @IsString()
  lesson: string;

  @IsNotEmpty()
  @IsString()
  level: string;

  @IsNotEmpty()
  @IsString()
  japanese: string;

  @IsNotEmpty()
  @IsString()
  hiragana: string;

  @IsNotEmpty()
  @IsString()
  meaning: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  reviewCount?: number;

  @IsOptional()
  @IsBoolean()
  isDifficult?: boolean;
} 