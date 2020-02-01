# Part 7 React router, styling app with CSS and Webpack

a React-router
b More about styles
c Webpack
d Class components, E2E-testing
e Miscellaneous
f Exercises: extending the bloglist

---

## a. React-router

SPA 使うのに使える、内部ルーティングしてくれるのがこれ。
`<Link to="/notes">notes</Link>`でリンクを作り
`<Route path="/notes" render={() => <Notes />} />`でレンダリングされるコンポーネントを定義する。
`part2_notes/router-app.js`を参照

`path="/notes/:id"`とした Express スタイルの場合、`render={({match}) => <Note note={noteById(match.params.id)}}`と`match.params`で id にアクセスできる。

### ログイン

```js
const LoginNoHistory = (props) => {
  const onSubmit = (event) => {
    event.preventDefault()
    props.onLogin('mluukkai')
    props.history.push('/')
  }
  //...
const Login = withRouter(LoginNoHistory)
```

`withRouter`によって props として受け取った history.push を呼び出して、アドレスを/(=ホーム)にする。
/users にアクセスした際、ログインしてない場合`Redirect`コンポーネントでログイン画面にリダイレクトされる。実際だと非ログイン時は見えないようにするのが良い

```js
<Route
  path="/users"
  render={() => (user ? <Users /> : <Redirect to="/login" />)}
/>
```

## b. More about styles

`React-bootstrap`を使用する。
`index.html`に CSS を入れて、ルート要素の className を`container`にすると、適用される。
今度は`semantic-ui-react`を使用する。
これも index に CSS を入れて、ルートを Container コンポーネントにする。
他のなんやかんや

`http://www.material-ui.com/ https://bulma.io/ https://ant.design/ https://foundation.zurb.com/`

## c. Webpack

Webpack にぶちこんで一つの js ファイルにして動かしてる。
React も、Babel-loader を webpack.config.js で指定してビルドさせる。
async/await を使う際は、`@babel/polyfill`がエントリポイントとして必要になる。
CSS（`css-loader`, `style-loader`）も Babel と同じく rule で指定する。
Webpack-dev-server やらなんやらもあるけど省略
普通にコードを Build すると容量がそこそこでかい、コメントやらを勝手に引いて Build するのが"webpack --mode=production"、これを Script のとこに置くと良い。
開発用と本番用の構成を分けられるし、
Webpack.config.js をオブジェクトからオブジェクトを返す関数にすることで、
`webpack.DefinePlugin`でグローバル定数を作れる。
コンポーネント内では `BACKEND_URL`など、定義した関数から使える。

Build のディレクトリで`npx static-server`を実行することで、バンドルされたプロダクトバージョンをローカルで`http://localhost:9080`で検査出来る。

また、IE などは find()や Promise など使えないので、Polyfill などを入れる必要がある。

## d. Class components, E2E-testing

馴染み深い Class Components の話。まあいらない

システム全体を検査する E2E テストは、いろんなブラウザを使用した Selenium や、GUI を使わない（Headress）Chrome の Puppetter があるが、18 年からある Cypress がいい感じ、ブラウザ内で全て完結するから。
2-5 で作ったやつに Cypress を入れる。
バックエンドとフロントエンドが起動しているときに Cypress を`cypress open`で起動させる
自動で作成された cypress フォルダの integration フォルダに`hoge.js`とかで、中身は馴染みのある
`describe("hoge", () => { it("hoge", () => cy.visit("http://localhost:3000"))})`
を入れると、テストしてくれる。
テストの中身は Cypress 用の構文`cy.get().click().contains()`など
`.get()`は#username(＝ id="username")とかで受け取れる、非推奨だけど。

データベースをテストする際はリセットし、初期化する必要がある。
E2E テストだと直接アクセスできないが、バックエンドで API エンドポイントを作ると出来る。
それ用の Router を作成。

## e. Miscellaneous

コンポーネントのフォルダ構成だったり、フロントとバックを同じフォルダに置くこととか。

サーバに変化があった場合の更新は、フロントでポーリング（バック API への繰り返しリクエスト）に setInterval を使う。
もしくは Websocket API を使う（対応していないブラウザもある）。より良いのは、Socket.io ライブラリを使うと、対応していないブラウザでも対応してくれる。

仮想 DOM の話や、React は View で、Angular は MVC 全対応。

### React/node-app Secruity

SQL インジェクション、SQL を壊してくるやつ、禁止文字に引用符だったり、代替文字にサニタイズしてエスケープさせる。NoSQL でもあり得る
XSS、文字列に JS コードを入れるやつ。React はデータのサニタイズをしてくれる。
いろんなパッケージもちゃんとアップデートさせておこう
`npm outdated --depth 0`でチェックできる。
`npm audit`でパッケージのセキュリティリスクも見れる。

HTTPS でトークンベースの認証は大事。また、アクセス制御をする際も、ブラウザだけでなくサーバでもユーザの ID などを確認すべし。
Express を使う際は、[HELMET](https://helmetjs.github.io/)というミドルウェアライブラリで脆弱性を防げる。
ESLint Security-plugin も良い。

#### isomorphic application as universal code

とかいうよくわからない話
Next.js でユニバーサルアプリケーションとか言うのを作れそう。

#### progressive web app (PWA)

Create-react-app でいい感じになる。けどオフラインとか低速でも実現できないといけない

#### マイクロサービスアーキテクチャ

いろんな独立したサービスからアプリのバックエンドを構成する。
[画像](https://fullstackopen.com/static/beecf1d05714ef6a4ac0721fce62d394/14be6/36.png)
ピュアな MSA はデータベースを共有しない。

#### Serverless

Amazon の Lambda によって生まれたトレンド、HTTP リクエスト、DB 関係のルーティングをプログラムで定義する必要がなく、クラウドインフラがこれらを提供する。

### 便利なライブラリ

FB の Immutable.js(または後継の簡単になった Immer)はデータ構造にイミュータブルを実装する。
Redux での Reducer は純粋な関数であるため、Store の情報を変更せず、新しい State に置き換える必要がある。

Redux-saga は Redux thunk ににた非同期アクションを提供する、作者は気に入ってないみたいだけど。

SPA に関する分析データの収集は大変なので、React Google Analytics(react-ga)みたいなのを使うと便利。

React-Native でモバイルアプリ作れて便利。

毎年 JS プロジェクトを作る流行りやベストプラクティスは変わっていく。2015 年に Webpack が出てからは落ちついてる。
けど Percel が出てて人気なので要チェック。

[React Patterns](https://reactpatterns.com/)や[React Bits](https://vasanthk.gitbooks.io/react-bits/)は React のベストプラクティスを提供してくれる。

## f. Exercises

今回は飛ばす。
コンポーネントを map させるときは、`if (props.user === undefined) return null;`を入れとかないといけないっぽい。
