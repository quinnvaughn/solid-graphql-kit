// createMutation.test.tsx
import { vi, describe, it, expect } from "vitest"
import { createMutation } from "../src/create-hooks"
import type { TypedDocumentNode } from "@graphql-typed-document-node/core"

// stub client
const fakeClient = { mutation: vi.fn() } as any

vi.mock("../src/graphql-context", () => ({
  useGraphQLClient: () => fakeClient,
}))

const DUMMY_MUTATION = {} as TypedDocumentNode<{ ok: boolean }, { x: number }>

describe("createMutation", () => {
  it("transitions through all states on success", async () => {
    // control when the promise resolves
    let resolve: any
    const promise = new Promise((res) => (resolve = res))
    fakeClient.mutation.mockReturnValue({ toPromise: () => promise })

    const { execute, result } = createMutation(DUMMY_MUTATION)

    // initially idle
    expect(result().status).toBe("idle")

    // kick off mutation
    const execPromise = execute({ x: 42 })
    expect(result().status).toBe("fetching")

    // resolve promise
    resolve({ data: { ok: true } })
    await execPromise

    expect(result().status).toBe("success")
    expect(result().data).toEqual({ ok: true })
  })

  it("goes to error on throw", async () => {
    fakeClient.mutation.mockReturnValue({
      toPromise: () => Promise.reject(new Error("fail")),
    })
    const { execute, result } = createMutation(DUMMY_MUTATION)
    await execute({ x: 1 })
    expect(result().status).toBe("error")
    expect(result().error).toEqual(new Error("fail"))
  })
})
