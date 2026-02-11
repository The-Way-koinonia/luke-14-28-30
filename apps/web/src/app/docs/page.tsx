import { Metadata } from 'next';
import ApiDoc from '@/components/swagger-ui';

export const metadata: Metadata = {
  title: 'API Reference | The Way',
  description: 'OpenAPI 3.0 Documentation for The Way backend services.',
};

/**
 * @description Public documentation page that renders the Swagger UI.
 * @returns {JSX.Element} The API reference page.
 */
export default function DocsPage() {
  return (
    <section className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white p-6">
        <h1 className="text-3xl font-bold">The Way API Reference</h1>
        <p className="opacity-80">
          Standardized backend contract for Mobile (React Native) and Web clients.
        </p>
      </div>
      <ApiDoc specUrl="/api/docs" />
    </section>
  );
}
