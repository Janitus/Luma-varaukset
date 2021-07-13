const mongoose = require('mongoose')

const Event = require('../models/event')
const Visit = require('../models/visit')
const { eventDayAfter, eventDayBefore, eventNow, details } = require('./testData')
const { sendReminder, sendThanks } = require('../utils/mailSender')
const { sub } = require('date-fns')

let dayBeforeVisit
let cancelledDayAfterVisit
let dayAfterVisit
let eventTodayVisit
let cancelledEventTodayVisit

beforeAll(async () => {

  await mongoose.connect(process.env.MONGO_URL,
    { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false })
    .then(() => {
      console.log('connected to test-mongodb')
    })
    .catch((error) => {
      console.log('connection error: ', error.message)
    })

})

beforeEach(async () => {
  await Event.deleteMany({})
  await Visit.deleteMany({})

  const dayBefore = new Event(eventDayBefore)
  const dayAfter = new Event(eventDayAfter)
  const eventToday = new Event(eventNow)
  await dayBefore.save()
  await dayAfter.save()
  await eventToday.save()

  dayBeforeVisit = new Visit({
    ...details,
    event: dayBefore,
    status: true,
    startTime: new Date(dayBefore.start).toISOString(),
    endTime: new Date(dayBefore.end).toISOString()
  })

  dayAfterVisit = new Visit({
    ...details,
    event: dayAfter,
    status: true,
    startTime: new Date(dayAfter.start).toISOString(),
    endTime: sub(new Date(dayAfter.end), { hours: 3 }).toISOString()
  })

  eventTodayVisit = new Visit({
    ...details,
    event: eventToday,
    status: true,
    startTime: sub(new Date(eventToday.start), { hours: 3 }).toISOString(),
    endTime: new Date(eventToday.end).toISOString()
  })

  cancelledEventTodayVisit = new Visit({
    ...details,
    event: eventToday,
    status: false,
    startTime: new Date(eventToday.start).toISOString(),
    endTime: sub(new Date(eventToday.end), { hours: 3 }).toISOString()
  })

  cancelledDayAfterVisit = new Visit({
    ...details,
    event: dayAfter,
    status: false,
    startTime: sub(new Date(dayAfter.end), { hours: 3 }).toISOString(),
    endTime: new Date(dayAfter.end).toISOString()
  })

  await cancelledEventTodayVisit.save()
  await cancelledDayAfterVisit.save()
  await dayBeforeVisit.save()
  await dayAfterVisit.save()
  await eventTodayVisit.save()
})

describe('Visit reminders', () => {
  it('without cancellation are send properly', async () => {
    const { success } = await sendReminder()
    expect(success.length).toBe(1)
    expect(success[0]._id).toEqual(dayAfterVisit._id)
  })

  it('with cancellation aren\'t send', async () => {
    const { failed } = await sendReminder()
    expect(failed.length).toBe(1)
    expect(failed[0]._id).toEqual(cancelledDayAfterVisit._id)
  })
})

describe('Visit thank you message', () => {
  it('without cancellation are send properly', async () => {
    const { success } = await sendThanks()
    expect(success.length).toBe(1)
    expect(success[0]._id).toEqual(eventTodayVisit._id)
  })

  it('with cancellation aren\'t send', async () => {
    const { failed } = await sendThanks()
    expect(failed.length).toBe(1)
    expect(failed[0]._id).toEqual(cancelledEventTodayVisit._id)
  })
})

afterAll(async () => {
  await Event.deleteMany({})
  await Visit.deleteMany({})
  await mongoose.connection.close()
  console.log('test-mongodb connection closed')
})