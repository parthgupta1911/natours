const Reviews = require('../models/reviewmodel');
const factory = require('./handlerFactory');

exports.setTourAndUserId = (req, res, next) => {
  if (!req.body.tour) {
    req.body.tour = req.params.tourId;
  }
  if (!req.body.user) {
    req.body.user = req.user.id;
  }
  next();
};
exports.getReview = factory.getOne(Reviews);
exports.createReview = factory.createOne(Reviews);
exports.deleteReview = factory.deleteOne(Reviews);
exports.updateReview = factory.updateOne(Reviews);
exports.getReviews = factory.getAll(Reviews);
