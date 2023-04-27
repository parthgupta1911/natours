const express = require('express');
const path = require('path');
const morgan = require('morgan');
const ratelimit = require('express-rate-limit');
const helmet = require('helmet');
const mongosanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookie_parser = require('cookie-parser');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const cookieParser = require('cookie-parser');
//howdy
// start express app
const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

//GLOBAL MIDDLEWARES

// Set security http headers
app.use(helmet());
//devlopment logging
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'devlopment') {
    morgan('dev');
  }
  next();
});
const limiter = ratelimit({
  max: 100,
  windowMS: 60 * 60 * 1000,
  message: 'Too many requests from this ip please try again in an hour',
});
//limit requests from the same ip
app.use('/api', limiter);
//body parser ,reading data from body and putting into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookie_parser());
//Data sanitization against NoSQL querry injection
app.use(mongosanitize());
//Data sanitization against XSS
app.use(xss());
//app.use(hpp());

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.all('*', (req, resp, next) => {
  next(new AppError(`cant find ${req.originalUrl}`, 404));
});
app.use(globalErrorHandler);
module.exports = app;
