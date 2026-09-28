# Service Job Card Manager (Demo)

A workshop-style job card board for vehicle servicing - booking, mechanic assignment, parts & labour billing, and status tracking on a Kanban board.

## Overview
This app models how a vehicle service centre tracks work: a customer drops off a vehicle, a job card is opened, a mechanic is assigned, parts and labour are billed as the work happens, and the card moves across a board from **Booked -> In Progress -> Ready for Delivery -> Delivered**.

## Live Demo
Add the link here once this repo is deployed on GitHub Pages
(Settings -> Pages -> Deploy from branch -> main -> / (root))

## Features
- **Kanban board** - job cards grouped by status, click a card for full detail
- **New Job Card** - customer, vehicle, registration number, assigned mechanic, reported issue
- **Parts & Labour billing** - add line items inside the job card, running total updates live
- **Status tracking** - move a card through its lifecycle with one click
- **Mechanics** - a simple roster, with a live count of each mechanic's active jobs

## Tech Stack
- HTML5, CSS3, vanilla JavaScript - no framework, no build step
- Data stored in the browser (`localStorage`) - no backend server

## How It Works - Code Walkthrough
- **Data model** (`app.js`): `jobs` (array of job card objects) and `mechanics` (array of `{id, name}`), both persisted to `localStorage` as JSON.
- **Board rendering**: `renderBoard()` loops over the four fixed `STATUSES` and, for each one, filters `jobs` to that status and renders a small card into that column - so moving a job between columns is just changing `job.status` and re-rendering, no drag-and-drop plumbing needed.
- **Detail modal**: clicking a card calls `openModal(jobId)`, which finds the job object and renders its full detail - customer info, status buttons, parts table, labour table - into a single overlay `<div>`. A local `draw()` function re-renders just that modal's contents after every change (add a part, change status), so the rest of the page doesn't need to re-render.
- **Event delegation**: rather than attaching a listener to every button inside the modal (which gets rebuilt often), one click listener on the modal's container reads `data-action` off whatever was clicked and runs the matching branch (`add-part`, `del-part`, `set-status`, ...). This is a common pattern for UI that redraws itself frequently.
- **Totals**: `jobTotal(job)` sums `qty x price` for every part plus the `amount` of every labour line - recomputed on the fly, never stored, so it's always correct after an edit.
- **Mechanic workload**: the Mechanics tab counts, for each mechanic, how many of their jobs are not yet `"Delivered"` - a live workload indicator with no extra state to keep in sync.

## Run Locally
Just open `index.html` in any modern browser - no server or build step required.

## Notes
- This is an original demo project built for portfolio purposes; it is not connected to any real workshop's data.
