const mongoose = require("mongoose");
const validator = require("validator");

//User schema according to the problem statement provided
const userSchema = new mongoose.Schema({
  product: { type: String, required: true },
  phone: { 
    type: String, 
    required: true, 
    validate(value) {
      if (!/^[0-9]+$/.test(value)) {
        throw new Error("Invalid phone number");
      }
    }
  },
  email: {
    type: String,
    required: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Invalid Email address");
      }
    },
  },
  linkedId: {
    type: mongoose.Schema.Types.String,
    default: null,
  },
  linkPrecedence: {
    type: String,
    enum: ["primary", "secondary"],
    required: true,
  },
  secondaryContacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
});

// Creating the model
const User = mongoose.model('User', userSchema);

module.exports = User;