[@pooltogether/v4-client-js](README.md) / Exports

# @pooltogether/v4-client-js

## Table of contents

### Classes

- [ContractFactory](classes/ContractFactory.md)
- [DrawCalculatorAPI](classes/DrawCalculatorAPI.md)
- [PrizeDistributor](classes/PrizeDistributor.md)
- [PrizePool](classes/PrizePool.md)
- [PrizePoolNetwork](classes/PrizePoolNetwork.md)
- [User](classes/User.md)

### Interfaces

- [ABIIdentifier](interfaces/ABIIdentifier.md)
- [ChildContractAddresses](interfaces/ChildContractAddresses.md)
- [Contract](interfaces/Contract.md)
- [ContractIdentifier](interfaces/ContractIdentifier.md)
- [ContractList](interfaces/ContractList.md)
- [Draw](interfaces/Draw.md)
- [PrizePoolTokenBalances](interfaces/PrizePoolTokenBalances.md)
- [Providers](interfaces/Providers.md)
- [SignersOrProviders](interfaces/SignersOrProviders.md)
- [Tags](interfaces/Tags.md)
- [TokenData](interfaces/TokenData.md)
- [Version](interfaces/Version.md)

### Type aliases

- [Claim](modules.md#claim)
- [DrawCalcDraw](modules.md#drawcalcdraw)
- [DrawCalcUser](modules.md#drawcalcuser)
- [DrawCalcUserDrawResult](modules.md#drawcalcuserdrawresult)
- [DrawResults](modules.md#drawresults)
- [Pick](modules.md#pick)
- [PickPrize](modules.md#pickprize)
- [PrizeAwardable](modules.md#prizeawardable)
- [PrizeDistribution](modules.md#prizedistribution)
- [PrizeTier](modules.md#prizetier)

### Functions

- [batchCalculateDrawResults](modules.md#batchcalculatedrawresults)
- [calculateDrawResults](modules.md#calculatedrawresults)
- [calculateNumberOfPicksForUser](modules.md#calculatenumberofpicksforuser)
- [calculateNumberOfPrizesForIndex](modules.md#calculatenumberofprizesforindex)
- [calculatePrizeForDistributionIndex](modules.md#calculateprizefordistributionindex)
- [computeCardinality](modules.md#computecardinality)
- [computeDrawResults](modules.md#computedrawresults)
- [computePicks](modules.md#computepicks)
- [createContract](modules.md#createcontract)
- [createContractMetadata](modules.md#createcontractmetadata)
- [createInterface](modules.md#createinterface)
- [filterResultsByValue](modules.md#filterresultsbyvalue)
- [formatTierToBasePercentage](modules.md#formattiertobasepercentage)
- [generatePicks](modules.md#generatepicks)
- [getContractListChainIds](modules.md#getcontractlistchainids)
- [getContractsByType](modules.md#getcontractsbytype)
- [getMetadataAndContract](modules.md#getmetadataandcontract)
- [getTokenData](modules.md#gettokendata)
- [getUsersERC20Balance](modules.md#getuserserc20balance)
- [getUsersTokenAllowance](modules.md#getuserstokenallowance)
- [initializePrizeDistributors](modules.md#initializeprizedistributors)
- [initializePrizePools](modules.md#initializeprizepools)
- [prepareClaims](modules.md#prepareclaims)
- [sortContractsByChainId](modules.md#sortcontractsbychainid)
- [sortContractsByContractTypeAndChildren](modules.md#sortcontractsbycontracttypeandchildren)
- [validateAddress](modules.md#validateaddress)
- [validateIsSigner](modules.md#validateissigner)
- [validateSignerNetwork](modules.md#validatesignernetwork)
- [validateSignerOrProviderNetwork](modules.md#validatesignerorprovidernetwork)

## Type aliases

### Claim

Ƭ **Claim**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `drawIds` | `number`[] |
| `encodedWinningPickIndices` | `string` |
| `userAddress` | `string` |
| `winningPickIndices` | `BigNumber`[][] |

#### Defined in

node_modules/@pooltogether/draw-calculator-js/dist/types.d.ts:45

___

### DrawCalcDraw

Ƭ **DrawCalcDraw**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `beaconPeriodSeconds?` | `number` |
| `beaconPeriodStartedAt?` | `number` |
| `drawId` | `number` |
| `timestamp?` | `number` |
| `winningRandomNumber` | `BigNumber` |

#### Defined in

node_modules/@pooltogether/draw-calculator-js/dist/types.d.ts:15

___

### DrawCalcUser

Ƭ **DrawCalcUser**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `address` | `string` |
| `normalizedBalances` | `BigNumber`[] |
| `picks?` | [`Pick`](modules.md#pick)[] |

#### Defined in

node_modules/@pooltogether/draw-calculator-js/dist/types.d.ts:26

___

### DrawCalcUserDrawResult

Ƭ **DrawCalcUserDrawResult**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `drawResult` | [`DrawResults`](modules.md#drawresults) |
| `user` | [`DrawCalcUser`](modules.md#drawcalcuser) |

#### Defined in

node_modules/@pooltogether/draw-calculator-js/dist/types.d.ts:51

___

### DrawResults

Ƭ **DrawResults**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `drawId` | `number` |
| `prizes` | [`PrizeAwardable`](modules.md#prizeawardable)[] |
| `totalValue` | `BigNumber` |

#### Defined in

node_modules/@pooltogether/draw-calculator-js/dist/types.d.ts:31

___

### Pick

Ƭ **Pick**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `hash` | `string` |
| `index` | `number` |

#### Defined in

node_modules/@pooltogether/draw-calculator-js/dist/types.d.ts:22

___

### PickPrize

Ƭ **PickPrize**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `amount` | `BigNumber` |
| `distributionIndex` | `number` |

#### Defined in

node_modules/@pooltogether/draw-calculator-js/dist/types.d.ts:41

___

### PrizeAwardable

Ƭ **PrizeAwardable**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `amount` | `BigNumber` |
| `distributionIndex` | `number` |
| `pick` | `BigNumber` |

#### Defined in

node_modules/@pooltogether/draw-calculator-js/dist/types.d.ts:36

___

### PrizeDistribution

Ƭ **PrizeDistribution**: [`PrizeTier`](modules.md#prizetier) & { `drawEndTimestampOffset?`: `number` ; `drawStartTimestampOffset?`: `number` ; `matchCardinality`: `number` ; `numberOfPicks`: `BigNumber`  }

#### Defined in

node_modules/@pooltogether/draw-calculator-js/dist/types.d.ts:9

___

### PrizeTier

Ƭ **PrizeTier**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `bitRangeSize` | `number` |
| `expiryDuration?` | `number` |
| `maxPicksPerUser` | `number` |
| `prize` | `BigNumber` |
| `tiers` | `number`[] |

#### Defined in

node_modules/@pooltogether/draw-calculator-js/dist/types.d.ts:2

## Functions

### batchCalculateDrawResults

▸ **batchCalculateDrawResults**(`prizeDistribution`, `draws`, `user`): [`DrawResults`](modules.md#drawresults)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `prizeDistribution` | [`PrizeDistribution`](modules.md#prizedistribution)[] |
| `draws` | [`DrawCalcDraw`](modules.md#drawcalcdraw)[] |
| `user` | [`DrawCalcUser`](modules.md#drawcalcuser) |

#### Returns

[`DrawResults`](modules.md#drawresults)[]

#### Defined in

node_modules/@pooltogether/draw-calculator-js/dist/batchCalculateDrawResults.d.ts:2

___

### calculateDrawResults

▸ **calculateDrawResults**(`prizeDistribution`, `draw`, `user`, `drawIndex?`): [`DrawResults`](modules.md#drawresults)

#### Parameters

| Name | Type |
| :------ | :------ |
| `prizeDistribution` | [`PrizeDistribution`](modules.md#prizedistribution) |
| `draw` | [`DrawCalcDraw`](modules.md#drawcalcdraw) |
| `user` | [`DrawCalcUser`](modules.md#drawcalcuser) |
| `drawIndex?` | `number` |

#### Returns

[`DrawResults`](modules.md#drawresults)

#### Defined in

node_modules/@pooltogether/draw-calculator-js/dist/calculateDrawResults.d.ts:2

___

### calculateNumberOfPicksForUser

▸ **calculateNumberOfPicksForUser**(`prizeDistribution`, `normalizedBalance`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `prizeDistribution` | [`PrizeDistribution`](modules.md#prizedistribution) |
| `normalizedBalance` | `BigNumber` |

#### Returns

`number`

#### Defined in

node_modules/@pooltogether/draw-calculator-js/dist/helpers/calculateNumberOfPicksForUser.d.ts:3

___

### calculateNumberOfPrizesForIndex

▸ **calculateNumberOfPrizesForIndex**(`bitRangeSize`, `tierIndex`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `bitRangeSize` | `number` |
| `tierIndex` | `number` |

#### Returns

`number`

#### Defined in

node_modules/@pooltogether/draw-calculator-js/dist/helpers/calculateNumberOfPrizesForIndex.d.ts:1

___

### calculatePrizeForDistributionIndex

▸ **calculatePrizeForDistributionIndex**(`distributionIndex`, `prizeDistrbution`): `BigNumber`

#### Parameters

| Name | Type |
| :------ | :------ |
| `distributionIndex` | `number` |
| `prizeDistrbution` | [`PrizeDistribution`](modules.md#prizedistribution) |

#### Returns

`BigNumber`

#### Defined in

node_modules/@pooltogether/draw-calculator-js/dist/helpers/calculatePrizeForDistributionIndex.d.ts:3

___

### computeCardinality

▸ **computeCardinality**(`bitRangeSize`, `totalSupply`, `totalSupplyDecimals?`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `bitRangeSize` | `number` |
| `totalSupply` | `BigNumber` |
| `totalSupplyDecimals?` | `number` |

#### Returns

`number`

#### Defined in

node_modules/@pooltogether/draw-calculator-js/dist/computeCardinality.d.ts:2

___

### computeDrawResults

▸ **computeDrawResults**(`prizeDistribution`, `draw`, `picks`): [`DrawResults`](modules.md#drawresults)

#### Parameters

| Name | Type |
| :------ | :------ |
| `prizeDistribution` | [`PrizeDistribution`](modules.md#prizedistribution) |
| `draw` | [`DrawCalcDraw`](modules.md#drawcalcdraw) |
| `picks` | [`Pick`](modules.md#pick)[] |

#### Returns

[`DrawResults`](modules.md#drawresults)

#### Defined in

node_modules/@pooltogether/draw-calculator-js/dist/computeDrawResults.d.ts:2

___

### computePicks

▸ **computePicks**(`address`, `pickIndices`): [`Pick`](modules.md#pick)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |
| `pickIndices` | `BigNumber`[] |

#### Returns

[`Pick`](modules.md#pick)[]

#### Defined in

node_modules/@pooltogether/draw-calculator-js/dist/computePicks.d.ts:3

___

### createContract

▸ `Const` **createContract**(`address`, `contractInterface`, `provider`): `Contract`

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |
| `contractInterface` | `Interface` |
| `provider` | `Signer` \| `Provider` |

#### Returns

`Contract`

#### Defined in

[src/utils/createContract.ts:6](https://github.com/pooltogether/v4-client-js/blob/d352428/src/utils/createContract.ts#L6)

___

### createContractMetadata

▸ **createContractMetadata**(`chainId`, `address`, `type`, `abi`, `version?`, `tags?`, `extensions?`): [`Contract`](interfaces/Contract.md)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `chainId` | `number` | `undefined` |
| `address` | `string` | `undefined` |
| `type` | `ContractType` | `undefined` |
| `abi` | `any`[] | `undefined` |
| `version` | [`Version`](interfaces/Version.md) | `undefined` |
| `tags` | `string`[] | `[]` |
| `extensions` | `Object` | `{}` |

#### Returns

[`Contract`](interfaces/Contract.md)

#### Defined in

[src/utils/createContractMetadata.ts:6](https://github.com/pooltogether/v4-client-js/blob/d352428/src/utils/createContractMetadata.ts#L6)

___

### createInterface

▸ **createInterface**(`abi`): `Interface`

#### Parameters

| Name | Type |
| :------ | :------ |
| `abi` | `any` |

#### Returns

`Interface`

#### Defined in

[src/utils/createInterface.ts:3](https://github.com/pooltogether/v4-client-js/blob/d352428/src/utils/createInterface.ts#L3)

___

### filterResultsByValue

▸ **filterResultsByValue**(`drawResults`, `maxPicksPerUser`): [`DrawResults`](modules.md#drawresults)

Filters out prizes if:
- there's more prizes than the max picks per user
- the prize won is 0 tokens

Sorts prizes by descending value too.

#### Parameters

| Name | Type |
| :------ | :------ |
| `drawResults` | [`DrawResults`](modules.md#drawresults) |
| `maxPicksPerUser` | `number` |

#### Returns

[`DrawResults`](modules.md#drawresults)

#### Defined in

node_modules/@pooltogether/draw-calculator-js/dist/helpers/filterResultsByValue.d.ts:12

___

### formatTierToBasePercentage

▸ **formatTierToBasePercentage**(`distribution`): `BigNumber`

#### Parameters

| Name | Type |
| :------ | :------ |
| `distribution` | `string` |

#### Returns

`BigNumber`

#### Defined in

[src/utils/formatTierToBasePercentage.ts:5](https://github.com/pooltogether/v4-client-js/blob/d352428/src/utils/formatTierToBasePercentage.ts#L5)

___

### generatePicks

▸ **generatePicks**(`prizeDistribution`, `address`, `normalizedBalance`): [`Pick`](modules.md#pick)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `prizeDistribution` | [`PrizeDistribution`](modules.md#prizedistribution) |
| `address` | `string` |
| `normalizedBalance` | `BigNumber` |

#### Returns

[`Pick`](modules.md#pick)[]

#### Defined in

node_modules/@pooltogether/draw-calculator-js/dist/generatePicks.d.ts:3

___

### getContractListChainIds

▸ **getContractListChainIds**(`contracts`): `number`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `contracts` | [`Contract`](interfaces/Contract.md)[] |

#### Returns

`number`[]

#### Defined in

[src/utils/getContractListChainIds.ts:3](https://github.com/pooltogether/v4-client-js/blob/d352428/src/utils/getContractListChainIds.ts#L3)

___

### getContractsByType

▸ **getContractsByType**(`contracts`, `type`): [`Contract`](interfaces/Contract.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `contracts` | [`Contract`](interfaces/Contract.md)[] |
| `type` | `ContractType` |

#### Returns

[`Contract`](interfaces/Contract.md)[]

#### Defined in

[src/utils/getContractsByType.ts:4](https://github.com/pooltogether/v4-client-js/blob/d352428/src/utils/getContractsByType.ts#L4)

___

### getMetadataAndContract

▸ **getMetadataAndContract**(`chainId`, `signerOrProvider`, `contractType`, `contractMetadataList`, `addressOverride?`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `chainId` | `number` |
| `signerOrProvider` | `Signer` \| `Provider` |
| `contractType` | `ContractType` |
| `contractMetadataList` | [`Contract`](interfaces/Contract.md)[] |
| `addressOverride?` | `string` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `contract` | `Contract` |
| `contractMetadata` | [`Contract`](interfaces/Contract.md) |

#### Defined in

[src/utils/getMetadataAndContract.ts:10](https://github.com/pooltogether/v4-client-js/blob/d352428/src/utils/getMetadataAndContract.ts#L10)

___

### getTokenData

▸ **getTokenData**(`tokenContract`): `Promise`<[`TokenData`](interfaces/TokenData.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `tokenContract` | `Contract` |

#### Returns

`Promise`<[`TokenData`](interfaces/TokenData.md)\>

#### Defined in

[src/utils/contractGetters.ts:6](https://github.com/pooltogether/v4-client-js/blob/d352428/src/utils/contractGetters.ts#L6)

___

### getUsersERC20Balance

▸ **getUsersERC20Balance**(`usersAddress`, `tokenContract`): `Promise`<`BigNumber`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `usersAddress` | `string` |
| `tokenContract` | `Contract` |

#### Returns

`Promise`<`BigNumber`\>

#### Defined in

[src/utils/contractGetters.ts:18](https://github.com/pooltogether/v4-client-js/blob/d352428/src/utils/contractGetters.ts#L18)

___

### getUsersTokenAllowance

▸ **getUsersTokenAllowance**(`usersAddress`, `spendersAddress`, `tokenContract`): `Promise`<`BigNumber`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `usersAddress` | `string` |
| `spendersAddress` | `string` |
| `tokenContract` | `Contract` |

#### Returns

`Promise`<`BigNumber`\>

#### Defined in

[src/utils/contractGetters.ts:26](https://github.com/pooltogether/v4-client-js/blob/d352428/src/utils/contractGetters.ts#L26)

___

### initializePrizeDistributors

▸ **initializePrizeDistributors**(`contractList`, `signersOrProviders`): [`PrizeDistributor`](classes/PrizeDistributor.md)[]

Utility function to create several PrizeDistributors from a contract list.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `contractList` | [`ContractList`](interfaces/ContractList.md) | a list of all of the relevant contract metadata for all of the PrizeDistributors to create |
| `signersOrProviders` | [`SignersOrProviders`](interfaces/SignersOrProviders.md) | signers or providers for all of the networks the PrizeDistributors are deployed on keyed by the chain id |

#### Returns

[`PrizeDistributor`](classes/PrizeDistributor.md)[]

a list of PrizeDistributors

#### Defined in

[src/PrizeDistributor.ts:873](https://github.com/pooltogether/v4-client-js/blob/d352428/src/PrizeDistributor.ts#L873)

___

### initializePrizePools

▸ **initializePrizePools**(`contractList`, `providers`): [`PrizePool`](classes/PrizePool.md)[]

A utility function to create several PrizePools from a contract list.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `contractList` | [`ContractList`](interfaces/ContractList.md) | a list of all of the relevant contract metadata for all of the Prize Pools |
| `providers` | [`Providers`](interfaces/Providers.md) | providers for all of the networks in the list of Prize Pools |

#### Returns

[`PrizePool`](classes/PrizePool.md)[]

a list of initialized PrizePools

#### Defined in

[src/PrizePool.ts:326](https://github.com/pooltogether/v4-client-js/blob/d352428/src/PrizePool.ts#L326)

___

### prepareClaims

▸ **prepareClaims**(`user`, `drawResults`): [`Claim`](modules.md#claim)

#### Parameters

| Name | Type |
| :------ | :------ |
| `user` | [`DrawCalcUser`](modules.md#drawcalcuser) |
| `drawResults` | [`DrawResults`](modules.md#drawresults)[] |

#### Returns

[`Claim`](modules.md#claim)

#### Defined in

node_modules/@pooltogether/draw-calculator-js/dist/prepareClaims.d.ts:2

___

### sortContractsByChainId

▸ **sortContractsByChainId**(`contracts`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `contracts` | [`Contract`](interfaces/Contract.md)[] |

#### Returns

`Object`

#### Defined in

[src/utils/sortContractsByChainId.ts:3](https://github.com/pooltogether/v4-client-js/blob/d352428/src/utils/sortContractsByChainId.ts#L3)

___

### sortContractsByContractTypeAndChildren

▸ **sortContractsByContractTypeAndChildren**(`contracts`, `contractType`): [`Contract`](interfaces/Contract.md)[][]

Reads the contract list and pulls out connected contracts based on the
children extension.

NOTE: This extension is added in the intialize functions for creating the instances of
PrizePoolNetwork and PrizeDistributors

#### Parameters

| Name | Type |
| :------ | :------ |
| `contracts` | [`Contract`](interfaces/Contract.md)[] |
| `contractType` | `ContractType` |

#### Returns

[`Contract`](interfaces/Contract.md)[][]

#### Defined in

[src/utils/sortContractsByContractTypeAndChildren.ts:12](https://github.com/pooltogether/v4-client-js/blob/d352428/src/utils/sortContractsByContractTypeAndChildren.ts#L12)

___

### validateAddress

▸ **validateAddress**(`errorPrefix`, `address`): `void`

Throws an error if the provided address is invalid.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `errorPrefix` | `string` | the class and function name of where the error occurred |
| `address` | `string` | the address to validate |

#### Returns

`void`

#### Defined in

[src/utils/validation.ts:10](https://github.com/pooltogether/v4-client-js/blob/d352428/src/utils/validation.ts#L10)

___

### validateIsSigner

▸ **validateIsSigner**(`errorPrefix`, `signerOrProvider`): `void`

Throws an error if the signerOrProvider is not a Signer

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `errorPrefix` | `string` | the class and function name of where the error occurred |
| `signerOrProvider` | `Signer` \| `Provider` | a Signer or Provider to check |

#### Returns

`void`

#### Defined in

[src/utils/validation.ts:37](https://github.com/pooltogether/v4-client-js/blob/d352428/src/utils/validation.ts#L37)

___

### validateSignerNetwork

▸ **validateSignerNetwork**(`errorPrefix`, `signer`, `chainId`): `Promise`<`void`\>

Throws an error if the Signer provided is not on the chain id provided.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `errorPrefix` | `string` | the class and function name of where the error occurred |
| `signer` | `Signer` | a Signer to validate |
| `chainId` | `number` | the network to check for |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/utils/validation.ts:23](https://github.com/pooltogether/v4-client-js/blob/d352428/src/utils/validation.ts#L23)

___

### validateSignerOrProviderNetwork

▸ **validateSignerOrProviderNetwork**(`errorPrefix`, `signerOrProvider`, `chainId`): `Promise`<`void`\>

Throws and error if the Signer or Provider is not on the chain id provided.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `errorPrefix` | `string` | the class and function name of where the error occurred |
| `signerOrProvider` | `Signer` \| `Provider` | a Signer or Provider to check |
| `chainId` | `number` | the network to check for |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/utils/validation.ts:49](https://github.com/pooltogether/v4-client-js/blob/d352428/src/utils/validation.ts#L49)
