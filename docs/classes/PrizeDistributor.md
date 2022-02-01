[@pooltogether/v4-client-js](../README.md) / [Exports](../modules.md) / PrizeDistributor

# Class: PrizeDistributor

A Prize Distributor.
Provides access to the contracts for viewing expiration times on draws, timelock timers and checking/claiming prizes for a user. Can be instantiated with an ethers Signer or Provider. Use a Signer if you want to claim transactions for a user. If a provider is provided, only read methods are available.

## Table of contents

### Constructors

- [constructor](PrizeDistributor.md#constructor)

### Properties

- [address](PrizeDistributor.md#address)
- [chainId](PrizeDistributor.md#chainid)
- [contractMetadataList](PrizeDistributor.md#contractmetadatalist)
- [drawBufferContract](PrizeDistributor.md#drawbuffercontract)
- [drawBufferMetadata](PrizeDistributor.md#drawbuffermetadata)
- [drawCalculatorContract](PrizeDistributor.md#drawcalculatorcontract)
- [drawCalculatorMetadata](PrizeDistributor.md#drawcalculatormetadata)
- [drawCalculatorTimelockContract](PrizeDistributor.md#drawcalculatortimelockcontract)
- [drawCalculatorTimelockMetadata](PrizeDistributor.md#drawcalculatortimelockmetadata)
- [prizeDistributionsBufferContract](PrizeDistributor.md#prizedistributionsbuffercontract)
- [prizeDistributionsBufferMetadata](PrizeDistributor.md#prizedistributionsbuffermetadata)
- [prizeDistributorContract](PrizeDistributor.md#prizedistributorcontract)
- [prizeDistributorMetadata](PrizeDistributor.md#prizedistributormetadata)
- [signerOrProvider](PrizeDistributor.md#signerorprovider)
- [tokenContract](PrizeDistributor.md#tokencontract)
- [tokenMetadata](PrizeDistributor.md#tokenmetadata)

### Methods

- [calculateUsersPrizes](PrizeDistributor.md#calculateusersprizes)
- [calculateUsersPrizesByDrawId](PrizeDistributor.md#calculateusersprizesbydrawid)
- [claimPrizesAcrossMultipleDrawsByDrawResults](PrizeDistributor.md#claimprizesacrossmultipledrawsbydrawresults)
- [claimPrizesByDraw](PrizeDistributor.md#claimprizesbydraw)
- [claimPrizesByDrawResults](PrizeDistributor.md#claimprizesbydrawresults)
- [getAndSetEthersContract](PrizeDistributor.md#getandsetetherscontract)
- [getDraw](PrizeDistributor.md#getdraw)
- [getDrawBufferContract](PrizeDistributor.md#getdrawbuffercontract)
- [getDrawCalculatorContract](PrizeDistributor.md#getdrawcalculatorcontract)
- [getDrawIdsFromDrawBuffer](PrizeDistributor.md#getdrawidsfromdrawbuffer)
- [getDrawIdsFromPrizeDistributionBuffer](PrizeDistributor.md#getdrawidsfromprizedistributionbuffer)
- [getDraws](PrizeDistributor.md#getdraws)
- [getDrawsAndPrizeDistributions](PrizeDistributor.md#getdrawsandprizedistributions)
- [getNewestDraw](PrizeDistributor.md#getnewestdraw)
- [getNewestPrizeDistribution](PrizeDistributor.md#getnewestprizedistribution)
- [getOldestDraw](PrizeDistributor.md#getoldestdraw)
- [getOldestPrizeDistribution](PrizeDistributor.md#getoldestprizedistribution)
- [getPrizeDistribution](PrizeDistributor.md#getprizedistribution)
- [getPrizeDistributions](PrizeDistributor.md#getprizedistributions)
- [getPrizeDistributionsBufferContract](PrizeDistributor.md#getprizedistributionsbuffercontract)
- [getTimelockDrawId](PrizeDistributor.md#gettimelockdrawid)
- [getTokenContract](PrizeDistributor.md#gettokencontract)
- [getTokenData](PrizeDistributor.md#gettokendata)
- [getUsersAddress](PrizeDistributor.md#getusersaddress)
- [getUsersClaimedAmount](PrizeDistributor.md#getusersclaimedamount)
- [getUsersClaimedAmounts](PrizeDistributor.md#getusersclaimedamounts)
- [getUsersNormalizedBalancesForDrawIds](PrizeDistributor.md#getusersnormalizedbalancesfordrawids)
- [getValidDrawIds](PrizeDistributor.md#getvaliddrawids)
- [id](PrizeDistributor.md#id)
- [validateIsSigner](PrizeDistributor.md#validateissigner)
- [validateSignerNetwork](PrizeDistributor.md#validatesignernetwork)

## Constructors

### constructor

• **new PrizeDistributor**(`prizeDistributorMetadata`, `signerOrProvider`, `contractMetadataList`)

Create an instance of a PrizeDistributor by providing the metadata of the PrizeDistributor contract, an ethers Provider or Signer for the network the PrizeDistributor contract is deployed on and a list of contract metadata for the other contracts that make up the PrizeDistributor.

#### Parameters

| Name | Type |
| :------ | :------ |
| `prizeDistributorMetadata` | [`Contract`](../interfaces/Contract.md) |
| `signerOrProvider` | `Signer` \| `Provider` |
| `contractMetadataList` | [`Contract`](../interfaces/Contract.md)[] |

#### Defined in

[src/PrizeDistributor.ts:67](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L67)

## Properties

### address

• `Readonly` **address**: `string`

#### Defined in

[src/PrizeDistributor.ts:43](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L43)

___

### chainId

• `Readonly` **chainId**: `number`

#### Defined in

[src/PrizeDistributor.ts:42](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L42)

___

### contractMetadataList

• `Readonly` **contractMetadataList**: [`Contract`](../interfaces/Contract.md)[]

#### Defined in

[src/PrizeDistributor.ts:40](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L40)

___

### drawBufferContract

• **drawBufferContract**: `undefined` \| `Contract`

#### Defined in

[src/PrizeDistributor.ts:57](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L57)

___

### drawBufferMetadata

• **drawBufferMetadata**: `undefined` \| [`Contract`](../interfaces/Contract.md)

#### Defined in

[src/PrizeDistributor.ts:49](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L49)

___

### drawCalculatorContract

• **drawCalculatorContract**: `undefined` \| `Contract`

#### Defined in

[src/PrizeDistributor.ts:56](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L56)

___

### drawCalculatorMetadata

• **drawCalculatorMetadata**: `undefined` \| [`Contract`](../interfaces/Contract.md)

#### Defined in

[src/PrizeDistributor.ts:48](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L48)

___

### drawCalculatorTimelockContract

• `Readonly` **drawCalculatorTimelockContract**: `Contract`

#### Defined in

[src/PrizeDistributor.ts:55](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L55)

___

### drawCalculatorTimelockMetadata

• `Readonly` **drawCalculatorTimelockMetadata**: [`Contract`](../interfaces/Contract.md)

#### Defined in

[src/PrizeDistributor.ts:47](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L47)

___

### prizeDistributionsBufferContract

• **prizeDistributionsBufferContract**: `undefined` \| `Contract`

#### Defined in

[src/PrizeDistributor.ts:58](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L58)

___

### prizeDistributionsBufferMetadata

• **prizeDistributionsBufferMetadata**: `undefined` \| [`Contract`](../interfaces/Contract.md)

#### Defined in

[src/PrizeDistributor.ts:50](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L50)

___

### prizeDistributorContract

• `Readonly` **prizeDistributorContract**: `Contract`

#### Defined in

[src/PrizeDistributor.ts:54](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L54)

___

### prizeDistributorMetadata

• `Readonly` **prizeDistributorMetadata**: [`Contract`](../interfaces/Contract.md)

#### Defined in

[src/PrizeDistributor.ts:46](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L46)

___

### signerOrProvider

• `Readonly` **signerOrProvider**: `Signer` \| `Provider`

#### Defined in

[src/PrizeDistributor.ts:41](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L41)

___

### tokenContract

• **tokenContract**: `undefined` \| `Contract`

#### Defined in

[src/PrizeDistributor.ts:59](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L59)

___

### tokenMetadata

• **tokenMetadata**: `undefined` \| [`Contract`](../interfaces/Contract.md)

#### Defined in

[src/PrizeDistributor.ts:51](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L51)

## Methods

### calculateUsersPrizes

▸ **calculateUsersPrizes**(`usersAddress`, `draw`): `Promise`<[`DrawResults`](../modules.md#drawresults)\>

Calculates the prizes a user won for a specific Draw.
NOTE: This is computationally expensive and may cause a long delay. It is not recommended to run this on a clients device.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `usersAddress` | `string` | the users address to compute prizes for |
| `draw` | [`Draw`](../interfaces/Draw.md) | the draw to compute prizes for |

#### Returns

`Promise`<[`DrawResults`](../modules.md#drawresults)\>

the results for user for the provided draw

#### Defined in

[src/PrizeDistributor.ts:644](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L644)

___

### calculateUsersPrizesByDrawId

▸ **calculateUsersPrizesByDrawId**(`usersAddress`, `drawId`): `Promise`<[`DrawResults`](../modules.md#drawresults)\>

Fetches Draw data and calculates the prizes a user won for a specific draw id.
NOTE: This is computationally expensive and may cause a long delay. It is not recommended to run this on a clients device.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `usersAddress` | `string` | the users address to compute prizes for |
| `drawId` | `number` | the draw id for fetch and compute prizes for |

#### Returns

`Promise`<[`DrawResults`](../modules.md#drawresults)\>

the results for user for the provided draw id

#### Defined in

[src/PrizeDistributor.ts:689](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L689)

___

### claimPrizesAcrossMultipleDrawsByDrawResults

▸ **claimPrizesAcrossMultipleDrawsByDrawResults**(`drawResults`, `overrides?`): `Promise`<`TransactionResponse`\>

Submits a transaction to claim a users prizes across multiple draws
PrizeDistributor must be initialized with a Signer.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `drawResults` | `Object` | an object of the users draw results to claim keyed by draw ids |
| `overrides?` | `Overrides` | optional overrides for the transaction creation |

#### Returns

`Promise`<`TransactionResponse`\>

the transaction response

#### Defined in

[src/PrizeDistributor.ts:180](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L180)

___

### claimPrizesByDraw

▸ **claimPrizesByDraw**(`draw`, `overrides?`): `Promise`<`TransactionResponse`\>

Fetches a users prizes for the provided draw and submits a transaction to claim them to the Signer.
PrizeDistributor must be initialized with a Signer.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `draw` | [`Draw`](../interfaces/Draw.md) | the draw to claim prizes for |
| `overrides?` | `Overrides` | optional overrides for the transaction creation |

#### Returns

`Promise`<`TransactionResponse`\>

the transaction response

#### Defined in

[src/PrizeDistributor.ts:129](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L129)

___

### claimPrizesByDrawResults

▸ **claimPrizesByDrawResults**(`drawResults`, `overrides?`): `Promise`<`TransactionResponse`\>

Submits a transaction to claim a users prizes
PrizeDistributor must be initialized with a Signer.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `drawResults` | [`DrawResults`](../modules.md#drawresults) | the prize results for a user for a specific draw |
| `overrides?` | `Overrides` | optional overrides for the transaction creation |

#### Returns

`Promise`<`TransactionResponse`\>

the transaction response

#### Defined in

[src/PrizeDistributor.ts:144](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L144)

___

### getAndSetEthersContract

▸ `Private` **getAndSetEthersContract**(`key`, `contractType`, `getContractAddress`): `Promise`<`Contract`\>

Fetches a contract address, finds the relevant metadata in the ContractList and creates an ethers Contract for that contract. The ethers Contract is cached on the instance of the PrizeDistributor and is returned immediately if already stored.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `key` | `string` | the key for the requested contract to be stored on the PrizeDistributor |
| `contractType` | `ContractType` | the contract name |
| `getContractAddress` | () => `Promise`<`string`\> | a function to fetch the contract address |

#### Returns

`Promise`<`Contract`\>

an ethers Contract for the provided address and contract type

#### Defined in

[src/PrizeDistributor.ts:730](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L730)

___

### getDraw

▸ **getDraw**(`drawId`): `Promise`<[`Draw`](../interfaces/Draw.md)\>

Fetches a Draw from the DrawBuffer.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `drawId` | `number` | the draw id of the Draw to fetch |

#### Returns

`Promise`<[`Draw`](../interfaces/Draw.md)\>

the Draw

#### Defined in

[src/PrizeDistributor.ts:489](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L489)

___

### getDrawBufferContract

▸ **getDrawBufferContract**(): `Promise`<`Contract`\>

Fetches the address of the DrawBuffer and caches the ethers Contract for the DrawBuffer.

#### Returns

`Promise`<`Contract`\>

an ethers Contract for the DrawBuffer related to this PrizeDistributor

#### Defined in

[src/PrizeDistributor.ts:782](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L782)

___

### getDrawCalculatorContract

▸ **getDrawCalculatorContract**(): `Promise`<`Contract`\>

Fetches the address of the DrawCalculator and caches the ethers Contract for the DrawCalculator

#### Returns

`Promise`<`Contract`\>

an ethers Contract for the DrawCalculator related to this PrizeDistributor

#### Defined in

[src/PrizeDistributor.ts:759](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L759)

___

### getDrawIdsFromDrawBuffer

▸ **getDrawIdsFromDrawBuffer**(): `Promise`<`number`[]\>

Fetches the range of draw ids that are available in the DrawBuffer.

#### Returns

`Promise`<`number`[]\>

a list of draw ids in the buffer

#### Defined in

[src/PrizeDistributor.ts:350](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L350)

___

### getDrawIdsFromPrizeDistributionBuffer

▸ **getDrawIdsFromPrizeDistributionBuffer**(): `Promise`<`number`[]\>

Fetches the range of draw ids for the prize distributions that are available in the PrizeDistributionBuffer.

#### Returns

`Promise`<`number`[]\>

a list of draw ids in the buffer

#### Defined in

[src/PrizeDistributor.ts:375](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L375)

___

### getDraws

▸ **getDraws**(`drawIds`): `Promise`<{ [drawId: number]: [`Draw`](../interfaces/Draw.md);  }\>

Fetches multiple Draws from the DrawBuffer.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `drawIds` | `number`[] | a list of draw ids to fetch |

#### Returns

`Promise`<{ [drawId: number]: [`Draw`](../interfaces/Draw.md);  }\>

an object with Draws keyed by their draw ids

#### Defined in

[src/PrizeDistributor.ts:506](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L506)

___

### getDrawsAndPrizeDistributions

▸ **getDrawsAndPrizeDistributions**(`drawIds`): `Promise`<{ [drawId: number]: { `draw`: [`Draw`](../interfaces/Draw.md) ; `prizeDistribution`: [`PrizeDistribution`](../modules.md#prizedistribution)  };  }\>

Fetches Draws and PrizeDistributions from their respective buffers for the provided list of draw ids.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `drawIds` | `number`[] | the list of draw ids to fetch Draws and PrizeDistributions for |

#### Returns

`Promise`<{ [drawId: number]: { `draw`: [`Draw`](../interfaces/Draw.md) ; `prizeDistribution`: [`PrizeDistribution`](../modules.md#prizedistribution)  };  }\>

an object full of Draws and PrizeDistributions keyed by their draw id

#### Defined in

[src/PrizeDistributor.ts:454](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L454)

___

### getNewestDraw

▸ **getNewestDraw**(): `Promise`<[`Draw`](../interfaces/Draw.md)\>

Fetches the newest Draw in the DrawBuffer related to the PrizeDistributor.
NOTE: Will throw an error if the buffer is empty.

#### Returns

`Promise`<[`Draw`](../interfaces/Draw.md)\>

the newest draw in the draw buffer

#### Defined in

[src/PrizeDistributor.ts:245](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L245)

___

### getNewestPrizeDistribution

▸ **getNewestPrizeDistribution**(): `Promise`<{ `drawId`: `number` ; `prizeDistribution`: [`PrizeDistribution`](../modules.md#prizedistribution)  }\>

Fetches the newest PrizeDistribution in the PrizeDistributionBuffer related to the PrizeDistributor.
NOTE: Will throw an error if the buffer is empty.

#### Returns

`Promise`<{ `drawId`: `number` ; `prizeDistribution`: [`PrizeDistribution`](../modules.md#prizedistribution)  }\>

the newest prize distribution in the prize distribution buffer

#### Defined in

[src/PrizeDistributor.ts:280](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L280)

___

### getOldestDraw

▸ **getOldestDraw**(): `Promise`<[`Draw`](../interfaces/Draw.md)\>

Fetches the oldest Draw in the DrawBuffer related to the PrizeDistributor.

#### Returns

`Promise`<[`Draw`](../interfaces/Draw.md)\>

the oldest draw in the draw buffer

#### Defined in

[src/PrizeDistributor.ts:262](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L262)

___

### getOldestPrizeDistribution

▸ **getOldestPrizeDistribution**(): `Promise`<{ `drawId`: `number` ; `prizeDistribution`: [`PrizeDistribution`](../modules.md#prizedistribution)  }\>

Fetches the oldest PrizeDistribution in the PrizeDistributionBuffer related to the PrizeDistributor.

#### Returns

`Promise`<{ `drawId`: `number` ; `prizeDistribution`: [`PrizeDistribution`](../modules.md#prizedistribution)  }\>

the oldest prize distribution in the prize distribution buffer

#### Defined in

[src/PrizeDistributor.ts:307](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L307)

___

### getPrizeDistribution

▸ **getPrizeDistribution**(`drawId`): `Promise`<[`PrizeDistribution`](../modules.md#prizedistribution)\>

Fetches a PrizeDistribution from the PrizeDistributionBuffer.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `drawId` | `number` | the draw id for the PrizeDistribution to fetch |

#### Returns

`Promise`<[`PrizeDistribution`](../modules.md#prizedistribution)\>

the PrizeDistribution

#### Defined in

[src/PrizeDistributor.ts:530](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L530)

___

### getPrizeDistributions

▸ **getPrizeDistributions**(`drawIds`): `Promise`<{ [drawId: number]: [`PrizeDistribution`](../modules.md#prizedistribution);  }\>

Fetches multiple PrizeDistributions from the PrizeDistributionBuffer.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `drawIds` | `number`[] | a list of draw ids to fetch PrizeDistributions for |

#### Returns

`Promise`<{ [drawId: number]: [`PrizeDistribution`](../modules.md#prizedistribution);  }\>

an object with PrizeDistributions keyed by draw ids

#### Defined in

[src/PrizeDistributor.ts:553](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L553)

___

### getPrizeDistributionsBufferContract

▸ **getPrizeDistributionsBufferContract**(): `Promise`<`Contract`\>

Fetches the address of the PrizeDistributionsBuffer and caches the ethers Contract for the PrizeDistributionsBuffer.

#### Returns

`Promise`<`Contract`\>

an ethers Contract for the PrizeDistributionsBuffer related to this PrizeDistributor

#### Defined in

[src/PrizeDistributor.ts:795](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L795)

___

### getTimelockDrawId

▸ **getTimelockDrawId**(): `Promise`<{ `drawId`: `number` ; `endTimeSeconds`: `BigNumber`  }\>

Fetches the id and end time stamp of the draw that is currently in the DrawCalcluatorTimelock.

#### Returns

`Promise`<{ `drawId`: `number` ; `endTimeSeconds`: `BigNumber`  }\>

the draw id and the end time as a unix time stamp in seconds

#### Defined in

[src/PrizeDistributor.ts:334](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L334)

___

### getTokenContract

▸ **getTokenContract**(): `Promise`<`Contract`\>

Fetches the address of the Token that is distributed by this PrizeDistributor and caches the ethers Contract for the ERC20 Token.

#### Returns

`Promise`<`Contract`\>

an ethers Contract for the ERC20 Token related to this PrizeDistributor

#### Defined in

[src/PrizeDistributor.ts:812](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L812)

___

### getTokenData

▸ **getTokenData**(): `Promise`<[`TokenData`](../interfaces/TokenData.md)\>

Fetches decimals, name and symbol for the Token that will be distributed.

#### Returns

`Promise`<[`TokenData`](../interfaces/TokenData.md)\>

the decimals, name and symbol for the token

#### Defined in

[src/PrizeDistributor.ts:235](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L235)

___

### getUsersAddress

▸ **getUsersAddress**(`errorPrefix?`): `Promise`<`string`\>

Returns the users address of the provided Signer.
PrizeDistributor must be initialized with a Signer.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `errorPrefix` | `string` | `'PrizeDistributors [getUsersAddress] |'` | the class and function name of where the error occurred |

#### Returns

`Promise`<`string`\>

the address of the user

#### Defined in

[src/PrizeDistributor.ts:843](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L843)

___

### getUsersClaimedAmount

▸ **getUsersClaimedAmount**(`usersAddress`, `drawId`): `Promise`<`BigNumber`\>

Fetches the amount of tokens a user claimed for a draw.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `usersAddress` | `string` | the address of the user to check |
| `drawId` | `number` | the draw id to check |

#### Returns

`Promise`<`BigNumber`\>

the amount a user claimed

#### Defined in

[src/PrizeDistributor.ts:584](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L584)

___

### getUsersClaimedAmounts

▸ **getUsersClaimedAmounts**(`usersAddress`, `drawIds`): `Promise`<{ [drawId: number]: `BigNumber`;  }\>

Fetches the amount of tokens a user claimed for multiple draws.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `usersAddress` | `string` | the address of the user to check |
| `drawIds` | `number`[] | a list of draw ids to check |

#### Returns

`Promise`<{ [drawId: number]: `BigNumber`;  }\>

an object of claimed amounts keyed by the draw ids

#### Defined in

[src/PrizeDistributor.ts:601](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L601)

___

### getUsersNormalizedBalancesForDrawIds

▸ **getUsersNormalizedBalancesForDrawIds**(`usersAddress`, `drawIds`): `Promise`<{ [drawId: number]: `BigNumber`;  }\>

Fetches a users normalized balance for several draw ids.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `usersAddress` | `string` | the address of a user to fetch normalized balances for |
| `drawIds` | `number`[] | a list of draw ids to fetch normalized balances for |

#### Returns

`Promise`<{ [drawId: number]: `BigNumber`;  }\>

an object of normalized balances keyed by draw ids

#### Defined in

[src/PrizeDistributor.ts:622](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L622)

___

### getValidDrawIds

▸ **getValidDrawIds**(): `Promise`<`number`[]\>

Gets the list of draw ids of draws that have are available in both the DrawBuffer and PrizeDistributionBuffer.

#### Returns

`Promise`<`number`[]\>

a list of draw ids in both buffers

#### Defined in

[src/PrizeDistributor.ts:406](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L406)

___

### id

▸ **id**(): `string`

Returns a unique id string for this PrizeDistributor.

#### Returns

`string`

a unique id for the PrizeDistributor

#### Defined in

[src/PrizeDistributor.ts:116](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L116)

___

### validateIsSigner

▸ **validateIsSigner**(`errorPrefix`): `Promise`<`void`\>

Validates that the data provided for providerOrSigner is a Signer.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `errorPrefix` | `string` | the class and function name of where the error occurred |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/PrizeDistributor.ts:862](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L862)

___

### validateSignerNetwork

▸ **validateSignerNetwork**(`errorPrefix`): `Promise`<`void`\>

Validates that a Signer is on the network the PrizeDistributor is deployed on.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `errorPrefix` | `string` | the class and function name of where the error occurred |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/PrizeDistributor.ts:854](https://github.com/pooltogether/v4-js-client/blob/9a26aba/src/PrizeDistributor.ts#L854)
