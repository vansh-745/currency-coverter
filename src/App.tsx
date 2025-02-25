import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  ArrowRightLeft,
  RefreshCcw,
  Sun,
  Moon,
  Coins,
  Calendar,
  Edit3,
} from "lucide-react";
import { format, subDays, subMonths, subYears } from "date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

const fiatCurrencies = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "AUD",
  "CAD",
  "CHF",
  "CNY",
  "INR",
];
const cryptoCurrencies = [
  "BTC",
  "ETH",
  "USDT",
  "BNB",
  "XRP",
  "ADA",
  "DOT",
  "DOGE",
];
const timeRanges = [
  { label: "1 Week", value: "1w" },
  { label: "1 Month", value: "1m" },
  { label: "3 Months", value: "3m" },
  { label: "1 Year", value: "1y" },
];

// Simulated crypto rates against USD
const cryptoBaseRates: Record<string, number> = {
  BTC: 45000,
  ETH: 3000,
  USDT: 1,
  BNB: 380,
  XRP: 0.5,
  ADA: 0.5,
  DOT: 7,
  DOGE: 0.08,
};

function App() {
  const [amount, setAmount] = useState<string>("1");
  const [fromCurrency, setFromCurrency] = useState<string>("USD");
  const [toCurrency, setToCurrency] = useState<string>("EUR");
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [customRate, setCustomRate] = useState<string>("");
  const [useCustomRate, setUseCustomRate] = useState<boolean>(false);
  const [historicalRates, setHistoricalRates] = useState<
    { date: string; rate: number }[]
  >([]);
  const [timeRange, setTimeRange] = useState<string>("1w");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const getDateRange = () => {
    const today = new Date();
    switch (timeRange) {
      case "1m":
        return subMonths(today, 1);
      case "3m":
        return subMonths(today, 3);
      case "1y":
        return subYears(today, 1);
      default:
        return subDays(today, 7);
    }
  };

  const calculateCryptoRate = (from: string, to: string): number => {
    // If converting between cryptocurrencies
    if (cryptoCurrencies.includes(from) && cryptoCurrencies.includes(to)) {
      return cryptoBaseRates[from] / cryptoBaseRates[to];
    }
    // If converting from crypto to fiat
    if (cryptoCurrencies.includes(from)) {
      return cryptoBaseRates[from];
    }
    // If converting from fiat to crypto
    if (cryptoCurrencies.includes(to)) {
      return 1 / cryptoBaseRates[to];
    }
    return 0;
  };

  const fetchHistoricalRates = async () => {
    const startDate = getDateRange();
    const dates = [];
    let currentDate = startDate;

    while (currentDate <= new Date()) {
      dates.push(format(currentDate, "yyyy-MM-dd"));
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }

    // Simulated historical data with more realistic variations
    const baseRate = exchangeRate;
    const volatility =
      cryptoCurrencies.includes(fromCurrency) ||
      cryptoCurrencies.includes(toCurrency)
        ? 0.15
        : 0.05;

    const historical = dates.map((date) => ({
      date,
      rate: baseRate * (1 + (Math.random() * volatility * 2 - volatility)),
    }));

    setHistoricalRates(historical);
  };

  const fetchExchangeRate = async () => {
    setLoading(true);
    setError("");
    try {
      let rate: number;

      if (
        cryptoCurrencies.includes(fromCurrency) ||
        cryptoCurrencies.includes(toCurrency)
      ) {
        rate = calculateCryptoRate(fromCurrency, toCurrency);
      } else {
        const response = await fetch(
          `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch exchange rate");
        }
        const data = await response.json();
        rate = data.rates[toCurrency];

        if (!rate) {
          throw new Error(
            `No exchange rate available for ${fromCurrency} to ${toCurrency}`,
          );
        }
      }

      setExchangeRate(rate);
      await fetchHistoricalRates();
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      setError("Failed to fetch exchange rate. Please try again later.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExchangeRate();
  }, [fromCurrency, toCurrency, timeRange]);

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const effectiveRate = useCustomRate ? parseFloat(customRate) : exchangeRate;

  const chartData = {
    labels: historicalRates.map((data) => data.date),
    datasets: [
      {
        label: `${fromCurrency} to ${toCurrency} Exchange Rate`,
        data: historicalRates.map((data) => data.rate),
        fill: true,
        backgroundColor: darkMode
          ? "rgba(99, 102, 241, 0.1)"
          : "rgba(99, 102, 241, 0.2)",
        borderColor: darkMode
          ? "rgba(129, 140, 248, 1)"
          : "rgba(99, 102, 241, 1)",
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: darkMode ? "#e5e7eb" : "#1f2937",
        },
      },
      title: {
        display: true,
        text: `${timeRange === "1w" ? "7-Day" : timeRange === "1m" ? "1-Month" : timeRange === "3m" ? "3-Month" : "1-Year"} Exchange Rate History`,
        color: darkMode ? "#e5e7eb" : "#1f2937",
      },
    },
    scales: {
      x: {
        grid: {
          color: darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: darkMode ? "#e5e7eb" : "#1f2937",
        },
      },
      y: {
        grid: {
          color: darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: darkMode ? "#e5e7eb" : "#1f2937",
        },
      },
    },
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        darkMode
          ? "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-700 via-gray-900 to-black text-gray-100"
          : "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-500 via-green-900 to-gray-600 text-gray-900"
      }`}
    >
      <div className="max-w-4xl mx-auto p-4 py-12">
        <div
          className={`rounded-2xl shadow-2xl backdrop-blur-lg p-8 mb-8 ${
            darkMode ? "bg-gray-800/30" : "bg-white/10"
          }`}
        >
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <Coins className="w-8 h-8 mr-3 text-white" />
              <h1 className="text-3xl font-bold text-white">
                Currency Converter
              </h1>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? "bg-gray-700/50 hover:bg-gray-600/50"
                  : "bg-white/20 hover:bg-white/30"
              }`}
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-white" />
              ) : (
                <Moon className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              {error}
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium mb-2 text-white">
                Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg transition-colors ${
                  darkMode
                    ? "bg-gray-700/50 border-gray-600/50 focus:border-indigo-500 text-white"
                    : "bg-white/20 border-white/30 focus:border-white text-white placeholder-white/70"
                } border focus:ring-2 focus:ring-white/20 focus:outline-none`}
                min="0"
              />
            </div>

            <div className="flex-1 flex items-center gap-4 w-full">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2 text-white">
                  From
                </label>
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg transition-colors ${
                    darkMode
                      ? "bg-gray-700/50 border-gray-600/50 text-white"
                      : "bg-white/20 border-white/30 text-white"
                  } border focus:ring-2 focus:ring-white/20 focus:border-white focus:outline-none`}
                >
                  <optgroup label="Fiat Currencies">
                    {fiatCurrencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Cryptocurrencies">
                    {cryptoCurrencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <button
                onClick={handleSwapCurrencies}
                className={`mt-6 p-3 rounded-full transition-colors ${
                  darkMode
                    ? "bg-gray-700/50 hover:bg-gray-600/50"
                    : "bg-white/20 hover:bg-white/30"
                }`}
              >
                <ArrowRightLeft className="w-5 h-5 text-white" />
              </button>

              <div className="flex-1">
                <label className="block text-sm font-medium mb-2 text-white">
                  To
                </label>
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg transition-colors ${
                    darkMode
                      ? "bg-gray-700/50 border-gray-600/50 text-white"
                      : "bg-white/20 border-white/30 text-white"
                  } border focus:ring-2 focus:ring-white/20 focus:border-white focus:outline-none`}
                >
                  <optgroup label="Fiat Currencies">
                    {fiatCurrencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Cryptocurrencies">
                    {cryptoCurrencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Edit3 className="w-4 h-4 text-white" />
              <label className="text-sm font-medium text-white">
                Custom Rate
              </label>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={customRate}
                onChange={(e) => setCustomRate(e.target.value)}
                placeholder="Enter custom rate"
                className={`flex-1 px-4 py-3 rounded-lg transition-colors ${
                  darkMode
                    ? "bg-gray-700/50 border-gray-600/50 focus:border-indigo-500 text-white placeholder-gray-400"
                    : "bg-white/20 border-white/30 focus:border-white text-white placeholder-white/70"
                } border focus:ring-2 focus:ring-white/20 focus:outline-none`}
                min="0"
                step="0.0001"
              />
              <button
                onClick={() => setUseCustomRate(!useCustomRate)}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  useCustomRate
                    ? "bg-indigo-500 text-white"
                    : darkMode
                      ? "bg-gray-700/50 hover:bg-gray-600/50 text-white"
                      : "bg-white/20 hover:bg-white/30 text-white"
                }`}
              >
                {useCustomRate ? "Using Custom" : "Use Custom"}
              </button>
            </div>
          </div>

   {range.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchExchangeRate}
              disabled={loading}
              className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                darkMode
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-white/20 hover:bg-white/30 text-white"
              } focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50`}
            >
              <RefreshCcw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh Rate
            </button>
          </div>

          <div className="text-center">
            <p className="text-3xl font-bold mb-2 text-white">
              {parseFloat(amount) ? (
                <>
                  {amount} {fromCurrency} ={" "}
                  {(parseFloat(amount) * effectiveRate).toFixed(2)} {toCurrency}
                </>
              ) : (
                "Please enter a valid amount"
              )}
            </p>
            <p className="text-sm text-white/70">
              1 {fromCurrency} = {effectiveRate.toFixed(4)} {toCurrency}
              {useCustomRate && " (Custom Rate)"}
            </p>
          </div>
        </div>

        <div
          className={`rounded-2xl shadow-2xl backdrop-blur-lg p-8 ${
            darkMode ? "bg-gray-800/30" : "bg-white/10"
          }`}
        >
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

export default App;
