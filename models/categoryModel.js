const mongoose = require('mongoose');
const slugify = require('slugify');
const { trim } = require('validator');

const categorySchema = new mongoose.Schema({
  slug: String,
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
  },
  category_code: {
    type: String,
    required: [true, 'Category code is required'],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  deleted_at: {
    type: Date,
  },
});

categorySchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true, strict: true, unique: true });
  next();
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
