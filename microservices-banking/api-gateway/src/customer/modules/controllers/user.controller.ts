import {
  Controller,
  Post,
  Get,
  Body,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  HttpCode,
  Patch,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../services/user.service';
import { CreateUserDto } from 'src/customer/dto/create-user.dto';
import { Public } from 'src/decorator/decorator.public';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { UpdateUserDto } from 'src/customer/dto/udate-user.dto';
import { User } from 'src/customer/interface/user.interface';
import { GetUser } from 'src/decorator/get-user.decorator';
import { DepositDto } from 'src/customer/dto/create-deposit.dto';
import { ErrorMessages } from 'src/enum/error.messages';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersService: UsersService) {}

  @Public()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request – Invalid input data' })
  @ApiResponse({ status: 409, description: 'Conflict – Email already exists' })
  @ApiResponse({
    status: 422,
    description: 'Unprocessable Entity – Validation errors',
  })
  @ApiResponse({
    status: 500,
    description:
      'Internal Server Error – Unexpected error while processing the request',
  })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  @ApiBody({
    description: 'User data with an optional profile picture file',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john@example.com' },
        password: { type: 'string', example: 'Abc1234*' },
        address: { type: 'string', example: '123 Main St' },
        bankingDetails: {
          type: 'object',
          properties: {
            agency: { type: 'string', example: '1234' },
            account: { type: 'string', example: '56789' },
          },
        },
        profilePicture: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async createUser(@Body() body: CreateUserDto): Promise<void> {
    this.logger.log(
      `[UsersController] [createUser] Received data: ${JSON.stringify(body)}`,
    );

    await this.usersService.createUser(body);
    return;
  }

  @ApiOperation({ summary: 'Deposit money into user account' })
  @ApiResponse({ status: 200, description: 'Deposit successful' })
  @ApiResponse({ status: 400, description: 'Invalid deposit amount' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @Post('deposit')
  async deposit(
    @GetUser('sub') userId: string,
    @Body() depositDto: DepositDto,
  ): Promise<void> {
    await this.usersService.deposit(userId, depositDto.amount);
  }

  @ApiOperation({ summary: 'Get current user data' })
  @ApiResponse({ status: 200, description: 'Returns the user data.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiBearerAuth()
  @Get()
  async getUserById(@GetUser('sub') userId: string): Promise<User> {
    return this.usersService.getUserById(userId);
  }

  @ApiOperation({ summary: 'Update current user' })
  @ApiResponse({ status: 200, description: 'User successfully updated.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch('update')
  async updateUser(
    @GetUser('sub') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<void> {
    await this.usersService.updateUser(userId, updateUserDto);
  }

  @ApiOperation({ summary: 'Update current user profile picture' })
  @ApiResponse({
    status: 200,
    description: 'Profile picture updated successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @Patch('profile-picture')
  @UseInterceptors(FileInterceptor('profilePicture'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file for profile picture',
    schema: {
      type: 'object',
      properties: {
        profilePicture: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async updateProfilePicture(
    @GetUser('sub') userId: string,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<void> {
    if (!file) {
      throw new BadRequestException(ErrorMessages.NO_PICTURE_PROVIDED);
    }
    const allowedMimeTypes = ['image/jpeg', 'image/png'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG/PNG allowed.',
      );
    }

    await this.usersService.updateProfilePicture(userId, file);
    return;
  }
}
