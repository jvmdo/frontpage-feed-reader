import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentSession } from "@/lib/session";
import { getCategories } from "@/services/category/get-categories";
import { createMockCategory, createMockUser } from "@/tests/factories";
import { GET } from "./route";

vi.mock("@/lib/session");
vi.mock("@/services/category/get-categories");

describe("GET /api/categories", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns unauthorized error (401) if session is missing", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

    const res = await GET();
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json).toEqual({
      error: "You must be signed in to fetch categories.",
    });
  });

  it("returns success and list of categories when query succeeds", async () => {
    const mockUser = createMockUser({ id: "user-123" });
    const mockCategories = [createMockCategory(), createMockCategory()];

    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);
    vi.mocked(getCategories).mockResolvedValueOnce(mockCategories as any);

    const res = await GET();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual(JSON.parse(JSON.stringify(mockCategories)));

    expect(getCategories).toHaveBeenCalledWith(expect.anything(), "user-123");
  });

  it("returns internal server error (500) if getCategories fails", async () => {
    const mockUser = createMockUser({ id: "user-123" });
    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);
    vi.mocked(getCategories).mockRejectedValueOnce(new Error("Query failed"));

    const res = await GET();
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json).toEqual({
      error: "Failed to fetch categories",
    });
  });
});
