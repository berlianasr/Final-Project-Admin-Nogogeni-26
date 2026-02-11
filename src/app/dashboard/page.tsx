'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const [nickname, setNickname] = useState<string>('')

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        router.push('/login')
      } else {
        const user = data.session.user
        setNickname(user.user_metadata?.nickname || user.email || 'Admin')
      }
    }

    checkUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-8">
      <div className="max-w-lg w-full bg-white shadow-xl rounded-2xl p-8 border border-gray-100 text-center">
        <div className="w-16 h-16 bg-[#800020] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md text-2xl text-white">
          👤
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {nickname}!</h1>
        <p className="text-gray-500 mb-8">You are logged in to the Nogogeni administration system.</p>

        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="bg-[#800020] text-white py-3 rounded-xl font-semibold hover:bg-[#5c0015] transition-all shadow-md hover:shadow-lg hover:shadow-[#800020]/25 active:scale-[0.98]"
          >
            Go to Main Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
