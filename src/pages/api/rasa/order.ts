import { getOrdersOperation } from '@/lib/api/operations'

import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orderNumber } = req.body
  try {
    const params = { filter: `orderNumber eq ${orderNumber} and status ne Abandoned` }
    const orders = await getOrdersOperation(params, req, res)
    return res.status(200).json({ orders })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Could not fetch orders' })
  }
}
