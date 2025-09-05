import React, { useEffect } from 'react'

import { useAddCartItem } from '@/hooks'

export default function CartBridge() {
  const { addToCart } = useAddCartItem()

  useEffect(() => {
    const handler = async (e: Event) => {
      const customEvent = e as CustomEvent<{
        productCode: string
        variationProductCode?: string
        options?: any[]
        quantity?: number
      }>

      const { productCode, variationProductCode, options, quantity } = customEvent.detail

      const variables = {
        productToAdd: {
          product: {
            productCode: '0732017701701',
            variationProductCode: '0732017701701-0019007',
            options: [
              { attributeFQN: 'tenant~color', value: '23', shopperEnteredValue: null },
              { attributeFQN: 'tenant~size', value: '3', shopperEnteredValue: null },
            ],
          },
          quantity: 1,
          fulfillmentMethod: 'Ship',
        },
      }

      // Build the payload
      const addToCartPayload = {
        product: {
          productCode: variables.productToAdd.product.productCode,
          variationProductCode: variables.productToAdd.product.variationProductCode,
          fulfillmentMethod: variables.productToAdd.fulfillmentMethod,
          options: variables.productToAdd.product.options,
          //purchaseLocationCode: selectedFulfillmentOption?.location?.code as string,
        },
        quantity: variables.productToAdd.quantity,
      }

      try {
        await addToCart.mutateAsync(addToCartPayload)
        console.log('✅ Product added from chatbot')
      } catch (err) {
        console.error('❌ Failed to add product from chatbot', err)
      }
    }

    window.addEventListener('chatbot:addToCart', handler)
    return () => window.removeEventListener('chatbot:addToCart', handler)
  }, [addToCart])

  return null
}
