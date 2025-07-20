import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import { ethers } from "ethers"

export interface GasPoint {
  timestamp: number
  baseFee: number
  priorityFee: number
  totalFee: number
}

export interface ChainData {
  baseFee: number
  priorityFee: number
  history: GasPoint[]
  lastUpdate: number
}

export interface TokenPrices {
  ETH: number
  MATIC: number
  lastUpdated: {
    ETH: number
    MATIC: number
  }
}

export interface GasState {
  mode: "live" | "simulation"
  chains: {
    ethereum: ChainData
    polygon: ChainData
    arbitrum: ChainData
  }
  tokenPrices: TokenPrices
  providers: {
    ethereum?: ethers.providers.WebSocketProvider
    polygon?: ethers.providers.WebSocketProvider
    arbitrum?: ethers.providers.WebSocketProvider
  }
  uniswapProvider?: ethers.providers.WebSocketProvider
  isConnected: boolean

  // Actions
  setMode: (mode: "live" | "simulation") => void
  updateChainData: (chain: keyof GasState["chains"], data: Partial<ChainData>) => void
  updateTokenPrice: (token: keyof Omit<TokenPrices, "lastUpdated">, price: number) => void
  initializeConnections: () => void
  cleanup: () => void
}

const initialChainData: ChainData = {
  baseFee: 0,
  priorityFee: 0,
  history: [],
  lastUpdate: 0,
}

export const useGasStore = create<GasState>()(
  subscribeWithSelector((set, get) => ({
    mode: "live",
    chains: {
      ethereum: { ...initialChainData },
      polygon: { ...initialChainData },
      arbitrum: { ...initialChainData },
    },
    tokenPrices: {
      ETH: 0,
      MATIC: 0,
      lastUpdated: {
        ETH: 0,
        MATIC: 0,
      },
    },
    providers: {},
    isConnected: false,

    setMode: (mode) => set({ mode }),

    updateChainData: (chain, data) =>
      set((state) => ({
        chains: {
          ...state.chains,
          [chain]: {
            ...state.chains[chain],
            ...data,
            lastUpdate: Date.now(),
          },
        },
      })),

    updateTokenPrice: (token, price) =>
      set((state) => ({
        tokenPrices: {
          ...state.tokenPrices,
          [token]: price,
          lastUpdated: {
            ...state.tokenPrices.lastUpdated,
            [token]: Date.now(),
          },
        },
      })),

    initializeConnections: async () => {
      const state = get()
      if (state.isConnected) return

      try {
        // Initialize WebSocket providers
        const ethProvider = new ethers.providers.WebSocketProvider(
          process.env.NEXT_PUBLIC_ETHEREUM_WS_URL || "wss://eth-mainnet.ws.alchemyapi.io/v2/demo",
        )
        const polygonProvider = new ethers.providers.WebSocketProvider(
          process.env.NEXT_PUBLIC_POLYGON_WS_URL || "wss://polygon-mainnet.ws.alchemyapi.io/v2/demo",
        )
        const arbitrumProvider = new ethers.providers.WebSocketProvider(
          process.env.NEXT_PUBLIC_ARBITRUM_WS_URL || "wss://arb-mainnet.ws.alchemyapi.io/v2/demo",
        )

        set({
          providers: {
            ethereum: ethProvider,
            polygon: polygonProvider,
            arbitrum: arbitrumProvider,
          },
          uniswapProvider: ethProvider, // Use Ethereum provider for Uniswap
          isConnected: true,
        })

        // Start listening for new blocks
        setupBlockListeners(ethProvider, "ethereum")
        setupBlockListeners(polygonProvider, "polygon")
        setupBlockListeners(arbitrumProvider, "arbitrum")

        // Start price tracking for both ETH and MATIC
        setupPriceTracking(ethProvider)
      } catch (error) {
        console.error("Failed to initialize connections:", error)
      }
    },

    cleanup: () => {
      const { providers, uniswapProvider } = get()
      Object.values(providers).forEach((provider) => {
        if (provider) {
          // Clear price interval if it exists
          if ((provider as any)._priceInterval) {
            clearInterval((provider as any)._priceInterval)
          }
          provider.removeAllListeners()
          provider.destroy()
        }
      })
      if (uniswapProvider) {
        if ((uniswapProvider as any)._priceInterval) {
          clearInterval((uniswapProvider as any)._priceInterval)
        }
        uniswapProvider.removeAllListeners()
      }
      set({ providers: {}, uniswapProvider: undefined, isConnected: false })
    },
  })),
)

