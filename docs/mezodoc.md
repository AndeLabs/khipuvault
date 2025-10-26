Developer Getting Started Guide
Developer Onboarding
To bring your dApp to Mezo, you can follow one of two paths: the permissionless deployment path, which is open to all, or apply for our high-support Alpha Builder Program.

Choose Your Onboarding Path
Alpha Builder Program: If you’re looking for dedicated onboarding and co-marketing support from the Mezo team, apply for the Alpha Builder Program.
Permissionless Deployment: You can deploy permissionlessly at any time. For community DevRel support during deployment, join the Mezo Discord. Ask your question in the general channel, and you’ll be directed to the developers’ channel, where you can access weekly DevRel office hours.
Development and Deployment Steps
Read the dApp Requirements to be eligible for featuring in the Mezo Market and other promotional support.
Configure your development environment for Mezo.
Complete the Deploy your dApp to Mezo tutorial to learn the full dApp development and Passport integration process on Mezo.
Deploy your dApp to the Mezo testnet. Use the Mezo Testnet network details.
Stress test the dApp to make sure it functions as expected. The Mezo testnet is the best place to find issues early before deploying to Mezo Mainnet.
Deploy your dApp to Mainnet. Use the Mezo Mainnet network details.
Monitor your dApp. Set up monitoring and alerts to track the health of your dApp and alert you to any issues. See the Monitoring guide for details.
Post-Deployment
Get Featured
To be featured on Mezo Explore, the Supernormal Foundation, and Mezo socials and Discord channels, fill out the dApp intake form.

Note: Submitting a third-party audit report, being fully functional on Mezo mainnet, and KYB are required for official announcements. The team will review your submission and queue it for announcement.

Support & Feedback
We value your input as you build on Mezo. Please use the resources below for support and to share your feedback with our team.

Developer Feedback: Have suggestions for our documentation, tools, or your development experience? Please fill out our Developer Feedback Form.
Community Support: For technical questions and to connect with other developers, join the https://discord.com/invite/mezo.
Mezo Mainnet
Public JSON RPC Endpoints:
Boar:
HTTPS: https://rpc-http.mezo.boar.network
WSS: wss://rpc-ws.mezo.boar.network
For higher rate limits get your free API key at boar.network/mezo. Enterprise plan available - contact hello@boar.network to get started.
Imperator:
HTTPS: https://rpc_evm-mezo.imperator.co
WSS: wss://ws_evm-mezo.imperator.co
Validation Cloud:
HTTPS: https://mainnet.mezo.public.validationcloud.io
WSS: wss://mainnet.mezo.public.validationcloud.io
For higher rate limits get your free API key at validationcloud.io/mezo or contact them at validationcloud.io/contact for Enterprise plans.
Chain ID: 31612
Native Currency:
Name: Bitcoin
Symbol: BTC
Decimals: 18
Block explorer: https://explorer.mezo.org/
Mezo Testnet
Public JSON RPC Endpoint:
HTTPS: https://rpc.test.mezo.org
WSS: wss://rpc-ws.test.mezo.org
Chain ID: 31611
Native Currency:
Name: Bitcoin
Symbol: BTC
Decimals: 18
Block explorer: https://explorer.test.mezo.org/
dApp Requirements
Although the network is permissionless and anybody can deploy to Mezo Mainnet, dApps on Mezo must meet the following requirements to be featured in the Mezo Market and receive promotional support:

Mezo Passport: Developers must use Mezo Passport in their dApps to provide additional wallet connection options tailored to Bitcoin wallets and Mezo Mainnet. Passport is a React library that works with RainbowKit and does not require a specific development environment.
MUSD Integration: dApps must integrate MUSD, the native collateralized stablecoin of the Mezo ecosystem. Integration can include supporting MUSD for payments, as a primary liquidity asset, or within other core functions of the dApp.
Audit Report: The dApp must have completed a third-party security audit. The report must be submitted to the Mezo team via the intake form.
Mainnet Functionality: The dApp must be fully deployed and functional on Mezo Mainnet.
Deploy your dApp to Mezo
Use this guide to learn how to deploy applications on Mezo. This guide walks you through the steps for deploying an example dApp to Mezo Mainnet. Later, you can use this same process for your own dApp. You will learn how to complete the following tasks:

Configure a dApp with Passport.
Deploy the dApp to Mezo Testnet.
Test the dApp as an end-user.
Deploy the dApp to product on Mezo Mainnet.
Before you begin
Configure your development environment for Mezo Testnet.
Install browser wallets for both Ethereum and Bitcoin.
Get native testnet BTC for development and testing from a BTC faucet
Get testnet BTC on the Mezo testnet. This BTC is on Mezo testnet and is different from the native BTC in your Bitcoin wallet.
Step 1: Enabling the dApp with Mezo Passport
Install Passport
Install the Mezo Passport library, RainbowKit, and dependencies:

