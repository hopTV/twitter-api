import { NextFunction, Request, Response } from "express"
import { pick } from "lodash"

type filterKeys<T> = Array<keyof T>

export const filterMiddleware = <T>(filterKeys: filterKeys<T>) => (req: Request, res: Response, next: NextFunction) => {
    req.body = pick(req.body, filterKeys)
    next()
  }