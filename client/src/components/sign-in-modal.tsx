import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Lock, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SignInModalProps {
  children: React.ReactNode;
}

export default function SignInModal({ children }: SignInModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate authentication process
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Demo Mode",
        description: "This is a demo version. You're already signed in and can access all features!",
      });
    }, 1000);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate registration process
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Demo Mode",
        description: "This is a demo version. Account creation is not required - you can start experimenting right away!",
      });
    }, 1000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md bg-gradient-to-b from-white to-green-50">
        <DialogHeader className="bg-gradient-to-r from-green-50 to-emerald-50 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b-2 border-green-200">
          <DialogTitle className="flex items-center gap-3 text-2xl text-green-900">
            <div className="bg-green-100 p-3 rounded-lg">
              <User className="h-6 w-6 text-green-600" />
            </div>
            Welcome to ChemLab Virtual
          </DialogTitle>
          <DialogDescription className="text-green-700 mt-2">
            Sign in to save your progress and access personalized features
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-green-100 border-2 border-green-200">
            <TabsTrigger value="signin" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Sign In</TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="space-y-4 mt-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-green-700 font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-green-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10 border-2 border-green-200 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-green-700 font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-green-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10 border-2 border-green-200 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg shadow-md shadow-green-600/30" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="text-center pt-2">
              <Button variant="link" className="text-sm text-green-600 hover:text-green-700">
                Forgot your password?
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4 mt-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-green-700 font-medium">Full Name</Label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-3 h-4 w-4 text-green-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    className="pl-10 border-2 border-green-200 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-green-700 font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-green-400" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10 border-2 border-green-200 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-green-700 font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-green-400" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    className="pl-10 border-2 border-green-200 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg shadow-md shadow-green-600/30" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        
        <div className="text-center text-sm bg-green-50 border-t-2 border-green-200 border-b-0 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
          <p className="text-green-700 font-medium">🧪 Demo Version - No registration required!</p>
          <p className="text-green-600 text-xs mt-1">Start experimenting immediately with full access to all features.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
