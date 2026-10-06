import type { ReactNode } from 'react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import './dashboard.css';
import './visual-builder.css';

export const metadata = { title: 'مساحة العمل | WEBCRAFT', robots: { index: false, follow: false } };
export default function DashboardLayout({ children }: { children: ReactNode }) { return <DashboardShell>{children}</DashboardShell>; }
