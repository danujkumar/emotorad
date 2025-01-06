const asyncHandler=require("express-async-handler")
const User=require("../models/user.js")
const generateToken=require("../utils/generateToken.js")
const bcrypt=require("bcrypt")

const identify = asyncHandler(async (req, res) => {
  try {
      const { email: e, phone: p, password } = req.body;

      const em = await User.findOne({ email: e });
      const pm = await User.findOne({ phone: p });
      let pc = em?.linkPrecedence === 'primary' ? em : pm || em;

      if (pc) {
          if (pc.linkPrecedence === 'primary' && (em || pm)) {
              pc.linkPrecedence = 'secondary';
              await pc.save(); 

              const newContact = await User.create({
                  email: e,
                  phone: p,
                  password,
                  linkedId: pc._id,
                  linkPrecedence: 'primary', 
              });

              return res.status(200).json({
                  primaryContactId: newContact._id,
                  emails: [newContact.email],
                  phoneNumbers: [newContact.phone],
                  secondaryContactIds: [pc._id],
              });
          }

          const sc = await User.create({
              email: e,
              phone: p,
              password,
              linkedId: pc._id,
              linkPrecedence: 'secondary',
          });

          return res.status(200).json({
              primaryContactId: pc._id,
              emails: Array.from(new Set([pc.email, ...sc.map(c => c.email)])),
              phoneNumbers: Array.from(new Set([pc.phone, ...sc.map(c => c.phone)])),
              secondaryContactIds: [sc._id],
          });
      }

      const nc = await User.create({ email: e, phone: p, password, linkedId: null, linkPrecedence: 'primary' });
      res.status(201).json({
          primaryContactId: nc._id,
          emails: [nc.email],
          phoneNumbers: [nc.phone],
          secondaryContactIds: [],
      });
  } catch (err) {
      res.status(400).json({ error: err.message });
  }
});



module.exports={identify}