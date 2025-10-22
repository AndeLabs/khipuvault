# 📖 KhipuVault Nomenclature Guide

## Standard Terminology

This document establishes the standard terminology used throughout KhipuVault to ensure clarity and international understanding while honoring the cultural roots of traditional Latin American savings practices.

---

## 🏦 Pool Types

### 1. Individual Savings Pool
**Standard Name:** `IndividualPool`  
**Also Known As:** Personal Savings, Solo Pool  
**Cultural Reference:** N/A (Universal concept)

**Description:**  
Personal savings account where a single user deposits BTC, generates yields through DeFi protocols, and can withdraw anytime.

**Key Terms:**
- **Deposit** - Initial BTC contribution
- **Principal** - Original deposited amount
- **Yield** - Interest/returns generated
- **Withdrawal** - Retrieving funds

---

### 2. Cooperative Savings Pool
**Standard Name:** `CooperativePool`  
**Also Known As:** Community Pool, Group Savings, Collective Pool  
**Cultural Reference:** Credit Unions, Cooperativas

**Description:**  
Multiple members pool resources together to achieve better yields through economies of scale. Yields are distributed proportionally based on contribution.

**Key Terms:**
- **Member** - Participant in the cooperative
- **Share** - Proportional ownership in the pool
- **Contribution** - Amount deposited by member
- **Distribution** - Yield payout to members

---

### 3. Prize Pool (No-Loss Lottery)
**Standard Name:** `LotteryPool`  
**Also Known As:** Prize Savings, PoolTogether-style, No-Loss Lottery  
**Cultural Reference:** Premium Bonds (UK), Lottery Savings

**Description:**  
Participants buy tickets with BTC. Pool generates yields. Random winner receives prize (principal + majority of yields). Non-winners keep their capital for next draw.

**Key Terms:**
- **Ticket** - Entry into the draw
- **Draw** - Random selection event
- **Winner** - Selected recipient of prize
- **Prize** - Principal + accumulated yields
- **Round** - Complete lottery cycle

---

### 4. Rotating Pool (ROSCA)
**Standard Name:** `RotatingPool`  
**Also Known As:** ROSCA (Rotating Savings and Credit Association)  
**Cultural Names:** 
- **Pasanaku** (Bolivia)
- **Tanda** (Mexico)
- **Junta** (Peru)
- **San** (Dominican Republic)
- **Susu** (Caribbean/Africa)
- **Hui** (Asia)

**Description:**  
Fixed group of members contribute regularly. Each period, one member receives the entire pool in predetermined order. Process continues until all members have received their turn.

**Key Terms:**
- **Member** - Participant committed for full cycle
- **Contribution** - Regular periodic payment
- **Period** - Time between payouts (weekly/monthly)
- **Turn** - Member's designated payout period
- **Cycle** - Complete rotation through all members
- **Payout** - Distribution to turn recipient

**ROSCA Formula:**
```
Total Periods = Number of Members
Payout Amount = (Contribution × Members)
Cycle Duration = Period Duration × Members
```

**Example:**
- 12 members, $100/month contribution
- Month 1: Member A receives $1,200
- Month 2: Member B receives $1,200
- ...continues for 12 months

---

### 5. Bidding Rotating Pool
**Standard Name:** `BidRotatingPool`  
**Also Known As:** Bidding ROSCA, Auction Pool  
**Cultural Reference:** Enhanced Pasanaku/Tanda

**Description:**  
Like Rotating Pool, but members can bid to receive their turn early. Highest bidder wins early access; bid premium is distributed among other members.

**Key Terms:**
- **Bid** - Offer to receive payout early
- **Premium** - Extra amount paid for early access
- **Auction** - Competitive bidding process
- **Skip** - Moving ahead in queue

---

### 6. Hybrid Multi-Strategy Pool
**Standard Name:** `HybridPool`  
**Also Known As:** Combined Pool, Multi-Purpose Pool  
**Cultural Reference:** N/A (Innovation)

**Description:**  
Combines multiple strategies (Rotating + Prize + Emergency Fund) to serve diverse community needs within a single pool.

