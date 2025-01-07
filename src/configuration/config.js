require('dotenv').config(); // Load environment variables from .env
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');

// Use environment variable for connection
const mongoUri = process.env.MONGO_URI;
mongoose.connect(mongoUri).then(() => {
  console.log('Connection to MongoDB Atlas successful');
}).catch(err => {
  console.log('Some error occurred: ' + err);
});

let dbConnection;

module.exports = {
  // This function is used to connect to the MongoDB Atlas database
  connectToDb: (cb) => {
    MongoClient.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
      .then((client) => {
        dbConnection = client.db();
        return cb();
      })
      .catch(err => {
        console.log(err);
        return cb(err);
      });
  },

  // This function is used to retrieve the connection to the MongoDB database
  getDb: () => dbConnection
};
