import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { WalletsService } from 'src/wallets/wallets.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { Repository } from 'typeorm';
import { CompleteTransactionDto } from './dto/complete-transaction.dto';
import {
  paginate,
  Pagination,
  IPaginationOptions,
} from 'nestjs-typeorm-paginate';
import {
  CONTACT_SUPPORT,
  INSUFFICIENT_FUNDS,
  INVALID_TRANS_CODE,
  NOT_FOUND_TRANSACTION_CODE,
  NOT_FOUND_TRANSACTION_ID,
} from 'src/shared/constants/ErrorMessages';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @Inject(WalletsService)
    private readonly walletsService: WalletsService,
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const { senderWalletId, receiverWalletId, amount, type } =
      createTransactionDto;
    const walletExists = await this.walletsService.findOne(senderWalletId);

    const receiverWalletExists = await this.walletsService.findOne(
      receiverWalletId,
    );

    const newBalance = walletExists.balance - amount;
    if (newBalance < 500) {
      throw new BadRequestException(INSUFFICIENT_FUNDS);
    }

    const prefix: string = type == 'deposit' ? 'DPST' : 'TSFR';
    const currentDate = new Date();
    const verificationCode = this.generateRandomSixDigits();
    const data = {
      amount,
      type,
      senderWallet: walletExists,
      receiverWallet: receiverWalletExists,
      verificationCode: `${prefix}-${verificationCode}`,
      verificationCodeExpiresAt: new Date(currentDate.getTime() + 5 * 60000),
    };

    walletExists.balance = newBalance;
    await this.walletsService.update(walletExists.id, walletExists);
    return await this.transactionRepository.save(data);
  }

  async complete(completeTransactionDto: CompleteTransactionDto) {
    const { verificationCode } = completeTransactionDto;
    const transactionExists = await this.transactionRepository.findOne({
      where: { verificationCode },
      relations: ['receiverWallet'],
    });
    if (!transactionExists)
      throw new NotFoundException(NOT_FOUND_TRANSACTION_CODE);

    const currentDate = new Date();

    if (!(transactionExists.status === 'pending'))
      throw new BadRequestException(CONTACT_SUPPORT);

    if (
      transactionExists.verificationCodeExpiresAt < currentDate ||
      !(transactionExists.verificationCode === verificationCode.toUpperCase())
    )
      throw new BadRequestException(INVALID_TRANS_CODE);

    transactionExists.status = 'completed';

    const reveiverWalletBallance = Number(
      transactionExists.receiverWallet.balance,
    );
    const transactionAmount = Number(transactionExists.amount);
    const { receiverWallet } = transactionExists;
    receiverWallet.balance = reveiverWalletBallance + transactionAmount;
    await this.walletsService.update(receiverWallet.id, receiverWallet);
    return await this.transactionRepository.update(
      transactionExists.id,
      transactionExists,
    );
  }

  async findAll(options: IPaginationOptions): Promise<Pagination<Transaction>> {
    const queryBuilder = this.transactionRepository.createQueryBuilder('c');
    queryBuilder.orderBy('c.id', 'DESC');
    return paginate<Transaction>(queryBuilder, options);
  }

  async findOne(id: number): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['senderWallet', 'receiverWallet'],
    });
    if (!transaction) throw new NotFoundException(NOT_FOUND_TRANSACTION_ID);
    return transaction;
  }

  generateRandomSixDigits(): number {
    const random = Math.floor(100000 + Math.random() * 900000);
    return random;
  }
}
