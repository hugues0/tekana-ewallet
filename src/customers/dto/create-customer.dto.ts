import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @IsNotEmpty()
  @ApiProperty()
  firstName: string;

  @ApiProperty()
  @IsNotEmpty()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsNotEmpty()
  @ApiProperty()
  nationalId: string;

  @IsNotEmpty()
  @ApiProperty()
  password: string;
}
