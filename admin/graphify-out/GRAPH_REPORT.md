# Graph Report - admin  (2026-10-23)

## Corpus Check
- 41 files · ~15,422 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 305 nodes · 883 edges · 10 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7d6ea73d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_App.tsx|App.tsx]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_components.json|components.json]]
- [[_COMMUNITY_package.json|package.json]]
- [[_COMMUNITY_devDependencies|devDependencies]]
- [[_COMMUNITY_dependencies|dependencies]]
- [[_COMMUNITY_admin|admin/]]
- [[_COMMUNITY_api.ts|api.ts]]
- [[_COMMUNITY_utils.ts|utils.ts]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 93 edges
2. `get()` - 21 edges
3. `useToast()` - 18 edges
4. `useAsync()` - 17 edges
5. `Button()` - 16 edges
6. `num()` - 14 edges
7. `fmtDateTime()` - 13 edges
8. `compilerOptions` - 13 edges
9. `errorMessage()` - 12 edges
10. `fmtAgo()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Ltr()` --calls--> `cn()`  [EXTRACTED]
  admin/src/components/common.tsx → admin/src/lib/utils.ts
- `NavList()` --calls--> `cn()`  [EXTRACTED]
  admin/src/components/layout/AppLayout.tsx → admin/src/lib/utils.ts
- `RenameDialog()` --calls--> `useToast()`  [EXTRACTED]
  admin/src/pages/Categories.tsx → admin/src/components/toast.tsx
- `DialogOverlay()` --calls--> `cn()`  [EXTRACTED]
  admin/src/components/ui/dialog.tsx → admin/src/lib/utils.ts
- `SelectLabel()` --calls--> `cn()`  [EXTRACTED]
  admin/src/components/ui/select.tsx → admin/src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (10 total, 0 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.13
Nodes (31): App(), AccountBox(), AppLayout(), NAV, NavList(), Toast, ToastApi, ToastContext (+23 more)

### Community 1 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+7 more)

### Community 2 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 3 - "package.json"
Cohesion: 0.07
Nodes (28): dependencies, class-variance-authority, clsx, @fontsource-variable/vazirmatn, lucide-react, radix-ui, react, react-dom (+20 more)

### Community 4 - "devDependencies"
Cohesion: 0.07
Nodes (38): Alert(), Field(), ConfirmDialog(), AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription() (+30 more)

### Community 5 - "dependencies"
Cohesion: 0.07
Nodes (38): COUNT_LABELS, dateOnly, dateTime, DIRECTION_LABELS, DIRECTION_TONE, ERROR_LABELS, faNumber, fmtDate() (+30 more)

### Community 7 - "admin/"
Cohesion: 0.40
Nodes (4): admin/, Commands, graphify, Rules

### Community 8 - "api.ts"
Cohesion: 0.08
Nodes (31): normalizeHandle(), TagInput(), Checkbox(), Textarea(), api(), ApiError, del(), patch() (+23 more)

### Community 9 - "utils.ts"
Cohesion: 0.11
Nodes (41): EmptyState(), ErrorState(), Handle(), LoadingRows(), Ltr(), PageHeader(), Pagination(), Panel() (+33 more)

## Knowledge Gaps
- **78 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+73 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `devDependencies` to `App.tsx`, `utils.ts`, `dependencies`, `api.ts`?**
  _High betweenness centrality (0.197) - this node is a cross-community bridge._
- **Why does `get()` connect `App.tsx` to `api.ts`, `utils.ts`, `dependencies`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `Button()` connect `utils.ts` to `App.tsx`, `api.ts`, `devDependencies`, `dependencies`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _78 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12857142857142856 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `components.json` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._