import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { Role } from './common/enums/role.enum';

async function seed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    const notary = await usersService.create({
      name: 'Jan Notariusz',
      email: 'notary@example.com',
      password: 'Notary123!',
      role: Role.NOTARY,
    });
    console.log(`✓ Notary created: ${notary.email}`);

    const assistant = await usersService.create({
      name: 'Anna Asystent',
      email: 'assistant@example.com',
      password: 'Assistant123!',
      role: Role.ASSISTANT,
    });
    console.log(`✓ Assistant created: ${assistant.email}`);
  } catch (err) {
    const error = err as Error;
    if (error.message?.includes('already exists')) {
      console.log('Seed users already exist — skipping.');
    } else {
      console.error('Seed failed:', error.message);
      process.exit(1);
    }
  } finally {
    await app.close();
  }
}

seed();
