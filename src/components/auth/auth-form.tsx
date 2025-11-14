'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirebase } from '@/firebase';
import { initiateEmailSignIn, initiateEmailSignUp, initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  isNotRobot: z.boolean().refine(val => val === true, {
    message: "Please confirm you are not a robot.",
  }),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  isNotRobot: z.boolean().refine(val => val === true, {
    message: "Please confirm you are not a robot.",
  }),
});

export function AuthForm() {
  const { auth, user } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', isNotRobot: false },
  });

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '', isNotRobot: false },
  });

  const isSignUpButtonDisabled = !signUpForm.watch('isNotRobot');
  const isSignInButtonDisabled = !signInForm.watch('isNotRobot');

  function onSignUp(values: z.infer<typeof signUpSchema>) {
    initiateEmailSignUp(auth, values.email, values.password);
  }

  function onSignIn(values: z.infer<typeof signInSchema>) {
    initiateEmailSignIn(auth, values.email, values.password);
  }
  
  function onGoogleSignIn() {
    initiateGoogleSignIn(auth);
  }

  const GoogleSignInButton = () => (
    <div className="space-y-4">
        <div className="relative">
            <Separator />
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center">
            <span className="bg-card px-2 text-sm text-muted-foreground">OR</span>
            </div>
        </div>
        <Button variant="outline" className="w-full" onClick={onGoogleSignIn}>
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 256S109.8 0 244 0s244 109.8 244 256h-95.8c0-81.7-65.2-147.9-148.2-147.9-82.8 0-150.5 66.5-150.5 147.9s67.7 147.9 150.5 147.9c45.3 0 84.3-20.1 111.3-52.4h-111.3v-63.6h202.9v33.6z"></path>
            </svg>
            Sign in with Google
        </Button>
    </div>
  )

  const RobotCheckbox = ({ form }: { form: any }) => (
     <FormField
      control={form.control}
      name="isNotRobot"
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel>
              I am not a robot
            </FormLabel>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );

  return (
    <Card className="w-full max-w-md">
      <Tabs defaultValue="signin">
        <CardHeader>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
        </CardHeader>
        <TabsContent value="signin">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Enter your credentials to access your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...signInForm}>
              <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
                <FormField
                  control={signInForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="name@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signInForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <RobotCheckbox form={signInForm} />
                <Button type="submit" className="w-full" disabled={isSignInButtonDisabled}>
                  Sign In
                </Button>
              </form>
            </Form>
            <GoogleSignInButton />
          </CardContent>
        </TabsContent>
        <TabsContent value="signup">
          <CardHeader>
            <CardTitle>Create an Account</CardTitle>
            <CardDescription>Enter your email and password to get started.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...signUpForm}>
              <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
                <FormField
                  control={signUpForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="name@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signUpForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <RobotCheckbox form={signUpForm} />
                <Button type="submit" className="w-full" disabled={isSignUpButtonDisabled}>
                  Sign Up
                </Button>
              </form>
            </Form>
            <GoogleSignInButton />
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