**Key Terms:**
- **Sub-Pool** - Individual strategy within hybrid
- **Strategy** - Specific savings mechanism
- **Allocation** - Distribution across strategies

---

## 🔑 Universal Terms

### Financial
- **Deposit** - Adding funds to pool
- **Withdrawal** - Removing funds from pool
- **Contribution** - Regular payment commitment
- **Principal** - Original invested amount
- **Yield** - Returns/interest generated
- **APR/APY** - Annual Percentage Rate/Yield
- **Fee** - Protocol charge (performance fee)
- **Collateral** - Locked assets (BTC in Mezo)

### Technical
- **Smart Contract** - Self-executing code
- **Pool** - Collection of funds
- **Vault** - Yield-generating strategy
- **Oracle** - External data provider (Chainlink)
- **VRF** - Verifiable Random Function
- **Mint** - Create tokens (MUSD from BTC)
- **Burn** - Destroy tokens (MUSD to recover BTC)

### Organizational
- **Creator** - Pool initiator
- **Member** - Pool participant
- **Owner** - Contract administrator
- **Treasury** - Protocol fee collector

---

## 🌍 Cultural Context

### Why ROSCAs Matter

**Global Names:**
- **Latin America:** Pasanaku (Bolivia), Tanda (Mexico), Junta (Peru), San (Dominican Republic)
- **Africa:** Susu, Esusu, Stokvels
- **Asia:** Hui (China), Kye (Korea), Tanomoshi (Japan)
- **Caribbean:** Sou-sou, Partner

**Historical Significance:**
ROSCAs have existed for centuries as informal financial institutions in communities with limited banking access. They demonstrate:
- Community trust and social capital
- Financial inclusion without banks
- Flexible credit access
- Cultural solidarity

**KhipuVault Innovation:**
We preserve the cultural practice while adding:
- Smart contract security (no disputes)
- DeFi yields (extra returns)
- Global accessibility (blockchain)
- Transparent automation

---

## 📊 Terminology Mapping

| Cultural Term | Standard Term | Contract Name |
|--------------|---------------|---------------|
| Pasanaku/Tanda/Junta | Rotating Pool | `RotatingPool` |
| Pasanaku con Subastas | Bidding Rotating Pool | `BidRotatingPool` |
| Sorteo | Prize Pool / Lottery | `LotteryPool` |
| Ahorro Personal | Individual Savings | `IndividualPool` |
| Cooperativa | Cooperative Pool | `CooperativePool` |
| Pool Híbrido | Hybrid Pool | `HybridPool` |

---

## 🎯 Usage Guidelines

### In Code
Use **standard English names** for clarity and international understanding:
```solidity
contract RotatingPool { ... }  // ✅ Good
contract PasanakuPool { ... }  // ❌ Avoid (cultural-specific)
```

### In Documentation
Reference **both standard and cultural names**:
```markdown
## Rotating Pool (ROSCA)
Also known as Pasanaku in Bolivia, Tanda in Mexico...
```

### In User Interface
Prioritize **standard names** with **cultural context**:
```
Rotating Pool 💫
Turn-based savings (Pasanaku/Tanda)
```

### In Comments
Explain **cultural significance**:
```solidity
// Rotating Pool: Modern implementation of ROSCA
// (Known as Pasanaku in Bolivia, Tanda in Mexico)
```

---

## 🔄 Versioning

**Version:** 1.0.0  
**Last Updated:** 2025-01-21  
**Status:** Active

### Change Log
- **v1.0.0** (2025-01-21): Initial standard nomenclature established

---

## 📚 References

- [ROSCAs on Wikipedia](https://en.wikipedia.org/wiki/Rotating_savings_and_credit_association)
- [World Bank: Informal Finance](https://www.worldbank.org/en/topic/financialinclusion)
- [PoolTogether: No-Loss Prize Savings](https://pooltogether.com)

---

## 🤝 Contributing

If you identify terminology that could be clearer or more inclusive, please:
1. Open an issue in the repository
2. Propose the change with rationale
3. Include cultural context if applicable

**Goal:** Balance international clarity with cultural respect.

---

**Maintained by:** KhipuVault Team  
**License:** MIT