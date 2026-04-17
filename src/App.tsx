import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/products" element={<Products />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Chat routes — with and without conversation ID */}
          <Route path="/chats" element={<Chats />} />
          <Route path="/chats/:conversationId" element={<Chats />} />

          {/* Settings routes */}
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/customization" element={<Customization />} />

          {/* Public shared conversation view */}
          <Route path="/share/:shareId" element={<SharedChat />} />

          <Route path="/maintenance" element={<Maintenance />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
