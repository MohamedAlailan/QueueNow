import { employeeName,isEmployeeSignedIn } from '../../queue/services/authService'
export function useEmployeeAuth(){return{signedIn:isEmployeeSignedIn(),name:employeeName()}}
