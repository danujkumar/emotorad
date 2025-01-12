const asyncHandler = require("express-async-handler");
const User = require("../models/user.js");
const Hash = require("../models/hashing.js")

//This is used to update the hash in mongo so that we can retrieve all information of primary and secondary efficiently
const hashUpdater = async (id, newId ,email, phone)=>{
  await Hash.updateOne({primary:id},
    {
      $set:{
        primary: newId
      },
      $addToSet: {
        phone: { $each: [phone] } 
      },
      $addToSet:{
        email: {$each: [email]}
      }
    }
  )
}

//This function is used to create new entry
const saveDetails = async (email, phone, product, linkedId, linkPrecedence) => {
  return await User.create({
    email,
    phone,
    product,
    linkedId,
    linkPrecedence,
  })
}

//This function is used to update/transfer secondary contacts
const changeofSecondary = async (oldS, newS, additional) => {
  await User.updateOne ({_id: newS._id}, {
    $set:{
      linkPrecedence: "primary",
      secondaryContacts : oldS.secondaryContacts || [],
    },
    $addToSet:{
      secondaryContacts: {$each : [additional != null ? additional._id : [], oldS._id ] } 
    }
  })

  await User.updateOne({_id:oldS._id}, {
    $set:{
      linkPrecedence : "secondary",
      linkedId : newS._id,
      secondaryContacts : []
    }
  })
}

//This function is used to update secondary only contacts
const secondaryUpdate = async (primary, secondary) => {
  await User.updateOne({_id: primary._id}, {
    $addToSet:{
      secondaryContacts: {$each : [secondary._id ]} 
    }
  })
}

//Endpoint here
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
      const sc = await saveDetails(e, p, product, pc._id, "secondary")

      // pc.secondaryContacts = pc.secondaryContacts || [];
      // pc.secondaryContacts.push(sc._id);
      // await pc.save();
      await secondaryUpdate(pc, sc);

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

      const newContact = await saveDetails(e, p, product, null, "primary")

      hashUpdater(pc._id, newContact._id, newContact.email, newContact.phone)

      changeofSecondary(pc, newContact, null);

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

    let hashP = await Hash.findOne({
      email: { $in: [sec.email] },
      phone: { $in: [sec.phone] } 
    });

    let oldP = await User.findById(hashP?.primary);
    // console.log(hashP.primary,oldP,hashP)

    //First case: If both phone and email matches
    let primaryC, newE, newP, secondaryC, update;
    if(sec.email === e && sec.phone === p)
    {
        const newContact = await saveDetails(e, p, product, sec._id, "secondary")    
        changeofSecondary(oldP, sec, newContact)
        hashUpdater(oldP._id, sec._id, e, p);
        
        update = newContact.createdAt;
        secondaryC = sec.secondaryContacts;
        primaryC = sec._id;
        newE = e;
        newP = p;
    }
    else
    {
        //Second case: If anyone matches then that becomes primary again and old primary becomes secondary

        const newContact = await saveDetails(e, p, product, null, "primary")

        //Old secondary becomes primary
        changeofSecondary(oldP, newContact, sec)
        hashUpdater(oldP._id, newContact._id, newContact.email, newContact.phone)

        primaryC = newContact._id;
        secondaryC = newContact.secondaryContacts;
        update = newContact.createdAt;
        newE = newContact.email;
        newP = newContact.phone;
    }
    
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
    const nc = await saveDetails(e, p, product, null, "primary");

    await Hash.create({
      primary: nc._id,
      email:[nc.email],
      phone:[nc.phone]
    })

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
