# SlateStream

A web app for exploring the SlateQ vs myopic recommendation study
([slateq-recsim-study](https://github.com/imdarshanjikadara/slateq-recsim-study)): recorded simulated viewers replayed
step by step, and every result with its confidence interval and pre-registered verdict.

## Pages

The sidebar lists the pages in reading order; each page ends with a button to the next one.

| Page | What it shows |
|---|---|
| 1 Start | The question, the four headline results, two key charts |
| 2 Watch a session | One recorded viewer under two recommenders, step by step |
| 3 Compare all four | The same viewer under all four recommenders |
| 4 Viewer tastes | How the viewer's interest in each of the 20 topics changes |
| 5 Results | RQ1 to RQ3 and follow-ups E1 to E5: chart, table, what it shows and does not show |
| All numbers | Every comparison as one table (search, download CSV) |
| About the project | Setup, how results are judged, limits |

## Where the numbers come from

`public/data/` holds `site.json` and `traces_seed<k>.json`. They are generated in the study repository from its
`results/` folder by `scripts/build_web.py`; no number in this app is typed by hand. To refresh them after the study
data changes:

```bash
npm run sync-data -- ../slateq-recsim-study
```

The replays are recorded evaluation sessions (25 viewers, N = 10 candidates, k = 3 shown); nothing is simulated in the
browser. Topic names and cover art are generated decoration: topics in the simulator are only numbers.

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
```

Checks:

```bash
npm run typecheck
npm run build
```

## Stack

React 18, TypeScript, Vite, Tailwind 4, react-router (HashRouter), lucide-react. Static build, no server.

## Deploy (Vercel)

Import the repository in Vercel (framework: Vite). `vercel.json` sets the build command, the `dist` output and
caching and security headers. No environment variables are needed.

## Limits

Simulated viewers only: nothing here is a claim about any real platform. SlateQ in the study is a PyTorch port of
RecSim's agent, checked with unit tests and a calibration against the perfect click-chaser.
