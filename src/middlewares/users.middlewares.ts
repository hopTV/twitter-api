import { error } from 'console'
import { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import { ErrorWithStatus } from '~/models/Errors'
import userServices from '~/services/users.services'
import { validate } from '~/utils/validation'
import { userMessages } from '~/constants/message'

export const loginValidator = validate(checkSchema({}))

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
    password: {
      notEmpty: {
        errorMessage: userMessages.PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: userMessages.PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 6,
          max: 100
        },
        errorMessage: userMessages.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minNumbers: 1,
          minSymbols: 1,
          minUppercase: 1
        },
        errorMessage: userMessages.PASSWORD_MUST_BE_STRONG
      }
    },
    confirm_password: {
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
    },
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
