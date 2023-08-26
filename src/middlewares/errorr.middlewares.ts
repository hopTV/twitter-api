import express, { NextFunction, Request, Response } from 'express'
import { omit } from 'lodash'
import httpStatus from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'

type ErrorsType = Record<string, {
    meg: string,
    location: string,
    value: any
}> // dạng  {[key: string]: string}

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
res.status(err.status || httpStatus.INTERNAL_SERVER_ERROR).json(omit(err, ['status']))
}

// export class EntityError extends ErrorWithStatus {
//     errors: 
// }