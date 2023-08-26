import { NextFunction, Request, Response } from 'express'
import userServices from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { registerReqBody } from '~/models/requests/user.requerst'

export const loginController = (req: Request, res: Response) => {
  return res.json({
    message: 'login success'
  })
}

export const registerController = async (
  req: Request<ParamsDictionary, any, registerReqBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await userServices.register(req.body)
  return res.json({
    message: 'resgister success',
    result
  })
}
