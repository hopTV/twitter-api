import { NextFunction, Request, Response, json } from "express";
import mediasService from "~/services/mediasService";

export const uploadImageController =  async(req: Request, res: Response, next: NextFunction) => {
    const url = await mediasService.uploadImage(req)
    console.log(req);
    return res.json(url)
}

