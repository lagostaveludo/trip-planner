'use client'

import { useState } from 'react'

interface RouteOption {
  name: string
  legs: {
    from: string
    to: string
    date: string
  }[]
}

interface FlightResult {
  route: string
  totalPrice: number
  currency: string
  legs: {
    from: string
    to: string
    price: number
    airline: string
    departure: string
    arrival: string
    stops: number
  }[]
}

const DEFAULT_ROUTES: RouteOption[] = [
  {
    name: 'Bolivia Primeiro',
    legs: [
      { from: 'GRU', to: 'VVI', date: '2026-02-15' },
      { from: 'VVI', to: 'LPB', date: '2026-02-20' },
      { from: 'LPB', to: 'CUZ', date: '2026-02-25' },
      { from: 'CUZ', to: 'GRU', date: '2026-03-05' },
    ],
  },
  {
    name: 'Peru Primeiro',
    legs: [
      { from: 'GRU', to: 'LIM', date: '2026-02-15' },
      { from: 'LIM', to: 'CUZ', date: '2026-02-20' },
      { from: 'CUZ', to: 'LPB', date: '2026-02-25' },
      { from: 'LPB', to: 'GRU', date: '2026-03-05' },
    ],
  },
]

export default function Home() {
  const [routes] = useState<RouteOption[]>(DEFAULT_ROUTES)
  const [results, setResults] = useState<FlightResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchFlights = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/flights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routes }),
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar voos')
      }

      const data = await response.json()
      setResults(data.results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(price)
  }

  const cheapestRoute = results.length > 0
    ? results.reduce((a, b) => (a.totalPrice < b.totalPrice ? a : b))
    : null

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">Trip Planner</h1>
        <p className="text-blue-200 text-center mb-8">
          Compare rotas e encontre os melhores voos
        </p>

        {/* Routes Preview */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {routes.map((route, idx) => (
            <div
              key={idx}
              className="bg-white/10 backdrop-blur rounded-xl p-4"
            >
              <h3 className="font-bold text-lg mb-3">{route.name}</h3>
              <div className="space-y-2">
                {route.legs.map((leg, legIdx) => (
                  <div
                    key={legIdx}
                    className="flex items-center gap-2 text-sm text-blue-200"
                  >
                    <span className="font-mono bg-blue-800 px-2 py-0.5 rounded">
                      {leg.from}
                    </span>
                    <span>→</span>
                    <span className="font-mono bg-blue-800 px-2 py-0.5 rounded">
                      {leg.to}
                    </span>
                    <span className="ml-auto opacity-60">{leg.date}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Search Button */}
        <div className="text-center mb-8">
          <button
            onClick={searchFlights}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-xl font-bold text-xl transition shadow-lg"
          >
            {loading ? 'Buscando voos...' : 'Buscar Voos'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 mb-8 text-center">
            {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Resultados</h2>

            {/* Winner */}
            {cheapestRoute && (
              <div className="bg-green-500/20 border-2 border-green-400 rounded-xl p-6 text-center">
                <p className="text-green-300 text-sm mb-1">Melhor Opcao</p>
                <p className="text-3xl font-bold">{cheapestRoute.route}</p>
                <p className="text-4xl font-bold text-green-400 mt-2">
                  {formatPrice(cheapestRoute.totalPrice, cheapestRoute.currency)}
                </p>
              </div>
            )}

            {/* All Results */}
            <div className="grid md:grid-cols-2 gap-4">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className={`bg-white/10 backdrop-blur rounded-xl p-4 ${
                    result === cheapestRoute ? 'ring-2 ring-green-400' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg">{result.route}</h3>
                    <span className="text-2xl font-bold text-green-400">
                      {formatPrice(result.totalPrice, result.currency)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {result.legs.map((leg, legIdx) => (
                      <div
                        key={legIdx}
                        className="bg-black/20 rounded-lg p-3 text-sm"
                      >
                        <div className="flex justify-between mb-1">
                          <span className="font-mono">
                            {leg.from} → {leg.to}
                          </span>
                          <span className="text-green-300">
                            {formatPrice(leg.price, result.currency)}
                          </span>
                        </div>
                        <div className="text-blue-300 text-xs">
                          {leg.airline} • {leg.departure} - {leg.arrival}
                          {leg.stops > 0 && ` • ${leg.stops} parada(s)`}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Booking Links */}
                  <div className="flex gap-2 mt-4">
                    <a
                      href={`https://www.google.com/travel/flights`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-center py-2 rounded-lg text-sm transition"
                    >
                      Google Flights
                    </a>
                    <a
                      href={`https://www.skyscanner.com.br`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-center py-2 rounded-lg text-sm transition"
                    >
                      Skyscanner
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-blue-300 text-sm opacity-60">
          <p>Precos via Amadeus API • Atualizado em tempo real</p>
        </footer>
      </div>
    </main>
  )
}
