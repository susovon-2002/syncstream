import { Header } from "@/components/header";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold mb-4">Privacy Statement</h1>
        <div className="space-y-4">
            <p>
                This is a placeholder for your Privacy Statement. You should replace this with your own privacy policy.
                A privacy policy is a document that explains how an organization handles any customer, client or employee information gathered in its operations.
            </p>
            <h2 className="text-2xl font-bold">Information We Collect</h2>
            <p>
                [...Explain what personal data you collect, e.g., name, email, payment info, etc.]
            </p>
            <h2 className="text-2xl font-bold">How We Use Your Information</h2>
            <p>
                [...Explain how you use the collected data, e.g., to provide services, for marketing, etc.]
            </p>
            <h2 className="text-2xl font-bold">Data Sharing and Disclosure</h2>
            <p>
                [...Explain if and how you share user data with third parties.]
            </p>
        </div>
      </main>
    </div>
  );
}
