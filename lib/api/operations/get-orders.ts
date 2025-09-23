import { NextApiRequest, NextApiResponse } from 'next'

import { fetcher } from '@/lib/api/util'
import { getAdditionalHeader } from '@/lib/api/util'
import getUserClaimsFromRequest from '@/lib/api/util/getUserClaimsFromRequest'
import { getOrdersQuery } from '@/lib/gql/queries'

export default async function getOrdersOperation(
  params: any,
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userClaims = req && res ? await getUserClaimsFromRequest(req, res) : undefined
  const headers = req ? getAdditionalHeader(req) : {}
  console.log(params, req)
  const response = await fetcher(
    { query: getOrdersQuery, variables: params },
    { userClaims, headers }
  )
  return response?.data?.orders
}
