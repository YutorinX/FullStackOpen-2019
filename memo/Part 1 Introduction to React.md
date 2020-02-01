# Part 1 Introduction to React

---

a. Introduction to React
b. Javascript
c. Component state, event handlers
d. A more complex state, debugging React app

---

## c. Component state, event handlers

JS と React の基本の話、特筆することはあまりない。

配列操作に`concat()`を使って非破壊的にすることは忘れないでおきたい。

イベントハンドラに`somefunc()`を入れるとダメで、`() => somefunc()`ってしないといけないけど
元の`somefunc()`を
`const somefunc = (value) => { return () => console.log(value) }`
みたいにするのもアリ、もしくは
`const somefunc = (val) => () => console.log(val)`
って感じで二重アロー関数（カリー化）にするテクもある

## d. A more complex state, debugging React app

`const [hoge, setHoge] = setState({ left: 0, right: 0 })`で、
`setHoge({ ...hoge, left: left + 1 })`
って感じでスプレッド構文使うのもアリ

カリー化させたものを
`const setToValue = (newValue) => () => { setValue(newValue) }`
`<button onClick={setToValue(0)}>reset</button>`
`<button onClick={setToValue(value + 1)}>increment</button>`
という感じにもできる
