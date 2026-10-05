'use client';
import { useState } from 'react';
import type { Design } from '@/types/design';

export function useDesign(initialDesign:Design){
  const [state,setState]=useState({history:[initialDesign],index:0});
  const design=state.history[state.index];
  function update(change:Partial<Design>|((current:Design)=>Design)){
    setState(current=>{
      const base=current.history[current.index];
      const next=typeof change==='function'?change(base):{...base,...change};
      const history=[...current.history.slice(0,current.index+1),next].slice(-60);
      return {history,index:history.length-1};
    });
  }
  function undo(){setState(current=>({...current,index:Math.max(0,current.index-1)}))}
  function redo(){setState(current=>({...current,index:Math.min(current.history.length-1,current.index+1)}))}
  function reset(){setState({history:[initialDesign],index:0})}
  return {design,update,undo,redo,reset,canUndo:state.index>0,canRedo:state.index<state.history.length-1,loaded:true};
}
