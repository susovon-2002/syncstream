import { Header } from "@/components/header";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold mb-4">About SyncStream</h1>
        <p className="text-lg text-muted-foreground">
          SyncStream is dedicated to bringing people together, no matter where they are.
          Our platform allows you to watch videos with friends and family in perfect synchronization.
        </p>
        <p className="mt-4">
          This is a placeholder page. You can add more information about your company, your mission, and your team here.
        </p>
      </main>
    </div>
  );
}
