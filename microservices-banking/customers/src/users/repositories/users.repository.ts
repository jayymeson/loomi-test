import { Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../interface/user.interface';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { bankingDetails, ...rest } = createUserDto;
    const user = await this.prisma.user.create({
      data: {
        ...rest,
        bankingDetails: bankingDetails
          ? {
              create: {
                agency: bankingDetails.agency,
                account: bankingDetails.account,
              },
            }
          : undefined,
      },
      include: { bankingDetails: true },
    });
    this.logger.log(
      `[UsersRepository] [create] User created with ID: ${user.id}`,
    );
    return user;
  }

  async findById(userId: string): Promise<User> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { bankingDetails: true },
    });
  }

  async update(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const { bankingDetails, ...rest } = updateUserDto;
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...rest,
        bankingDetails: bankingDetails
          ? {
              update: {
                agency: bankingDetails.agency,
                account: bankingDetails.account,
              },
            }
          : undefined,
      },
      include: { bankingDetails: true },
    });
    this.logger.log(
      `[UsersRepository] [update] User updated with ID: ${user.id}`,
    );
    return user;
  }

  async updateProfilePicture(
    userId: string,
    profilePicture: string,
  ): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      this.logger.warn(
        `[UsersRepository] [updateProfilePicture] User not found for ID: ${userId}`,
      );
      throw new Error(`User with ID ${userId} not found.`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { profilePicture },
      include: { bankingDetails: true },
    });
    this.logger.log(
      `[UsersRepository] [updateProfilePicture] Profile picture updated for user ID: ${updatedUser.id}`,
    );

    return updatedUser;
  }
}
