const express = require("express");
const app = express();
const port = 5000;
const mongoose = require("mongoose");
const { whatsappModel } = require("./schema/schema");
const { userModel } = require("./schema/userSchema");
const Pusher = require("pusher");
const cors = require("cors");
const bcrypt = require("bcrypt");
require('dotenv').config()
const path = require('path');

const saltRounds = 10;

const pusher = new Pusher({
  appId: "1554660",
  key: "100bbe4d789f0e8e89f5",
  secret: "146983966c95d1dc839f",
  cluster: "ap2",
  useTLS: true,
});

const uri =
  "mongodb+srv://AMalfez:AMalfez%402003@cluster0.h28yihv.mongodb.net/?retryWrites=true&w=majority";
mongoose.set("strictQuery", false);
mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("connected!");
  });

const db = mongoose.connection.once("open", () => {
  console.log("DB connected");
  const msgCollection = db.collection("messages"); //gives collection
  const changeStream = msgCollection.watch(); //gives access to events
  changeStream.on("change", (change) => {
    if (change.operationType === "insert") {
      const msgData = change.fullDocument;
      //console.log(msgData);
      pusher.trigger("messages", "inserted", {
        _id: msgData._id,
        name: msgData.name,
        message: msgData.message,
        timestamp: msgData.timestamp,
        received: msgData.received,
      });
    }
    // else if(change.operationType != 'insert' || change.operationType != 'deleted') {
    //   console.log("error triggring pusher");
    // }
  });
});

app.use(express.json());
app.use(cors());
// app.use(express.static(path.join(__dirname,'./build')));

// app.get('*',(req,res)=>{
//   res.sendFile(path.join(__dirname,'./build/index.html'))
// })

app.get("/messages", (req, res) => {
  whatsappModel.find((err, data) => {
    if (err) {
      res.status(200).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
  const message = req.body;
  whatsappModel.create(message, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      //pusher.trigger("messages", "inserted", data)
      res.send(data);
    }
  });
});

app.delete("/messages/delete", async (req, res) => {
  const id = req.query.delete;
  //console.log(id);
  const deletedMessage = await whatsappModel.findByIdAndDelete(id);
  const newMessage = await whatsappModel.find();

  pusher.trigger("messages", "deleted", newMessage);

  res.json(deletedMessage);
});

//sign up functionality
app.post("/user/signup", async(req, res) => {
  //verify if user already exists
  const user = req.body;
  console.log(user);
  const userExist  = await userModel.find({ email: user.email });
 if (!userExist[0]) {
  bcrypt.hash(user.password, saltRounds, async (err, hash) => {
    // Store hash in your password DB.
    await userModel.create({...user, password:hash}, (err, data) => {
      if (err) {
        res.status(400).send(err);
      }
      res.send(data)
    });
  });
 } else{
  res.send("taken")
 }
        
 
});

//login functionality
app.post("/user/login", async (req, res) => {
  const { email, password } = req.body;
  const userExist  = await userModel.find({ email });
  // res.send(userExist)
  if (userExist) {
    bcrypt.compare(password, userExist[0].password, function (err, result) {
      if (result) {
        res.send(userExist);
      } else {
        res.status(401).send("user does not exist");
      }
    });
  } else{
    res.send('noexist')
  }
  
});


//finding user after login/signup
app.post('/whatsapp/:_id', async (req,res)=>{
  const _id = req.params;
  const userExist = await userModel.find({_id});
  if (userExist) {
    res.send(userExist)
  } else{
    res.send('User does not exists')
  }
})

app.listen( port, () => {
  console.log(`http://localhost:${port}`);
});
