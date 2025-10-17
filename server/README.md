trove-backend/
├─ src/
│ ├─ api/ # Express routes
│ │ ├─ queue.ts
│ │ ├─ categories.ts
│ │ └─ health.ts
│ ├─ jobs/
│ │ ├─ processQueue.ts # BullMQ worker (transcript → Gemini)
│ │ └─ purgeOldData.ts # daily 30‑day cleanup
│ ├─ lib/
│ │ ├─ db.ts # Prisma client + Supabase DSN
│ │ └─ redis.ts # BullMQ connection helper
│ └─ server.ts # Express app bootstrap
├─ prisma/
│ └─ schema.prisma # DB schema + migrations
├─ Dockerfile
├─ .dockerignore
├─ package.json
├─ tsconfig.json
└─ .github/
└─ workflows/
└─ ci.yml # GitHub Actions CI/CD
