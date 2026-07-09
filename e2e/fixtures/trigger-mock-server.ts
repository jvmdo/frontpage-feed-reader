import { serve } from "bun";

const PORT = 3433;

serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/") {
      return new Response("OK", { status: 200 });
    }

    if (url.pathname.includes("/api/v1/schedules")) {
      return Response.json({
        data: [
          {
            id: "sched_123",
            task: "refresh-feeds",
            active: true,
            type: "DECLARATIVE",
            generator: {
              type: "CRON",
              expression: "* * * * *",
              description: "Every minute",
            },
            timezone: "UTC",
            environments: [
              {
                id: "env_1",
                type: "DEVELOPMENT",
                userName: "test",
                name: "development",
              },
            ],
            nextRun: new Date(Date.now() + 5 * 60000).toISOString(),
            deduplicationKey: "dedup_123",
          },
        ],
        pagination: { currentPage: 1, totalPages: 1, count: 1 },
      });
    }

    if (url.pathname.includes("/api/v1/runs")) {
      return Response.json({
        data: [
          {
            id: "run_123",
            taskIdentifier: "refresh-feeds",
            status: "COMPLETED",
            isQueued: false,
            isExecuting: false,
            isWaiting: false,
            isCompleted: true,
            isSuccess: true,
            isFailed: false,
            isCancelled: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            finishedAt: new Date().toISOString(),
            isTest: false,
            tags: [],
            costInCents: 0,
            baseCostInCents: 0,
            durationMs: 100,
            env: {
              id: "env_1",
              type: "DEVELOPMENT",
              userName: "test",
              name: "development",
            },
          },
        ],
        pagination: {
          next: "",
          previous: "",
          currentPage: 1,
          totalPages: 1,
          count: 1,
        },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Trigger Mock Server running on port ${PORT}`);
