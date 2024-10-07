import { Router } from 'express';
const router = Router();
import isAuth from '../utils/isAuth.js'; // Ensure you use .js extension
// const { isAuth } = isAuth;
import Review from '../models/review.js'; // Ensure you use .js extension
import Product from '../models/product.js'; // Ensure you use .js extension
import User from '../models/user.js'; // Ensure you use .js extension

// Obtener todos los usuarios
router.get('/', async (req, res) => {
  try {
    const users = await User.find({});
    return res.status(200).json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: '¡Error interno del servidor! 😢',
      type: 'error',
    });
  }
});

// Definir ruta para obtener la información del perfil del usuario
router.get('/me', isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('wishlist')
      .populate({
        path: 'reviews',
        populate: {
          path: 'reviewer',
          select: '_id name profileImage',
          model: 'User',
        },
      })
      .exec();
    
    // Si no se encuentra al usuario, devuelve un error 404
    if (!user) {
      return res.status(404).json({
        message: '¡El usuario no existe! 😕',
        type: 'error',
      });
    }

    // Si se encuentra al usuario, devuelve el objeto del usuario
    res.status(200).json(user);
  } catch (error) {
    // Si hay un error, devuelve un error 500
    console.log(error);
    res.status(500).json({
      message: '¡Error interno del servidor! 😢',
      type: 'error',
    });
  }
});

// Definir ruta para actualizar la información del perfil del usuario
router.put('/me', isAuth, async (req, res) => {
  try {
    const user = req.user;
    // Si no se encuentra al usuario, devuelve un error 404
    if (!user) {
      return res.status(404).json({
        message: '¡El usuario no existe! 😕',
        type: 'error',
      });
    }

    const updates = req.body;
    Object.assign(user, updates);
    // Guardar el objeto del usuario actualizado en la base de datos
    await user.save();

    // Devuelve un mensaje de éxito y el objeto del usuario actualizado
    res.status(200).json({
      message: '¡Perfil actualizado con éxito! 🎉',
      user,
    });
  } catch (error) {
    // Si hay un error, devuelve un error 500
    console.log(error);
    res.status(500).json({
      message: '¡Error interno del servidor! 😢',
      type: 'error',
    });
  }
});

// Obtener detalles del perfil del usuario
router.get('/:id', isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate({
      path: 'reviews',
      populate: {
        path: 'reviewer',
        select: '_id name profileImage',
        model: 'User',
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener reseñas dadas al usuario
router.get('/:id/reviews', isAuth, async (req, res) => {
  try {
    const reviews = await Review.find({
      'target.id': req.params.id,
      'target.type': 'User',
    })
      .populate('reviewer', '_id name profileImage')
      .sort({ createdAt: -1 });

    console.log({ reviews });

    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener productos listados por el usuario
router.get('/:id/products', async (req, res) => {
  try {
    const products = await Product.find({ seller: req.params.id })
      .select('_id name image category price createdAt')
      .populate('category');

    console.log({ products });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default router;
