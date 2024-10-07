import express from 'express'
import Conversation from '../models/conversation.js'
import Message from '../models/message.js'
import User from '../models/user.js'
import  isAuth  from '../utils/isAuth.js'
import logger from '../utils/logger.js'

const router = express.Router()

// Add message
router.post('/', isAuth, async (req, res) => {
  const { content, conversationId } = req.body

  if (!content || !conversationId) {
    console.log('Invalid data passed into request')
    return res.status(400).json({
      message: 'Bad request! 😕',
      type: 'error',
    })
  }

  let newMessage = {
    sender: req.user._id,
    content,
    chat: conversationId,
  }

  try {
    let message = await Message.create(newMessage)

    message = await message.populate([
      { path: 'sender', select: 'name profileImage' },
      { path: 'chat' },
    ])
    message = await User.populate(message, {
      path: 'users',
      select: '_id name email profileImage',
    })

    await Conversation.findByIdAndUpdate(conversationId, { latestMessage: message })

    res.json(message)
  } catch (error) {
    logger.error(error)
    return res.status(500).json({
      type: 'error',
      message: 'Error sending message!',
      error,
    })
  }
})

// Get messages
router.get('/:conversationId', async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.conversationId }).populate([
      { path: 'sender', select: '_id name email profileImage' },
      { path: 'chat' },
    ])
    res.status(200).json(messages)
  } catch (error) {
    logger.error(error)
    return res.status(500).json({
      type: 'error',
      message: 'Error fetching conversation!',
      error,
    })
  }
})

export default router
