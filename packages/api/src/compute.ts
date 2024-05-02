import assert from 'assert'
import { Address } from 'viem'

import { distribute } from '../src/fns/bag'
import filterEdges from './weights/graph/filterEdges'
import filterNoEdge from './weights/graph/filterNoEdge'
import kahn from './weights/graph/sort'
import toAcyclical from './weights/graph/toAcyclical'

import { Scores, Weights } from '../src/types'

export default function compute({
  weights,
  scores,
  voters,
}: {
  weights: Weights<bigint>
  scores: Scores
  voters?: Address[]
}) {
  ;[weights] = [weights]
    // Filter out the addresses exercising voting right, from delegator weights
    .map((weights) => (voters ? filterEdges(weights, voters) : weights))
    // Break any potential cycles in the delegator weights
    .map((weights) => toAcyclical(weights))
    // Remove any empty nodes that may remain after cycle busting
    .map((weights) => filterNoEdge(weights))

  const order = kahn(weights)

  return {
    votingPower: votingPower({ order, weights, scores }),
    delegatorCount: delegatorCount({ order, weights }),
  }
}

function votingPower({
  order,
  weights,
  scores,
}: {
  order: string[]
  weights: Weights<bigint>
  scores: Scores
}) {
  const inPower: Scores = Object.fromEntries(order.map((node) => [node, 0]))
  const outPower: Scores = { ...inPower }
  const result: Scores = {}

  for (const node of order) {
    assert(typeof scores[node] == 'number')
    inPower[node] += scores[node]

    const isDelegator = Object.keys(weights[node] || {}).length > 0
    if (isDelegator) {
      const distribution = distribute(weights[node], inPower[node])
      for (const [delegate, power] of distribution) {
        assert(typeof scores[delegate] == 'number')
        outPower[node] += power
        inPower[delegate] += power
      }
    }

    result[node] = inPower[node] - outPower[node]
  }
  return result
}

function delegatorCount({
  order,
  weights,
}: {
  order: string[]
  weights: Weights<bigint>
}) {
  const result: Scores = {
    all: Object.keys(weights).length,
  }

  for (const delegator of order) {
    result[delegator] = 0
  }

  for (const delegator of order) {
    for (const delegate of Object.keys(weights[delegator] || {})) {
      result[delegate] += result[delegator] + 1
    }
  }
  return result
}