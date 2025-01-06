const {MongoClient} = require('mongodb');
const mongoose = require('mongoose');

mongoose.connect('mongodb://0.0.0.0:27017/emotorad').then(()=>{
  console.log('Connection successful');
}).catch(err => {
  console.log('Some error occurred: '+err);
})

let dbConnection;

module.exports = {
  //This function is used to connect to the mongodb database
  connectToDb : (cb) => {
    MongoClient.connect('mongodb://0.0.0.0:27017/emotorad').then((client)=>{
      dbConnection =  client.db()
      return cb()
    }).catch(err => {
      console.log(err);
      return cb(err)
    })
  },

  //This function is used to retrieve the information from mongodb database
  getDb : () => dbConnection
}