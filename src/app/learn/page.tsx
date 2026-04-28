import { auth } from "@/auth"
import { getLevels } from "@/app/lib/actions"
import { redirect } from "next/navigation"
import Link from "next/link"

const UNIT_EMOJIS = ["👋", "☕", "👤", "🏠", "🍎", "🎓", "💬", "🌟", "🤝", "📚"]
const UNIT_COLORS = [
  "from-amber-400 to-orange-400",
  "from-sky-400 to-blue-500",
  "from-emerald-400 to-green-500",
  "from-violet-400 to-purple-500",
  "from-rose-400 to-pink-500",
  "from-teal-400 to-cyan-500",
]

export default async function LearnPage() {
  const session = await auth()
  if (!session?.user?.email) redirect('/login')

  const levels = await getLevels()

  if (levels.length === 0) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-6 text-center py-24">
        <div className="text-6xl mb-2">📚</div>
        <h1 className="text-2xl font-bold">No Units Available</h1>
        <p className="text-muted-foreground">The instructor hasn't added any content yet. Check back soon!</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4 py-8 px-4">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Learn ASL</h1>
        <p className="text-muted-foreground mt-1">Choose a unit to start learning</p>
      </div>

      <div className="flex flex-col gap-4">
        {levels.map((level, index) => {
          const totalChapters = level.lessons.length
          const emoji = UNIT_EMOJIS[index % UNIT_EMOJIS.length]
          const colorClass = UNIT_COLORS[index % UNIT_COLORS.length]

          return (
            <Link key={level.id} href={`/learn/unit/${level.id}`}>
              <div className="group relative rounded-2xl border border-border bg-card hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden cursor-pointer">
                {/* Top color accent */}
                <div className={`h-1 w-full bg-gradient-to-r ${colorClass}`} />

                <div className="flex items-center justify-between px-6 py-5 gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Unit badge */}
                    <div className="inline-flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-extrabold tracking-widest px-2.5 py-1 rounded bg-gradient-to-r ${colorClass} text-white`}>
                        UNIT {index + 1}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold leading-tight text-foreground">{level.title}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {totalChapters} {totalChapters === 1 ? "chapter" : "chapters"}
                    </p>
                    {level.description && (
                      <p className="text-xs text-muted-foreground/70 mt-1 truncate">{level.description}</p>
                    )}
                  </div>

                  {/* Emoji circle */}
                  <div className={`relative shrink-0 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${colorClass} bg-opacity-10 text-3xl border-2 border-border group-hover:scale-105 transition-transform`}>
                    <div className="absolute inset-0 rounded-full bg-muted opacity-30" />
                    <span className="relative z-10">{emoji}</span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
