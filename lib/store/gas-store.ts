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
  refreshPrices: () => void
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
      if (state.isConnected) {
        console.log("🔄 Already connected, skipping initialization")
        return
      }

      console.log("🚀 Initializing WebSocket connections...")

      try {
        // Check if environment variables are set
        const ethUrl = process.env.NEXT_PUBLIC_ETHEREUM_WS_URL
        const polygonUrl = process.env.NEXT_PUBLIC_POLYGON_WS_URL
        const arbitrumUrl = process.env.NEXT_PUBLIC_ARBITRUM_WS_URL

        console.log("🔧 Environment URLs:", {
          ethereum: ethUrl ? "✅ Set" : "❌ Missing",
          polygon: polygonUrl ? "✅ Set" : "❌ Missing",
          arbitrum: arbitrumUrl ? "✅ Set" : "❌ Missing",
        })

        // Use fallback URLs if environment variables are not set
        const ethProvider = new ethers.providers.WebSocketProvider(ethUrl || "wss://ethereum-rpc.publicnode.com")
        const polygonProvider = new ethers.providers.WebSocketProvider(
          polygonUrl || "wss://polygon-bor-rpc.publicnode.com",
        )
        const arbitrumProvider = new ethers.providers.WebSocketProvider(
          arbitrumUrl || "wss://arbitrum-one-rpc.publicnode.com",
        )

        // Test connections
        console.log("🧪 Testing WebSocket connections...")

        try {
          await ethProvider.getNetwork()
          console.log("✅ Ethereum connection successful")
        } catch (error) {
          console.error("❌ Ethereum connection failed:", error)
        }

        try {
          await polygonProvider.getNetwork()
          console.log("✅ Polygon connection successful")
        } catch (error) {
          console.error("❌ Polygon connection failed:", error)
        }

        try {
          await arbitrumProvider.getNetwork()
          console.log("✅ Arbitrum connection successful")
        } catch (error) {
          console.error("❌ Arbitrum connection failed:", error)
        }

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

        // Start Uniswap V3 price tracking for ETH/USD
        setupUniswapV3PriceTracking(ethProvider)

        // Start Chainlink price tracking for MATIC (since it's not in the main ETH/USDC pool)
        setupMaticPriceTracking(ethProvider)

        console.log("🎉 All connections initialized successfully!")
      } catch (error) {
        console.error("💥 Failed to initialize connections:", error)
        set({ isConnected: false })
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
    refreshPrices: () => {
      const { providers } = get()
      if (providers.ethereum) {
        // Refresh ETH price from Uniswap V3
        const UNISWAP_V3_POOL_ABI = [
          "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
        ]
        const poolContract = new ethers.Contract(
          "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640",
          UNISWAP_V3_POOL_ABI,
          providers.ethereum,
        )
        fetchInitialUniswapPrice(poolContract)

        // Refresh MATIC price from Chainlink
        fetchMaticPrice(providers.ethereum)
      }
    },
  })),
)

function setupBlockListeners(provider: ethers.providers.WebSocketProvider, chain: keyof GasState["chains"]) {
  console.log(`🔗 Setting up block listener for ${chain}`)

  provider.on("block", async (blockNumber) => {
    try {
      console.log(`📦 New block on ${chain}: ${blockNumber}`)
      const block = await provider.getBlock(blockNumber)
      if (!block) {
        console.warn(`⚠️ No block data received for ${chain} block ${blockNumber}`)
        return
      }

      const baseFee = block.baseFeePerGas ? Number.parseFloat(ethers.utils.formatUnits(block.baseFeePerGas, "gwei")) : 0

      // Estimate priority fee (simplified)
      const priorityFee = chain === "polygon" ? 30 : chain === "arbitrum" ? 0.1 : 2

      console.log(`⛽ ${chain} gas data:`, {
        blockNumber,
        baseFee: baseFee.toFixed(2),
        priorityFee,
        totalFee: (baseFee + priorityFee).toFixed(2),
      })

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
      console.error(`❌ Error processing block for ${chain}:`, error)
    }
  })

  // Add connection event listeners
  provider.on("connect", () => {
    console.log(`✅ ${chain} WebSocket connected`)
  })

  provider.on("disconnect", (error) => {
    console.error(`❌ ${chain} WebSocket disconnected:`, error)
  })

  provider.on("error", (error) => {
    console.error(`❌ ${chain} WebSocket error:`, error)
  })
}

// Uniswap V3 ETH/USDC Pool: 0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640
const UNISWAP_V3_ETH_USDC_POOL = "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640"

