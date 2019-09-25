const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    unique: true,
  },
  feedUrls: {
    type: [String],
  }
})

const Users = mongoose.model('Users', userSchema)

module.exports = Users