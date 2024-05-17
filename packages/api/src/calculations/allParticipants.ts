import { DelegationDAG } from 'src/types'

export default function allNodes(delegations: DelegationDAG) {
  return {
    delegators: allDelegators(delegations),
    delegates: allDelegates(delegations),
  }
}

export function allDelegators(delegations: DelegationDAG): string[] {
  return Object.entries(delegations)
    .filter(([, bag]) => bag.outgoing.length > 0)
    .map(([address]) => address)
}

export function allDelegates(delegations: DelegationDAG): string[] {
  return Array.from(
    new Set(
      Object.values(delegations)
        .map((bag) => bag.outgoing.map(({ address }) => address))
        .flat()
    )
  )
}
