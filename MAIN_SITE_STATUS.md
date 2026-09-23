# Main Smabblez site — development status

Objective: develop this website as Smabblez's main creator site, prioritizing Twitch viewers and The Clown Tent membership while connecting clips, GTA RP, music, About, and collaboration information.

## Current local state — September 23, 2026

- The seven public pages remain the main site. The pending readability and six-step Chaos Mode work is preserved.
- Every secondary-page header now connects all six content hubs and the live show, with a current-page marker. The homepage navigation exposes Music and the dedicated About page.
- Phone navigation has 44px-high links and wraps without hiding destinations behind a JavaScript dependency.
- A self-contained `404.html` offers canonical routes home, to clips, community, and Twitch. It stays out of the sitemap and is included in the deployment builder.
- Preview-server HTML misses return that page with HTTP 404. Missing assets remain plain 404s; malformed URL encoding returns 400 and the next normal request succeeds.

## Evidence gathered this pass

- Project validator, JavaScript/preview-server syntax, reusable SEO validator, and static build passed.
- Real browser review covered all seven headers and secondary heroes at 1440x900 and 390x844. Current-page markers and bounds checks passed; the phone Music route worked through the homepage menu. Keyboard focus was visibly outlined.
- The recovery page rendered at desktop and phone sizes and resolved its recovery links correctly from `/missing/deep/page`.
- Homepage inspection found no horizontal overflow, broken loaded images, assigned audio source, or console errors. This navigation pass adds no motion; reduced-motion gameplay was verified in the earlier Chaos pass and was not re-emulated here.
- Web fetch, shell HTTP, and in-app browser attempts to inspect production failed with access/connection-reset errors. This is an environment observation, not proof the public site is down.
- The release review found the July schedule snapshot being projected into future weeks. The renderer now rejects snapshots older than 24 hours, missing/invalid timestamps, or timestamps more than five minutes ahead. It replaces stale cards with the official-schedule route. Fresh snapshots show their actual check time. `scripts/test-schedule.mjs` covers these cases and runs in CI.
- Fresh browser checks observed Twitch's offline state and replay links, the stale-schedule fallback at 390px with no overflow, actual music playback, pause/resume at the existing playhead, next-track playback, and volume adjustment restored to 72%. The media-kit copy action reported `Kit link copied.`; the community CTA resolves to the configured Discord invite. No message was sent or community membership changed.

## Remaining before the main-site goal is complete

1. Controlled Twitch verification is complete: `scripts/test-twitch.mjs` exercises the shipped integration with a fixture SDK, covering deferred startup, muted/no-autoplay options, ready/online/offline/play transitions, late events, response timeout, SDK errors, and recovery. These tests run in CI; they do not claim an actual live broadcast was observed.
2. Complete remote release review and CI for the combined readability, Chaos, navigation, recovery, and stale-schedule fixes. Local validation and commit preparation are complete; use Git history for the authoritative commit identity.
3. Publish the reviewed candidate through the canonical repository with release authorization, then verify the default-branch commit, successful Pages run, live asset versions, navigation, and nested 404 response.

Status: development remains active. The release candidate is unpublished. Earlier approval for PR #2 does not describe this later candidate. Git transport successfully pushed `codex/main-creator-site`; GitHub CLI authentication is invalid, the PR connector returned 403, and the browser review form still requires sign-in. No Hermes runtime was started.
