import { Router } from 'express'; 
import bcrypt from 'bcryptjs'; // Use default import
const { hash, compare } = bcrypt; // Destructure the methods you need

import pkg from 'jsonwebtoken';
const { verify } = pkg;


import User from '../models/user.js'; 
import logger from '../utils/logger.js'; 
import config from '../utils/config.js'; 
const { REFRESH_TOKEN_SECRET } = config; 
import { createAccessToken, createRefreshToken, sendAccessToken, sendRefreshToken, createEmailVerificationToken } from '../utils/tokens.js'; 
import { transporter, emailVerificationTemplate, createEmailVerificationUrl } from '../utils/email.js';

const router = Router();

// register a user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phoneNumber, address, profileImage } = req.body;

    const user = await findOne({ email });
    if (user) {
      return res.status(500).json({
        message: 'User already exists! Try logging in. 😄',
        type: 'warning',
      });
    }

    const passwordHash = await hash(password, 12);
    const newUser = new User({
      name,
      email,
      password: passwordHash,
      phoneNumber,
      address,
      profileImage,
    });

    const saved = await newUser.save();
    const token = createEmailVerificationToken(saved);

    const url = createEmailVerificationUrl(saved._id, token);

    const mailOptions = emailVerificationTemplate(saved, url);
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        logger.error(err, info);
        return res.status(500).json({
          message: 'Error sending email! 😢',
          type: 'error',
        });
      }

      return res.json({
        message: 'Verify your email by clicking the link sent to your email! 📧',
        type: 'success',
      });
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      type: 'error',
      message: 'Error creating user!',
      error,
    });
  }
});

// login a user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findOne({ email }).select(['+refreshToken', '+password']);
    if (!user) {
      return res.status(404).json({
        message: "User doesn't exist! 😢",
        type: 'error',
      });
    }

    const isMatch = await compare(password, user.password);
    if (!isMatch) {
      return res.status(403).json({
        message: 'Password is incorrect! ⚠️',
        type: 'error',
      });
    }

    const accessToken = createAccessToken(user._id);
    const refreshToken = createRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    sendRefreshToken(res, refreshToken);
    sendAccessToken(req, res, user, accessToken);
  } catch (error) {
    logger.error(error);

    return res.status(500).json({
      type: 'error',
      message: 'Error signing in!',
      error,
    });
  }
});

// logout a user
router.post('/logout', (_req, res) => {
  res.clearCookie('refreshToken');
  return res.json({
    message: 'Logged out successfully! 🤗',
    type: 'success',
  });
});

// refresh token
router.post('/refresh_token', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(404).json({
        message: 'No refresh token! 🤔',
        type: 'error',
      });
    }

    let id;
    try {
      id = verify(refreshToken, REFRESH_TOKEN_SECRET).id;
    } catch (error) {
      logger.error(error);
      return res.status(401).json({
        message: 'Invalid refresh token! 🤔',
        type: 'error',
      });
    }

    if (!id) {
      return res.status(401).json({
        message: 'Invalid refresh token! 🤔',
        type: 'error',
      });
    }

    const user = await findById(id).select('+refreshToken');

    if (!user) {
      return res.status(404).json({
        message: "User doesn't exist! 😢",
        type: 'error',
        id,
      });
    }

    if (user.refreshToken !== refreshToken) {
      return res.status(403).json({
        message: 'Invalid refresh token! 🤔',
        type: 'error',
      });
    }

    const accessToken = createAccessToken(user._id);
    const newRefreshToken = createRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    sendRefreshToken(res, newRefreshToken);
    return res.json({
      message: 'Refreshed successfully! 🤗',
      type: 'success',
      accessToken,
      user,
    });
  } catch (error) {
    logger.error(error);

    return res.status(500).json({
      type: 'error',
      message: 'Error refreshing token!',
      error,
    });
  }
});

export default router;
