# QueueNow Design Audit

The implementation now treats the supplied Figma/SVG frames and the Use Flow as joint sources of truth.

## Employee dashboard frames
- Dedicated full-height employee shell with a 180px sidebar.
- Dashboard: Current Ticket panel + Waiting Queue table, top status badges, compact mono labels, and monochrome actions.
- Waiting Queue: four metric cards, oldest-first table, Next Patient CTA, and queue-rule note.
- Current Ticket: large ticket card, state badge, Called/Started/Waited metadata, Actions card, and Up Next card.
- CALLED state exposes Start / Skip / Cancel; SERVING exposes Done, matching the supplied screens.
- Skip and Cancel use the supplied confirmation-dialog treatment.

## Patient system states
- Services loading state uses six skeleton cards and centered loading text.
- Employee Waiting Queue supports empty and error state presentations matching the supplied state frames.
- Ticket creation now lands on a dedicated success screen before My Queue, matching the Use Flow.

## Behavior rules
- React Router routes employee and patient screens separately.
- Arabic/English JSON dictionaries remain separate and direction changes between RTL/LTR.
- Ticket state transitions remain backend-style guarded in `queueStore.js`.
- Queue ordering remains oldest WAITING first.
- Terminal tickets are retained and queue numbers are not reused in the current MVP store.
