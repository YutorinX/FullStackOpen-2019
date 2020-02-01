import { createStore, combineReducers, applyMiddleware } from "redux"
import thunk from "redux-thunk"
import { composeWithDevTools } from "redux-devtools-extension"

import filterReducer from "./reducers/filterReducer"
import noteReducer from "./reducers/noteReducer"

const reducer = combineReducers({
  notes: noteReducer,
  filter: filterReducer
})
// redux-thunkはミドルウェアなのでストアの初期化と同時に初期化する必要がある
const store = createStore(reducer, composeWithDevTools(applyMiddleware(thunk)))

export default store
