import { render, screen, waitFor } from "@testing-library/react";
import VisitCounter from "../VisitCounter";

jest.mock("@/app/lib/utils", () => ({
  ...jest.requireActual("@/app/lib/utils"),
  getCurrentDateEST: () => "2026-02-04",
}));

describe("VisitCounter", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ visits: 123 }),
    } as Response);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders visits with today's date", async () => {
    render(<VisitCounter page="home" />);

    expect(screen.getByText("Loading visits...")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText("123 visits for today (2026-02-04)"),
      ).toBeInTheDocument();
    });
  });
});
