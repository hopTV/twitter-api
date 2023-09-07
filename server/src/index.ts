import express from 'express'
import usersRouter from './routes/users.routes'
import databaseServices from './services/database.service'
import { defaultErrorHandler } from './middlewares/errorr.middlewares'
import mediasRouter from './routes/medias.routes'
import { config } from 'dotenv'
import { initFolder } from './utils/files'
import { UPLOAD_IMAGE_DIR } from './constants/dir'
import staticRouter from './routes/static.routes'
import tweetsRouter from './routes/tweets.routes'

config()

const app = express()
const port = process.env.PORT || 4000
databaseServices.connect().then(() => {
  databaseServices.indexUsers()
  databaseServices.indexRefreshToken()
})

app.get('/', (req, res) => {
  res.send('hello hoptv')
})
initFolder()

app.use(express.json())
app.use('/users', usersRouter)
// app.use('/medias', mediasRouter)
// app.use('/static', staticRouter)
app.use('/tweets',tweetsRouter)
app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
