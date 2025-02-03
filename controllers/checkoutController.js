// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const CartItem = require('../models/cartItemModel');
const Checkout = require('../models/checkoutModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const User = require('../models/userModel');

const stripe = require('stripe')(
  'sk_test_51QnyemI8jHUIhJ27luC4acJXl1DwmIuWUrySXP7aQ7JwjO7B6bNWidiDWshpp5RyImQaMOobLnVDOwQzE2NOIGPE00WbdqCFNS',
);
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// multiple or single products to checkout create
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const products = req.body;
  // console.log('Booking controller ❌❌❌❌❌ Product', products);
  const lineItems = products.map((product) => {
    const image = product.image;
    // const image = `http://localhost:3000/img/products/cover-image/${product.image.split('/')[-1]}`;
    return {
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${product.productName}`,
          images: [image],
          metadata: {
            product_id: product.product_id,
            unit_price: product.price,
            image,
            color: product.color,
            size: product.size,
          },
        },
        unit_amount: product.price * 100,
      },
      quantity: product.quantity,
    };
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `http://localhost:5173`,
    cancel_url: `http://localhost:5173`,
    customer_email: req.user.email,
    mode: 'payment',
    invoice_creation: {
      enabled: true,
      invoice_data: {
        description: 'Invoice for your purchase',
        footer: 'Thank you for your business!',
        metadata: {
          order_id: `order_${Math.random()}`,
        },
      },
    },
    // billing_address_collection: 'required',
    // metadatadd
    line_items: lineItems,
    // shipping_options: [
    //   {
    //     shipping_rate_data: {
    //       type: 'fixed_amount',
    //       fixed_amount: { amount: 1000, currency: 'usd' },
    //       display_name: 'Standard shipping',
    //       delivery_estimate: {
    //         minimum: { unit: 'business_day', value: 5 },
    //         maximum: { unit: 'business_day', value: 7 },
    //       },
    //     },
    //   },
    // ],
  });

  // console.log('Checkout controller ❌❌❌❌❌', session);

  res.status(200).json({
    status: 'success',
    session,
  });
});

// TODO: will be implemented in the future
const createProductCheckout = async (session, invoice) => {
  console.log('createProductCheckout 😁😁😁😁', session);
  const session_id = session.id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const currency = session.currency;
  const total_price = session.amount_total / 100;
  const product_id = session.line_items.data.map(
    (item) => item.price.product.metadata.product_id,
  );
  const color = session.line_items.data.map(
    (item) => item.price.product.metadata.color,
  );
  const size = session.line_items.data.map(
    (item) => item.price.product.metadata.size,
  );
  const product_total_price = session.line_items.data.map(
    (item) => item.amount_total / 100,
  );
  const unit_price = session.line_items.data.map(
    (item) => item.price.unit_amount / 100,
  );

  const quantity = session.line_items.data.map((item) => item.quantity);
  const product_image = session.line_items.data.map(
    (item) => item.price.product.metadata.image,
  );
  const payment_status = session.payment_status;
  const payment_method = session.payment_method_types;
  const invoice_pdf = invoice.invoice_pdf;

  const products = session.line_items.data.map((item, index) => ({
    product_id: product_id[index],
    product_total_price: product_total_price[index],
    unit_price: unit_price[index],
    quantity: quantity[index],
    color: color[index],
    size: size[index],
    product_image: product_image[index],
  }));

  // console.log('webhookCheckout 🚀🚀🚀🚀🚀', session);
  // console.log(
  //   'line Items 👌👌👌👌',
  //   session.line_items.data.map((item) => item.price.product.metadata),
  // );

  //FIXME: delivery address will be implemented in the future
  const deliveryAddress = {
    country: 'BD',
    city: 'N/A',
    line1: 'N/A',
    line2: 'N/A',
    state: 'N/A',
    postal_code: 'N/A',
  };

  console.log('products ⏩⏩', products);

  await CartItem.deleteMany({
    user_id: user,
  });
  console.log('😍😍😍😍', user);

  const data = await Checkout.create({
    session_id,
    currency,
    user,
    total_price,
    products,
    deliveryAddress,
    payment_status,
    payment_method,
    invoice_pdf,
  });
  console.log('😍😍😍😍', user);

  // console.log('Final checkout data after creating DB ⏩😁', data);
};

exports.webhookCheckout = async (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      'whsec_cdec2d8068ff296201aad5edc864428f4a3e8a6b64a289137adfaa0874632e28',
      // process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error(`Webhook error: ${err.message}`);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  // console.log('Event 🚀🚀🚀🚀🚀', event);

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    console.log('Checkout session completed event received');

    const session = await stripe.checkout.sessions.retrieve(
      event.data.object.id,
      { expand: ['line_items', 'line_items.data.price.product'] },
    );

    const invoice = await stripe.invoices.retrieve(session.invoice);
    console.log('Invoice 🚀🚀🚀🚀🚀', invoice);

    // Check if the session has already been processed
    const existingCheckout = await Checkout.findOne({ session_id: session.id });
    if (existingCheckout) {
      console.log('Session already processed, skipping creation');
      return res.status(200).json({ received: true });
    }

    // Fulfill the purchase
    await createProductCheckout(session, invoice);
  }

  res.status(200).json({ received: true });
};

exports.createBooking = factory.createOne(Checkout);
exports.getBooking = factory.getOne(Checkout);
exports.getAllBookings = factory.getAll(Checkout);
exports.updateBooking = factory.updateOne(Checkout);
exports.deleteBooking = factory.deleteOne(Checkout);

exports.GetMyOrders = catchAsync(async (req, res, next) => {
  req.query.user = req.user.id;
  let query = Checkout.find(req.query);
  console.log(req.query);
  const doc = await query;

  if (!doc) {
    return next(new AppError('No orders found for this user', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      orders: doc,
    },
  });
});
