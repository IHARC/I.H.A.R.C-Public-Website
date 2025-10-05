# Portal MVP Implementation Plan

## Guiding Outcomes
- Deliver a collaborative workflow that mirrors agile cadences while remaining approachable for community members through the community project board.
- Keep `/command-center` lightweight for now with headline cards and a “coming soon” backlog preview until richer data sources are ready.
- Prioritise authenticated participation flows (idea submission, voting, two-level comments, flagging) with transparent moderation touchpoints.

## Dashboard Placeholder Strategy
- Show most recent value per metric (if any) with simple summary copy; hide charts when data volume is sparse and replace with "Trend insights coming soon" message.
- Reserve sections for project cadence summaries ("Ideas in progress", "Next review window") populated with static copy for MVP.
- Provide quick links into `/solutions` filters (e.g., "Active this week", "Needs review") to guide users into the collaborative workspace.

## Collaboration Workflow (Inspired by Agile)
1. **Backlog Intake** – ideas land in `status = 'new'`; moderators triage into "Sprint candidates" (under_review/in_progress).
2. **Community Project Board** – statuses map to columns: `new`, `under_review`, `in_progress`, `adopted`, `not_feasible`, `archived`.
3. **Review Rituals** – official agency/org responses recorded as comments flagged `is_official`, surfaced alongside idea timeline.
4. **Retrospective Signals** – vote totals, comment activity, and moderation flags roll into audit log for future reporting.

## Feature Priorities (This Iteration)
- [ ] API endpoints: ideas (create), votes (toggle), comments (post with depth control), flags (create), metrics (public range query).
- [ ] Rate limiting and safety validation on server for all mutations, mirroring client-side guards.
- [ ] Attachment workflow: signed upload URLs + metadata persistence for private bucket `portal-attachments`.
- [ ] Audit logging wired for every mutation endpoint with hashed IP/User-Agent metadata.
- [ ] Portal profile onboarding: persist `rules_acknowledged_at` when first modal is accepted.
- [ ] Moderation queue UX refresh (use router refresh instead of full reload) and official-response audit entry.
- [ ] Dashboard placeholder copy + quick links emphasising community project board collaboration.

## Known Follow-Ups (Post-MVP)
- Rich analytics visualisation once daily metrics history grows; integrate cumulative trend analysis.
- Automated notifications (email/webhook) for status changes and official responses.
- Advanced safety tooling (machine-learning moderation, full PII/profanity lists synced from database tables).
- Crowd project planning surface that batches ideas into themed iterations with timeline projections.
