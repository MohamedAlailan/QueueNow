# QueueNow Design Mapping

The current UI is rebuilt against the supplied desktop/mobile SVG wireframes and the supplied Use Flow/Use Case logic.

## Patient screens
- Home: desktop two-column hero + now-serving + queue stats + six service cards.
- Services: heading/filter row + 3-column desktop service grid + OPEN/CLOSED actions.
- Service Confirmation: selected-service detail on the left and action card on the right.
- My Queue: large ticket number + status + four-step tracker on the left; now-serving and ticket metadata on the right.
- Queue confirmation: dashed Cancel action opens the confirmation dialog; ticket is retained after cancellation.

## Employee screens
- Desktop split layout: sidebar/navigation + current ticket detail + waiting queue table.
- Current ticket actions are state-driven: CALLED -> Start, SERVING -> Done; Skip/Cancel use confirmation.
- Next selects the oldest WAITING ticket and locks the action when another ticket is active.

## Language / direction
- `src/i18n/en.json` and `src/i18n/ar.json` are the only UI copy sources.
- `LanguageContext` toggles `document.documentElement.lang` and `dir` and persists the selection.
- CSS uses logical borders/padding and explicit RTL rules for the employee sidebar and stepper.

## Routing
- `/`
- `/services`
- `/services/:serviceId`
- `/queue`
- `/queue/:ticketId`
- `/employee`
- `/employee/waiting`
- `/employee/current`

## Source-of-truth behavior
- Ticket transitions follow the supplied flow: WAITING -> CALLED -> SERVING -> DONE, with WAITING -> CANCELLED and CALLED -> SKIPPED/CANCELLED and SERVING -> DONE/CANCELLED.
- Terminal tickets remain stored; queue numbers are not reused in the demo store.
