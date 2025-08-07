import { ActionButton, ActionButtonGroup, ExportButton } from '@/components/action-buttons'
import DeleteTask from '@/components/delete-task'
import TaskDetailsSheet from '@/components/task-details-sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import CustomInput from '@/components/ui/custom-input'
import DatePicker from '@/components/ui/date-picker'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableHeaderRow, TableRow } from '@/components/ui/table'
import MasterLayout from '@/layouts/master-layout'
import { objectToQueryString, parseDate, queryStringToObject } from '@/lib/utils'
import { type BreadcrumbItem, type SharedData } from '@/types'
import { tasks as _tasks } from '@actions/TaskController'
import { Head, Link, usePage } from '@inertiajs/react'
import axios from 'axios'
import {
    AlertCircle,
    Briefcase,
    Calendar,
    CalendarRange,
    ClipboardList,
    Edit,
    FileText,
    Flag,
    GithubIcon,
    Glasses,
    Loader2,
    Play,
    Plus,
    Search,
    TimerReset,
    Trello,
} from 'lucide-react'
import { JSX, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Task, TaskFilters } from './types'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tasks',
        href: '/task',
    },
]

export default function Tasks() {
    const { auth, projects, tags } = usePage<
        SharedData & {
            projects: { id: number; name: string }[]
            tags: { id: number; name: string; color: string }[]
        }
    >().props
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<boolean>(false)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [statusDialogOpen, setStatusDialogOpen] = useState(false)
    const [selectedStatus, setSelectedStatus] = useState<Task['status'] | null>(null)
    const [isUpdating, setIsUpdating] = useState(false)
    const [taskToUpdate, setTaskToUpdate] = useState<Task | null>(null)
    const [updateGithub, setUpdateGithub] = useState<boolean>(true)
    const [isThereRunningTracker, setIsThereRunningTracker] = useState(localStorage.getItem('activeTimeLog') !== null)

    // Filter states
    const [filters, setFilters] = useState<TaskFilters>({
        status: 'all',
        priority: 'all',
        project: 'all',
        tag: 'all',
        'due-date-from': '',
        'due-date-to': '',
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
        setUpdateGithub(true) // Default to checked
        setStatusDialogOpen(true)
    }

    const updateTaskStatus = async (): Promise<void> => {
        if (!taskToUpdate || !selectedStatus || selectedStatus === taskToUpdate.status) {
            setStatusDialogOpen(false)
            return
        }

        setIsUpdating(true)
        try {
            const payload: {
                status: 'pending' | 'in_progress' | 'completed'
                title: string
                project_id: number
                priority: 'low' | 'medium' | 'high'
                description: string | null
                due_date: string | null
                assignees: number[]
                github_update?: boolean
            } = {
                status: selectedStatus,
                // Include other required fields to avoid validation errors
                title: taskToUpdate.title,
                project_id: taskToUpdate.project_id,
                priority: taskToUpdate.priority,
                description: taskToUpdate.description,
                due_date: taskToUpdate.due_date,
                assignees: taskToUpdate.assignees.map((a) => a.id),
            }

            // Add github_update parameter for GitHub tasks
            if (taskToUpdate.is_imported && taskToUpdate.meta?.source === 'github') {
                payload.github_update = updateGithub
            }

            await axios.put(route('task.update', taskToUpdate.id), payload)

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
            status: 'incomplete',
            priority: 'all',
            project: 'all',
            tag: 'all',
            'due-date-from': '',
            'due-date-to': '',
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
        const displayStatus = status ? status.toString() : ''

        switch (status) {
            case 'completed':
                return (
                    <Badge variant="success" className="cursor-pointer capitalize hover:opacity-80" onClick={() => handleStatusClick(task, status)}>
                        {displayStatus.replace('_', ' ')}
                    </Badge>
                )
            case 'in_progress':
                return (
                    <Badge variant="warning" className="cursor-pointer capitalize hover:opacity-80" onClick={() => handleStatusClick(task, status)}>
                        {displayStatus.replace('_', ' ')}
                    </Badge>
                )
            case 'pending':
                return (
                    <Badge variant="secondary" className="cursor-pointer capitalize hover:opacity-80" onClick={() => handleStatusClick(task, status)}>
                        {displayStatus.replace('_', ' ')}
                    </Badge>
                )
            default:
                return (
                    <Badge variant="secondary" className="cursor-pointer capitalize hover:opacity-80" onClick={() => handleStatusClick(task, status)}>
                        {displayStatus.replace('_', ' ')}
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

        if (formattedFilters['due-date-from'] instanceof Date) {
            const year = formattedFilters['due-date-from'].getFullYear()
            const month = String(formattedFilters['due-date-from'].getMonth() + 1).padStart(2, '0')
            const day = String(formattedFilters['due-date-from'].getDate()).padStart(2, '0')
            formattedFilters['due-date-from'] = `${year}-${month}-${day}`
        }

        if (formattedFilters['due-date-to'] instanceof Date) {
            const year = formattedFilters['due-date-to'].getFullYear()
            const month = String(formattedFilters['due-date-to'].getMonth() + 1).padStart(2, '0')
            const day = String(formattedFilters['due-date-to'].getDate()).padStart(2, '0')
            formattedFilters['due-date-to'] = `${year}-${month}-${day}`
        }

        const filtersString = objectToQueryString(formattedFilters)

        getTasks(formattedFilters).then(() => {
            window.history.pushState({}, '', `?${filtersString}`)
        })
    }

    const isAssignedToCurrentUser = (task: Task): boolean => {
        return task.assignees.some((assignee) => assignee.id === auth.user.id)
    }

    useEffect(() => {
        const queryParams = queryStringToObject()

        const initialFilters: TaskFilters = {
            status: (queryParams.status as TaskFilters['status']) || 'incomplete',
            priority: queryParams.priority || 'all',
            project: queryParams.project || 'all',
            tag: queryParams.tag || 'all',
            'due-date-from': queryParams['due-date-from'] || '',
            'due-date-to': queryParams['due-date-to'] || '',
            search: queryParams.search || '',
        }

        setFilters(initialFilters)
        getTasks(initialFilters).then()

        window.addEventListener('time-tracker-stopped', () => {
            setIsThereRunningTracker(false)
        })
    }, [])

    return (
        <MasterLayout breadcrumbs={breadcrumbs}>
            <Head title="Tasks" />
            <div className="mx-auto flex flex-col gap-6 p-3">
                {/* Header section */}
                <section className="mb-2">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Task Management</h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Manage your tasks</p>
                </section>

                {/* Time Logs Card with filters in header */}
                <Card className="transition-all hover:shadow-md">
                    <CardHeader className="">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl">Tasks</CardTitle>
                                <CardDescription>
                                    {loading ? 'Loading tasks...' : error ? 'Failed to load tasks' : `You have ${tasks.length} tasks`}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <ExportButton href={route('task.export')} label="Export" />
                                <Link href={route('task.create')}>
                                    <Button className="flex items-center gap-2">
                                        <Plus className="h-4 w-4" />
                                        <span>Add Task</span>
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="mt-4 border-t pt-4">
                            <form onSubmit={handleSubmit} className="flex w-full flex-row flex-wrap gap-4">
                                {/* Search */}
                                <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-1">
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
                                <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-1">
                                    <Label htmlFor="status" className="text-xs font-medium">
                                        Status
                                    </Label>
                                    <SearchableSelect
                                        id="status"
                                        value={filters.status}
                                        onChange={(value) => handleFilterChange('status', value)}
                                        options={[
                                            { id: 'all', name: 'Statuses' },
                                            { id: 'incomplete', name: 'Incomplete' },
                                            { id: 'pending', name: 'Pending' },
                                            { id: 'in_progress', name: 'In Progress' },
                                            { id: 'completed', name: 'Completed' },
                                        ]}
                                        placeholder="Statuses"
                                        disabled={processing}
                                        icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
                                    />
                                </div>

                                {/* Priority Filter */}
                                <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-1">
                                    <Label htmlFor="priority" className="text-xs font-medium">
                                        Priority
                                    </Label>
                                    <SearchableSelect
                                        id="priority"
                                        value={filters.priority}
                                        onChange={(value) => handleFilterChange('priority', value)}
                                        options={[
                                            { id: 'all', name: 'Priorities' },
                                            { id: 'low', name: 'Low' },
                                            { id: 'medium', name: 'Medium' },
                                            { id: 'high', name: 'High' },
                                        ]}
                                        placeholder="Priorities"
                                        disabled={processing}
                                        icon={<Flag className="h-4 w-4 text-muted-foreground" />}
                                    />
                                </div>

                                {/* Project Filter */}
                                <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-1">
                                    <Label htmlFor="project" className="text-xs font-medium">
                                        Project
                                    </Label>
                                    <SearchableSelect
                                        id="project"
                                        value={filters.project}
                                        onChange={(value) => handleFilterChange('project', value)}
                                        options={[
                                            { id: 'all', name: 'Projects' },
                                            ...projects.map((project) => ({
                                                id: project.id.toString(),
                                                name: project.name,
                                            })),
                                        ]}
                                        placeholder="Projects"
                                        disabled={processing}
                                        icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
                                    />
                                </div>

                                {/* Tag Filter */}
                                <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-1">
                                    <Label htmlFor="tag" className="text-xs font-medium">
                                        Tag
                                    </Label>
                                    <SearchableSelect
                                        id="tag"
                                        value={filters.tag}
                                        onChange={(value) => handleFilterChange('tag', value)}
                                        options={[
                                            { id: 'all', name: 'Tags' },
                                            ...tags.map((tag) => ({
                                                id: tag.id.toString(),
                                                name: tag.name,
                                            })),
                                        ]}
                                        placeholder="Tags"
                                        disabled={processing}
                                        icon={<Flag className="h-4 w-4 text-muted-foreground" />}
                                    />
                                </div>

                                {/* Due Date From */}
                                <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-1">
                                    <Label htmlFor="due-date-from" className="text-xs font-medium">
                                        Due Date From
                                    </Label>
                                    <DatePicker
                                        selected={parseDate(filters['due-date-from'])}
                                        onChange={(date) => handleFilterChange('due-date-from', date)}
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
                                <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-1">
                                    <Label htmlFor="due-date-to" className="text-xs font-medium">
                                        Due Date To
                                    </Label>
                                    <DatePicker
                                        selected={parseDate(filters['due-date-to'])}
                                        onChange={(date) => handleFilterChange('due-date-to', date)}
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
                                    <Button type="submit" size="icon" className="h-9 w-9" title="Filter">
                                        <Search className="h-4 w-4" />
                                        <span className="sr-only">Filter</span>
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        disabled={
                                            filters.status === 'all' &&
                                            filters.priority === 'all' &&
                                            filters.project === 'all' &&
                                            filters.tag === 'all' &&
                                            !filters['due-date-from'] &&
                                            !filters['due-date-to'] &&
                                            !filters.search
                                        }
                                        onClick={clearFilters}
                                        className="h-9 w-9"
                                        title="Clear Filters"
                                    >
                                        <TimerReset className="h-4 w-4" />
                                        <span className="sr-only">Clear</span>
                                    </Button>
                                </div>
                            </form>

                            <div className={'mt-4 text-sm text-muted-foreground'}>
                                {(filters.status !== 'all' ||
                                    filters.priority !== 'all' ||
                                    filters.project !== 'all' ||
                                    filters.tag !== 'all' ||
                                    filters['due-date-from'] ||
                                    filters['due-date-to'] ||
                                    filters.search) && (
                                    <CardDescription>
                                        {(() => {
                                            let description = ''

                                            if (filters['due-date-from'] && filters['due-date-to']) {
                                                description = `Showing tasks from ${formatDateValue(filters['due-date-from'])} to ${formatDateValue(filters['due-date-to'])}`
                                            } else if (filters['due-date-from']) {
                                                description = `Showing tasks from ${formatDateValue(filters['due-date-from'])}`
                                            } else if (filters['due-date-to']) {
                                                description = `Showing tasks until ${formatDateValue(filters['due-date-to'])}`
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

                                            if (filters.project !== 'all') {
                                                const project = projects.find((p) => p.id.toString() === filters.project)
                                                if (project) {
                                                    if (description) {
                                                        description += ` in project "${project.name}"`
                                                    } else {
                                                        description = `Showing tasks in project "${project.name}"`
                                                    }
                                                }
                                            }

                                            if (filters.tag !== 'all') {
                                                const tag = tags.find((t) => t.id.toString() === filters.tag)
                                                if (tag) {
                                                    if (description) {
                                                        description += ` with tag "${tag.name}"`
                                                    } else {
                                                        description = `Showing tasks with tag "${tag.name}"`
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
                                            <TableCell className="max-w-xl font-medium">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span>{task.title}</span>
                                                    {task.is_imported && task.meta?.source === 'github' && <GithubIcon className="h-3 w-3 text-purple-600 dark:text-purple-400" />}
                                                    {task.is_imported && task.meta?.source === 'trello' && <Trello className="h-3 w-3 text-blue-600 dark:text-blue-400" />}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <small>{task.project.name}</small>
                                                    {task.tags && task.tags.length > 0 && (
                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                            {task.tags.map((tag) => (
                                                                <Badge
                                                                    key={tag.id}
                                                                    className="text-xs"
                                                                    style={{ backgroundColor: tag.color, color: '#fff' }}
                                                                >
                                                                    {tag.name}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
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
                                                                className="inline-flex items-center bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30"
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
                                                        className="h-7 w-7 border-blue-200 bg-blue-50 p-0 text-blue-700 hover:bg-blue-100"
                                                        onClick={() => handleViewDetails(task)}
                                                        title="View Details"
                                                    >
                                                        <Glasses className="h-3.5 w-3.5" />
                                                        <span className="sr-only">View Details</span>
                                                    </Button>

                                                    {isAssignedToCurrentUser(task) && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 w-7 border-cyan-500 bg-cyan-200 p-0 text-cyan-700 hover:bg-cyan-300"
                                                            onClick={() => {
                                                                setIsThereRunningTracker(true)
                                                                window.dispatchEvent(
                                                                    new CustomEvent('task-time-tracker-start', {
                                                                        detail: {
                                                                            taskId: task.id,
                                                                            projectId: task.project.id,
                                                                        },
                                                                    }),
                                                                )
                                                            }}
                                                            disabled={isThereRunningTracker}
                                                            title="Start Time Tracking"
                                                        >
                                                            <Play className="h-3.5 w-3.5" />
                                                            <span className="sr-only">Start Time Tracker</span>
                                                        </Button>
                                                    )}

                                                    {task.project.user_id === auth.user.id && (
                                                        <ActionButtonGroup>
                                                            <ActionButton
                                                                href={route('task.edit', task.id)}
                                                                title="Edit Task"
                                                                icon={Edit}
                                                                variant="amber"
                                                                size="icon"
                                                            />
                                                            <DeleteTask
                                                                taskId={task.id}
                                                                isGithub={task.is_imported && task.meta?.source === 'github'}
                                                                onDelete={() => setTasks(tasks.filter((t) => t.id !== task.id))}
                                                            />
                                                        </ActionButtonGroup>
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

                            {taskToUpdate?.is_imported && taskToUpdate?.meta?.source === 'github' && (
                                <div className="flex items-center space-x-2 pt-2">
                                    <Checkbox
                                        id="update_github"
                                        checked={updateGithub}
                                        onCheckedChange={(checked) => setUpdateGithub(checked === true)}
                                    />
                                    <Label htmlFor="update_github" className="text-sm">
                                        Update in GitHub?
                                    </Label>
                                </div>
                            )}
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
