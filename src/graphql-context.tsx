import { createContext, useContext } from "solid-js"
import type { Client } from "@urql/core"

const GraphQLClientContext = createContext<Client>()

export function useGraphQLClient(): Client {
  const client = useContext(GraphQLClientContext)
  if (!client) {
    throw new Error(
      "No GraphQL client found in context. Did you forget to wrap your app in <GraphQLProvider>?"
    )
  }
  return client
}

export default GraphQLClientContext
