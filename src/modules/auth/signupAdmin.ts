import { supabase } from '@/lib/supabaseClient'

export async function signupAdmin({
  email,
  password,
  nickname
}: {
  email: string
  password: string
  nickname: string
}) {

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nickname
      }
    }
  })

  if (error) throw error

  return data
}


// MANUAL INPUT ADMIN

signupAdmin({
  email: 'testing@gmail.com', // Ganti dengan email admin yang kamu mau
  password: 'password123',   // Ganti dengan password yang aman
  nickname: 'Super Adm'
})
.then((data) => {
  console.log('✅ Berhasil mendaftarkan admin:', data.user?.email);
})
.catch((err) => {
  console.error('❌ Gagal mendaftarkan admin:', err.message);
});