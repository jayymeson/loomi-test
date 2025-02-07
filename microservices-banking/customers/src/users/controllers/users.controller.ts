import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiResponse, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../interface/user.interface';
import { plainToInstance } from 'class-transformer';
import { Express } from 'express';

@ApiTags('users')
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Post()
  @UseInterceptors(FileInterceptor('profilePicture'))
  async createUser(
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<void> {
    if (file) {
      console.log(`Received file: ${file.originalname}`);
    }

    const createUserDto = plainToInstance(CreateUserDto, {
      ...body,
      bankingDetails: body.bankingDetails,
    });

    await this.usersService.createUser(createUserDto, file);

    return;
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'The user data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Get(':userId')
  async getUserById(@Param('userId') userId: string): Promise<User> {
    return this.usersService.getUserById(userId);
  }

  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully updated.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Patch(':userId')
  async updateUser(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<void> {
    await this.usersService.updateUser(userId, updateUserDto);
    return;
  }

  @ApiOperation({ summary: 'Update profile picture by ID' })
  @ApiResponse({
    status: 200,
    description: 'The profile picture has been successfully updated.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Patch(':userId/profile-picture')
  @UseInterceptors(FileInterceptor('profilePicture'))
  async updateProfilePicture(
    @Param('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<void> {
    await this.usersService.updateProfilePicture(userId, file);
    return;
  }
}
