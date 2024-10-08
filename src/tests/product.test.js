import request from 'supertest'
import app from '../app'
import Product, { deleteMany, insertMany, findOne, findById, prototype } from '../models/product'
import User, { deleteMany as _deleteMany } from '../models/user'
import { hash } from 'bcryptjs'
import { Types } from 'mongoose'

describe('Product API', () => {
  let token, tempUser

  // Define a beforeAll hook to connect to the database and set up test data
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

    // Insert some test products into the database
    await insertMany([
      {
        name: 'iPhone X',
        price: 799,
        description: 'A large phone with one of the best screens',
        seller: tempUser._id,
        category: new Types.ObjectId().toHexString(),
        popularity: 100,
        image: 'https://source.unsplash.com/random/?iphone',
        media: [
          'https://source.unsplash.com/random/?iphone',
          'https://source.unsplash.com/random/?iphone',
        ],
      },
      {
        name: 'Samsung Galaxy S9',
        price: 699,
        description: 'A great phone with one of the best cameras',
        seller: tempUser._id,
        category: new Types.ObjectId().toHexString(),
        popularity: 50,
        image: 'https://source.unsplash.com/random/?samsunggalaxy',
        media: [
          'https://source.unsplash.com/random/?samsunggalaxy',
          'https://source.unsplash.com/random/?samsunggalaxy',
        ],
      },
      {
        name: 'Google Pixel 2',
        price: 649,
        description: 'Good phone with native android features',
        seller: tempUser._id,
        category: new Types.ObjectId().toHexString(),
        popularity: 75,
        image: 'https://source.unsplash.com/random/?pixel6',
        media: [
          'https://source.unsplash.com/random/?pixel6',
          'https://source.unsplash.com/random/?pixel6',
        ],
      },
      {
        name: 'HP Spectre x360',
        price: 199,
        description: 'A great laptop that is also a tablet',
        seller: tempUser._id,
        category: new Types.ObjectId().toHexString(),
        popularity: 0,
        image: 'https://source.unsplash.com/random/?hplaptop',
        media: [
          'https://source.unsplash.com/random/?hplaptop',
          'https://source.unsplash.com/random/?hplaptop',
        ],
      },
      {
        name: 'Harry Potter book',
        price: 200,
        description: 'A great book for kids',
        seller: tempUser._id,
        category: new Types.ObjectId().toHexString(),
        popularity: 2500,
        image: 'https://source.unsplash.com/random/?harrypotter',
        media: [
          'https://source.unsplash.com/random/?harrypotter',
          'https://source.unsplash.com/random/?harrypotter',
        ],
      },
    ])
  }, 20000)

  afterAll(async () => {
    await _deleteMany({})
    await deleteMany({})
  }, 20000)

  describe('GET /products', () => {
    test('should return a list of products', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${token}`)
      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(5)
    })

    test('should return a list of products sorted popularity', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .query({ sort: '-popularity' })
      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(5)
      expect(response.body.data[0].name).toBe('Harry Potter book')
      expect(response.body.data[1].name).toBe('iPhone X')
      expect(response.body.data[4].name).toBe('HP Spectre x360')
    })

    test("should return a list of products matching 'phone'", async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 2, search: 'phone', sort: '-price' })
      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.data[0].name).toBe('iPhone X')
      expect(response.body.data[1].name).toBe('Samsung Galaxy S9')
    })

    test('should return an empty list if no products match the search query', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .query({ search: 'foo' })

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(0)
    })

    test('should return a 401 error if not authenticated', async () => {
      const response = await request(app).get('/api/products')

      expect(response.status).toBe(401)
      expect(response.body.message).toBeDefined()
    })
  })

  describe('GET /products/:productId', () => {
    let productId
    beforeAll(async () => {
      // Get product ID
      const product = await findOne({ name: 'iPhone X' })
      productId = product._id
    })

    test('returns a product with a valid ID', async () => {
      const response = await request(app)
        .get(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body._id).toEqual(productId.toString())
      expect(response.body.name).toEqual('iPhone X')
      expect(response.body.category).not.toBeUndefined()
    })

    test('returns a 404 error for invalid product ID', async () => {
      const response = await request(app)
        .get(`/api/products/${new Types.ObjectId()}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)

      expect(response.body.message).toEqual('Product not found! 😢')
      expect(response.body.type).toEqual('error')
    })

    test('returns a 401 error for unauthenticated user', async () => {
      const response = await request(app).get(`/api/products/${productId}`).expect(401)

      expect(response.body.message).toEqual('No token! 🤔')
      expect(response.body.type).toEqual('error')
    })

    test('should return a 500 error when there is a server error', async () => {
      jest.spyOn(Product, 'findById').mockImplementationOnce(() => {
        throw new Error('Server error')
      })

      const response = await request(app)
        .get(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(500)

      expect(response.body.message).toEqual('Error fetching product! 😢')
      // Product.findById.mockRestore()
    })
  })

  describe('POST /products', () => {
    const product = {
      name: 'Test Product',
      description: 'Test Description',
      price: 999,
      category: new Types.ObjectId().toHexString(),
      seller: new Types.ObjectId().toHexString(),
      image: 'https://source.unsplash.com/random/?testproduct',
      media: [
        'https://source.unsplash.com/random/?testproduct',
        'https://source.unsplash.com/random/?testproduct',
      ],
    }

    test('should add a new product', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send(product)
        .expect(201)

      expect(response.body.type).toBe('success')
      expect(response.body.message).toBe('Product added successfully! 🎉')
      expect(response.body.product).toBeDefined()
      expect(response.body.product).toHaveProperty('name', 'Test Product')

      const savedProduct = await findById(response.body.product._id)
      expect(savedProduct).toHaveProperty('name', 'Test Product')
    })

    test('should return an error if the product cannot be added', async () => {
      jest.spyOn(prototype, 'save').mockRejectedValue(new Error('Test Error'))

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send(product)
        .expect(500)

      expect(response.body.type).toBe('error')
      expect(response.body.message).toBe('Error adding product! 😢')
      expect(response.body.error).toBeDefined()
      prototype.save.mockRestore()
    })

    test('should return an error if the product missing required values', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Test Description',
          price: 999,
          image: 'https://source.unsplash.com/random/?testproduct',
          media: [
            'https://source.unsplash.com/random/?testproduct',
            'https://source.unsplash.com/random/?testproduct',
          ],
        })
        .expect(500)

      expect(response.body.type).toBe('error')
      expect(response.body.message).toBe('Error adding product! 😢')
      expect(response.body.error).toBeDefined()
    })

    test('should return 401 if user is not authenticated', async () => {
      const response = await request(app).post('/api/products').send(product).expect(401)

      expect(response.body.message).toEqual('No token! 🤔')
      expect(response.body.type).toEqual('error')
    })
  })

  describe('PUT /products', () => {
    let productId, token2
    beforeAll(async () => {
      // Get product ID
      const product = await findOne({ name: 'iPhone X' })
      productId = product._id
    })

    test('should return 404 if product does not exist', async () => {
      const id = new Types.ObjectId().toHexString()
      const response = await request(app)
        .put(`/api/products/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'iPhone XS',
          price: 899,
        })

      expect(response.status).toBe(404)
      expect(response.body).toEqual({
        message: 'Product not found! 😢',
        type: 'error',
      })
    })

    test('should return 401 if user is not the creator of the product', async () => {
      const tempUser2 = new User({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: await hash('password123', 12),
        phoneNumber: '12345678620',
      })

      await tempUser2.save()

      const user = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane.doe@example.com',
          password: 'password123',
        })
        .expect(200)

      token2 = user.body.accessToken

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({
          name: 'iPhone XS',
          price: 899,
          description: 'A larger phone with one of the best screens',
        })
        .expect(401)

      expect(response.body.message).toEqual('You are not authorized to perform this action! 🔒')
      expect(response.body.type).toBe('error')
    })

    test('should return 200 if product is updated successfully', async () => {
      const updates = { name: 'Updated Product Name' }
      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updates)

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Product updated successfully 🎉')
      expect(response.body.type).toBe('success')
      expect(response.body.product.name).toBe('Updated Product Name')
    })

    test('should return 401 if user is not authenticated', async () => {
      const updates = { name: 'Updated Product Name' }

      const response = await request(app).put(`/api/products/${productId}`).send(updates)

      expect(response.status).toBe(401)
      expect(response.body.type).toBe('error')
      expect(response.body.message).toBe('No token! 🤔')
    })
  })

  describe('DELETE /products/:id', () => {
    let token2, productId, product

    beforeAll(async () => {
      const tempProduct = new Product({
        name: 'Macbook Air',
        price: 999,
        description: 'A thin and light laptop',
        seller: tempUser._id,
        category: new Types.ObjectId().toHexString(),
        popularity: 50,
        image: 'https://source.unsplash.com/random/?macbookair',
        media: [
          'https://source.unsplash.com/random/?macbookair',
          'https://source.unsplash.com/random/?macbookair',
        ],
      })

      await tempProduct.save()
      productId = tempProduct._id

      product = await findById(productId)
    })

    test("should return a 404 error if the product doesn't exist", async () => {
      const invalidProductId = new Types.ObjectId().toHexString()

      const response = await request(app)
        .delete(`/api/products/${invalidProductId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)

      expect(response.body.message).toBe("Product doesn't exist! 😢")
      expect(response.body.type).toBe('error')
    })

    test('should return a 401 error if the user is not authorized to delete the product', async () => {
      const tempUser2 = new User({
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: await hash('password123', 12),
        phoneNumber: '12345678920',
      })

      await tempUser2.save()

      const user = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'password123',
        })
        .expect(200)

      token2 = user.body.accessToken

      const response = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(401)

      expect(response.body.message).toBe("You're not authorized to delete this product! 🔒")
      expect(response.body.type).toBe('error')
    })

    test('should delete a product successfully', async () => {
      await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      const deletedProduct = await findById(productId)

      expect(deletedProduct).toBeFalsy()
    })
  })
})
