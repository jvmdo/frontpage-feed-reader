import { SyncScheduleNotFoundError } from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import { getRefreshTaskStatus } from "@/services/system/get-refresh-task-status";
import { createMockUser } from "@/tests/factories";
import { GET } from "./route";

vi.mock("@/services/system/get-refresh-task-status", () => ({
  getRefreshTaskStatus: vi.fn(),
}));
vi.mock("@/lib/session");

describe("GET /api/refresh-task-status", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Silence console.error for clean test output
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns unauthorized error (401) if session is missing", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);

    const json = await response.json();
    expect(json).toEqual({
      success: false,
      error: "You must be signed in to view sync status.",
      code: "UNAUTHORIZED",
    });
  });

  it("returns 200 and the payload when getRefreshTaskStatus succeeds", async () => {
    const mockUser = createMockUser({ id: "user-123" });
    const mockPayload = {
      active: true,
      isFailing: false,
      lastRunAt: "2026-01-01T12:00:00.000Z",
      nextRunAt: "2026-01-01T13:00:00.000Z",
    };

    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);
    vi.mocked(getRefreshTaskStatus).mockResolvedValueOnce(mockPayload);

    const response = await GET();

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toEqual({ success: true, data: mockPayload });
  });

  it("returns 404 when getRefreshTaskStatus throws SyncScheduleNotFoundError", async () => {
    const mockUser = createMockUser({ id: "user-123" });
    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);
    vi.mocked(getRefreshTaskStatus).mockRejectedValueOnce(
      new SyncScheduleNotFoundError(),
    );

    const response = await GET();

    expect(response.status).toBe(404);

    const json = await response.json();
    expect(json).toEqual({
      success: false,
      code: "NOT_FOUND",
      error: "The global sync schedule could not be found.",
    });
  });

  it("returns 500 when getRefreshTaskStatus throws an unknown error", async () => {
    const mockUser = createMockUser({ id: "user-123" });
    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);
    vi.mocked(getRefreshTaskStatus).mockRejectedValueOnce(
      new Error("Trigger.dev is down"),
    );

    const response = await GET();

    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json).toEqual({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: "Failed to fetch sync status",
    });
  });
});
