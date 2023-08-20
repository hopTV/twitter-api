import express from 'express'
import usersRouter from './routes/users.routes'
import { loginValidator } from './middlewares/users.middlewares'
import databaseServices from './services/database.services'

const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('hello anh hợp')
})

databaseServices.connect()

app.use(express.json())
app.use('/users', usersRouter)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
