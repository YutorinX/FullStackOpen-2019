import React from "react"
import { connect } from "react-redux"
import Note from "./note"
import { toggleImportanceOf } from "../reducers/noteReducer"

const Notes = props => {
  return (
    <ul>
      {props.visibleNotes.map(note => (
        <Note
          key={note.id}
          note={note}
          handleClick={() => props.toggleImportanceOf(note.id)}
          // props.store.dispatch(toggleImportanceOf(note.id))と同じ
        />
      ))}
    </ul>
  )
}

const notesToShow = ({ notes, filter }) => {
  if (filter === "ALL") {
    return notes
  }
  return filter === "IMPORTANT"
    ? notes.filter(note => note.important)
    : notes.filter(note => !note.important)
}

const mapStateToProps = state => {
  return {
    visibleNotes: notesToShow(state)
  }
}

const mapDispatchToProps = {
  toggleImportanceOf
}

const ConnectedNotes = connect(mapStateToProps, mapDispatchToProps)(Notes)
export default ConnectedNotes
