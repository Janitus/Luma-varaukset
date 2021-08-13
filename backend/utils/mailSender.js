
const { add, set } = require('date-fns')
const Visit = require('../models/visit')
const mailer = require('../services/mailer')
const Email = require('../models/email')
const { fillStringWithValues } = require('./helpers')

const sendReminder = async () => {
  const mail = await Email.findOne({ name: 'reminder' })
  if (!mail) return null
  const start = add(set(new Date(), { hours: 5, minutes: 0, seconds: 0, milliseconds: 0 }), { days: 1 })
  const end = add(set(new Date(), { hours: 23, minutes: 0, seconds: 0, milliseconds: 0 }), { days: 1 })
  const visits = await Visit.find({
    startTime: {
      $gte: start.toISOString(),
      $lt: end.toISOString()
    }
  })
  const report = {
    success: [],
    failed: []
  }

  for (let visit of visits) {
    try {
      if (visit.status) {
        await mailer.sendMail({
          from: 'Luma-Varaukset <noreply@helsinki.fi>',
          to: visit.clientEmail,
          subject: mail.subject,
          text: fillStringWithValues(mail.text),
          html: fillStringWithValues(mail.html)
        })
        report.success.push(visit)
      } else {
        report.failed.push(visit)
      }
    } catch (error) {
      console.log(error)
      report.failed.push(visit)
    }
  }
  return report
}

const sendThanks = async () => {
  const mail = await Email.findOne({ name: 'thanks' })
  if (!mail) return null
  const start = set(new Date(), { hours: 5, minutes: 0, seconds: 0, milliseconds: 0 })
  const end = set(new Date(), { hours: 23, minutes: 0, seconds: 0, milliseconds: 0 })
  const visits = await Visit.find({
    endTime: {
      $gte: start.toISOString(),
      $lt: end.toISOString()
    }
  })
  const report = {
    success: [],
    failed: []
  }

  for (let visit of visits) {
    try {
      if (visit.status) {
        await mailer.sendMail({
          from: 'Luma-Varaukset <noreply@helsinki.fi>',
          to: visit.clientEmail,
          subject: mail.subject,
          text: fillStringWithValues(mail.text),
          html: fillStringWithValues(mail.html)
        })
        report.success.push(visit)
      } else {
        report.failed.push(visit)
      }
    } catch (error) {
      console.log(error)
      report.failed.push(visit)
    }
  }
  return report
}

module.exports = { sendReminder, sendThanks }