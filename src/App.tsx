import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import GamePage from "./pages/GamePage";
import ShopPage from "./pages/ShopPage";
import AchievementsPage from "./pages/AchievementsPage";
import GuidePage from "./pages/GuidePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "react-error-boundary";
import { HelmetProvider } from "react-helmet-async";
import ErrorFallback from "./components/error-fallback";
import { CanonicalManager } from "./components/canonical-manager";
import { GameEngineProvider } from "./contexts/GameEngineContext";
import { useState } from "react";
import { GameEngine } from "./lib/game/GameEngine";

const queryClient = new QueryClient();

const App = () => {
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error(`Error Boundary caught an error(pathname:${location.pathname + location.search}):`, error, errorInfo);
        setTimeout(() => {
          throw error;
        }, 0);
      }}>

      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <GameEngineProvider engine={gameEngine} setEngine={setGameEngine}>
              <BrowserRouter>
                <Routes>
                  <Route element={<CanonicalManager />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/game" element={<GamePage />} />
                    <Route path="/shop" element={<ShopPage />} />
                    <Route path="/achievements" element={<AchievementsPage />} />
                    <Route path="/guide" element={<GuidePage />} />
                    <Route path="/leaderboard" element={<LeaderboardPage />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </GameEngineProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};


export default App;