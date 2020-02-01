# Part 8 GraphQL

---

a GraphQL-server
b React and GraphQL
c Database and user administration
d Login and updating the cache
e Fragments and subscriptions

---

## a. GraphQL-server

GraphQL の重要な部分はスキーマで、これでデータの構造を規定する。
API に対してどのようなクエリを作成できるか基本的に全部示す。

```graphql
type Person {
  name: String!
  phone: String
  street: String!
  city: String!
  id: ID!
}
type Query {
  personCount: Int!
  allPersons: [Person!]!
  findPerson(name: String!): Person
}
```

!は必須、ID タイプは文字列だけど、GQL がユニークにしてくれる。
`findPerson`は文字列を受け入れて Person または null を返す。
`allPersons`はリストを返すけど、これに Null は無い。

フェッチするクエリはもうちょい細かく指定しないといけなくて、どのフィールドから返されるか書く必要がある。

```js
query {
  allPersons {
    name
    phone
  }
}
```

### Apollo-server

GraphQL のライブラリは Apollo-server が主流。
それを`part8_graphql-phonebook-backend`で作る。
`ApolloServer({typeDefs, resolvers,})`がこのコードの心臓部。
その引数の 1 つ目に GraphQL のスキーマ、2 つ目がサーバの Resolvers が含まれる。これらが GraphQL クエリへの応答方法を定義するコード。

### graphql-playground