npm install @mezo-org/passport @rainbow-me/rainbowkit wagmi viem@2.x @tanstack/react-query

Configure your application
The configuration process is similar to RainbowKit but uses the getConfig method from passport, which returns a default configuration for Mezo Testnet. Pass getConfig to WagmiProvider.

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";import { QueryClient, QueryClientProvider } from "@tanstack/react-query";import { WagmiProvider } from "wagmi";import { getConfig, matsnetTestnetChain } from "@mezo-org/passport";
const queryClient = new QueryClient();
ReactDOM.createRoot(document.getElementById("root")!).render(  <React.StrictMode>    <WagmiProvider config={getConfig({ appName: "Your app name" })}>      <QueryClientProvider client={queryClient}>        <RainbowKitProvider initialChain={matsnetTestnetChain}>          {/* Your App component */}        </RainbowKitProvider>      </QueryClientProvider>    </WagmiProvider>  </React.StrictMode>,);

Connecting wallets
To connect to the Mezo Passport wallet, use the standard Wagmi or RainbowKit components.

Wagmi

import { useChainId, useConnect } from "wagmi";
export const YourApp = () => {  const chainId = useChainId();  const { connectors, connect } = useConnect();
  return (    <div>      {connectors.map((connector) => (        <button          type="button"          onClick={() => {            connect({ connector, chainId });          }}          key={connector.id}        >          {connector.name}        </button>      ))}    </div>  );};

RainbowKit

import { ConnectButton } from "@rainbow-me/rainbowkit"
export const YourApp = () => {  return <ConnectButton label="Connect wallet"/>;};

Step 2: Deploying to Mezo Testnet
Step 3: End-to-end testing
Step 4: Deploying to Mezo Mainnet
After you’ve completed development, you can deploy your dApp to Mezo Mainnet as a production application. You will need BTC on Mezo Mainnet to operate the dApp on Mezo Mainnet. Get Mezo Mainnet BTC by bridging assets to Mezo.

What’s next
Now that you’ve deployed a testnet dApp


Set Up Developer Environment
Configure your Hardhat or Foundry development environment for Mezo Testnet.

Before you begin
Before you can deploy applications, you will need an Ethereum wallet with testnet BTC to pay for the gas fees.

Connect to Mezo Testnet
Hardhat
If you are new to Hardhat, use the Hardhat Quick Start guide to learn how to install and initialize your project.

To configure Hardhat to work with Mezo Testnet, set the following items in your Hardhat config file:

Add an entry under networks for Mezo Testnet with url: "https://rpc.test.mezo.org" and chainId: 31611.
In the solidity settings, add evmVersion: "london".
As an example, see these basic Hardhat config files:

Typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  defaultNetwork: "mezotestnet",
  networks: {
    hardhat: {
    },
    mezotestnet: {
      url: "https://rpc.test.mezo.org",
      chainId: 31611,
      accounts: ["YOUR_PRIVATE_WALLET_KEY"]
    }
  },
  solidity: {
    version: "0.8.28",
    settings: {
      evmVersion: "london",
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
};

export default config;

Javascript
require("@nomiclabs/hardhat-waffle");

module.exports = {
  defaultNetwork: "mezotestnet",
  networks: {
    hardhat: {
    },
    mezotestnet: {
      url: "https://rpc.test.mezo.org",
      chainId: 31611,
      accounts: ["YOUR_PRIVATE_WALLET_KEY"]
    }
  },
  solidity: {
    version: "0.8.28",
    settings: {
      evmVersion: "london",
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
};

Foundry
If you are new to Foundry, use the Foundry Getting Started guide to learn how to install and initialize your project.

To configure a Foundry project to work with Mezo Testnet, set the following items in your Foundry TOML file under [profile.default] or a preferred profile:

Chain ID: chain_id = 31611
RPC: eth_rpc_url = "https://rpc.test.mezo.org"
EVM Version: evm_version = 'london'
As an example, see the example Foundry TOML:

[profile.default]
src = "src"
out = "out"
libs = ["lib"]
chain_id = 31611
eth_rpc_url = "https://rpc.test.mezo.org"
evm_version = 'london'


Mezo Passport Setup Guide
Mezo Passport is a package built on top of RainbowKit and provides additional wallet connection options specifically tailored for Bitcoin wallets and Mezo. With this package, developers can integrate Bitcoin wallet support alongside Ethereum-compatible (EVM) wallets to create a more versatile connection experience for users. Passport integrates with viem and wagmi libraries for streamlined wallet management across Bitcoin and EVM ecosystems.

Get the @mezo-org/passport NPM Package

If you cannot use Mezo Passport for your dApp, the configuration steps in the Configure your Environment guide are sufficient for traditional EVM development.

Before you begin
Configure your Environment for development with HardHat or Foundry.
If you are not familiar with RainbowKit, read the RainbowKit documentation to learn the basics.
Install
Install the Mezo Passport library, RainbowKit, and dependencies:

npm install @mezo-org/passport @rainbow-me/rainbowkit wagmi viem@2.x @tanstack/react-query

Configure your application
The configuration process is similar to RainbowKit but uses the getConfig method from passport, which returns a default configuration for Mezo Testnet. Pass getConfig to WagmiProvider.

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { getConfig, mezoTestnet } from "@mezo-org/passport";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={getConfig({ appName: "Your app name" })}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider initialChain={mezoTestnet}>
          {/* Your App component */}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);

Connecting wallets
To connect to the Mezo Passport wallet, use the standard Wagmi or RainbowKit components.

Wagmi
import { useChainId, useConnect } from "wagmi";

export const YourApp = () => {
  const chainId = useChainId();
  const { connectors, connect } = useConnect();

  return (
    <div>
      {connectors.map((connector) => (
        <button
          type="button"
          onClick={() => {
            connect({ connector, chainId });
          }}
          key={connector.id}
        >
          {connector.name}
        </button>
      ))}
    </div>
  );
};

RainbowKit
import { ConnectButton } from "@rainbow-me/rainbowkit"

export const YourApp = () => {
  return <ConnectButton label="Connect wallet"/>;
};

Next steps
You can find additional examples in the Mezo Passport Readme. An example dApp is available in the Passport GitHub repository


Mezo Integrations & Partners
Several organizations are partnering with Mezo to bring their dApps and services to the network.

Goldsky
Goldsky is an indexer for web3 builders that offers subgraph hosting and realtime data replication pipelines. Goldsky is available on Mezo Testnet using the slug mezo-testnet.

Goldsky Documentation
Stork
Stork is an oracle protocol that enables ultra low latency connections between data providers and both on and off-chain applications. The most common use-case for Stork is pulling and consuming market data in the form of real time price feeds for DeFi. Stork is available on Mezo Testnet.

Stork Documentation
Deployed Contracts on Mezo Testnet
Supra
Supra is a cross-chain oracle network designed to power dApps across blockchain ecosystems with fast, secure, decentralized, and scalable data solutions. Supra’s Distributed Oracle Agreement (DORA) is available on Mezo Testnet. See the Supra’s Available Networks page to find the correct pull contract and storage contract addresses.

Supra Documentation
Pyth
The Pyth Network is one of the largest first-party Oracle networks and delivers real-time data across several chains including Mezo. Pyth introduces an innovative low-latency pull oracle design where users can pull price updates onchain when needed. This enables everyone in the onchain environment to access data points efficiently. The Pyth network updates the prices every 400ms to make Pyth one of the fastest onchain oracles.

Pyth contracts:

Mezo Mainnet (proxy): 0x2880aB155794e7179c9eE2e38200202908C17B43
Mezo Testnet (proxy): 0x2880aB155794e7179c9eE2e38200202908C17B43
See the Pyth Documentation to learn how to use Pyth in your dApp.

Onchain Den
Den provides a self-custodial multi-signature wallet for onchain organizations, and is available on Mezo. Onchain Den also worked with Mezo to provide SAFE infrstructure at safe.mezo.org.

Den Documentation
FAQ
What is Mezo? The Value Proposition for Builders
Mezo is a permissionless, bank-free Bitcoin finance platform engineered to transform Bitcoin from a passive store of value into a productive, dynamic financial asset. The platform’s core mission is to enable the more than 100 million Bitcoin holders worldwide to HODL with a purpose, by using the value of their assets without needing to sell them. This is achieved by creating a robust infrastructure that facilitates cheap, fast, and secure transactions for a variety of real-world applications.

The ultimate vision for Mezo is to make the use of Bitcoin supernormal—a state where using Bitcoin for everyday financial activities is so seamless and integrated that it becomes an obvious, unremarkable part of life, like using a debit card.

For developers, Mezo presents a distinct and compelling value proposition. Thesis, the studio behind Mezo, is also the creator of tBTC, the largest decentralized Bitcoin bridge; Acre, a native Bitcoin yield protocol; and Fold, a consumer spending application. This suite of interconnected products provides developers with a powerful, pre-vetted, and highly interoperable set of “money legos” from day one. This integrated stack significantly reduces development friction and systemic risk compared to building on other platforms where essential primitives like bridges, stablecoins, and yield sources are often provided by disparate, unaffiliated third parties. By building on Mezo, developers can tap into a complete, self-reinforcing financial ecosystem designed to power a new layer of economic activity centered on the world’s most secure and decentralized asset.

What is MUSD?
At the heart of the Mezo ecosystem is MUSD, its native stablecoin. MUSD is designed to be 100% backed by Bitcoin reserves and maintain a stable 1:1 peg with the U.S. dollar. Its primary function is to serve as the liquid medium of exchange that powers the Mezo economy, enabling users to unlock the value of their Bitcoin holdings. The mechanism is straightforward: users can deposit their Bitcoin (in the form of tBTC) into a secure, on-chain vault and mint MUSD against it. This newly minted MUSD can then be used across the ecosystem for a wide range of activities, including spending on goods and services, trading on decentralized exchanges, providing liquidity to earn yield, or participating in other DeFi protocols.

For developers, Mezo & MUSD create a “batteries-included” ecosystem that offer strategic advantages:

Radically Reduced Friction with Familiar Tools (EVM & RainbowKit): Mezo is fully EVM-compatible, allowing Solidity developers to deploy existing contracts and use their favorite tools like Hardhat and Foundry with zero learning curve.
Seamless User Onboarding with Mezo Passport: Mezo Passport solves the critical wallet disconnect by allowing users to sign EVM transactions with their native Bitcoin wallets (like Xverse or Unisat). This account abstraction means you can build one clean UX to reach the entire Bitcoin community without writing complex, custom wallet logic.
Powerful Financial Primitives with MUSD: MUSD is a powerful building block. Its low, fixed interest rates and high LTV (up to 90%) are enabling technologies for predictable financial products (e.g., fixed-term loans).
What is a Circular Bitcoin Economy?
A circular Bitcoin economy is a self-sustaining system where Bitcoin is used for both earning and spending without needing to be converted to fiat currency. It creates a closed loop where individuals and businesses transact directly in BTC for salaries, goods, and services.

The combination of Mezo and MUSD creates a self-reinforcing economic loop:

Unlock: Bitcoin holders deposit their BTC and mint MUSD, activating their capital without selling their core asset.
Transact: They use this MUSD for everything from trading and lending to everyday payments.
Reinforce: This onchain activity generates transaction fees (paid in BTC), which secures the network and reinforces Bitcoin’s utility as a transactional asset, as well as a store of value.
Mezo provides the rails, and MUSD provides the fuel, giving developers a unique platform to create applications that offer tangible value to the massive, underserved market of Bitcoiners.

What is the architecture of the Mezo chain?
The Mezo chain is engineered with a hybrid architecture designed to maximize both developer accessibility and network performance. It is a fully EVM-compatible blockchain, built using the Cosmos SDK and operating on the CometBFT consensus engine. The codebase is a heavily modified fork of Evmos.

This technical stack offers a powerful combination of features:

EVM Compatibility: This allows the vast global community of Ethereum and Solidity developers to deploy their existing smart contracts and decentralized applications (dApps) on Mezo with minimal to no code changes. They can continue to use the familiar and mature toolchains they are accustomed to, including MetaMask, Hardhat, Remix, and Foundry, which dramatically lowers the barrier to entry for building within the Bitcoin ecosystem.
Cosmos SDK: Building on the Cosmos SDK provides Mezo with chain sovereignty, enabling it to customize its logic and governance.
What token is used for gas fees on Mezo?
BTC (via tBTC under the hood).

How do I get testnet BTC for Mezo?
Get testnet funds with the Mezo faucet: https://faucet.test.mezo.org/

How Do I Integrate with Mezo Passport?
​Mezo Passport is the official wallet connection library, purpose-built to provide a seamless and unified user experience on the Mezo network. It handles the complexities of connecting both Bitcoin-native wallets (like Xverse and Unisat) and standard EVM wallets (like MetaMask) to your dApp. For the most current and detailed integration guide, including installation instructions, configuration, available hooks, and code examples, developers should refer to Official Mezo Passport Documentation.

How can I get funding and support for my project?
The Supernormal Foundation

​The Supernormal Foundation is the dedicated organization tasked with building, governing, and growing the Mezo network and the MUSD economy. It operates with a community-powered ethos and is the primary source of formal support for builders.

Alpha Builder Program

​The Alpha Builder Program is the flagship initiative for early-stage developers and projects (MVP must be live on testnet) looking to build on Mezo and integrate MUSD. The program is designed to catalyze innovation in the BitcoinFi space.

Benefits: Qualified teams gain priority access to a comprehensive suite of resources, including:
Grants: Financial support to accelerate development.
Co-Marketing: Collaborative marketing efforts to boost project visibility.
Networking: Connections to other builders and leaders in the ecosystem.
Hands-on Integration Support: Direct technical assistance to ensure a smooth deployment on Mezo.
​Apply Here​

​BitcoinFi Accelerator

For projects that are more mature or have ambitious growth plans, the Supernormal Foundation partners with leading venture capital firms Boost VC, Draper Associates, and Thesis to offer a dedicated accelerator program. This intensive program provides upfront investment and tailored support, including deep mentorship on product strategy and go-to-market execution, helping teams navigate the path from a functional product to a scalable business.

Where can I find community support and ask technical questions?
The central hub for all community and developer interaction within the Mezo ecosystem is the official Discord server.​

How do I provide feedback or report an issue?
Developers may leave feedback here.

Who Are Your Partners and How Do I Integrate Them?
The following table details key partners within the Mezo ecosystem, categorized by their function. It provides a one-stop-shop for developers to assess the maturity of the available tooling and find direct links to the integration documentation needed to get started.

Pyth Network	​https://docs.pyth.network/​
Supra	​https://supra.com/docs/​
Stork	​https://docs.stork.network/​
Goldsky	​https://docs.goldsky.com/​
Onchain Den	​https://docs.onchainden.com/​
Lavender Five	​https://www.lavenderfive.com/tools/mezo/statesync​
tBTC	See tbtc.scan for reserve verification.
Developer Guide: Oracle Infrastructure
Mezo includes an oracle as part of its validator nodes. Third-party oracles are also available.

Skip Connect
Mezo uses Skip Connect as its main oracle service. Skip determines the price of an asset pair during block consensus and writes it to the onchain state of the x/oracle Cosmos module. This module is provided by Skip and it is plugged into the Mezo client.

The sidecar runs on the same system as the validator node, so data retrieval and aggregation are completed on the same system and passed to the validator node using gRPC.

A diagram showing the process where Skip aggregates market data from several sources and Mezo validators run Skip Connect and x/oracle to update onchain state with the latest values

For a complete description of how Skip aggregates data, see the Skip Providers documentation.

Skip Connect includes several providers that can be configured in the sidecar. You can find a full list of the available providers in the Skip Connect documentation:

Skip Providers (API)
Skip Providers (Websocket)
Skip Providers and Market Map references:
Providers
Markets
Stork
Stork is an oracle protocol that enables ultra low latency connections between data providers and both on and off-chain applications. The most common use-case for Stork is pulling and consuming market data in the form of real time price feeds for DeFi. Stork is available on Mezo Testnet.

Stork Documentation
Deployed Contracts on Mezo Testnet
Supra
Supra is a cross-chain oracle network designed to power dApps across blockchain ecosystems with fast, secure, decentralized, and scalable data solutions. Supra’s Distributed Oracle Agreement (DORA) is available on Mezo Testnet. See the Supra’s Available Networks page to find the correct pull contract and storage contract addresses.

Supra Documentation​
Pyth
The Pyth Network is one of the largest first-party Oracle networks and delivers real-time data across several chains including Mezo. Pyth introduces an innovative low-latency pull oracle design where users can pull price updates onchain when needed. This enables everyone in the onchain environment to access data points efficiently. The Pyth network updates the prices every 400ms to make Pyth one of the fastest onchain oracles.

Pyth’s oracle contracts:

Mezo Mainnet (proxy): 0x2880aB155794e7179c9eE2e38200202908C17B43
Mezo Testnet (proxy): 0x2880aB155794e7179c9eE2e38200202908C17B43
See the Pyth Documentation to learn how to use Pyth in your dApp.
Reading Market Data with Oracles
Mezo provides market data through two oracle systems: Skip Connect for BTC/USD and Pyth Network for additional price feeds.

Overview
Skip Oracle
The Skip oracle provides native BTC/USD price feeds on Mezo through a Chainlink-compatible aggregator interface.

Contract address: 0x7b7c000000000000000000000000000000000015 (mainnet and testnet)
Supported pair: BTC/USD only
Interface: Chainlink Aggregator
Pyth Oracle
The Pyth oracle provides multiple price feeds beyond BTC/USD.

Contract address: 0x2880aB155794e7179c9eE2e38200202908C17B43 (mainnet and testnet)
Interface: Pyth EVM contract
Update frequency: Every 1 hour or 1% price deviation
Recommended method: getPriceNoOlderThan()
Best Practices
When building dApps that consume oracle data, follow these guidelines:

Validate freshness: Always check timestamps and block numbers to detect stale data. Set appropriate staleness thresholds for your use case.
Set price bounds: Implement sanity checks on price values to detect anomalies or manipulation attempts.
Monitor market conditions: Be aware of volatility, liquidity, and potential manipulation events that may require pausing your application.
Security audits: Ensure your contracts and dependencies meet security standards. Audit code that handles oracle data to prevent exploits.
Reading Price Feeds
Using Skip Oracle (BTC/USD)
The Skip oracle implements a Chainlink-compatible interface. Call latestRoundData() to retrieve the latest price:

Contract: 0x7b7c000000000000000000000000000000000015

Return values:

roundId: The round ID when the price was updated
answer: The BTC/USD price (use decimals() to get the decimal precision)
startedAt: Unix timestamp when the round started
updatedAt: Unix timestamp when the round was last updated
Using Pyth Oracle (Multiple Feeds)
Pyth provides multiple price feeds through its EVM contract. Use getPriceNoOlderThan() to fetch prices with built-in staleness checks.

Contract Mezo Mainnet: 0x2880aB155794e7179c9eE2e38200202908C17B43

Contract Mezo Testnet: 0x2880aB155794e7179c9eE2e38200202908C17B43

Example (Solidity):

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

contract ReadPythPrice {
    IPyth public immutable pyth;

    constructor(address pythContract) {
        pyth = IPyth(pythContract); // 0x2880aB155794e7179c9eE2e38200202908C17B43 on Mezo
    }

    function getPrice(bytes32 priceId, uint256 maxAgeSeconds)
        external
        view
        returns (int64 price, uint64 conf, int32 expo, uint256 publishTime)
    {
        PythStructs.Price memory priceData = pyth.getPriceNoOlderThan(priceId, maxAgeSeconds);
        return (priceData.price, priceData.conf, priceData.expo, priceData.publishTime);
    }

    // Example: Get MUSD/USD price
    function getMUSDPrice() external view returns (int64, uint256) {
        bytes32 musdPriceId = 0x0617a9b725011a126a2b9fd53563f4236501f32cf76d877644b943394606c6de;
        PythStructs.Price memory price = pyth.getPriceNoOlderThan(musdPriceId, 3600); // Max 1 hour old
        return (price.price, price.publishTime);
    }
}

Reference: getPriceNoOlderThan API documentation

Offchain Price Data
You can query price feeds and metadata directly from the Pyth Network without interacting with the blockchain:

Hermes API: https://hermes.pyth.network/docs/#/rest/price_feeds_metadata
Price feed IDs: https://docs.pyth.network/price-feeds/price-feeds#feed-ids
Available Price Feeds
Skip Oracle Feeds
Available on both mainnet and testnet:

Pair	Contract Address	Network
BTC/USD	0x7b7c000000000000000000000000000000000015	Mainnet
BTC/USD	0x7b7c000000000000000000000000000000000015	Testnet
Node API (Testnet only): http://mezo-node-0.test.mezo.org:1317/connect/oracle/v2/get_price?currency_pair=BTC/USD

Pyth Oracle Feeds
Available on both mainnet and testnet at 0x2880aB155794e7179c9eE2e38200202908C17B43.

Currently supported price feed IDs:

Pair	Price Feed ID
SolvBTC/USD	0xf253cf87dc7d5ed5aa14cba5a6e79aee8bcfaef885a0e1b807035a0bbecc36fa
MUSD/USD	0x0617a9b725011a126a2b9fd53563f4236501f32cf76d877644b943394606c6de
BTC/USD	0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43
cbBTC/USD	0x2817d7bfe5c64b8ea956e9a26f573ef64e72e4d7891f2d6af9bcc93f7aff9a97
USDC/USD	0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a
USDT/USD	0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b
Need more price feeds? Browse all available Pyth price feed IDs and contact the Mezo team to request additional feeds be enabled onchain.

Mezo Pools (Tigris)
Overview
Tigris is Mezo’s native decentralized exchange (DEX) infrastructure, purpose-built for BitcoinFi. It enables users to swap tokens and provide liquidity using optimized pool mechanics. Tigris currently supports selected liquidity pools and curated integrations, with plans to open up permissionless access in the future.

Note: This documentation is a rough overview. More technical details will be added over the coming days.

How Pools Work
Pool Factory: Deployed by the Mezo team (not permissionless yet)
Supported Pools
Pool	Address
MUSD/BTC	0x52e604c44417233b6CcEDDDc0d640A405Caacefb
MUSD/mUSDC	0xEd812AEc0Fecc8fD882Ac3eccC43f3aA80A6c356
MUSD/mUSDT	0x10906a9E9215939561597b4C8e4b98F93c02031A
Pool Mechanics
Pool Logic: Aerodrome-style AMM (either constant-product or stable-curve depending on pair)
Swap Fees: Set per pool (e.g. 0.05%, 0.3%)
Liquidity Farming: Fee accrual enabled; reward distributions planned later
How Swaps Work
Router Contract: 0x16A76d3cd3C1e3CE843C6680d6B37E9116b5C706

Swap Flow
User approves token to router
Call router’s swapExactTokensForTokens(...) with path array
Receive output token returned to wallet
Key Features
Slippage Control: Provided on frontend or via parameters in the contract call
No Oracles Needed: Prices derived from pool reserves directly
Contract Addresses
Core Contracts
Name	Address
Router	0x16A76d3cd3C1e3CE843C6680d6B37E9116b5C706
PoolFactory	0x83FE469C636C4081b87bA5b3Ae9991c6Ed104248
MUSD/BTC Pool	0x52e604c44417233b6CcEDDDc0d640A405Caacefb
MUSD/mUSDC Pool	0xEd812AEc0Fecc8fD882Ac3eccC43f3aA80A6c356
MUSD/mUSDT Pool	0x10906a9E9215939561597b4C8e4b98F93c02031A
Mainnet Contracts
Name	Address
Router	0x16A76d3cd3C1e3CE843C6680d6B37E9116b5C706
PoolFactory	0x83FE469C636C4081b87bA5b3Ae9991c6Ed104248
MUSD/BTC Pool	0x52e604c44417233b6CcEDDDc0d640A405Caacefb
MUSD/mUSDC Pool	0xEd812AEc0Fecc8fD882Ac3eccC43f3aA80A6c356
MUSD/mUSDT Pool	0x10906a9E9215939561597b4C8e4b98F93c02031A
VeBTC	0x7D807e9CE1ef73048FEe9A4214e75e894ea25914
VeBTCVoter	0x3A4a6919F70e5b0aA32401747C471eCfe2322C1b
VeBTCRewardsDistributor	0x535E01F948458E0b64F9dB2A01Da6F32E240140f
VeBTCEpochGovernor	0x1494102fa1b240c3844f02e0810002125fb5F054
ChainFeeSplitter	0xcb79aE130b0777993263D0cdb7890e6D9baBE117
Testnet Contracts
Name	Address
Router	0x9a1ff7FE3a0F69959A3fBa1F1e5ee18e1A9CD7E9
PoolFactory	0x4947243CC818b627A5D06d14C4eCe7398A23Ce1A
MUSD/BTC Pool	0xd16A5Df82120ED8D626a1a15232bFcE2366d6AA9
MUSD/mUSDC Pool	0x525F049A4494dA0a6c87E3C4df55f9929765Dc3e
MUSD/mUSDT Pool	0x27414B76CF00E24ed087adb56E26bAeEEe93494e
VeBTC	0xB63fcCd03521Cf21907627bd7fA465C129479231
VeBTCVoter	0x72F8dd7F44fFa19E45955aa20A5486E8EB255738
VeBTCRewardsDistributor	0x10B0E7b3411F4A38ca2F6BB697aA28D607924729
VeBTCEpochGovernor	0x12fda93041aD8aB6d133aE4d038b5159033d937a
ChainFeeSplitter	0x63aD4D014246eaD52408dF3BC8F046107cbf6065

Mezo Bridge Overview
Mezo Bridge enables native asset movement between Bitcoin, Ethereum, and Mezo. Below are the primary flows with references to the design RFCs.

Bridge In to Mezo
From Bitcoin → Mezo

Lock BTC to the bridge-controlled address with metadata identifying the Mezo recipient.
Submit proof and attestation to Mezo Bridge contract.
Contract verifies proof.
Mint corresponding asset on Mezo to recipient.
From Ethereum → Mezo

Lock the ERC-20 on Ethereum via the Mezo Bridge contract, emitting an AssetLocked event with Mezo recipient.
Bridge validators listen for such events.
Bridge validators validate events inclusion and validator quorum.
Mint corresponding asset on Mezo to recipient.
Bridge Out of Mezo
From Mezo → Bitcoin

Burn the asset on Mezo specifying the Bitcoin recipient address.
Submit proof and attestation to Mezo Bridge contract.
Contract verifies proof.
Upon verification, BTC is released to the recipient address.
From Mezo → Ethereum

Burn the asset on Mezo specifying the Ethereum recipient.
Bridge validators listen for AssetsUnlocked events.
Bridge validators validate events inclusion and validator quorum.
Upon verification, the ERC-20 is released to the recipient.
Architecture
Lock/Burn on Source: Assets are locked on Bitcoin/Ethereum (or burned on Mezo) with data that identifies the intended recipient and target chain.
Attestation & Relay: Offchain clients produce attestations over source-chain events and relay proofs to the destination chain.
Mint/Release on Destination: Upon valid attestation and proof verification, destination contracts mint wrapped assets or release locked funds.
Core Flow
User initiates a bridge transfer specifying destination address and amount.
Source-chain contract/event is emitted after lock/burn; event includes unique sequence ID and parameters.
Offchain client collects confirmations/finality per RFC thresholds and submit proof+attestation to destination contract.
Destination verifies:
event authenticity
validator quorum/signatures
On success, destination executes mint/release and records completion.
Contracts
Mainnet:

Mezo Bridge: 0xF6680EA3b480cA2b72D96ea13cCAF2cFd8e6908c
Bridged tokens list
Sepolia:

Mezo Bridge: 0x3a3BaE133739f92a885070DbF3300d61B232497C
Bridged tokens list
Audits
Please see the Audits page for the latest audits.

Additional Resources
For full technical details, message formats, and security rationale, see the following RFCs:

RFC-2: Mezo Bridge
RFC-4: Mezo Bridge
RFC-5: Mezo Bridge

Wormhole MUSD Bridge
The MUSD bridge is powered by Wormhole’s Native Token Transfer (NTT) protocol, which enables secure cross-chain transfers while maintaining token fungibility. For more information about MUSD bridge, see the MUSD Bridge page.
MUSD Redemptions
How to Redeem MUSD on Mezo
Quick Overview
Redeeming lets you burn 1 MUSD to recieve $1 in BTC (minus a 0.75% redemption fee and gas fees). The system redeems starting from the trove with the lowest collateral ratio above 110%. If the amount of MUSD exceeds a single trove, it will continue to redeem in ascending order of collateraliztion ratio.

Troves with collateralization ratios below 110% are eligible for liquidation, and cannot be redeemed against.

Prerequisites
Before you start, verify:

System is accepting redemptions: Go to TroveManager → “Read as Proxy” → call getTCR() with current BTC price. Must show ≥ 1100000000000000000 (110%)
You have MUSD: Check your balance on the MUSD token contract
Get current BTC price: Go to PriceFeed → “Read as Proxy” → call fetchPrice()
Get correct contract addresses: See contract addresses at the bottom for both Mainnet and Testnet.
Step-by-Step Instructions
1. Go to TroveManager Contract
Open the TroveManager contract in your block explorer and click the “Write as Proxy” tab.

2. Find Function 11: redeemCollateral
You’ll see 6 input fields. Here’s how to fill them:

Option A: Quick & Simple (Higher Gas)
Use this if you want to redeem quickly without calculating hints.

_amount: [your amount in wei - see conversion below]
_firstRedemptionHint: 0x0000000000000000000000000000000000000000
_upperPartialRedemptionHint: [your wallet address]
_lowerPartialRedemptionHint: [your wallet address]
_partialRedemptionHintNICR: 1100000000000000000000
_maxIterations: 0
Converting MUSD to Wei:

100 MUSD = 100000000000000000000
5,005 MUSD = 5005000000000000000000
Formula: Your amount × 1000000000000000000

Option B: With Hints (Lower Gas)
Use this to save on gas costs.

Step 1: Get Redemption Hints
Go to HintHelpers → “Read as Proxy” → getRedemptionHints()

Fill in:

_amount: Your amount in wei (same as above)
_price: Current BTC price from PriceFeed
_maxIterations: 50
Copy the returned values:

firstRedemptionHint
partialRedemptionHintNICR
Step 2: Get Position Hints
Go to SortedTroves → “Read as Proxy” → findInsertPosition()

Fill in:

_NICR: Use the partialRedemptionHintNICR from Step 1
_prevId: Your wallet address
_nextId: Your wallet address
Copy the returned values:

upperHint
lowerHint
Step 3: Call redeemCollateral
Go back to TroveManager → “Write as Proxy” → redeemCollateral

_amount: [your amount in wei]
_firstRedemptionHint: [from Step 1]
_upperPartialRedemptionHint: [upperHint from Step 2]
_lowerPartialRedemptionHint: [lowerHint from Step 2]
_partialRedemptionHintNICR: [from Step 1]
_maxIterations: 50
What You’ll Receive
Example: Redeeming 100 MUSD

You burn: 100 MUSD
You receive: $99.25 worth of BTC (0.75% fee goes to protocol)
Formula: (Your MUSD Amount ÷ BTC Price) × 0.9925 = BTC received

Common Issues
“Cannot redeem when TCR < MCR” → System TCR is below 110%. Wait until it recovers.

“Unable to redeem any amount” → This can happen for several reasons:

No troves available with collateral ratio above 110%
Hints are out of date (specifically the NICR hint)
The redemption amount would leave the target trove with less than the minimum debt requirement of 1,800 MUSD
Max iterations set too low for the redemption size
Transaction runs out of gas → Lower _maxIterations to 10 or split into smaller redemptions.

Transaction reverts unexpectedly → Get fresh hints and try again. Someone may have redeemed before you.

Received less than expected → Check the Redemption event in your transaction. Some MUSD may have been returned if the last trove would go below 1,800 MUSD minimum.

Tips
Generate hints immediately before redeeming - They become stale if someone else redeems first
Use Option A for small amounts (< $10,000) - The higher gas cost is negligible
Use Option B for large amounts - Saves significant gas on big redemptions
Set higher maxIterations for larger redemptions:
Small (< 10 troves): 10
Medium (10-30 troves): 50
Large (30+ troves): 100
Contract Addresses
Contract	Mainnet	Testnet
TroveManager	0x94AfB503dBca74aC3E4929BACEeDfCe19B93c193	0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0
HintHelpers	0xD267b3bE2514375A075fd03C3D9CBa6b95317DC3	0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6
SortedTroves	0x8C5DB4C62BF29c1C4564390d10c20a47E0b2749f	0x722E4D24FD6Ff8b0AC679450F3D91294607268fA
BorrowerOperations	0x44b1bac67dDA612a41a58AAf779143B181dEe031	0xCdF7028ceAB81fA0C6971208e83fa7872994beE5
PriceFeed	0xc5aC5A8892230E0A3e1c473881A2de7353fFcA88	0x86bCF0841622a5dAC14A313a15f96A95421b9366
MUSD Token	0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186	0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503
All addresses are proxy contracts. Always use “Read as Proxy” or “Write as Proxy” tabs.

Need Help?
Check your transaction on the block explorer to see events and error messages
Join our Discord and open a ticket: https://discord.com/invite/mezo
