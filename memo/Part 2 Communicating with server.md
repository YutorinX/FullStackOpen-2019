# Part.2 Communicating with server

---

a. Rendering a collection, modules
b. Forms
c. Getting data from server
d. Altering data in server
e. Adding styles to React app

---

配列を map して増やすとき、フラグが立ってるときにフィルタして作るみたいな手もある

`const notes = [h0ge, huga, hello]`

`const notesToShow = showAll ? notes : notes.filter(note => note.important)`
`note.important`は`note.important === true`と同義

`const rows = () => notesToShow.map(note => <Note key={note.id} note={note} /> )`

---

イベントの順序を理解することは重要！
