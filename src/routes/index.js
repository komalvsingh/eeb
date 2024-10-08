import express from 'express'
import pkg from 'jsonwebtoken';
const { verify } = pkg;
import bcrypt from 'bcryptjs';

const { hash } = pkg;

import User from '../models/user.js'
import {
  createPasswordResetToken,
  transporter,
  createPasswordResetUrl,
  passwordResetTemplate,
  passwordResetConfirmationTemplate,
  emailVerifyConfirmationTemplate,
} from '../utils/email.js'
import isAuth from '../utils/isAuth.js';  // Correct, using default import

import logger from '../utils/logger.js'

const router = express.Router()

// check the status of server
router.get('/', function (_req, res) {
  res.send('Live!! 👌')
})

// get protected routes
router.get('/protected', isAuth, async (req, res) => {
  try {
    if (req.user) {
      return res.json({
        message: 'You are logged in! 🤗',
        type: 'success',
        user: req.user,
      })
    }

    return res.status(500).json({
      message: 'You are not logged in! 😢',
      type: 'error',
    })
  } catch (error) {
    logger.error(error)
    return res.status(500).json({
      type: 'error',
      message: 'Error getting protected route!',
      error,
    })
  }
})

// verify email
router.get('/verify-email/:id/:token', async (req, res) => {
  try {
    const { id, token } = req.params
    const user = await User.findById(id)

    if (!user) {
      return res.status(404).json({
        message: "User doesn't exist! 😢",
        type: 'error',
      })
    }

    let isValid
    try {
      isValid = verify(token, user.email)
    } catch (error) {
      return res.status(500).json({
        message: 'Invalid token! 😢',
        type: 'error',
      })
    }

    if (!isValid) {
      return res.status(403).json({
        message: 'Invalid token! 😢',
        type: 'error',
      })
    }

    user.verified = true
    await user.save()

    const mailOptions = emailVerifyConfirmationTemplate(user)
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        return res.status(500).json({
          message: 'Error sending email! 😢',
          type: 'error',
        })
      }

      return res.json({
        message: 'Email verification success! 📧',
        type: 'success',
      })
    })
  } catch (error) {
    logger.error(error)
    return res.status(500).json({
      type: 'error',
      message: 'Error sending email!',
      error,
    })
  }
})

// send password reset email
router.post('/send-password-reset-email', async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      return res.status(401).json({
        message: "User doesn't exist! 😢",
        type: 'error',
      })
    }

    const token = createPasswordResetToken(user)
    const url = createPasswordResetUrl(user._id, token)

    const mailOptions = passwordResetTemplate(user, url)
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        logger.error(err, info)
        return res.status(500).json({
          message: 'Error sending email! 😢',
          type: 'error',
        })
      }
      return res.json({
        message: 'Password reset link has been sent to your email! 📧',
        type: 'success',
      })
    })
  } catch (error) {
    logger.error(error)
    return res.status(500).json({
      type: 'error',
      message: 'Error sending email!',
      error,
    })
  }
})

// reset password
router.post('/reset-password/:id/:token', async (req, res) => {
  try {
    const { id, token } = req.params
    const { newPassword } = req.body

    const user = await User.findById(id)

    if (!user) {
      return res.status(500).json({
        message: "User doesn't exist! 😢",
        type: 'error',
      })
    }

    let isValid
    try {
      isValid = verify(token, user.password)
    } catch (error) {
      return res.status(500).json({
        message: 'Invalid token! 😢',
        type: 'error',
      })
    }

    if (!isValid) {
      return res.status(500).json({
        message: 'Invalid token! 😢',
        type: 'error',
      })
    }

    user.password = await hash(newPassword, 12)
    await user.save()

    const mailOptions = passwordResetConfirmationTemplate(user)
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        return res.status(500).json({
          message: 'Error sending email! 😢',
          type: 'error',
        })
      }

      return res.json({
        message: 'Password reset successful!',
        type: 'success',
      })
    })
  } catch (error) {
    logger.error(error)
    return res.status(500).json({
      type: 'error',
      message: 'Error sending email!',
      error,
    })
  }
})

export default router
