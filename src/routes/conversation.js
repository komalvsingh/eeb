import express from 'express';
import Conversation from '../models/conversation.js';
import User from '../models/user.js';
import logger from '../utils/logger.js';
import isAuth  from '../utils/isAuth.js';

const router = express.Router();

// new conversation
router.post('/', isAuth, async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    console.log('UserId param not sent with request');
    return res.sendStatus(400);
  }

  let isConversation = await Conversation.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate('users')
    .populate('latestMessage');

  isConversation = await User.populate(isConversation, {
    path: 'latestMessage.sender',
    select: 'name profileImage email',
  });

  if (isConversation.length > 0) {
    res.send(isConversation[0]);
  } else {
    const chatData = {
      chatName: 'sender',
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    try {
      const createdConversation = await Conversation.create(chatData);
      const FullChat = await Conversation.findOne({ _id: createdConversation._id }).populate(
        'users',
        '_id name email profileImage'
      );
      res.status(200).json(FullChat);
    } catch (error) {
      logger.error(error);
      return res.status(500).json({
        type: 'error',
        message: 'Error creating chat!',
        error,
      });
    }
  }
});

// get conversations
router.get('/', isAuth, async (req, res) => {
  try {
    Conversation.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate('users', '_id name email profileImage')
      .populate('groupAdmin', '_id name email profileImage')
      .populate('latestMessage')
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: 'latestMessage.sender',
          select: '_id name email profileImage',
        });
        res.status(200).send(results);
      });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      type: 'error',
      message: 'Error getting chat!',
      error,
    });
  }
});

// create group conversation
router.get('/group', async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: 'Please fill all the fields' });
  }

  const users = JSON.parse(req.body.users);

  if (users.length < 2) {
    return res.status(400).send('More than 2 users are required to form a group chat');
  }

  users.push(req.user);

  try {
    const groupChat = await Conversation.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user,
    });

    const fullGroupChat = await Conversation.findOne({ _id: groupChat._id })
      .populate('users', '_id name email profileImage')
      .populate('groupAdmin', '_id name email profileImage');

    res.status(200).json(fullGroupChat);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      type: 'error',
      message: 'Error creating group chat!',
      error,
    });
  }
});

// get conversation including two userIds
router.get('/find/:firstUserId/:secondUserId', async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      members: { $all: [req.params.firstUserId, req.params.secondUserId] },
    });
    res.status(200).json(conversation);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      type: 'error',
      message: 'Error getting conversation!',
      error,
    });
  }
});

export default router;
