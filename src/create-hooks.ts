import {
  Accessor,
  createEffect,
  createResource,
  createSignal,
  onCleanup,
} from "solid-js"
import { useGraphQLClient } from "./graphql-context"
import { pipe, subscribe } from "wonka"
import type { TypedDocumentNode } from "@graphql-typed-document-node/core"
import { Client, OperationContext } from "@urql/core"

export function createQuery<TData, TVars extends object>({
  query,
  variables,
  context,
}: {
  query: TypedDocumentNode<TData, TVars>
  variables?: () => TVars
  context?: Partial<OperationContext>
}) {
  const client = useGraphQLClient()

  const getVars = variables ?? (() => ({} as TVars))

  const [data, { refetch }] = createResource(getVars, (vars) =>
    client
      .query(query, vars, context)
      .toPromise()
      .then((res) => {
        if (res.error) throw res.error
        return res.data!
      })
  )
  return {
    data,
    loading: () => data.loading,
    error: () => data.error,
    refetch: (vars?: TVars) => (vars != null ? refetch(vars) : refetch()),
  }
}

export async function fetchQuery<TData, TVars extends object>(
  client: Client,
  document: TypedDocumentNode<TData, TVars>,
  variables?: TVars,
  context?: Partial<OperationContext>
): Promise<TData> {
  const res = await client
    .query(document, variables ?? ({} as TVars), context)
    .toPromise()
  if (res.error) throw res.error
  return res.data!
}

export type MutationResult<T> =
  | { status: "idle"; data: null; error: null; fetching: false }
  | { status: "fetching"; data: null; error: null; fetching: true }
  | { status: "success"; data: T; error: null; fetching: false }
  | { status: "error"; data: null; error: Error; fetching: false }

export function createMutation<TData, TVars extends object>(
  document: TypedDocumentNode<TData, TVars>,
  context?: Partial<OperationContext>
): {
  execute: (variables: TVars) => Promise<void>
  result: Accessor<MutationResult<TData>>
} {
  const client = useGraphQLClient()

  // internal state
  const [state, setState] = createSignal<MutationResult<TData>>({
    status: "idle",
    data: null,
    error: null,
    fetching: false,
  })

  async function execute(variables: TVars) {
    setState({ status: "fetching", data: null, error: null, fetching: true })
    try {
      const res = await client
        .mutation<TData, TVars>(document, variables, context)
        .toPromise()
      if (res.error) throw res.error
      setState({
        status: "success",
        data: res.data!,
        error: null,
        fetching: false,
      })
    } catch (err) {
      setState({
        status: "error",
        data: null,
        error: err as Error,
        fetching: false,
      })
    }
  }

  return {
    execute,
    result: state as Accessor<MutationResult<TData>>,
  }
}

export function createSubscription<TData extends object, TVars extends object>(
  document: TypedDocumentNode<TData, TVars>,
  getVariables: Accessor<TVars>,
  context?: Partial<OperationContext>,
  onError?: (error: Error) => void
): Accessor<TData | undefined> {
  const client = useGraphQLClient()
  const [data, setData] = createSignal<TData | undefined>(undefined)

  createEffect(() => {
    const vars = getVariables()
    const { unsubscribe } = pipe(
      client.subscription<TData, TVars>(document, vars, context),
      subscribe((res) => {
        if (res.error) {
          onError?.(res.error)
        } else {
          setData(() => res.data!)
        }
      })
    )
    onCleanup(unsubscribe)
  })

  return data
}
