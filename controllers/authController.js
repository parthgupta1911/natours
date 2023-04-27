const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/email');
const User = require('../models/usermodel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 60
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  user.password = undefined;
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    PasswordChangedAt: req.body.PasswordChangedAt,
  });

  createSendToken(newUser, 201, res);
});
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //1)check if email and password exists
  if (!email || !password) {
    next(new AppError('please provide both email and password', 400));
    return;
  }
  //2) check if user exists and password is correct
  const user = await User.findOne({ email: email }).select('+password');
  if (!user || !(await user.corectPassword(password, user.password))) {
    next(new AppError('incorect email or password', 401));
    return;
  }
  //3) if everything is ok, send tokent ot client

  createSendToken(user, 200, res);
});
exports.protect = catchAsync(async (req, res, next) => {
  //1)see if the tokent exists and get it
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    next(new AppError('not logged in(no token)', 401));
    return;
  }
  //2) Verify the token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //3)Check if user exists

  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    next(new AppError('THE USER WITH THIS TOKEN HAS PERISHED', 401));
    return;
  }
  // 4) check if user changed password after token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    next(new AppError('User recentyl changed password! ,log in again', 401));
    return;
  }
  req.user = freshUser;
  res.locals.user = freshUser;
  next();
});
// only for rendered page
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      //3)Check if user exists
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) {
        return next();
      }
      // 4) check if user changed password after token was issued
      if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      //there is a logged in user
      res.locals.user = freshUser;
    } catch (err) {
      return next();
    }
  }
  next();
};
// eslint-disable-next-line arrow-body-style
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array(this id done as we want to pass parameters to middleware fn)
    if (!roles.includes(req.user.role)) {
      next(new AppError('you dont have permission for this action', 403));
      return;
    }
    next();
  };
};
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) get user based on POSTed email
  const user1 = await User.findOne({ email: req.body.email });
  if (!user1) {
    next(new AppError('there is no such email', 404));
    return;
  }
  //2) generate random token
  const token = user1.createpaswordresettoken();
  await user1.save({ validateBeforeSave: false });
  //3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${token}`;
  const message = `Forgot your password? Sumbit a PATCH request with your new password and password confirm to : ${resetURL}`;
  try {
    await sendEmail({
      email: user1.email,
      subject: 'password reset token(valid for 2 min)',
      message,
    });
  } catch (err) {
    user1.passwordResetToken = undefined;
    user1.passwordResetExpire = undefined;
    await user1.save({ validateBeforeSave: false });
    next(new AppError('there is an error sending email try again later', 500));
    return;
  }
  createSendToken(user1, 200, res);
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //2) if token has not expired and there is user set the new password
  if (!user) {
    next(new AppError('Token is invalid or has expired', 400));
    return;
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //3) update changed passwordat property
  //(done by pre save middleware)
  //4) log the user in send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection

  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.corectPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};
