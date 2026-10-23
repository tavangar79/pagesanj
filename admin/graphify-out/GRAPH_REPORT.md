# Graph Report - admin  (2026-10-23)

## Corpus Check
- 18 files · ~942 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 93 nodes · 95 edges · 11 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_App.tsx|App.tsx]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_components.json|components.json]]
- [[_COMMUNITY_package.json|package.json]]
- [[_COMMUNITY_devDependencies|devDependencies]]
- [[_COMMUNITY_dependencies|dependencies]]
- [[_COMMUNITY_tailwind|tailwind]]
- [[_COMMUNITY_admin|admin/]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 13 edges
2. `tailwind` - 6 edges
3. `aliases` - 6 edges
4. `scripts` - 4 edges
5. `admin/` - 4 edges
6. `App()` - 2 edges
7. `AppLayout()` - 2 edges
8. `Categories()` - 2 edges
9. `Jobs()` - 2 edges
10. `Login()` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (11 total, 0 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.13
Nodes (12): App(), TODO: redirect to /login when the session check fails., AppLayout(), NAV, Categories(), Jobs(), Login(), PendingReviews() (+4 more)

### Community 1 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+7 more)

### Community 2 - "components.json"
Cohesion: 0.17
Nodes (11): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+3 more)

### Community 3 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, preview, type, version

### Community 4 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, tailwindcss, @tailwindcss/vite, @types/node, @types/react, @types/react-dom, typescript, vite (+1 more)

### Community 5 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, clsx, lucide-react, react, react-dom, react-router, tailwind-merge

### Community 6 - "tailwind"
Cohesion: 0.33
Nodes (6): tailwind, baseColor, config, css, cssVariables, prefix

### Community 7 - "admin/"
Cohesion: 0.40
Nodes (4): admin/, Commands, graphify, Rules

## Knowledge Gaps
- **53 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+48 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _54 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12648221343873517 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._