import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xbqrcdeixtggkjaayzzb.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_07DR1az_D3qqe82cetl--A_gDKbDz_f'

export const supabase = createClient(supabaseUrl, supabaseKey)
