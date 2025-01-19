/* eslint-disable prettier/prettier */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  process.exit(1);
});

dotenv.config({ path: './config.env' });

// env to check if the database is connected
// if (process.env.DATABASE) {
//   console.log(process.env.DATABASE_PASSWORD);
// }

// Atlas connection string
// const DB = process.env.MONGO_URI.replace(
//   '<db_password>',
//   process.env.MONGO_PASSWORD,
// );

//DB connection
// mongoose
// .connect(process.env.DATABASE_local)
// .connect(DB, {
//   dbName: 'Shopperoo',
// })
// .then(() => {
// console.log(con.connections);
//   console.log('DB connection successful!');
// });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});
