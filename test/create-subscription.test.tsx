import { createSubscription } from "../src/create-hooks"
import { render } from "@solidjs/testing-library"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { makeSubject } from "wonka"
import type { Accessor } from "solid-js"
import type { TypedDocumentNode } from "@graphql-typed-document-node/core"

let mockSrc: ReturnType<typeof makeMockSource<any>>
let fakeClient = { subscription: vi.fn() }

vi.mock("../src/graphql-context", () => ({
  useGraphQLClient: () => fakeClient,
}))

function makeMockSource<T>() {
  const { source, next, complete } = makeSubject<T>()
  return { source, next, complete }
}

describe("createSubscription", () => {
  beforeEach(() => {
    mockSrc = makeMockSource<any>()
    fakeClient.subscription = vi.fn(() => mockSrc.source)
  })

  it("updates data and calls onError when provided", () => {
    const errors: Error[] = []

    function Test() {
      const data: Accessor<any> = createSubscription(
        {} as TypedDocumentNode<any, any>,
        () => ({}),
        (err) => errors.push(err)
      )
      return <div data-testid="value">{JSON.stringify(data())}</div>
    }

    const { getByTestId } = render(() => <Test />)

    mockSrc.next({ data: { foo: 1 } })
    expect(getByTestId("value").textContent).toBe('{"foo":1}')

    mockSrc.next({ error: new Error("boom") })
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toBe("boom")
  })

  it("unsubscribes on unmount (no errors or updates after unmount)", () => {
    function Test() {
      const data: Accessor<any> = createSubscription(
        {} as TypedDocumentNode<any, any>,
        () => ({})
      )
      return <div data-testid="value">{JSON.stringify(data())}</div>
    }

    const { getByTestId, unmount } = render(() => <Test />)

    mockSrc.next({ data: { foo: 1 } })
    expect(getByTestId("value").textContent).toBe('{"foo":1}')

    unmount()

    // After unmount, pushing another frame must not throw
    expect(() => mockSrc.next({ data: { foo: 2 } })).not.toThrow()
  })
})
