import React from 'react'
import {
  useEventReducer,
  useExtraReducer,
  useFormReducer,
  useGroupReducer,
  userMiscReducer,
  useUserReducer,
  useVisitReducer
} from './hooks/reducers'
import {
  useEventService,
  useExtraService,
  useFormService,
  useGroupService,
  useMiscService,
  useUserService,
  useVisitService
} from './hooks/services'
import PropTypes from 'prop-types'

export const LumaContext = React.createContext()

const Cache = ({ children }) => {
  const reducers = {
    userReducer: useUserReducer(),
    groupReducer: useGroupReducer(),
    formReducer: useFormReducer(),
    extraReducer: useExtraReducer(),
    visitReducer: useVisitReducer(),
    eventReducer: useEventReducer(),
    // if misc becomes too large consider to add new reducers
    miscReducer: userMiscReducer(),
  }
  // Why we are defining services this way?
  // We don't want to prevent services to use other parts of the cache
  // Still for example avoid using "visitReducer" in "events" service because it breaks modularity
  const services = {
    users: useUserService({ userReducer: reducers.userReducer, reducers }),
    groups: useGroupService({ groupReducer: reducers.groupReducer, reducers }),
    forms: useFormService({ formReducer: reducers.formReducer, reducers }),
    extras: useExtraService({ extraReducer: reducers.extraReducer, reducers }),
    visits: useVisitService({ visitReducer: reducers.visitReducer, reducers }),
    events: useEventService({ eventReducer: reducers.eventReducer, reducers }),
    misc: useMiscService({ miscReducer: reducers.miscReducer, reducers })
  }

  return (
    <LumaContext.Provider value={{ services }}>
      {children}
    </LumaContext.Provider>
  )
}

export default Cache

Cache.propTypes = {
  children: PropTypes.node.isRequired
}
