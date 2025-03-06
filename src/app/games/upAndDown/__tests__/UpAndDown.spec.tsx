import { render, screen } from "@testing-library/react";
import UpAndDown from "../page";

describe("Up And Down", () => {
  it("renders mock header", () => {
    render(<UpAndDown />);
    expect(screen.getByText("UpAndDown"));
  });
});
