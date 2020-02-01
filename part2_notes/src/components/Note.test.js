import React from "react"
import "@testing-library/jest-dom/extend-expect"
import { render, prettyDOM, getByText, fireEvent } from "@testing-library/react"
import Note from "./Note"

test("renders content", () => {
  const note = {
    content: "Component testing is done with react-testing-library",
    important: true
  }

  const component = render(<Note note={note} />)

  const li = component.container.querySelector("li")

  console.log(prettyDOM(li))

  // component.debug()

  // method 1 HTMLコード全体から一致するテキスト
  expect(component.container).toHaveTextContent(
    "Component testing is done with react-testing-library"
  )
  /*
  // method 2 指定されたテキストを含む要素を返すやつ
  const element = component.getByText(
    "Component testing is done with react-testing-library"
  )
  expect(element).toBeDefined()

  // method 3 CSSセレクタで特定の要素を検索する
  const div = component.container.querySelector(".note")
  expect(div).toHaveTextContent(
    "Component testing is done with react-testing-library"
  )
  */
})

test("clicking the button calls event handler once", () => {
  const note = {
    content: "Component testing is done with react-testing-library",
    important: true
  }

  const mockHandler = jest.fn()

  const { getByText } = render(
    <Note note={note} toggleImportance={mockHandler} />
  )

  const button = getByText("make not important")
  fireEvent.click(button)

  expect(mockHandler.mock.calls.length).toBe(1)
})
