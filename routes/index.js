const express = require('express')
const app = express()
const router = express.Router()
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
const moment = require('moment')
const Users = require('../models/Users')
const uuidv1 = require('uuid/v1')



/*=================================================
  / (Home page)
  - Fetch feed urls from user DB 
  - Parse feeds from urls and rearrange data 
  - Send data to view
=================================================*/
router.get('/', async (req, res) => {

  console.log(app.locals.uid)
  if (!app.locals.uid) {
    return res.redirect('/signin')
  }

  // Get feed urls from database
  const user = await Users.findOne({ 'uid': app.locals.uid }, (err, user) => {
    if (err) {
      console.log('Error in getting user data', err)
    }
  })

  const feedUrls = user.feedUrls || []
  const sortby = user.sortby || ""
  const order = user.order || ""

  if (!feedUrls.length) {
    return res.render('home', {
      feeds: [],
      feedUrls: [],
      articleCounts: 0,
      mediaCounts: 0,
      earliestPubDate: "",
      latestPubDate: ""
    })
  }


  const feeds = await parseFeeds(feedUrls)
  const sortedFeeds = _.sortBy(feeds, sortby)
  order === 'true' && _.reverse(sortedFeeds)
  const articleCounts = feeds.length
  const mediaCounts = _.filter(feeds, feed => feed.media !== "").length
  const dateSortedFeeds = _.sortBy(feeds, 'pubDate')
  const earliestPubDate = dateSortedFeeds[0].pubDate
  const latestPubDate = dateSortedFeeds[dateSortedFeeds.length - 1].pubDate


  // Show result
  return res.render('home', {
    feeds: sortedFeeds,
    feedUrls,
    articleCounts,
    mediaCounts,
    earliestPubDate,
    latestPubDate,
    sortby: sortby
      ? sortby === 'pubDate'
        ? 'Published Date'
        : sortby[0].toUpperCase() + sortby.slice(1, sortby.length)
      : "",
    order: order === 'true' ? 'checked' : '',
  })
})


/*=================================================
  /addUrl
  - Validate feed url 
  - Add new feed url to user DB 
  - Refresh page
=================================================*/
router.post('/addUrl', async (req, res) => {
  let feedUrl = req.body.feedUrl
  feedUrl = feedUrl[feedUrl.length - 1] === '/' ? feedUrl.slice(0, -1) : feedUrl
  // Validate feed url
  try {
    await parser.parseURL(feedUrl)
  } catch (e) {
    return res.status(500).json({
      errMsg: "Entered URL is not a valid feed."
    })
  }

  // Add new feedUrl to database
  const result = await Users.findOneAndUpdate(
    { uid: app.locals.uid },
    { $addToSet: { feedUrls: feedUrl } },
    { useFindAndModify: false },
    (err, doc) => {
      if (err) {
        console.log('Error in adding new url to DB', err)
        res.status(500).json({
          errMsg: "Error in adding new url to DB"
        })
      }
    }
  )
  return res.status(200).send("success")
})


/*=================================================
  /removeUrl
  - Remove feed url from user DB 
  - Refresh page
=================================================*/
router.post('/removeUrl', async (req, res) => {
  const feedUrl = req.body.feedUrl

  // Remove feedUrl from database
  await Users.findOneAndUpdate(
    { uid: app.locals.uid },
    { $pull: { feedUrls: feedUrl } },
    { useFindAndModify: false },
    (err, doc) => {
      if (err) {
        console.log('Error in removing url from DB', err)
        res.status(500).json({
          errMsg: "Error in removing url from DB"
        })
      }
    }
  )
  return res.status(200).send("success")
})


/*=================================================
  /sortby
  - Get sortby text from client
  - Change sortby in database
  - Refresh page
=================================================*/
router.post('/sortby', async (req, res) => {
  // Update sortby on database
  await Users.findOneAndUpdate(
    { uid: app.locals.uid },
    { $set: { sortby: req.body.sortby } },
    { useFindAndModify: false },
    (err, doc) => {
      if (err) {
        console.log('Error in storing sortby on DB', err)
        res.status(500).json({
          errMsg: "Error in storing sortby on DB"
        })
      }
    }
  )
  return res.status(200).send("success")
})


/*=================================================
  /order
  - Get order value from client
  - Change order in database
  - Refresh page
=================================================*/
router.post('/order', async (req, res) => {
  // Update order on database
  await Users.findOneAndUpdate(
    { uid: app.locals.uid },
    { $set: { order: req.body.order } },
    { useFindAndModify: false },
    (err, doc) => {
      if (err) {
        console.log('Error in storing order on DB', err)
        res.status(500).json({
          errMsg: "Error in storing order on DB"
        })
      }
    }
  )
  return res.status(200).send("success")
})



router.get('/signin', async (req, res) => {
  if (app.locals.uid) {
    return res.redirect('/')
  }
  res.render('signin')
})

router.post('/signin', (req, res) => {
  app.locals.uid = req.body.uid
})

router.post('/signout', (req, res) => {
  app.locals.uid = ""
  console.log("signout : ", app.locals.uid)
})

router.post('/signup', async (req, res) => {
  // Save user data into database
  await Users.create({
    uid: req.body.uid,
    feedUrls: [],
    sortby: "",
    order: "",
  }, (err, doc) => {
    if (err) {
      console.log('Error in storing user data on DB', err)
      res.status(500).json({
        errMsg: "Error in storing user data on DB"
      })
    }
  })

  // Send result back to client
  res.status(200).send('success')
})




/*=================================================
  Function
  - Params: Feed url array
  - Returns: Parsed feed array

  - Iterate url array and parse feed from each url
  - Some feed url has different format so put condition
    to parse media accordingly
=================================================*/
const parseFeeds = async (feedUrls) => {
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
      console.error('Error in fetching the feed')
      return { error: e }
    }
  }))

  return feeds
}

module.exports = router