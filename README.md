# 🔮 Prediction Market Protocol

A decentralized, institutional-grade event forecasting platform. This protocol allows users to trade on the outcomes of real-world events using **USDC** as collateral. Unlike traditional betting platforms, positions are represented as unique **ERC-721 NFT tickets**, enabling secondary market tradability and trustless claim logic.

---

## 🖼️ User Interface Preview

### 1. Market Exploration
Browse active, pending, and resolved markets across categories like Crypto, Sports, and Politics. Our high-performance indexing ensures sub-second filtering and search.

![All Markets Interface](./allmarkets.png)

### 2. Strategic Betting & Analytics
The trading terminal provides real-time probability visualization, potential payout calculations, and seamless USDC position entry.

![Betting Interface](./betpage.png)

### 3. Permissionless Creation
Through the `BetMarketFactory`, anyone can deploy a new prediction market by providing a seed stake and setting the event parameters.

![Create Market Interface](./createmarket.png)

---

---

## 🏗 System Architecture

The protocol is designed for maximum modularity and scalability, separating market creation from individual campaign logic.

| Layer | Contract / Component | Responsibility |
|:--- |:----------- |:-------------- |
| **Factory** | `BetMarketFactory.sol` | Trustless deployment of new markets. Enforces a "Creation Stake" to seed initial pool liquidity and prevent spam. |
| **Market** | `BetCampaign.sol` | Manages dual-pool (YES/NO) accounting, NFT ticket minting, and proportional payout distribution. |
| **Frontend**| **Next.js 14 Dashboard** | Professional trading terminal featuring real-time probability bars, search/filter, and position management. |

---

## 🧮 The Mathematical Model

The protocol uses a **Proportional Payout Model**. Winners receive their initial stake back plus a pro-rata share of the losing pool and the initial seeded pot.

### Payout Calculation
The payout for a winning ticket is calculated using the following formula:

$$Payout = \frac{UserStake \cdot (TotalPool - ProtocolFee)}{WinnersTotalStake}$$

Where:
* **TotalPool**: Sum of all YES bets, NO bets, and the initial seed pot.
* **ProtocolFee**: A fixed percentage (e.g., 2%) subtracted from the total pool upon resolution.
* **WinnersTotalStake**: The total amount wagered on the winning side.

---

## 💎 Technical Highlights

* **NFT-Based Positions (ERC-721):** Bets are represented as tradable NFTs. This allows users to sell their positions on secondary marketplaces before an event is resolved.
* **Hybrid Data Fetching:** Synchronizes on-chain smart contract state with an off-chain API to provide sub-second filtering, search, and activity tracking.
* **Oracle Resolution:** Implements a secure resolution lifecycle where a verified Oracle triggers the transition from "Active" to "Resolved" state.
* **Optimized UX:** Features batched RPC requests to prevent rate-limiting and debounced API calls for real-time payout estimations.
* **Security:** Integrated with OpenZeppelin's `ReentrancyGuard` and `SafeERC20` to ensure the safety of user collateral.

---

## 🚀 Execution Flow

### 1. Deployment
The `BetMarketFactory` deploys a `BetCampaign`. A fixed amount of USDC is pulled from the creator: 95% seeds the market's initial pot, and 5% is collected as a protocol fee.

### 2. Trading Phase
Users join a side (True/False) by depositing USDC. The contract mints a unique NFT ticket representing their stake and chosen outcome.

### 3. Resolution & Claiming
Once the `endTime` passes, the Oracle resolves the market based on the real-world outcome. Winning ticket holders can then call the `claim()` function to burn their NFT and receive their share of the pool.

---

## 🛠 Setup & Deployment

### Smart Contracts
```bash
# Compile contracts
npx hardhat compile

# Run test suite
npx hardhat test
```

## Frontend

### 1. Configure your environment variables in .env.local:

NEXT_PUBLIC_FACTORY_ADDRESS

NEXT_PUBLIC_USDC_ADDRESS

NEXT_PUBLIC_API_URL

### 2. Launch the development server:
```bash
npm run dev
```

## License
Released under the MIT License.
