/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  Resolver,
  Query,
  Field,
  Mutation,
  Arg,
  Int,
  ObjectType,
} from 'type-graphql'
import argon2 from 'argon2'
import { User } from '../entities/User'
import { Response } from '../types/Response'
import { errorResponse } from '../libs/errorResponse'
import { assign } from '../libs/jwt'

@ObjectType()
class UserResponse extends Response {
  @Field(() => User, { nullable: true })
  user?: User
}

@ObjectType()
class UsersResponse extends Response {
  @Field(() => [User], { nullable: true })
  users?: User[]
}

@ObjectType()
class CreateUserResponse extends UserResponse {
  @Field(() => String, { nullable: true })
  token?: string
}

@Resolver()
export class UserResolver {
  @Query(() => UserResponse)
  async user(@Arg('id', () => Int) id: number) {
    const user = await User.findOne(id)
    if (!user) {
      return errorResponse('User not found')
    }
    return { user }
  }

  @Query(() => UsersResponse)
  users() {
    try {
      const users = User.find()
      return { users }
    } catch (err) {
      return errorResponse(err.message)
    }
  }

  @Mutation(() => CreateUserResponse)
  async createUser(
    @Arg('email') email: string,
    @Arg('password') password: string,
    @Arg('firstName') firstName: string,
    @Arg('lastName') lastName: string
  ) {
    if (!/@/i.test(email)) {
      return errorResponse('Not a valid email address')
    }
    try {
      const hashedPassword = await argon2.hash(password)
      const user = User.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
      })
      const { id } = await user.save()
      const token = assign(id.toString())
      return { user, token }
    } catch (err) {
      const errorMessage =
        err.code === '23505' ? 'User already exists' : err.message
      return errorResponse(errorMessage)
    }
  }

  @Mutation(() => CreateUserResponse)
  async authenticateUser(
    @Arg('email') email: string,
    @Arg('password') password: string
  ) {
    if (!/@/i.test(email)) {
      return errorResponse('Not a valid email address')
    }
    try {
      const user = await User.findOne({
        where: { email },
      })
      if (user) {
        const passwordIsValid = await argon2.verify(user.password, password)
        const token = assign(user.id.toString())
        if (passwordIsValid) {
          return { user, token }
        }
      }
      return { user }
    } catch (err) {
      console.log(err)
      return errorResponse(err.message)
    }
  }
}
