import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const user = new this.userModel(dto);
    return user.save();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find({ isActive: true }).exec();
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user || !user.isActive) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    // select('+password') overrides the schema-level select:false
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password')
      .exec();
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async deactivate(id: string): Promise<void> {
    const result = await this.userModel
      .findByIdAndUpdate(id, { isActive: false })
      .exec();

    if (!result) {
      throw new NotFoundException(`User ${id} not found`);
    }
  }
}
