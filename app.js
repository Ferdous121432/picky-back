const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const userRouter = require('./routes/userRoutes');
const addressRouter = require('./routes/addressRoutes');
const productRouter = require('./routes/productRoutes');
const categoryRouter = require('./routes/categoryRoutes');
const cartItemRouter = require('./routes/cartItemRoutes');
const wishListRouter = require('./routes/wishListRoutes');
const checkoutRouter = require('./routes/checkoutRoutes');
const checkoutController = require('./controllers/checkoutController');

// Atlas connection string
dotenv.config({ path: './config.env' });
const DB = process.env.MONGO_URI.replace(
  '<db_password>',
  process.env.MONGO_PASSWORD,
);

//DB connection
mongoose
  .connect(DB, {
    dbName: 'PIcky',
  })
  .then(() => {
    console.log('DB connection successful!');
  });

// Start express app
const app = express();

const corsOptions = {
  origin: 'allow',
  // origin: 'https://shopperoo-frontend.vercel.app',
  // origin: 'http://localhost:5173',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  modules: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Allow credentials (cookies, etc.)
};

// app.use(cors(corsOptions));

// Load environment variables
// dotenv.config({ path: './config.env' });

// app.set('trust proxy', true);
app.set('trust proxy', 1);

// Set Cross-Origin-Resource-Policy header
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS'); // Allow specific methods
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Allow specific headers
  next();
});

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Handle favicon requests
app.get('/favicon.ico', (req, res) => res.status(204));

// Set the view engine to 'pug'
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
// Error handling for static files
app.use((err, req, res, next) => {
  if (err) {
    console.error('Error serving static files:', err);
    res.status(500).send('Internal Server Error');
  } else {
    next();
  }
});

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Apply rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
});

app.use('/api', limiter);

app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  checkoutController.webhookCheckout,
);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10000kb' }));
app.use(express.urlencoded({ extended: true, limit: '10000kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
// app.use(
//   hpp({
//     whitelist: [
//       'duration',
//       'ratingsQuantity',
//       'ratingsAverage',
//       'maxGroupSize',
//       'difficulty',
//       'price',
//     ],
//   }),
// );

// Test route for varsel check
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Varsel check route is working!',
  });
});

// Stripe webhook, BEFORE body-parser, because stripe needs the body as stream
// app.post(
//   '/webhook-checkout',
//   express.raw({ type: 'application/json' }),
//   checkoutController.webhookCheckout,
// );

// 3) ROUTES
app.use('/api/v1/users', userRouter);
app.use('/api/v1/addresses', addressRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/cartItems', cartItemRouter);
app.use('/api/v1/wishLists', wishListRouter);
app.use('/api/v1/checkout', checkoutRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
