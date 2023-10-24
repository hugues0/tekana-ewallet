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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
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

  @ApiOkResponse({
    status: 201,
    description: 'Transaction initiated',
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'Invalid transaction request/insufficient funds',
  })
  @Post()
  async create(@Body() createTransactionDto: CreateTransactionDto) {
    return await this.transactionsService.create(createTransactionDto);
  }

  @ApiOkResponse({
    status: 200,
    description: 'Transaction completed',
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'Invalid transaction request',
  })
  @Patch('complete-transaction')
  async complete(@Body() completeTransactionDto: CompleteTransactionDto) {
    return await this.transactionsService.complete(completeTransactionDto);
  }

  @ApiOkResponse({
    status: 200,
    description: 'Transactions list retrieved',
  })
  @ApiForbiddenResponse({
    status: 403,
    description: 'Forbidden resource(s)',
  })
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

  @ApiOkResponse({
    status: 200,
    description: 'single transaction retrieved',
  })
  @ApiForbiddenResponse({
    status: 403,
    description: 'Forbidden resource(s)',
  })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(+id);
  }
}
