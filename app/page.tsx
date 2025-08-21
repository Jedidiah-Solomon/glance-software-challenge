"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, TrendingDown, Search, RefreshCw, BarChart3, DollarSign } from "lucide-react"

interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
}

// Mock data for demonstration (in real app, this would come from API)
const generateMockData = (): StockData[] => [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 175.43,
    change: 2.15,
    changePercent: 1.24,
    volume: 45234567,
    marketCap: 2800000000000,
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    price: 138.21,
    change: -1.87,
    changePercent: -1.33,
    volume: 23456789,
    marketCap: 1750000000000,
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    price: 378.85,
    change: 4.32,
    changePercent: 1.15,
    volume: 34567890,
    marketCap: 2900000000000,
  },
  {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    price: 248.5,
    change: -8.75,
    changePercent: -3.4,
    volume: 67890123,
    marketCap: 790000000000,
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    price: 145.86,
    change: 1.23,
    changePercent: 0.85,
    volume: 28901234,
    marketCap: 1500000000000,
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    price: 875.28,
    change: 15.67,
    changePercent: 1.82,
    volume: 45678901,
    marketCap: 2150000000000,
  },
]

const formatNumber = (num: number): string => {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
  return `$${num.toFixed(2)}`
}

const formatVolume = (num: number): string => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
  return num.toString()
}

export default function StockDashboard() {
  const [stocks, setStocks] = useState<StockData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"symbol" | "price" | "change" | "volume">("symbol")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Simulate API call
  useEffect(() => {
    const fetchStockData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // In a real app, you would fetch from an actual API like:
        // const response = await fetch('https://api.example.com/stocks')
        // const data = await response.json()

        setStocks(generateMockData())
      } catch (err) {
        setError("Failed to fetch stock data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchStockData()
  }, [])

  const handleRefresh = () => {
    console.log("[v0] Refresh button clicked")
    setStocks(
      generateMockData().map((stock) => ({
        ...stock,
        price: stock.price + (Math.random() - 0.5) * 10,
        change: (Math.random() - 0.5) * 20,
        changePercent: (Math.random() - 0.5) * 5,
      })),
    )
  }

  const filteredStocks = stocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const sortedStocks = [...filteredStocks].sort((a, b) => {
    const aValue = a?.[sortBy]
    const bValue = b?.[sortBy]

    if (aValue == null || bValue == null) return 0

    const multiplier = sortOrder === "asc" ? 1 : -1

    if (typeof aValue === "string" && typeof bValue === "string") {
      return aValue.localeCompare(bValue) * multiplier
    }
    return ((aValue as number) - (bValue as number)) * multiplier
  })

  const handleSort = (column: typeof sortBy) => {
    console.log("[v0] Sort button clicked:", column)
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  const totalMarketCap = stocks.reduce((sum, stock) => sum + (stock?.marketCap || 0), 0)
  const gainers = stocks.filter((stock) => stock?.change > 0).length
  const losers = stocks.filter((stock) => stock?.change < 0).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold font-serif text-foreground">StockTracker Pro</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="gap-2 bg-transparent"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Market Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Market Cap</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(totalMarketCap)}</div>
              <p className="text-xs text-muted-foreground">Across {stocks.length} tracked stocks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gainers</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{gainers}</div>
              <p className="text-xs text-muted-foreground">Stocks with positive change</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Losers</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{losers}</div>
              <p className="text-xs text-muted-foreground">Stocks with negative change</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search stocks by symbol or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Alert className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stock Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Stock Prices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("symbol")}
                        className="font-semibold"
                      >
                        Symbol
                        {sortBy === "symbol" && <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                      </Button>
                    </th>
                    <th className="text-left py-3 px-2 hidden sm:table-cell">Company</th>
                    <th className="text-right py-3 px-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("price")}
                        className="font-semibold"
                      >
                        Price
                        {sortBy === "price" && <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                      </Button>
                    </th>
                    <th className="text-right py-3 px-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("change")}
                        className="font-semibold"
                      >
                        Change
                        {sortBy === "change" && <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                      </Button>
                    </th>
                    <th className="text-right py-3 px-2 hidden md:table-cell">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("volume")}
                        className="font-semibold"
                      >
                        Volume
                        {sortBy === "volume" && <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                      </Button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i} className="border-b">
                          <td className="py-4 px-2">
                            <Skeleton className="h-4 w-16" />
                          </td>
                          <td className="py-4 px-2 hidden sm:table-cell">
                            <Skeleton className="h-4 w-32" />
                          </td>
                          <td className="py-4 px-2">
                            <Skeleton className="h-4 w-20" />
                          </td>
                          <td className="py-4 px-2">
                            <Skeleton className="h-4 w-16" />
                          </td>
                          <td className="py-4 px-2 hidden md:table-cell">
                            <Skeleton className="h-4 w-20" />
                          </td>
                        </tr>
                      ))
                    : sortedStocks.map((stock) => {
                        if (!stock) return null

                        const isPositive = (stock.change || 0) >= 0
                        const changeValue = stock.change || 0
                        const changePercent = stock.changePercent || 0

                        return (
                          <tr key={stock.symbol} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="py-4 px-2">
                              <div className="font-semibold text-primary">{stock.symbol || "N/A"}</div>
                            </td>
                            <td className="py-4 px-2 hidden sm:table-cell">
                              <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                                {stock.name || "Unknown"}
                              </div>
                            </td>
                            <td className="py-4 px-2 text-right">
                              <div className="font-semibold">${(stock.price || 0).toFixed(2)}</div>
                            </td>
                            <td className="py-4 px-2 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <div
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                    isPositive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {isPositive ? (
                                    <TrendingUp className="h-3 w-3" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3" />
                                  )}
                                  {isPositive ? "+" : ""}
                                  {changeValue.toFixed(2)}
                                </div>
                                <div className={`text-xs ${changePercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                                  ({changePercent >= 0 ? "+" : ""}
                                  {changePercent.toFixed(2)}%)
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-2 text-right hidden md:table-cell">
                              <div className="text-sm text-muted-foreground">{formatVolume(stock.volume || 0)}</div>
                            </td>
                          </tr>
                        )
                      })}
                </tbody>
              </table>
            </div>

            {!loading && sortedStocks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No stocks found matching your search.</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
