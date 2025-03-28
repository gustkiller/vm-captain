
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import VMDetail from "./pages/VMDetail";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Users from "./pages/Users";
import UserVMAssignment from "./pages/UserVMAssignment"; 
import { userService } from "./services/userService";
import { ThemeProvider } from "./hooks/use-theme";

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

// Admin guard component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const isAdmin = userService.isAdmin();
  const isLoggedIn = !!userService.getCurrentUser();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <ThemeProvider defaultTheme="light">
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
              <AdminRoute>
                <Users />
              </AdminRoute>
            } />
            
            <Route path="/users/:id/vms" element={
              <AdminRoute>
                <UserVMAssignment />
              </AdminRoute>
            } />
            
            <Route path="/settings" element={
              <AdminRoute>
                <Index />
              </AdminRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
