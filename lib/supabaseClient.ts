import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ggzyvfqfclwelgooojmk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_UfUEGWxXX6mPtlNOR4yBXg_yZtt6lbz';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);