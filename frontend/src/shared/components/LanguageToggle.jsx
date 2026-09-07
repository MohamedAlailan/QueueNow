import { Languages } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage'
export default function LanguageToggle(){const{language,setLanguage}=useLanguage();const next=language==='en'?'ar':'en';return <button type="button" onClick={()=>setLanguage(next)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 font-mono text-[10px] font-semibold text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"><Languages className="size-3.5"/>{language==='en'?'AR':'EN'}</button>}
