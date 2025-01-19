const mongoose = require('mongoose');
const slugify = require('slugify');
const { trim } = require('validator');

const productSchema = new mongoose.Schema({
  slug: {
    type: String,
    unique: true,
  },
  name: {
    type: String,
    required: [true, 'A product must have a name'],
  },
  product_code: {
    type: String,
    required: [true, 'A product must have a product code'],
    unique: true,
    trim: true,
  },
  price: {
    type: Number,
    default: 300,
    required: [true, 'A product must have a price'],
  },
  old_price: {
    type: Number,
    default: 700,
  },
  description: {
    type: String,
    required: [true, 'A product must have a description'],
  },
  details: {
    type: String,
    required: [true, 'A product must have a summary'],
  },
  materials: {
    type: Array,
    required: [true, 'A product must have a summary'],
  },
  imageCover: {
    type: String,
    // required: [true, 'A product must have a cover image'],
  },
  images: {
    type: [String],
    required: [true, 'A product must have images'],
  },
  color: {
    type: String,
    required: [true, 'A product must have a color'],
    default: 'black',
  },
  product_spec: [
    {
      key: {
        type: String,
        // required: [true, 'A product specification must have a key'],
      },
      value: {
        type: String,
        // required: [true, 'A product specification must have a value'],
      },
    },
  ],
  categories: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      default: 'all',
    },
  ],
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

// Document middleware: runs before .save() and .create()
productSchema.pre('save', function (next) {
  this.slug = slugify(`${this.name}-${this.product_code}`, {
    lower: true,
  });
  next();
});

// Query middleware to populate category field
productSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'categories',
    select: '-__v',
  });
  next();
});
const Product = mongoose.model('Product', productSchema);

module.exports = Product;
