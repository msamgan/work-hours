import DeleteTask from '@/components/delete-task'
import TaskDetailsSheet from '@/components/task-details-sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DatePicker from '@/components/ui/date-picker'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableHeaderRow, TableRow } from '@/components/ui/table'
import MasterLayout from '@/layouts/master-layout'
import { type BreadcrumbItem, type SharedData } from '@/types'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { objectToQueryString, queryStringToObject } from '@/lib/utils'
import { tasks as _tasks } from '@actions/TaskController'
import { Head, Link, usePage } from '@inertiajs/react'
import axios from 'axios'
import {
    AlertCircle,
    Briefcase,
    Calendar,
    CalendarRange,
    ClipboardList,
    Download,
    Edit,
    Eye,
    FileText,
    Flag,
    Loader2,
    Plus,
    Search,
    X,
} from 'lucide-react'
import { ChangeEvent, forwardRef, JSX, ReactNode, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Task, TaskFilters } from './types'

interface CustomInputProps {
    value?: string
    onClick?: () => void
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void
    icon: ReactNode
    placeholder?: string
    disabled?: boolean
    required?: boolean
    autoFocus?: boolean
    tabIndex?: number
    id: string
}

const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
    ({ value, onClick, onChange, icon, placeholder, disabled, required, autoFocus, tabIndex, id }, ref) => (
        <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">{icon}</div>
            <Input
                id={id}
                ref={ref}
                value={value}
                onClick={onClick}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                autoFocus={autoFocus}
                tabIndex={tabIndex}
                className="pl-10"
                readOnly={!onChange}
            />
        </div>
    ),
)

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tasks',
        href: '/task',
    },
]

