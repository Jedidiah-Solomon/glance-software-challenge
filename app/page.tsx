"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp,
  TrendingDown,
  Search,
  RefreshCw,
  BarChart3,
  DollarSign,
  LineChart as LucideLineChart,
} from "lucide-react";
import { Sparklines, SparklinesLine } from "react-sparklines";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import Footer from "@/components/Footer";

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
}

const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
const FINNHUB_API_URL = "https://finnhub.io/api/v1/quote";
const FINNHUB_CANDLE_API_URL = "https://finnhub.io/api/v1/stock/candle";
const STOCK_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "TSLA", "AMZN", "NVDA"];

// Add a mapping for company names
const COMPANY_NAMES: Record<string, string> = {
  AAPL: "Apple Inc.",
  MSFT: "Microsoft Corporation",
  GOOGL: "Alphabet Inc.",
  TSLA: "Tesla, Inc.",
  AMZN: "Amazon.com Inc.",
  NVDA: "NVIDIA Corporation",
};

async function fetchStock(symbol: string) {
  const url = `${FINNHUB_API_URL}?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log("Finnhub API response for", symbol, data);
  if (data.error) {
    throw new Error(data.error);
  }
  // Finnhub returns { c: current, d: change, dp: change %, h: high, l: low, o: open, pc: prev close }
  if (typeof data.c !== "number") {
    throw new Error(`Unexpected Finnhub API response for ${symbol}.`);
  }
  return data;
}

function parseStockData(symbol: string, data: any): StockData | null {
  // Finnhub: c=current, d=change, dp=change %, pc=prev close
  return {
    symbol,
    name: COMPANY_NAMES[symbol] || symbol,
    price: data.c,
    change: data.d ?? data.c - data.pc,
    changePercent: data.dp ?? ((data.c - data.pc) / data.pc) * 100,
    volume: 0, // Finnhub's quote endpoint does not provide volume
    marketCap: undefined,
  };
}

const formatNumber = (num: number): string => {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};

const formatVolume = (num: number): string => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toString();
};

// Helper to generate a mock sparkline (random walk)
function generateMockSparkline(base: number, points = 10) {
  let arr = [base];
  for (let i = 1; i < points; i++) {
    arr.push(arr[i - 1] + (Math.random() - 0.5) * base * 0.01);
  }
  return arr;
}

export default function StockDashboard() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<
    "symbol" | "price" | "change" | "volume"
  >("symbol");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [chartData, setChartData] = useState<any[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>(
    STOCK_SYMBOLS[0]
  );
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllStocks = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.all(
          STOCK_SYMBOLS.map(async (symbol) => {
            try {
              const data = await fetchStock(symbol);
              return { symbol, data };
            } catch (e) {
              return null;
            }
          })
        );
        const validResults = results.filter(Boolean) as {
          symbol: string;
          data: any;
        }[];
        setStocks(
          validResults
            .map(({ symbol, data }) => parseStockData(symbol, data))
            .filter(Boolean) as StockData[]
        );
        // Prepare chart data for the selected stock
        const selected = validResults.find((r) => r.symbol === selectedSymbol);
        if (selected && selected.data["Time Series (5min)"]) {
          const chartArr = Object.entries(selected.data["Time Series (5min)"])
            .map(([time, values]: any) => ({
              time,
              price: parseFloat(values["4. close"]),
            }))
            .reverse();
          setChartData(chartArr);
        } else {
          setChartData([]);
        }
      } catch (err) {
        setError("Failed to fetch stock data. Please try again.");
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAllStocks();
  }, [selectedSymbol]);

  // Fetch daily candle data for the selected stock
  useEffect(() => {
    const fetchChartData = async () => {
      setChartLoading(true);
      setChartError(null);
      try {
        const url = `${FINNHUB_CANDLE_API_URL}?symbol=${selectedSymbol}&resolution=D&count=7&token=${FINNHUB_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.s !== "ok") {
          throw new Error(data.error || "Failed to load chart data.");
        }
        // data.c = close prices, data.t = timestamps
        const chartArr = data.t.map((timestamp: number, i: number) => ({
          date: new Date(timestamp * 1000).toLocaleDateString(),
          close: data.c[i],
        }));
        setChartData(chartArr);
      } catch (err: any) {
        setChartError(err.message || "Failed to load chart data.");
        setChartData([]);
      } finally {
        setChartLoading(false);
      }
    };
    fetchChartData();
  }, [selectedSymbol]);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const results = await Promise.all(
          STOCK_SYMBOLS.map(async (symbol) => {
            try {
              const data = await fetchStock(symbol);
              return { symbol, data };
            } catch (e) {
              return null;
            }
          })
        );
        const validResults = results.filter(Boolean) as {
          symbol: string;
          data: any;
        }[];
        setStocks(
          validResults
            .map(({ symbol, data }) => parseStockData(symbol, data))
            .filter(Boolean) as StockData[]
        );
        const selected = validResults.find((r) => r.symbol === selectedSymbol);
        if (selected && selected.data["Time Series (5min)"]) {
          const chartArr = Object.entries(selected.data["Time Series (5min)"])
            .map(([time, values]: any) => ({
              time,
              price: parseFloat(values["4. close"]),
            }))
            .reverse();
          setChartData(chartArr);
        } else {
          setChartData([]);
        }
      } catch (err) {
        setError("Failed to fetch stock data. Please try again.");
        setChartData([]);
      } finally {
        setLoading(false);
      }
    })();
  };

  const filteredStocks = stocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedStocks = [...filteredStocks].sort((a, b) => {
    const aValue = a?.[sortBy];
    const bValue = b?.[sortBy];

    if (aValue == null || bValue == null) return 0;

    const multiplier = sortOrder === "asc" ? 1 : -1;

    if (typeof aValue === "string" && typeof bValue === "string") {
      return aValue.localeCompare(bValue) * multiplier;
    }
    return ((aValue as number) - (bValue as number)) * multiplier;
  });

  const handleSort = (column: typeof sortBy) => {
    console.log("[v0] Sort button clicked:", column);
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const totalMarketCap = stocks.reduce(
    (sum, stock) => sum + (stock?.marketCap || 0),
    0
  );
  const hasMarketCap = stocks.some(
    (stock) => stock?.marketCap && stock.marketCap > 0
  );
  const gainers = stocks.filter((stock) => stock?.change > 0).length;
  const losers = stocks.filter((stock) => stock?.change < 0).length;

  // Market overview: find top gainer/loser
  const topGainer = stocks.reduce(
    (max, s) => (s.changePercent > (max?.changePercent ?? -Infinity) ? s : max),
    null as StockData | null
  );
  const topLoser = stocks.reduce(
    (min, s) => (s.changePercent < (min?.changePercent ?? Infinity) ? s : min),
    null as StockData | null
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold font-serif text-foreground">
                  StockTracker Pro
                </h1>
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

      <main className="container mx-auto px-4 py-8 flex-1">
        {/* Market Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Market Cap
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {hasMarketCap ? formatNumber(totalMarketCap) : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                Across {stocks.length} tracked stocks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gainers</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{gainers}</div>
              <p className="text-xs text-muted-foreground">
                Stocks with positive change
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Losers</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{losers}</div>
              <p className="text-xs text-muted-foreground">
                Stocks with negative change
              </p>
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
                    <th className="text-left py-3 px-2">Symbol</th>
                    <th className="text-left py-3 px-2 hidden sm:table-cell">
                      Company
                    </th>
                    <th className="text-right py-3 px-2">Price</th>
                    <th className="text-right py-3 px-2">Change</th>
                    <th className="text-right py-3 px-2">% Change</th>
                    <th className="text-right py-3 px-2">Sparkline</th>
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
                          <td className="py-4 px-2">
                            <Skeleton className="h-4 w-16" />
                          </td>
                          <td className="py-4 px-2">
                            <Skeleton className="h-4 w-24" />
                          </td>
                        </tr>
                      ))
                    : sortedStocks.map((stock) => {
                        if (!stock) return null;
                        const isPositive = (stock.change || 0) >= 0;
                        return (
                          <tr
                            key={stock.symbol}
                            className="border-b hover:bg-muted/50 transition-colors"
                          >
                            <td className="py-4 px-2 font-semibold text-primary">
                              {stock.symbol}
                            </td>
                            <td className="py-4 px-2 hidden sm:table-cell text-muted-foreground max-w-[200px] truncate">
                              {stock.name}
                            </td>
                            <td className="py-4 px-2 text-right font-semibold">
                              ${stock.price.toFixed(2)}
                            </td>
                            <td
                              className={`py-4 px-2 text-right font-semibold ${
                                isPositive ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              <span className="inline-flex items-center gap-1">
                                {isPositive ? (
                                  <TrendingUp className="h-4 w-4" />
                                ) : (
                                  <TrendingDown className="h-4 w-4" />
                                )}
                                {isPositive ? "+" : ""}
                                {stock.change.toFixed(2)}
                              </span>
                            </td>
                            <td
                              className={`py-4 px-2 text-right font-semibold ${
                                isPositive ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {isPositive ? "+" : ""}
                              {stock.changePercent.toFixed(2)}%
                            </td>
                            <td className="py-4 px-2 text-right">
                              <Sparklines
                                data={generateMockSparkline(stock.price)}
                                width={60}
                                height={20}
                                margin={2}
                              >
                                <SparklinesLine
                                  color={isPositive ? "#16a34a" : "#dc2626"}
                                  style={{ fill: "none" }}
                                />
                              </Sparklines>
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
            {!loading && sortedStocks.length === 0 && !error && (
              <div className="text-center py-8 text-muted-foreground">
                No stock data available. Please check your API key, rate limits,
                or try again later.
              </div>
            )}
          </CardContent>
        </Card>
        <Footer />
      </main>
    </div>
  );
}
