import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Products from "./pages/Products";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chats from "./pages/Chats";
import SharedChat from "./pages/SharedChat";
import Settings from "./pages/Settings";
import Customization from "./pages/Customization";
import NotFound from "./pages/NotFound";
import Maintenance from "./pages/Maintenance";

const queryClient = new QueryClient();

const MAINTENANCE_END = new Date("2026-05-01T00:00:00");
const isMaintenance = () => Date.now() < MAINTENANCE_END.getTime();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {isMaintenance() ? (
          <Routes>
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="*" element={<Navigate to="/maintenance" replace />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/products" element={<Products />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/chats" element={<Chats />} />
            <Route path="/s/:slug" element={<SharedChat />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/customization" element={<Customization />} />
            <Route path="/maintenance" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        )}
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
