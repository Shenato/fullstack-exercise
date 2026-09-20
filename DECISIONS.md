# Decisions

Yours to write, not your AI's. Short is good — bullets are fine, and half a page is
plenty. We read this first.

## What did the spec not tell you?

There are things this brief doesn't specify. Which ones did you hit, what did you decide,
and why?

- I assumed Monday to Friday workdays and inclusive assignment dates. For partial weeks, I adjusted available hours to match the selected workdays.
- Could just be a nitpick that isn't worth it for the consumer but, we treat 20 hours/week as four hours each weekday. But someone might work two full days and a half-day. The schema cannot distinguish those schedules, so partial-week capacity requires an assumption.
- We don't have a good schema representation of weekly hours historically, so editing the single field will change the historical capacity calculations. of the table not just the future.
- We don't handle holidays, differences such as Sunday being the start of the week for some countries, or vacation.

## What did you notice that looked wrong?

Anything in the output that didn't match what you expected. Whether you fixed it or left
it, we want to know you saw it.

- in the beginning as i was designing the table, I quickly realized it was hard to read on mobile. I changed it to stacked weekly entries so users don’t need to scroll sideways.

- Several assignments looked duplicated. I counted each row because removing them would change the supplied allocations.

## What did the AI get wrong that you caught?

One concrete example. Every real session has one.

- The AI wrote custom date calculations. I questioned that and asked for an established library; we switched to Day.js.
- It also assumed many things about the assignment that I had to correct in the early planning phase, such as that it was already going to be paginated but after carefully re-reading the instructions I corrected it that we need to fetch everyone for the assignment, and pagination could be something we talk about in the followup interview instead.
- AI suggeted we just refetch the endpoint after patch, I suggested we use tanstack query invalidation after the patch to refetch capacity, with optimistic updates that eventually synchronize once the real data is re-fetched. this is a micro-optimization on the scale of the assignment but at scale it allows the user to see instant results regardless of how long the backend takes to respond
- Implemented sideway scrolling, Instantly told it that's a terrible Ux and we can simply just stack the UI elements ontop of eachother inside the table on mobile.

## What would you do differently with a week?

- I’d test concurrent traffic and optimize based on measurements.
- I would paginate people before aggregating assignments, Otherwise, one person’s weeks could be split across pages, and the database might still aggregate everyone.
- Incase of the former's tradeoffs making sense for our use case. I would move search to the backend
- Depending on the user expectations I would try to group the people based on team or assignment on the application level (FE and BE) such that managers can pick a specific team/assignment and look at the people in that team/assignment only to have an easier time managing specific groups of people. These things one gets a better feel for when they interact more with their customers and track user engagement for specific features on any dashboard.
