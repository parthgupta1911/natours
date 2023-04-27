const express = require('express');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
const reviewRouter = require('./reviewRoutes');
const {
  getmonthlyplans,
  getalltours,
  top5alias,
  addtour,
  gettour,
  updatetour,
  deletetour,
  gettourstats,
  getTourWithin,
  getDistance,
} = require('../controllers/tourContoller');

const router = express.Router();
router.use('/:tourId/reviews', reviewRouter);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    getmonthlyplans
  );
router.route('/tour-stats').get(gettourstats);
router.route('/top-5-cheap').get(top5alias, getalltours);
router.route('/distances/:latlng/unit/:unit').get(getDistance);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getTourWithin);
router
  .route('/')
  .get(authController.protect, getalltours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    addtour
  );

router
  .route('/:id')
  .get(gettour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    updatetour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    deletetour
  );

module.exports = router;
