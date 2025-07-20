import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ethers } from "ethers"
import { useGasStore } from "@/lib/store/gas-store"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type TokenType = "ETH" | "MATIC"

async function fetchChainlinkPrice(
  provider: ethers.providers.WebSocketProvider,
  token: TokenType,
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
    const fallbackPrices: Record<TokenType, number> = {
      ETH: 2500, // More conservative ETH price
      MATIC: 0.85, // More realistic MATIC price
    }

    console.log(`🔄 Using fallback price for ${token}: $${fallbackPrices[token]}`)
    useGasStore.getState().updateTokenPrice(token, fallbackPrices[token])
  }
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

export { fetchChainlinkPrice, fetchTokenPrices }