export default function Tasks() {
    const { auth, projects } = usePage<SharedData & { projects: { id: number; name: string }[] }>().props
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<boolean>(false)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [statusDialogOpen, setStatusDialogOpen] = useState(false)
    const [selectedStatus, setSelectedStatus] = useState<Task['status'] | null>(null)
    const [isUpdating, setIsUpdating] = useState(false)
    const [taskToUpdate, setTaskToUpdate] = useState<Task | null>(null)

    // Filter states
    const [filters, setFilters] = useState<TaskFilters>({
        status: 'all',
        priority: 'all',
        project_id: 'all',
        due_date_from: '',
        due_date_to: '',
        search: '',
    })
    const [processing, setProcessing] = useState(false)

    const handleViewDetails = (task: Task): void => {
        setSelectedTask(task)
        setIsDetailsOpen(true)
    }

    const handleStatusClick = (task: Task, status: Task['status']): void => {
        setTaskToUpdate(task)
        setSelectedStatus(status)
        setStatusDialogOpen(true)
    }

    const updateTaskStatus = async (): Promise<void> => {
        if (!taskToUpdate || !selectedStatus || selectedStatus === taskToUpdate.status) {
            setStatusDialogOpen(false)
            return
        }

        setIsUpdating(true)
        try {
            await axios.put(route('task.update', taskToUpdate.id), {
                status: selectedStatus,
                // Include other required fields to avoid validation errors
                title: taskToUpdate.title,
                project_id: taskToUpdate.project_id,
                priority: taskToUpdate.priority,
                description: taskToUpdate.description,
                due_date: taskToUpdate.due_date,
                assignees: taskToUpdate.assignees.map((a) => a.id),
            })

            // Update the task status locally
            const updatedTasks = tasks.map((task) => {
                if (task.id === taskToUpdate.id) {
                    return { ...task, status: selectedStatus }
                }
                return task
            })

            setTasks(updatedTasks)
            toast.success('Task status updated successfully')
            setStatusDialogOpen(false)
        } catch (error) {
            console.error('Error updating task status:', error)
            toast.error('Failed to update task status')
        } finally {
            setIsUpdating(false)
        }
    }

    // Update URL with filters
    const getTasks = async (filters?: TaskFilters): Promise<void> => {
        setLoading(true)
        setError(false)
        setProcessing(true)
        try {
            setTasks(
                await _tasks.data({
                    params: filters,
                }),
            )
        } catch (error) {
            console.error('Error fetching tasks:', error)
            setError(true)
        } finally {
            setLoading(false)
            setProcessing(false)
        }
    }

    const handleFilterChange = (key: keyof TaskFilters, value: string | number | Date | null): void => {
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    const clearFilters = (): void => {
        setFilters({
            status: 'all',
            priority: 'all',
            project_id: 'all',
            due_date_from: '',
            due_date_to: '',
            search: '',
        })
    }

    const getPriorityBadge = (priority: Task['priority']): JSX.Element => {
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
            default:
                return (
                    <Badge variant="outline" className="capitalize">
                        {priority}
                    </Badge>
                )
        }
    }

    const getStatusBadge = (task: Task, status: Task['status']): JSX.Element => {
        switch (status) {
            case 'completed':
                return (
                    <Badge variant="success" className="cursor-pointer capitalize hover:opacity-80" onClick={() => handleStatusClick(task, status)}>
                        {status.replace('_', ' ')}
                    </Badge>
                )
            case 'in_progress':
                return (
                    <Badge variant="warning" className="cursor-pointer capitalize hover:opacity-80" onClick={() => handleStatusClick(task, status)}>
                        {status.replace('_', ' ')}
                    </Badge>
                )
            case 'pending':
                return (
                    <Badge variant="secondary" className="cursor-pointer capitalize hover:opacity-80" onClick={() => handleStatusClick(task, status)}>
                        {status.replace('_', ' ')}
                    </Badge>
                )
            default:
                return (
                    <Badge variant="secondary" className="cursor-pointer capitalize hover:opacity-80" onClick={() => handleStatusClick(task, status)}>
                        {status.replace('_', ' ')}
                    </Badge>
                )
        }
    }

    /**
     * Helper function to safely format date values (handles both Date objects and strings)
     */
    const formatDateValue = (dateValue: Date | string | ''): string => {
        if (dateValue instanceof Date) {
            return dateValue.toISOString().split('T')[0]
        } else if (typeof dateValue === 'string' && dateValue) {
            return dateValue
        }
        return ''
    }

    const handleSubmit = (e: { preventDefault: () => void }): void => {
        e.preventDefault()
        const formattedFilters = { ...filters }

        if (formattedFilters.due_date_from instanceof Date) {
            const year = formattedFilters.due_date_from.getFullYear()
            const month = String(formattedFilters.due_date_from.getMonth() + 1).padStart(2, '0')
            const day = String(formattedFilters.due_date_from.getDate()).padStart(2, '0')
            formattedFilters.due_date_from = `${year}-${month}-${day}`
        }

        if (formattedFilters.due_date_to instanceof Date) {
            const year = formattedFilters.due_date_to.getFullYear()
            const month = String(formattedFilters.due_date_to.getMonth() + 1).padStart(2, '0')
            const day = String(formattedFilters.due_date_to.getDate()).padStart(2, '0')
            formattedFilters.due_date_to = `${year}-${month}-${day}`
        }

        const filtersString = objectToQueryString(formattedFilters)

        getTasks(formattedFilters).then(() => {
            window.history.pushState({}, '', `?${filtersString}`)
        })
    }

    useEffect(() => {
        const queryParams = queryStringToObject()

        const initialFilters: TaskFilters = {
            status: queryParams.status || 'all',
            priority: queryParams.priority || 'all',
            project_id: queryParams.project_id || 'all',
            due_date_from: queryParams.due_date_from || '',
            due_date_to: queryParams.due_date_to || '',
            search: queryParams.search || '',
        }

        setFilters(initialFilters)
        getTasks(initialFilters).then()
    }, [])

    return (
        <MasterLayout breadcrumbs={breadcrumbs}>
            <Head title="Tasks" />
            <div className="mx-auto flex flex-col gap-6 p-6">
                {/* Header section */}
                <section className="mb-2">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Task Management</h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Manage your tasks</p>
                </section>

                {/* Filters card */}
                <Card className="transition-all hover:shadow-md">
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-7">
                            {/* Search */}
                            <div className="grid gap-1">
                                <Label htmlFor="search" className="text-xs font-medium">
                                    Search
                                </Label>
                                <div className="relative">
                                    <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="search"
                                        placeholder="Search"
                                        className="pl-10"
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="grid gap-1">
                                <Label htmlFor="status" className="text-xs font-medium">
                                    Status
                                </Label>
                                <SearchableSelect
                                    id="status"
                                    value={filters.status}
                                    onChange={(value) => handleFilterChange('status', value)}
                                    options={[
                                        { id: 'all', name: 'All Statuses' },
                                        { id: 'pending', name: 'Pending' },
                                        { id: 'in_progress', name: 'In Progress' },
                                        { id: 'completed', name: 'Completed' },
                                    ]}
                                    placeholder="All Statuses"
                                    disabled={processing}
                                    icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
                                />
                            </div>

                            {/* Priority Filter */}
                            <div className="grid gap-1">
                                <Label htmlFor="priority" className="text-xs font-medium">
                                    Priority
                                </Label>
                                <SearchableSelect
                                    id="priority"
                                    value={filters.priority}
                                    onChange={(value) => handleFilterChange('priority', value)}
                                    options={[
                                        { id: 'all', name: 'All Priorities' },
                                        { id: 'low', name: 'Low' },
                                        { id: 'medium', name: 'Medium' },
                                        { id: 'high', name: 'High' },
                                    ]}
                                    placeholder="All Priorities"
                                    disabled={processing}
                                    icon={<Flag className="h-4 w-4 text-muted-foreground" />}
                                />
                            </div>

                            {/* Project Filter */}
                            <div className="grid gap-1">
                                <Label htmlFor="project" className="text-xs font-medium">
                                    Project
                                </Label>
                                <SearchableSelect
                                    id="project"
                                    value={filters.project_id}
                                    onChange={(value) => handleFilterChange('project_id', value)}
                                    options={[
                                        { id: 'all', name: 'All Projects' },
                                        ...projects.map((project) => ({
                                            id: project.id.toString(),
                                            name: project.name,
                                        })),
                                    ]}
                                    placeholder="All Projects"
                                    disabled={processing}
                                    icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
                                />
                            </div>

                            {/* Due Date From */}
                            <div className="grid gap-1">
                                <Label htmlFor="due-date-from" className="text-xs font-medium">
                                    Due Date From
                                </Label>
                                <DatePicker
                                    selected={filters.due_date_from}
                                    onChange={(date) => handleFilterChange('due_date_from', date)}
                                    dateFormat="yyyy-MM-dd"
                                    isClearable
                                    disabled={processing}
                                    customInput={
                                        <CustomInput
                                            id="due-date-from"
                                            icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                                            disabled={processing}
                                            placeholder="Select start date"
                                        />
                                    }
                                />
                            </div>

                            {/* Due Date To */}
                            <div className="grid gap-1">
                                <Label htmlFor="due-date-to" className="text-xs font-medium">
                                    Due Date To
                                </Label>
                                <DatePicker
                                    selected={filters.due_date_to}
                                    onChange={(date) => handleFilterChange('due_date_to', date)}
                                    dateFormat="yyyy-MM-dd"
                                    isClearable
                                    disabled={processing}
                                    customInput={
                                        <CustomInput
                                            id="due-date-to"
                                            icon={<CalendarRange className="h-4 w-4 text-muted-foreground" />}
                                            disabled={processing}
                                            placeholder="Select end date"
                                        />
                                    }
                                />
                            </div>

                            <div className="flex items-end gap-2">
                                <Button type="submit" className="flex h-9 items-center gap-1 px-3">
                                    <Search className="h-3.5 w-3.5" />
                                    <span>Filter</span>
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={
                                        filters.status === 'all' &&
                                        filters.priority === 'all' &&
                                        filters.project_id === 'all' &&
                                        !filters.due_date_from &&
                                        !filters.due_date_to &&
                                        !filters.search
                                    }
                                    onClick={clearFilters}
                                    className="flex h-9 items-center gap-1 px-3"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    <span>Clear</span>
                                </Button>
                            </div>
                        </form>

                        <div className={'mt-4 text-sm text-muted-foreground'}>
                            {(filters.status !== 'all' ||
                                filters.priority !== 'all' ||
                                filters.project_id !== 'all' ||
                                filters.due_date_from ||
                                filters.due_date_to ||
                                filters.search) && (
                                <CardDescription>
                                    {(() => {
                                        let description = ''

                                        if (filters.due_date_from && filters.due_date_to) {
                                            description = `Showing tasks from ${formatDateValue(filters.due_date_from)} to ${formatDateValue(filters.due_date_to)}`
                                        } else if (filters.due_date_from) {
                                            description = `Showing tasks from ${formatDateValue(filters.due_date_from)}`
                                        } else if (filters.due_date_to) {
                                            description = `Showing tasks until ${formatDateValue(filters.due_date_to)}`
                                        }

                                        if (filters.status !== 'all') {
                                            if (description) {
                                                description += ` with status "${filters.status.replace('_', ' ')}"`
                                            } else {
                                                description = `Showing tasks with status "${filters.status.replace('_', ' ')}"`
                                            }
                                        }

                                        if (filters.priority !== 'all') {
                                            if (description) {
                                                description += ` and priority "${filters.priority}"`
                                            } else {
                                                description = `Showing tasks with priority "${filters.priority}"`
                                            }
                                        }

                                        if (filters.project_id !== 'all') {
                                            const project = projects.find((p) => p.id.toString() === filters.project_id)
                                            if (project) {
                                                if (description) {
                                                    description += ` in project "${project.name}"`
                                                } else {
                                                    description = `Showing tasks in project "${project.name}"`
                                                }
                                            }
                                        }

                                        if (filters.search) {
                                            if (description) {
                                                description += ` matching "${filters.search}"`
                                            } else {
                                                description = `Showing tasks matching "${filters.search}"`
                                            }
                                        }

                                        return description
                                    })()}
                                </CardDescription>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Tasks card */}
                <Card className="overflow-hidden transition-all hover:shadow-md">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl">Tasks</CardTitle>
                                <CardDescription>
                                    {loading ? 'Loading tasks...' : error ? 'Failed to load tasks' : `You have ${tasks.length} tasks`}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <a href={route('task.export')} className="inline-block">
                                    <Button variant="outline" className="flex items-center gap-2">
                                        <Download className="h-4 w-4" />
                                        <span>Export</span>
                                    </Button>
                                </a>
                                <Link href={route('task.create')}>
                                    <Button className="flex items-center gap-2">
                                        <Plus className="h-4 w-4" />
                                        <span>Add Task</span>
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Loader2 className="mb-4 h-12 w-12 animate-spin text-muted-foreground/50" />
                                <h3 className="mb-1 text-lg font-medium">Loading Tasks</h3>
                                <p className="mb-4 text-muted-foreground">Please wait while we fetch your tasks...</p>
                            </div>
                        ) : error ? (
                            <div className="rounded-md border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <ClipboardList className="mb-4 h-12 w-12 text-red-500" />
                                    <h3 className="mb-1 text-lg font-medium text-red-700 dark:text-red-400">Failed to Load Tasks</h3>
                                    <p className="mb-4 text-red-600 dark:text-red-300">There was an error loading your tasks. Please try again.</p>
                                    <Button onClick={() => getTasks()} className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4" />
                                        <span>Retry</span>
                                    </Button>
                                </div>
                            </div>
                        ) : tasks.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableHeaderRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Project</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead>Assignees</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableHeaderRow>
                                </TableHeader>
                                <TableBody>
                                    {tasks.map((task) => (
                                        <TableRow key={task.id}>
                                            <TableCell className="font-medium">{task.title}</TableCell>
                                            <TableCell>{task.project.name}</TableCell>
                                            <TableCell>{getStatusBadge(task, task.status)}</TableCell>
                                            <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                                            <TableCell>
                                                {task.due_date ? (
                                                    new Date(task.due_date).toISOString().split('T')[0]
                                                ) : (
                                                    <span className="text-muted-foreground/50">No due date</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {task.assignees && task.assignees.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {task.assignees.map((assignee) => (
                                                            <span
                                                                key={assignee.id}
                                                                className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30"
                                                                title={assignee.email}
                                                            >
                                                                {assignee.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground/50">No assignees</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {/* View Details Button */}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 w-8 border-blue-200 bg-blue-50 p-0 text-blue-700 hover:bg-blue-100"
                                                        onClick={() => handleViewDetails(task)}
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        <span className="sr-only">View Details</span>
                                                    </Button>

                                                    {task.project.user_id === auth.user.id && (
                                                        <>
                                                            <Link href={route('task.edit', task.id)}>
                                                                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                    <span className="sr-only">Edit</span>
                                                                </Button>
                                                            </Link>
                                                            <DeleteTask
                                                                taskId={task.id}
                                                                onDelete={() => setTasks(tasks.filter((t) => t.id !== task.id))}
                                                            />
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="rounded-md border bg-muted/5 p-6">
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
                                    <h3 className="mb-1 text-lg font-medium">No Tasks</h3>
                                    <p className="mb-4 text-muted-foreground">You haven't added any tasks yet.</p>
                                    <Link href={route('task.create')}>
                                        <Button className="flex items-center gap-2">
                                            <Plus className="h-4 w-4" />
                                            <span>Add Task</span>
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Task Details Sheet */}
                <TaskDetailsSheet task={selectedTask} open={isDetailsOpen} onOpenChange={setIsDetailsOpen} />

                {/* Status Change Dialog */}
                <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Change Task Status</DialogTitle>
                            <DialogDescription>Select a new status for this task.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <RadioGroup
                                value={selectedStatus || ''}
                                onValueChange={(value) => setSelectedStatus(value as Task['status'])}
                                className="flex flex-col space-y-2"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="pending" id="status-pending" />
                                    <Label htmlFor="status-pending" className="cursor-pointer">
                                        Pending
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="in_progress" id="status-in-progress" />
                                    <Label htmlFor="status-in-progress" className="cursor-pointer">
                                        In Progress
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="completed" id="status-completed" />
                                    <Label htmlFor="status-completed" className="cursor-pointer">
                                        Completed
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setStatusDialogOpen(false)} disabled={isUpdating}>
                                Cancel
                            </Button>
                            <Button type="button" onClick={updateTaskStatus} disabled={isUpdating}>
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </MasterLayout>
    )
}
