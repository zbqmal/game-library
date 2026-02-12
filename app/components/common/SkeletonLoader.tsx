interface SkeletonLoaderProps {
  type: "player-list" | "game-board";
  gridSize?: number;
}

export default function SkeletonLoader({
  type,
  gridSize = 3,
}: SkeletonLoaderProps) {
  if (type === "player-list") {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-3 h-14" />
        ))}
      </div>
    );
  }

  if (type === "game-board") {
    return (
      <div
        className="grid gap-4 animate-pulse"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: gridSize * gridSize }).map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-gray-100 rounded-lg border-4 border-gray-200"
          />
        ))}
      </div>
    );
  }

  return null;
}
