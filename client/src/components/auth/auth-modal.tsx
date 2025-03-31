import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Props interface
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Separate schemas
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Must be a valid email").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLoginView, setIsLoginView] = useState(true);
  const { loginMutation, registerMutation } = useAuth();

  // Separate form handlers
  const LoginForm = () => {
    const form = useForm({
      resolver: zodResolver(loginSchema),
      defaultValues: { username: "", password: "" }
    });

    const onSubmit = (values: z.infer<typeof loginSchema>) => {
      loginMutation.mutate(values, {
        onSuccess: () => onClose()
      });
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Enter username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
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
        </form>
      </Form>
    );
  };

  const RegisterForm = () => {
    const form = useForm({
      resolver: zodResolver(registerSchema),
      defaultValues: {
        username: "",
        fullName: "",
        email: "",
        password: ""
      }
    });

    const onSubmit = (values: z.infer<typeof registerSchema>) => {
      registerMutation.mutate({
        username: values.username,
        name: values.fullName,
        email: values.email,
        password: values.password
      }, {
        onSuccess: () => onClose()
      });
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Choose username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Enter full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email (Optional)</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Create password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
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
        </form>
      </Form>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isLoginView ? "Sign In" : "Create Account"}</DialogTitle>
          <DialogDescription>
            {isLoginView
              ? "Sign in to share your memories of Chris"
              : "Create an account to share your memories of Chris"}
          </DialogDescription>
        </DialogHeader>

        {isLoginView ? <LoginForm /> : <RegisterForm />}

        <div className="text-center mt-4">
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto"
            onClick={() => setIsLoginView(!isLoginView)}
          >
            {isLoginView
              ? "Don't have an account? Create one"
              : "Already have an account? Sign in"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}