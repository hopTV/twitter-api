import express from 'express'
import usersRouter from './routes/users.routes'
import databaseServices from './services/database.service'
import { defaultErrorHandler } from './middlewares/errorr.middlewares'
import mediasRouter from './routes/medias.routes'
import cors, { CorsOptions } from 'cors'
import { config } from 'dotenv'
import { initFolder } from './utils/files'
import staticRouter from './routes/static.routes'
import tweetsRouter from './routes/tweets.routes'
import bookmarksRouter from './routes/bookmarks.routes'
import likeRouter from './routes/like.routes'
import searchRouter from './routes/search.routes'
import { createServer } from 'http'
import initSoket from './utils/socket'
import conversationsRouter from './routes/conversation.routes'
// import './utils/fake'

config()

const app = express()
const httpServer = createServer(app)
const port = process.env.PORT || 4000
databaseServices.connect().then(() => {
  databaseServices.indexUsers()
  databaseServices.indexRefreshToken()
})

app.get('/', (req, res) => {
  res.send('hello hoptv')
})

const corsOptions: CorsOptions = {
  origin: '*'
}
app.use(cors(corsOptions))
initFolder()

app.use(express.json())
app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
app.use('/static', staticRouter)
app.use('/tweets', tweetsRouter)
app.use('/bookmarks', bookmarksRouter)
app.use('/likes', likeRouter)
app.use('/search', searchRouter)
app.use('/conversations', conversationsRouter)
app.use(defaultErrorHandler)

initSoket(httpServer)

httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
