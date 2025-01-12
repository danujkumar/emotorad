const asyncHandler = require("express-async-handler");
const User = require("../models/user.js");
const Hash = require("../models/hashing.js");
const  mongoose  = require("mongoose");

//This is used to update the hash in mongo so that we can retrieve all information of primary and secondary efficiently
const hashUpdater = async (id, newId ,email, phone, session)=>{
  await Hash.updateOne({primary:id},
    {
      $set:{
        primary: newId
      },
      $addToSet: {
        phone: phone, // Adds the phone directly
        email: email  // Adds the email directly
      }
    }
  ).session(session)
}

//This function is used to create new entry
const saveDetails = async (email, phone, product, linkedId, linkPrecedence, session) => {
    return await User.create([{email, 
      phone, 
      product, 
      linkedId, 
      linkPrecedence 
    }], {session})
}

//This function is used to update/transfer secondary contacts
const changeofSecondary = async (oldS, newS, additional, session) => {
  await User.updateOne ({_id: newS._id}, {
    $set:{
      linkPrecedence: "primary",
    },
      $addToSet: {
        secondaryContacts: { $each: [...(oldS.secondaryContacts || []), additional, oldS._id].filter(Boolean) }
      }
  }).session(session)  
  await User.updateOne({_id:oldS._id}, {
    $set:{
      linkPrecedence : "secondary",
      linkedId : newS._id,
      secondaryContacts : []
    }
  }).session(session)
}

//This function is used to update secondary only contacts
const secondaryUpdate = async (primary, secondary, session) => {
  await User.updateOne({_id: primary._id}, {
    $addToSet:{
      secondaryContacts: {$each : [secondary._id ]} 
    }
  }).session(session)
}

//Endpoint here
const identify = asyncHandler(async (req, res) => {
  const { email: e, phone: p, product } = req.body;

  const session = await mongoose.startSession()

  try {

  session.startTransaction();

  const pc = await User.findOne({
    $or: [{ email: e }, { phone: p }],
    linkPrecedence: "primary",
  }).session(session);

  const sec = await User.findOne({
    $or: [{email: e}, {phone: p}],
    linkPrecedence: "secondary"
  }).session(session);

  if (pc) {
    const em = pc.email;
    const pm = pc.phone;

    if (pc.linkPrecedence === "primary" && em === e && pm === p) {
      //If both are same then create new item and make it secondary and reference it with primary
      const sc = await saveDetails(e, p, product, pc._id, "secondary", session)
      
      await secondaryUpdate(pc, sc[0], session);
      
      await session.commitTransaction();

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

      const newContact = await saveDetails(e, p, product, null, "primary", session)

      
      await hashUpdater(pc._id, newContact[0]._id, newContact[0].email, newContact[0].phone, session)
      
      await changeofSecondary(pc, newContact[0], null, session);

      await session.commitTransaction();

      return res.status(200).json({
        primaryContactId: newContact[0]._id,
        contactPairs: [{ email: newContact[0].email, phone: newContact[0].phone }],
        secondaryContactIds: [pc._id],
        createdAt: pc.createdAt,
        updatedAt: newContact[0].updatedAt,
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
    }).session(session);

    let oldP = await User.findById(hashP?.primary).session(session);
    // console.log(hashP.primary,oldP,hashP)

    //First case: If both phone and email matches
    let primaryC, newE, newP, secondaryC, update;
    if(sec.email === e && sec.phone === p)
    {
        const newContact = await saveDetails(e, p, product, sec._id, "secondary", session)    
        await changeofSecondary(oldP, sec, newContact[0]._id, session)
        await hashUpdater(oldP._id, sec._id, e, p, session);
        
        update = newContact[0].createdAt;
        secondaryC = sec.secondaryContacts;
        primaryC = sec._id;
        newE = e;
        newP = p;
    }
    else
    {
        //Second case: If anyone matches then that becomes primary again and old primary becomes secondary

        console.log("This condition will execute here...")

        const newContact = await saveDetails(e, p, product, null, "primary", session)

        //Old secondary becomes primary
        await changeofSecondary(oldP, newContact[0], sec._id, session)
        await hashUpdater(oldP._id, newContact[0]._id, newContact[0].email, newContact[0].phone, session)

        primaryC = newContact[0]._id;
        secondaryC = newContact[0].secondaryContacts;
        update = newContact[0].createdAt;
        newE = newContact[0].email;
        newP = newContact[0].phone;
    }

    await session.commitTransaction()
    
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
    const nc = await saveDetails(e, p, product, null, "primary", session);

    await Hash.create([{
      primary: nc[0]._id,
      email:[nc[0].email],
      phone:[nc[0].phone]
    }], {session})

    await session.commitTransaction()

    res.status(201).json({
      primaryContactId: nc[0]._id,
      contactPairs: [{ email: nc[0].email, phone: nc[0].phone }],
      secondaryContactIds: [],
      createdAt: nc[0].createdAt,
      updatedAt: nc[0].updatedAt,
      deletedAt: nc[0].deletedAt,
    });
  }

} catch(error) {
  console.log(error)
  await session.abortTransaction();
  session.endSession();
  throw new error("Something went wrong...")
} finally {
  session.endSession();
}
});

module.exports = { identify };
