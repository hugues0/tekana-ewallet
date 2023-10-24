import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @IsNotEmpty()
  @ApiProperty()
  senderWalletId: number;

  @IsNotEmpty()
  @ApiProperty()
  amount: number;

  @IsNotEmpty()
  @ApiProperty()
  type: 'transfer' | 'deposit';

  @IsNotEmpty()
  @ApiProperty()
  receiverWalletId: number;
}
