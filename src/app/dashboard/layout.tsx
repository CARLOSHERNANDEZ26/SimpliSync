import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | SimpliSync HR',
  description: 'View real-time company metrics, pending HR actions, and personal attendance history.',
};

export default function DashboardLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <section id="dashboard-layout-wrapper" className="h-full w-full">
      {children}
    </section>
  );
}