# Part 6 State management with Redux

a Flux-architecture and Redux
b Many reducers, connect
c Communicating with server in a redux application

## a. Flux-architecture and Redux

![Flux-arcitecture](https://facebook.github.io/flux/img/overview/flux-simple-f8-diagram-explained-1300w.png)

全ての state は store の一つの JS オブジェクトに保存される。
この state は actions のオブジェクトによって変更される、action はこんな感じ ↓。

```jsx
{
  type: "INCREMENT"
}
```

アプリの state に対する action の影響を reducer を使用して定義する。これは、現在の state と aciton をパラメータとして与えられる関数で、新しい state を返す。

```jsx
const counterReducer = (state = 0, action) => {
  switch (action.type) {
    case "INCREMENT":
      return state + 1
    case "DECREMENT":
      return state - 1
    case "ZERO":
      return 0
    default:
      // if none of the above matches, code comes here
      return state
  }
}
```

これは、アプリから直接呼ばれるわけではなく、Store を作る createStore ファンクションのパラメータとしてのみ指定される。

```jsx
import { createStore } from "redux"
const counterReducer = (state = 0, action) => {
  // ...
}
const store = createStore(counterReducer)
```

actions は dispatch で store に”ディスパッチ”もしくは送信される。

`store.dispatch({type: 'INCREMENT'})`

`store.getState()`で中身を受け取れる。

`store.subscribe(() => console.log(sotre.getState()))`をすると、store が変化するたびにその中身の関数が実行される。例はコンソールに現在の State を出している。
実際のコードにも、再レンダリングするために subscribe して ↓ のようにする必要がある。

```jsx
const renderApp = () => {
  ReactDOM.render(<App />, document.getElementById("root"))
}
renderApp()
store.subscribe(renderApp)
```

Reducer は不変関数として使用するべきで、それを確認するために`deep-freeze`を dev で入れる。

`Uncontrolled Components`の話、詳細は`index.js`を見て。

### Action creators

React コンポーネントは Redux の action タイプと Form について知る必要はなく、それをする action に分けるとなお良い。
そういう action を作る関数を action creator という。

小さくコンポーネントを分ける際、子に props で store を渡すのが簡単。

## b. Many reducers, connect

同じ State に複数状態をまとめるけど、中身はそれぞれ違う Reducer に任せたほうが良い。
その場合、最上位で`combineReducers`を使って組み合わせる必要がある
これをすることで、同じ State だけど自動的に notes は notes の中のみ触れるようになる。

```jsx
const reducer = combineReducers({
  notes: noteReducer,
  filter: filterReducer
})
const store = createStore(reducer)
```

### Connect

コンポーネントに Redux の Store を渡さないといけないけど、面倒くさいから`React-Redux`を使うと良い
最上位の`index.js`で`Provider`コンポーネントを App コンポーネントの上に Wrap し、store を受け取る必要がある。
これで最上位コンポーネントを render()させたり、subscribe()させる必要がなくなる

```jsx
ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
)
```

また、受け取るコンポーネントも Connected コンポーネントに変換する必要がある。
また、メモのリストと Redux ストアを通した値が必要。第一引数として`mapStateToProps`を取る、Redux の state に基づいて接続コンポーネントの props を定義するもの。

```jsx
const Notes = props => {
  // ...
}
const mapStateToProps = state => {
  return {
    notes: state.notes,
    filter: state.filter
  }
}
const ConnectedNotes = connect(mapStateToProps)(Notes)
export default ConnectedNotes
```

という感じで、`Notes`は`props.notes`で直接参照できる。状態変更には引き続き Dispatch を使う。
が、`props.store`はもう存在しないため、`mapDispatchToProps`を定義して接続コンポーネントに props として Action Creator 関数を渡す。

```jsx
;<Note //...
  handleClick={() => props.toggleImportanceOf(note.id)}
/>
const mapDispatchToProps = {
  toggleImportanceOf
}
const ConnectedNotes = connect(mapStateToProps, mapDispatchToProps)(Notes)
```

NewNote も、末尾をこんな感じにする。ストアにアクセスする必要が無いので null で OK。
また、ActionCreator(createNote)も Reducer から取得しているが、直接参照せず、props に渡してからやるべし。
これは、connect によって追加された store への追加の Dispatch も含まれるため。

```jsx
props.createNote(event.target.note.value)
// ...
connect(null, { createNote })(NewNote)
```

![Difference of createNote between props.createNote](https://fullstackopen.com/static/2024b1b4b07fb928e48d576bb2d7e646/14be6/10.png)

### Alternative way of using mapDispatchToProps

mapDipatchToProps は JS オブジェクトだから、｛｝で中身だけ渡しても OK、ただ、これに渡される関数は action creators（Redux Action を渡すもの）じゃないといけない

こういうふうに定義も出来るが、Dispatch された action がコンポーネントの Props を見ないと行けない場合などは必要になる、が複雑なのでいらんかも

```jsx
const mapDispatchToProps = dispatch => {
  return {
    createNote: value => {
      dispatch(createNote(value))
    }
  }
}
export default connect(null, mapDispatchToProps)(NewNote)
```

### Presentational/Container revisited

mapStateToProps によって state に渡されるものを、関数によって選別するものをセレクターと呼ぶ

```jsx
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
```

こうしてロジックをコンポーネントの外に出すことによって、View だけにするのが Presentational component
ロジックだけ固めたものが Container Component.
こうやって分けることで、Screenshot Regression Tests が出来る

High Order Components,HOCs は普通のコンポーネントを受けて、普通のコンポーネントを返す関数。

## C. Communicating with server in a redux application

pt2 でやった`json-server`で DB サーバを立ち上げて、`service/notes.js`に axios で受け取るメソッドを書く。
それを`index.js`で getall()させた配列を forEach で NEW_NOTE を Dispatch させる。

```js
noteService.getAll().then(notes =>
  notes.forEach(note => {
    store.dispatch({ type: "NEW_NOTE", data: note })
  })
)
```

または、初期化させる INIT_NOTES を加える

```js
// noteReducer.js
switch (action.type) {
    // ...
    case 'INIT_NOTES':
      return action.data
    // ...
export const initializeNotes = (notes) => {
  return {
    type: 'INIT_NOTES',
    data: notes,
  }}

//App.js
import { connect } from 'react-redux'
// ...
noteService.getAll().then(notes =>
  store.dispatch(initializeNotes(notes))
)
// ...
export default connect(null, { initializeNotes })(App)
```

`index.js`でもいけるが、`App.js`で Effect Hook を使ったほうがいい、ActionCreator を使うためには`connect`メソッドが必要になる。
`initializeNotes`を props にすることで、`dispatch`メソッドは必要ない。
post する`createNew`を service/notes に入れ、NoteForm の`addNote`に`newNote`を createNew を使って作る。

---

サーバとの通信をコンポーネントの中で行われるよりは、Action Creator をコンポーネントから呼び出すだけにするほうが良い

```js
const App = (props) => {
  useEffect(() => {
    props.initializeNotes(notes)
  },[])
  // ...}

// NewNotes.js
const NewNote = props => {
  const addNote = async event => {
    event.preventDefault()
    const content = event.target.note.value
    event.target.note.value = ""
    props.createNote(content)
  }
  // ...
```

このように、バックグラウンドで発生しているサーバとの通信を気にする必要がなく、props で降りてきたものだけを使用するようにする。
そのために、`redux-thunk`を入れて非同期アクションを作れるようにする。
redux-thunk はミドルウェアなのでストアの初期化と同時に初期化する必要がある
それのおかげで、dispatch メソッドをパラメーターとして持つ関数を返せる。

```js noteReducer.js
export const initializeNotes = () => {
  return async dispatch => {
    const notes = await noteService.getAll()
    dispatch({
      type: "INIT_NOTES",
      data: notes
    })
  }
}
```

サーバから全ての notes を fetch し、action に notes を Dispatch してストアに追加する。

### Redux Devtool

ブラウザ拡張だったり、`redux-devtools-extention`っていうライブラリもある。
さっきの applyMiddleware(thunk)を compoweWithDevTools の引数に入れると使える。

### 終わりに

React は View の生成にのみ焦点を当てるもので、アプリケーションの state は Redux とその action とその reducers に渡される。
もちろんバリデーションなどフォームへの入力がフォームの入力時にのみ関連するなら、State の管理をコンポーネントに任せるのが良い。
