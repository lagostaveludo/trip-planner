import { NextRequest, NextResponse } from 'next/server'

interface RouteOption {
  name: string
  legs: {
    from: string
    to: string
    date: string
  }[]
}

interface AmadeusTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface AmadeusFlightOffer {
  price: {
    total: string
    currency: string
  }
  itineraries: {
    segments: {
      departure: {
        iataCode: string
        at: string
      }
      arrival: {
        iataCode: string
        at: string
      }
      carrierCode: string
    }[]
  }[]
}

async function getAmadeusToken(): Promise<string> {
  const response = await fetch(
    'https://test.api.amadeus.com/v1/security/oauth2/token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.AMADEUS_API_KEY!,
        client_secret: process.env.AMADEUS_API_SECRET!,
      }),
    }
  )

  const data: AmadeusTokenResponse = await response.json()
  return data.access_token
}

async function searchFlight(
  token: string,
  from: string,
  to: string,
  date: string
) {
  const params = new URLSearchParams({
    originLocationCode: from,
    destinationLocationCode: to,
    departureDate: date,
    adults: '1',
    currencyCode: 'BRL',
    max: '1',
  })

  const response = await fetch(
    `https://test.api.amadeus.com/v2/shopping/flight-offers?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    console.error(`Flight search failed: ${from}-${to}`, await response.text())
    return null
  }

  const data = await response.json()
  return data.data?.[0] as AmadeusFlightOffer | undefined
}

export async function POST(req: NextRequest) {
  try {
    const { routes } = (await req.json()) as { routes: RouteOption[] }

    const token = await getAmadeusToken()

    const results = await Promise.all(
      routes.map(async (route) => {
        const legResults = await Promise.all(
          route.legs.map(async (leg) => {
            const offer = await searchFlight(token, leg.from, leg.to, leg.date)

            if (!offer) {
              return {
                from: leg.from,
                to: leg.to,
                price: 0,
                airline: 'N/A',
                departure: leg.date,
                arrival: '',
                stops: 0,
              }
            }

            const segment = offer.itineraries[0]?.segments[0]
            const totalStops = (offer.itineraries[0]?.segments.length || 1) - 1

            return {
              from: leg.from,
              to: leg.to,
              price: parseFloat(offer.price.total),
              airline: segment?.carrierCode || 'N/A',
              departure: segment?.departure.at || leg.date,
              arrival: segment?.arrival.at || '',
              stops: totalStops,
            }
          })
        )

        const totalPrice = legResults.reduce((sum, leg) => sum + leg.price, 0)

        return {
          route: route.name,
          totalPrice,
          currency: 'BRL',
          legs: legResults,
        }
      })
    )

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Flights API error:', error)
    return NextResponse.json(
      { error: 'Failed to search flights' },
      { status: 500 }
    )
  }
}
