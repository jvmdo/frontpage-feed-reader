import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Database Migrations folder", () => {
  it("should contain the 'drizzle' folder with migrations", () => {
    const drizzlePath = path.join(process.cwd(), "drizzle");
    expect(fs.existsSync(drizzlePath)).toBe(true);

    const files = fs.readdirSync(drizzlePath);
    expect(files.some((f) => f.endsWith(".sql"))).toBe(true);
  });

  it("should contain the 'meta' folder with snapshots", () => {
    const metaPath = path.join(process.cwd(), "drizzle", "meta");
    expect(fs.existsSync(metaPath)).toBe(true);

    const files = fs.readdirSync(metaPath);
    expect(files.some((f) => f.endsWith(".json"))).toBe(true);
  });
});
