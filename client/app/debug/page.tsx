"use client"

import dynamic from 'next/dynamic';

// Import the debug component with SSR disabled
const DebugComponent = dynamic(
  () => import('@/components/DebugComponent'),  // Fixed import path
  { ssr: false }
);

export default function DebugPage() {
  return <DebugComponent />;
}

