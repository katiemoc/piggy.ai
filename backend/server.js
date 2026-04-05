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
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);
app.use(cors({
  origin: ['http://localhost:5173', 'https://piggy-ai.tech'],
  credentials: true,
}));
app.use(express.json());
app.use(passport.initialize());
app.use('/api/auth/google', googleRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Create BrowserUse session
app.post('/api/browseruse/session', async (req, res) => {
  try {
    if (!process.env.BROWSER_USE_API_KEY) {
      return res.status(500).json({ error: 'BROWSER_USE_API_KEY is not set on the server' });
    }

    const response = await fetch('https://api.browser-use.com/api/v3/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Browser-Use-API-Key': process.env.BROWSER_USE_API_KEY,
      },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      return res.status(response.status).json(data);
    } catch {
      return res.status(response.status).send(text);
    }
  } catch (err) {
    console.error('BrowserUse create session error:', err);
    return res.status(500).json({ error: 'Failed to create BrowserUse session' });
  }
});

// Get BrowserUse session status
app.get('/api/browseruse/session/:id', async (req, res) => {
  try {
    if (!process.env.BROWSER_USE_API_KEY) {
      return res.status(500).json({ error: 'BROWSER_USE_API_KEY is not set on the server' });
    }

    const response = await fetch(`https://api.browser-use.com/api/v3/sessions/${req.params.id}`, {
      method: 'GET',
      headers: {
        'X-Browser-Use-API-Key': process.env.BROWSER_USE_API_KEY,
      },
    });

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      return res.status(response.status).json(data);
    } catch {
      return res.status(response.status).send(text);
    }
  } catch (err) {
    console.error('BrowserUse get session error:', err);
    return res.status(500).json({ error: 'Failed to fetch BrowserUse session status' });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Piggy AI backend running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});