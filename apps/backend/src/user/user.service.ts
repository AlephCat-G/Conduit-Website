import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { validate } from 'class-validator';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { EntityManager, wrap } from '@mikro-orm/core';
import { CreateUserDto, LoginUserDto, UpdateUserDto } from './dto';
import { User } from './user.entity';
import { IUserRO } from './user.interface';
import { UserRepository } from './user.repository';
import { SECRET } from '../config';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly em: EntityManager
  ) {}

  async findAllUsersWithArticles(): Promise<any[]> {
    const users = await this.userRepository.findAll({ populate: ['articles'] });
    return users.map(user => {
      const articles = user.articles.getItems();
      const articlesCount = articles.length;
      const favoritesCount = articles.reduce((acc, article) => acc + (article.favoritesCount || 0), 0);
      const firstArticleDate = articles.reduce((acc: Date | null, article) => (!acc || article.createdAt < acc) ? article.createdAt : acc, null);
      return {
        username: user.username,
        profileLink: `/profiles/${user.username}`,
        articlesCount: articlesCount,
        favoritesCount: favoritesCount,
        firstArticleDate: firstArticleDate
      };
    });
  }
  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async findOne(loginUserDto: LoginUserDto): Promise<User | null> {
    const findOneOptions = {
      email: loginUserDto.email,
      password: crypto.createHmac('sha256', loginUserDto.password).digest('hex'),
    };
    return this.userRepository.findOne(findOneOptions);
  }

  async create(dto: CreateUserDto): Promise<IUserRO> {
    const { username, email, password } = dto;
    const exists = await this.userRepository.count({ $or: [{ username }, { email }] });
    if (exists > 0) {
      throw new HttpException({ message: 'Input data validation failed', errors: { username: 'Username and email must be unique.' }}, HttpStatus.BAD_REQUEST);
    }
    const user = new User(username, email, password);
    const errors = await validate(user);
    if (errors.length > 0) {
      throw new HttpException({ message: 'Input data validation failed', errors: { username: 'User input is not valid.' }}, HttpStatus.BAD_REQUEST);
    }
    await this.em.persistAndFlush(user);
    return this.buildUserRO(user);
  }

  async update(id: number, dto: UpdateUserDto): Promise<IUserRO> {
    const user = await this.userRepository.findOne({ id });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    wrap(user).assign(dto);
    await this.em.flush();
    return this.buildUserRO(user);
  }

  async delete(email: string): Promise<number> {
    return this.userRepository.nativeDelete({ email });
  }

  async findById(id: number): Promise<IUserRO> {
    const user = await this.userRepository.findOneOrFail({ id });
    return this.buildUserRO(user);
  }

  async findByEmail(email: string): Promise<IUserRO> {
    const user = await this.userRepository.findOneOrFail({ email });
    return this.buildUserRO(user);
  }

  generateJWT(user: User): string {
    const today = new Date();
    const exp = new Date(today);
    exp.setDate(today.getDate() + 60);
    return jwt.sign({
      id: user.id,
      username: user.username,
      email: user.email,
      exp: exp.getTime() / 1000,
    }, SECRET);
  }

  private buildUserRO(user: User): IUserRO {
    return {
      user: {
        bio: user.bio,
        email: user.email,
        image: user.image,
        token: this.generateJWT(user),
        username: user.username,
      }
    };
  }
}