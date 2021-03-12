import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserWithEmailDTO {
  @ApiProperty()
  @IsString()
  readonly name: string;

  @ApiProperty()
  @IsString()
  readonly email: string;

  @ApiProperty()
  @IsString()
  readonly password: string;
}