import { useEffect, useState } from 'react'

import {
  fetchMembershipStatus,
  fetchMembershipTypes,
  fetchRedemptionRecords,
} from './membershipApi.js'

const initialState = {
  loading: true,
  error: null,
  membership: null,
  membershipUnavailable: false,
  membershipTypes: [],
  redemptionRecords: [],
}

export function useMembershipPageData(accountId) {
  const [state, setState] = useState(initialState)

  useEffect(() => {
    let active = true

    async function loadMembership() {
      if (!accountId) {
        if (active) {
          setState({
            ...initialState,
            loading: false,
          })
        }
        return
      }

      setState((current) => ({
        ...current,
        loading: true,
        error: null,
      }))

      try {
        const [{ membership, unavailable }, membershipTypes, redemptionRecords] = await Promise.all([
          fetchMembershipStatus(),
          fetchMembershipTypes(),
          fetchRedemptionRecords(accountId, 12),
        ])

        if (active) {
          setState({
            loading: false,
            error: null,
            membership,
            membershipUnavailable: unavailable,
            membershipTypes,
            redemptionRecords,
          })
        }
      } catch (error) {
        if (active) {
          setState({
            ...initialState,
            loading: false,
            error,
          })
        }
      }
    }

    loadMembership()

    return () => {
      active = false
    }
  }, [accountId])

  return state
}
