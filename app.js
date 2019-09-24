const express = require('express')
const path = require('path')
const members = require('./models/Members')
const exphbs = require('express-handlebars')
const fetch = require('node-fetch')
const Parser = require('rss-parser')
const parser = new Parser({
  customFields: {
    item: [
      'media:content',
      'media:group',
    ]
  }
})


const app = express()

const PORT = process.env.PORT || 5000


app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

// Set static folder
app.use(express.static(path.join(__dirname, 'public')))


// Routes
app.get('/', async (req, res) => {
  // Get feed urls from database
  let feedUrls = []
  feedUrls = [
    // 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    // 'https://www.reddit.com/.rss',
    'https://www.youtube.com/feeds/videos.xml?channel_id=UCoookXUzPciGrEZEXmh4Jjg',
  ]

  // Parse from feed
  const feeds = []
  await Promise.all(feedUrls.map(async feedUrl => {
    try {
      const feed = await parser.parseURL(feedUrl)
      feed.items.forEach(item => {
        console.log(item)

        const media = item['media:content']
        feeds.push({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          description: item.content,
          media: media ? media['$'].url : "",
        })
      });
    } catch (e) {
      console.error('Error in fetching the website', e)
    }
  }))

  console.log(feeds[0])
  // Show result
  res.render('home', { feeds: feeds })
})


app.listen(PORT, () => {
  console.log(`Server Started on ${PORT}...`)
})