このフォルダは`node filename.js`で開発モードで起動できる。`localhost:4000/graphql`でサーバへのクエリを作るのに便利。
これはエラーが起きても分かりづらいので注意、エラーが起きてる正しい場所にホバーするとエラー表示される。
![こんな感じ](https://fullstackopen.com/static/f4d91f847d2f1abec1d1b57496086250/14be6/3.png)

### parameters of resolver

右側の DOCS は、サーバの GraphQL スキーマが表示される。
`findPerson(name: "Arto Hellas")`クエリの中身は ↓
`(root, args) => persons.find(p => p.name === args.name)`
このリゾルバは引数を 2 つ目の引数として受け取る。

### default Resolver

リゾルバを定義していないのに Person を返せるのは、Apollo が勝手にデフォルトのリゾルバを定義してくれてるから。
↓ のだと name みたいにやってる。値をハードコーディングしたい場合は、city のようにも出来る。

```js
  // ...
  Person: {
    name: (root) => root.name,
    city: (root) => "New York"
  // ...
```

### Object within an object

`type Address`などをを別に用意することで、都市と町名などを一つの住所としてまとめることが出来る
サーバに保存されている情報は変わらないので、スキーマの GraphQL タイプとは異なる場合もある。

```graphql
type Address {
  street: String!
  city: String!
}
type Person {
  // ...
  address: Address!
}
```

このようにまとめた場合、フィールドアドレスが無いため、デフォルトのリゾルバだとダメなので、自分で加える必要がある

```js
const resolvers = {
  // ...
  Person: {
    address: root => {
      return {
        street: root.street,
        city: root.city
      }
    }
  }
}
```

こうすることで、Person オブジェクトが返されるたびに自分で定義したリゾルバを使用して形成される。

### mutations

変化させるものは Mutation と呼ばれ、type Mutation をキーとしてスキーマに記述される

```graphql
type Mutation {
  addPerson(
    name: String!
    phone: String
    street: String!
    city: String!
  ): Person
}
```

phone が non-null で、Mutation には返り値がある、成功すれば Person 型で追加された人物の詳細で、そうでない場合は Null になる。
また、Mutation のリゾルバを記述する必要があり、そこで ID の生成をさせる。

```js
const uuid = require("uuid/v1")
// ...
const resolvers = {
  // ...
  Mutation: {
    addPerson: (root, args) => {
      const person = { ...args, id: uuid() }
      persons = persons.concat(person)
      return person
    }
  }
}
```

args として与えられたオブジェクトを配列 person に追加して、配列に追加したオブジェクトを返す。この場合 uuid ライブラリで一意の値を加えている。
実際に追加するにはこうする

```js
mutation {
  addPerson(
    name: "Pekka Mikkola"
    phone: "045-2374321"
    street: "Vilppulantie 25"
    city: "Helsinki"
  ) {
    name
    phone
    address{
      city
      street
    }
    id
  }
}
```

保存される値は一つのオブジェクトだが、帰ってくる値はこうフォーマットされる

```js
{
  "data": {
    "addPerson": {
      "name": "Pekka Mikkola",
      "phone": "045-2374321",
      "address": {
        "city": "Helsinki",
        "street": "Vilppulantie 25"
      },
      "id": "2b24e0b0-343c-11e9-8c2a-cb57c2bf804f"
    }
  }
}
```

### Error handling

型のバリデーションはやってくれるが、Mutation に追加するルールなどは自分でやる必要がある。
たとえば重複する名前を防ぐためには、UserInputError を Throw する。

```js
const { ApolloServer, UserInputError, gql } = require('apollo-server')
// ...
const resolvers = {
  // ..
  Mutation: {
    addPerson: (root, args) => {
      if (persons.find(p => p.name === args.name)) {
        throw new UserInputError('Name must be unique', {
          invalidArgs: args.name,
        })
      }
```

### Enum

電話番号を登録している人だけを返す（またはそうでない人だけ）クエリを作る。

```graphql
query {
  allPersons(phone: YES(かNO)) { //... }
}
```

```graphql
enum YesNo {
  YES
  NO
}

type Query {
  // ...
  allPersons(phone: YesNo): [Person!]!
}
```

この YesNo タイプは GraphQL 列挙型（enum）で、このどちらかを取る。
リゾルバ内でこう変更する必要がある

```js
Query:{
  // ...
  allPersons: (root, args) => {
    if (!args.phone) {
      return persons
    }
    const byPhone = (person) =>
      args.phone === 'YES' ? person.phone : !person.phone
    return persons.filter(byPhone)
  },
}
```

### Changing a phone number

電話番号を変更する Mutation

```graphql
type Mutation {
  // ...
  editNumber(
    name: String!
    phone: String!
  ): Person
}
```

```js
Mutation: {
  // ...
  editNumber: (root, args) => {
    const person = persons.find(p => p.name === args.name)
    if (!person) {
      return null
    }
    const updatedPerson = { ...person, phone: args.phone }
    persons = persons.map(p => (p.name === args.name ? updatedPerson : p))
    return updatedPerson
  }
}
```

Resolver で行う、名前を探して、更新する感じ

### More on Queries

クエリ自体も、複数のクエリ、personCount や allPersons を一気に呼び出せる。
同じクエリも複数呼び出せるが、別の名前を付ける必要がある

```graphql
query {
  havePhone: allPersons(phone: YES) {
    name
  }
  phoneless: allPersons(phone: NO) {
    name
  }
}
```

## b. React and GraphQL

React と連携させるなら FB が作った Relay か、Apollo Client を使うのが良い。
`npm install apollo-boost react-apollo graphql --save`
で Apollo Client を入れる。

```js
const client = new ApolloClient({
  uri: "http://localhost:4000/graphql"
})
client.query({ query }).then(response => {
  console.log(response.data)
})
```

React 内で Client オブジェクトを使用して GQL サーバとの接続を立ち上げ、クエリを送ったらサーバから返信が来る。
その Client を ApolloProvider で App コンポーネントをラップすることで、全コンポーネントからアクセスできるようになる。

### Query-Component

クエリを作る方法の一つに、Apollo Client で Query コンポーネントを使用して作るものがある。

```js
const ALL_PERSONS = gql`
  {
    allPersons {
      name
      phone
      id
    }
  }
`
const App = () => {
  return (
    <Query query={ALL_PERSONS}>
      {result => {
        if (result.loading) {
          return <div>loading...</div>
        }
        return <div>{result.data.allPersons.map(p => p.name).join(", ")}</div>
      }}
    </Query>
  )
}
```

できれば、result => {}の{}の中身はコンポーネント化すると良い。
これは、ALL_PERSONS という変数にクエリが作成される。関数のパラメータにある`result`には GQL クエリの結果が含まれる。
`result.loading`は読み込み中だと true で、準備が終わるとその後の電話帳の名前が画面に表示される。

### Named Queries and Variables

GQL に置ける変数はクエリにも名前を付ける必要がある。

```gql
query findPersonByName($nameToSearch: String!) {
  findPerson(name: $nameToSearch) {
    name
    phone
    address {
      street
      city
    }
  }
}
// Query Variables
{
  "nameToSearch": "Arto Hellas"
}
```

React からは、クライアントオブジェクトのクエリメソッドを使う。つまり、ApolloConsumer コンポーネントを介して全てのコンポーネントからクエリオブジェクトにアクセス出来るようにする。
例の場合は App コンポーネント内の最上位に入れる

`Persons.js`では、このクエリを利用して、ボタンを押したら await して呼び出し、state に Person への応答を保存する showPerson を定義している。

```js
const showPerson = async name => {
  const { data } = await client.query({
    query: FIND_PERSON,
    variables: { nameToSearch: name }
  })
  setPerson(data.findPerson)
}
```

### Cache

ありがたいことに、同じクエリを再度実行してもバックエンドに送信されない。なのに表示されるのはキャッシュのおかげ。
Person オブジェクト毎に識別 ID がある

### Mutation component

Mutation で新しい人を追加できる機能を実装できる。

```graphql
const CREATE_PERSON = gql`
  mutation createPerson($name: String!, $street: String!, $city: String!, $phone: String) {
    addPerson(
      name: $name,
      street: $street,
      city: $city,
      phone: $phone
    ) {
      name
      phone
      id
      address {
        street
        city
      }
    }
  }
`
```

```js
const App = () => {(
// ...
    </ApolloConsumer>
    <h2>create new</h2>
    <Mutation mutation={CREATE_PERSON}>
      {(addPerson) =>
        <PersonForm
          addPerson={addPerson}
        />
      }
    </Mutation>
  )}
// PersonFormコンポーネント内
const submit = async (e) => {
  e.preventDefault()
  await props.addPerson({
    variables: { name, phone, street, city }
  })
  setName('')
  setPhone('')
  setStreet('')
  setCity('')}
```

これで追加されるものの、画面は更新されない、それはキャッシュを自動的に更新出来ないため。

### Updating the Cache

そのために、ALL_PERSONS をサーバに poll するか、繰り返しクエリを行うこと。が行われるが、単純に App コンポーネント内の Query に pollInterval を付けることでも解決できる。
`<Query query={ALL_PERSONS} pollInterval={2000}>`
を行うことで 2 秒毎に更新する。
すぐ表示されるけど、トラフィックが増えまくってしまう。
また、もう一つの簡単な方法は、ALL_PERSONS クエリを追加する際に再度実行するだけ、Mutation コンポーネントの refetchQueries プロパティを使用して行える。
`<Mutation mutation={CREATE_PERSON} refetchQueries={[{ query: ALL_PERSONS }]}>`
長所短所は上のと反対、他の人が更新してもすぐ見れない。

### Handling mutation error messages

重複した人を作成した場合などのエラーは、onError プロパティでエラーハンドラーを Mutation に登録する。

```js
const App = () => {
  const [errorMessage, setErrorMessage] = useState(null)
  const handleError = (error) => {
    setErrorMessage(error.graphQLErrors[0].message)
    setTimeout(() => {
      setErrorMessage(null)
    }, 10000);
  }
  return (
    <div>
      {errorMessage &&
        <div style={{ color: "red" }}>
          {errorMessage}
        </div>
      }
  // ...
  <Mutation ... onError={handleError}>
```

### Updating a phone number

電話番号変更のする場合、新しい人を追加する際と同じようにする。
mutation にはパラメータが必要なことに要注意

```graphql
const EDIT_NUMBER = gql`
mutation editNumber($name: String!, $phone: String!) {
  editNumber(name: $name, phone: $phone) {
    name
    phone
    address {
      street
      city
    }
    id
  }
}
`
```

実装は`Phoneform.js`を参照
新規追加とは違って、レンダリングされた名前と番号のリストも更新される。
ID が識別されているため、キャッシュ内で更新されるのと、Query によって返されるデータがキャッシュの変更を認識して更新するため

このように Apollo Client は State の管理を自分で行うため、そのへんの管理を Redux に移行する理由はない。

### Apollo with hooks

Render-props が最悪なので、react-apollo3.0 で追加された Hooks を使う。
client を props で持ってくるのではなく、コンポーネントの頭で`useApolloClient()`をする

```js
const Persons = ({ result }) => {
  const client = useApolloClient()
```

App コンポーネントでも、ApolloConsumer が要らなくなるし、`useQuery`を使うことで、Query コンポーネントもいらなくなる

```js
const persons = useQuery(ALL_PERSONS)
// ...
return (
  <Persons result={persons} />
// ...
```

Mutation コンポーネントも、`useMutation`フックで置き換えられる。配列を返すので注意、これの２番めの値は Mutation のロードやエラー状態を提供するもの

```js
const [addPerson] = useMutation(CREATE_PERSON, {
  onError: handleError,
  refetchQueries: [{ query: ALL_PERSONS }]
})
const [editNumber] = useMutation(EDIT_NUMBER)
return (// ...
  <h2>create new</h2>
  <PersonForm addPerson={addPerson} />
  <h2>change number</h2>
  <PhoneForm editNumber={editNumber} />
)
```

## c. Database and user administration

part8 Backend で Mongoose を入れる。required: true は GraphQL があるから冗長になる。けどダブルチェックは大事。

加えて、Mongo では識別フィールドとして\_id があったが、GraphQL は自動的にやってくれる。
また、リゾルバ関数が通常のオブジェクトを返したときに、Apollo サーバが Promise が解決した値を返すようになった。

allPersons リゾルバも、phone 引数がなければ`Person.find({})`を返し、あったら T か F かを`args.phone === "YES"`でやる

### Validation

GQL と同様に、mongoose-schema でエラー処理をする。try/catch ブロックを save メソッドに入れる。

```js
Mutation: {
  addPerson: async (root, args) => {
    const person = new Person({ ...args })
    try {
      await person.save()
    } catch (error) {
      throw new UserInputError(error.message, {
        invalidArgs: args
      })
    }
    return person
  },
  editNumber: async (root, args) => {
    const person = await Person.findOne({ name: args.name })
    person.phone = args.phone
    try {
      await person.save()
    } catch (error) {
      throw new UserInputError(error.message, {
        invalidArgs: args,
      })
    }
    return person
  }}
```

### User and Log in

ユーザー管理を入れる。皆が同じパスワードを使っていると仮定。
User スキーマは`models/user.js`にある。
`index.js`の TypeDefs に User, Token, Query に me（ログインユーザーを返す）, Mutation に CreateUser と login を入れる。

Mutation にリソルバを書く。
login Mutation は、ユーザ名とパスワードのペアが有効かチェックし、有効なら jwt トークンを返す。
ログインしたユーザーがそのときに受け取ったトークンを全てのリクエストに追加する。Authorization ヘッダーを使用して GQL クエリに追加される。

server オブジェクトのコンストラクターに`context`パラメータを追加する。

```js
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.toLowerCase().startsWith("bearer ")) {
      const decodedToken = jwtverify(auth.substring(7), JWT_SECRET)
      const currentUser = await User.findById(decodedToken.id).populate(
        "friends"
      )
      return { currentUser }
    }
  }
})
```

この context によって返されるオブジェクトは、3 つ目のパラメータとして全てのリゾルバに与えられる。ユーザー識別など、複数のリゾルバに共有されることを行うのに適している。
そのリクエストを行ったユーザーに対応するオブジェクトを currentUser フィールドに設定する。

その currentUser は、me クエリなどから context オブジェクトによって取り出される。そのため、ログインユーザーが居ない（リクエストに添付されたヘッダーに有効なトークンがない）場合は null が返される。

```js
Query: {
  // ...
  me: (root, args, context) => {
    return context.currentUser
  }
},
```

### Friends list

addPerson の Mutation を変える。
ログインされたユーザーが見つからない場合、AuthenticationError が throw される。

```js
const currentUser = context.currentUser
if (!currentUser) {
  throw new AuthenticationError("not authenticated")
}

try {
  await person.save()
  currentUser.friends = currentUser.friends.concat(person)
  await currentUser.save()
} catch (error) {
  throw new UserInputError(error.message, {
    invalidArgs: args
  })
}
```

成功した場合、async/await で作成された人がユーザーの友達リストに追加される。

`addAsFriend`も追加する、type Mutation に入れてから、mutation resolver に追加する。

```js
type Mutation {
  // ...
  addAsFriend(
    name: String!
  ): User
}
// mutations resolver
addAsFriend: async (root, args, { currentUser }) => {
  const nonFriendAlready = (person) =>
    !currentUser.friends.map(f => f._id).includes(person._id)

  if (!currentUser) {
    throw new AuthenticationError("not authenticated")
  }

  const person = await Person.findOne({ name: args.name })
  if ( nonFriendAlready(person) ) {
    currentUser.friends = currentUser.friends.concat(person)
  }

  await currentUser.save()

  return currentUser
},
```

context じゃなくて{currentUser}になっているのも要注目、これはイケてる。

## d. Login and updating the cache

### user log in

フロントエンドに戻る。トークンを state に保存して、ログインした際に保存させる。undifined の場合、LoginForm を表示させる。
useMutation の引数には`[login]`が入る

```graphql
const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      value
    }
  }`
```

```js
const [token, setToken] = useState(null)
// ...
const [login] = useMutation(LOGIN, {
  onError: handleError
})
const errorNotification = () =>
  errorMessage && <div style={{ color: "red" }}>{errorMessage}</div>
if (!token) {
  return (
    <div>
      {errorNotification()}
      <h2>Login</h2>
      <LoginForm login={login} setToken={token => setToken(token)} />
    </div>
  )
}
```

ログインに失敗した場合、onError ハンドラが Login mutation に設定されているおかげで、エラーが出てくる。
ログインに成功すると、返されるトークンは App コンポーネントの State に保存される。それで、リクエストの Authorization-Header に追加しやすくする。
`./components/LoginForm.js`を参照

ログアウトボタンを追加する。State にある token を null にして、Localstorage から token を削除し、Apollo クライアントのキャッシュをリセットさせる。最後のが一番重要

```js
const App = () => {
  const client = useApolloClient()
// ...
  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
  }
```

### Adding a token to a header

新しい Person を作成するためには、トークンがリクエストとともに送信される必要がある。フロントの`index.js`に ApolloClient オブジェクトを定義する方法を変更する。
Apollo boost とかいうやつが InMemoryCache とか HttpLink とか、設定しないで ApolloClient を構成出来るので便利、ヘッダーも勝手にやってくれるけど、今回は自分でやる。

```js index.js
import { ApolloClient } from "apollo-client"
import { createHttpLink } from "apollo-link-http"
import { InMemoryCache } from "apollo-cache-inmemory"
import { setContext } from "apollo-link-context"
const httpLink = createHttpLink({
  uri: "http://localhost:4000/graphql"
})
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("phonenumbers-user-token")
  return {
    headers: {
      ...headers,
      authorization: token ? `bearer ${token}` : null
    }
  }
})
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
})
```

Client は ApolloClient を apollo-link のコンストラクタで構成した。
引数の cache の方は InMemoryCache でキャッシュを使用するように定義している。
引数の link の方は、クライアントがサーバに接続する方法を定義している。通信は httpLink で、localStorage からのトークンが承認ヘッダーの値を設定されている場合、使用される通常の http を介した接続。

これによって新しい人の作成と番号変更が上手くいく、が電話番号がない人を追加が出来ない。

```js PersonForm.js
  const submit = async e => {
    await props.addPerson({
      variables: { name, street, city,
      phone: phone.length>0 ? phone : null }
    })
```

が、こんな感じで値を指定していない場合に null に設定するといい

### Updating cache, revisited

新しい人を追加する際`[addPerson]`、ApolloClientのキャッシュを更新させる必要がある。こういったMutationに対してrefetchQuerieオプションで`ALL_PERSONS`を再実行させる、前にもやったけどね

これ便利なんだけど、何度もクエリが再実行されてもアレなので、キャッシュを自分で更新させる。mutationのupdateコールバックを使うと、実行後にapolloがやってくれる。

```js app.js
const [addPerson] = useMutation(CREATE_PERSON, {
  onError: handleError,
  update: (store, response) => {
    // クエリのキャッシュを読み取り
    const dataInStore = store.readQuery({ query: ALL_PERSONS })
    dataInStore.allPersons.push(response.data.addPerson)
    // writeQueryでキャッシュを更新して新しい人物を追加
    store.writeQuery({
      query: ALL_PERSONS,
      data: dataInStore
    })
  }
})
```

このコールバックには、キャッシュへの参照と、Mutationをパラメータとして返されるデータがある。↑の場合、作成された新しい人が返される。
このコールバックが一番いい方法な場合があったりする。
必要に応じて、`fetchPolicy`を`no-cache`に設定することで、アプリ全部または単一のクエリのキャッシュを無効にできる。

```js Persons.js
const Persons = ({ result }) => {
  // ...
  const show = async (name) => {
    const { data } = await client.query({
      query: FIND_PERSON,
      variables: { nameToSearch: name },
      fetchPolicy: 'no-cache'
    })
```

例として、Personの住所の詳細はキャッシュしない感じ。

こういったキャッシュを最新に保つのはめっちゃ大変。

## e. Fragments and subscriptions

### fragments

もし別々のクエリで、例えば全員返す場合と特定の人を返す場合で、その中身が等しい場合など、fragmentsを使用して簡素化出来る。

```graphql
const PERSON_DETAILS = gql`
  fragment PersonDetails on Person {
    id
    name
    phone
    address {
      street
      city
    }
  }
`
```

```graphql
const ALL_PERSONS = gql`
  {
    allPersons  {
      ...PersonDetails
    }
  }
  ${PERSON_DETAILS}  
`
```

こんな感じに使えるけど、GraphQLスキーマではなく、クライアント側で定義されてる。
上の例みたいに変数に保存して${}で宣言すると使える。

### Subscription on the Server

Query-タイプ, Mutationタイプに加えて、サーバの変更に関する更新をsubscribe出来るsubscriptionがある。
Websocketを使用しており、アプリケーションがサブスクリプションを作ると、サーバへのListenをする。サーバに変更があると、全部のサブスクライバーに通知が送られる。

新しいPersonsに関する通知をSubscribeするSubscriptionを作る。
けど、スキーマはこんだけでOK

```graphql index.js
type Subscription {
  personAdded: Person
}
```

実際には、`personAdded`にはResolverが必要で、addPersonリゾルバにも、通知をサブスクライバーに送信するように変更する必要がある。

```js index.js (backend)
const { PubSub } = require("apollo-server")
const pubsub = new PubSub()

Mutation: {
  addPerson: async (root, args, context) => {
  /// ..
  pubsub.publish("PERSON_ADDED", { personAdded: person })
  return person
},},
Subscription: {
  personAdded: {
    subscribe: () => pubsub.asyncIterator(["PERSON_ADDED"])
  }
}
```

Publish-Subscribeの原則を元にして、PubSubインターフェイスを使用してオブジェクトを利用している。新しい人を追加すると、PubSubのPublishメソッドを使用して全てのサブスクライバーに通知が行く。
PersonAddedサブスクリプションリゾルバは、正しいイテレータオブジェクトを返すことで、全てのサブスクライバを登録する。

サーバのListenに`subscriptionUrl`が渡されているのでそれを見ると、

```js
server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url}`)
  console.log(`Subscriptions ready at ${subscriptionsUrl}`)
})
//  ↓これが返される
//Server ready at http://localhost:4000/
//Subscriptions ready at ws://localhost:4000/graphql
```

### Subscriptions on the client

Reactでサブスクリプションを使用するには、index.jsに結構な変更を加える。
フロントエンド側に`subscriptions-transport-ws apollo-link-ws`をする。
アプリケーションがGQLサーバへのWebsocket接続だけでなく、HTTP接続も必要になるため、`wsLink`と`httpLink`両方使うことになる。

```js index.js
const wsLink = new WebSocketLink({
  uri: `ws://localhost:4000/graphql`,
  options: { reconnect: true }
})
// ...
const link = split(
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query)
    return kind === "OperationDefinition" && operation === "subscription"
  },
  wsLink,
  authLink.concat(httpLink)
)
const client = new ApolloClient({
  link,
  cache: new InMemoryCache()
})
```

サブスクリプションも、Subscriptionコンポーネントか、useSubscription hooksを使って行う。

```js
const PERSON_ADDED = gql`
  subscription {
    personAdded {
      ...PersonDetails
    }
  }
  ${PERSON_DETAILS}
`
const App = () => {
useSubscription(PERSON_ADDED, {
  onSubscriptionData: ({ subscriptionData }) => {
    console.log(subscriptionData)
  }
})
```

新しい人が追加されると、サーバが全てのクライアントに通知を送信し、onSubscriptionData属性で定義されたコールバックが呼び出され、新しい人の詳細がパラメータとして与えられる。
これまでの場合、その詳細がコンソールに出る。

それを受信したら、その人物がApolloキャッシュに追加され、レンダリングされるようにする。
アプリケーションが新しい人を作成した際、キャッシュを２回追加することがないように注意。
`[addPerson]`内のコードをまるっと`updateCacheWith`に移動した。

```js
const App = () => {
  // ...
  const updateCacheWith = (addedPerson) => {
    const includedIn = (set, object) =>
      set.map(p => p.id).includes(object.id)  

    const dataInStore = client.readQuery({ query: ALL_PERSONS })
    // キャッシュを２回追加しないように
    if (!includedIn(dataInStore.allPersons, addedPerson)) {
      dataInStore.allPersons.push(addedPerson)
      client.writeQuery({
        query: ALL_PERSONS,
        data: dataInStore
      })
    }
  }
  useSubscription(PERSON_ADDED, {
    onSubscriptionData: ({ subscriptionData }) => {
      const addedPerson = subscriptionData.data.personAdded
      notify(`${addedPerson.name} added`)
      updateCacheWith(addedPerson)
    }
  })
  const [addPerson] = useMutation(CREATE_PERSON, {
    onError: handleError,
    update: (store, response) => {
      updateCacheWith(response.data.addPerson)
    }
  })
  // ...
}
```

### n + 1 problem

今度はバックエンドへ。
Person型にfriendOfフィールドを追加する。その人が誰の友達リストにいるか表示する
`friendOf: [User!]!`

findPersonをfriendOf{username}と検索できるようにしたいが、DBだとPersonオブジェクトのフィールドとはならないので、そのためのリゾルバを作成する。

```js index.js
const resolvers = {
  Person: {
    address: // ...
    friendOf: async ( root ) => {
      const friends = await User.find({
        friends: {
          $in: [root._id]
        }
      })
      return friends
    }
```

rootパラメータはフレンドリストが作られるPersonオブジェクト、全部のUserオブジェクトからフレンドリストに`root._id`を持つオブジェクトを検索させる。

```graphql
query {
  allPersons {
    name
    friendOf {
      username
    }
  }
}
```

を使って全てのユーザのフレンドを出せるが、ユーザー数+1のクエリがデータベースに送られるため、問題が起きる。これがn+1問題

これを解決するには色々あるが、大体は、複数の個別のクエリではなく、何かしらのJOINクエリを使う必要がある。

今回は、各Personオブジェクトにあるフレンドリストを保存する。

```js persons.js
const schema = new mongoose.Schema({
  // ...
  friendOf: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ]
```

そこから、JOINクエリを実行するか、Personオブジェクトを取得するときにpersonのfriendOfフィールドを設定する。
リゾルバは必要ない。

```js index.js
Query: {
  allPersons: (root, args) => {    
    console.log('Person.find')
    if (!args.phone) {
      return Person.find({}).populate('friendOf')
    }
    return Person.find({ phone: { $exists: args.phone === 'YES' } })
      .populate('friendOf')
  },
  // ...
}
```

これによってallPersonsクエリはn+1の問題を引き起こさない、（名前と電話番号のみを取得する場合?）

もし結合クエリを実行すると、関連する人物に関する情報が不要な場合は重くなってしまう。リゾルバー関数の4番目の引数でクエリを更に最適化出来る。その引数はクエリ自体を検査できるため、n + 1が起こりそうな時だけJOINクエリを実行できる。がよく分からんうちは使わないほうがいい。

早すぎる最適化は全ての悪の根源になる。

FBの[DataLoader](https://github.com/graphql/dataloader)ライブラリは、n+1問題に対するソリューションを提供してくれる。
Apolloサーバでの使用は[これ](https://www.robinwieruch.de/graphql-apollo-server-tutorial/#graphql-server-data-loader-caching-batching)と[これ](http://www.petecorey.com/blog/2017/08/14/batching-graphql-queries-with-dataloader/)を読んでね。

### Epilogue

SchemaやQuery, Mutationはアプリの外部に移動するなど、構造化することはまだある。
[ここ](https://blog.apollographql.com/modularizing-your-graphql-schema-code-d7f71d5ed5f2)や[ここ](https://medium.com/@peterpme/thoughts-on-structuring-your-apollo-queries-mutations-939ba4746cd8)参照
