const asyncHandler = require("express-async-handler");
const User = require("../models/user.js");

const identify = asyncHandler(async (req, res) => {
  const { email: e, phone: p, product } = req.body;

  const pc = await User.findOne({
    $or: [{ email: e }, { phone: p }],
    linkPrecedence: "primary",
  });

  const sec = await User.findOne({
    $or: [{email: e}, {phone: p}],
    linkPrecedence: "secondary"
  })

  if (pc) {
    const em = pc.email;
    const pm = pc.phone;

    if (pc.linkPrecedence === "primary" && em === e && pm === p) {
      //If both are same then create new item and make it secondary and reference it with primary
      const sc = await User.create({
        email: e,
        phone: p,
        product,
        linkedId: pc._id,
        linkPrecedence: "secondary",
      });

      pc.secondaryContacts = pc.secondaryContacts || [];
      pc.secondaryContacts.push(sc._id);
      await pc.save();

      return res.status(200).json({
        primaryContactId: pc._id,
        contactPairs: [{ email: pc.email, phone: pc.phone }],
        secondaryContactIds: pc.secondaryContacts,
        createdAt: pc.createdAt,
        updatedAt: pc.updatedAt,
        deletedAt: pc.deletedAt,
      });
    } else {
      //If email or phone number anyone changes then primary become secondary and new item become primary.
      pc.linkPrecedence = "secondary";

      const newContact = await User.create({
        email: e,
        phone: p,
        product,
        linkedId: null,
        linkPrecedence: "primary",
      });

      pc.linkedId = newContact._id;

      newContact.secondaryContacts = pc.secondaryContacts || [];
      newContact.secondaryContacts.push(pc._id);
      pc.secondaryContacts = [];
      await pc.save();
      await newContact.save();

      return res.status(200).json({
        primaryContactId: newContact._id,
        contactPairs: [{ email: newContact.email, phone: newContact.phone }],
        secondaryContactIds: [pc._id],
        createdAt: pc.createdAt,
        updatedAt: newContact.updatedAt,
        deletedAt: pc.deletedAt,
      });
    }
  }
  else if(sec) {
    //Here both email and phone are different but it is present in the database with secondary so we have to treat 
    // it as same user

    let oldP = await User.findById(sec.linkedId);
    while(oldP.linkPrecedence != "primary")
    {
        console.log(sec)
        oldP = await User.findById(oldP.linkedId);
    }

    //First case: If both phone and email matches
    let primaryC, newE, newP, secondaryC, update;
    if(sec.email === e && sec.phone === p)
    {
        const newContact = await User.create({
            email : e, 
            phone : p,
            product, 
            linkedId: sec._id,
            linkPrecedence: "secondary"
        })
    
        //Old secondary becomes primary
        update = newContact.createdAt;
        sec.linkPrecedence = "primary"
        sec.secondaryContacts = oldP.secondaryContacts || [];
        sec.secondaryContacts.push(newContact._id);
        sec.secondaryContacts.push(oldP._id);
        newE = e;
        newP = p;
        secondaryC = sec.secondaryContacts;
        primaryC = sec._id;
        sec.save();
    }
    else
    {
        //Second case: If anyone matches then that becomes primary again and old primary becomes secondary
        const newContact = await User.create({
            email : e, 
            phone : p,
            product, 
            linkedId: null,
            linkPrecedence: "primary"
        })

        //Old secondary becomes primary
        update = newContact.createdAt;
        newContact.secondaryContacts = oldP.secondaryContacts || [];
        newContact.secondaryContacts.push(sec._id);
        newContact.secondaryContacts.push(oldP._id);
        primaryC = newContact._id;
        secondaryC = newContact.secondaryContacts;
        newE = newContact.email;
        newP = newContact.phone;
        newContact.save();
    }

     //Old primary becomes secondary
     oldP.linkPrecedence = "secondary"
     oldP.secondaryContacts = [];
     oldP.save();
    
    res.status(201).json({
      primaryContactId: primaryC,
      contactPairs: [{ email: newE, phone: newP }],
      secondaryContactIds: secondaryC,
      createdAt: oldP.createdAt,
      updatedAt: update,
      deletedAt: null,
    })

  }
   else {
    //If the information is secondary then do the same by making it primary and other thing secondary
    //If new information with new email id or phone number come then make all together new data
    const nc = await User.create({
      email: e,
      phone: p,
      product,
      linkedId: null,
      linkPrecedence: "primary",
    });
    res.status(201).json({
      primaryContactId: nc._id,
      contactPairs: [{ email: nc.email, phone: nc.phone }],
      secondaryContactIds: [],
      createdAt: nc.createdAt,
      updatedAt: nc.updatedAt,
      deletedAt: nc.deletedAt,
    });
  }
});

module.exports = { identify };
