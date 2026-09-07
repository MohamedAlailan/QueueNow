# QueueNow implementation map

The UI is implemented from the supplied Figma/SVG screens, with the Use Cases and Use Flow controlling behavior.

## Patient screens
- Home
- Services (success/loading/empty/error)
- Confirm selected service
- Ticket success
- My Queue: WAITING/CALLED/SERVING/DONE/SKIPPED/CANCELLED

## Employee screens
- Login
- Dashboard
- Waiting Queue (success/empty/error)
- Current Ticket (CALLED/SERVING)
- History
- Skip and Cancel confirmation dialogs
- Toast feedback

## Architecture
- JavaScript + React + Vite
- Tailwind CSS v4 as the primary styling system; index.css only contains Tailwind import, theme tokens and base rules.
- React Router routes patient and protected employee areas.
- en.json / ar.json control copy; switching language updates html[lang] and html[dir] so layout follows LTR/RTL.
- Queue operations are guarded by the allowed ticket transition map and terminal tickets remain stored.
