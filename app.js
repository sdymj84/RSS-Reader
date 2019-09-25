const express = require('express')
const path = require('path')
const members = require('./models/Members')
const exphbs = require('express-handlebars')
const fetch = require('node-fetch')
const moment = require('moment')
const Parser = require('rss-parser')
const _ = require('lodash')
const parser = new Parser({
  customFields: {
    item: [
      'media:content',
      'media:group',
      'image',
    ]
  }
})


const app = express()
const PORT = process.env.PORT || 5000

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))


// Routes
app.get('/', async (req, res) => {
  // Get feed urls from database
  let feedUrls = []
  feedUrls = [
    // 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    'http://www.espn.com/espn/rss/news',
    // 'https://www.youtube.com/feeds/videos.xml?channel_id=UCoookXUzPciGrEZEXmh4Jjg',
  ]

  // Parse from feed
  const feeds = []
  await Promise.all(feedUrls.map(async feedUrl => {
    try {
      const feed = await parser.parseURL(feedUrl)
      feed.items.forEach(item => {
        let media = ""
        let description = item.content

        // Youtube
        if (item['media:group']) {
          media = item['media:group']['media:thumbnail'][0].$.url
          description = item['media:group']['media:description'][0]
        }
        // News
        else if (item['media:content']) {
          media = item['media:content'].$.url
        }
        // ESPN
        else if (item.image) {
          media = item.image
        }
        else {
          media = ""
        }
        feeds.push({
          title: item.title,
          link: item.link,
          pubDate: moment(item.pubDate).format("MM/D/YYYY hh:mm"),
          description,
          media,
        })
      });
    } catch (e) {
      console.error('Error in fetching the website', e)
    }
  }))

  // const sort = req.query.sortby || ""
  // console.log(sort)
  // const sortedFeeds = _.sortBy(feeds, sort)
  // console.log(sortedFeeds)

  // Show result
  res.render('home', { feeds: feeds })
})


app.listen(PORT, () => {
  console.log(`Server Started on ${PORT}...`)
})