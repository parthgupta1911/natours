const AppError = require('../utils/appError');

const sendErrorDev = (err, res, req) => {
  console.log(err.name, err.message);
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Something went Wrong',
      msg: err.message,
    });
  }
};
const sendErrorProd = (err, res, req) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      res.status(500).json({
        status: 'eror',
        message: 'something went ver wrong',
      });
    }
  } else {
    // eslint-disable-next-line no-lonely-if
    if (err.isOperational) {
      res.status(err.statusCode).render('error', {
        title: 'Something went Wrong',
        msg: err.message,
      });
    } else {
      res.status(err.statusCode).render('error', {
        title: 'Something went Wrong',
        msg: 'pls try again later',
      });
    }
  }
};
const handleCastError = (err) => {
  const message = `Invalid${err.path}:${err.field}`;
  return new AppError(message, 500);
};
const handleDuplicateError = (err) => {
  const message = `Duplicate ${err.path}:${err.field}`;
  return new AppError(message, 500);
};
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((e1) => e1.message);

  return new AppError(`Invalid entries ${errors.join(' , ')}`, 500);
};
const handleJWTError = () => new AppError('Invalid token log in again', 401);
const handleExpiredError = () =>
  new AppError('Your token has expired please log in again', 401);
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res, req);
  } else if (process.env.NODE_ENV === 'production') {
    if (err.name === 'CastError') err = handleCastError(err);
    else if (err.code === 11000) err = handleDuplicateError(err);
    else if (err.name === 'ValidationError') err = handleValidationError(err);
    else if (err.name === 'JsonWebTokenError') err = handleJWTError();
    else if (err.name === 'TokenExpiredError') err = handleExpiredError();
    sendErrorProd(err, res, req);
  }
};
