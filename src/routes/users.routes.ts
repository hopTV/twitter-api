import { Router } from 'express'
import { loginController, registerController } from '~/controllers/users.controller'
import { loginValidator } from '~/middlewares/users.middlewares'

const usersRouter = Router()

usersRouter.post('/login', loginValidator, loginController)
usersRouter.post('/register', loginValidator, registerController)

export default usersRouter
