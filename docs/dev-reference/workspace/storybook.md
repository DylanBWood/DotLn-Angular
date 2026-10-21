# Storybook and visual review

Run `npx nx storybook ui` to open the local catalog at `http://127.0.0.1:6006`.
The Angular Vite builder shares the installed Angular/Vite/AnalogJS stack and
uses zoneless rendering. `npx nx build-storybook ui` creates `dist/storybook/ui`.
The catalog is local development output; it is not published by these targets.

Stories live beside the components. They cover every shared UI component,
loading-button variants, all three status badges, tabs, menu, dialog, the shell,
and recorded, unavailable and unsupported-version boards. Root `.storybook/`
configuration provides the actual English catalog and the house UI providers.
Storybook's documentation code is separate from the production application bundle.

Run `npx nx e2e dotln-e2e` for the persistent browser suite. It builds both the app
and catalog, serves their static output, and checks DOM contracts, local links,
keyboard behavior, dialog focus trapping and return, menu focus, narrow layouts,
and axe. One browser worker keeps the suite within the bounded probe budget.
Unit runners use two workers and Nx schedules one task at a time for the same
reason; no assertion or test has been disabled for resource pressure.

Run `npx nx e2e-visual dotln-e2e` for screenshot comparisons. Baselines live in
`apps/dotln-e2e/src/visual-baselines/darwin/` and are tracked. The dedicated macOS
CI job matches their operating-system family; the Linux job runs behavioral and
accessibility coverage. Other operating systems require independently reviewed
baselines, since pixel rasterization differs. Playwright and Chromium are pinned
by the lockfile. Inter's Latin variable font is bundled locally and screenshots
wait for fonts and stable rendering. Reduced motion is enabled.

The visual suite captures desktop and mobile views of every board panel, a full
actor row, component states, menu placement and focus, the dialog/backdrop, the
shell, and unavailable/version-mismatch pages. It permits 0.1% differing pixels;
this is a regression threshold, not a substitute for visual judgment.

To deliberately refresh screenshots on the baseline environment, run:

```sh
npx nx e2e-visual dotln-e2e -- --update-snapshots=all
```

Inspect the actual images at normal reading size before accepting changes. Check
hierarchy, spacing rhythm, wrapping, contrast, clipping, focus rings, overlay
alignment, busy states and mobile reachability. Then rerun without the update
flag. A baseline update belongs in the same review as its visual change. Failure
screenshots and traces are under the ignored Playwright output directory.
