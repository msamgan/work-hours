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

type TaskMeta = {
    id?: number
    task_id: number
    source?: string | null
    source_id?: string | null
    source_number?: string | null
    source_url?: string | null
    source_state?: string | null
    extra_data?: {
        list_name?: string
        list_id?: string
        [key: string]: any
    } | null
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
    meta?: TaskMeta
    is_imported?: boolean
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

                    {/* Trello Information */}
                    {task.is_imported && task.meta && task.meta.source === 'trello' && (
                        <div className="space-y-2">
                            <h3 className="ml-4 flex items-center gap-2 text-lg font-semibold text-primary">
                                <svg className="h-5 w-5 text-[#0079BF]" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M5 3C3.89 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3H5M6 6H10V15H6V6M11 6H15V10H11V6M11 11H15V18H11V11M6 16H10V18H6V16Z" />
                                </svg>
                                Trello Information
                            </h3>
                            <div className="grid grid-cols-1 gap-4 rounded-lg border bg-muted/40 p-4">
                                {task.meta.extra_data?.list_name && (
                                    <div>
                                        <p className="text-sm font-bold text-muted-foreground">List Name</p>
                                        <Badge className="mt-1 border-[#0079BF]/30 bg-[#0079BF]/20 text-[#0079BF]">
                                            {task.meta.extra_data.list_name}
                                        </Badge>
                                    </div>
                                )}
                                {task.meta.source_url && (
                                    <div>
                                        <p className="text-sm font-bold text-muted-foreground">Trello Card</p>
                                        <a
                                            href={task.meta.source_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-1 inline-flex items-center gap-1 text-sm text-[#0079BF] hover:underline"
                                        >
                                            View in Trello
                                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
                                            </svg>
                                        </a>
                                    </div>
                                )}
                                {task.meta.source_state && (
                                    <div>
                                        <p className="text-sm font-bold text-muted-foreground">State in Trello</p>
                                        <Badge
                                            className={
                                                task.meta.source_state === 'archived'
                                                    ? 'border-amber-200 bg-amber-100 text-amber-700'
                                                    : 'border-green-200 bg-green-100 text-green-700'
                                            }
                                        >
                                            {task.meta.source_state === 'archived' ? 'Archived' : 'Active'}
                                        </Badge>
                                    </div>
                                )}
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
