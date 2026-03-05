'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AdminLLMSettingsProps {
    currentModel: string;
}

export function AdminLLMSettings({ currentModel }: AdminLLMSettingsProps) {
    const [model, setModel] = useState(currentModel);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const router = useRouter();
    const supabase = createClient();

    const models = [
        { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
        { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Stable)' },
        { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
        { value: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet (Stable)' },
        { value: 'gpt-4o', label: 'GPT-4o' },
        { value: 'gpt-4o-mini', label: 'GPT-4o-mini' },
        { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
        { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
        { value: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro (Requested)' },
    ];

    async function handleSave() {
        setIsSaving(true);
        setMessage('');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('profiles')
                .update({ preferred_llm_model: model })
                .eq('id', user.id);

            if (error) throw error;

            setMessage('Model settings updated successfully.');
            router.refresh();
        } catch (error) {
            console.error(error);
            setMessage('Failed to update model settings.');
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        LLM Model Configuration (Super Admin)
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Select the default AI model to be used during RFP extraction phases.</p>
                </div>
            </div>

            <div className="p-6">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <label htmlFor="llm_model" className="block text-sm font-medium text-gray-700 w-full md:w-auto min-w-[150px]">
                        Extraction Model
                    </label>
                    <div className="flex-1 w-full">
                        <select
                            id="llm_model"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-brand-green focus:outline-none focus:ring-brand-green sm:text-sm"
                            disabled={isSaving}
                        >
                            {models.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full md:w-auto inline-flex justify-center rounded-md border border-transparent bg-brand-green py-2 px-6 text-sm font-medium text-white shadow-sm hover:bg-brand-green-dark focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                </div>

                {message && (
                    <p className={`mt-4 text-sm \${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}
