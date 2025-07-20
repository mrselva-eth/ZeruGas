# Zeru Gas Tracker

A comprehensive Web3 dashboard that tracks real-time gas prices across Ethereum, Polygon, and Arbitrum networks with wallet simulation capabilities.

## Features

- **Real-time Gas Tracking**: WebSocket connections to native RPC endpoints
- **Cross-chain Support**: Ethereum, Polygon, and Arbitrum
- **USD Pricing**: Direct Uniswap V3 ETH/USDC pool integration
- **Interactive Charts**: 15-minute candlestick intervals using lightweight-charts
- **Transaction Simulation**: Calculate costs across all chains
- **State Management**: Zustand with live/simulation mode switching

## Technical Implementation

### Architecture
- **Frontend**: Next.js 14 with TypeScript
- **State Management**: Zustand with subscriptions
- **Web3**: Ethers.js v5 with WebSocket providers
- **Charts**: TradingView's lightweight-charts
- **Styling**: Tailwind CSS with shadcn/ui

### Key Components

1. **Gas Store** (`lib/store/gas-store.ts`)
   - Manages WebSocket connections to all chains
   - Handles real-time gas price updates
   - Parses Uniswap V3 Swap events for ETH/USD pricing
   - Implements state machine for live/simulation modes

2. **Gas Price Widgets** (`components/gas-price-widget.tsx`)
   - Real-time gas price display for each chain
   - Trend indicators and cost calculations
   - Standard transaction cost estimates

3. **Interactive Chart** (`components/gas-chart.tsx`)
   - Candlestick visualization of gas price volatility
   - 15-minute interval aggregation
   - Multi-chain overlay support

4. **Transaction Simulator** (`components/transaction-simulator.tsx`)
   - Cross-chain cost comparison
   - Custom gas limit support
   - Cheapest chain identification

### Gas Calculation Details

- **Ethereum**: `baseFeePerGas + maxPriorityFeePerGas`
- **Polygon**: Base fee + 30 gwei priority fee
- **Arbitrum**: Base fee + 0.1 gwei priority fee (L2 optimized)

### USD Price Calculation

Direct parsing of Uniswap V3 Swap events:
\`\`\`javascript
price = (sqrtPriceX96^2 * 10^12) / (2^192)
\`\`\`

## Setup Instructions

1. **Clone and Install**
   \`\`\`bash
   git clone <repository-url>
   cd zeru-gas-tracker
   npm install
   \`\`\`

2. **Environment Setup**
   \`\`\`bash
   cp .env.example .env.local
   # Add your RPC WebSocket URLs
   \`\`\`

3. **Development**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Production Build**
   \`\`\`bash
   npm run build
   npm start
   \`\`\`

## RPC Endpoints

The application requires WebSocket RPC endpoints for:
- Ethereum Mainnet
- Polygon Mainnet  
- Arbitrum One

Recommended providers:
- Alchemy
- Infura
- QuickNode

## Features Demonstrated

✅ Real-time WebSocket connections to multiple chains
✅ Direct Uniswap V3 event parsing (no third-party APIs)
✅ Complex Zustand state management with mode switching
✅ Interactive candlestick charts with 15-minute intervals
✅ Cross-chain transaction cost simulation
✅ Responsive design with real-time updates
✅ Gas price trend analysis and visualization

## Performance Optimizations

- Efficient WebSocket connection management
- Historical data aggregation (96 data points max)
- Optimized chart rendering with lightweight-charts
- Selective re-renders with Zustand subscriptions

## Browser Compatibility

- Modern browsers with WebSocket support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile responsive design

## License

MIT License - see LICENSE file for details
