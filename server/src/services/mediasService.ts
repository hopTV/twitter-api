import { config } from "dotenv";
import { Request } from "express";
import { handleUploadImage } from "~/utils/files";

config()

class MediasService {
    async uploadImage(req: Request) {
        const files = await handleUploadImage(req)
        console.log(files);
        
    }
}

const mediasService = new MediasService

export default mediasService