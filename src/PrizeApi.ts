import { batch, contract } from '@pooltogether/etherplex'
import { deserializeBigNumbers, getReadProvider, NETWORK } from '@pooltogether/utilities'
import {
  computeUserWinningPicksForRandomNumber,
  Draw,
  PrizeTier,
  utils as V4Utils
} from '@pooltogether/v4-utils-js'
import { BigNumber } from 'ethers'

import { PrizeApiStatus } from './constants'
import { DrawResults, LEGACYDrawResults, Prize } from './types'
import { createEmptyDrawResult } from './utils/createEmptyDrawResult'
import { formatDrawResultsFromLegacyDrawResults } from './utils/formatDrawResultsFromLegacyDrawResults'
import { formatDrawResultsFromPrizes } from './utils/formatDrawResultsFromPrizes'

/**
 * Currently the Prize API is only running for a select group of networks.
 */
const PRIZE_API_SUPPORTED_NETWORKS = Object.freeze([
  NETWORK.avalanche,
  NETWORK.mainnet,
  NETWORK.polygon
])

/**
 * PoolTogether Prize API.
 * Provides easy access to PoolTogether Prize APIs.
 */
export class PrizeApi {
  /**
   * Fetches a users DrawResults for the provided draw id
   * @param chainId the chain id the PrizeDistributor is deployed on
   * @param usersAddress the address of the user to fetch draw results for
   * @param prizeDistributorAddress the address of the PrizeDistributor to fetch prizes for
   * @param drawId the id of the draw to check
   * @param maxPicksPerUser the maximum number of picks per user
   */
  static async getUsersDrawResultsByDraw(
    chainId: number,
    usersAddress: string,
    ticketAddress: string,
    prizeDistributorAddress: string,
    drawId: number,
    maxPicksPerUser: number
  ): Promise<DrawResults> {
    const drawResults = await this.getUsersDrawResultsByDraws(
      chainId,
      usersAddress,
      ticketAddress,
      prizeDistributorAddress,
      [drawId],
      [maxPicksPerUser]
    )
    return drawResults[drawId]
  }

  /**
   * Fetches a users DrawResults for the provided draw ids.
   * Checks the status of the Prize API, falls back to the CloudFlare worker if Prize API status is invalid.
   * @param chainId the chain id the PrizeDistributor is deployed on
   * @param usersAddress the address of the user to fetch draw results for
   * @param prizeDistributorAddress the address of the PrizeDistributor to fetch prizes for
   * @param drawIds a list of draw ids to check for prizes
   * @param maxPicksPerUserPerDraw the maximum number of picks per user for each drwa
   */
  static async getUsersDrawResultsByDraws(
    chainId: number,
    usersAddress: string,
    ticketAddress: string,
    prizeDistributorAddress: string,
    drawIds: number[],
    maxPicksPerUserPerDraw: number[]
  ): Promise<{ [drawId: number]: DrawResults }> {
    const drawResults: { [drawId: number]: DrawResults } = {}

    const drawResultsPromises = drawIds.map(async (drawId, index) => {
      try {
        // Check if Prize API supports network, if not, use CloudFlare
        if (!PRIZE_API_SUPPORTED_NETWORKS.includes(chainId)) {
          console.warn(
            `Prize API only supports networks: ${PRIZE_API_SUPPORTED_NETWORKS.join(', ')}.`
          )
          const drawResult = await this.computeDrawResultsOnCloudFlareWorker(
            chainId,
            usersAddress,
            ticketAddress,
            prizeDistributorAddress,
            drawId
          )
          drawResults[drawId] = drawResult
        } else {
          // Check if Prize API executed for the draw id requested, if not, use CloudFlare
          const apiStatus = await this.checkPrizeApiStatus(
            chainId,
            ticketAddress,
            prizeDistributorAddress,
            drawId
          )
          if (apiStatus) {
            const drawResult = await this.getDrawResultsFromPrizeApi(
              chainId,
              usersAddress,
              ticketAddress,
              prizeDistributorAddress,
              drawId,
              maxPicksPerUserPerDraw[index]
            )
            drawResults[drawId] = drawResult
          } else {
            const drawResult = await this.computeDrawResultsOnCloudFlareWorker(
              chainId,
              usersAddress,
              ticketAddress,
              prizeDistributorAddress,
              drawId
            )
            drawResults[drawId] = drawResult
          }
        }
      } catch (e) {
        const error = e as Error
        console.error(error.message)
        throw error
      }
    })

    await Promise.all(drawResultsPromises)

    return drawResults
  }

