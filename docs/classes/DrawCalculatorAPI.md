[@pooltogether/v4-client-js](../README.md) / [Exports](../modules.md) / DrawCalculatorAPI

# Class: DrawCalculatorAPI

PoolTogether Draw Calculator API.
Provides easy access to a Cloudflare Worker for computing a users prizes.

## Table of contents

### Constructors

- [constructor](DrawCalculatorAPI.md#constructor)

### Methods

- [getDrawCalculatorUrl](DrawCalculatorAPI.md#getdrawcalculatorurl)
- [getUsersDrawResultsByDraw](DrawCalculatorAPI.md#getusersdrawresultsbydraw)
- [getUsersDrawResultsByDraws](DrawCalculatorAPI.md#getusersdrawresultsbydraws)

## Constructors

### constructor

• **new DrawCalculatorAPI**()

## Methods

### getDrawCalculatorUrl

▸ `Static` **getDrawCalculatorUrl**(`chainId`, `prizeDistributorAddress`, `usersAddress`, `drawId`): `string`

Returns the URL that the prizes can be fetched

#### Parameters

| Name | Type |
| :------ | :------ |
| `chainId` | `number` |
| `prizeDistributorAddress` | `string` |
| `usersAddress` | `string` |
| `drawId` | `number` |

#### Returns

`string`

#### Defined in

[src/DrawCalculatorAPI.ts:79](https://github.com/pooltogether/v4-js-client/blob/8c8198d/src/DrawCalculatorAPI.ts#L79)

___

### getUsersDrawResultsByDraw

▸ `Static` **getUsersDrawResultsByDraw**(`chainId`, `usersAddress`, `prizeDistributorAddress`, `drawId`): `Promise`<[`DrawResults`](../modules.md#drawresults)\>

Fetches a users DrawResults for the provided draw id

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chainId` | `number` | the chain id the PrizeDistributor is deployed on |
| `usersAddress` | `string` | the address of the user to fetch draw results for |
| `prizeDistributorAddress` | `string` | the address of the PrizeDistributor to fetch prizes for |
| `drawId` | `number` | the id of the draw to check |

#### Returns

`Promise`<[`DrawResults`](../modules.md#drawresults)\>

#### Defined in

[src/DrawCalculatorAPI.ts:17](https://github.com/pooltogether/v4-js-client/blob/8c8198d/src/DrawCalculatorAPI.ts#L17)

___

### getUsersDrawResultsByDraws

▸ `Static` **getUsersDrawResultsByDraws**(`chainId`, `usersAddress`, `prizeDistributorAddress`, `drawIds`): `Promise`<{ [drawId: number]: [`DrawResults`](../modules.md#drawresults);  }\>

Fetches a users DrawResults for the provided draw ids

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chainId` | `number` | the chain id the PrizeDistributor is deployed on |
| `usersAddress` | `string` | the address of the user to fetch draw results for |
| `prizeDistributorAddress` | `string` | the address of the PrizeDistributor to fetch prizes for |
| `drawIds` | `number`[] | a list of draw ids to check for prizes |

#### Returns

`Promise`<{ [drawId: number]: [`DrawResults`](../modules.md#drawresults);  }\>

#### Defined in

[src/DrawCalculatorAPI.ts:39](https://github.com/pooltogether/v4-js-client/blob/8c8198d/src/DrawCalculatorAPI.ts#L39)
