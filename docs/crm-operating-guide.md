# Trexiti CRM Operating Guide

The internal CRM lives at `/crm`.

## What It Manages

- Prospect companies
- Decision makers
- Systems Audit opportunities
- PropertyOS prospects
- Pipeline stages
- Lead score and priority
- Estimated opportunity value
- Next actions and follow-up dates
- Operational pain points
- Notes from calls, research, and outreach

## Pipeline Stages

1. Research
Targets to investigate before outreach.

2. Contacted
Leads that have received the first message.

3. Qualified
Leads with a clear operational pain Trexiti can solve.

4. Audit Booked
Prospects ready for a Systems Audit.

5. Proposal
Opportunities with a scoped system, automation, PropertyOS, or software build.

6. Won
Clients secured.

## How To Use It For Lead Hunting

- Add a lead when you find a business with visible operational complexity.
- Use the pain field to describe the exact issue: maintenance chaos, WhatsApp requests, manual reporting, scattered tools, field dispatch, owner updates, or dashboard gaps.
- Score leads higher when the pain is urgent, repeated, expensive, and tied to real business operations.
- Move leads to Qualified only when the problem is clear enough to map into a system.
- Move leads to Audit Booked when the next step is a Trexiti Systems Audit.
- Use notes after every call, email, WhatsApp exchange, or research session.
- Export JSON as your backup file.
- Export CSV when you want to review leads in a spreadsheet.

## Important Production Note

The current CRM is a high-quality local operating console. It stores data in the browser on the machine where it is used.

For a production CRM with real website lead capture, Trexiti should add:

- Login/authentication
- A database such as Supabase, Neon, PlanetScale, or Firebase
- Server-side form submission from the contact page
- Email notifications
- Role-based access
- Cloud backups
- Optional CRM integrations

Until then, use `/crm` as the internal lead-hunting command center and export your data regularly.
