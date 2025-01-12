const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Defining the schema
const customSchema = new Schema({
  primary: {
    type: String,
    required: true,
  },
  email: {
    type: [String],
  },
  phone: {
    type: [String],
  }
});

// Creating the model
const Hashing = mongoose.model('Hashing', customSchema);

module.exports = Hashing;