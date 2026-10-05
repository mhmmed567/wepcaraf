import type { Metadata } from 'next';
import { Login } from '@/components/auth/Login';

export const metadata: Metadata = { title: 'تسجيل الدخول | WEBCRAFT' };
export default function LoginPage() { return <Login/>; }
