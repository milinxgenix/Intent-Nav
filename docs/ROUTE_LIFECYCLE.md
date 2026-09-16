# Route Lifecycle, Quarantine, and Promotion Specification

## 1. Formal Route Lifecycle States

A navigation route evolves through an explicit state machine:

```
DISCOVERED
    ↓
CANDIDATE
    ↓
INVARIANT_VALIDATED
    ↓
PROVISIONAL (Quarantine)
    ↓
TRANSITION_VERIFIED
    ↓
ACTIVE_VALIDATED
    ↓
DEMOTED (On Runtime Failure)
    ↓
QUARANTINED (On Repeated / Unsafe Failure)
```

---

## 2. Provisional Route Quarantine

Newly generated or recovered routes must **never** become active immediately.

Upon selection by the Candidate Ranking Engine, the route enters `PROVISIONAL` quarantine:
- The route is stored on the capability node in `provisionalRouteIds`.
- The active route pointer (`activeRouteId`) is **not** updated.
- The route remains isolated until the Causal Transition Verifier approves it.

---

## 3. Validated Route Promotion

Promotion to `ACTIVE_VALIDATED` occurs strictly when:
1. The route is currently in `PROVISIONAL` or `TRANSITION_VERIFIED`.
2. The Causal Transition Verifier emits `causallyVerified === true`.
3. Observed witnesses satisfy the multi-class quorum and expected state delta.

Once promoted:
- The capability node updates `activeRouteId = routeId`.
- The route is removed from `provisionalRouteIds`.
- `lastValidatedTimestamp` is recorded.

---

## 4. Route Demotion and Rollback

If an `ACTIVE_VALIDATED` route fails during subsequent execution:
1. Status is immediately updated to `DEMOTED`.
2. `demotedRouteIds` records the failure reason.
3. The Route Manager checks for a previous validated route version (e.g. $V_1$).
4. If found, the system rolls back to the prior validated route.
5. If no prior valid route exists, fresh candidate discovery and invariant closure are initiated.
