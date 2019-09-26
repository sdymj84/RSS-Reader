const express = require('express')
const app = express()
require('dotenv').config()
const path = require('path')
const exphbs = require('express-handlebars')
const mongoose = require('mongoose')


// MongoDB and Server Connection
const PORT = process.env.PORT || 5000
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  app.listen(PORT, () => {
    console.log(`Server Started on ${PORT}...`)
  })
}).catch((e) => {
  console.log('Error in connecting DB', e)
});


app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))
app.use('/', require('./routes/index'))





