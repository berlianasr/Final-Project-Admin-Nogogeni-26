import { supabase } from '@/lib/supabaseClient'

export async function getProfile() {

  const { data: user } = await supabase.auth.getUser()

  if (!user?.user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.user.id)
    .single()

  return data
}
