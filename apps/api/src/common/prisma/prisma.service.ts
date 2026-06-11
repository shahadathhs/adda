import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@adda/db';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly prisma: PrismaClient;

  constructor(private readonly configService: ConfigService) {
    const connectionString =
      this.configService.getOrThrow<string>('DATABASE_URL');

    const adapter = new PrismaPg({ connectionString });

    this.prisma = new PrismaClient({
      adapter,
      log: [{ emit: 'event', level: 'error' }],
    });
  }

  async onModuleInit() {
    this.logger.log('Prisma connecting...');
    await this.prisma.$connect();
    this.logger.log('Prisma connected');
  }

  async onModuleDestroy() {
    this.logger.log('Prisma disconnecting...');
    await this.prisma.$disconnect();
    this.logger.log('Prisma disconnected');
  }

  get client() {
    return this.prisma;
  }
}
