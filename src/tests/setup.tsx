import "@testing-library/jest-dom";
import { vi } from "vitest";
import { server } from "@/tests/mocks/server";

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => {
    return <img src={src} alt={alt} {...props} />;
  },
}));

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
