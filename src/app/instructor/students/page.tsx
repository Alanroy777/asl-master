
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-dynamic'

export default async function StudentsPage() {
    const session = await auth()
    const currentUserId = session?.user?.id

    if (!currentUserId) {
        return <div>Not authorized</div>
    }

    // Fetch ONLY students assigned to this instructor
    const students = await prisma.user.findMany({
        where: { 
            role: 'LEARNER',
            tutorId: currentUserId
        },
        include: {
            profile: true,
            lessonProgress: {
                where: { completed: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Students</h1>
                <p className="text-muted-foreground">Monitor learner progress and performance.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Learners</CardTitle>
                    <CardDescription>
                        A list of all registered users with the Learner role.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Level</TableHead>
                                <TableHead>Total XP</TableHead>
                                <TableHead>Lessons Completed</TableHead>
                                <TableHead>Avg. Accuracy</TableHead>
                                <TableHead>Joined</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No students found.
                                    </TableCell>
                                </TableRow>
                            )}
                            {students.map((student) => (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={student.image || ''} />
                                                <AvatarFallback>{student.name?.charAt(0) || 'U'}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span>{student.name || 'Unknown'}</span>
                                                <span className="text-xs text-muted-foreground">{student.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {student.profile?.experienceLevel || 'Beginner'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{student.profile?.totalXP || 0}</TableCell>
                                    <TableCell>{student.lessonProgress.length}</TableCell>
                                    <TableCell>
                                        {Math.round(student.profile?.averageAccuracy || 0)}%
                                    </TableCell>
                                    <TableCell>
                                        {new Date(student.createdAt).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
