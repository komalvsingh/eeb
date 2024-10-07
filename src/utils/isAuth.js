import pkg from 'jsonwebtoken';
const { verify } = pkg;
import User from '../models/user.js'; // Ensure correct path and .js extension
import config from '../utils/config.js';

const { ACCESS_TOKEN_SECRET } = config;

const isAuth = async (req, res, next) => {
  const authorization = req.headers['authorization'];

  if (!authorization) {
    return res.status(401).json({
      message: 'No token! 🤔',
      type: 'error',
    });
  }

  const token = authorization.split(' ')[1];
  let id;

  try {
    id = verify(token, ACCESS_TOKEN_SECRET).id;
  } catch {
    return res.status(403).json({
      message: 'Invalid token! 🤔',
      type: 'error',
    });
  }

  if (!id) {
    return res.status(401).json({
      message: 'Invalid token! 🤔',
      type: 'error',
    });
  }

  // Use User model to find the user by ID
  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({
      message: "User doesn't exist! 😢",
      type: 'error',
    });
  }

  req.user = user;
  next();
};

export default isAuth;
