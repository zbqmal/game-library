import Header from "./components/Header";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            Enjoy a collection of fun mini-games and challenge yourself to beat other players&apos; scores!
          </p>
        </div>

        {/* Placeholder for Game Grid - Coming in Phase 2 */}
        <div className="text-center py-20">
          <div className="inline-block bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border-2 border-dashed border-gray-300 dark:border-gray-600">
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
              🎯 Games Coming Soon!
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-sm">
              Game grid and search will be added in the next phase
            </p>
          </div>
        </div>
      </main>

      <footer className="mt-auto py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>© 2026 Game Library. Built with Next.js</p>
      </footer>
    </div>
  );
}
