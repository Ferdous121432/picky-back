//TODO: get top products, get products stats, get monthly product plan
const path = require('path');
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');

// MULTER CONFIGURATION
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadProductImages = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 4,
  },
]);

// upload.single('image') req.file
// upload.array('images', 5) req.files
// upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images', maxCount: 3 }]) req.files

exports.resizeProductCoverImage = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover && !req.files.images) return next();
  // const user_id = req.user.id;
  const user_id = Math.floor(Math.random() * 1000000);

  // 1) Cover Image
  if (req.files.imageCover) {
    //TODO: get user id from req.user
    req.body.imageCover = `product-${user_id}-${Date.now()}-cover-image.jpeg`;

    await sharp(req.files.imageCover[0].buffer)
      .resize(400, 500)
      .toFormat('jpeg')
      .jpeg({
        quality: 90,
      })
      .toFile(`public/img/products/cover-image/${req.body.imageCover}`);
  }

  // 2) Images
  if (req.files.images) {
    req.body.images = [];

    await Promise.all(
      req.files.images.map(async (file, i) => {
        const filename = `product-${user_id}-${Date.now()}-${i + 1}.jpeg`;

        await sharp(file.buffer)
          .resize(1600, 2000)
          .toFormat('jpeg')
          .jpeg({
            quality: 80,
          })
          .toFile(`public/img/products/images/${filename}`);

        req.body.images.push(filename);
      }),
    );
  }

  console.log(req.body);
  next();
});

// CHECK  IF BODY CONTAINS NAME, IMAGECOVER, CATAGORY_ID
exports.checkBody = (req, res, next) => {
  console.log('Check Body');
  if (!req.body.name || !req.body.imageCover) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing name or imageCover or catagory_id',
    });
  }

  next();
};

exports.getProductsByCategory = catchAsync(async (req, res, next) => {
  const categorySlug = req.params.slug;

  if (!categorySlug) {
    return next(new AppError('Please provide a category ID', 400));
  }

  const category = await Category.findOne({ slug: categorySlug });
  const category_id = category._id;
  console.log(category_id);

  const products = await new APIFeatures(
    Product.find({ categories: category_id }),
    req.query,
  )
    .filter()
    .sort()
    .limitFields()
    .pagination().query;

  // const products = await Product.find({ categories: category_id });

  if (!products.length) {
    // return next(new AppError('No products found for this category', 404));
    return res.status(200).json({
      status: 'success',
      message: `No products found for ${categorySlug} category,`,
    });
  }

  // Set imageCover directory if imageCover exists in the document and the document is an array
  if (products.length) {
    products.map((product) => {
      if (product.images) {
        product.images = product.images.map((image) => {
          return `${req.protocol}://${req.get('host')}/img/products/images/${image}`;
          // .replace(
          //   'http:',
          //   'https:',
          // );
        });
      }
      if (product.imageCover) {
        product.imageCover = `${req.protocol}://${req.get('host')}/img/products/cover-image/${product.imageCover}`;
        // .replace(
        //   'http:',
        //   'https:',
        // );
      }
    });
  }
  const totalProducts = await Product.countDocuments();
  const pageNumbers = Math.ceil(totalProducts / req.query.limit);
  const currentPage = req.query.page * 1 || 1;

  res.status(200).json({
    status: 'success',
    totalLength: totalProducts,
    pageNumbers,
    currentPage,
    results: products.length,
    data: {
      products,
    },
  });
});

// exports.aliasTopTours = (req, res, next) => {
//   req.query.limit = '5';
//   req.query.sort = '-ratingsAverage,price';
//   req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

//   next();
// };

exports.getAllProducts = Factory.getAll(Product);
exports.getProduct = Factory.getOne(Product);
exports.createProduct = Factory.createOne(Product);
exports.updateProduct = Factory.updateOne(Product);
exports.deleteProduct = Factory.deleteOne(Product);

// exports.getTourStats = catchAsync(async (req, res, next) => {
//   const stats = await Tour.aggregate([
//     {
//       $match: {
//         ratingsAverage: {
//           $gte: 4.5,
//         },
//       },
//     },
//     {
//       $group: {
//         _id: {
//           $toUpper: '$difficulty',
//         },
//         // _id: '$ratingsAverage',
//         // _id: '$price',
//         numTours: {
//           $sum: 1,
//         },
//         numRatings: {
//           $sum: '$ratingsQuantity',
//         },
//         avgRating: {
//           $avg: '$ratingsAverage',
//         },
//         avgPrice: {
//           $avg: '$price',
//         },
//         minPrice: {
//           $min: '$price',
//         },
//         maxPrice: {
//           $max: '$price',
//         },
//       },
//     },
//     {
//       $sort: {
//         avgPrice: -1,
//       },
//     },
//     // {
//     //   $match: {
//     //     _id: {
//     //       $ne: 'EASY',
//     //     },
//     //   },
//     // },
//   ]);
//   res.status(200).json({
//     status: 'success',
//     data: {
//       stats,
//     },
//   });
// });

// exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
//   const year = req.params.year * 1;

//   const plan = await Tour.aggregate([
//     {
//       $unwind: '$startDates',
//     },
//     {
//       $match: {
//         startDates: {
//           $gte: new Date(`${year}-01-01`),
//           $lte: new Date(`${year}-12-31`),
//         },
//       },
//     },
//     {
//       $group: {
//         _id: { $month: '$startDates' },
//         numTourStarts: { $sum: 1 },
//         tours: { $push: '$name' },
//         price: { $sum: '$price' },
//       },
//     },
//     {
//       $addFields: {
//         month: '$_id',
//         year: year,
//       },
//     },
//     {
//       $project: {
//         _id: 0,
//       },
//     },
//     {
//       $sort: {
//         _id: 1,
//       },
//     },
//     {
//       $limit: 12,
//     },
//   ]);
//   res.status(200).json({
//     status: 'success',
//     data: {
//       plan,
//     },
//   });
// });

// exports.getToursWithin = catchAsync(async (req, res, next) => {
//   const { distance, latlng, unit } = req.params;
//   const [lat, lng] = latlng.split(',');

//   if (!lat || !lng) {
//     return next(
//       new AppError(
//         'Please provide latitude and longitude in the format lat,lng',
//         400,
//       ),
//     );
//   }

//   console.log(distance, lat, lng);

//   // Radius of the Earth in miles and kilometers
//   const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

//   const tours = await Tour.find({
//     startLocation: {
//       $geoWithin: {
//         $centerSphere: [[lng, lat], radius],
//       },
//     },
//   });

//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: {
//       data: tours,
//     },
//   });
// });

// exports.getDistances = catchAsync(async (req, res, next) => {
//   const { latlng, unit } = req.params;
//   const [lat, lng] = latlng.split(',');

//   if (!lat || !lng) {
//     return next(
//       new AppError(
//         'Please provide latitude and longitude in the format lat,lng',
//         400,
//       ),
//     );
//   }

//   const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

//   const distances = await Tour.aggregate([
//     {
//       $geoNear: {
//         near: {
//           type: 'Point',
//           coordinates: [lng * 1, lat * 1],
//         },
//         distanceField: 'distance',
//         distanceMultiplier: multiplier,
//       },
//     },
//     {
//       $project: {
//         distance: 1,
//         name: 1,
//       },
//     },
//   ]);

//   res.status(200).json({
//     status: 'success',
//     data: {
//       data: distances,
//     },
//   });
// });
