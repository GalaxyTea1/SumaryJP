import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vocabularies')
export class Vocabulary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  lesson: string;

  @Column()
  level: string;

  @Column()
  japanese: string;

  @Column()
  hiragana: string;

  @Column()
  meaning: string;

  @Column()
  type: string;

  @Column({ default: 'not-learned' })
  status: string;

  @Column({ nullable: true })
  lastReviewed: Date;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ default: false })
  isDifficult: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 