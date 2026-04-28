import { getAllUsers, getInstructors } from "@/app/lib/actions"
import { auth } from "@/auth"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

import { AddInstructorDialog } from "@/components/admin/add-instructor-dialog"
import { DeleteUserButton } from "@/components/admin/delete-user-button"
import { AssignTutorDialog } from "@/components/admin/assign-tutor-dialog"

export default async function AdminUsersPage() {
    const session = await auth()
    const currentUserId = session?.user?.id
    
    // We already check roles in the middleware/layout, but the action will return [] if not admin
    const allUsers = await getAllUsers()
    const instructors = await getInstructors()
    
    // Completely remove Admins from the management list
    const users = allUsers.filter(u => u.role !== 'ADMIN')

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">User Management</h1>
                    <p className="text-muted-foreground">View and manage all registered users.</p>
                </div>
                <AddInstructorDialog />
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Tutor</TableHead>
                            <TableHead>XP</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="font-medium">{user.name || "Unknown"}</div>
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                </TableCell>
                                <TableCell>
                                    {user.role === 'ADMIN' ? (
                                        <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">Admin</Badge>
                                    ) : user.role === 'INSTRUCTOR' ? (
                                        <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200">Instructor</Badge>
                                    ) : (
                                        <Badge variant="outline">Learner</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </TableCell>
                                <TableCell className="text-sm">
                                    {user.role === 'LEARNER' ? (
                                        <div className="flex items-center gap-2">
                                            {/* @ts-ignore */}
                                            {user.tutor?.name ? (
                                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                                    {/* @ts-ignore */}
                                                    {user.tutor.name}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground italic">None</span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm">
                                    {user.profile?.totalXP || 0} XP
                                </TableCell>
                                <TableCell className="text-right flex items-center justify-end gap-2">
                                    {user.role === 'LEARNER' && (
                                        <AssignTutorDialog 
                                            learnerId={user.id} 
                                            learnerName={user.name || user.email}
                                            // @ts-ignore
                                            currentTutorId={user.tutorId}
                                            instructors={instructors}
                                        />
                                    )}
                                    {user.role !== 'ADMIN' && (
                                        <DeleteUserButton 
                                            userId={user.id} 
                                            userName={user.name || user.email}
                                            disabled={user.id === currentUserId} 
                                        />
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {users.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