  /**
   * Fetches precomputed prizes from the Prize API.
   * The Prize API only supports a limited set of networks, see https://dev.pooltogether.com/protocol/api/prize-api for more info.
   * @param chainId
   * @param usersAddress
   * @param prizeDistributorAddress
   * @param drawId
   * @param maxPicksPerUser
   * @returns
   */
  static async getDrawResultsFromPrizeApi(
    chainId: number,
    usersAddress: string,
    ticketAddress: string,
    prizeDistributorAddress: string,
    drawId: number,
    maxPicksPerUser: number
  ) {
    if (!PRIZE_API_SUPPORTED_NETWORKS.includes(chainId)) {
      throw new Error(
        `PrizeApi | Prize API only supports networks: ${PRIZE_API_SUPPORTED_NETWORKS.join(', ')}.`
      )
    }

    const url = this.getDrawResultsUrl(
      chainId,
      ticketAddress,
      prizeDistributorAddress,
      usersAddress,
      drawId
    )
    const response = await fetch(url)
    // If there is no data in Prize API, they won nothing.
    if (response.status === 404) {
      return createEmptyDrawResult(drawId)
    }
    const prizesJson = await response.json()
    const prizes: Prize[] = deserializeBigNumbers(prizesJson)
    const drawResult: DrawResults = formatDrawResultsFromPrizes(drawId, prizes, maxPicksPerUser)
    return drawResult
  }

  /**
   * Computes the users prizes in a CloudFlare worker.
   * @param chainId
   * @param usersAddress
   * @param prizeDistributorAddress
   * @param drawId
   */
  static async computeDrawResultsOnCloudFlareWorker(
    chainId: number,
    usersAddress: string,
    ticketAddress: string,
    prizeDistributorAddress: string,
    drawId: number
  ) {
    const url = this.getCloudFlareDrawResultsUrl(
      chainId,
      ticketAddress,
      prizeDistributorAddress,
      usersAddress,
      drawId
    )
    const response = await fetch(url)
    const drawResultsJson = await response.json()
    const LEGACY_drawResult: LEGACYDrawResults = deserializeBigNumbers(drawResultsJson)
    const drawResult = formatDrawResultsFromLegacyDrawResults(LEGACY_drawResult)
    return drawResult
  }

