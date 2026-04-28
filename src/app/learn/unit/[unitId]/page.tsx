import { auth } from "@/auth"
import { getLevelLessons, getLevels } from "@/app/lib/actions"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { CheckCircle, PlayCircle, Lock, ChevronLeft } from "lucide-react"
import { ClientBackButton } from "@/components/client-back-button"

const UNIT_COLORS = [
  { gradient: "from-amber-400 to-orange-400", badge: "bg-amber-500", bar: "#f59e0b", border: "border-amber-300" },
  { gradient: "from-sky-400 to-blue-500", badge: "bg-sky-500", bar: "#0ea5e9", border: "border-sky-300" },
  { gradient: "from-emerald-400 to-green-500", badge: "bg-emerald-500", bar: "#10b981", border: "border-emerald-300" },
  { gradient: "from-violet-400 to-purple-500", badge: "bg-violet-500", bar: "#8b5cf6", border: "border-violet-300" },
  { gradient: "from-rose-400 to-pink-500", badge: "bg-rose-500", bar: "#f43f5e", border: "border-rose-300" },
  { gradient: "from-teal-400 to-cyan-500", badge: "bg-teal-500", bar: "#14b8a6", border: "border-teal-300" },
]
const UNIT_EMOJIS = ["👋", "☕", "👤", "🏠", "🍎", "🎓", "💬", "🌟", "🤝", "📚"]

interface PageProps {
  params: Promise<{ unitId: string }>
}

export default async function UnitPage({ params }: PageProps) {
  const { unitId } = await params
  const session = await auth()
  if (!session?.user?.email) redirect('/login')

  const levels = await getLevels()
  const level = levels.find(l => l.id === unitId)
  if (!level) notFound()

  const unitIndex = levels.findIndex(l => l.id === unitId)
  const color = UNIT_COLORS[unitIndex % UNIT_COLORS.length]
  const emoji = UNIT_EMOJIS[unitIndex % UNIT_EMOJIS.length]

  const chapters = await getLevelLessons(unitId)
  const completedCount = chapters.filter(c => c.isCompleted).length
  const nextChapter = chapters.find(c => !c.isCompleted && !c.isLocked)

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-0 pb-10">
      {/* Unit Header Banner */}
      <div className={`relative bg-gradient-to-r ${color.gradient} px-6 py-6 -mx-4 sm:-mx-6 md:rounded-2xl md:mx-0 md:mt-4 mb-6`}>
        <ClientBackButton 
          fallbackPath="/learn" 
          variant="link" 
          className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium mb-4 transition-colors p-0 h-auto"
          size="default"
        >
          <ChevronLeft className="h-4 w-4" />
          All Units
        </ClientBackButton>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="text-[10px] font-extrabold tracking-widest px-2.5 py-1 rounded bg-white/20 text-white">
                UNIT {unitIndex + 1}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white leading-tight">{level.title}</h1>
            <p className="text-white/75 text-sm mt-0.5">
              {completedCount} of {chapters.length} chapters completed
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl border-2 border-white/30 shrink-0">
            {emoji}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 rounded-full bg-white/25 overflow-hidden">
          <div
            className="h-full rounded-full bg-white transition-all duration-700"
            style={{ width: `${chapters.length > 0 ? (completedCount / chapters.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Continue button */}
      {nextChapter && (
        <div className="flex justify-end px-4 mb-3">
          <Link href={`/learn/unit/${unitId}/chapter/${nextChapter.id}`}>
            <button className={`text-xs font-extrabold tracking-widest px-5 py-2 rounded-full border-2 ${color.border} text-foreground hover:bg-foreground hover:text-background transition-colors`}>
              CONTINUE
            </button>
          </Link>
        </div>
      )}

      {/* Chapters list */}
      <div className="flex flex-col gap-1 px-4">
        {/* Vertical connector line */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[30px] top-0 bottom-0 w-0.5 bg-border z-0" />

          <div className="flex flex-col gap-3 relative z-10">
            {chapters.map((chapter, index) => {
              const isCompleted = chapter.isCompleted
              const isLocked = chapter.isLocked
              const signCount = (chapter.signs?.length || 0) + (chapter.lessonSigns?.length || 0)

              return (
                <div key={chapter.id} className="flex gap-4 items-center">
                  {/* Timeline dot */}
                  <div className={`shrink-0 flex h-[60px] w-[60px] items-center justify-center rounded-full border-2 z-10 text-xl
                    ${isCompleted
                      ? `bg-foreground border-foreground`
                      : isLocked
                        ? 'bg-muted border-border'
                        : `bg-background border-2`}
                  `}
                    style={!isCompleted && !isLocked ? { borderColor: color.bar } : {}}
                  >
                    {isCompleted
                      ? <CheckCircle className="h-6 w-6 text-background" />
                      : isLocked
                        ? <Lock className="h-5 w-5 text-muted-foreground" />
                        : <PlayCircle className="h-6 w-6" style={{ color: color.bar }} />
                    }
                  </div>

                  {/* Chapter card */}
                  {isLocked ? (
                    <div className="flex-1 rounded-xl border border-border bg-card px-5 py-4 opacity-50 cursor-not-allowed">
                      <ChapterCardContent chapter={chapter} index={index} signCount={signCount} color={color} isCompleted={isCompleted} />
                    </div>
                  ) : (
                    <Link href={`/learn/unit/${unitId}/chapter/${chapter.id}`} className="flex-1">
                      <div className={`rounded-xl border bg-card px-5 py-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer
                        ${isCompleted ? 'border-border' : 'border-2'}`}
                        style={!isCompleted && !isLocked ? { borderColor: color.bar + '60' } : {}}
                      >
                        <ChapterCardContent chapter={chapter} index={index} signCount={signCount} color={color} isCompleted={isCompleted} />
                      </div>
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {chapters.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">📭</div>
            <p>No chapters in this unit yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ChapterCardContent({ chapter, index, signCount, color, isCompleted }: {
  chapter: { title: string; description?: string | null; isCompleted: boolean }
  index: number
  signCount: number
  color: typeof UNIT_COLORS[0]
  isCompleted: boolean
}) {
  const progressPct = isCompleted ? 100 : 0

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <span className={`text-[10px] font-extrabold tracking-widest px-2 py-0.5 rounded text-white ${color.badge}`}>
          CHAPTER {index + 1}
        </span>
        <h2 className="text-base font-bold mt-1.5 text-foreground leading-snug">{chapter.title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isCompleted
            ? `${signCount} of ${signCount} lessons completed`
            : `0 of ${signCount} lessons completed`}
        </p>
        {/* Progress bar */}
        <div className="mt-2.5 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, backgroundColor: color.bar }}
          />
        </div>
      </div>
    </div>
  )
}
