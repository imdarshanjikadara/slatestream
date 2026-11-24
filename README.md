# SlateStream

A web app for exploring the SlateQ vs myopic recommendation study
([slateq-recsim-study](https://github.com/imdarshanjikadara/slateq-recsim-study)): recorded simulated viewers replayed
step by step, and every result with its confidence interval and pre-registered verdict.

## Pages

| Page | What it shows |
|---|---|
| Overview | Headline numbers and the four charts that carry the study |
| Watch side by side | One recorded viewer served by two recommenders: the slate on screen, what was watched, time budget, session history |
| Watch-time race | The same viewer under all four recommenders, with the finishing order |
| Taste profile | How the viewer's interest in each of the 20 topics changes during the session (level, or change since step 1) |
| Findings | RQ1 to RQ3 and follow-ups E1 to E5: chart, table, what it shows and what it does not show |
| All comparisons | Every paired comparison as one table: search, filter by verdict, export CSV |
| How it works | The setup, the fair rules and the limits in plain words |

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
