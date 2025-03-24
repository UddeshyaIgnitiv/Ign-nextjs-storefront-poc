// pages/api/search-suggestions.ts
import type { NextApiRequestWithLogger } from '@/lib/types'

import type { NextApiRequest, NextApiResponse } from 'next'

// CORS headers configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Replace * with frontend origin in production
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24 hours
}

interface ProductSuggestion {
  productCode: number
  name: string
  brand: string
  price: number
}

interface SearchSuggestionData {
  suggestionGroups: Array<{
    name: string
    suggestions: Array<{ suggestion: ProductSuggestion }>
  }>
}

export default async function searchSuggestionsHandler(
  req: NextApiRequestWithLogger,
  res: NextApiResponse<SearchSuggestionData | { message: string }>
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', CORS_HEADERS['Access-Control-Allow-Origin'])
  res.setHeader('Access-Control-Allow-Methods', CORS_HEADERS['Access-Control-Allow-Methods'])
  res.setHeader('Access-Control-Allow-Headers', CORS_HEADERS['Access-Control-Allow-Headers'])
  res.setHeader('Access-Control-Max-Age', CORS_HEADERS['Access-Control-Max-Age'])

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' })
    return
  }

  try {
    const { searchTerm } = req.body

    if (!searchTerm?.trim()) {
      res.status(400).json({ message: 'Search term is required' })
      return
    }

    const externalResponse = await fetch('http://3.140.208.72:5000/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchTerm.trim(),
      }),
    })

    if (!externalResponse.ok) {
      throw new Error(`External API responded with ${externalResponse.status}`)
    }

    const externalData = await externalResponse.json()

    const transformedData: SearchSuggestionData = {
      suggestionGroups: [
        {
          name: 'Products',
          suggestions: externalData.map((product: any) => ({
            suggestion: {
              productCode: product.productCode,
              name: product.productName,
              brand: product.brand,
              price: product.price,
            },
          })),
        },
      ],
    }

    res.status(200).json(transformedData)
  } catch (error) {
    req.logger.error('Search suggestions API error', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
