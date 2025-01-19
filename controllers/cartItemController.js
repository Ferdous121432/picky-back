const CartItem = require('../models/cartItemModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

const allowedFields = ['quantity,subtotal'];

exports.getMyCart = catchAsync(async (req, res, next) => {
  req.body.user_id = req.user.id;

  const cartItems = await CartItem.find({ user_id: req.user.id });

  if (!cartItems.length) {
    return res.status(200).json({
      status: 'success',
      message: 'No cart items found',
      results: cartItems.length,
    });
  }

  let totalPrice = 0;

  if (cartItems.length) {
    cartItems.map((cartItem) => {
      if (cartItem.image) {
        cartItem.image = `${req.protocol === 'https' ? 'https' : 'http'}://${req.get('host')}/img/products/images/${cartItem.image}`;
        // cartItem.image = `${req.protocol}://${req.get('host')}/img/products/cover-image/${cartItem.image}`;
      }
      totalPrice += cartItem.subtotal;
    });
  }

  return res.status(200).json({
    status: 'success',
    results: cartItems.length,
    data: {
      cartItems,
      totalPrice,
    },
  });
});

// check if the product is already in the cart. If it is, update the quantity and subtotal of the product. If it is not, create a new cart item.
exports.createCartItem = catchAsync(async (req, res, next) => {
  req.body.user_id = req.user.id;

  let newDoc;

  if (req.body.product_id) {
    let cartItem = await CartItem.findOne({
      user_id: req.user.id,
      product_id: req.body.product_id,
    });

    if (cartItem) {
      cartItem.quantity = req.body.quantity;
      cartItem.subtotal = cartItem.quantity * cartItem.price;
      newDoc = await CartItem.findByIdAndUpdate(cartItem._id, cartItem, {
        new: true,
        runValidators: true,
      });
    } else {
      newDoc = await CartItem.create(req.body);
    }
  }

  res.status(201).json({
    status: 'success',
    data: {
      data: newDoc,
    },
  });
});

// allowables fields are the fields that can be updated by the user
// const filterObj = (obj, allowedFields) => {
//   let newObject = {};

//   if (!allowedFields) newObject = obj;

//   if (allowedFields)
//     Object.keys(obj).forEach((el) => {
//       if (allowedFields.includes(el)) newObject[el] = obj[el];
//     });

//   return newObject;
// };

// exports.updateCartItem = () =>
//   catchAsync(async (req, res, next) => {
//     const filteredBody = filterObj(req.body, allowedFields);

//     filteredBody.updated_at = Date.now();

//     const cartItem = await CartItem.findByIdAndUpdate(
//       {
//         user_id: req.user.id,
//         product_id: req.body.product_id,
//       },
//       filteredBody,
//       {
//         new: true,
//         runValidators: true,
//       },
//     );

//     if (!cartItem) {
//       return next(new AppError('No document found with that ID', 404));
//     }

//     res.status(200).json({
//       status: 'success',
//       data: {
//         cartItem,
//       },
//     });

//     console.log(req.body);
//   });

exports.getAllCartItems = factory.getAll(CartItem);
exports.getCartItem = factory.getOne(CartItem);
// exports.createCartItem = factory.createOne(CartItem);
exports.updateCartItem = factory.updateOne(CartItem, allowedFields);
exports.deleteCartItem = factory.deleteOne(CartItem);
