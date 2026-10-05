'use client';
import { useEffect, useState } from 'react';
import type { CatalogComponent } from '@/types/catalog';
import type { Palette } from '@/types/design';
type RemotePalette=Palette&{visible:boolean;order:number};
export function useCatalog(){const [components,setComponents]=useState<CatalogComponent[]>([]),[palettes,setPalettes]=useState<RemotePalette[]>([]);useEffect(()=>{fetch('/api/catalog').then(r=>r.json()).then(data=>{setComponents(Array.isArray(data.components)?data.components:[]);setPalettes(Array.isArray(data.palettes)?data.palettes:[])}).catch(()=>{})},[]);return {components,palettes}}
