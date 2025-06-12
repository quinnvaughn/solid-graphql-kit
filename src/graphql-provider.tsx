import { JSX } from "solid-js"
import GraphQLClientContext from "./graphql-context"
import type { Client } from "@urql/core"

export interface GraphQLProviderProps {
  client: Client
  children: JSX.Element | JSX.Element[]
}

export function GraphQLProvider(props: GraphQLProviderProps) {
  return (
    <GraphQLClientContext.Provider value={props.client}>
      {props.children}
    </GraphQLClientContext.Provider>
  )
}
