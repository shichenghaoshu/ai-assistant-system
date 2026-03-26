import { useCallback, useEffect, useState } from 'react'

import { fetchMembershipTypes, fetchRedemptionRecords } from '../membership/membershipApi.js'

const initialState = {
  loading: true,
  error: null,
  membershipTypes: [],
  redemptionRecords: [],
}

export function useRedeemPageData(accountId) {
  const [state, setState] = useState(initialState)
  const [refreshSeed, setRefreshSeed] = useState(0)

  useEffect(() => {
    let active = true

    async function loadRedeemSidebar() {
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
        const [membershipTypes, redemptionRecords] = await Promise.all([
          fetchMembershipTypes(),
          fetchRedemptionRecords(accountId, 5),
        ])

        if (active) {
          setState({
            loading: false,
            error: null,
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

    loadRedeemSidebar()

    return () => {
      active = false
    }
  }, [accountId, refreshSeed])

  const refresh = useCallback(() => {
    setRefreshSeed((current) => current + 1)
  }, [])

  return {
    ...state,
    refresh,
  }
}
