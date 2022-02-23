import { batch, contract } from '@pooltogether/etherplex'
import { deserializeBigNumbers, getReadProvider, NETWORK } from '@pooltogether/utilities'
import {
  computeUserWinningPicksForRandomNumber,
  Draw,
  utils as V4Utils
} from '@pooltogether/v4-utils-js'
import { BigNumber } from 'ethers'

import { PrizeApiStatus } from './constants'
import { DrawResults, LEGACYDrawResults, Prize, PrizeDistribution } from './types'
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
    prizeDistributorAddress: string,
    drawId: number,
    maxPicksPerUser: number
  ): Promise<DrawResults> {
    const drawResults = await this.getUsersDrawResultsByDraws(
      chainId,
      usersAddress,
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
            prizeDistributorAddress,
            drawId
          )
          drawResults[drawId] = drawResult
        } else {
          // Check if Prize API executed for the draw id requested, if not, use CloudFlare
          const apiStatus = await this.checkPrizeApiStatus(chainId, prizeDistributorAddress, drawId)
          if (apiStatus) {
            const drawResult = await this.getDrawResultsFromPrizeApi(
              chainId,
              usersAddress,
              prizeDistributorAddress,
              drawId,
              maxPicksPerUserPerDraw[index]
            )
            drawResults[drawId] = drawResult
          } else {
            const drawResult = await this.computeDrawResultsOnCloudFlareWorker(
              chainId,
              usersAddress,
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
    prizeDistributorAddress: string,
    drawId: number,
    maxPicksPerUser: number
  ) {
    if (!PRIZE_API_SUPPORTED_NETWORKS.includes(chainId)) {
      throw new Error(
        `PrizeApi | Prize API only supports networks: ${PRIZE_API_SUPPORTED_NETWORKS.join(', ')}.`
      )
    }

    const url = this.getDrawResultsUrl(chainId, prizeDistributorAddress, usersAddress, drawId)
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
    prizeDistributorAddress: string,
    drawId: number
  ) {
    const url = this.getCloudFlareDrawResultsUrl(
      chainId,
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
   * @param drawId
   */
  static async computeDrawResults(
    chainId: number,
    usersAddress: string,
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
    // @ts-ignore
    let response = await batch(readProvider, prizeDistributorContract.getDrawCalculator())
    const drawCalculatorTimelockAddress: string =
      response[prizeDistributorAddress].getDrawCalculator[0]

    // Get Draw Calculator address
    // It's assumed that the PristDistributor has a DrawCalculatorTimelock set up, if it does not, this second getDrawCalculator call will fail. That means the contract is not a DrawCalculatorTimelock and just a DrawCalculator.
    const drawCalculatorTimelockContract = contract(
      drawCalculatorTimelockAddress,
      PartialDrawCalculatorTimelockAbi,
      drawCalculatorTimelockAddress
    )
    let drawCalculatorAddress: string
    try {
      // @ts-ignore
      response = await batch(readProvider, drawCalculatorTimelockContract.getDrawCalculator())
      drawCalculatorAddress = response[drawCalculatorTimelockAddress].getDrawCalculator[0]
    } catch (e) {
      console.warn(
        `Prize Distributor at ${prizeDistributorAddress} is not using a DrawCalculatorTimelock`
      )
      drawCalculatorAddress = drawCalculatorTimelockAddress
    }

    // Get Draw Buffer & Prize Distribution Buffer addresses and the users normalized balance
    const drawCalculatorContract = contract(
      drawCalculatorAddress,
      PartialDrawCalculatorAbi,
      drawCalculatorAddress
    )
    response = await batch(
      readProvider,
      drawCalculatorContract
        // @ts-ignore
        .getDrawBuffer()
        .getPrizeDistributionBuffer()
        .getNormalizedBalancesForDrawIds(usersAddress, [drawId])
    )
    const drawBufferAddress = response[drawCalculatorAddress].getDrawBuffer[0]
    const prizeDistributionBufferAddress =
      response[drawCalculatorAddress].getPrizeDistributionBuffer[0]
    const normalizedBalance: BigNumber =
      response[drawCalculatorAddress].getNormalizedBalancesForDrawIds[0][0]

    // If user had no balance, short circuit
    if (normalizedBalance.isZero()) {
      return createEmptyDrawResult(drawId)
    }

    // Get the draw and prize distribution
    const drawBufferContract = contract(drawBufferAddress, PartialDrawBufferAbi, drawBufferAddress)
    const prizeDistributionBufferContract = contract(
      prizeDistributionBufferAddress,
      PartialPrizeDistributionBufferAbi,
      prizeDistributionBufferAddress
    )

    response = await batch(
      readProvider,
      // @ts-ignore
      drawBufferContract.getDraw(drawId),
      // @ts-ignore
      prizeDistributionBufferContract.getPrizeDistribution(drawId)
    )
    const draw: Draw = response[drawBufferAddress].getDraw[0]
    const prizeDistribution: PrizeDistribution =
      response[prizeDistributionBufferAddress].getPrizeDistribution[0]

    const drawResults = computeUserWinningPicksForRandomNumber(
      draw.winningRandomNumber,
      prizeDistribution.bitRangeSize,
      prizeDistribution.matchCardinality,
      prizeDistribution.numberOfPicks,
      prizeDistribution.prize,
      prizeDistribution.tiers,
      usersAddress,
      normalizedBalance,
      draw.drawId
    )

    return V4Utils.filterResultsByValue(drawResults, prizeDistribution.maxPicksPerUser)
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
    prizeDistributorAddress: string,
    drawId: number
  ): Promise<boolean> {
    const response = await fetch(
      this.getDrawResultsStatusUrl(chainId, prizeDistributorAddress, drawId)
    )
    const requestStatus = response.status
    if (requestStatus !== 200) {
      throw new Error(
        `PrizeApi | Draw ${drawId} for Prize Distributor ${prizeDistributorAddress} on ${chainId} calculation status not found.`
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
   * @param chainId
   * @param prizeDistributorAddress
   * @param usersAddress
   * @param drawId
   * @returns
   */
  static getDrawResultsUrl(
    chainId: number,
    prizeDistributorAddress: string,
    usersAddress: string,
    drawId: number
  ): string {
    return `https://api.pooltogether.com/prizes/${chainId}/${prizeDistributorAddress.toLowerCase()}/draw/${drawId}/${usersAddress.toLowerCase()}.json`
  }

  /**
   * Returns the URL for the status of the calculations for the draw requested from the Prize API
   * @param chainId
   * @param prizeDistributorAddress
   * @param usersAddress
   * @param drawId
   * @returns
   */
  static getDrawResultsStatusUrl(
    chainId: number,
    prizeDistributorAddress: string,
    drawId: number
  ): string {
    return `https://api.pooltogether.com/prizes/${chainId}/${prizeDistributorAddress.toLowerCase()}/draw/${drawId}/status.json`
  }

  /**
   * Returns the URL that the prizes can be calculated at on CloudFlare
   * @param chainId
   * @param prizeDistributorAddress
   * @param usersAddress
   * @param drawId
   * @returns
   */
  static getCloudFlareDrawResultsUrl(
    chainId: number,
    prizeDistributorAddress: string,
    usersAddress: string,
    drawId: number
  ): string {
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

const PartialDrawCalculatorTimelockAbi = [
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
    name: 'getPrizeDistributionBuffer',
    outputs: [
      {
        internalType: 'contract IPrizeDistributionBuffer',
        name: '',
        type: 'address'
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

const PartialPrizeDistributionBufferAbi = [
  {
    inputs: [
      {
        internalType: 'uint32',
        name: '_drawId',
        type: 'uint32'
      }
    ],
    name: 'getPrizeDistribution',
    outputs: [
      {
        components: [
          {
            internalType: 'uint8',
            name: 'bitRangeSize',
            type: 'uint8'
          },
          {
            internalType: 'uint8',
            name: 'matchCardinality',
            type: 'uint8'
          },
          {
            internalType: 'uint32',
            name: 'startTimestampOffset',
            type: 'uint32'
          },
          {
            internalType: 'uint32',
            name: 'endTimestampOffset',
            type: 'uint32'
          },
          {
            internalType: 'uint32',
            name: 'maxPicksPerUser',
            type: 'uint32'
          },
          {
            internalType: 'uint32',
            name: 'expiryDuration',
            type: 'uint32'
          },
          {
            internalType: 'uint104',
            name: 'numberOfPicks',
            type: 'uint104'
          },
          {
            internalType: 'uint32[16]',
            name: 'tiers',
            type: 'uint32[16]'
          },
          {
            internalType: 'uint256',
            name: 'prize',
            type: 'uint256'
          }
        ],
        internalType: 'struct IPrizeDistributionBuffer.PrizeDistribution',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
]
