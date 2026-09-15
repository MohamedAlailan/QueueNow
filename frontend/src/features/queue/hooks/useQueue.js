import { useEffect,useState } from 'react'
import { getState,subscribe } from '../services/queueService'
export function useQueueState(){const[state,setState]=useState(getState);useEffect(()=>subscribe(()=>setState(getState())),[]);return{state,refresh:()=>setState(getState())}}
