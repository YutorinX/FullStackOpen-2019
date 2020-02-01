import React, { useState } from "react"
import {
  useQuery,
  useMutation,
  useApolloClient,
  useSubscription
} from "react-apollo"
import { gql } from "apollo-boost"
import Persons from "./components/Persons"
import PersonForm from "./components/PersonForm"
import PhoneForm from "./components/PhoneForm"
import LoginForm from "./components/LoginForm"

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

const ALL_PERSONS = gql`
  {
    allPersons {
      ...PersonDetails
    }
  }
  ${PERSON_DETAILS}
`

const CREATE_PERSON = gql`
  mutation createPerson(
    $name: String!
    $street: String!
    $city: String!
    $phone: String
  ) {
    addPerson(name: $name, street: $street, city: $city, phone: $phone) {
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

const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      value
    }
  }
`

const PERSON_ADDED = gql`
  subscription {
    personAdded {
      ...PersonDetails
    }
  }

  ${PERSON_DETAILS}
`

const App = () => {
  const client = useApolloClient()

  const [errorMessage, setErrorMessage] = useState(null)
  const [token, setToken] = useState(null)

  const persons = useQuery(ALL_PERSONS)

  const handleError = error => {
    setErrorMessage(error.graphQLErrors[0].message)
    setTimeout(() => {
      setErrorMessage(null)
    }, 10000)
  }

  const updateCacheWith = addedPerson => {
    const includedIn = (set, object) => set.map(p => p.id).includes(object.id)

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
    // refetchQueries: [{ query: ALL_PERSONS }]
    update: (store, response) => {
      updateCacheWith(response.data.addPerson)
    }
  })

  const [editNumber] = useMutation(EDIT_NUMBER)

  const [login] = useMutation(LOGIN, {
    onError: handleError
  })

  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
  }

  const errorNotificaton = () =>
    errorMessage && <div style={{ color: "red" }}>{errorMessage}</div>

  if (!token) {
    return (
      <div>
        {errorNotificaton()}
        <h2>Login</h2>
        <LoginForm login={login} setToken={token => setToken(token)} />
      </div>
    )
  }

  return (
    <div>
      {errorMessage && <div style={{ color: "red" }}>{errorMessage}</div>}

      <Persons result={persons} />

      <h2>create new</h2>
      <PersonForm addPerson={addPerson} />

      <h2>change number</h2>
      <PhoneForm editNumber={editNumber} />

      <button onClick={logout}>logout</button>
    </div>
  )
}

export default App
