'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const WebChat = dynamic(() => import('rasa-webchat'), { ssr: false })

const Chatbot = () => {
  const rasaSocketUrl = process.env.NEXT_PUBLIC_RASA_SERVER_URL || 'http://3.149.71.6:5005'

  // Handle socket events
  const handleSocketEvent = {
    bot_uttered: () => console.log('Bot uttered event received'),
    connect: () => console.log('Connected to Rasa'),
    disconnect: () => console.log('Disconnected from Rasa'),
  }

  // Custom widget handler (if supported by the package)
  const customWidget = (args: any) => {
    const { data } = args

    if (data?.text?.startsWith?.('CARD::')) {
      try {
        const cardData = JSON.parse(data.text.replace('CARD::', ''))
        const PDP_BASE = 'https://ignitiv-nextjs-storefront-poc.vercel.app/product/'
        const code = cardData.code_print || cardData.product_id || ''
        const builtUrl = code ? PDP_BASE + encodeURIComponent(code) : ''
        const openUrl = cardData.product_url || builtUrl

        return (
          <div
            style={{
              border: '1px solid #ddd',
              padding: '10px',
              borderRadius: '8px',
              margin: '10px 0',
            }}
          >
            {cardData.image && (
              <img
                src={cardData.image}
                alt={cardData.name}
                style={{ maxWidth: '100%', borderRadius: '6px' }}
              />
            )}
            <h4 style={{ margin: '6px 0' }}>{cardData.name}</h4>
            <p style={{ margin: '4px 0' }}>
              <strong>Price:</strong> {cardData.price}
            </p>
            {cardData.description && (
              <p style={{ color: '#555', margin: '4px 0' }}>{cardData.description}</p>
            )}
            <div style={{ marginTop: '8px' }}>
              <button
                style={{
                  display: 'inline-block',
                  margin: '0 6px 6px 0',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: '#e8f0ff',
                  border: '1px solid #c7daff',
                  cursor: 'pointer',
                }}
                onClick={() => window.open(openUrl, '_blank')}
              >
                Add to cart
              </button>
              <button
                style={{
                  display: 'inline-block',
                  margin: '0 6px 6px 0',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: '#e8f0ff',
                  border: '1px solid #c7daff',
                  cursor: 'pointer',
                }}
                onClick={() => window.open(openUrl, '_blank')}
              >
                Buy Product
              </button>
            </div>
          </div>
        )
      } catch (e) {
        return <div>{data.text}</div>
      }
    }
    return null
  }

  return (
    <WebChat
      initPayload={'/greet'}
      socketUrl={rasaSocketUrl}
      customData={{ language: 'en' }}
      title={'The Ignitiv Store'}
      inputTextFieldHint={'Type your message...'}
      hideWhenNotConnected={false}
      embedded={false}
      showFullScreenButton={true}
      profileAvatar={'https://example.com/avatar.png'}
      params={{
        storage: 'session',
        images: {
          dims: {
            width: 300,
            height: 200,
          },
        },
      }}
      onSocketEvent={handleSocketEvent}
      // Use customRenderer if supported, or check package documentation
      // customRenderer={customWidget}
    />
  )
}

export default Chatbot
