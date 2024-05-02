import { BlockTag, getAddress } from 'viem'

import delegateStats from '../../../../../src/fns/delegateStats'

import loadBlockTag from '../../../../../src/loaders/loadBlockTag'
import loadPower from '../../../../../src/loaders/loadPower'

import { syncTip } from '../../../../../src/commands/sync'
import { DelegateRequestBody } from 'src/types'

export const POST = async (req: Request) => {
  const searchParams = new URL(req.url || '').searchParams
  const space = searchParams.get('space') as string
  const tag = searchParams.get('tag') as BlockTag
  const address = getAddress(searchParams.get('address') as string)

  const { totalSupply, strategies, network } =
    (await req.json()) as DelegateRequestBody

  const { blockNumber, chain } = await loadBlockTag(tag, network)

  await syncTip(blockNumber, chain)

  const { delegatedPower, delegatorCount, scores } = await loadPower({
    chain,
    blockNumber,
    space,
    strategies,
  })
  console.log('delegatedPower', delegatedPower)
  const [response] = delegateStats({
    address,
    totalSupply,
    delegatedPower,
    delegatorCount,
    scores,
  })

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  })
}
