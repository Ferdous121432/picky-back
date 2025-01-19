const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const Address = require('../models/addressModel');

exports.getUserAllAddress = catchAsync(async (req, res, next) => {
  if (!req.user.id) {
    return next(new AppError('You are not logged in', 401));
  }
  const addresses = await Address.find({ userID: req.user.id });

  res.status(200).json({
    status: 'success',
    results: addresses.length,
    data: {
      addresses,
    },
  });
});

const allowedFields = [
  'title',
  'address_line_1',
  'address_line_2',
  'country',
  'city',
  'postal_code',
  'landmark',
  'phone_number',
];

exports.createAddress = factory.createOne(Address);
exports.getAddress = factory.getOne(Address);
exports.getAllAddreses = factory.getAll(Address);
exports.updateAddress = factory.updateOne(Address, allowedFields);
exports.deleteAddress = factory.deleteOne(Address);
