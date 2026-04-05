import express from 'express';
import cors from 'cors';
import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import browserUseRoutes from './routes/browserUse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenvConfig({ path: './.env' });

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/browseruse', browserUseRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Piggy AI backend running' });
});

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
