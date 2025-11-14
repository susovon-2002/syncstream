import { Header } from "@/components/header";

export default function SupportPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold mb-4">Support</h1>
        <p className="text-lg text-muted-foreground">
          Need help with SyncStream? You've come to the right place.
        </p>
        <p className="mt-4">
          This is a placeholder page. You can add FAQs, contact information for your support team, or a support ticket submission form here.
          For immediate assistance, please email us at susovonsantra4@gmail.com.
        </p>
      </main>
    </div>
  );
}
