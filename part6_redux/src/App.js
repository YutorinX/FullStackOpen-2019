import React, { useEffect } from "react"
import NewNote from "./components/NewNotes"
import Notes from "./components/notes"
import VisibilityFilter from "./components/VisibilityFilter"
import { initializeNotes } from "./reducers/noteReducer"
import { connect } from "react-redux"

const App = props => {
  useEffect(() => {
    props.initializeNotes()
  }, [])

  return (
    <div>
      <NewNote />
      <VisibilityFilter />
      <Notes />
    </div>
  )
}

export default connect(null, { initializeNotes })(App)
