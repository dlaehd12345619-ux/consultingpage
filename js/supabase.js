import { createClient } from '@supabase/supabase-js';

// 값은 .env (로컬) 또는 Vercel Environment Variables (배포)에서 읽습니다.
// anon 키는 브라우저에 공개되는 키이며, 실제 보호는 Supabase의 RLS 정책이 담당합니다.
// service_role 키는 절대 여기에 넣지 마세요.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;
