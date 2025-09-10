import React, { useEffect } from 'react'

import { useAddCartItem, useConfigureProduct } from '@/hooks'

export default function CartBridge() {
  const { addToCart } = useAddCartItem()
  const { configureProduct } = useConfigureProduct()

  useEffect(() => {
    const handler = async (e: Event) => {
      const customEvent = e as CustomEvent<{
        productCode: string
        options?: any[]
        quantity?: number
      }>

      const { productCode, options = [], quantity = 1 } = customEvent.detail

      console.log('🛒 Chatbot event received:', { productCode, options, quantity })

      try {
        const { variationProductCode } = await configureProduct.mutateAsync({
          productCode,
          quantity,
          updatedOptions: options,
        })

        if (!variationProductCode) {
          console.error('❌ No variationProductCode returned from configureProduct')
          return
        }

        const addToCartPayload = {
          product: {
            productCode,
            variationProductCode,
            fulfillmentMethod: 'Ship',
            options,
          },
          quantity,
        }

        await addToCart.mutateAsync(addToCartPayload)
        console.log('✅ Product added from chatbot', addToCartPayload)
      } catch (err) {
        console.error('❌ Failed to add product from chatbot', err)
      }
    }

    window.addEventListener('chatbot:addToCart', handler)
    return () => window.removeEventListener('chatbot:addToCart', handler)
  }, [addToCart, configureProduct])

  return null
}
