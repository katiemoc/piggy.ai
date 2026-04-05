import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ email: profile.emails[0].value });
    if (!user) {
      user = await User.create({
        name: profile.displayName,
        email: profile.emails[0].value,
        password: 'google-oauth',
      });
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

router.get('/', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    const user = { id: req.user._id, name: req.user.name, email: req.user.email };
    const params = new URLSearchParams({ token, user: JSON.stringify(user) });
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?${params}`);
  }
);

export default router;