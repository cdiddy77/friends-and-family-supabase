import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Protected Dashboard</h1>
      <p>Only invited users can see this.</p>
    </div>
  )
}

