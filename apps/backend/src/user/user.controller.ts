import { Body, Controller, Delete, Get, HttpException, Param, Post, Put, UsePipes } from '@nestjs/common';
import { ValidationPipe } from '../shared/pipes/validation.pipe';
import { CreateUserDto, LoginUserDto, UpdateUserDto } from './dto';
import { User } from './user.decorator';
import { IUserRO } from './user.interface';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('user')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Get the current user based on token' })
  @Get('user')
  async findMe(@User('email') email: string): Promise<IUserRO> {
    return this.userService.findByEmail(email);
  }

  @ApiOperation({ summary: 'Update user information' })
  @Put('user')
  async update(@User('id') userId: number, @Body('user') userData: UpdateUserDto) {
    return this.userService.update(userId, userData);
  }

  @ApiOperation({ summary: 'Create a new user' })
  @UsePipes(new ValidationPipe())
  @Post()
  async create(@Body('user') userData: CreateUserDto) {
    return this.userService.create(userData);
  }

  @ApiOperation({ summary: 'Delete a user' })
  @Delete(':slug')
  async delete(@Param('slug') slug: string): Promise<any> {
    return this.userService.delete(slug);
  }

  @ApiOperation({ summary: 'User login' })
  @UsePipes(new ValidationPipe())
  @Post('login')
  async login(@Body('user') loginUserDto: LoginUserDto): Promise<IUserRO> {
    const foundUser = await this.userService.findOne(loginUserDto);
    if (!foundUser) {
      throw new HttpException({ User: ' not found' }, 401);
    }
    const token = await this.userService.generateJWT(foundUser);
    return { user: { ...foundUser, token } };
  }

  @ApiOperation({ summary: 'Get all users with their article information' })
  @Get('roster')
  async getRoster() {
    return await this.userService.findAllUsersWithArticles();
  }
}
