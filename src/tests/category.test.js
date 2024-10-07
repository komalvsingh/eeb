import request from 'supertest'
import app from '../app'
import Category, { deleteMany, find, findById } from '../models/category'
import User, { deleteMany as _deleteMany } from '../models/user'
import { hash } from 'bcryptjs'
import { Types } from 'mongoose'

describe('Categories API', () => {
  let tempUser, token, category
  beforeAll(async () => {
    await deleteMany({})
    await _deleteMany({})

    tempUser = new User({
      name: 'Giridhar',
      email: 'talla_11915139@nitkkr.ac.in',
      password: await hash('password123', 12),
      phoneNumber: '1234567890',
    })

    await tempUser.save()

    const user = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'talla_11915139@nitkkr.ac.in',
        password: 'password123',
      })
      .expect(200)

    token = user.body.accessToken

    // Create a test category to be deleted
    category = new Category({
      name: 'Mobiles',
      description: 'Mobiles category',
      image: 'https://source.unsplash.com/random/?phone',
    })
    await category.save()
  }, 50000)

  afterAll(async () => {
    await _deleteMany({})
    await deleteMany({})
  })

  describe('POST /api/categories', () => {
    test('should create a new category', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Electronics',
          description: 'Electronics category',
          image: 'https://source.unsplash.com/random/?electronics',
        })
      expect(response.status).toBe(201)
      expect(response.body.category).toMatchObject({
        name: 'Electronics',
        description: 'Electronics category',
        image: 'https://source.unsplash.com/random/?electronics',
      })
    })

    test('should return an error if name is missing', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Electronics category' })
      expect(response.status).toBe(500)
      expect(response.body.message).toBe('Error creating category! 😕')
    })
  })

  describe('GET /api/categories', () => {
    test('should return a list of categories', async () => {
      const response = await request(app).get('/api/categories')
      expect(response.status).toBe(200)
      expect(response.body.categories.length).toBeGreaterThan(0)
    })
  })

  describe('GET /api/categories/:id', () => {
    test('should return a single category by id', async () => {
      const categories = await find()
      const category = categories[0]
      const response = await request(app).get(`/api/categories/${category._id}`)
      expect(response.status).toBe(200)
      expect(response.body.category).toMatchObject({
        name: category.name,
        description: category.description,
      })
    })

    test('should return an error if category is not found', async () => {
      const response = await request(app).get(
        `/api/categories/${new Types.ObjectId().toHexString()}`
      )
      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Category not found! 😢')
    })
  })

  describe('PATCH /api/categories/:id', () => {
    test('should update a category by id', async () => {
      const categories = await find()
      const category = categories[0]
      const response = await request(app)
        .patch(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Category', description: 'New description' })
      expect(response.status).toBe(200)
      expect(response.body.category).toMatchObject({
        name: 'New Category',
        description: 'New description',
      })
    })

    test('should return an error if category is not found', async () => {
      const response = await request(app)
        .patch(`/api/categories/${new Types.ObjectId().toHexString()}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Category', description: 'New description' })
      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Category not found! 😢')
    })
  })

  describe('DELETE /api/categories/:id', () => {
    test('should delete a category', async () => {
      const response = await request(app)
        .delete(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Category deleted successfully! 👍')
      expect(response.body.category._id).toEqual(category._id.toString())

      // Verify that the category was deleted from the database
      const deletedCategory = await findById(category._id)
      expect(deletedCategory).toBeNull()
    })

    test('should return 404 if category not found', async () => {
      const nonExistentCategoryId = '6048c74eae6d484b643e8262' // Random ID that does not exist

      const response = await request(app)
        .delete(`/api/categories/${nonExistentCategoryId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Category not found! 😢')
    })

    test('should return 401 if user is not authenticated', async () => {
      const response = await request(app).delete(`/api/categories/${category._id}`)

      expect(response.status).toBe(401)
      expect(response.body.message).toBe('No token! 🤔')
    })
  })
})
