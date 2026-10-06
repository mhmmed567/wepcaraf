'use client';

export default function DashboardError({ reset }: { error: Error; reset: () => void }) { return <div className="saas-error"><h2>تعذر فتح مساحة العمل</h2><p>تحقق من الاتصال ثم أعد المحاولة.</p><button type="button" onClick={reset}>إعادة المحاولة</button></div>; }
