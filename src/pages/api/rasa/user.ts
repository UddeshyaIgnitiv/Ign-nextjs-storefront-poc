import { getCurrentUser } from '@/lib/api/operations'

import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await getCurrentUser(req, res)
    const userId = response?.customerAccount?.id || null
    return res.status(200).json({ userId })
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch current user' })
  }
}
