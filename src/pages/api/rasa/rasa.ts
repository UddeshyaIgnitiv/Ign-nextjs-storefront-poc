import type { NextApiRequest, NextApiResponse } from 'next'

const RASA_SERVER = 'http://3.149.71.6:5005/webhooks/rest/webhook'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await fetch(RASA_SERVER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    })

    const data = await response.json()
    res.status(200).json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
