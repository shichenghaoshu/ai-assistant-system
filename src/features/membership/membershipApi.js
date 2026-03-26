import { supabase } from '../../auth/session.js'

const missingMembershipRpcPattern = /Could not find the function public\.get_user_membership/i

export function isMembershipRpcUnavailable(error) {
  return missingMembershipRpcPattern.test(error?.message ?? '')
}

export async function fetchMembershipStatus() {
  const { data, error } = await supabase.rpc('get_user_membership')

  if (error) {
    if (isMembershipRpcUnavailable(error)) {
      return {
        membership: null,
        unavailable: true,
      }
    }

    throw error
  }

  return {
    membership: data,
    unavailable: false,
  }
}

export async function fetchMembershipTypes() {
  const { data, error } = await supabase
    .from('membership_types')
    .select('id,name,display_name,description,duration_days,features,is_active,sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function fetchRedemptionRecords(accountId, limit = 8) {
  if (!accountId) {
    return []
  }

  const { data, error } = await supabase
    .from('redemption_records')
    .select('*, membership_type:membership_types(display_name,name)')
    .eq('user_id', accountId)
    .order('redeemed_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return data ?? []
}
