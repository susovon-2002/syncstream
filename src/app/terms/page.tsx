import { Header } from "@/components/header";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold mb-4">Terms of Use</h1>
        <div className="space-y-4">
            <p>
                This is a placeholder for your Terms of Use. You should replace this with your own terms.
                Terms of use (also known as terms and conditions) are the legal agreements between a service provider and a person who wants to use that service.
            </p>
            <h2 className="text-2xl font-bold">1. Acceptance of Terms</h2>
            <p>
                By accessing or using our service, you agree to be bound by these terms. If you disagree with any part of the terms, you may not access the service.
            </p>
            <h2 className="text-2xl font-bold">2. User Accounts</h2>
            <p>
                When you create an account with us, you must provide us with information that is accurate, complete, and current at all times.
            </p>
            <h2 className="text-2xl font-bold">3. Termination</h2>
            <p>
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
        </div>
      </main>
    </div>
  );
}
