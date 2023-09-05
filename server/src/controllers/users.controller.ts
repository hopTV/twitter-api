import { NextFunction, Request, Response } from 'express'
import userServices from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import {
  registerReqBody,
  LoginReqBody,
  LogoutReqBody,
  TokenPayload,
  VerifyEmailReqBody,
  ForgotPasswordReqBody,
  verifyForgotPasswordReqBody,
  ResetPasswordReqBody,
  UpdateMeReqBody
} from '~/models/requests/user.requerst'
import User from '~/models/schemas/User.schema'
import { ObjectId } from 'mongodb'
import databaseServices from '~/services/database.services'
import httpStatus from '~/constants/httpStatus'
import { userMessages } from '~/constants/message'
import { UserVerifyStatus } from '~/constants/enums'

export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await userServices.login({ user_id: user_id?.toString(), verify: user.verify })

  return res.json({
    message: 'login success',
    result
  })
}

export const oauthController = async (req: Request, res: Response) => {
  const { code } = req.query
  const result = await userServices.oauth(code as string)
  const urlRedirect = `${process.env.CLIENT_REDIRECT}?access_token=${result.access_token}&refresh_token=${result.refresh_token}&new_user=${result.newUser}&verify=${result.verify}`
  return res.redirect(urlRedirect)
}

export const registerController = async (req: Request<ParamsDictionary, any, registerReqBody>, res: Response) => {
  const result = await userServices.register(req.body)
  return res.json({
    message: 'resgister success',
    result
  })
}

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const { refresh_token } = req.body
  const result = await userServices.logout(refresh_token)
  return res.json(result)
}

export const verifyEmailController = async (
  req: Request<ParamsDictionary, any, VerifyEmailReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const user = await databaseServices.users.findOne({
    _id: new ObjectId(user_id)
  })

  // Nếu không tìm thấy user thì mình sẽ báo lỗi
  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json({
      message: userMessages.USER_NOT_FOUND
    })
  }
  // Đã verify rồi thì mình sẽ không báo lỗi
  // Mà mình sẽ trả về status OK với message là đã verify trước đó rồi
  if (user.email_verify_token === '') {
    return res.json({
      message: userMessages.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }
  const result = await userServices.verifyEmail(user_id)
  return res.json({
    message: userMessages.EMAIL_VERIFY_SUCCESS,
    result
  })
}
export const resendVerifyEmailController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await databaseServices.users.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json({
      message: userMessages.USER_NOT_FOUND
    })
  }
  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({
      message: userMessages.RESEND_VERIFY_EMAIL_SUCCESS
    })
  }
  const result = await userServices.resendVerifyEmail(user_id)
  return res.json(result)
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { _id, verify } = req.user as User
  const result = await userServices.forgotPassword({ user_id: (_id as ObjectId).toString(), verify })
  return res.json(result)
}

export const verifyForgotPasswordController = async (
  req: Request<ParamsDictionary, any, verifyForgotPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  return res.json({
    message: userMessages.VERIFY_FORGOT_PASSWORD_SUCCESS
  })
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_forgot_password_token
  const { password } = req.body

  const result = await userServices.resetPassword(user_id, password)
  return res.json(result)
}

export const getMeController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization

  const result = await userServices.getMe(user_id)
  return res.json({
    message: userMessages.GET_ME_SUCCESS,
    result
  })
}

export const updateMeController = async (
  req: Request<ParamsDictionary, any, UpdateMeReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization
  const { body } = req
  const user = await userServices.updateMe(user_id, body)

  return res.json({
    message: userMessages.UPDATE_ME_SUCCESS,
    result: user
  })
}
