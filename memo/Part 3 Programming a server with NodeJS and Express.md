# Part 3 Programming a server with NodeJS and Express

---

a Node.js and Express
b Deploying app to internet
c Saving data to MongoDB
d Validation and ESLint

---

`"scripts": { "start": "node index.js", "watch": "nodemon index.js", "test": "echo \"Error: no test specified\" && exit 1", "build:ui": "rimraf -r -fo build && cd ../part2_notes/ && yarn build --prod && @powershell Copy-Item ./build ../part3_notes-backend/ -Recurse", "deploy": "git push heroku master", "deploy:full": "yarn run build:ui && git add . && git commit -m uibuild && yarn run deploy", "logs:prod": "heroku logs --tail" },`
こんな感じで 2 つのプロジェクト、フロントとバックエンドを組み合わせられる。

`create-react-app`だと、`package.json`に`"proxy": "http://localhost:3001"`と入れることで、
サーバアドレスに HTTP リクエストを行う場合（アプリの CSS や JS を取得する場合でないとき）、
そこにリダイレクトされ、開発環境と実行環境を分けられる。

`process.env.うんちゃら`みたいに環境変数を設定するには、`MONGODB_URI=address_here npm run watch`みたいに起動時に設定するか、dotenvライブラリを使う。
ルートディレクトリに.envファイルを作り

`app.get("/api/notes/:id", (req, res, next) => {`
的なコールバックの3番目の`next`を
`.catch(error => next(error))`
エラー発生したときに渡すと
errorHandlerミドルウェアに渡せる。
ミドルウェアは使うコールバックより下に置かないとダメ