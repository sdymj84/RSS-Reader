const express = require('express')
const path = require('path')
const members = require('./models/Members')
const exphbs = require('express-handlebars')

const app = express()

const PORT = process.env.PORT || 5000


app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

// Set static folder
app.use(express.static(path.join(__dirname, 'public')))

// Routes
app.get('/', (req, res) => {
  res.render('home')
})

app.get('/api/members', (req, res) => {
  res.json(members)
})
app.get('/api/members/:id', (req, res) => {
  res.json(req.params.id)
})

app.listen(PORT, () => {
  console.log(`Server Started on ${PORT}...`)
})