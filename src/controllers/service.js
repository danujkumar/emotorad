const asyncHandler=require("express-async-handler")
const User=require("../models/user.js")
const generateToken=require("../utils/generateToken.js")
const bcrypt=require("bcrypt")

const identify = asyncHandler(async (req, res) => {
    try {
      const {email, phone, password } = req.body;

      //First case if email exist but not phone

      //Second case if phone exist but not email

      //If both not exist
      await User.findOne({ email });
      const details = await User.create({
        email,
        phone,
        password,
      });
      const token = generateToken(res, details._id);
      res.status(201).json({
        token,
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
});


module.exports={identify}