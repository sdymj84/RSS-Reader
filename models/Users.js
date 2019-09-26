const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    unique: true,
  },
  feedUrls: {
    type: [String],
  },
  sortby: {
    type: String,
  },
  order: {
    type: String,
  }
})

const Users = mongoose.model('users', userSchema)

module.exports = Users