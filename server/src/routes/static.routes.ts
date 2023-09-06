import { Router } from 'express'
import { serveVideoStreamController, serverImageController } from '~/controllers/medias.controller'

const staticRouter = Router()

staticRouter.get('/image/:name', serverImageController)
staticRouter.get('/video-stream/:name', serveVideoStreamController)

export default staticRouter
