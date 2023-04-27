const Tours = require('../models/tourmodels');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.gettourstats = catchAsync(async (req, res, next) => {
  const stats = await Tours.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);
  res.status(200).json({
    status: 'succes',
    data: {
      stats,
    },
  });
});

exports.addtour = factory.createOne(Tours);
exports.getmonthlyplans = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tours.aggregate([
    { $unwind: '$startDates' },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        count: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 1,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});
exports.top5alias = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  next();
};
exports.getalltours = factory.getAll(Tours);
exports.gettour = factory.getOne(Tours, { path: 'reviews' });
exports.updatetour = factory.updateOne(Tours);
exports.deletetour = factory.deleteOne(Tours);
exports.getTourWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    next(new AppError('Please provide in the correct format lat,lng', 400));
  }
  let radius;
  if (unit === 'mi') {
    radius = distance / 3963.2;
  } else if (unit === 'km') {
    radius = distance / 6378.1;
  } else {
    next(new AppError('Please unit either in mi or km', 400));
  }
  const tours = await Tours.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  res.status(200).json({
    status: 'Succes',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});
exports.getDistance = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    next(new AppError('Please provide in the correct format lat,lng', 400));
  }
  let multiplier;
  if (unit === 'mi') {
    multiplier = 0.000621;
  } else {
    multiplier = 0.001;
  }
  const distances = await Tours.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng * 1, lat * 1] },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'Succes',
    data: {
      data: distances,
    },
  });
});
