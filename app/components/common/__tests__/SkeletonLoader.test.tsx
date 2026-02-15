import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SkeletonLoader from "../SkeletonLoader";

describe("SkeletonLoader", () => {
  it("renders player list skeleton", () => {
    const { container } = render(<SkeletonLoader type="player-list" />);
    const skeletonItems = container.querySelectorAll(".bg-gray-100");
    expect(skeletonItems.length).toBe(4); // 4 placeholder player items
  });

  it("renders game board skeleton with default grid size", () => {
    const { container } = render(<SkeletonLoader type="game-board" />);
    const tiles = container.querySelectorAll(".aspect-square");
    expect(tiles.length).toBe(9); // 3x3 grid
  });

  it("renders game board skeleton with custom grid size", () => {
    const { container } = render(
      <SkeletonLoader type="game-board" gridSize={4} />
    );
    const tiles = container.querySelectorAll(".aspect-square");
    expect(tiles.length).toBe(16); // 4x4 grid
  });

  it("has animate-pulse class for player list", () => {
    const { container } = render(<SkeletonLoader type="player-list" />);
    const wrapper = container.querySelector(".animate-pulse");
    expect(wrapper).toBeInTheDocument();
  });

  it("has animate-pulse class for game board", () => {
    const { container } = render(<SkeletonLoader type="game-board" />);
    const wrapper = container.querySelector(".animate-pulse");
    expect(wrapper).toBeInTheDocument();
  });
});
