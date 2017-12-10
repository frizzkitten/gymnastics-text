"use strict"
var mongoose = require('mongoose');

var usersSchema = mongoose.Schema({
  name: String,
  number: String,
  pickupLocation: String,
  exceptionalPickupLocation: String,
  exceptionalPickupDate: Date
});

// 'Users' means we will use the 'users' collection. if 'Books' was in there
// it would be using the books collection from the db
var Users = mongoose.model('Users', usersSchema);
module.exports = Users;
