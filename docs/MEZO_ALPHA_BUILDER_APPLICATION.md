# KhipuVault - Mezo Alpha Builder Application

## Project Summary

**KhipuVault** is a decentralized Bitcoin savings platform built natively on the Mezo blockchain. We enable users to earn yield on their BTC holdings through MUSD stablecoin deposits, combining traditional savings mechanisms with no-loss lottery pools.

---

## What We're Building

### 1. Individual Savings Pools

Users deposit MUSD and earn yield through Mezo's native stability pool integration. Features include:

- One-click deposits with automatic yield compounding
- Real-time portfolio tracking
- Seamless withdraw with no lock-up periods

### 2. Prize Pools (No-Loss Lottery)

A PoolTogether-inspired system where depositors earn lottery tickets proportional to their deposits. Key innovations:

- **Commit-reveal randomness** preventing front-running
- **Multi-block entropy** for enhanced security before VRF integration
- **Winner takes yield, everyone keeps principal**

### 3. Cooperative Savings (Tandas/ROSCAs)

Group savings circles based on Latin American "tandas":

- Rotating distribution among members
- Smart contract-enforced commitment
- Social savings mechanics on-chain

---

## Why Mezo?

Mezo is the ideal home for KhipuVault because:

1. **Bitcoin-Native**: Our users want BTC-backed yields, not speculative DeFi
2. **MUSD Integration**: Native stablecoin enables familiar savings UX
3. **Low Fees**: Essential for frequent savings deposits
4. **Growing Ecosystem**: Early opportunity to become core infrastructure

---

## Technical Stack

| Layer           | Technology                      | Status     |
| --------------- | ------------------------------- | ---------- |
| Smart Contracts | Solidity 0.8.28, Foundry        | Production |
| Frontend        | Next.js 15, Wagmi 2.x, Viem 2.x | Production |
| Backend         | Express.js, Prisma, PostgreSQL  | Production |
| Indexer         | ethers.js event listeners       | Production |
| Auth            | SIWE (Sign-In With Ethereum)    | Production |

### Deployed Contracts (Mezo Testnet)

```
IndividualPool:   0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393
CooperativePool:  0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88
MezoIntegration:  0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6
YieldAggregator:  0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6
```

---

## Security Posture

### Completed

- [x] Aderyn static analysis (10 High, 13 Low findings reviewed)
- [x] Flash loan protection implemented
- [x] Reentrancy guards on all pools
- [x] CEI pattern verified across contracts
- [x] 109 Foundry tests passing

### Planned

- [ ] External audit engagement (Q1 2025)
- [ ] Chainlink VRF integration for mainnet
- [ ] Bug bounty program launch

---

## Traction & Metrics

| Metric             | Current | 3-Month Target |
| ------------------ | ------- | -------------- |
| Contracts Deployed | 5       | 5+             |
| Test Coverage      | 95%+    | 95%+           |
| TVL Target         | -       | $500K          |
| Active Users       | -       | 1,000          |

---

## Team

We are a small but experienced team with backgrounds in:

- **Smart Contract Development**: 3+ years Solidity, previous audit experience
- **Full-Stack Engineering**: React, Node.js, PostgreSQL
- **DeFi Experience**: Previously contributed to lending protocols

---

## Funding Request

We're seeking **$70,000** over 3 months to:

| Category       | Amount  | Purpose                        |
| -------------- | ------- | ------------------------------ |
| Development    | $45,000 | Core team salaries             |
| Security Audit | $10,000 | External smart contract audit  |
| Infrastructure | $6,000  | Servers, RPC nodes, monitoring |
| Growth         | $9,000  | Marketing, partnerships        |

---

## Milestones

### Month 1 (January 2025)

- External audit completion
- Staging environment launch
- 50 beta users onboarded

### Month 2 (February 2025)

- Prize Pool public launch
- Portfolio analytics dashboard
- 200 active users

### Month 3 (March 2025)

- Cooperative Pools launch
- Ecosystem integrations
- Mainnet deployment preparation

---

## Demo & Resources

- **Live Demo**: [Testnet App URL]
- **GitHub**: Private (available upon request)
- **Documentation**: `/docs` folder in repository
- **Technical Roadmap**: `ROADMAP.md`

---

## Why Support KhipuVault?

1. **Production-Ready Code**: Not a prototype - fully functional contracts and frontend
2. **Security-First**: Proactive auditing and best practices from day one
3. **Mezo-Native**: Built specifically for the Mezo ecosystem
4. **Real Use Case**: Savings and lottery are proven DeFi primitives
5. **Underserved Market**: Latin American savings groups (tandas) have no on-chain equivalent

---

## Contact

- **Lead Developer**: [Name]
- **Email**: team@khipuvault.io
- **Telegram**: @khipuvault
- **Twitter**: @KhipuVault

---

_Application submitted: December 2024_
