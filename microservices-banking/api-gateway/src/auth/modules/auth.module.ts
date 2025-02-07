import { Module } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { UsersModule } from 'src/customer/modules/user.module';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { AuthController } from '../controllers/auth.controller';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
