import React, { useEffect } from 'react'
import { useFormik/* , FormikProvider */ } from 'formik'
import { useMutation } from '@apollo/client'
import { CREATE_VISIT } from '../graphql/queries'
import { useHistory } from 'react-router'
import moment from 'moment'

let selectedEvent

const validate = values => {

  const messageIfMissing = 'Vaaditaan!'
  const messageIfTooShort = 'Liian lyhyt!'
  const errors = {}

  if (!values.clientName) {
    errors.clientName = messageIfMissing
  }
  if (values.clientName.length < 5) {
    errors.clientName = messageIfTooShort
  }
  if (!values.schoolName) {
    errors.schoolName = messageIfMissing
  }
  if (values.schoolName.length < 5) {
    errors.schoolName = messageIfTooShort
  }
  if (!values.schoolLocation) {
    errors.schoolLocation = messageIfMissing
  }
  if (!values.clientEmail) {
    errors.clientEmail = messageIfMissing
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.clientEmail)) {
    errors.clientEmail = 'Tarkista sähköpostiosoite!'
  }
  if (!values.verifyEmail || values.verifyEmail !== values.clientEmail) {
    errors.verifyEmail = 'Sähköpostit eivät täsmää!'
  }
  if (!values.clientPhone) {
    errors.clientPhone = messageIfMissing
  }
  if (!values.visitGrade) {
    errors.visitGrade = messageIfMissing
  }
  if (!values.participants) {
    errors.participants = messageIfMissing
  }
  if ((values.visitMode === 0) && (selectedEvent.inPersonVisit && selectedEvent.remoteVisit)) {
    errors.location = 'Valitse joko etä- tai lähivierailu!'
  }
  if(!values.privacyPolicy){
    errors.privacyPolicy = 'Hyväksy tietosuojailmoitus!'
  }
  if(!values.remoteVisitGuidelines){
    errors.remoteVisitGuidelines = 'Luethan ohjeet!'
  }
  return errors
}

