import { getDictionaryCategories } from "@/app/lib/actions"
import DictionarySearch from "@/components/dictionary-search"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function DictionaryPage() {
    const session = await auth()
    if (!session?.user?.email) redirect('/login')

    const categories = await getDictionaryCategories()

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-8">
            <div className="mb-2">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Dashboard
                </Link>
            </div>
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">ASL Dictionary</h1>
                <p className="text-muted-foreground">
                    Search and explore the complete library of signs. Filter by category or difficulty to find exactly what you need.
                </p>
            </div>

            <DictionarySearch initialCategories={categories} />
        </div>
    )
}
