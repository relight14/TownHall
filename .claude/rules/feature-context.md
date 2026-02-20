# .claude/rules/feature-context.md

---

## paths: src/\*_/_.ts

Before modifying an existing feature, check if a matching folder
exists in docs/features/. If it does:

1. Read the README.md for architecture overview and shared decisions
2. If working on a specific sub-feature, read that sub-feature's doc
3. Respect any gotchas or decisions documented there

```

So if Claude is working on recurring tasks, it reads:
1. `docs/features/checklist/README.md` (index, ~30 lines)
2. `docs/features/checklist/recurring-tasks.md` (specific context)

It does **not** read `drag-and-drop-reorder.md` or `offline-sync.md`. Zero wasted tokens.

## When a sub-feature grows too complex

If a sub-feature itself becomes massive (unlikely but possible), you can nest one more level:
```

docs/features/checklist/
├── README.md
├── recurring-tasks/ ← Promoted from file to folder
│ ├── README.md ← Index for recurring-tasks
│ ├── cron-parser.md
│ └── timezone-handling.md
├── drag-and-drop-reorder.md
└── shared-checklists.md

```

But honestly, if a sub-feature doc is getting that big, it probably means it should be its own main feature folder. Keep things simple — **one level of nesting covers 95% of cases**.

## TL;DR
```

Main feature = Folder with README.md (index + shared context)
Sub-feature = Individual .md file (focused, specific)
README table = Living index that shows what exists and its status
Claude reads = Index first, then only the sub-feature it needs
