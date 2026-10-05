import type { Metadata } from 'next';
import { Login } from '@/components/auth/Login';

export const metadata: Metadata = { title: 'إنشاء حساب | WEBCRAFT' };
export default function SignupPage() { return <Login initialMode="signup"/>; }
