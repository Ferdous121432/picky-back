const mongoose = require('mongoose');

const checkoutSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: [true, 'Checkout must have a session id.'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Cart must belong to a User!'],
  },
  currency: {
    type: String,
    required: [true, 'Checkout must have a currency.'],
  },
  total_price: {
    type: Number,
    required: [true, 'Checkout must have a total price.'],
  },

  discount: {
    type: Number,
  },
  products: [
    {
      product_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: [true, 'Cart must have at least one product!'],
      },
      product_total_price: {
        type: Number,
        required: [true, 'Checkout must have a subtotal.'],
      },
      unit_price: {
        type: Number,
        required: [true, 'Cart must have a price.'],
      },

      quantity: {
        type: Number,
        required: [true, 'Cart must have a quantity.'],
      },
      color: {
        type: String,
        // required: [true, 'Cart must have a color.'],
      },
      size: {
        type: String,
        // required: [true, 'Cart must have a size.'],
      },

      product_image: {
        type: String,
        required: [true, 'Cart must have a product image.'],
      },
    },
  ],

  deliveryAddress: {
    city: {
      type: String,
      default: null,
    },
    country: {
      type: String,
      required: [true, 'Country is required.'],
    },
    line1: {
      type: String,
      default: null,
    },
    line2: {
      type: String,
      default: null,
    },
    postal_code: {
      type: String,
      default: null,
    },
    state: {
      type: String,
      default: null,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: ['processing', 'shipped', 'delivered'],
    default: 'processing',
  },
  invoice_pdf: {
    type: String,
    default: null,
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  payment_method: {
    type: Array,
    default: null,
  },
  payment_details: {
    card_name: {
      type: String,
      default: null,
    },
    card_brand: {
      type: String,
      default: null,
    },
    card_last4: {
      type: String,
      default: null,
    },
  },
});

checkoutSchema.index({ session_id: 1 }, { unique: true });

// checkoutSchema.pre(/^find/, function (next) {
//   this.populate('user').populate({
//     path: 'tour',
//     select: 'name',
//   });
//   next();
// });

const Checkout = mongoose.model('Checkout', checkoutSchema);

module.exports = Checkout;
