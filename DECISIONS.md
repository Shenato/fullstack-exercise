# Decisions

Yours to write, not your AI's. Short is good — bullets are fine, and half a page is
plenty. We read this first.

## What did the spec not tell you?

There are things this brief doesn't specify. Which ones did you hit, what did you decide,
and why?

-

## What did you notice that looked wrong?

Anything in the output that didn't match what you expected. Whether you fixed it or left
it, we want to know you saw it.

-

## What did the AI get wrong that you caught?

One concrete example. Every real session has one.

- The AI designed the

## What would you do differently with a week?

- I would paginate people before aggregating assignments, not paginate the final person per week rows. Otherwise, one person’s weeks could be split across pages, and the database might still aggregate everyone. Ofcourse this means I would have to implement a search endpoint since we wouldn't be able to search the entire dataset on the Frontend.

- I would add backend pagination and do more query optimizations based on our customer's needs. If most teams run 2 week sprints for example I would try to optimize for that.
