import React, { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useHistory } from 'react-router'
import { EXTRAS, CREATE_EXTRA, DELETE_EXTRA } from '../../graphql/queries'
import AddExtraForm from './AddExtraForm'

const ExtrasAdmin = ({ sendMessage }) => {
  const extras = useQuery(EXTRAS)
  const history = useHistory()
  const [showForm, setShowForm] = useState(false)

  const cancel = (event) => {
    event.preventDefault()

    history.push('/')
  }

  const [createExtra, result] = useMutation(CREATE_EXTRA, {
    refetchQueries: [{ query: EXTRAS }],
    onError: (error) => {
      console.log('virheviesti: ', error, result)
    }
  })

  const [deleteExtra, result2] = useMutation(DELETE_EXTRA, {
    refetchQueries: [{ query: EXTRAS }],
    onError: (error) => {
      console.log('virheviesti: ', error, result2)
    }
  })

  const handleAdd = (values) => {
    createExtra({
      variables: {
        ...values
      }
    })
      .then(() => sendMessage('Lisäpalvelu lisätty.', 'success'))
      .catch(() => sendMessage('Palvelinvirhe', 'danger'))
    setShowForm(false)
  }

  const handleRemove = (id) => {
    deleteExtra({
      variables: {
        id
      }
    })
      .then(() => sendMessage('Lisäpalvelu poistettu.', 'success'))
      .catch(() => sendMessage('Palvelinvirhe', 'danger'))
  }
  if (extras.loading) return <></>

  return (
    <div className="section">
      <h1 className="title">LISÄPALVELUT</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Nimi</th>
            <th>Kesto lähi</th>
            <th>Kesto etä</th>
            <th>SUM</th>
            <th>FOT</th>
            <th>LIN</th>
            <th>GEO</th>
            <th>GAD</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {extras.data.getExtras.map(extra => (
            <tr key={extra.id}>
              <td>{extra.name}</td>
              <td>{extra.inPersonLength}</td>
              <td>{extra.remoteLength}</td>
              <td>{extra.classes.includes(1) ? 'X' : ''}</td>
              <td>{extra.classes.includes(2) ? 'X' : ''}</td>
              <td>{extra.classes.includes(3) ? 'X' : ''}</td>
              <td>{extra.classes.includes(4) ? 'X' : ''}</td>
              <td>{extra.classes.includes(5) ? 'X' : ''}</td>
              <td><button className='button luma' onClick={() => handleRemove(extra.id)}>Poista</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="field is-grouped">
        <div className="control">
          <button className="button luma primary" onClick={() => setShowForm(!showForm)}>Lisää uusi</button>
        </div>
        <div className="control">
          <button className="button luma" onClick={cancel}>Poistu</button>
        </div>
      </div>
      <div className="content">
        {showForm && <AddExtraForm handleAdd={handleAdd}/>}
      </div>
    </div>
  )
}

export default ExtrasAdmin