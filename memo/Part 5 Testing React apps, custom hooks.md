# Part 5 Testing React apps, custom hooks

条件付きレンダリング

```js
user === null && loginForm()
```

ローカルストレージ

```js
window.localStorage.setItem("name", "juha tauriainen")
```

## b

React コンポーネントは開始タグ終了タグで囲める。
それを`props.children`で受け取れる。

```jsx
  const noteFormRef = React.createRef()
  ///
  <Togglable buttonLabel="new note" ref={noteFormRef}>
```

子要素のメソッドを親要素から呼び出すには、ref を使う。
子コンポーネントを、`const Togglable = React.forwardRef((props, ref) => {...})`という感じにして、
React の`useImperatibeHandle`Hooks を中で起動させる

```jsx
useImperativeHandle(ref, () => {
  return {
    toggleVisibility
  }
})
```

って感じで。
そうすると、親コンポーネントで`noteFormRef.current.toggleVisibility()`で起動できる。

```jsx
const Togglable = () => {...
  // ...
}
```

を

```jsx
<div>
  <Togglable buttonLabel="1" ref={togglable1}>
    first
  </Togglable>

  <Togglable buttonLabel="2" ref={togglable2}>
    second
  </Togglable>

  <Togglable buttonLabel="3" ref={togglable3}>
    third
  </Togglable>
</div>
```

で、3 つのインスタンスに増やすみたいな例、便利。

`PropTypes`パッケージで、コンポーネントの prop の型や必要かどうかを強制出来る。けど TS でいいんじゃね？

## C. Testing React Apps

テストには`Jest`と、Hook に対応する`react-testing-library`を使う
`npm install --save-dev @testing-library/react @testing-library/jest-dom`

事前準備（テストコンポーネントを用意した後）、testing Library の`.render()`内でコンポーネントをレンダリングして、それの中身が合うかどうかを expect させる

`yarn run test`させると、Test するが、一生監視してくるのでそれが嫌だったら`CI=true yarn run test`をする。

`render()`させたコンポーネントを`component.debug()`させると、それの HTML コードがコンソールに出る

細かいところを見たかったら、`-library/dom`の`prettyDOM(要素)`を`log()`で起動すると、それもコンソールに出せる

`jest.fn()`でモックハンドラを用意して、それを登録した要素を`fireEvent.click(buttonとか要素)`でボタンをクリックするテストができる、`mockHandler.mock.calls.length).tobe(1)`とかいう感じで

`expect().toHaveStyle(CSSスタイル)`で CSS スタイルを認識できる
`nth-child`とか、順番で見つけるのは良くないので、`getByText()`みたいにテキストに基づいて要素を探したほうが良い。

### Form

`NoteForm.test.js`
フォームは親コンポーネントと状態を同期させるものだから、それを Wrap するヘルパー Wrapper コンポーネントを作る。

### 統合テスト

`setupTests.js`でローカルストレージのモックを用意する。
`src/services/`に`__mocks__`というフォルダを作り、ハードコードされた Promise を返す`notes.js`ファイルを作る。

`App.test.js`で、`jest.mock("./services/notes)`って感じで呼び出す。

`yarn run --coverage`でテストがどれくらいカバーできているかを表示する。
`coverage/Icov-report`に HTML で出力されて見れる

- Snapshot とかいうテスト書かないでも良い便利なやつがある、後で見る

- E2E(end-to-end)テストは、Selenium,headless-browser などで行う。がそこそこ重い

## d. Custom hooks

Custom Hooks の目的は、コンポーネントで利用されるロジックの再利用を促進すること。
例えばこんな感じ

```jsx
const useCounter = () => {
  const [value, setValue] = useState(0)

  const increase = () => {
    setValue(value + 1)
  }

  const decrease = () => {
    setValue(value - 1)
  }

  const zero = () => {
    setValue(0)
  }

  return {
    value,
    increase,
    decrease,
    zero
  }
}
```

でこういうふうに使う

```jsx
const counter = useCounter()

return (
  <div>
    <div>{counter.value}</div>
    <button onClick={counter.increase}>plus</button>
    <button onClick={counter.decrease}>minus</button>
    <button onClick={counter.zero}>zero</button>
  </div>
)
```

またはこういうふうに再利用をする。

```jsx
const left = useCounter()
const right = useCounter()

return (
  <div>
    {left.value}
    <button onClick={left.increase}>left</button>
    <button onClick={right.increase}>right</button>
    {right.value}
  </div>
)
```

別の例では

```jsx
const useField = type => {
  const [value, setValue] = useState("")

  const onChange = event => {
    setValue(event.target.value)
  }

  return {
    type,
    value,
    onChange
  }
}
```

を

```jsx
const name = useField('text')
<form>
  <input
    type={name.type}
    value={name.value}
    onChange={name.onChange}
  />
  // ...
</form>
```

こうしたり

```jsx
const name = useField("text")
const born = useField("date")
const height = useField("number")

return (
  <div>
    <form>
      name:
      <input {...name} />
      <br />
      birthdate:
      <input {...born} />
      <br />
      height:
      <input {...height} />
    </form>
    <div>
      {name.value} {born.value} {height.value}
    </div>
  </div>
)
```

スプレッド拡張子で簡単にできる。

メモ：フィールドをクリアする関数を入れると良いかも。
バックエンドと通信させるやつを共通化させる`useResourseとか`のに良いかも（Create 以外で）

### Hooks のルール

ループ、条件、ネストされた関数の中で呼び出さないで、React 関数の最上位で Hooks を使う。
JS 関数から呼び出さないで、React 関数コンポーネントや、Custom Hooks から Hooks を呼び出す。
`eslint-plugin-react-hooks`でこの辺を見てくれる。
