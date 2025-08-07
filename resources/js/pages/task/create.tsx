import { SearchableSelect } from '@/components/ui/searchable-select'
import TagInput from '@/components/ui/tag-input'
import { potentialAssignees as _potentialAssignees } from '@actions/TaskController'
import { Head, useForm } from '@inertiajs/react'
import { ArrowLeft, Calendar, CheckSquare, ClipboardList, FileText, LoaderCircle, Plus, Text } from 'lucide-react'
import { FormEventHandler, SetStateAction, useEffect, useState } from 'react'
import { toast } from 'sonner'

import InputError from '@/components/input-error'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import CustomInput from '@/components/ui/custom-input'
import DatePicker from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import MasterLayout from '@/layouts/master-layout'
import { type BreadcrumbItem } from '@/types'

type Project = {
    id: number
    name: string
    source?: string
    is_github?: boolean
}

type TaskForm = {
    project_id: string
    title: string
    description: string
    status: 'pending' | 'in_progress' | 'completed'
    priority: 'low' | 'medium' | 'high'
    due_date: string
    assignees: number[]
    create_github_issue: boolean
    tags: string[]
}

type Props = {
    projects: Project[]
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tasks',
        href: '/task',
    },
    {
        title: 'Create',
        href: '/task/create',
    },
]

