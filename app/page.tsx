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
} from "lucide-react";
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

const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
const API_URL = "https://www.alphavantage.co/query";
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
  const url = `${API_URL}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${ALPHA_VANTAGE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${symbol}`);
  const data = await res.json();
  return data;
}

function parseStockData(symbol: string, data: any): StockData | null {
  const meta = data["Meta Data"];
  const timeSeries = data["Time Series (5min)"];
  if (!meta || !timeSeries) return null;
  const lastTime = Object.keys(timeSeries)[0];
  const last = timeSeries[lastTime];
  const prevTime = Object.keys(timeSeries)[1];
  const prev = timeSeries[prevTime];
  if (!last || !prev) return null;
  const price = parseFloat(last["4. close"]);
  const prevPrice = parseFloat(prev["4. close"]);
  const change = price - prevPrice;
  const changePercent = (change / prevPrice) * 100;
  const volume = parseInt(last["5. volume"]);
  return {
    symbol,
    name: COMPANY_NAMES[symbol] || symbol,
    price,
    change,
    changePercent,
    volume,
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
                    <th className="text-left py-3 px-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("symbol")}
                        className="font-semibold"
                      >
                        Symbol
                        {sortBy === "symbol" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </Button>
                    </th>
                    <th className="text-left py-3 px-2 hidden sm:table-cell">
                      Company
                    </th>
                    <th className="text-right py-3 px-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("price")}
                        className="font-semibold"
                      >
                        Price
                        {sortBy === "price" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
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
                        {sortBy === "change" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
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
                        {sortBy === "volume" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
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
                        if (!stock) return null;

                        const isPositive = (stock.change || 0) >= 0;
                        const changeValue = stock.change || 0;
                        const changePercent = stock.changePercent || 0;

                        return (
                          <tr
                            key={stock.symbol}
                            className="border-b hover:bg-muted/50 transition-colors"
                          >
                            <td className="py-4 px-2">
                              <div className="font-semibold text-primary">
                                {stock.symbol || "N/A"}
                              </div>
                            </td>
                            <td className="py-4 px-2 hidden sm:table-cell">
                              <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                                {stock.name || "Unknown"}
                              </div>
                            </td>
                            <td className="py-4 px-2 text-right">
                              <div className="font-semibold">
                                ${(stock.price || 0).toFixed(2)}
                              </div>
                            </td>
                            <td className="py-4 px-2 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <div
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                    isPositive
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
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
                                <div
                                  className={`text-xs ${
                                    changePercent >= 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  ({changePercent >= 0 ? "+" : ""}
                                  {changePercent.toFixed(2)}%)
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-2 text-right hidden md:table-cell">
                              <div className="text-sm text-muted-foreground">
                                {formatVolume(stock.volume || 0)}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>

            {!loading && sortedStocks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No stocks found matching your search.
              </div>
            )}
          </CardContent>
        </Card>
        {/* Chart Section */}
        <div className="mt-8">
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-lg font-bold">Intraday Price Chart</h2>
            <select
              className="border rounded px-2 py-1 text-sm bg-background"
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
            >
              {STOCK_SYMBOLS.map((symbol) => (
                <option key={symbol} value={symbol}>
                  {COMPANY_NAMES[symbol] || symbol}
                </option>
              ))}
            </select>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={chartData}
                margin={{ top: 16, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" minTickGap={30} tick={{ fontSize: 12 }} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: any) => `$${value.toFixed(2)}`}
                  labelFormatter={(v) => `Time: ${v}`}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#2563eb"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No chart data available.
            </div>
          )}
        </div>
        <Footer />
      </main>
    </div>
  );
}
