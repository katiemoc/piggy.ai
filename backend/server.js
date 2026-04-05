import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import passport from 'passport';
import googleRoutes from './routes/google.js';
import chatRoutes from './routes/chat.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use(passport.initialize());
app.use('/api/auth/google', googleRoutes);


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Piggy AI backend running' });
});

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
