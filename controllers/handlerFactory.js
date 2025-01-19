const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const slugify = require('slugify');

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //To allow for nested GET reviews on tour (hack)
    let filter = {};
    //
    // if (req.params.tourID) filter = { tour: req.params.tourID };
    //EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .pagination();
    const doc = await features.query;

    // Set imageCover directory if imageCover exists in the document and the document is an array
    if (doc.length) {
      doc.map((item) => {
        if (item.imageCover) {
          item.imageCover = `${req.protocol}://${req.get('host')}/img/products/cover-image/${item.imageCover}`;
        }
        if (item.images) {
          item.images = item.images
            .filter((image) => image) // Filter out undefined images
            .map((image) => {
              return `${req.protocol}://${req.get('host')}/img/products/images/${image}`;
            });
        }
      });
    }

    const totalProducts = await Model.countDocuments();

    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      totalLength: doc.length,
      length: doc.length,
      totalProducts: totalProducts,
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findOne({ slug: req.params.slug }); // TODO: id-> slug

    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    // Set imageCover directory if imageCover exists in the document

    if (doc.avatar) {
      doc.avatar = `${req.protocol}://${req.get('host')}/img/users/${
        doc.avatar
      }`;
    }

    if (doc.imageCover) {
      doc.imageCover = `${req.protocol}://${req.get('host')}/img/products/cover-image/${doc.imageCover}`;
    }

    if (doc.images) {
      doc.images = doc.images.map((image) => {
        return `${req.protocol}://${req.get('host')}/img/products/images/${image}`;
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // req.body.user_id = req.user.id;
    //TODO: Remove this line after implementing authentication and authorization
    const user_id = Math.floor(Math.random() * 1000000);

    const newDoc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: newDoc,
      },
    });
  });

// allowables fields are the fields that can be updated by the user
const filterObj = (obj, allowedFields) => {
  let newObject = {};

  if (!allowedFields) newObject = obj;

  if (allowedFields)
    Object.keys(obj).forEach((el) => {
      if (allowedFields.includes(el)) newObject[el] = obj[el];
    });

  return newObject;
};

exports.updateOne = (Model, allowedFields) =>
  catchAsync(async (req, res, next) => {
    const filteredBody = filterObj(req.body, allowedFields);

    // Auto slugify if name is present in the allowed fields
    if (filteredBody.name && filteredBody.product_code) {
      filteredBody.slug = slugify(
        `${filteredBody.name}-${filteredBody.product_code}`,
        {
          lower: true,
        },
      );
    }

    filteredBody.updated_at = Date.now();

    const doc = await Model.findOneAndUpdate(
      { slug: req.params.slug },
      filteredBody,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });

    console.log(req.body);
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findOneAndDelete({ slug: req.params.slug });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
