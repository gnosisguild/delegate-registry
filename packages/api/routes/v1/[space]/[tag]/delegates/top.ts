import { BlockTag } from 'viem'
import { mainnet } from 'viem/chains'
import type { VercelRequest } from '@vercel/node'

import { syncTip } from 'src/commands/sync'
import blockTagToNumber from 'src/loaders/loadBlockTag'

import createClient from 'src/loaders/createClient'
import loadDelegates from 'src/loaders/loadDelegates'
import loadDelegators from 'src/loaders/loadDelegators'
import delegateStats, { DelegateStats } from 'src/fns/delegateStats'

// /api/v1/safe.ggtest.eth/latest/delegates/top

// should support query params:
// - limit: number
// - offset: number
// - orderBy: 'power' | 'count'

export const GET = async (req: VercelRequest) => {
  const space = req.query.space as string
  const tag = req.query.space as BlockTag

  const {
    options: { strategies, network },
  } = req.body

  // TODO CACHING

  const limit = Number(req.query.limit) || 100
  const offset = Number(req.query.offset) || 0
  const orderBy = req.query.by

  if (orderBy != 'count' && orderBy != 'power') {
    return new Response('invalid orderBy', { status: 400 })
  }

  const blockNumber = await blockTagToNumber(tag, createClient(mainnet))

  await syncTip(space, blockNumber)

  const { weights: delegatorWeights, scores: delegatorScores } =
    await loadDelegators({
      space,
      strategies,
      network,
      blockNumber,
    })

  const { weights: delegateWeights, scores: delegateScores } =
    await loadDelegates({
      delegatorWeights,
      delegatorScores,
      addresses: [],
    })

  const _result = await delegateStats({
    delegateWeights,
    delegateScores,
  })

  const result = _result
    .sort(orderBy == 'count' ? orderByCount : orderByPower)
    .slice(offset, offset + limit)

  const response = { delegates: result }

  return new Response(JSON.stringify(response))
}

function orderByCount(a: DelegateStats, b: DelegateStats) {
  return a.delegatorCount > b.delegatorCount ? -1 : 1
}
function orderByPower(a: DelegateStats, b: DelegateStats) {
  return a.votingPower > b.votingPower ? -1 : 1
}
