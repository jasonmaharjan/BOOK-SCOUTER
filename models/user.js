const mongoose = require('mongoose');

// User Schema
const UserSchema = mongoose.Schema({
  name:{
    type: String,
    required: true
  },
  email:{
    type: String,
    required: true
  },
  username:{
    type: String,
    required: true
  },
  password:{
    type: String,
    required: true
  },
  comments:{
    type: String,
    required: false
  },
  // genrecount: [{
  horror:{
    type: Number,
    default: 0
  },
  romance:{
    type: Number,
    default: 0
  },
  fiction:{
    type: Number,
    default: 0
  }
//}]
});

const User = module.exports = mongoose.model('User', UserSchema);
