import React, { useEffect, useState } from 'react'

import Backdrop from '@mui/material/Backdrop'
import CircularProgress from '@mui/material/CircularProgress'

import { useAddCartItem, useConfigureProduct } from '@/hooks'

export default function CartBridge() {
  const { addToCart } = useAddCartItem()
  const { configureProduct } = useConfigureProduct()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handler = async (e: Event) => {
      const customEvent = e as CustomEvent<{
        productCode: string
        options?: any[]
        quantity?: number
      }>

      const { productCode, options = [], quantity = 1 } = customEvent.detail
      console.log('🛒 Chatbot event received:', { productCode, options, quantity })

      setLoading(true)
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
      } finally {
        setLoading(false)
      }
    }

    window.addEventListener('chatbot:addToCart', handler)
    return () => window.removeEventListener('chatbot:addToCart', handler)
  }, [addToCart, configureProduct])

  return (
    <>
      {loading && (
        <Backdrop open sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <CircularProgress color="inherit" />
        </Backdrop>
      )}
    </>
  )
}
