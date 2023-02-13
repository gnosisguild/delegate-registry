import {
  BigInt,
  Address,
  store,
  Bytes,
  log,
  ethereum,
} from "@graphprotocol/graph-ts"
import {
  DelegationCleared,
  DelegationUpdated,
  ExpirationUpdated,
  ExpirationUpdatedDelegationStruct,
  DelegationUpdatedPreviousDelegationStruct,
  DelegationUpdatedDelegationStruct,
  DelegationClearedDelegatesClearedStruct,
  OptOutStatusSet,
  DelegateRegistry,
  OptOutStatusSet__Params,
} from "../generated/DelegateRegistry/DelegateRegistry"
import { To, From, Context, Delegation, Optout } from "../generated/schema"

export function handleDelegation(event: DelegationUpdated): void {
  const from: From = loadOrCreateFrom(event.params.delegator)
  const context: Context = loadOrCreateContext(event.params.context)
  const currentDelegations: DelegationUpdatedPreviousDelegationStruct[] =
    event.params.previousDelegation
  const delegations: DelegationUpdatedDelegationStruct[] =
    event.params.delegation
  const expiration: BigInt = event.params.expirationTimestamp
  if (currentDelegations.length > 0) {
    for (let i = 0; i < currentDelegations.length; i++) {
      store.remove(
        "Delegation",
        `${context.id}-${from.id}-${currentDelegations[
          i
        ].context.toHexString()}`,
      )
      const delegationId = `${context.id}-${from.id}-${currentDelegations[
        i
      ].context.toHexString()}`

      const delegation: Delegation | null = Delegation.load(delegationId)
      if (delegation != null) {
        store.remove("Delegation", delegationId)
      }
    }
  }
  for (let i = 0; i < delegations.length; i++) {
    const delegation: DelegationUpdatedDelegationStruct = delegations[i]
    const to: To = loadOrCreateTo(delegation.context)
    createOrUpdateDelegation(context, from, to, delegation.ratio, expiration)
  }
}

export function handleDelegationCleared(event: DelegationCleared): void {
  const from: string = event.params.delegator.toHexString()
  const context: string = event.params.context.toString()
  const delegations: DelegationClearedDelegatesClearedStruct[] =
    event.params.delegatesCleared
  for (let i = 0; i < delegations.length; i++) {
    const delegationId = `${context}-${from}-${delegations[
      i
    ].context.toHexString()}`
    const delegation: Delegation | null = Delegation.load(delegationId)
    if (delegation != null) {
      store.remove("Delegation", delegationId)
    }
  }
}

export function handleExpirationUpdate(event: ExpirationUpdated): void {
  const from: From = loadOrCreateFrom(event.params.delegator)
  const context: Context = loadOrCreateContext(event.params.context)
  const expiration: BigInt = event.params.expirationTimestamp
  const delegations: ExpirationUpdatedDelegationStruct[] =
    event.params.delegation
  for (let i = 0; i < delegations.length; i++) {
    const to: To = loadOrCreateTo(delegations[i].context)
    const delegation: Delegation = createOrUpdateDelegation(
      context,
      from,
      to,
      delegations[i].ratio,
      expiration,
    )
    delegation.save()
  }
}

export function handleOptout(event: OptOutStatusSet): void {
  const delegate: From = loadOrCreateFrom(event.params.delegate)
  const context: Context = loadOrCreateContext(event.params.context)
  const status: boolean = event.params.optout
  if (status) {
    const optout = loadOrCreateOptout(delegate, context)
    optout.save()
  } else {
    const optoutId = `${context.id}-${delegate.id}`
    const optout: Optout | null = Optout.load(optoutId)
    if (optout != null) {
      store.remove("Optout", optoutId)
    }
  }
}

export function loadOrCreateTo(id: Bytes): To {
  let entry: To | null = To.load(id.toHexString())
  if (entry == null) {
    entry = new To(id.toHexString())
  }
  entry.save()
  return entry
}

export function loadOrCreateFrom(id: Address): From {
  let entry: From | null = From.load(id.toHexString())
  if (entry == null) {
    entry = new From(id.toHexString())
  }
  entry.save()
  return entry
}

export function loadOrCreateContext(id: string): Context {
  let entry: Context | null = Context.load(id)
  if (entry == null) {
    entry = new Context(id)
    entry.save()
  }
  return entry
}

export function loadOrCreateOptout(from: From, context: Context): Optout {
  const id = `${context.id}-${from.id}`
  let entry: Optout | null = Optout.load(id)
  if (entry == null) {
    entry = new Optout(id)
  }
  entry.from = from.id
  entry.context = context.id
  entry.save()
  return entry
}

export function createOrUpdateDelegation(
  context: Context,
  from: From,
  to: To,
  ratio: BigInt,
  expiration: BigInt,
): Delegation {
  const id = `${context.id}-${from.id}-${to.id}`
  let entry: Delegation | null = Delegation.load(id)
  if (entry == null) {
    entry = new Delegation(id)
  }
  entry.context = context.id
  entry.from = from.id
  entry.to = to.id
  entry.ratio = ratio
  entry.expiration = expiration
  entry.save()
  return entry
}
