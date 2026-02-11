'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

/**
 * @description Dynamically loads the SwaggerUI component to avoid server-side rendering issues.
 * @param {Object} props - Component props
 * @param {string} props.specUrl - The URL of the OpenAPI JSON spec (e.g., "/api/docs")
 */
// @ts-ignore
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => <p className="p-4 text-center">Loading API Documentation...</p>,
});

interface ApiDocProps {
  specUrl: string;
}

export default function ApiDoc({ specUrl }: ApiDocProps) {
  return (
    <div className="container mx-auto p-4 bg-white rounded-lg shadow-md mt-4">
      {/* @ts-ignore */}
      <SwaggerUI url={specUrl} />
    </div>
  );
}
