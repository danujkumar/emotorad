const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  password: { type: String, required: true },
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
    unique: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Invalid Email address");
      }
    },
  },
  linkedId: {
    type: mongoose.Schema.Types.Number,
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

userSchema.pre("save", async function (next) {
    
  this.updatedAt = Date.now();
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports =  new mongoose.model("user", userSchema);