  /**
   * Computes the users prizes locally.
   * NOTE: This is a heavy calculation and not recommended on users devices.
   * @param chainId
   * @param usersAddress
   * @param prizeDistributorAddress
   * @param ticketAddress
   * @param drawId
   */
  static async computeDrawResults(
    chainId: number,
    usersAddress: string,
    ticketAddress: string,
    prizeDistributorAddress: string,
    drawId: number
  ) {
    const readProvider = getReadProvider(chainId)

    // Get Draw Calculator Timelock address
    const prizeDistributorContract = contract(
      prizeDistributorAddress,
      PartialPrizeDistributorAbi,
      prizeDistributorAddress
    )

    console.log({ readProvider, prizeDistributorContract })
    // @ts-ignore
    let response = await batch(readProvider, prizeDistributorContract.getDrawCalculator())
    const drawCalculatorAddress: string = response[prizeDistributorAddress].getDrawCalculator[0]

    // Get Draw Buffer & Prize Distribution Buffer addresses and the users normalized balance
    const drawCalculatorContract = contract(
      drawCalculatorAddress,
      PartialDrawCalculatorAbi,
      drawCalculatorAddress
    )
    // TODO: Need to fetch users normalized balance for the draw OR rewrite to accept pick count
    response = await batch(
      readProvider,
      drawCalculatorContract
        // @ts-ignore
        .getDrawBuffer()
        .calculateUserPicks(ticketAddress, usersAddress, [drawId])
        .getPrizeTier(drawId)
    )
    const drawBufferAddress = response[drawCalculatorAddress].getDrawBuffer[0]

    const prizeTier: PrizeTier = response[drawCalculatorAddress].getPrizeTier[0]
    const usersPickCount: BigNumber = response[drawCalculatorAddress].calculateUserPicks[0][0]

    console.log('Computing', { drawId, usersPickCount, prizeTier, drawCalculatorAddress })
    // If user had no balance, short circuit
    if (usersPickCount.isZero()) {
      return createEmptyDrawResult(drawId)
    }

    // Get the draw and prize distribution
    const drawBufferContract = contract(drawBufferAddress, PartialDrawBufferAbi, drawBufferAddress)

    response = await batch(
      readProvider,
      // @ts-ignore
      drawBufferContract.getDraw(drawId)
    )
    const draw: Draw = response[drawBufferAddress].getDraw[0]

    const drawResults = computeUserWinningPicksForRandomNumber(
      draw.winningRandomNumber,
      prizeTier.bitRangeSize,
      prizeTier.matchCardinality,
      prizeTier.prize,
      prizeTier.tiers,
      usersAddress,
      usersPickCount,
      draw.drawId
    )

    return V4Utils.filterResultsByValue(drawResults, prizeTier.maxPicksPerUser)
  }

  /**
   * Checks the status of a particular draw and returns true if the data is available for the requested draw.
   * @param chainId
   * @param prizeDistributorAddress
   * @param drawId
   * @returns
   */
  static async checkPrizeApiStatus(
    chainId: number,
    ticketAddress: string,
    prizeDistributorAddress: string,
    drawId: number
  ): Promise<boolean> {
    const response = await fetch(
      this.getDrawResultsStatusUrl(chainId, ticketAddress, prizeDistributorAddress, drawId)
    )
    const requestStatus = response.status
    if (requestStatus !== 200) {
      throw new Error(
        `PrizeApi [checkPrizeApiStatus] | Draw ${drawId} for Prize Distributor ${prizeDistributorAddress}, ticket ${ticketAddress} on ${chainId} calculation status not found.`
      )
    }
    const drawResultsStatusJson: {
      status: PrizeApiStatus
      cliStatus: string
    } = await response.json()
    if (drawResultsStatusJson.cliStatus !== undefined) {
      return drawResultsStatusJson.cliStatus === 'ok'
    }
    return drawResultsStatusJson.status === PrizeApiStatus.success
  }

  // URLs

  /**
   * Returns the URL for pre-calculated prizes from the Prize API
   * TODO: Fix the casing functions once Kames fixes the bug
   * TODO: ticket address
   * @param chainId
   * @param prizeDistributorAddress
   * @param usersAddress
   * @param drawId
   * @returns
   */
  static getDrawResultsUrl(
    chainId: number,
    ticketAddress: string,
    prizeDistributorAddress: string,
    usersAddress: string,
    drawId: number
  ): string {
    console.log('api', { ticketAddress })
    return `https://api.pooltogether.com/prizes/${chainId}/${prizeDistributorAddress.toLowerCase()}/draw/${drawId}/${usersAddress.toLowerCase()}.json`
  }

