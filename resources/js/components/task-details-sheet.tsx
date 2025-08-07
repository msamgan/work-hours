import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Calendar, Flag, Info, User as UserIcon } from 'lucide-react'

type User = {
    id: number
    name: string
    email: string
}

type Project = {
    id: number
    name: string
    user_id: number
}

type Tag = {
    id: number
    name: string
    color: string
}

type Task = {
    id: number
    project_id: number
    title: string
    description: string | null
    status: 'pending' | 'in_progress' | 'completed'
    priority: 'low' | 'medium' | 'high'
    due_date: string | null
    project: Project
    assignees: User[]
    tags?: Tag[]
    created_at?: string
}

type TaskDetailsSheetProps = {
    task: Task | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function TaskDetailsSheet({ task, open, onOpenChange }: TaskDetailsSheetProps) {
    if (!task) return null

    const getPriorityBadge = (priority: Task['priority']) => {
        switch (priority) {
            case 'high':
                return (
                    <Badge variant="destructive" className="capitalize">
                        {priority}
                    </Badge>
                )
            case 'medium':
                return (
                    <Badge variant="default" className="capitalize">
                        {priority}
                    </Badge>
                )
            case 'low':
                return (
                    <Badge variant="outline" className="capitalize">
                        {priority}
                    </Badge>
                )
        }
    }

    const getStatusBadge = (status: Task['status']) => {
        switch (status) {
            case 'completed':
                return (
                    <Badge variant="success" className="capitalize">
                        {status.replace('_', ' ')}
                    </Badge>
                )
            case 'in_progress':
                return (
                    <Badge variant="warning" className="capitalize">
                        {status.replace('_', ' ')}
                    </Badge>
                )
            case 'pending':
                return (
                    <Badge variant="secondary" className="capitalize">
                        {status.replace('_', ' ')}
                    </Badge>
                )
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="overflow-y-auto bg-background shadow-2xl sm:max-w-md md:max-w-lg">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        Task Details
                    </SheetTitle>
                    <SheetDescription>Viewing complete information for this task</SheetDescription>
                </SheetHeader>

                <div className="space-y-8">
                    {/* Basic Information */}
                    <div className="space-y-2">
                        <h3 className="ml-4 flex items-center gap-2 text-lg font-semibold text-primary">
                            <Info className="h-5 w-5 text-primary" /> Basic Information
                        </h3>
                        <div className="grid grid-cols-1 gap-4 rounded-lg border bg-muted/40 p-4">
                            <div>
                                <p className="text-sm font-bold text-muted-foreground">Title</p>
                                <p className="text-base">{task.title}</p>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-muted-foreground">Project</p>
                                <p className="text-base">{task.project.name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Flag className="text-warning h-4 w-4" />
                                <p className="text-sm font-bold text-muted-foreground">Status</p>
                                <span className="ml-2">{getStatusBadge(task.status)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Flag className="h-4 w-4 text-primary" />
                                <p className="text-sm font-bold text-muted-foreground">Priority</p>
                                <span className="ml-2">{getPriorityBadge(task.priority)}</span>
                            </div>
                            {task.due_date && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-sm font-bold text-muted-foreground">Due Date</p>
                                    <span className="ml-2">{new Date(task.due_date).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {task.description && (
                        <div className="space-y-2">
                            <h3 className="ml-4 flex items-center gap-2 text-lg font-semibold text-primary">
                                <Info className="h-5 w-5 text-primary" /> Description
                            </h3>
                            <div className="grid grid-cols-1 gap-4 rounded-lg border bg-muted/40 p-4">
                                <div>
                                    <p className="text-base whitespace-pre-wrap">{task.description}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Assignees */}
                    {task.assignees && task.assignees.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="ml-4 flex items-center gap-2 text-lg font-semibold text-primary">
                                <UserIcon className="h-5 w-5 text-primary" /> Assignees
                            </h3>
                            <div className="grid grid-cols-1 gap-4 rounded-lg border bg-muted/40 p-4">
                                <div className="flex flex-wrap gap-3">
                                    {task.assignees.map((assignee) => (
                                        <span
                                            key={assignee.id}
                                            className="flex items-center gap-2 rounded-full border bg-background px-3 py-1 shadow-sm"
                                        >
                                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary font-bold text-white">
                                                {assignee.name
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')
                                                    .toUpperCase()}
                                            </span>
                                            <span className="text-sm">{assignee.name}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="ml-4 flex items-center gap-2 text-lg font-semibold text-primary">
                                <Info className="h-5 w-5 text-primary" /> Tags
                            </h3>
                            <div className="grid grid-cols-1 gap-4 rounded-lg border bg-muted/40 p-4">
                                <div className="flex flex-wrap gap-2">
                                    {task.tags.map((tag) => (
                                        <Badge key={tag.id} style={{ backgroundColor: tag.color, color: '#fff' }}>
                                            {tag.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
