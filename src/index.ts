import express from 'express'
import usersRouter from './routes/users.routes'
import databaseServices from './services/database.services'
import {defaultErrorHandler} from './middlewares/errorr.middlewares'

const app = express()
const port = 3000
databaseServices.connect()

app.get('/', (req, res) => {
  res.send('hello hoptv')
})

app.use(express.json())
app.use('/users', usersRouter)
app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
