
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { X, Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Props interface for the AuthModal component
interface AuthModalProps {
  isOpen: boolean;          // Controls visibility of the modal
  onClose: () => void;      // Callback function to close the modal
}

// Zod schema for login form validation
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Zod schema for registration form validation with more stringent requirements
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Must be a valid email").optional().or(z.literal("")), // Optional email field
});

// Type definitions inferred from the Zod schemas
type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  // State to toggle between login and registration views
  const [isLoginView, setIsLoginView] = useState(true);
  
  // Custom hook providing authentication-related mutations
  const { loginMutation, registerMutation } = useAuth();
  
  // Initialize login form with React Hook Form and Zod validation
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Initialize registration form with React Hook Form and Zod validation
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
    },
  });
  
  // Handler for login form submission
  const handleLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values, {
      onSuccess: () => {
        onClose(); // Close modal on successful login
      },
    });
  };
  
  // Handler for registration form submission
  const handleRegisterSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(values, {
      onSuccess: () => {
        onClose(); // Close modal on successful registration
      },
    });
  };

  return (
    // Dialog component from shadcn/ui for modal functionality
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isLoginView ? "Sign In" : "Create Account"}</DialogTitle>
          <DialogDescription>
            {isLoginView 
              ? "Sign in to share your memories of Chris" 
              : "Create an account to share your memories of Chris"
            }
          </DialogDescription>
        </DialogHeader>
        
        {/* Conditional rendering based on view type (login/register) */}
        {isLoginView ? (
          // Login Form
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
              {/* Username field */}
              <FormField
                control={loginForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Enter your username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Password field */}
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Submit button with loading state */}
              <Button
                type="submit"
                className="w-full bg-primary text-white"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
              
              {/* Toggle to registration view */}
              <div className="text-center mt-4">
                <p className="text-sm">
                  Don't have an account?{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-primary"
                    onClick={() => setIsLoginView(false)}
                  >
                    Create one
                  </Button>
                </p>
              </div>
            </form>
          </Form>
        ) : (
          // Registration Form
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-4">
              {/* Username field */}
              <FormField
                control={registerForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Choose a username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Full Name field */}
              <FormField
                control={registerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        type="text" placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Optional Email field */}
              <FormField
                control={registerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Password field */}
              <FormField
                control={registerForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Create a password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Submit button with loading state */}
              <Button
                type="submit"
                className="w-full bg-primary text-white"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
              
              {/* Toggle to login view */}
              <div className="text-center mt-4">
                <p className="text-sm">
                  Already have an account?{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-primary"
                    onClick={() => setIsLoginView(true)}
                  >
                    Sign in
                  </Button>
                </p>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
