import type { Metadata } from 'next';
import { AccountDashboard } from '@/components/account/AccountDashboard';

export const metadata: Metadata = { title: 'حسابي ومشاريعي | WEBCRAFT', robots: { index: false, follow: false } };
export default function AccountPage() { return <AccountDashboard />; }
