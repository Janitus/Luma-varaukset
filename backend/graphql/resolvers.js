const { UserInputError, AuthenticationError } = require('apollo-server-errors')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const Event = require('../models/event')
const Visit = require('../models/visit')
const jwt = require('jsonwebtoken')
const Tag = require('../models/tag')
const moment = require ('moment')
const mailer = require('../services/mailer')
const config = require('../utils/config')
const { readMessage } = require('../services/fileReader')

const resolvers = {
  Query: {
    getUsers: async () => {
      const users = await User.find({})
      return users
    },
    getEvents: async () => {
      const events = await Event.find({}).populate('tags', { name: 1, id: 1 }).populate('visits')

      //säätöä

      return events
    },
    getTags: async () => {
      const tags = await Tag.find({})
      return tags
    },
    getVisits: async () => {
      const visits = await Visit.find({}).populate('event', { id: 1, title: 1, resourceId: 1 })
      return visits
    },
    findVisit: async (root, args) => {
      try {
        const visit = await Visit.findById(args.id)
        return {
          id: visit.id,
          clientName: visit.clientName,
          clientEmail: visit.clientEmail,
          clientPhone: visit.clientPhone,
          event: visit.event,
          grade: visit.grade
        }
      } catch (e) {
        throw new UserInputError('Varausta ei löytynyt!')
      }
    },
    me: (root, args, context) => {
      return context.currentUser
    }
  },
  Visit: {
    event: async (root) => {
      const event = await Event.findById(root.event).populate('tags', { name: 1, id: 1 })
      return event
    },
  },
  Mutation: {
    createUser: async (root, args, { currentUser }) => {
      if (!currentUser || currentUser.isAdmin !== true) {
        throw new AuthenticationError('not authenticated or no credentials')
      }
      if (args.username.length < 5) {
        throw new UserInputError('username too short')
      }
      const salt = 10
      const passwordHash = await bcrypt.hash(args.password, salt)
      const newUser = new User({
        username: args.username,
        passwordHash,
        isAdmin: args.isAdmin,
      })
      await newUser.save()
      return newUser
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })
      const passwordCorrect = user === null
        ? false
        : await bcrypt.compare(args.password, user.passwordHash)
      if (!(user && passwordCorrect)) {
        throw new UserInputError('Wrong credentials!')
      }
      const userForToken = { username: user.username, id: user._id }
      return { value: jwt.sign(userForToken, config.SECRET) }
    },
    createEvent: async (root, args, { currentUser } ) => {
      if (!currentUser) {
        throw new AuthenticationError('not authenticated')
      }
      let resourceId = null
      switch (args.class) {
        case 'SUMMAMUTIKKA':
          resourceId = 1
          break
        case 'FOTONI':
          resourceId = 2
          break
        case 'LINKKI':
          resourceId = 3
          break
        case 'GEOPISTE':
          resourceId = 4
          break
        case 'GADOLIN':
          resourceId = 5
          break
        default:
          throw new UserInputError('Invalid class')
      }

      let grades = args.grades

      if (grades.length < 1) {
        throw new UserInputError('At least one grade must be selected!')
      }

      if (args.title.length < 5) {
        throw new UserInputError('title too short')
      }

      let eventTags = JSON.parse(JSON.stringify(args.tags))

      const eventTagsNames = eventTags.map(e => e.name)
      let mongoTags = await Tag.find({ name: { $in: eventTagsNames } })
      const foundTagNames = mongoTags.map(t => t.name)
      eventTags.forEach(tag => {
        if (!foundTagNames.includes(tag.name)) {
          const newTag = new Tag({ name: tag.name })
          mongoTags = mongoTags.concat(newTag)
          tag = newTag.save()
        }
      })

      const newEvent = new Event({
        title: args.title,
        start: args.start,
        end: args.end,
        desc: args.desc,
        resourceId,
        grades,
        remoteVisit: args.remoteVisit,
        inPersonVisit: args.inPersonVisit
      })
      newEvent.tags = mongoTags
      await newEvent.save()
      return newEvent
    },

    /*
--------S----------------E---- availableTime
-------------S--E------------- visitin s ja e
--------S---E----S-------E--- uudet mahdolliset
*/

    createVisit: async (root, args) => {
      const event = await Event.findById(args.event)
      const visitStart = new Date(args.startTime)
      const visitEnd = new Date(args.endTime)
      const availableTimes = event.availableTimes.map(time => ({
        startTime: new Date(time.startTime),
        endTime: new Date(time.endTime)
      }))
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)

      const check = (availableTimes) => {
        let result = null
        availableTimes.forEach(item => {
          if (visitStart >= item.startTime && visitEnd <= item.endTime) {
            result = {
              startTime: new Date(item.startTime),
              endTime: new Date(item.endTime)
            }
          }
        })
        console.log('checkin result: ', result)
        return result
      }

      const generateAvailableTime = (start, end) => {
        let result = null
        console.log(start, end)
        console.log(end - start, 'Hello world')
        if (end - start >= 3600000) {
          result = {
            startTime: start,
            endTime: end
          }
        }
        return result
      }
      /*
---S-----------------------E---- availableTime
---S--------------E____S---E---- visitin s ja e
--SE____S---------EXXXXXXXXE---- uudet mahdolliset
*/
      const assignAvailableTimes = (before, after , availableTime) => {
        console.log('vanha taulukko: ', availableTimes)
        const filteredAvailTimes = availableTimes.filter(at => at.endTime <= availableTime.startTime || at.startTime >= availableTime.endTime)
        if (before) filteredAvailTimes.push(before)
        if (after) filteredAvailTimes.push(after)
        return filteredAvailTimes
      }


      const availableTime = check(availableTimes)
      console.log(visitStart >= eventStart)
      console.log(visitStart < visitEnd)
      console.log(visitEnd <= eventEnd)

      if (visitStart >= eventStart && visitStart < visitEnd && visitEnd <= eventEnd && availableTime) {
        const availableEnd = new Date(visitStart)
        const availableStart = new Date(visitEnd)
        availableEnd.setTime(availableEnd.getTime() - 900000) //--> uuden mahdollisen aikaikkunan endTime
        availableStart.setTime(availableStart.getTime() + 900000) //--> uuden mahdollisen aikaikkunan startTime

        const availableBefore = generateAvailableTime(availableTime.startTime, availableEnd)
        const availableAfter = generateAvailableTime(availableStart, availableTime.endTime)
        console.log('mahdollinen ennen visitiä: ', availableBefore, 'mahdollinen visitin jälkeen: ', availableAfter)
        console.log('availableTime: ', availableTime)
        const newAvailableTimes = assignAvailableTimes(availableAfter, availableBefore, availableTime)
        console.log('uusi taulukko: ', newAvailableTimes)
        event.availableTimes = newAvailableTimes
      }

      const visit = new Visit({
        ...args,
        event: event,
        status: true,
        startTime: args.startTime,
        endTime: args.endTime,
      })

      let savedVisit
      try {
        const now = moment(new Date())
        const start = moment(event.start)
        if (start.diff(now, 'days') >= 14 && availableTime) {
          savedVisit = await visit.save()
          const details = [{
            name: 'link',
            value: `${config.HOST_URI}/${savedVisit.id}`
          }]
          const text = await readMessage('welcome.txt', details)
          const html = await readMessage('welcome.html', details)
          mailer.sendMail({
            from: 'Luma-Varaukset <noreply@helsinki.fi>',
            to: visit.clientEmail,
            subject: 'Tervetuloa!',
            text,
            html
          })
          event.visits = event.visits.concat(savedVisit._id)
          await event.save()
          return savedVisit
        }
      } catch (error) {
        event.availableTimes = availableTimes
        await event.save()
        await savedVisit.delete()
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }
    },
    /*
----ES___E-----------------EE---- visitin S ja E
----ES___S---E________S----EE---- availableTimes-taulukko
----ES----E...S---E________S----EE---- visit, joka perutaan ...
----ES------------E________S----EE---- uudet mahdolliset
*/
    cancelVisit: async (root, args) => {
      const visit = await Visit.findById(args.id)
      const event = await Event.findById(visit.event)
      let visitStart = new Date(visit.startTime)
      let visitEnd = new Date(visit.endTime)
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)
      visitEnd.setTime(visitEnd.getTime() + 900000)
      visitStart.setTime(visitStart.getTime() - 900000)
      if (visitEnd > eventEnd) visitEnd = eventEnd
      if (visitStart < eventStart) visitStart = eventStart

      const availableTimes = event.availableTimes.map(time => ({
        startTime: new Date(time.startTime),
        endTime: new Date(time.endTime)
      }))

      const findAvailTime = () => {
        let startPoint
        let endPoint
        availableTimes.forEach(time => {
          if (time.startTime.toString() === visitEnd.toString()) {
            endPoint = time.endTime
          }
          if (time.endTime.toString() === visitStart.toString()) {
            startPoint = time.startTime
          }
        })
        if (!startPoint) startPoint = eventStart
        if (!endPoint) endPoint = eventEnd
        return {
          startTime: startPoint,
          endTime: endPoint
        }
      }

      const newAvailTime = findAvailTime()
      const filteredAvailTimes = availableTimes.filter(time => !(time.startTime.toString() === newAvailTime.startTime.toString() || time.endTime.toString() === newAvailTime.endTime.toString()))
      filteredAvailTimes.push(newAvailTime)

      try {
        event.visits = event.visits.filter(v => v.id !== visit.id) //huomaa catch!
        event.availableTimes = filteredAvailTimes
        visit.status = false
        event.booked = false
        await visit.save()
        await event.save()
        return visit
      } catch (error) {
        event.availableTimes = availableTimes
        await event.save()
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }
    },
  }
}

module.exports = resolvers