function setupBlockListeners(provider: ethers.providers.WebSocketProvider, chain: keyof GasState["chains"]) {
  provider.on("block", async (blockNumber) => {
    try {
      const block = await provider.getBlock(blockNumber)
      if (!block) return

      const baseFee = block.baseFeePerGas ? Number.parseFloat(ethers.utils.formatUnits(block.baseFeePerGas, "gwei")) : 0

      // Estimate priority fee (simplified)
      const priorityFee = chain === "polygon" ? 30 : chain === "arbitrum" ? 0.1 : 2

      const gasPoint: GasPoint = {
        timestamp: block.timestamp * 1000,
        baseFee,
        priorityFee,
        totalFee: baseFee + priorityFee,
      }

      useGasStore.getState().updateChainData(chain, {
        baseFee,
        priorityFee,
        history: [...useGasStore.getState().chains[chain].history.slice(-95), gasPoint], // Keep last 96 points (24 hours of 15-min intervals)
      })
    } catch (error) {
      console.error(`Error processing block for ${chain}:`, error)
    }
  })
}

function setupPriceTracking(provider: ethers.providers.WebSocketProvider) {
  // Fetch initial prices
  fetchTokenPrices(provider)

  // Update prices every 60 seconds (increased from 30s to reduce API calls)
  const priceInterval = setInterval(() => {
    fetchTokenPrices(provider)
  }, 60000)

  // Store interval reference for cleanup
  ;(provider as any)._priceInterval = priceInterval
}

async function fetchTokenPrices(provider: ethers.providers.WebSocketProvider) {
  console.log("🔄 Fetching token prices...")

  // Fetch both ETH and MATIC prices using Chainlink price feeds
  await Promise.all([
    fetchChainlinkPrice(provider, "ETH", "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"), // ETH/USD
    fetchChainlinkPrice(provider, "MATIC", "0x7bAC85A8a13A4BcD8abb3eB7d6b4d632c5a57676"), // MATIC/USD
  ])

  const { tokenPrices } = useGasStore.getState()
  console.log("💰 Current prices:", {
    ETH: `$${tokenPrices.ETH.toFixed(2)}`,
    MATIC: `$${tokenPrices.MATIC.toFixed(4)}`,
    lastUpdated: {
      ETH: new Date(tokenPrices.lastUpdated.ETH).toLocaleTimeString(),
      MATIC: new Date(tokenPrices.lastUpdated.MATIC).toLocaleTimeString(),
    },
  })
}

async function fetchChainlinkPrice(
  provider: ethers.providers.WebSocketProvider,
  token: keyof Omit<TokenPrices, "lastUpdated">,
  feedAddress: string,
) {
  try {
    console.log(`📡 Fetching ${token} price from Chainlink feed: ${feedAddress}`)

    // ABI for Chainlink price feed (latestRoundData function)
    const CHAINLINK_ABI = [
      "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
      "function decimals() external view returns (uint8)",
    ]

    const contract = new ethers.Contract(feedAddress, CHAINLINK_ABI, provider)

    // Get both price and decimals to ensure accuracy
    const [roundData, decimals] = await Promise.all([contract.latestRoundData(), contract.decimals()])

    const tokenPrice = Number.parseFloat(ethers.utils.formatUnits(roundData.answer, decimals))

    console.log(`💲 ${token} price from Chainlink:`, {
      price: `$${tokenPrice.toFixed(token === "MATIC" ? 4 : 2)}`,
      decimals: decimals,
      rawAnswer: roundData.answer.toString(),
      updatedAt: new Date(roundData.updatedAt.toNumber() * 1000).toLocaleString(),
    })

    // Validate price range with more reasonable bounds
    const isValidPrice =
      token === "ETH"
        ? tokenPrice > 500 && tokenPrice < 10000 // ETH: $500-$10,000
        : tokenPrice > 0.05 && tokenPrice < 5 // MATIC: $0.05-$5

    if (isValidPrice) {
      useGasStore.getState().updateTokenPrice(token, tokenPrice)
      console.log(`✅ ${token} price updated successfully: $${tokenPrice.toFixed(token === "MATIC" ? 4 : 2)}`)
    } else {
      console.warn(`⚠️ ${token} price $${tokenPrice} is outside expected range, using fallback`)
      throw new Error(`Price outside expected range: ${tokenPrice}`)
    }
  } catch (error) {
    console.error(`❌ Error fetching ${token} price:`, error)

    // Use more realistic fallback prices based on recent market data
    const fallbackPrices = {
      ETH: 2500, // More conservative ETH price
      MATIC: 0.85, // More realistic MATIC price
    }

    console.log(`🔄 Using fallback price for ${token}: $${fallbackPrices[token]}`)
    useGasStore.getState().updateTokenPrice(token, fallbackPrices[token])
  }
}

export { fetchTokenPrices }
