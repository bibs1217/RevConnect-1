import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/layout/DashboardNav'
import DashboardSidebar from '@/components/layout/DashboardSidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-rev-dark flex flex-col">
      <DashboardNav user={user} profile={profile} />
      <div className="flex flex-1 pt-16">
        <DashboardSidebar />
        <main className="flex-1 ml-0 lg:ml-64 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