function setupUniswapV3PriceTracking(provider: ethers.providers.WebSocketProvider) {
  console.log("🦄 Setting up Uniswap V3 ETH/USDC price tracking...")

  // Uniswap V3 Pool ABI - we only need the Swap event
  const UNISWAP_V3_POOL_ABI = [
    "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
    "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
  ]

  const poolContract = new ethers.Contract(UNISWAP_V3_ETH_USDC_POOL, UNISWAP_V3_POOL_ABI, provider)

  // Get initial price from slot0
  fetchInitialUniswapPrice(poolContract)

  // Listen for Swap events
  poolContract.on("Swap", (sender, recipient, amount0, amount1, sqrtPriceX96, liquidity, tick, event) => {
    try {
      console.log("🔄 Uniswap V3 Swap event detected")

      // Calculate ETH/USD price from sqrtPriceX96
      // Formula: price = (sqrtPriceX96^2 * 10^12) / (2^192)
      // Note: In ETH/USDC pool, token0 is USDC and token1 is ETH
      // So we need to invert the price to get ETH/USD

      const sqrtPrice = sqrtPriceX96.toBigNumber()
      const Q96 = ethers.BigNumber.from(2).pow(96)
      const Q192 = ethers.BigNumber.from(2).pow(192)

      // Calculate price as (sqrtPriceX96^2) / (2^192)
      const priceRaw = sqrtPrice.mul(sqrtPrice).div(Q192)

      // Convert to decimal considering USDC has 6 decimals and ETH has 18 decimals
      // Price is USDC per ETH, so we need to adjust for decimal differences
      const price = Number.parseFloat(ethers.utils.formatUnits(priceRaw, 6)) // USDC has 6 decimals

      // Since this gives us USDC per ETH, we need to invert to get ETH per USDC
      const ethPrice = 1 / price

      console.log("💱 Uniswap V3 ETH price calculation:", {
        sqrtPriceX96: sqrtPriceX96.toString(),
        priceRaw: priceRaw.toString(),
        usdcPerEth: price.toFixed(6),
        ethPerUsdc: ethPrice.toFixed(6),
        finalEthPrice: (ethPrice * 1000000).toFixed(2), // Convert to proper USD price
      })

      // The final ETH price in USD
      const finalEthPrice = ethPrice * 1000000 // Adjust for USDC decimals

      // Validate price range
      if (finalEthPrice > 500 && finalEthPrice < 10000) {
        useGasStore.getState().updateTokenPrice("ETH", finalEthPrice)
        console.log(`✅ ETH price updated from Uniswap V3: $${finalEthPrice.toFixed(2)}`)
      } else {
        console.warn(`⚠️ ETH price $${finalEthPrice} is outside expected range`)
      }
    } catch (error) {
      console.error("❌ Error processing Uniswap V3 Swap event:", error)
    }
  })

  // Fallback: Fetch price every 30 seconds in case no swaps occur
  const priceInterval = setInterval(() => {
    fetchInitialUniswapPrice(poolContract)
  }, 30000)

  // Store interval reference for cleanup
  ;(provider as any)._priceInterval = priceInterval
}

async function fetchInitialUniswapPrice(poolContract: ethers.Contract) {
  try {
    console.log("📊 Fetching current Uniswap V3 slot0 data...")

    const slot0 = await poolContract.slot0()
    const sqrtPriceX96 = slot0.sqrtPriceX96

    console.log("🔍 Uniswap V3 slot0 data:", {
      sqrtPriceX96: sqrtPriceX96.toString(),
      tick: slot0.tick.toString(),
    })

    // Calculate ETH/USD price from sqrtPriceX96
    const Q192 = ethers.BigNumber.from(2).pow(192)
    const priceRaw = sqrtPriceX96.mul(sqrtPriceX96).div(Q192)

    // Convert to decimal considering USDC has 6 decimals
    const price = Number.parseFloat(ethers.utils.formatUnits(priceRaw, 6))
    const ethPrice = (1 / price) * 1000000 // Adjust for USDC decimals

    console.log("💰 Calculated ETH price from slot0:", {
      priceRaw: priceRaw.toString(),
      usdcPerEth: price.toFixed(6),
      ethPrice: ethPrice.toFixed(2),
    })

    // Validate and update price
    if (ethPrice > 500 && ethPrice < 10000) {
      useGasStore.getState().updateTokenPrice("ETH", ethPrice)
      console.log(`✅ ETH price updated from Uniswap V3 slot0: $${ethPrice.toFixed(2)}`)
    } else {
      console.warn(`⚠️ ETH price $${ethPrice} is outside expected range, using fallback`)
      useGasStore.getState().updateTokenPrice("ETH", 2500) // Fallback price
    }
  } catch (error) {
    console.error("❌ Error fetching Uniswap V3 price:", error)
    // Use fallback price
    useGasStore.getState().updateTokenPrice("ETH", 2500)
  }
}

// Keep Chainlink for MATIC price since it's not in the main ETH/USDC pool
function setupMaticPriceTracking(provider: ethers.providers.WebSocketProvider) {
  // Fetch initial MATIC price
  fetchMaticPrice(provider)

  // Update MATIC price every 60 seconds
  const maticInterval = setInterval(() => {
    fetchMaticPrice(provider)
  }, 60000)

  // Store interval reference for cleanup
  ;(provider as any)._maticInterval = maticInterval
}

async function fetchMaticPrice(provider: ethers.providers.WebSocketProvider) {
  try {
    console.log("📡 Fetching MATIC price from Chainlink feed...")

    // MATIC/USD Chainlink price feed
    const CHAINLINK_ABI = [
      "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
      "function decimals() external view returns (uint8)",
    ]

    const contract = new ethers.Contract("0x7bAC85A8a13A4BcD8abb3eB7d6b4d632c5a57676", CHAINLINK_ABI, provider)

    const [roundData, decimals] = await Promise.all([contract.latestRoundData(), contract.decimals()])

    const maticPrice = Number.parseFloat(ethers.utils.formatUnits(roundData.answer, decimals))

    console.log(`💲 MATIC price from Chainlink: $${maticPrice.toFixed(4)}`)

    // Validate price range
    if (maticPrice > 0.05 && maticPrice < 5) {
      useGasStore.getState().updateTokenPrice("MATIC", maticPrice)
      console.log(`✅ MATIC price updated: $${maticPrice.toFixed(4)}`)
    } else {
      console.warn(`⚠️ MATIC price $${maticPrice} is outside expected range, using fallback`)
      useGasStore.getState().updateTokenPrice("MATIC", 0.85)
    }
  } catch (error) {
    console.error("❌ Error fetching MATIC price:", error)
    useGasStore.getState().updateTokenPrice("MATIC", 0.85) // Fallback price
  }
}

export { fetchInitialUniswapPrice }
