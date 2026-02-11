import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://jxqnxxixajoguvbzddnp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4cW54eGl4YWpvZ3V2YnpkZG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDM3NzEsImV4cCI6MjA4NjMxOTc3MX0.xPW6vC9VXRwKUPZjaEPeAxIwWK_SKYoyhJnvvnHRF5A')

export default async function Page() {
  const { data, error } = await supabase.from('nomor_counter').select('*')
  
  if (error) {
    console.error('Koneksi Gagal:', error.message)
  } else {
    console.log('Koneksi Sukses! Data:', data)
  }

  return <div>Cek console untuk hasil koneksi.</div>
}