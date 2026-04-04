import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB error:', err))

app.get('/', (req, res) => {
  res.json({ message: 'Piggy AI backend running' })
})

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`))