const VisitForm = ({ sendMessage, event, currentUser }) => {
  selectedEvent = event
  const history = useHistory()
  selectedEvent = event
  if (!event) {
    history.push('/')
  }
  const grades = [
    { value: 1, label: 'Varhaiskasvatus' },
    { value: 2, label: '1.-2. luokka' },
    { value: 3, label: '3.-6. luokka' },
    { value: 4, label: '7.-9 luokka' },
    { value: 5, label: 'toinen aste' }
  ]

  const filterEventGrades = (eventGrades) => {
    const gradesArrays = eventGrades.map(g => grades[g].label)
    return gradesArrays.join(', ')
    /* const returnArray = []
    eventGrades.forEach(availableGrade => {
      grades.forEach(grade => {
        if (availableGrade === grade.value) {
          returnArray.push({ value: grade.value, label: grade.label })
        }
      })
    })
    return returnArray */
  }

  const classes = [
    { value: 1, label: 'SUMMAMUTIKKA' },
    { value: 2, label: 'FOTONI' },
    { value: 3, label: 'LINKKI' },
    { value: 4, label: 'GEOPISTE' },
    { value: 5, label: 'GADOLIN' }
  ]

  const filterEventClass = (eventClasses) => {
    const classesArray = eventClasses.map(c => classes[c].label)
    return classesArray.join(', ')
  }

  const [create, result] = useMutation(CREATE_VISIT, {
    onError: (error) => {
      if (error.message === 'File not found') {
        sendMessage('Vahvistusviestin lähettäminen epäonnistui! Vierailun varaaminen ei onnistunut.', 'danger')
      } else {
        sendMessage('Annetuissa tiedoissa on virhe! Vierailun varaaminen ei onnistunut.', 'danger')
      }
      console.log('virheviesti: ', error, result)
    }
  })

  const cancel = (event) => {
    event.preventDefault()

    history.push('/')
  }

  const formik = useFormik({

    initialValues: {
      clientName: '',
      schoolName: '',
      visitMode: '0',
      /* remoteVisit: false,
      inPersonVisit: false, */
      schoolLocation: '',
      clientEmail: '',
      verifyEmail: '',
      clientPhone: '',
      visitGrade: '',
      participants: '',
      privacyPolicy: false,
      remoteVisitGuidelines: false,
      dataUseAgreement: false,
      username: ''
    },
    validate,
    onSubmit: values => {
      try {
        if (currentUser) {
          formik.setFieldValue('username', currentUser.username)
        }
        const remoteVisit = (values.visitMode === '0')? event.remoteVisit : (values.visitMode === '1') ? true : false
        const inPersonVisit = (values.visitMode === '0')? event.inPersonVisit : (values.visitMode === '2') ? true : false
        create({
          variables: {
            event: event.id,
            clientName: values.clientName,
            schoolName: values.schoolName,
            remoteVisit: remoteVisit,
            inPersonVisit: inPersonVisit,
            schoolLocation: values.schoolLocation,
            startTime: event.start,
            endTime: event.end,
            clientEmail: values.clientEmail,
            clientPhone: values.clientPhone,
            grade: values.visitGrade,
            participants: values.participants,
            username: values.username
          }
        })
      } catch (error) {
        sendMessage('Varauksen teko epäonnistui.', 'danger')
      }
    },
  })

  const style = { width: 500 }
  useEffect(() => {
    if (result.data) {
      console.log('result', result)
      sendMessage(`Varaus on tehty onnistuneesti! Varauksen tiedot on lähetetty sähköpostiosoitteeseenne ${result.data.createVisit.clientEmail}.`, 'success')
      history.push('/' + result.data.createVisit.id)
    }
  }, [result.data])

  if (event) {
    const eventGrades = filterEventGrades(event.grades)
    const eventClass = filterEventClass(event.resourceids)
    return (
      <div className="container">
        <div className="columns is-centered">
          <div className="section">
            <div className="title">Varaa vierailu </div>
            <div>
              <p>Tapahtuman tiedot:</p>
              <p>Nimi: {event.title}</p>
              <p>Kuvaus: [Tähän tapahtuman kuvaus]</p>
              <p>Tiedeluokka: {eventClass}</p>
              <p>Valittavissa olevat lisäpalvelut: [Tähän ekstrat]</p>
              <div>Tarjolla seuraaville luokka-asteille: {eventGrades}
              </div>
              <div>Tapahtuma tarjolla:
                {event.inPersonVisit ? <p>Lähiopetuksena</p> : <></>}
                {event.remoteVisit ? <p>Etäopetuksena</p> : <></>}
              </div>
              <p>Tapahtuma alkaa: {moment(event.start).format('DD.MM.YYYY, HH:mm')}</p>
              <p>Tapahtuma päättyy: {moment(event.end).format('DD.MM.YYYY, HH:mm')}</p>
            </div>

            <br />
            <h1>Syötä varauksen tiedot</h1>

            <form onSubmit={formik.handleSubmit}>

              <div>{event.inPersonVisit && event.remoteVisit ? (
                <div className="field">
                  <div id="radio-group">Valitse etä- tai lähiopetus</div>
                  <div className="control">
                    <label className="visitMode">
                      <input
                        type="radio" name="visitMode" value="1" /* checked = {formik.values.visitMode} */
                        onChange={() => {
                          formik.touched.visitMode = true
                          formik.setFieldValue('visitMode', '1')
                        }} /> Etävierailu
                    </label>
                  </div>
                  <div className="control">
                    <label className="visitMode">
                      <input type="radio" name="visitMode" value="2" /* checked={!formik.values.visitMode} */
                        onChange={() => {
                          formik.touched.visitMode = true
                          formik.setFieldValue('visitMode', '2')
                        }} /> Lähivierailu
                    </label>
                  </div>
                </div>
              ) : null}
              {formik.touched.clientName && formik.errors.location ? (
                <p className="help is-danger">{formik.errors.location}</p>
              ) : null}
              </div>


              <div className="field">
                <label htmlFor="clientName">Varaajan nimi </label>
                <div className="control">

                  <input style={style}
                    id="clientName"
                    name="clientName"
                    type="clientName"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.clientName}
                  />
                </div>
              </div>
              {formik.touched.clientName && formik.errors.clientName ? (
                <p className="help is-danger">{formik.errors.clientName}</p>
              ) : null}

              <div className="field">
                <label htmlFor="schoolName">Oppimisyhteisön nimi </label>
                <div className="control">
                  <input style={{ width: 300 }}
                    id="schoolName"
                    name="schoolName"
                    type="schoolName"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.schoolName}
                  />
                </div>
              </div>
              {formik.touched.schoolName && formik.errors.schoolName ? (
                <p className="help is-danger">{formik.errors.schoolName}</p>
              ) : null}

              <div className="field">
                <label htmlFor="schoolLocation">Oppimisyhteisön paikkakunta </label>
                <div className="control">
                  <input style={{ width: 300 }}
                    id="schoolLocation"
                    name="schoolLocation"
                    type="schoolLocation"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.schoolLocation}
                  />
                </div>
              </div>
              {formik.touched.schoolLocation && formik.errors.schoolLocation ? (
                <p className="help is-danger">{formik.errors.schoolLocation}</p>
              ) : null}

              <div className="field">
                <label htmlFor="clientEmail">Varaajan sähköpostiosoite </label>
                <div className="control">
                  <input style={style}
                    id="clientEmail"
                    name="clientEmail"
                    type="email"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.clientEmail}
                  />
                </div>
                {formik.touched.clientEmail && formik.errors.clientEmail ? (
                  <p className="help is-danger">{formik.errors.clientEmail}</p>
                ) : null}
              </div>

              <div className="field">
                <label htmlFor="verifyEmail">Sähköpostiosoite uudestaan </label>
                <div className="control">
                  <input style={{ width: 300 }}
                    id="verifyEmail"
                    name="verifyEmail"
                    type="email"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.verifyEmail}
                  />
                </div>
                {formik.touched.verifyEmail && formik.errors.verifyEmail ? (
                  <p className="help is-danger">{formik.errors.verifyEmail}</p>
                ) : null}
              </div>

              <div className="field">
                <label htmlFor="clientPhone">Varaajan puhelinnumero </label>
                <div className="control">

                  <input style={style}
                    id="clientPhone"
                    name="clientPhone"
                    type="clientPhone"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.clientPhone}
                  />
                </div>
              </div>
              {formik.touched.clientPhone && formik.errors.clientPhone ? (
                <p className="help is-danger">{formik.errors.clientPhone}</p>
              ) : null}

              <div className="field">
                <label htmlFor="visitGrade">Luokka-aste/kurssi </label>
                <div className="control">
                  <input style={{ width: 300 }}
                    id="visitGrade"
                    name="visitGrade"
                    type="visitGrade"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.visitGrade}
                  />
                </div>
              </div>
              {formik.touched.visitGrade && formik.errors.visitGrade ? (
                <p className="help is-danger">{formik.errors.visitGrade}</p>
              ) : null}

              <div className="field">
                <label htmlFor="participants">Osallistujamäärä </label>
                <div className="control">
                  <input style={{ width: 300 }}
                    id="participants"
                    name="participants"
                    type="number"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.participants}
                  />
                </div>
              </div>
              {formik.touched.participants && formik.errors.participants ? (
                <p className="help is-danger">{formik.errors.participants}</p>
              ) : null}

              <div className="field">
                <div id="checkbox-group"></div>
                <div className="control">
                  <label className="privacyPolicy">
                    <input
                      type="checkbox" name="privacyPolicy" checked = {formik.values.privacyPolicy}
                      onChange={() => {
                        formik.touched.privacyPolicy = !formik.values.privacyPolicy
                        formik.setFieldValue('privacyPolicy', !formik.values.privacyPolicy)
                      }} /> Hyväksyn, että tietoni tallennetaan ja käsitellään <a href="https://www2.helsinki.fi/fi/tiedekasvatus/tietosuojailmoitus-opintokaynnit" target="_blank" rel="noopener noreferrer">tietosuojailmoituksen</a> mukaisesti.
                  </label>
                </div>
              </div>
              {formik.touched.privacyPolicy && formik.errors.privacyPolicy ? (
                <p className="help is-danger">{formik.errors.privacyPolicy}</p>
              ) : null}

              <div className="field">
                <div id="checkbox-group"></div>
                <div className="control">
                  <label className="dataUseAgreement">
                    <input
                      type="checkbox" name="dataUseAgreement" checked = {formik.values.dataUseAgreement}
                      onChange={() => {
                        formik.touched.dataUseAgreement = !formik.values.dataUseAgreement
                        formik.setFieldValue('dataUseAgreement', !formik.values.dataUseAgreement)
                      }} /> Hyväksyn, että antamiani tietoja voidaan hyödyntää tutkimuskäytössä.
                  </label>
                </div>
              </div>

              <div className="field">
                <div id="checkbox-group"></div>
                <div className="control">
                  <label className="remoteVisitGuidelines">
                    <input
                      type="checkbox" name="remoteVisitGuidelines" checked = {formik.values.remoteVisitGuidelines}
                      onChange={() => {
                        formik.touched.remoteVisitGuidelines = !formik.values.remoteVisitGuidelines
                        formik.setFieldValue('remoteVisitGuidelines', !formik.values.remoteVisitGuidelines)
                      }} /> Olen lukenut <a href="https://www2.helsinki.fi/fi/tiedekasvatus/opettajille-ja-oppimisyhteisoille/varaa-opintokaynti">etäopintokäyntien ohjeistuksen</a> ja hyväksyn käytänteet.
                  </label>
                </div>
              </div>
              {formik.touched.remoteVisitGuidelines && formik.errors.remoteVisitGuidelines ? (
                <p className="help is-danger">{formik.errors.remoteVisitGuidelines}</p>
              ) : null}

              <button id="create" className="button luma primary" type='submit'>Tallenna</button>
              <button className="button luma" onClick={cancel}>Poistu</button>

            </form>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div>Tapahtumaa haetaan...</div>
  )
}
export default VisitForm