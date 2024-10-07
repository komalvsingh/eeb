import { Schema, model } from 'mongoose'

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
  },
})

export default model('Category', categorySchema)
