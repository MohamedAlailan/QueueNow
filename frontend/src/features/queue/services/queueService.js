import { readStorage, writeStorage } from '../../../shared/utils/storage'
const KEY='queuenow-state-v4';const EVENT='queuenow:queue-changed'
export const services=[
 {id:'examination',nameKey:'examination',descriptionKey:'examination',prefix:'A',open:true,waiting:5,duration:20},
 {id:'cleaning',nameKey:'cleaning',descriptionKey:'cleaning',prefix:'A',open:true,waiting:3,duration:30},
 {id:'rootCanal',nameKey:'rootCanal',descriptionKey:'rootCanal',prefix:'B',open:true,waiting:2,duration:45},
 {id:'extraction',nameKey:'extraction',descriptionKey:'extraction',prefix:'C',open:true,waiting:1,duration:30},
 {id:'whitening',nameKey:'whitening',descriptionKey:'whitening',prefix:'D',open:false,waiting:0,duration:45},
 {id:'braces',nameKey:'braces',descriptionKey:'braces',prefix:'E',open:false,waiting:0,duration:60},
]
const seed=[
{id:'t-14',number:'A-014',serviceId:'cleaning',status:'CALLED',createdAt:1,createdLabel:'09:08',calledAt:'09:30',waited:18},
{id:'t-15',number:'A-015',serviceId:'cleaning',status:'WAITING',createdAt:2,createdLabel:'09:12'},
{id:'t-16',number:'A-016',serviceId:'examination',status:'WAITING',createdAt:3,createdLabel:'09:15'},
{id:'t-17',number:'A-017',serviceId:'cleaning',status:'WAITING',createdAt:4,createdLabel:'09:18'},
{id:'t-18',number:'A-018',serviceId:'extraction',status:'WAITING',createdAt:5,createdLabel:'09:21'},
{id:'t-19',number:'A-019',serviceId:'examination',status:'WAITING',createdAt:6,createdLabel:'09:24'},
{id:'t-20',number:'A-020',serviceId:'whitening',status:'WAITING',createdAt:7,createdLabel:'09:27'},
]
const initial={tickets:seed,activeTicketId:'t-15',currentServing:'A-013',doneToday:12,counters:{examination:20,cleaning:20,rootCanal:0,extraction:0,whitening:0,braces:0}}
const allowed={WAITING:['CALLED','CANCELLED'],CALLED:['SERVING','SKIPPED','CANCELLED'],SERVING:['DONE'],DONE:[],SKIPPED:[],CANCELLED:[]}
const clone=(v)=>JSON.parse(JSON.stringify(v));const get=()=>readStorage(KEY,clone(initial));const emit=(state)=>{writeStorage(KEY,state);window.dispatchEvent(new CustomEvent(EVENT))};const now=()=>new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
export function getServices(){return services.map(x=>({...x}))}
export function getService(id){return services.find(x=>x.id===id)||null}
export function getState(){return get()}
export function getTicket(id){return get().tickets.find(x=>x.id===id)||null}
export function createTicket(serviceId){const state=get();const s=getService(serviceId);if(!s)throw new Error('SERVICE_NOT_FOUND');if(!s.open)throw new Error('SERVICE_CLOSED');state.counters[s.id]=(state.counters[s.id]||0)+1;const number=`${s.prefix}-${String(state.counters[s.id]).padStart(3,'0')}`;const ticket={id:`t-${Date.now()}-${Math.random().toString(16).slice(2)}`,number,serviceId,status:'WAITING',createdAt:Date.now(),createdLabel:now()};state.tickets.push(ticket);state.activeTicketId=ticket.id;emit(state);return ticket}
export function transitionTicket(id,next){const state=get();const t=state.tickets.find(x=>x.id===id);if(!t)throw new Error('NOT_FOUND');if(!allowed[t.status].includes(next))throw new Error('INVALID_TRANSITION');t.status=next;if(next==='CALLED'){t.calledAt=now();t.waited=Math.max(0,Math.round((Date.now()-new Date(`1970-01-01T${t.createdLabel}`).getTime())/60000))||18;state.currentServing=t.number}if(next==='SERVING')t.startedAt=now();if(next==='DONE'){t.completedAt=now();state.doneToday+=1;state.currentServing=t.number}if(next==='SKIPPED'||next==='CANCELLED'){t.closedAt=now();if(state.currentServing===t.number)state.currentServing=null}emit(state);return t}
export function callNext(){const state=get();if(state.tickets.some(t=>t.status==='CALLED'||t.status==='SERVING'))throw new Error('BUSY');const next=state.tickets.filter(t=>t.status==='WAITING').sort((a,b)=>a.createdAt-b.createdAt)[0];if(!next)throw new Error('EMPTY');next.status='CALLED';next.calledAt=now();state.currentServing=next.number;emit(state);return next}
export function subscribe(listener){window.addEventListener(EVENT,listener);window.addEventListener('storage',listener);return()=>{window.removeEventListener(EVENT,listener);window.removeEventListener('storage',listener)}}
export function resetQueue(){localStorage.removeItem(KEY);window.dispatchEvent(new CustomEvent(EVENT))}
export {allowed}
