
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/services/userService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Lock, User, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/user/ThemeToggle';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
      toast({
        title: "Login Error",
        description: "Please enter a username",
        variant: "destructive"
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: "Login Error",
        description: "Please enter a password",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const success = userService.login(username, password);
      
      if (success) {
        toast({
          title: "Login Successful",
          description: `Welcome, ${username}!`,
        });
        navigate('/');
      } else {
        toast({
          title: "Login Error",
          description: "Invalid username or password",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    }, 800);
  };

  const resetUserDatabase = () => {
    userService.resetToDefaults();
    toast({
      title: "Database Reset",
      description: "User database has been reset to defaults",
    });
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
              <p className="text-xs text-muted-foreground px-1">
                Default credentials: "admin" / "123456" (administrator) or "user" / "123456" (standard user)
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
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
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 self-center"
              onClick={resetUserDatabase}
            >
              <RefreshCw className="h-3 w-3" />
              <span>Reset User Database</span>
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <div className="mt-8 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} VM Captain. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Login;
