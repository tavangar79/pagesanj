# Graph Report - web  (2026-10-23)

## Corpus Check
- 23 files · ~7,527 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 103 nodes · 209 edges · 7 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7de1093b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_App.tsx|App.tsx]]
- [[_COMMUNITY_devDependencies|devDependencies]]
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_web|web/]]
- [[_COMMUNITY_scripts|scripts]]

## God Nodes (most connected - your core abstractions)
1. `Strings` - 14 edges
2. `compilerOptions` - 11 edges
3. `useSite()` - 10 edges
4. `LegalPage()` - 8 edges
5. `Locale` - 7 edges
6. `Rich()` - 6 edges
7. `formatNumber()` - 6 edges
8. `scripts` - 5 edges
9. `Home()` - 5 edges
10. `matchRoute()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `LegalPage()` --calls--> `useSite()`  [EXTRACTED]
  web/src/components/LegalPage.tsx → web/src/site.tsx
- `BlockView()` --calls--> `useSite()`  [EXTRACTED]
  web/src/components/LegalPage.tsx → web/src/site.tsx
- `Home()` --calls--> `formatNumber()`  [EXTRACTED]
  web/src/pages/Home.tsx → web/src/site.tsx
- `App()` --calls--> `matchRoute()`  [EXTRACTED]
  web/src/App.tsx → web/src/routes.ts
- `Layout()` --calls--> `instagramUrl()`  [EXTRACTED]
  web/src/components/Layout.tsx → web/src/site.tsx

## Import Cycles
- None detected.

## Communities (7 total, 0 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.20
Nodes (13): App(), PageData, dataEl, render(), DeletionStatus(), NotFound(), Privacy(), Terms() (+5 more)

### Community 1 - "devDependencies"
Cohesion: 0.09
Nodes (21): dependencies, @fontsource-variable/vazirmatn, react, react-dom, devDependencies, tailwindcss, @tailwindcss/vite, @types/react (+13 more)

### Community 2 - "index.ts"
Cohesion: 0.22
Nodes (13): BlockView(), LegalPage(), StatusForm(), en, fa, Block, LegalDoc, Section (+5 more)

### Community 3 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, skipLibCheck (+4 more)

### Community 4 - "web/"
Cohesion: 0.33
Nodes (5): Commands, graphify, How it renders, Rules (Meta App Review depends on these), web/

### Community 5 - "scripts"
Cohesion: 0.21
Nodes (14): Globe(), Lock(), Mail(), Send(), ShieldCheck(), Layout(), SUBPATHS, Ltr() (+6 more)

## Knowledge Gaps
- **37 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+32 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Strings` connect `index.ts` to `App.tsx`, `scripts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _37 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._