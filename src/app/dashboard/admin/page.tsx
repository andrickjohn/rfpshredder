// src/app/dashboard/admin/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SamScraperClient } from './sam-scraper-client';

export const metadata = {
    title: 'Admin Dashboard - RFP Shredder',
};

export default async function AdminDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.email !== 'admin@automatemomentum.com') {
        redirect('/dashboard');
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-[#1B365D]">Admin Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Super user tools.
                </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">SAM.gov RFP Sample Finder</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Searches active small business IT / Software / Construction opportunities for PDFs containing &apos;Section L&apos; or &apos;Section M&apos;.
                    </p>
                </div>
                <div className="p-6">
                    <SamScraperClient />
                </div>
            </div>
        </div>
    );
}
