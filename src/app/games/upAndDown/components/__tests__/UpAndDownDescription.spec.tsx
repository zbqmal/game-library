import { render, screen } from "@testing-library/react";
import { UpAndDownDescription } from "../UpAndDownDescription";

describe("UpAndDownDescription", () => {
  it("renders the description", () => {
    render(<UpAndDownDescription />);

    expect(
      screen.getByText("A random number between 1 and 100 will be given.")
    ).toBeInTheDocument();
  });
});
