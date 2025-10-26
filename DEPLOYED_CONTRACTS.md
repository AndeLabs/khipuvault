# 📝 KhipuVault - Deployed Contracts on Mezo Testnet

**Network**: Mezo Testnet  
**Chain ID**: 31611  
**RPC**: https://rpc.test.mezo.org  
**Explorer**: https://explorer.test.mezo.org  
**Deployed**: October 24, 2025

---

## 🏗️ Core Integration Contracts

| Contract | Address | Description |
|----------|---------|-------------|
| **MezoIntegration** | `0xa19B54b8b3f36F047E1f755c16F423143585cc6B` | Wrapper for Mezo MUSD protocol with native BTC support |
| **YieldAggregator** | `0x5BDac57B68f2Bc215340e4Dc2240f30154f4A007` | Yield aggregation and distribution manager |

---

## 🏊 Pool Contracts (Production Ready)

| Contract | Address | Description |
|----------|---------|-------------|
| **IndividualPool** | `0x6028E4452e6059e797832578D70dBdf63317538a` | Individual savings pool with native BTC deposits |
| **CooperativePool** | `0x92eCA935773b71efB655cc7d3aB77ee23c088A7a` | Cooperative savings pool for group deposits |
| **SimpleLotteryPool** | `0x3e5d272321e28731844c20e0a0c725a97301f83a` | Prize pool lottery where users never lose capital |

---

## 🔗 Mezo Protocol Contracts (Pre-deployed)

| Contract | Address | Description |
|----------|---------|-------------|
| **MUSD Token** | `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` | Native stablecoin on Mezo |
| **BorrowerOperations** | `0xCdF7028ceAB81fA0C6971208e83fa7872994beE5` | Mezo protocol borrowing operations |
| **TroveManager** | `0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0` | Manages user positions (Troves) |
| **HintHelpers** | `0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6` | Helper for sorted trove operations |
| **PriceFeed** | `0x86bCF0841622a5dAC14A313a15f96A95421b9366` | BTC price oracle |
| **SortedTroves** | `0x722E4D24FD6Ff8b0AC679450F3D91294607268fA` | Sorted list of troves |

---

## ⚙️ Configuration

```javascript
// Frontend Configuration
export const MEZO_TESTNET_CONFIG = {
  chainId: 31611,
  rpcUrl: 'https://rpc.test.mezo.org',
  contracts: {
    // KhipuVault
    mezoIntegration: '0xa19B54b8b3f36F047E1f755c16F423143585cc6B',
    yieldAggregator: '0x5BDac57B68f2Bc215340e4Dc2240f30154f4A007',
    individualPool: '0x6028E4452e6059e797832578D70dBdf63317538a',
    cooperativePool: '0x92eCA935773b71efB655cc7d3aB77ee23c088A7a',
    lotteryPool: '0x3e5d272321e28731844c20e0a0c725a97301f83a',
    
    // Mezo Protocol
    musd: '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503',
    mezoBorrowerOperations: '0xCdF7028ceAB81fA0C6971208e83fa7872994beE5',
    mezoTroveManager: '0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0',
    mezoHintHelpers: '0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6',
    mezoPriceFeed: '0x86bCF0841622a5dAC14A313a15f96A95421b9366',
    mezoSortedTroves: '0x722E4D24FD6Ff8b0AC679450F3D91294607268fA',
  }
}
```

---

## 📱 Quick Links

- [MezoIntegration on Explorer](https://explorer.test.mezo.org/address/0xa19B54b8b3f36F047E1f755c16F423143585cc6B)
- [YieldAggregator on Explorer](https://explorer.test.mezo.org/address/0x5BDac57B68f2Bc215340e4Dc2240f30154f4A007)
- [IndividualPool on Explorer](https://explorer.test.mezo.org/address/0x6028E4452e6059e797832578D70dBdf63317538a)
- [CooperativePool on Explorer](https://explorer.test.mezo.org/address/0x92eCA935773b71efB655cc7d3aB77ee23c088A7a)
- [SimpleLotteryPool on Explorer](https://explorer.test.mezo.org/address/0x3e5d272321e28731844c20e0a0c725a97301f83a)

---

## ⚠️ Important Notes

1. **BTC is NATIVE on Mezo** - Send BTC directly to payable functions (no approvals)
2. **18 Decimals** - BTC has 18 decimals on Mezo (not 8)
3. **No WBTC** - Do not use ERC20 token patterns for BTC
4. **Payable Functions** - Use `msg.value` to send BTC amounts

---

**Status**: ✅ All core contracts deployed and ready for testing
