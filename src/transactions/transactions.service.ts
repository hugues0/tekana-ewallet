import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { WalletsService } from 'src/wallets/wallets.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { Repository } from 'typeorm';
import { CompleteTransactionDto } from './dto/complete-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @Inject(WalletsService)
    private readonly walletsService: WalletsService,
  ) {}

  async create(createTransactionDto: CreateTransactionDto) {
    const { senderWalletId, receiverWalletId, amount, type } =
      createTransactionDto;
    const walletExists = await this.walletsService.findOne(senderWalletId);

    const receiverWalletExists = await this.walletsService.findOne(
      receiverWalletId,
    );

    const newBalance = walletExists.balance - amount;
    if (newBalance < 500) {
      throw new BadRequestException(
        'Insufficient funds to complete this transaction',
      );
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
      throw new NotFoundException(
        'transaction with provided verificationCode does not exists',
      );

    const currentDate = new Date();

    if (!(transactionExists.status === 'pending'))
      throw new BadRequestException(
        'Sorry this transaction can not be completed, please contact support',
      );

    if (
      transactionExists.verificationCodeExpiresAt < currentDate ||
      !(transactionExists.verificationCode === verificationCode.toUpperCase())
    )
      throw new BadRequestException(
        'Invalid or expired transaction verification code',
      );

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

  findAll() {
    return `This action returns all transactions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} transaction`;
  }

  update(id: number, updateTransactionDto: UpdateTransactionDto) {
    return `This action updates a #${id} transaction`;
  }

  remove(id: number) {
    return `This action removes a #${id} transaction`;
  }

  generateRandomSixDigits() {
    const random = Math.floor(100000 + Math.random() * 900000);
    return random;
  }
}
