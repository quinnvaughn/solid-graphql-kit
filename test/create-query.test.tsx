import { render, waitFor } from "@solidjs/testing-library"
import { createSignal } from "solid-js"
import { createQuery } from "../src/create-hooks"
import { vi, describe, it, expect } from "vitest"
import type { TypedDocumentNode } from "@graphql-typed-document-node/core"

const fakeClient = {
  query: vi.fn(),
} as any

vi.mock("../src/graphql-context.tsx", () => ({
  useGraphQLClient: () => fakeClient,
}))

const DUMMY_QUERY = {} as TypedDocumentNode<{ foo: string }, { id: string }>

describe("createQuery", () => {
  it("transitions from loading → data", async () => {
    fakeClient.query.mockReturnValue({
      toPromise: () => Promise.resolve({ data: { foo: "bar" } }),
    })

    const [id, setId] = createSignal("1")
    function Test() {
      const { data, loading, error } = createQuery(DUMMY_QUERY, () => ({
        id: id(),
      }))
      return (
        <>
          <div data-testid="loading">{loading() ? "yes" : "no"}</div>
          <div data-testid="data">{data()?.foo}</div>
          <div data-testid="error">{error()?.message}</div>
        </>
      )
    }

    const { getByTestId } = render(() => <Test />)

    expect(getByTestId("loading").textContent).toBe("yes")

    await waitFor(() => expect(getByTestId("data").textContent).toBe("bar"))
    expect(getByTestId("loading").textContent).toBe("no")

    fakeClient.query.mockReturnValue({
      toPromise: () => Promise.resolve({ data: { foo: "baz" } }),
    })
    setId("2")
    await waitFor(() => expect(getByTestId("data").textContent).toBe("baz"))
  })

  it("surfaces errors", async () => {
    fakeClient.query.mockReturnValue({
      toPromise: () => Promise.resolve({ error: new Error("oops") }),
    })

    function TestErr() {
      const { loading, error } = createQuery(DUMMY_QUERY, () => ({ id: "x" }))
      return (
        <>
          <div data-testid="loading">{loading() ? "yes" : "no"}</div>
          <div data-testid="error">{error()?.message}</div>
        </>
      )
    }

    const { getByTestId } = render(() => <TestErr />)
    await waitFor(() => expect(getByTestId("error").textContent).toBe("oops"))
    expect(getByTestId("loading").textContent).toBe("no")
  })
})
