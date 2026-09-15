import PatientHeader from '../components/PatientHeader'
import MobileTabBar from '../components/MobileTabBar'
export default function PatientShell({children}){return <div className="min-h-screen bg-slate-50 pb-20 md:pb-0"><PatientHeader/>{children}<MobileTabBar/></div>}
