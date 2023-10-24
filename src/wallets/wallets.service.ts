import {
  Injectable,
  NotFoundException,
  Inject,
  ConflictException,
} from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { Wallet } from './entities/wallet.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomersService } from 'src/customers/customers.service';
import { DeposinInWalletDto } from './dto/wallet-deposit.dto';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletsRepository: Repository<Wallet>,
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
  ) {}

  async create(createWalletDto: CreateWalletDto) {
    const { customerId } = createWalletDto;
    const customerExists = await this.customersService.findOne(customerId);

    if (!customerExists)
      throw new NotFoundException('User with provided id could not be found');

    if (customerExists.wallet)
      throw new ConflictException('User already has a wallet');

    return await this.walletsRepository.save({
      ...createWalletDto,
      customer: customerExists,
    });
  }

  findAll() {
    return `This action returns all wallets`;
  }

  async findOne(id: number) {
    const wallet = await this.walletsRepository.findOne({
      where: {
        id,
      },
      relations: ['customer'],
    });
    if (!wallet)
      throw new NotFoundException('Wallet with provided id could not be found');

    return wallet;
  }

  async update(id: number, updateWalletDto: UpdateWalletDto) {
    const wallet = await this.findOne(id);

    if (!wallet) {
      throw new NotFoundException(`Wallet with ID ${id} not found`);
    }
    const updatedWallet = await this.walletsRepository.update(
      id,
      updateWalletDto,
    );

    return updatedWallet;
  }

  remove(id: number) {
    return `This action removes a #${id} wallet`;
  }
}
