import { deserializeBigNumbers } from '@pooltogether/utilities'

import { DrawResults } from './types'

/**
 * PoolTogether Draw Calculator API.
 * Provides easy access to a Cloudflare Worker for computing a users prizes.
 */
export class DrawCalculatorAPI {
  /**
   * Fetches a users DrawResults for the provided draw id
   * @param chainId the chain id the PrizeDistributor is deployed on
   * @param usersAddress the address of the user to fetch draw results for
   * @param prizeDistributorAddress the address of the PrizeDistributor to fetch prizes for
   * @param drawId the id of the draw to check
   */
  static async getUsersDrawResultsByDraw(
    chainId: number,
    usersAddress: string,
    prizeDistributorAddress: string,
    drawId: number
  ): Promise<DrawResults> {
    const drawResults = await this.getUsersDrawResultsByDraws(
      chainId,
      usersAddress,
      prizeDistributorAddress,
      [drawId]
    )
    return drawResults[drawId]
  }

  /**
   * Fetches a users DrawResults for the provided draw ids
   * @param chainId the chain id the PrizeDistributor is deployed on
   * @param usersAddress the address of the user to fetch draw results for
   * @param prizeDistributorAddress the address of the PrizeDistributor to fetch prizes for
   * @param drawIds a list of draw ids to check for prizes
   */
  static async getUsersDrawResultsByDraws(
    chainId: number,
    usersAddress: string,
    prizeDistributorAddress: string,
    drawIds: number[]
  ): Promise<{ [drawId: number]: DrawResults }> {
    const drawResults: { [drawId: number]: DrawResults } = {}

    const drawResultsPromises = drawIds.map(async (drawId) => {
      try {
        const url = this.getDrawCalculatorUrl(
          chainId,
          prizeDistributorAddress,
          usersAddress,
          drawId
        )
        const response = await fetch(url)
        const drawResultsJson = await response.json()
        const drawResult: DrawResults = deserializeBigNumbers(drawResultsJson)
        drawResults[drawId] = drawResult
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
   * Returns the URL that the prizes can be fetched
   * @param chainId
   * @param prizeDistributorAddress
   * @param usersAddress
   * @param drawId
   * @returns
   */
  static getDrawCalculatorUrl(
    chainId: number,
    prizeDistributorAddress: string,
    usersAddress: string,
    drawId: number
  ): string {
    return `https://tsunami-prizes-production.pooltogether-api.workers.dev/${chainId}/${prizeDistributorAddress}/prizes/${usersAddress}/${drawId}/`
  }
}
