import { Router } from 'express'
const router = Router()
import Wishlist from '../models/wishlist.js'
import isAuth from '../utils/isAuth.js'
import logger from '../utils/logger.js'

// Obtener todas las listas de deseos de un usuario
router.get('/', isAuth, async (req, res) => {
  try {
    const wishlists = await Wishlist.find({ user: req.user._id }).populate({
      path: 'products',
      select: '_id name image price',
      model: 'Product',
    })
    res.json(wishlists)
  } catch (error) {
    logger.error(error)
    res.status(500).json({
      message: '¡Error interno del servidor! 😢',
      type: 'error',
    })
  }
})

// Crear una nueva lista de deseos
router.post('/', isAuth, async (req, res) => {
  const { name, description } = req.body
  try {
    const wishlist = new Wishlist({
      user: req.user._id,
      name: name,
      description: description,
    })
    const savedWishlist = await wishlist.save()
    res.json(savedWishlist)
  } catch (error) {
    logger.error(error)
    res.status(500).json({
      message: '¡Error interno del servidor! 😢',
      type: 'error',
    })
  }
})

// Agregar un producto a una lista de deseos
router.post('/:id/products', isAuth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate({
      path: 'products',
      select: '_id name image price',
      model: 'Product',
    })
    if (!wishlist) {
      return res.status(404).json({
        message: '¡La lista de deseos no existe! 😢',
        type: 'error',
      })
    }
    wishlist.products.push(req.body.productId)
    const updatedWishlist = await wishlist.save()
    res.json(updatedWishlist)
  } catch (error) {
    logger.error(error)
    res.status(500).json({
      message: '¡Error interno del servidor! 😢',
      type: 'error',
    })
  }
})

// Eliminar un producto de una lista de deseos
router.delete('/:id/products/:productId', isAuth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate({
      path: 'products',
      select: '_id name image price',
      model: 'Product',
    })
    if (!wishlist) {
      return res.status(404).json({
        message: '¡La lista de deseos no existe! 😢',
        type: 'error',
      })
    }
    wishlist.products.pull(req.params.productId)
    const updatedWishlist = await wishlist.save()
    res.json(updatedWishlist)
  } catch (error) {
    logger.error(error)
    res.status(500).json({
      message: '¡Error interno del servidor! 😢',
      type: 'error',
    })
  }
})

// Eliminar una lista de deseos
router.delete('/:id', isAuth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
    if (!wishlist) {
      return res.status(404).json({
        message: '¡La lista de deseos no existe! 😢',
        type: 'error',
      })
    }
    await wishlist.deleteOne()
    res.json({
      message: '¡Lista de deseos eliminada con éxito! 🎉',
      type: 'success',
    })
  } catch (error) {
    logger.error(error)
    res.status(500).json({
      message: '¡Error interno del servidor! 😢',
      type: 'error',
    })
  }
})

export default router
