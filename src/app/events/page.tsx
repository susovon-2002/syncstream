import { Header } from "@/components/header";

export default function EventsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold mb-4">Events</h1>
        <p className="text-lg text-muted-foreground">
          Join our community for special watch parties and events.
        </p>
        <p className="mt-4">
          This is a placeholder page. You can list upcoming events, past events, and details on how to participate here.
        </p>
      </main>
    </div>
  );
}
