# Graph Report - web  (2026-10-23)

## Corpus Check
- 26 files · ~11,414 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 139 nodes · 269 edges · 9 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7d6ea73d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_App.tsx|App.tsx]]
- [[_COMMUNITY_devDependencies|devDependencies]]
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_web|web/]]
- [[_COMMUNITY_scripts|scripts]]
- [[_COMMUNITY_Home.tsx|Home.tsx]]
- [[_COMMUNITY_Design System Pagesanj (پیج‌سنج)|Design System: Pagesanj (پیج‌سنج)]]

## God Nodes (most connected - your core abstractions)
1. `Strings` - 14 edges
2. `useSite()` - 13 edges
3. `compilerOptions` - 11 edges
4. `Design System: Pagesanj (پیج‌سنج)` - 10 edges
5. `LegalPage()` - 8 edges
6. `formatNumber()` - 8 edges
7. `Locale` - 7 edges
8. `Rich()` - 6 edges
9. `scripts` - 5 edges
10. `DeletionStatus()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `DeletionStatus()` --indirect_call--> `CheckCircle()`  [INFERRED]
  web/src/pages/DeletionStatus.tsx → web/src/components/Icons.tsx
- `DeletionStatus()` --indirect_call--> `Clock()`  [INFERRED]
  web/src/pages/DeletionStatus.tsx → web/src/components/Icons.tsx
- `DeletionStatus()` --indirect_call--> `SearchX()`  [INFERRED]
  web/src/pages/DeletionStatus.tsx → web/src/components/Icons.tsx
- `LegalPage()` --calls--> `formatNumber()`  [EXTRACTED]
  web/src/components/LegalPage.tsx → web/src/site.tsx
- `LegalPage()` --calls--> `useSite()`  [EXTRACTED]
  web/src/components/LegalPage.tsx → web/src/site.tsx

## Import Cycles
- None detected.

## Communities (9 total, 0 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.27
Nodes (9): App(), PageData, dataEl, render(), startMotion(), Privacy(), Terms(), dirFor() (+1 more)

### Community 1 - "devDependencies"
Cohesion: 0.08
Nodes (23): dependencies, @fontsource-variable/geist, @fontsource-variable/geist-mono, @fontsource-variable/vazirmatn, react, react-dom, devDependencies, tailwindcss (+15 more)

### Community 2 - "index.ts"
Cohesion: 0.22
Nodes (12): LegalPage(), StatusForm(), en, fa, Block, LegalDoc, Section, Strings (+4 more)

### Community 3 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, skipLibCheck (+4 more)

### Community 4 - "web/"
Cohesion: 0.33
Nodes (5): Commands, graphify, How it renders, Rules (Meta App Review depends on these), web/

### Community 5 - "scripts"
Cohesion: 0.11
Nodes (22): Check(), Globe(), Layout(), SUBPATHS, BlockView(), Ltr(), Rich(), Words() (+14 more)

### Community 6 - "Home.tsx"
Cohesion: 0.17
Nodes (9): ArrowEnd(), CheckCircle(), ChevronBack(), Clock(), Info(), SearchX(), Send(), UserCheck() (+1 more)

### Community 8 - "Design System: Pagesanj (پیج‌سنج)"
Cohesion: 0.18
Nodes (10): 1. Visual Theme & Atmosphere, 2. Color Palette & Roles, 3. Typography Rules, 4. Hero Section, 5. Component Stylings, 6. Layout Principles, 7. Responsive Rules, 8. Motion & Interaction (+2 more)

## Knowledge Gaps
- **48 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+43 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Strings` connect `index.ts` to `App.tsx`, `scripts`, `Home.tsx`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `useSite()` connect `scripts` to `index.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _48 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.11491935483870967 - nodes in this community are weakly interconnected._