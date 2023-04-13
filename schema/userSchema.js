const mongoose = require('mongoose')
const {Schema} = mongoose;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        min: [4, "username should be longer than 4 words"]
    },
    email: {
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true,
        min:[5, "too short password"]
    },

    token: [{type:String, required: true}]
})

const userModel = new mongoose.model('User', userSchema);
module.exports= {userModel}