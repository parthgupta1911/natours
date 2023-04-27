const dotenv = require('dotenv');
// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('shutting down!...');
  process.exit(1);
});
dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((con) => {
    console.log('we are connected');
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log('app running');
});
process.on('unhandledRejection', (err) => {
  console.error(err.message);
  server.close(() => {
    console.log('closing the server...');
    process.exit(1);
  });
});
