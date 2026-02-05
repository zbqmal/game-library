import { render, waitFor, cleanup } from "@testing-library/react";
import Home from "../page";

describe("Home page visit tracking", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ visits: 0 }),
    } as Response);

    Object.defineProperty(globalThis, "fetch", {
      value: fetchMock,
      writable: true,
    });
    jest.spyOn(Date, "now").mockReturnValue(1000);
  });

  afterEach(() => {
    cleanup();
    Object.defineProperty(globalThis, "fetch", {
      value: undefined,
      writable: true,
    });
    jest.restoreAllMocks();
  });

  it("tracks a visit only once for rapid remounts", async () => {
    const { unmount } = render(<Home />);

    const getTrackCalls = () =>
      fetchMock.mock.calls.filter(
        ([url]) => url === "/api/analytics/track-visit",
      );

    await waitFor(() => expect(getTrackCalls()).toHaveLength(1));

    unmount();
    render(<Home />);

    await waitFor(() => expect(getTrackCalls()).toHaveLength(1));
  });
});
