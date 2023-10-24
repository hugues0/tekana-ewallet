import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Customer } from 'src/customers/entities/customer.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCustomerDto } from 'src/customers/dto/create-customer.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import {
  EMAIL_IN_USE,
  INVALID_CREDENTIALS,
  CUSTOMER_NOT_FOUND_MESSAGE,
} from 'src/shared/constants/ErrorMessages';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    private jwtService: JwtService,
  ) {}

  async register(customer: CreateCustomerDto): Promise<Customer> {
    const { email, password } = customer;
    const customerExists = await this.customersRepository.findOne({
      where: { email },
    });
    if (customerExists) throw new ConflictException(EMAIL_IN_USE);
    const hashedPassword = await bcrypt.hash(password, 10);
    customer.password = hashedPassword;
    return await this.customersRepository.save(customer);
  }

  async login(credentials: LoginDto) {
    const { email, password } = credentials;

    const customer = await this.customersRepository.findOne({
      where: { email },
      relations: ['wallet'],
    });

    if (!customer) {
      throw new NotFoundException(CUSTOMER_NOT_FOUND_MESSAGE);
    }

    const passwordMatch = await bcrypt.compare(password, customer.password);
    if (!passwordMatch) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    const payload = {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      role: customer.role,
      walletId: customer.wallet?.id || null,
      walletBallance: customer.wallet?.balance || null,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  validateToken(token: string) {
    return this.jwtService.verify(token, {
      secret: process.env.JWT_SECRET,
    });
  }
}
