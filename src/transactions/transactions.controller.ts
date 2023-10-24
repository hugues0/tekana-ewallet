import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  ParseIntPipe,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CompleteTransactionDto } from './dto/complete-transaction.dto';
import { Authguard } from 'src/auth/auth.guard';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Transaction } from './entities/transaction.entity';
@ApiTags('Transactions')
@Controller('transactions')
@ApiBearerAuth('access_token')
@UseGuards(Authguard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  async create(@Body() createTransactionDto: CreateTransactionDto) {
    return await this.transactionsService.create(createTransactionDto);
  }

  @Patch('complete-transaction')
  async complete(@Body() completeTransactionDto: CompleteTransactionDto) {
    return await this.transactionsService.complete(completeTransactionDto);
  }

  @Get()
  async findAll(
    @Req() request: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ): Promise<Pagination<Transaction>> {
    if (request.user?.role !== 'admin') throw new ForbiddenException();
    limit = limit > 100 ? 100 : limit;
    return this.transactionsService.findAll({ page, limit });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(+id);
  }
}
