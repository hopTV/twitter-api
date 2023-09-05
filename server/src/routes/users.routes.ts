import { Router } from 'express'
import {
  forgotPasswordController,
  getMeController,
  loginController,
  logoutController,
  oauthController,
  registerController,
  resendVerifyEmailController,
  resetPasswordController,
  updateMeController,
  verifyEmailController,
  verifyForgotPasswordController
} from '~/controllers/users.controller'
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  forgotPasswordValidate,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  updateMeValidator,
  verifiedUserValidator,
  verifyForgotTokenValidator
} from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const usersRouter = Router()

usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController))
//login vs google
usersRouter.get('/oauth/google', wrapRequestHandler(oauthController))

usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController))
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))
usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapRequestHandler(verifyEmailController))
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendVerifyEmailController))
usersRouter.post('/forgot-password', forgotPasswordValidate, wrapRequestHandler(forgotPasswordController))
usersRouter.post(
  '/verify-forgot-password',
  verifyForgotTokenValidator,
  wrapRequestHandler(verifyForgotPasswordController)
)
usersRouter.post('/reset-password', resetPasswordValidator, wrapRequestHandler(resetPasswordController))

usersRouter.get('/me', accessTokenValidator, wrapRequestHandler(getMeController))

usersRouter.patch(
  '/me',
  accessTokenValidator,
  verifiedUserValidator,
  updateMeValidator,
  wrapRequestHandler(updateMeController)
)

export default usersRouter
