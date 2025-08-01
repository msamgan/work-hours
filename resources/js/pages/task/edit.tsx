import { SearchableSelect } from '@/components/ui/searchable-select'
import { potentialAssignees as _potentialAssignees } from '@actions/TaskController'
import { Head, useForm } from '@inertiajs/react'
import { ArrowLeft, Calendar, CheckSquare, ClipboardList, FileText, LoaderCircle, Save, Text } from 'lucide-react'
import { FormEventHandler, useEffect, useState } from 'react'
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

type User = {
    id: number
    name: string
    email: string
}

type Project = {
    id: number
    name: string
}

type TaskForm = {
    project_id: string
    title: string
    description: string
    status: 'pending' | 'in_progress' | 'completed'
    priority: 'low' | 'medium' | 'high'
    due_date: string
    assignees: number[]
    github_update: boolean
}

type Props = {
    task: {
        id: number
        project_id: number
        title: string
        description: string | null
        status: 'pending' | 'in_progress' | 'completed'
        priority: 'low' | 'medium' | 'high'
        due_date: string | null
    }
    projects: Project[]
    potentialAssignees: User[]
    assignedUsers: number[]
    isGithub: boolean
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tasks',
        href: '/task',
    },
    {
        title: 'Edit',
        href: '/task/edit',
    },
]

export default function EditTask({ task, projects, potentialAssignees: initialAssignees, assignedUsers, isGithub }: Props) {
    const { data, setData, put, processing, errors } = useForm<TaskForm>({
        project_id: task.project_id.toString(),
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        due_date: task.due_date || '',
        assignees: assignedUsers || [],
        github_update: true,
    })

    // State for potential assignees
    const [potentialAssignees, setPotentialAssignees] = useState<{ id: number; name: string; email: string }[]>(initialAssignees || [])
    const [loadingAssignees, setLoadingAssignees] = useState<boolean>(false)

    // State for due date
    const [dueDate, setDueDate] = useState<Date | null>(data.due_date ? new Date(data.due_date) : null)

    // Fetch potential assignees when project_id changes
    useEffect(() => {
        if (data.project_id) {
            setLoadingAssignees(true)
            _potentialAssignees
                .data({
                    params: {
                        project: parseInt(data.project_id),
                    },
                })
                .then((assignees: User[]) => {
                    setPotentialAssignees(assignees)
                })
                .catch(() => {
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

    // Handle due date change
    const handleDueDateChange = (date: Date | null) => {
        setDueDate(date)
        if (date) {
            setData('due_date', date.toISOString().split('T')[0])
        } else {
            setData('due_date', '')
        }
    }

    const submit: FormEventHandler = (e) => {
        e.preventDefault()
        put(route('task.update', task.id), {
            onSuccess: () => {
                toast.success('Task updated successfully')
            },
            onError: () => {
                toast.error('Failed to update task')
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
            <Head title="Edit Task" />
            <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
                {/* Header section */}
                <section className="mb-2">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Edit Task</h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Update information for {task.title}</p>
                </section>

                <Card className="overflow-hidden transition-all hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="text-xl">Task Information</CardTitle>
                        <CardDescription>Update the task's details</CardDescription>
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

                                {isGithub && (
                                    <div className="ml-1 grid gap-2">
                                        <Label className="flex items-center space-x-2">
                                            <Checkbox
                                                id="github_update"
                                                checked={data.github_update}
                                                onCheckedChange={(checked) => setData('github_update', checked === true)}
                                                disabled={processing}
                                            />
                                            <span className="text-sm font-medium">Update GitHub issue when task is updated</span>
                                        </Label>
                                        <InputError message={errors.github_update} />
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
                                        {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        {processing ? 'Updating...' : 'Update Task'}
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
