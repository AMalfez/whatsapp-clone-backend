const mongoose = require('mongoose');
const { Schema } = mongoose;

const whatsappSchema = new Schema({
  name:  String, 
  message: String,
  timestamp: String,
  received: Boolean
});

const whatsappModel = new mongoose.model('Message', whatsappSchema);
module.exports = {whatsappModel};