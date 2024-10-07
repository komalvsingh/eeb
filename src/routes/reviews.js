import express from 'express';
import  isAuth from '../utils/isAuth.js';
import logger from '../utils/logger.js';
import Review from '../models/review.js';
import User from '../models/user.js';
import Product from '../models/product.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get reviews written by the authenticated user
router.get('/written', isAuth, async (req, res) => {
  try {
    const reviews = await Review.find({ reviewer: req.user._id })
      .populate({ path: 'target.id', select: '_id name profileImage', model: 'User' })
      .sort({ createdAt: 'desc' });

    res.status(200).json(reviews);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Internal server error! 😢' });
  }
});

// Get reviews received by a specific user
router.get('/received/:id', isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const reviews = await Review.find({ 'target.id': req.params.id })
      .populate({ path: 'reviewer', select: '_id name profileImage', model: 'User' })
      .sort({ createdAt: 'desc' });

    res.status(200).json(reviews);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Internal server error! 😢' });
  }
});

// Get all reviews for a product or seller
router.get('/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;

    if (!type || !id) {
      return res.status(400).json({ message: 'Please specify target type and ID! 🤔', type: 'error' });
    }

    const TargetModel = type === 'Product' ? Product : User;
    const targetObj = await TargetModel.findById(id);
    if (!targetObj) return res.status(404).json({ message: `${type} not found! 😢`, type: 'error' });

    const reviews = await Review.find({ 'target.type': type, 'target.id': id })
      .populate({ path: 'reviewer', select: '_id name profileImage', model: 'User' });

    res.json({ reviews });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Internal server error! 😢', type: 'error' });
  }
});

// Add a review
router.post('/', isAuth, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { target, rating, comment } = req.body;

    if (!target.type || !target.id) {
      return res.status(400).json({ message: 'Please specify target type and ID! 🤔', type: 'error' });
    }

    const TargetModel = target.type === 'Product' ? Product : User;
    const targetObj = await TargetModel.findById(target.id).session(session);
    if (!targetObj) return res.status(404).json({ message: `${target.type} not found! 😢`, type: 'error' });

    const review = new Review({
      target: { type: target.type, id: target.id },
      reviewer: req.user._id,
      rating,
      comment,
    });

    await session.withTransaction(async () => {
      const savedReview = await review.save({ session });

      await User.findByIdAndUpdate(req.user._id, { $push: { comments: review._id } }, { session });

      await TargetModel.findByIdAndUpdate(
        target.id,
        {
          $push: { reviews: review._id },
          $inc: { numReviews: 1 },
          $set: {
            rating: (targetObj.rating * targetObj.numReviews + rating) / (targetObj.numReviews + 1),
          },
        },
        { session, new: true }
      );

      res.status(201).json({
        message: 'Review added successfully! 👍',
        type: 'success',
        review: savedReview,
      });
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Internal server error! 😢', type: 'error' });
  } finally {
    session.endSession();
  }
});

// Update a review
router.put('/:id', isAuth, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { rating, comment } = req.body;
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (review.reviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to edit this review! 🔒' });
    }

    const TargetModel = review.target.type === 'Product' ? Product : User;

    session.startTransaction();
    try {
      review.rating = rating;
      review.comment = comment;
      await review.save({ session });

      await User.findByIdAndUpdate(req.user._id, { $push: { comments: review._id } }, { session });

      const targetObj = await TargetModel.findById(review.target.id).session(session);
      const reviews = await Review.find({ 'target.id': review.target.id }).session(session);
      const newRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

      targetObj.rating = newRating;
      await targetObj.save({ session });

      await session.commitTransaction();
      res.status(200).json({ message: 'Review updated successfully! 👍' });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Internal server error! 😢', type: 'error' });
  }
});

// Delete a review
router.delete('/:id', isAuth, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const review = await Review.findById(req.params.id).session(session);
      if (!review) return res.status(404).json({ message: 'Review not found' });

      if (review.reviewer.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You are not authorized to delete this review! 🔒' });
      }

      await User.findByIdAndUpdate(review.reviewer, { $pull: { comments: review._id } }).session(session);

      const TargetModel = review.target.type === 'Product' ? Product : User;
      const target = await TargetModel.findById(review.target.id).session(session);
      if (!target) throw new Error(`${review.target.type} not found! 😢`);

      target.reviews.pull(req.params.id);
      const numReviews = target.reviews.length;
      const newRating = numReviews > 0 ? (target.rating * (numReviews + 1) - review.rating) / numReviews : 0;
      target.rating = newRating;
      await target.save({ session });

      await review.deleteOne().session(session);
    });

    res.status(200).json({ message: 'Review deleted successfully! 😀' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Internal server error! 😢', type: 'error' });
  } finally {
    session.endSession();
  }
});

export default router;
