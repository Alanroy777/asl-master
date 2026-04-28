// src/app/admin/library/page.tsx
// Admin route: /admin/library
// Renders the Centralized Sign Resource Library manager.

import { getAdminStats } from '@/app/lib/actions'
import { getLibrarySigns } from '@/lib/supabase/libraryQueries'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { LibraryManagerClient } from '@/pages/admin/LibraryManager'

export const metadata = {
  title: 'Sign Resource Library – Admin Console',
  description: 'Manage the centralized ASL sign library for instructors to use in lesson building.',
}

export default async function LibraryPage() {
  const session = await auth()
  // @ts-ignore
  if (!session || session.user?.role !== 'ADMIN') {
    redirect('/admin')
  }

  // Fetch all library signs server-side for SSR
  const signs = await getLibrarySigns()

  return <LibraryManagerClient initialSigns={signs} />
}
