import { NextFunction, Request, Response } from 'express'
import userServices from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { registerReqBody, LoginReqBody, LogoutReqBody } from '~/models/requests/user.requerst'
import User from '~/models/schemas/User.schema'
import { ObjectId } from 'mongodb'

export const loginController = async(req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await userServices.login({user_id: user_id?.toString()})
  console.log(result);
  
  return res.json({
    message: 'login success',
    result
  })
}

export const registerController = async (
  req: Request<ParamsDictionary, any, registerReqBody>,
  res: Response,
) => {
  const result = await userServices.register(req.body)
  return res.json({
    message: 'resgister success',
    result
  })
}

export const logoutController = async ( req: Request<ParamsDictionary, any, LogoutReqBody>,
  res: Response) => {
    const {refresh_token} = req.body 
    const result = await userServices.logout(refresh_token)
    return res.json(result)
  }
