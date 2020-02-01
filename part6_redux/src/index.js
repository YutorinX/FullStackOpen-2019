import React from "react"
import ReactDOM from "react-dom"
import { Provider } from "react-redux"
import App from "./App"
import store from "./store"
// import { createNote } from "./reducers/noteReducer"
// import { filterChange } from "./reducers/filterReducer"
// import noteService from "./services/notes"

// noteService.getAll().then(notes =>
//   notes.forEach(note => {
//     store.dispatch({ type: "NEW_NOTE", data: note })
//   })
// )

// console.log(store.getState())

// store.subscribe(() => console.log(store.getState()))
// store.dispatch(filterChange("IMPORTANT"))
// store.dispatch(
//   createNote("combineReducers forms one reducer from many simple reducers")
// )

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
)
