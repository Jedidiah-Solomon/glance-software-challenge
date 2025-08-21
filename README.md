# ValueGlance Stock Price Dashboard

## Overview

This project is a **Stock Price Dashboard** built for the ValueGlance internship coding challenge by Jedidiah Solomon. The dashboard fetches real-time stock data from the Alpha Vantage API and displays it in a modern, responsive, and interactive interface. It includes features such as search, sorting, loading and error states, and a dynamic chart for visualizing intraday price movements.

## Live Demo

## Features

- **Real-time Stock Data:** Fetches up-to-date stock prices, changes, and volumes from the [Alpha Vantage API](https://www.alphavantage.co/).
- **Responsive Table:** Displays stock data in a clean, sortable, and searchable table.
- **Interactive Chart:** Visualizes intraday price history for any selected stock using Recharts.
- **Loading & Error States:** User-friendly feedback while fetching data or if the API fails.
- **Company Name Mapping:** Shows full company names for tracked stocks.
- **Dynamic Theming:** Styled with Tailwind CSS for a modern, responsive look.
- **Developer Credit:** Footer with dynamic year and developer link.

## Tech Stack

- **Framework:** Next.js (React 19, App Router, Client Components)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom + Radix UI
- **Charting:** [Recharts](https://recharts.org/)
- **API:** [Alpha Vantage TIME_SERIES_INTRADAY](https://www.alphavantage.co/documentation/)

## API Usage

- The dashboard uses the Alpha Vantage `TIME_SERIES_INTRADAY` endpoint to fetch the latest intraday OHLCV data for a set of tracked stocks (AAPL, MSFT, GOOGL, TSLA, AMZN, NVDA by default).
- **API Key:** You must provide your own free API key from [Alpha Vantage](https://www.alphavantage.co/support/#api-key).
- **Rate Limits:** The free tier allows 5 requests per minute. The dashboard is designed to respect this limit by limiting the number of stocks fetched at once.

## Environment Setup

1. **Clone the repository**
2. **Create a `.env` file** in the project root:
   ```
   NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here
   ```
3. **Install dependencies:**
   ```
   npm install
   # or
   pnpm install
   ```
4. **Run the development server:**
   ```
   npm run dev
   # or
   pnpm dev
   ```
5. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

## How It Works

- On load, the dashboard fetches intraday data for each tracked stock and displays it in a table.
- You can search and sort stocks by symbol, price, change, or volume.
- Select any stock from the dropdown to view its intraday price chart.
- Loading skeletons and error alerts provide feedback during data fetches.
- If market cap data is unavailable, "N/A" is shown for transparency.

## Customization

- **Add More Stocks:** Edit the `STOCK_SYMBOLS` array in `app/page.tsx`.
- **Change Chart Type:** Swap out Recharts for Chart.js if desired.
- **Styling:** Easily customizable via Tailwind CSS classes.

## Developer

Developed by [Jedidiah Solomon](https://www.jedidiahsolomon.name.ng/)
