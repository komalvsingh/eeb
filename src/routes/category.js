import express from 'express';
import Category from '../models/category.js';
import logger from '../utils/logger.js';
import isAuth  from '../utils/isAuth.js';

const router = express.Router();

// Create a new category
router.post('/', isAuth, async (req, res) => {
  try {
    const { name, description, image } = req.body;

    const category = new Category({ name, description, image });
    await category.save();

    res.status(201).json({
      message: 'Category created successfully! 👍',
      category,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Error creating category! 😕', type: 'error', error });
  }
});

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();

    res.status(200).json(categories);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Something went wrong! 😕', type: 'error', error });
  }
});

// Get a single category by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) return res.status(404).json({ message: 'Category not found! 😢', type: 'error' });

    res.status(200).json({ category });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Something went wrong! 😕', type: 'error', error });
  }
});

// Update a category by id
router.patch('/:id', isAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await Category.findByIdAndUpdate(id, { name, description }, { new: true });

    if (!category) return res.status(404).json({ message: 'Category not found! 😢', type: 'error' });

    res.status(200).json({
      message: 'Category updated successfully! 👍',
      category,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Error updating category! 😕', type: 'error', error });
  }
});

// Delete a category by id
router.delete('/:id', isAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);

    if (!category) return res.status(404).json({ message: 'Category not found! 😢', type: 'error' });

    res.status(200).json({
      message: 'Category deleted successfully! 👍',
      category,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Something went wrong! 😕', type: 'error', error });
  }
});

export default router;
