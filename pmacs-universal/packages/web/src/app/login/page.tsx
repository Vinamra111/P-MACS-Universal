'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type RoleType = 'Nurse' | 'Pharmacist' | 'Master' | null;

export default function LoginPage() {
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleType>(null);
  const { user, login } = useAuth();
  const router = useRouter();

  // Demo mode: only show credentials in development
  const DEMO_MODE = process.env.NODE_ENV === 'development' &&
                    process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const redirectPath =
        user.role === 'Master' ? '/admin' :
        user.role === 'Pharmacist' ? '/pharmacist' :
        '/nurse';
      router.push(redirectPath);
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!empId.trim()) {
      setError('Please enter your Employee ID');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsSubmitting(true);

    const result = await login(empId.toUpperCase(), password);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  const quickLogin = (id: string, pwd: string, role: RoleType) => {
    setEmpId(id);
    setPassword(pwd);
    setSelectedRole(role);
    setError(''); // Clear any previous errors
  };

  // Get logo gradient based on selected role
  const getLogoGradient = () => {
    switch (selectedRole) {
      case 'Nurse':
        return 'from-violet-600 to-violet-700';
      case 'Pharmacist':
        return 'from-cyan-600 to-cyan-700';
      case 'Master':
        return 'from-orange-600 to-orange-700';
      default:
        return 'from-blue-600 to-cyan-600';
    }
  };

  // Get button gradient based on selected role
  const getButtonGradient = () => {
    switch (selectedRole) {
      case 'Nurse':
        return 'from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800';
      case 'Pharmacist':
        return 'from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800';
      case 'Master':
        return 'from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800';
      default:
        return 'from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700';
    }
  };

  // Get focus ring color based on selected role
  const getFocusRing = () => {
    switch (selectedRole) {
      case 'Nurse':
        return 'focus:ring-violet-500';
      case 'Pharmacist':
        return 'focus:ring-cyan-500';
      case 'Master':
        return 'focus:ring-orange-500';
      default:
        return 'focus:ring-blue-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <div className="grid lg:grid-cols-5 gap-8 items-center">
          {/* Left Side - Branding & Info */}
          <div className="lg:col-span-2 text-center lg:text-left space-y-6">
            {/* Logo */}
            <div className="flex justify-center lg:justify-start">
              <div className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${getLogoGradient()} flex items-center justify-center shadow-2xl transition-all duration-500`}>
                <Package className="h-11 w-11 text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
                P-MACS
              </h1>
              <p className="text-lg text-gray-600 font-medium">
                Pharmacy - Management and Control System
              </p>
            </div>

            {/* Features */}
            <div className="hidden lg:block space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Real-time Inventory Management</p>
                  <p className="text-xs text-gray-600">Track stock levels, expiry dates, and locations</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-cyan-600 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">AI-Powered Analytics</p>
                  <p className="text-xs text-gray-600">Intelligent forecasting and decision support</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-violet-600 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Role-Based Access Control</p>
                  <p className="text-xs text-gray-600">Secure, personalized workflows for every role</p>
                </div>
              </div>
            </div>

            {/* Role Preview Cards */}
            <div className="hidden lg:grid grid-cols-3 gap-3 pt-2">
              <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 text-center">
                <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center mx-auto mb-2">
                  <Package className="h-4 w-4 text-white" strokeWidth={3} />
                </div>
                <p className="text-xs font-semibold text-violet-900">Nurse</p>
              </div>
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 text-center">
                <div className="h-8 w-8 rounded-lg bg-cyan-600 flex items-center justify-center mx-auto mb-2">
                  <Package className="h-4 w-4 text-white" strokeWidth={3} />
                </div>
                <p className="text-xs font-semibold text-cyan-900">Pharmacist</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                <div className="h-8 w-8 rounded-lg bg-orange-600 flex items-center justify-center mx-auto mb-2">
                  <Package className="h-4 w-4 text-white" strokeWidth={3} />
                </div>
                <p className="text-xs font-semibold text-orange-900">Master</p>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Sign In
                </h2>
                <p className="text-sm text-gray-600">
                  Enter your credentials to access your dashboard
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-fade-in">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Employee ID */}
                <div>
                  <label htmlFor="empId" className="block text-sm font-semibold text-gray-700 mb-2">
                    Employee ID
                  </label>
                  <input
                    id="empId"
                    type="text"
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value.toUpperCase())}
                    placeholder="e.g., P001, N001, M001"
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 ${getFocusRing()} focus:border-transparent outline-none transition-all uppercase text-gray-900 placeholder:text-gray-400`}
                    disabled={isSubmitting}
                    autoComplete="username"
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 ${getFocusRing()} focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400`}
                    disabled={isSubmitting}
                    autoComplete="current-password"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full bg-gradient-to-r ${getButtonGradient()} disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-500 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-none`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>

              {/* Demo Credentials - Only in Development */}
              {DEMO_MODE && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl">
                    <p className="text-xs text-yellow-900 font-bold text-center flex items-center justify-center gap-2">
                      <span className="text-base">⚠️</span>
                      DEMO MODE - Development Environment Only
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-4">
                    Quick Login Options
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Nurse */}
                    <button
                      type="button"
                      onClick={() => quickLogin('N001', 'nurse', 'Nurse')}
                      className={`group relative p-4 bg-gradient-to-br from-violet-50 to-violet-100 hover:from-violet-100 hover:to-violet-200 border-2 ${selectedRole === 'Nurse' ? 'border-violet-500 ring-4 ring-violet-200' : 'border-violet-200'} hover:border-violet-300 rounded-xl transition-all transform hover:scale-105`}
                    >
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="h-10 w-10 rounded-lg bg-violet-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                          <Package className="h-5 w-5 text-white" strokeWidth={3} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-violet-900">Nurse</p>
                          <p className="text-xs text-violet-700 font-medium">N001</p>
                        </div>
                      </div>
                    </button>

                    {/* Pharmacist */}
                    <button
                      type="button"
                      onClick={() => quickLogin('P001', 'pharma', 'Pharmacist')}
                      className={`group relative p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 border-2 ${selectedRole === 'Pharmacist' ? 'border-cyan-500 ring-4 ring-cyan-200' : 'border-cyan-200'} hover:border-cyan-300 rounded-xl transition-all transform hover:scale-105`}
                    >
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="h-10 w-10 rounded-lg bg-cyan-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                          <Package className="h-5 w-5 text-white" strokeWidth={3} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-cyan-900">Pharmacist</p>
                          <p className="text-xs text-cyan-700 font-medium">P001</p>
                        </div>
                      </div>
                    </button>

                    {/* Master */}
                    <button
                      type="button"
                      onClick={() => quickLogin('M001', 'admin', 'Master')}
                      className={`group relative p-4 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 border-2 ${selectedRole === 'Master' ? 'border-orange-500 ring-4 ring-orange-200' : 'border-orange-200'} hover:border-orange-300 rounded-xl transition-all transform hover:scale-105`}
                    >
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="h-10 w-10 rounded-lg bg-orange-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                          <Package className="h-5 w-5 text-white" strokeWidth={3} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-orange-900">Master</p>
                          <p className="text-xs text-orange-700 font-medium">M001</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-gray-500 mt-6">
              © 2025 P-MACS Universal. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
