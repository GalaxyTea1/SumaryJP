import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'your_username',
  password: 'your_password',
  database: 'japanese_vocab_db',
  entities: ['dist/**/*.entity{.ts,.js}'],
  synchronize: true, // Chỉ dùng trong môi trường development
}; 