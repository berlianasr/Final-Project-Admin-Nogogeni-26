'use client'

import { useState } from 'react'
import { login } from '@/modules/auth/login'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      alert('Email dan password harus diisi!')
      return
    }

    setIsLoading(true)

    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err) {
      alert('Login gagal: Periksa kembali email dan password Anda')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-[#800020]/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#800020] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#800020]/30">
            <span className="text-3xl text-white">📋</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Nogogeni Surat</h1>
          <p className="text-gray-400 text-sm mt-1">Login to access administration panel</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Login Admin</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="admin@nogogeni.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#800020] focus:border-transparent outline-none text-gray-800 bg-gray-50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#800020] focus:border-transparent outline-none text-gray-800 bg-gray-50 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 shadow-md
                ${isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#800020] hover:bg-[#5c0015] hover:shadow-lg hover:shadow-[#800020]/25 active:scale-[0.98]'
                }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading...
                </span>
              ) : 'Login'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          &copy; {new Date().getFullYear()} Nogogeni ITS Team
        </p>
      </div>
    </div>
  )
}