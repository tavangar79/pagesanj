# Graph Report - web  (2026-10-23)

## Corpus Check
- 19 files · ~1,619 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 78 nodes · 130 edges · 8 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c5252e5e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_App.tsx|App.tsx]]
- [[_COMMUNITY_devDependencies|devDependencies]]
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_web|web/]]
- [[_COMMUNITY_scripts|scripts]]
- [[_COMMUNITY_entry-server.tsx|entry-server.tsx]]

## God Nodes (most connected - your core abstractions)
1. `Strings` - 12 edges
2. `compilerOptions` - 11 edges
3. `LegalPage()` - 7 edges
4. `scripts` - 5 edges
5. `matchRoute()` - 5 edges
6. `web/` - 5 edges
7. `App()` - 4 edges
8. `PageData` - 3 edges
9. `render()` - 3 edges
10. `Locale` - 3 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `matchRoute()`  [EXTRACTED]
  web/src/App.tsx → web/src/routes.ts
- `render()` --calls--> `dirFor()`  [EXTRACTED]
  web/src/entry-server.tsx → web/src/routes.ts
- `render()` --calls--> `matchRoute()`  [EXTRACTED]
  web/src/entry-server.tsx → web/src/routes.ts

## Import Cycles
- None detected.

## Communities (8 total, 0 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.26
Nodes (9): PageData, LegalPage(), dataEl, Strings, DeletionStatus(), Home(), NotFound(), Privacy() (+1 more)

### Community 1 - "devDependencies"
Cohesion: 0.12
Nodes (15): dependencies, react, react-dom, devDependencies, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom (+7 more)

### Community 2 - "index.ts"
Cohesion: 0.21
Nodes (9): Layout(), SUBPATHS, en, fa, DataDeletion(), Locale, PageId, PAGES (+1 more)

### Community 3 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, skipLibCheck (+4 more)

### Community 4 - "web/"
Cohesion: 0.33
Nodes (5): Commands, graphify, How it renders, Rules (Meta App Review depends on these), web/

### Community 5 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, build:client, build:server, dev

### Community 6 - "entry-server.tsx"
Cohesion: 0.70
Nodes (4): App(), render(), dirFor(), matchRoute()

## Knowledge Gaps
- **35 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+30 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `scripts` connect `scripts` to `devDependencies`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _35 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._