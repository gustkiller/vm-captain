
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import VMDetail from "./pages/VMDetail";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { userService } from "./services/userService";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Auth guard component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = !!userService.getCurrentUser();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } />
          
          <Route path="/virtual-machines" element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } />
          
          <Route path="/virtual-machines/:id" element={
            <ProtectedRoute>
              <VMDetail />
            </ProtectedRoute>
          } />
          
          <Route path="/users" element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
