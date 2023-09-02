import User from '~/models/schemas/User.schema'
import databaseServices from './database.services'
import { UpdateMeReqBody, registerReqBody } from '~/models/requests/user.requerst'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { config } from 'dotenv'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { userMessages } from '~/constants/message'
import { ErrorWithStatus } from '~/models/Errors'
import httpStatus from '~/constants/httpStatus'
import Follower from '~/models/schemas/Follwer.schema'

config()
class UsersServices {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: {
        expiresIn: process.env.ACCES_TOKEN_EXPIRES_IN
      }
    })
  }

  private signRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      }
    })
  }

  private signAccessAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }

  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN
      }
    })
  }

  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN
      }
    })
  }

  async register(payload: registerReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    await databaseServices.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        username: `user${user_id.toString()}`,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )

    console.log('email_verify_token: ', email_verify_token)

    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    // const { iat, exp } = await this.decodeRefreshToken(refresh_token)
    await databaseServices.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token })
    )
    // Flow verify email
    // 1. Server send email to user
    // 2. User click link in email
    // 3. Client send request to server with email_verify_token
    // 4. Server verify email_verify_token
    // 5. Client receive access_token and refresh_token
    // await sendVerifyRegisterEmail(payload.email, email_verify_token)
    return {
      access_token,
      refresh_token,
    }
  }

  async checkEmailExist(email: string) {
    const user = await databaseServices.users.findOne({ email })
    return Boolean(user)
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({ user_id, verify })
    await databaseServices.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token })
    )

    return { access_token, refresh_token }
  }

  async logout(refresh_token: string) {
    await databaseServices.refreshTokens.deleteOne({ token: refresh_token })
    return {
      message: userMessages.LOGOUT_SUCCESS
    }
  }

  async verifyEmail(user_id: string) {
    const [token] = await Promise.all([
      this.signAccessAndRefreshToken({ user_id, verify: UserVerifyStatus.Verified }),
      databaseServices.users.updateOne({ _id: new ObjectId(user_id) }, [
        {
          $set: {
            email_verify_token: '',
            verify: UserVerifyStatus.Verified,
            updated_at: '$$NOW'
          }
        }
      ])
    ])
    const [access_token, refresh_token] = token
    return {
      access_token,
      refresh_token
    }
  }

  async resendVerifyEmail(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified })
    console.log('gửi email', email_verify_token)

    await databaseServices.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        email_verify_token,
        verify: UserVerifyStatus.Verified,
        updated_at: '$$NOW'
      }
    )
    return {
      message: userMessages.RESEND_VERIFY_EMAIL_SUCCESS
    }
  }

  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify })

    await databaseServices.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          forgot_password_token,
          updated_at: '$$NOW'
        }
      }
    ])
    console.log('forgot_password_token', forgot_password_token)
    return {
      message: userMessages.CHECK_EMAIL_TO_RESET_PASSWORD
    }
  }

  async resetPassword(user_id: string, password: string) {
    databaseServices.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token: '',
          password: hashPassword(password)
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return {
      message: userMessages.RESET_PASSWORD_SUCCESS
    }
  }

  async getMe(user_id: string) {
    const user = databaseServices.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forget_password_token: 0
        }
      }
    )

    return user
  }

  async updateMe(user_id: string, payload: UpdateMeReqBody) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    const user = await databaseServices.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          ...(_payload as UpdateMeReqBody & { date_of_birth?: Date })
        },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }

  async getProfile(username: string) {
    const user = await databaseServices.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0,
          created_at: 0,
          updated_at: 0
        }
      }
    )

    if (user === null) {
      throw new ErrorWithStatus({
        message: userMessages.USER_NOT_FOUND,
        status: httpStatus.NOT_FOUND
      })
    }

    return user
  }

  async follow(user_id: string, followed_user_id: string) {
    const follower = await databaseServices.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })

    if(follower === null) {
      await databaseServices.followers.insertOne(
        new Follower({
          user_id: new ObjectId(user_id),
          followed_user_id: new ObjectId(followed_user_id)
        })
      )
      return {
        message: userMessages.FOLLOW_SUCCESS
      }
    }

    return {
      message: userMessages.FOLLOWED
    }
  }

  async unFollow(user_id: string, follow_id: string) {
    const follower =  await databaseServices.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(follow_id)
    })

    console.log(follower);
    

    if(follower === null) {
      return {
        message: userMessages.ALREADY_UNFOLLOWED
      }
    }
    await databaseServices.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(follow_id)
    })
    return {
      message: userMessages.UNFOLLOW_SUCCESS
    }
  }

  async changePassword (user_id: string, new_password: string)  {
    await databaseServices.users.updateOne(
      {_id: new ObjectId(user_id)},
      {
        $set: {
          password: hashPassword(new_password)
        },
        $currentDate:{ 
          updated_at: true
        }
      }
      )
    return {
      message: userMessages.CHANGE_PASSWORD_SUCCESS
    }
  }

 }

const userServices = new UsersServices()
export default userServices
