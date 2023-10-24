import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
  ParseIntPipe,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DeposinInWalletDto } from './dto/wallet-deposit.dto';
import { Authguard } from 'src/auth/auth.guard';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Wallet } from './entities/wallet.entity';
@ApiTags('Wallets')
@Controller('wallets')
@ApiBearerAuth('access_token')
@UseGuards(Authguard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  async create(@Req() request: any, @Body() createWalletDto: CreateWalletDto) {
    if (request.user?.id !== createWalletDto.customerId)
      throw new ForbiddenException();
    return await this.walletsService.create(createWalletDto);
  }

  @Get()
  findAll(
    @Req() request: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ): Promise<Pagination<Wallet>> {
    if (request.user?.role !== 'admin') throw new ForbiddenException();
    limit = limit > 100 ? 100 : limit;
    return this.walletsService.findAll({ page, limit });
  }

  @Get(':id')
  findOne(@Req() request: any, @Param('id') id: string) {
    if (request.user.walletId !== Number(id)) throw new ForbiddenException();
    return this.walletsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Req() request: any,
    @Param('id') id: string,
    @Body() updateWalletDto: UpdateWalletDto,
  ) {
    if (request.user.walletId !== Number(id)) throw new ForbiddenException();
    return this.walletsService.update(+id, updateWalletDto);
  }
}
