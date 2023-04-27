const express = require('express');
const userContoller = require('../controllers/userContoller');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/signup').post(authController.signUp);
router.route('/login').post(authController.login);
router.get('/logout', authController.logout);

router.route('/forgotPassword').post(authController.forgotPassword);
router.route('/resetPassword/:token').patch(authController.resetPassword);
//AS MIDDLEWARE RUN IN the order of code thus for all controller after this line this middleware is run
router.use(authController.protect);

router.route('/me').get(userContoller.getMe, userContoller.getuser);
router.route('/updateMyPassword').patch(authController.updatePassword);
router
  .route('/updateMe')
  .patch(
    userContoller.uploadUserPhoto,
    userContoller.resizeUserPhoto,
    userContoller.updateMe
  );
router.route('/deleteMe').delete(userContoller.deleteMe);

router.use(authController.restrictTo('admin'));
router.route('/').get(userContoller.getusers);
router
  .route('/:id')
  .get(userContoller.getuser)
  .patch(userContoller.updateuser)
  .delete(userContoller.deleteuser);

module.exports = router;
