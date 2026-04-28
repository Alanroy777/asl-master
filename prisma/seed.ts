
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding ...')

    // Create Level 1
    const level1 = await prisma.level.upsert({
        where: { id: 'level-1' },
        update: {},
        create: {
            id: 'level-1',
            title: 'Level 1',
            description: 'Introduction to ASL',
            orderIndex: 0,
        },
    })

    const lessonsData = [
        {
            title: 'Alphabet A-E',
            description: 'Learn the first 5 letters.',
            slug: 'lesson-1',
            xpReward: 50,
            signs: [
                { word: 'A', videoUrl: '/videos/sign-a.mp4', description: 'Fist with thumb on side.', category: 'Alphabet' },
                { word: 'B', videoUrl: '/videos/sign-b.mp4', description: 'Open palm, thumb tucked.', category: 'Alphabet' },
                { word: 'C', videoUrl: '/videos/sign-c.mp4', description: 'C shape with hand.', category: 'Alphabet' },
                { word: 'D', videoUrl: '/videos/sign-d.mp4', description: 'Index finger up.', category: 'Alphabet' },
                { word: 'E', videoUrl: '/videos/sign-e.mp4', description: 'Curled fingers.', category: 'Alphabet' },
            ]
        },
        {
            title: 'Basic Greetings',
            description: 'Hello, Goodbye, and more.',
            slug: 'lesson-2',
            xpReward: 60,
            signs: [
                { word: 'Hello', videoUrl: '/videos/hello.mp4', description: 'Salute from forehead.', category: 'Greetings' },
                { word: 'Goodbye', videoUrl: '/videos/goodbye.mp4', description: 'Wave hand.', category: 'Greetings' },
                { word: 'Yes', videoUrl: '/videos/yes.mp4', description: 'Nod fist.', category: 'Basics' },
                { word: 'No', videoUrl: '/videos/no.mp4', description: 'Tap fingers.', category: 'Basics' },
                { word: 'Please', videoUrl: '/videos/please.mp4', description: 'Rub chest.', category: 'Basics' },
            ]
        },
    ]

    // Fill up to 10 lessons
    for (let i = 3; i <= 10; i++) {
        lessonsData.push({
            title: `Lesson ${i}: Vocabulary`,
            description: `More signs for daily use.`,
            slug: `lesson-${i}`,
            xpReward: 50 + (i * 5),
            signs: [
                { word: `Sign ${i}A`, videoUrl: '', description: 'Placeholder sign.', category: 'Vocabulary' },
                { word: `Sign ${i}B`, videoUrl: '', description: 'Placeholder sign.', category: 'Vocabulary' },
                { word: `Sign ${i}C`, videoUrl: '', description: 'Placeholder sign.', category: 'Vocabulary' },
            ]
        })
    }

    for (const [index, lesson] of lessonsData.entries()) {
        const l = await prisma.lesson.upsert({
            where: { slug: lesson.slug },
            update: {},
            create: {
                title: lesson.title,
                description: lesson.description,
                slug: lesson.slug,
                levelId: level1.id,
                orderIndex: index,
                xpReward: lesson.xpReward,
                isLockedDefault: index > 0, // Unlock first lesson by default
                signs: {
                    create: lesson.signs.map((s: any, sIndex) => ({
                        word: s.word,
                        videoUrl: s.videoUrl,
                        description: s.description,
                        orderIndex: sIndex,
                        category: s.category
                    }))
                }
            },
        })
        console.log(`Created lesson with id: ${l.id}`)

        // Create/Update Quiz for the lesson
        const quizTitle = `${lesson.title} Quiz`;

        const existingQuiz = await prisma.quiz.findUnique({ where: { lessonId: l.id } })
        if (existingQuiz) {
            await prisma.quizQuestion.deleteMany({ where: { quizId: existingQuiz.id } })
            await prisma.quiz.delete({ where: { id: existingQuiz.id } })
        }

        await prisma.quiz.create({
            data: {
                title: quizTitle,
                lessonId: l.id,
                questions: {
                    create: [
                        {
                            type: 'MULTIPLE_CHOICE',
                            text: `What is the sign for "${lesson.signs[0]?.word || 'Concept'}"?`,
                            orderIndex: 0,
                            answers: {
                                create: [
                                    { text: lesson.signs[0]?.word || 'Choice A', isCorrect: true, orderIndex: 0 },
                                    { text: 'Incorrect Sign 1', isCorrect: false, orderIndex: 1 },
                                    { text: 'Incorrect Sign 2', isCorrect: false, orderIndex: 2 },
                                ]
                            }
                        },
                        {
                            type: 'REVERSE_RECOGNITION',
                            text: 'Which word matches this video?',
                            imageUrl: lesson.signs[1]?.videoUrl || '', // Placeholder
                            orderIndex: 1,
                            answers: {
                                create: [
                                    { text: lesson.signs[1]?.word || 'Choice B', isCorrect: true, orderIndex: 0 },
                                    { text: 'Wrong Answer', isCorrect: false, orderIndex: 1 },
                                ]
                            }
                        }
                    ]
                }
            }
        })
        console.log(`Created quiz for lesson: ${l.title}`)
    }

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
