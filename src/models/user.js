const mongoose = require("mongoose");
const validator = require("validator");

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

module.exports =  new mongoose.model("user", userSchema);