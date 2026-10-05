'use client';
import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
export default function NotFound(){const router=useRouter();return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#f8f7fa',textAlign:'center'}}><div><span style={{font:'800 70px Inter',color:'#8264dc'}}>404</span><h1 style={{fontSize:24}}>الصفحة غير موجودة</h1><p style={{color:'#8c8793',fontSize:13}}>ربما تغير الرابط أو انتهت صلاحية المعاينة.</p><Button variant="primary" onPress={()=>router.push('/')}>العودة للرئيسية</Button></div></main>}
