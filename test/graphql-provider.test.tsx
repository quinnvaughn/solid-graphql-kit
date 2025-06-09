import { render } from '@solidjs/testing-library'
import { expect, it } from 'vitest'
import { useGraphQLClient } from '../src/graphql-context'
import { GraphQLProvider } from '../src/graphql-provider'
import type { Client } from 'urql'

it('throws if no provider is present', () => {
  const consumer = () => {
    useGraphQLClient()
  }
  expect(consumer).toThrow(/Did you forget to wrap/)
})

it('provides the client through context', () => {
  let received: Client | undefined
  function Test() {
    received = useGraphQLClient()
    return null
  }

  const fakeClient = {} as Client
  render(() => (
    <GraphQLProvider client={fakeClient}>
      <Test />
    </GraphQLProvider>
  ))

  expect(received).toBe(fakeClient)
})