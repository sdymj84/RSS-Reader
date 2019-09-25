const express = require('express')
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


router.get('/', async (req, res) => {
  // Get feed urls from database
  let feedUrls = []
  await Users.findOne({ 'uid': 'bVB6kONnFfT0Q43zURsVVcb8IA12' }, 'feedUrls', (err, user) => {
    feedUrls = user.feedUrls
  })

  if (!feedUrls.length) {
    return res.render('home', {
      feeds: [],
      feedUrls: [],
      articleCounts: 0,
      mediaCounts: 0,
      earliestPubDate: "",
      latestPubDate: ""
    })
  } else {
    console.log('else')
    // Parse feeds and rearrange data
    const feeds = await parseFeeds(feedUrls)
    const sort = req.query.sortby || ""
    const sortedFeeds = _.sortBy(feeds, sort)
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
      latestPubDate
    })
  }
})


router.post('/addUrl', async (req, res) => {
  const feedUrl = req.body.feedUrl
  // Validate feed url
  try {
    await parser.parseURL(feedUrl)
  } catch (e) {
    return res.status(500).json({
      errMsg: "Entered URL is not a valid feed."
    })
  }

  // Add new feedUrl to database
  Users.findOneAndUpdate(
    { uid: 'bVB6kONnFfT0Q43zURsVVcb8IA12' },
    { $push: { feedUrls: feedUrl } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
    (err, doc) => {
      err && console.log('Error!')
      console.log(doc)
    }
  )
  return res.status(200).send("success")
})


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