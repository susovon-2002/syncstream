'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
import { useEffect, useState } from 'react';
import { Separator } from '../ui/separator';
import { CaptchaChallenge } from './captcha-challenge';

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export function AuthForm() {
  const { auth, user } = useFirebase();
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: ''},
  });

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: ''},
  });

  function onSignUp(values: z.infer<typeof signUpSchema>) {
    if (isVerified) {
      initiateEmailSignUp(auth, values.email, values.password);
    }
  }

  function onSignIn(values: z.infer<typeof signInSchema>) {
    if (isVerified) {
      initiateEmailSignIn(auth, values.email, values.password);
    }
  }
  
  function onGoogleSignIn() {
    if (isVerified) {
      initiateGoogleSignIn(auth);
    }
  }

  const GoogleSignInButton = () => (
    <div className="space-y-4">
        <div className="relative">
            <Separator />
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center">
            <span className="bg-card px-2 text-sm text-muted-foreground">OR</span>
            </div>
        </div>
        <Button variant="outline" className="w-full" onClick={onGoogleSignIn} disabled={!isVerified}>
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 256S109.8 0 244 0s244 109.8 244 256h-95.8c0-81.7-65.2-147.9-148.2-147.9-82.8 0-150.5 66.5-150.5 147.9s67.7 147.9 150.5 147.9c45.3 0 84.3-20.1 111.3-52.4h-111.3v-63.6h202.9v33.6z"></path>
            </svg>
            Sign in with Google
        </Button>
    </div>
  )

  const EmailPasswordForm = ({ form, onSubmit, buttonText }: any) => (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
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
            control={form.control}
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
          <Button type="submit" className="w-full" disabled={!isVerified}>
            {buttonText}
          </Button>
        </form>
      </Form>
  )

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
            <EmailPasswordForm form={signInForm} onSubmit={onSignIn} buttonText="Sign In" />
            <GoogleSignInButton />
          </CardContent>
        </TabsContent>
        <TabsContent value="signup">
          <CardHeader>
            <CardTitle>Create an Account</CardTitle>
            <CardDescription>Enter your email and password to get started.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <EmailPasswordForm form={signUpForm} onSubmit={onSignUp} buttonText="Sign Up" />
            <GoogleSignInButton />
          </CardContent>
        </TabsContent>
         <CardContent>
            <CaptchaChallenge onVerified={setIsVerified} />
        </CardContent>
      </Tabs>
    </Card>
  );
}
