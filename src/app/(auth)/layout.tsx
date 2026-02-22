// src/app/(auth)/layout.tsx
// Purpose: Centered auth layout for login, signup, forgot-password
// Dependencies: none

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1B365D]">RFP Shredder</h1>
          <p className="text-sm text-gray-500 mt-1">
            AI-powered compliance matrix generator
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-8">{children}</div>
      </div>
    </div>
  );
}
