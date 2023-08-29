import { Request } from "express";
import { JsonWebTokenError } from "jsonwebtoken";
import { capitalize } from "lodash";
import httpStatus from "~/constants/httpStatus";
import { userMessages } from "~/constants/message";
import { ErrorWithStatus } from "~/models/Errors";
import { verifyToken } from "./jwt";

export const verifyAccessToken = async (access_token: string, req?: Request) => {
    if(!access_token) {
        throw new ErrorWithStatus({message: userMessages.ACCESS_TOKEN_IS_REQUIRED, status: httpStatus.UNAUTHORIZED})
    }

    try {
        const decoded_authorization = await verifyToken({
            token: access_token,
            secretOrPublicKey: process.env.JWT_SECRET as string
        })
        if(req) {
            (req as Request).decoded_authorization = decoded_authorization
            return true
        }
        return decoded_authorization
    }catch(err) {
        throw new ErrorWithStatus({
            message: capitalize((err as JsonWebTokenError).message),
            status: httpStatus.UNAUTHORIZED
        })
    }
}