export default function CreateTask({ projects }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm<TaskForm>({
        project_id: '',
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        due_date: '',
        assignees: [],
        create_github_issue: false,
        tags: [],
    })

    // State to store potential assignees
    const [potentialAssignees, setPotentialAssignees] = useState<{ id: number; name: string; email: string }[]>([])
    const [loadingAssignees, setLoadingAssignees] = useState<boolean>(false)

    // State to track if the selected project is from GitHub
    const [isGithubProject, setIsGithubProject] = useState<boolean>(false)

    // State for due date
    const [dueDate, setDueDate] = useState<Date | null>(data.due_date ? new Date(data.due_date) : null)

    // Handle due date change
    const handleDueDateChange = (date: Date | null) => {
        setDueDate(date)
        if (date) {
            setData('due_date', date.toISOString().split('T')[0])
        } else {
            setData('due_date', '')
        }
    }

    // Fetch potential assignees when project_id changes
    useEffect(() => {
        if (data.project_id) {
            setLoadingAssignees(true)
            _potentialAssignees
                .data({
                    params: { project: data.project_id },
                })
                .then((assignees: SetStateAction<{ id: number; name: string; email: string }[]>) => {
                    setPotentialAssignees(assignees)
                })
                .catch((error: never) => {
                    console.error('Failed to fetch potential assignees:', error)
                    toast.error('Failed to load potential assignees')
                    setPotentialAssignees([])
                })
                .finally(() => {
                    setLoadingAssignees(false)
                })
        } else {
            setPotentialAssignees([])
        }
    }, [data.project_id])

    // Check if the selected project is a GitHub project
    useEffect(() => {
        const selectedProject = projects.find((project) => project.id === Number(data.project_id))
        setIsGithubProject(!!selectedProject?.is_github)
    }, [data.project_id, projects])

    const submit: FormEventHandler = (e) => {
        e.preventDefault()
        post(route('task.store'), {
            onSuccess: () => {
                toast.success('Task created successfully')
                reset()
            },
            onError: () => {
                toast.error('Failed to create task')
            },
        })
    }

    const handleAssigneeToggle = (assigneeId: number) => {
        const currentAssignees = [...data.assignees]
        const index = currentAssignees.indexOf(assigneeId)

        if (index === -1) {
            // Add assignee if not already selected
            currentAssignees.push(assigneeId)
        } else {
            // Remove assignee if already selected
            currentAssignees.splice(index, 1)
        }

        setData('assignees', currentAssignees)
    }

    return (
        <MasterLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Task" />
            <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
                {/* Header section */}
                <section className="mb-2">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Add Task</h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Create a new task</p>
                </section>

                <Card className="overflow-hidden transition-all hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="text-xl">Task Details</CardTitle>
                        <CardDescription>Enter the information for the new task</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="flex flex-col gap-6" onSubmit={submit}>
                            <div className="grid gap-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="project_id" className="text-sm font-medium">
                                            Project
                                        </Label>
                                        <SearchableSelect
                                            id="project_id"
                                            value={data.project_id}
                                            onChange={(value) => setData('project_id', value)}
                                            options={projects}
                                            placeholder="Select a project"
                                            disabled={processing}
                                            icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />}
                                        />
                                        <InputError message={errors.project_id} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="due_date" className="text-sm font-medium">
                                            Due Date <span className="text-xs text-muted-foreground">(optional)</span>
                                        </Label>
                                        <DatePicker
                                            selected={dueDate}
                                            onChange={handleDueDateChange}
                                            dateFormat="yyyy-MM-dd"
                                            isClearable
                                            disabled={processing}
                                            placeholderText="Select due date (optional)"
                                            customInput={
                                                <CustomInput
                                                    id="due_date"
                                                    icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                                                    disabled={processing}
                                                    tabIndex={3}
                                                />
                                            }
                                        />
                                        <InputError message={errors.due_date} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="title" className="text-sm font-medium">
                                        Task Title
                                    </Label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <Input
                                            id="title"
                                            type="text"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            disabled={processing}
                                            placeholder="Task title"
                                            className="pl-10"
                                        />
                                    </div>
                                    <InputError message={errors.title} className="mt-1" />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description" className="text-sm font-medium">
                                        Description <span className="text-xs text-muted-foreground">(optional)</span>
                                    </Label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 top-0 left-3 flex items-center pt-2">
                                            <Text className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <Textarea
                                            id="description"
                                            tabIndex={2}
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            disabled={processing}
                                            placeholder="Task description"
                                            className="min-h-[100px] pl-10"
                                        />
                                    </div>
                                    <InputError message={errors.description} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="status" className="text-sm font-medium">
                                            Status
                                        </Label>
                                        <div className="relative rounded-md border p-3">
                                            <div className="pointer-events-none absolute top-3 left-3">
                                                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="pl-7">
                                                <RadioGroup
                                                    value={data.status}
                                                    onValueChange={(value) => setData('status', value as TaskForm['status'])}
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
                                        </div>
                                        <InputError message={errors.status} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="priority" className="text-sm font-medium">
                                            Priority
                                        </Label>
                                        <div className="relative rounded-md border p-3">
                                            <div className="pointer-events-none absolute top-3 left-3">
                                                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="pl-7">
                                                <RadioGroup
                                                    value={data.priority}
                                                    onValueChange={(value) => setData('priority', value as TaskForm['priority'])}
                                                    className="flex flex-col space-y-2"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="low" id="priority-low" />
                                                        <Label htmlFor="priority-low" className="cursor-pointer">
                                                            Low
                                                        </Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="medium" id="priority-medium" />
                                                        <Label htmlFor="priority-medium" className="cursor-pointer">
                                                            Medium
                                                        </Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="high" id="priority-high" />
                                                        <Label htmlFor="priority-high" className="cursor-pointer">
                                                            High
                                                        </Label>
                                                    </div>
                                                </RadioGroup>
                                            </div>
                                        </div>
                                        <InputError message={errors.priority} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">
                                        Assignees <span className="text-xs text-muted-foreground">(optional)</span>
                                    </Label>
                                    <div className="relative rounded-md border p-3">
                                        <div className="pointer-events-none absolute top-3 left-3">
                                            <CheckSquare className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="space-y-2 pl-7">
                                            {loadingAssignees ? (
                                                <div className="flex items-center space-x-2">
                                                    <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
                                                    <p className="text-sm text-muted-foreground">Loading assignees...</p>
                                                </div>
                                            ) : potentialAssignees && potentialAssignees.length > 0 ? (
                                                potentialAssignees.map((assignee) => (
                                                    <div key={assignee.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`assignee-${assignee.id}`}
                                                            checked={data.assignees.includes(assignee.id)}
                                                            onCheckedChange={() => handleAssigneeToggle(assignee.id)}
                                                            disabled={processing}
                                                        />
                                                        <Label htmlFor={`assignee-${assignee.id}`} className="cursor-pointer text-sm">
                                                            {assignee.name} ({assignee.email})
                                                        </Label>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    {data.project_id ? 'No potential assignees available for this project' : 'Select a project first'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <InputError message={errors.assignees} />
                                </div>

                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">
                                        Tags <span className="text-xs text-muted-foreground">(optional)</span>
                                    </Label>
                                    <TagInput value={data.tags} onChange={(tags) => setData('tags', tags)} placeholder="Add tags (optional)" />
                                    <InputError message={errors.tags} />
                                </div>

                                {isGithubProject && (
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="create_github_issue"
                                            checked={data.create_github_issue}
                                            onCheckedChange={(checked) => setData('create_github_issue', !!checked)}
                                            disabled={processing}
                                        />
                                        <Label htmlFor="create_github_issue" className="cursor-pointer text-sm">
                                            Create issue on GitHub
                                        </Label>
                                    </div>
                                )}

                                <div className="mt-4 flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => window.history.back()}
                                        tabIndex={4}
                                        disabled={processing}
                                        className="flex items-center gap-2"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Back
                                    </Button>
                                    <Button type="submit" tabIndex={3} disabled={processing} className="flex items-center gap-2">
                                        {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                        {processing ? 'Creating...' : 'Create Task'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </MasterLayout>
    )
}
