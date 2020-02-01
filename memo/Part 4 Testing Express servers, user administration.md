# Part 4 Testing Express servers, user administration

---

a Structure of backend application, introduction to testing
b Testing the backend
c User administration
d Token authentication

---

## a

環境変数は`./utils/config.js`に入れ、
ルートのイベントハンドラも、コントローラーとして`./controllers/notes.js`に入れる。
`note.js`で DB の形式を定義する。
`app.js`でミドルウェアを起動させ、`index.js`で`server = http.createServer(app)`と、`server.listen`させる。

### Jest でのテスト

`yarn add --dev jest`で、package.json の scripts に`"test": "jest --verbose"`と verbose style で起動出来るようにする。
また、同じ場所に node かどうか伝える必要もある
`//... "jest": { "testEnvironment": "node" }`
`hoge.test.js`という感じで名前に test を入れると、`run test`をした時に動いてくれる。

`-t テスト名`でいい感じになる

```js
test("palindrome of a", () => {
  const result = palindrome("a");

  expect(result).toBe("a");
});
```

中身は ↑ こんな感じに書く。

## b

`NODE_ENV`に開発用と本番用で定義するのが一般的、test も同様。

```js
"scripts": {
 "start": "NODE_ENV=production node index.js",
 "watch": "NODE_ENV=development nodemon index.js",
 "test": "NODE_ENV=test jest --verbose --runInBand"
 },
```

`--runInBand`はテストを並行して実行できなくなる、-t で一部または全部に合うテスト名を探せる。
が、この方法は Win では上手く行かないので`yarn add --dev cross-env`を入れる必要がある。
↑ のスクリプトの先頭に`cross-env`を入れるべし。

### Supertest

API をテストする際は、`yarn add --dev supertest`を利用する。
`tests/note_api.test.js`を参照、async await 使う時はこんな感じ

```js
test("there are four notes", async () => {
  const response = await api.get("/api/notes");
  // execution gets here only after the HTTP request is complete
  // the result of HTTP request is saved in variable res
  expect(response.body.length).toBe(4);
});
```

リクエストに関してログするミドルウェアは必要だけど、テスト時には邪魔になるので、Node_env が`"test"`の時は使わないように変えておくと良い
`console.log("Method:", req.method)` → `logger.info("Method:", req.method)`

`beforeEach()`で DB の前準備とか出来る。`afterAll()`で後処理、DB の接続クローズなど。

`forEach()`内は async/await に対応していない。
使うためには、最後に`Promise.all()`を`await`させて使う。
が、これは平行させて使うので、順番にやりたかったら`for...of`を使うと良い。

## c. user administration

パスワードハッシュに`bcrypt`パッケージを使う。

- ようわからん

## d. Token Authentication
