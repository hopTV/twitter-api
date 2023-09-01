import { Request } from 'express'
import { ParamSchema, checkSchema } from 'express-validator'
import { ErrorWithStatus } from '~/models/Errors'
import userServices from '~/services/users.services'
import { validate } from '~/utils/validation'
import { userMessages } from '~/constants/message'
import databaseServices from '~/services/database.services'
import { hashPassword } from '~/utils/crypto'
import { verifyAccessToken } from '~/utils/common'
import httpStatus from '~/constants/httpStatus'
import { JsonWebTokenError } from 'jsonwebtoken'
import { capitalize } from 'lodash'
import { verifyToken } from '~/utils/jwt'
import { error } from 'console'
import { ObjectId } from 'mongodb'

const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: userMessages.PASSWORD_IS_REQUIRED
  },
  isString: { errorMessage: userMessages.PASSWORD_MUST_BE_A_STRING },
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: userMessages.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minNumbers: 1,
      minUppercase: 1,
      minSymbols: 1
    },
    errorMessage: userMessages.PASSWORD_MUST_BE_STRONG
  }
}

const confirmPasswordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: userMessages.CONFIRM_PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: userMessages.PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 6,
      max: 100
    },
    errorMessage: userMessages.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1
    },
    errorMessage: userMessages.CONFIRM_PASSWORD_MUST_BE_STRONG
  },
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(userMessages.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
      }
      return true
    }
  }
}

const forgotPasswordTokenSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value: string, { req }) => {
      if (!value) {
        throw new ErrorWithStatus({
          message: userMessages.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
          status: httpStatus.UNAUTHORIZED
        })
      }
      try {
        const decoded_forgot_password_token = await verifyToken({
          token: value,
          secretOrPublicKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
        })

        const { user_id } = decoded_forgot_password_token
        const user = await databaseServices.users.findOne({ _id: new ObjectId(user_id) })

        if (user === null) {
          throw new ErrorWithStatus({
            message: userMessages.USER_NOT_FOUND,
            status: httpStatus.UNAUTHORIZED
          })
        }

        if (user.forgot_password_token !== value) {
          throw new ErrorWithStatus({
            message: userMessages.INVALID_FORGOT_PASSWORD_TOKEN,
            status: httpStatus.UNAUTHORIZED
          })
        }

        (req as Request).decoded_forgot_password_token = decoded_forgot_password_token

      } catch (error) {
        if (error instanceof JsonWebTokenError) {
          throw new ErrorWithStatus({
            message: capitalize(error.message),
            status: httpStatus.UNAUTHORIZED
          })
        }
      }
    }
  }
}

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        isEmail: {
          errorMessage: userMessages.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseServices.users.findOne({
              email: value,
              password: hashPassword(req.body.password)
            })
            if (user === null) {
              throw new Error(userMessages.EMAIL_OR_PASSWORD_IS_INCORRECT)
            }
            req.user = user
            return true
          }
        }
      },
      password: passwordSchema
    },
    ['body']
  )
)

export const registerValidator = validate(
  checkSchema({
    name: {
      notEmpty: {
        errorMessage: userMessages.NAME_IS_REQUIRED
      },
      isString: {
        errorMessage: userMessages.NAME_MUST_BE_A_STRING
      },
      trim: true,
      isLength: {
        options: {
          min: 6,
          max: 100
        },
        errorMessage: userMessages.NAME_LENGTH_MUST_BE_FROM_1_TO_100
      }
    },
    email: {
      notEmpty: {
        errorMessage: userMessages.EMAIL_IS_REQUIRED
      },
      isEmail: {
        errorMessage: userMessages.EMAIL_IS_INVALID
      },
      trim: true,
      custom: {
        options: async (value) => {
          const isExisEmail = await userServices.checkEmailExist(value)
          if (isExisEmail) {
            throw new Error(userMessages.EMAIL_ALREADY_EXISTS)
          }
          return true
        }
      }
    },
    password: passwordSchema,
    confirm_password: confirmPasswordSchema,
    date_of_birth: {
      isISO8601: {
        options: {
          strict: true,
          strictSeparator: true
        },
        errorMessage: userMessages.DATE_OF_BIRTH_MUST_BE_ISO8601
      }
    }
  })
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        custom: {
          options: async (value: string, { req }) => {
            const access_token = (value || '').split(' ')[1]
            return await verifyAccessToken(access_token, req as Request)
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: userMessages.REFRESH_TOKEN_IS_REQUIRED,
                status: httpStatus.UNAUTHORIZED
              })
            }
            try {
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value, secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string }),
                databaseServices.refreshTokens.findOne({ token: value })
              ])
              if (refresh_token === null) {
                throw new ErrorWithStatus({
                  message: userMessages.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                  status: httpStatus.UNAUTHORIZED
                })
              }
              ;(req as Request).decoded_refresh_token = decoded_refresh_token
            } catch (err) {
              if (err instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: capitalize(err.message),
                  status: httpStatus.UNAUTHORIZED
                })
              }
              throw err
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)
export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: userMessages.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                status: httpStatus.UNAUTHORIZED
              })
            }
            try {
              const decoded_email_verify_token = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
              })

              ;(req as Request).decoded_email_verify_token = decoded_email_verify_token
            } catch (error) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: httpStatus.UNAUTHORIZED
              })
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const forgotPasswordValidate = validate(
  checkSchema({
    email: {
      isEmail: {
        errorMessage: userMessages.EMAIL_IS_INVALID
      },
      trim: true,
      custom: {
        options: async (value, { req }) => {
          const user = await databaseServices.users.findOne({
            email: value
          })
          if (user === null) {
            throw new Error(userMessages.USER_NOT_FOUND)
          }
          req.user = user
          return true
        }
      }
    }
  })
)

export const verifyForgotTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
)

export const resetPasswordValidator = validate(
  checkSchema({
    password: passwordSchema,
    confirm_password: confirmPasswordSchema,
    forgot_password_token: forgotPasswordTokenSchema
  }, ['body'])
)
