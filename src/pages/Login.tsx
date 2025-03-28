
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/services/userService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast({
        title: "Login Error",
        description: "Please enter a username",
        variant: "destructive"
      });
      return;
    }

    const success = userService.login(username);
    
    if (success) {
      toast({
        title: "Login Successful",
        description: `Welcome, ${username}!`,
      });
      navigate('/');
    } else {
      toast({
        title: "Login Error",
        description: "Invalid username. Try 'admin' or 'user'",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="mb-8 flex items-center space-x-3">
        <div className="bg-blue-600 text-white p-2 rounded">
          <Database size={36} />
        </div>
        <h1 className="text-3xl font-bold">VM Captain</h1>
      </div>
      
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Enter your username to access VM Captain
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Username (try 'admin' or 'user')"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full h-12">
              Login
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
