import { games } from "../games";
import fs from "fs";
import path from "path";

describe("Game Thumbnails", () => {
  it("all games should have valid thumbnail paths", () => {
    games.forEach((game) => {
      expect(game.thumbnail).toBeTruthy();
      expect(game.thumbnail).toMatch(/^\/images\/games\/.+\.png$/);
    });
  });

  it("all thumbnail files should exist in the public directory", () => {
    const publicDir = path.join(process.cwd(), "public");
    
    games.forEach((game) => {
      const thumbnailPath = path.join(publicDir, game.thumbnail);
      const exists = fs.existsSync(thumbnailPath);
      
      expect(exists).toBe(true);
      
      // Also verify it's a proper PNG file (not a 1x1 placeholder)
      if (exists) {
        const stats = fs.statSync(thumbnailPath);
        // A proper thumbnail should be at least 1KB (1x1 placeholders are ~70 bytes)
        expect(stats.size).toBeGreaterThan(1000);
      }
    });
  });

  it("all games should have unique thumbnail paths", () => {
    const thumbnails = games.map((game) => game.thumbnail);
    const uniqueThumbnails = new Set(thumbnails);
    
    expect(thumbnails.length).toBe(uniqueThumbnails.size);
  });

  it("thumbnail files should be proper PNG images, not placeholders", () => {
    const publicDir = path.join(process.cwd(), "public");
    
    games.forEach((game) => {
      const thumbnailPath = path.join(publicDir, game.thumbnail);
      
      if (fs.existsSync(thumbnailPath)) {
        const buffer = fs.readFileSync(thumbnailPath);
        
        // Check PNG signature
        expect(buffer[0]).toBe(0x89);
        expect(buffer[1]).toBe(0x50); // 'P'
        expect(buffer[2]).toBe(0x4e); // 'N'
        expect(buffer[3]).toBe(0x47); // 'G'
        
        // Verify it's not a 1x1 pixel image by checking file size
        // 1x1 placeholders are typically around 69 bytes
        expect(buffer.length).toBeGreaterThan(1000);
      }
    });
  });
});