  /**
   * Returns the URL for the status of the calculations for the draw requested from the Prize API
   * TODO: ticket address
   * @param chainId
   * @param prizeDistributorAddress
   * @param usersAddress
   * @param drawId
   * @returns
   */
  static getDrawResultsStatusUrl(
    chainId: number,
    ticketAddress: string,
    prizeDistributorAddress: string,
    drawId: number
  ): string {
    console.log('api status', { ticketAddress })
    return `https://api.pooltogether.com/prizes/${chainId}/${prizeDistributorAddress.toLowerCase()}/draw/${drawId}/status.json`
  }

  /**
   * Returns the URL that the prizes can be calculated at on CloudFlare
   * TODO: Ticket address
   * @param chainId
   * @param prizeDistributorAddress
   * @param usersAddress
   * @param drawId
   * @returns
   */
  static getCloudFlareDrawResultsUrl(
    chainId: number,
    ticketAddress: string,
    prizeDistributorAddress: string,
    usersAddress: string,
    drawId: number
  ): string {
    console.log('cf', { ticketAddress })
    return `https://tsunami-prizes-production.pooltogether-api.workers.dev/${chainId}/${prizeDistributorAddress}/prizes/${usersAddress}/${drawId}/`
  }
}

// Partial ABIs with the minimal interfaces to fetch the required data for computing prizes

const PartialPrizeDistributorAbi = [
  {
    inputs: [],
    name: 'getDrawCalculator',
    outputs: [
      {
        internalType: 'contract IDrawCalculator',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
]

const PartialDrawCalculatorAbi = [
  {
    inputs: [
      {
        internalType: 'contract ITicket',
        name: '_ticket',
        type: 'address'
      },
      {
        internalType: 'address',
        name: '_user',
        type: 'address'
      },
      {
        internalType: 'uint32[]',
        name: '_drawIds',
        type: 'uint32[]'
      }
    ],
    name: 'calculateUserPicks',
    outputs: [
      {
        internalType: 'uint64[]',
        name: '',
        type: 'uint64[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'gaugeController',
    outputs: [{ internalType: 'contract GaugeControllerInterface', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_user',
        type: 'address'
      },
      {
        internalType: 'uint32[]',
        name: '_drawIds',
        type: 'uint32[]'
      }
    ],
    name: 'getNormalizedBalancesForDrawIds',
    outputs: [
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getDrawBuffer',
    outputs: [
      {
        internalType: 'contract IDrawBuffer',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint32', name: 'drawId', type: 'uint32' }],
    name: 'getPrizeTier',
    outputs: [
      {
        components: [
          { internalType: 'uint8', name: 'bitRangeSize', type: 'uint8' },
          { internalType: 'uint8', name: 'matchCardinality', type: 'uint8' },
          { internalType: 'uint16', name: 'maxPicksPerUser', type: 'uint16' },
          { internalType: 'uint32', name: 'drawId', type: 'uint32' },
          { internalType: 'uint32', name: 'expiryDuration', type: 'uint32' },
          { internalType: 'uint32', name: 'endTimestampOffset', type: 'uint32' },
          { internalType: 'uint128', name: 'poolStakeTotal', type: 'uint128' },
          { internalType: 'uint256', name: 'prize', type: 'uint256' },
          { internalType: 'uint32[16]', name: 'tiers', type: 'uint32[16]' }
        ],
        internalType: 'struct DrawCalculator.PrizeTier',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
]

const PartialDrawBufferAbi = [
  {
    inputs: [
      {
        internalType: 'uint32',
        name: 'drawId',
        type: 'uint32'
      }
    ],
    name: 'getDraw',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'winningRandomNumber',
            type: 'uint256'
          },
          {
            internalType: 'uint32',
            name: 'drawId',
            type: 'uint32'
          },
          {
            internalType: 'uint64',
            name: 'timestamp',
            type: 'uint64'
          },
          {
            internalType: 'uint64',
            name: 'beaconPeriodStartedAt',
            type: 'uint64'
          },
          {
            internalType: 'uint32',
            name: 'beaconPeriodSeconds',
            type: 'uint32'
          }
        ],
        internalType: 'struct IDrawBeacon.Draw',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
]
