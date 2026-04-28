import { auth } from "@/auth"
import { getLessonData, getLevelLessons, getLevels } from "@/app/lib/actions"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { CheckCircle, PlayCircle, Lock, ChevronLeft } from "lucide-react"
import { ClientBackButton } from "@/components/client-back-button"

const LESSON_ICONS = ["🔍", "👐", "📝", "🖼️", "🧩", "💡", "🎯", "🌿", "🎤", "⭐"]
const UNIT_COLORS = [
  { gradient: "from-amber-400 to-orange-400", badge: "bg-amber-500", bar: "#f59e0b", light: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-300" },
  { gradient: "from-sky-400 to-blue-500", badge: "bg-sky-500", bar: "#0ea5e9", light: "bg-sky-50 dark:bg-sky-950/30", border: "border-sky-300" },
  { gradient: "from-emerald-400 to-green-500", badge: "bg-emerald-500", bar: "#10b981", light: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-300" },
  { gradient: "from-violet-400 to-purple-500", badge: "bg-violet-500", bar: "#8b5cf6", light: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-300" },
  { gradient: "from-rose-400 to-pink-500", badge: "bg-rose-500", bar: "#f43f5e", light: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-300" },
  { gradient: "from-teal-400 to-cyan-500", badge: "bg-teal-500", bar: "#14b8a6", light: "bg-teal-50 dark:bg-teal-950/30", border: "border-teal-300" },
]

interface PageProps {
  params: Promise<{ unitId: string; chapterId: string }>
}

export default async function ChapterPage({ params }: PageProps) {
  const { unitId, chapterId } = await params
  const session = await auth()
  if (!session?.user?.email) redirect('/login')

  // Get unit info for styling
  const levels = await getLevels()
  const level = levels.find(l => l.id === unitId)
  if (!level) notFound()

  const unitIndex = levels.findIndex(l => l.id === unitId)
  const color = UNIT_COLORS[unitIndex % UNIT_COLORS.length]

  // Get chapter (lesson) data
  const chapter = await getLessonData(chapterId)
  if (!chapter) notFound()

  // Get all chapters in this unit for the chapter index
  const allChapters = await getLevelLessons(unitId)
  const chapterIndex = allChapters.findIndex(c => c.id === chapterId)

  // Check if this chapter is locked
  const chapterStatus = allChapters.find(c => c.id === chapterId)
  if (chapterStatus?.isLocked) redirect(`/learn/unit/${unitId}`)

  // The "lessons" inside a chapter = each sign in the chapter
  const signs = chapter.signs || []
  const isChapterCompleted = chapter.isCompleted

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-0 pb-20">
      {/* Chapter Header Banner */}
      <div className={`relative bg-gradient-to-r ${color.gradient} -mx-4 sm:-mx-6 md:rounded-2xl md:mx-0 md:mt-4 mb-6 overflow-hidden`}>
        <div className="px-6 py-6">
          <ClientBackButton 
            fallbackPath={`/learn/unit/${unitId}`}
            variant="link"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium mb-4 transition-colors p-0 h-auto"
            size="default"
          >
            <ChevronLeft className="h-4 w-4" />
            {level.title}
          </ClientBackButton>

          <div className="text-center pb-2">
            <span className="text-[10px] font-extrabold tracking-widest px-3 py-1 rounded-full bg-white/20 text-white">
              CHAPTER {chapterIndex + 1}
            </span>
            <h1 className="text-2xl font-extrabold text-white mt-3 leading-tight">{chapter.title}</h1>
            {chapter.description && (
              <p className="text-white/75 text-sm mt-1">{chapter.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Lessons Timeline */}
      <div className="px-4">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[30px] top-4 bottom-4 w-0.5 bg-border z-0" />

          <div className="flex flex-col gap-4 relative z-10">
            {signs.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <div className="text-4xl mb-3">📭</div>
                <p>No signs added to this chapter yet.</p>
              </div>
            ) : (
              signs.map((sign: any, index: number) => {
                const icon = LESSON_ICONS[index % LESSON_ICONS.length]

                return (
                  <div key={sign.id} className="flex gap-4 items-center">
                    {/* Timeline icon circle */}
                    <div className={`shrink-0 flex h-[60px] w-[60px] items-center justify-center rounded-full border-2 z-10 text-xl bg-background`}
                      style={{ borderColor: color.bar + '80' }}
                    >
                      {icon}
                    </div>

                    {/* Lesson card — clicking goes to the lesson player */}
                    <Link href={`/learn/${chapter.slug}`} className="flex-1">
                      <div className={`flex items-center justify-between rounded-xl border bg-card px-5 py-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer border-border`}>
                        <div>
                          <h2 className="text-base font-bold text-foreground">
                            Sign {index + 1}: {sign.word}
                          </h2>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {sign.description || sign.category || "Learn this sign"}
                          </p>
                        </div>
                        <div className="shrink-0 ml-4">
                          {isChapterCompleted ? (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground">
                              <CheckCircle className="h-5 w-5 text-background" />
                            </div>
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2"
                              style={{ borderColor: color.bar }}>
                              <PlayCircle className="h-5 w-5" style={{ color: color.bar }} />
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Review / Start Chapter Button */}
      {signs.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-background/80 backdrop-blur-md border-t border-border">
          <div className="max-w-2xl mx-auto">
            <Link href={`/learn/${chapter.slug}`}>
              <button className={`w-full py-4 rounded-2xl font-extrabold text-white text-base tracking-wide bg-gradient-to-r ${color.gradient} hover:opacity-90 transition-opacity shadow-lg`}>
                {isChapterCompleted ? "Review Chapter" : "Start Chapter"}
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
