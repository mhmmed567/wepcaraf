import { NextResponse } from 'next/server';
import { serviceDb } from '@/lib/supabase/server';
export const runtime='nodejs';
export async function GET(){try{const db=serviceDb();if(!db)return NextResponse.json({supabase:false},{headers:{'Cache-Control':'no-store'}});const checks=await Promise.all([db.from('settings').select('id').limit(1),db.from('projects').select('id').limit(1),db.from('project_members').select('project_id').limit(1)]);return NextResponse.json({supabase:checks.every(result=>!result.error)},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({supabase:false},{headers:{'Cache-Control':'no-store'}})}}
