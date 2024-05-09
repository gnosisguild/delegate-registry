import { describe, test } from '@jest/globals'
import { Address } from 'viem'

import createRegistry from './createRegistry'

import { DelegationAction } from '../types'

describe('createRegistry', () => {
  const A = 'A' as Address
  const B = 'B' as Address
  const C = 'C' as Address
  const D = 'D' as Address

  const REGISTRY_V1 = '0x01' as Address
  const REGISTRY_V2 = '0x02' as Address

  test('it sets a delegation', () => {
    const actions: DelegationAction[] = [
      {
        account: A,
        chainId: 1,
        registry: REGISTRY_V1,
        set: {
          delegation: [{ delegate: B, ratio: 100n }],
          expiration: 0,
        },
      },
    ]
    const result = createRegistry(actions, 0)

    expect(result).toEqual({
      [A]: {
        delegation: [{ delegate: B, ratio: 100n }],
        expiration: 0,
        optOut: false,
      },
    })
  })

  test('it clears a delegation', () => {
    const actions: DelegationAction[] = [
      {
        chainId: 1,
        registry: REGISTRY_V1,
        account: A,
        opt: {
          optOut: true,
        },
      },
      {
        chainId: 1,
        registry: REGISTRY_V1,
        account: A,
        set: {
          delegation: [{ delegate: B, ratio: 100n }],
          expiration: 1000,
        },
      },
      {
        chainId: 1,
        registry: REGISTRY_V1,
        account: A,
        clear: {
          delegation: [],
          expiration: 0,
        },
      },
    ]
    const result = createRegistry(actions, 0)

    expect(result).toEqual({
      [A]: {
        delegation: [],
        expiration: 0,
        optOut: true,
      },
    })
  })

  test('NOOP: clearing out on a different network', () => {
    const actions: DelegationAction[] = [
      {
        chainId: 100,
        registry: REGISTRY_V1,
        account: A,
        set: {
          delegation: [{ delegate: B, ratio: 123n }],
          expiration: 123,
        },
      },
      {
        chainId: 1,
        registry: REGISTRY_V1,
        account: A,
        set: {
          delegation: [{ delegate: B, ratio: 345n }],
          expiration: 567,
        },
      },
      {
        chainId: 100,
        registry: REGISTRY_V1,
        account: A,
        clear: { delegation: [], expiration: 0 },
      },
    ]

    expect(createRegistry(actions, 100)).toEqual({
      [A]: {
        delegation: [{ delegate: B, ratio: 345n }],
        expiration: 567,
        optOut: false,
      },
    })
  })

  test('NOOP: clearing out on a different registry', () => {
    const actions: DelegationAction[] = [
      {
        chainId: 1,
        registry: REGISTRY_V1,
        account: A,
        set: {
          delegation: [{ delegate: B, ratio: 345n }],
          expiration: 567,
        },
      },
      {
        chainId: 1,
        registry: REGISTRY_V2,
        account: A,
        clear: { delegation: [], expiration: 0 },
      },
    ]

    expect(createRegistry(actions, 100)).toEqual({
      [A]: {
        delegation: [{ delegate: B, ratio: 345n }],
        expiration: 567,
        optOut: false,
      },
    })
  })

  test('it opts out of being a delegate', () => {
    const actions: DelegationAction[] = [
      {
        chainId: 1,
        registry: REGISTRY_V1,
        account: A,
        set: {
          delegation: [
            { delegate: B, ratio: 3n },
            { delegate: C, ratio: 4n },
          ],
          expiration: 0,
        },
      },
      {
        chainId: 100,
        registry: REGISTRY_V2,
        account: B,
        opt: { optOut: true },
      },
    ]

    expect(createRegistry(actions, 0)).toEqual({
      [A]: {
        delegation: [
          // { delegate: B, ratio: 3n },
          { delegate: C, ratio: 4n },
        ],
        expiration: 0,
        optOut: false,
      },
      [B]: {
        delegation: [],
        expiration: 0,
        optOut: true,
      },
    })
  })

  test('NOOP: opting out on a different venue', () => {
    const actions: DelegationAction[] = [
      {
        chainId: 1,
        registry: REGISTRY_V1,
        account: A,
        set: {
          delegation: [
            { delegate: B, ratio: 3n },
            { delegate: C, ratio: 4n },
          ],
          expiration: 0,
        },
      },
      {
        chainId: 100,
        registry: REGISTRY_V1,
        account: A,
        opt: { optOut: true },
      },
    ]

    expect(createRegistry(actions, 0)).toEqual({
      [A]: {
        delegation: [
          { delegate: B, ratio: 3n },
          { delegate: C, ratio: 4n },
        ],
        expiration: 0,
        optOut: false,
      },
    })
  })

  test('it sets expiration for a delegation', () => {
    const actions: DelegationAction[] = [
      {
        chainId: 1,
        registry: REGISTRY_V1,
        account: A,
        expire: {
          expiration: 123,
        },
      },
    ]

    expect(createRegistry(actions, 0)).toEqual({
      [A]: {
        delegation: [],
        expiration: 123,
        optOut: false,
      },
    })
  })

  test('setting expiration preserves delegates', () => {
    const actions: DelegationAction[] = [
      {
        chainId: 1,
        registry: REGISTRY_V1,
        account: A,
        set: {
          delegation: [
            { delegate: B, ratio: 3n },
            { delegate: C, ratio: 4n },
          ],
          expiration: 123,
        },
      },
      {
        chainId: 1,
        registry: REGISTRY_V1,
        account: A,
        expire: { expiration: 456 },
      },
    ]

    expect(createRegistry(actions, 100)).toEqual({
      [A]: {
        delegation: [
          { delegate: B, ratio: 3n },
          { delegate: C, ratio: 4n },
        ],
        expiration: 456,
        optOut: false,
      },
    })
  })

  test('NOOP: setting expiration for a delegation on a different venue', () => {
    const actions: DelegationAction[] = [
      {
        chainId: 1,
        registry: REGISTRY_V1,
        account: A,
        set: {
          delegation: [
            { delegate: B, ratio: 3n },
            { delegate: C, ratio: 4n },
          ],
          expiration: 123,
        },
      },
      {
        chainId: 100,
        registry: REGISTRY_V1,
        account: A,
        expire: { expiration: 456 },
      },
    ]

    expect(createRegistry(actions, 0)).toEqual({
      [A]: {
        delegation: [
          { delegate: B, ratio: 3n },
          { delegate: C, ratio: 4n },
        ],
        expiration: 123,
        optOut: false,
      },
    })
  })

  test('opting out outlasts expirations', () => {
    const actions: DelegationAction[] = [
      {
        chainId: 1,
        registry: REGISTRY_V1,
        account: A,
        set: {
          delegation: [
            { delegate: B, ratio: 50n },
            { delegate: C, ratio: 50n },
          ],
          expiration: 0,
        },
      },
      {
        chainId: 1,
        registry: REGISTRY_V1,
        account: B,
        set: {
          delegation: [{ delegate: C, ratio: 50n }],
          expiration: 1999,
        },
      },
      {
        chainId: 1,
        registry: REGISTRY_V1,
        account: B,
        opt: {
          optOut: true,
        },
      },
    ]

    const result = createRegistry(actions, 2024)

    expect(result).toEqual({
      [A]: {
        delegation: [{ delegate: C, ratio: 50n }],
        expiration: 0,
        optOut: false,
      },
      [B]: {
        delegation: [],
        expiration: 1999,
        optOut: true,
      },
    })
  })
})