const mongoose = require('mongoose')
const { createTestClient } = require('apollo-server-testing')
const { ApolloServer, gql } = require('apollo-server-express')
const bcrypt = require('bcrypt')

const EventModel = require('../models/event')
const VisitModel = require('../models/visit')
const typeDefs = require('../graphql/typeDefs')
const resolvers = require('../graphql/resolvers')

let testEvent2
let savedTestVisit

beforeAll(async () => {
  
  await mongoose.connect(process.env.MONGO_URL,
    { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true })
    .then(() => {
      console.log('connected to test-mongodb')
    })
    .catch((error) => {
      console.log('connection error: ', error.message)
    })

  server = new ApolloServer({
    typeDefs,
    resolvers,
  })
})

beforeEach(async () => {
  await EventModel.deleteMany({})
  await VisitModel.deleteMany({})

  const testEventData1 = {
    title: 'All About Algebra',
    resourceId: 1,
    start: 'Mon Jun 07 2021 09:30:00 GMT+0300 (Eastern European Summer Time)',
    end: 'Thu Jun 10 2021 12:00:00 GMT+0300 (Eastern European Summer Time)'
  }
  
  const testEventData2 = {
    title: 'Up-And-Atom!',
    resourceId: 2,
    start: 'Fri May 21 2021 09:00:00 GMT+0300 (Eastern European Summer Time)',
    end: 'Fri May 21 2021 11:00:00 GMT+0300 (Eastern European Summer Time)'
  }

  const testEvent1 = new EventModel(testEventData1)
  testEvent2 = new EventModel(testEventData2)

  await testEvent1.save()
  await testEvent2.save()
  
  const testVisitData = {
    event: testEvent1,
    pin: 1234,
    gradeId: 1,
    online: true,
    clientName: "Teacher",
    clientEmail: "teacher@school.com",
    clientPhone: "040-1234567"
  }

  const testVisit = new VisitModel(testVisitData)
  savedTestVisit = await testVisit.save()
})

describe('Visit Model Test', () => {
  
    it('teacher can create new visit successfully', async () => {
        
        const newVisitData = {
            event: testEvent2,
            pin: 5678,
            gradeId: 4,
            online: false,
            clientName: "Teacher 2",
            clientEmail: "teacher2@someschool.com",
            clientPhone: "050-8912345"
        }
        const validVisit = new VisitModel(newVisitData)
        const savedVisit = await validVisit.save()
        expect(savedVisit._id).toBeDefined()
        expect(savedVisit.event).toBe(newVisitData.event)
        expect(savedVisit.pin).toBe(newVisitData.pin)
        expect(savedVisit.gradeId).toBe(newVisitData.gradeId)
        expect(savedVisit.online).toBe(newVisitData.online)
        expect(savedVisit.clientName).toBe(newVisitData.clientName)
        expect(savedVisit.clientEmail).toBe(newVisitData.clientEmail)
        expect(savedVisit.clientPhone).toBe(newVisitData.clientPhone)
    })

    it('cannot create visit without required field', async () => {
      const visitWithoutRequiredField = new VisitModel({ pin: 1234 })
      let err
      try {
        const savedVisitWithoutRequiredField = await visitWithoutRequiredField.save()
      } catch (error) {
        err = error
      }
      console.log(err)
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError)
      expect(err.errors.event).toBeDefined()
      expect(err.errors.gradeId).toBeDefined()
      expect(err.errors.online).toBeDefined()
      expect(err.errors.clientName).toBeDefined()
      expect(err.errors.clientEmail).toBeDefined()
      expect(err.errors.clientPhone).toBeDefined()
    })
})

describe('Visit server test', () => {
    it("find by visit id", async () => {
        const { query } = createTestClient(server)
        const id = savedTestVisit.id
        const FIND_VISIT = gql`
        query findVisit($id: ID!) {
          findVisit(id: $id) {
            id
            pin
            event {
              id
            }
            clientName
            clientEmail
            clientPhone
            gradeId
            online
          }
        }
        `
        const  { data } = await query({
          query: FIND_VISIT,
          variables: { id: id }
        })
        const { findVisit } = data
        
        expect(findVisit.id).toBeDefined()
        expect(findVisit.event.id).toBe(savedTestVisit.event.id)
        expect(findVisit.pin).toBe(savedTestVisit.pin)
        expect(findVisit.gradeId).toBe(savedTestVisit.gradeId)
        expect(findVisit.online).toBe(savedTestVisit.online)
        expect(findVisit.clientName).toBe(savedTestVisit.clientName)
        expect(findVisit.clientEmail).toBe(savedTestVisit.clientEmail)
        expect(findVisit.clientPhone).toBe(savedTestVisit.clientPhone)
    })

    it("cancel visit by id and valid pin", async () => {
      const { mutate } = createTestClient(server)
      const id = savedTestVisit.id
      const pin = savedTestVisit.pin
      const CANCEL_VISIT = gql`
        mutation cancelVisit($id: ID!, $pin: Int!) {
          cancelVisit(id: $id, pin: $pin) {
            id
            pin
          }
        }
        `
        const  { data } = await mutate({
          mutation: CANCEL_VISIT,
          variables: { id: id, pin: pin }
        })
        const { cancelVisit } = data
        expect(cancelVisit.id).toBe(savedTestVisit.id)
        expect(cancelVisit.pin).toBe(savedTestVisit.pin)

        const cancelledVisit = await VisitModel.findById(savedTestVisit.id)
        expect(cancelledVisit).toBe(null)
    })

    it("don't cancel visit by id and invalid pin", async () => {
      const { mutate } = createTestClient(server)
      const id = savedTestVisit.id
      const pin = 4321
      const CANCEL_VISIT = gql`
        mutation cancelVisit($id: ID!, $pin: Int!) {
          cancelVisit(id: $id, pin: $pin) {
            id
            pin
          }
        }
        `
      const  data  = await mutate({
        mutation: CANCEL_VISIT,
        variables: { id: id, pin: pin }
      })
      
      expect(data.errors[0].message).toBe('Wrong pin!')

      const cancelledVisit = await VisitModel.findById(savedTestVisit.id)
      expect(cancelledVisit.id).toBe(savedTestVisit.id)
    })
})

afterAll(async () => {
  await EventModel.deleteMany({})
  await VisitModel.deleteMany({})
  await mongoose.connection.close()
  console.log('test-mongodb connection closed')
})