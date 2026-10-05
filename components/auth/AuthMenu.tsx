'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CircleUserRound } from 'lucide-react';
import { clientSupabase } from '@/lib/supabase/client';
import type { Language } from '@/lib/pricing';

export function AuthMenu({ compact = false, language = 'ar' }: { compact?: boolean; language?: Language }) {
  const client = useMemo(() => clientSupabase(), []);
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    if (!client) return;
    let active=true;
    const check=async()=>{const {data}=await client.auth.getSession();const session=data.session;const response=session?await fetch('/api/auth/session',{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store'}):null;if(active)setName(response?.ok?(session?.user.user_metadata?.full_name || session?.user.email || null):null)};
    void check();
    const {data:{subscription}}=client.auth.onAuthStateChange(()=>{setTimeout(()=>void check(),0)});
    return ()=>{active=false;subscription.unsubscribe()};
  }, [client]);
  return <Link href="/login" className={`auth-menu-link${compact ? ' compact' : ''}`} title={name || (language === 'en' ? 'Sign in' : 'تسجيل الدخول')}>
    <CircleUserRound size={17}/><span>{name ? name.split('@')[0] : language === 'en' ? 'Sign in' : 'دخول'}</span>
  </Link>;
}
