import cors from 'cors';
import express, { urlencoded, json } from 'express';
import { connect } from 'mongoose';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();


// Routes
import authRouter from './routes/auth.js';
import mainRouter from './routes/index.js';
import productRouter from './routes/product.js';
import categoryRouter from './routes/category.js';
import userRouter from './routes/user.js';
import cartRouter from './routes/cart.js';
import wishlistRouter from './routes/wishlist.js';
import reviewsRouter from './routes/reviews.js';
import conversationRouter from './routes/conversation.js';
import messageRouter from './routes/message.js';
import MONGO_URI from './utils/config.js';
import logger from './utils/logger.js';  // Ensure logger is imported
import {requestLogger}  from './utils/middleware.js';

const app = express();

// Middleware functions
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    'http://localhost:5010',
    'http://127.0.0.1:5010',
    'http://localhost:8080',
    'https://sell-easy.vercel.app',
    'https://sell-easy-giridhar7632.vercel.app',
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(urlencoded({ extended: true }));
app.use(json());
app.use(cookieParser());
app.use(requestLogger);

// Define routes
app.use('/api', mainRouter);
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/users', userRouter);
app.use('/api/cart', cartRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/conversations', conversationRouter);
app.use('/api/messages', messageRouter);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => logger.info('MongoDB connection is established successfully! 🎉')) // Updated logger usage
  .catch((err) => logger.error('Something went wrong: ' + err.message)); // Updated logger usage

// Global error handling
app.use((err, req, res, next) => {
  logger.error(err.stack); // Updated logger usage
  res.status(err.status || 500).json({ message: err.message });
});

// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`); // Updated logger usage
});

export default app;
