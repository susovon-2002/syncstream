import { AuthForm } from '@/components/auth/auth-form';
import { Header } from '@/components/header';

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <AuthForm />
      </main>
    </div>
  );
}
