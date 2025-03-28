
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/services/userService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Lock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/user/ThemeToggle';
import { toast } from 'sonner';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = userService.getCurrentUser();
    if (currentUser) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      uiToast({
        title: "Login Error",
        description: "Please enter a username",
        variant: "destructive"
      });
      return;
    }

    if (!password.trim()) {
      uiToast({
        title: "Login Error",
        description: "Please enter a password",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await userService.login(username, password);
      
      if (success) {
        toast.success(`Welcome, ${username}!`, {
          description: "Login successful"
        });
        navigate('/');
      } else {
        uiToast({
          title: "Login Error",
          description: "Invalid username or password",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Login failed:", error);
      uiToast({
        title: "Login Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="mb-8 flex flex-col items-center">
        <div className="bg-blue-600 text-white p-3 rounded-lg mb-4">
          <Database size={40} />
        </div>
        <h1 className="text-3xl font-bold">VM Captain</h1>
        <p className="text-muted-foreground mt-2">Virtual Machine Management Platform</p>
      </div>
      
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to manage your virtual machines
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 pl-10"
                  disabled={isLoading}
                />
                <User className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
              </div>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-10"
                  disabled={isLoading}
                />
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full h-12"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-pulse">Logging in...</span>
                </>
              ) : (
                "Login"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <div className="mt-8 text-sm text-muted-foreground">
        <p>Default credentials: admin/123456 or user/123456</p>
        <p>&copy; {new Date().getFullYear()} VM Captain. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Login;
