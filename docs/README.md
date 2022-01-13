@pooltogether/v4-js-client / [Exports](modules.md)

<p align="center">
  <a href="https://github.com/pooltogether/pooltogether--brand-assets">
    <img src="https://github.com/pooltogether/pooltogether--brand-assets/blob/977e03604c49c63314450b5d432fe57d34747c66/logo/pooltogether-logo--purple-gradient.png?raw=true" alt="PoolTogether Brand" style="max-width:100%;" width="200">
  </a>
</p>

<br />

# 💻 PoolTogether Client Library || PoolTogether V4

![ts](https://badgen.net/badge/-/TypeScript?icon=typescript&label&labelColor=blue&color=555555)
![Tests](https://github.com/pooltogether/v4-js-client/actions/workflows/main.yml/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/pooltogether/v4-js-client/badge.svg?branch=main)](https://coveralls.io/github/pooltogether/v4-js-client?branch=main)
[![GPLv3 license](https://img.shields.io/badge/License-GPLv3-blue.svg)](http://perso.crans.org/besson/LICENSE.html)

[Application](https://app.pooltogether.com/) | [Contracts](https://github.com/pooltogether/v4-core) | [Documentation](https://v4.docs.pooltogether.com/) | [Draw Calculator](https://github.com/pooltogether/draw-calculator-cli) | [Utility Library](https://github.com/pooltogether/v4-utils-js) | [Static Cache](https://github.com/pooltogether/v4-draw-results)

This library includes a simplified interface for interacting with a v4 PoolTogether deployment.

# 💾 Installation

This project is available as an NPM package:

```bash
$ yarn add @pooltogether/v4-js-client
```

# 🏆 Quickstart

This library consists of several classes that provide simplified interfaces to the different aspects of the V4 PoolTogether protocol.

- [PrizePoolNetwork](docs/PrizePoolNetwork.md)
- [PrizePool](docs/PrizePool.md)
- [User](docs/User.md)
- [PrizeDistributor](docs/PrizeDistributor.md)
- [DrawCalculatorApi](docs/DrawCalculatorApi.md)
- [ContractFactory](docs/ContractFactory.md)

## Initialization

### `PrizePoolNetwork`

A `PrizePoolNetwork` is a collection of `PrizePool` and `PrizeDistributor` across several chains that make up a v4 deployment.

To create an instance of `PrizePoolNetwork` you will need:

- A [Contract List](https://github.com/pooltogether/contract-list-schema) containing all of the relevant contracts for a v4 prize pool. You can obtain this by generating your own after deploying a v4 Prize Pool ([start here](https://github.com/pooltogether/v4-core)). Or by importing a copy of our current deployments [v4-pool-data](https://www.npmjs.com/package/@pooltogether/v4-pool-data).
- [Ethers providers](https://docs.ethers.io/v5/api/providers/) for every chain that a Prize Pool is deployed on.

```js
import { PrizePoolNetwork } from '@pooltogether/v4-js-client'
import { mainnet } from '@pooltogether/v4-pool-data'

const PrizePoolNetwork = new PrizePoolNetwork(providers, mainnet)
```

### `PrizePool`

A `PrizePool` is a representation of a Prize Pool deployment. The Prize Pool is responsible for managing deposits, withdrawals & delegation. `PrizePool` is a read only object, for write capabilities check out `User`

```js
const prizePool = PrizePoolNetwork.getPrizePool(1, '0xabc123')
```

### `User`

A `User` is wrapper around `PrizePool` with the ability to send transactions to manage deposits, withdrawals and delegation.

```js
const user = new User(prizePool.prizePoolMetadata, signer, prizePool)
```

### `PrizeDistributor`

A `PrizeDistributor` is what handles prizes. It is used to determine the current draw, check for prizes & claiming prizes. For write capabilities, pass a Signer when creating an instance.

```js
const prizeDistributor = PrizePoolNetwork.getPrizeDistributor(1, '0xabc123')
```

```js
const prizeDistributor = PrizePoolNetwork.getPrizeDistributor(1, '0xabc123')
const signer = provider.getSigner()
const signerPrizeDistributor = new PrizeDistributor(
  prizeDistributor.prizeDistributorMetadata,
  signer,
  prizeDistributor.contractMetadataList
)
```

## Examples

#### Get token data for a Prize Pool

```js
const tokenData = await prizePool.getTokenData() // Underlying token (ex. USDC)
const ticketData = await prizePool.getTicketData() // Ticket token
```

#### Get a users deposit token & ticket balances

```js
const usersBalances: {
  chainId: number,
  address: string,
  balances: PrizePoolTokenBalances
}[] = await PrizePoolNetwork.getUsersPrizePoolBalances(usersAddress)
```

#### Get a users deposit token & ticket balance

```js
const balance: PrizePoolTokenBalances = await prizePool.getUsersPrizePoolBalances(usersAddress)
```

#### Approve deposits

NOTE: Make sure you're shifting by the proper decimal amount

```js
const txResponse: TransactionResponse = await user.approveDeposits(
  ethers.utils.parseUnits(10, decimals)
)
```

#### Deposit and delegate tokens

NOTE: Make sure you're shifting by the proper decimal amount

```js
const txResponse: TransactionResponse = await user.depositAndDelegate(
  ethers.utils.parseUnits(10, decimals)
)
```

#### Deposit tokens

NOTE: Make sure you're shifting by the proper decimal amount

```js
const txResponse: TransactionResponse = await user.deposit(ethers.utils.parseUnits(10, decimals))
```

#### Withdraw tokens

NOTE: Make sure you're shifting by the proper decimal amount

```js
const txResponse: TransactionResponse = await user.withdraw(ethers.utils.parseUnits(10, decimals))
```

#### Get valid draw ids

Valid draw ids are draw ids that have all of the relevant data pushed to their respective chain & are not expired.

```js
const drawIds = await prizeDistributor.getValidDrawIds()
```

#### Get a users prizes

```js
const drawResults = await DrawCalculatorAPI.getUsersDrawResultsByDraw(
  1,
  usersAddress,
  prizeDistributorAddress,
  1
)
```

#### Claim a users prizes

NOTE: Ensure the `PrizeDistributor` was initialized with a `Signer`

```js
const txResponse: TransactionResponse = await prizeDistributor.claimPrizesByDraw(1)
```
