import { Request, Response } from 'express'
import User from '~/models/schemas/User.schema'
import databaseServices from '~/services/database.services'
import userServices from '~/services/users.services'

export const loginController = (req: Request, res: Response) => {
  return res.json({
    message: 'login success'
  })
}

export const registerController = async (req: Request, res: Response) => {
  const { email, password } = req.body

  try {
    const result = await userServices.register({ email, password })
    return res.status(200).json({
      message: 'resgister success',
      result
    })
  } catch (err) {
    return res.status(400).json({
      message: 'register failed'
    })
  }
}
