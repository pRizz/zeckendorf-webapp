import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Github } from "lucide-react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { initializeWorker } from "@/lib/compression";

const queryClient = new QueryClient();

// Eagerly initialize the compression worker at app startup. Late initialization causes issues with the worker not being ready when the first message is sent.
initializeWorker();

const App = (): JSX.Element => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {/* basename is set to the base URL of the app, which is used to correctly handle routing in GitHub Pages */}
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        {/* Sticky Header */}
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between px-30">
            <h1 className="text-xl font-bold text-gradient">Zeckendorf Codec</h1>
            <a
              href="https://github.com/pRizz/zeckendorf-webapp"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              aria-label="GitHub repository"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </header>
        
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
