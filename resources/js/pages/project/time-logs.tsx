import { ExportButton } from '@/components/action-buttons'
import StatsCards from '@/components/dashboard/StatsCards'
import TimeLogTable, { TimeLogEntry } from '@/components/time-log-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import CustomInput from '@/components/ui/custom-input'
import DatePicker from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableHeaderRow, TableRow } from '@/components/ui/table'
import MasterLayout from '@/layouts/master-layout'
import { type BreadcrumbItem } from '@/types'
import { Head, Link, router, useForm } from '@inertiajs/react'
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CalendarRange,
    CheckCircle,
    ClipboardList,
    ClockIcon,
    Edit,
    Plus,
    Search,
    TimerReset,
    User,
} from 'lucide-react'
import { FormEventHandler, useState } from 'react'

type TimeLog = {
    id: number
    user_id: number
    user_name: string
    project_name?: string | null
    start_timestamp: string
    end_timestamp: string
    duration: number
    is_paid: boolean
    note?: string
    hourly_rate?: number
    paid_amount?: number
    currency?: string
    user_non_monetary: boolean
}

type Filters = {
    'start-date': string
    'end-date': string
    user: string
    'is-paid': string
    status: string
}

type Project = {
    id: number
    name: string
    description: string | null
    paid_amount: number
    user: {
        id: number
        name: string
        email: string
    }
}

type TeamMember = {
    id: number
    name: string
    email: string
}

type Task = {
    id: number
    project_id: number
    title: string
    description: string | null
    status: 'pending' | 'in_progress' | 'completed'
    priority: 'low' | 'medium' | 'high'
    due_date: string | null
    assignees: {
        id: number
        name: string
        email: string
    }[]
}

type Props = {
    timeLogs: TimeLog[]
    filters: Filters
    project: Project
    teamMembers: TeamMember[]
    totalDuration: number
    unpaidHours: number
    unpaidAmountsByCurrency: Record<string, number>
    paidAmountsByCurrency: Record<string, number>
    weeklyAverage: number
    isCreator: boolean
    tasks: Task[]
}

export default function ProjectTimeLogs({
    timeLogs,
    filters,
    project,
    teamMembers,
    totalDuration,
    unpaidHours,
    unpaidAmountsByCurrency,
    paidAmountsByCurrency,
    weeklyAverage,
    isCreator,
    tasks,
}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Projects',
            href: '/project',
        },
        {
            title: project.name,
            href: `/project/${project.id}/time-logs`,
        },
    ]

    const [selectedLogs, setSelectedLogs] = useState<number[]>([])

    const handleSelectLog = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedLogs([...selectedLogs, id])
        } else {
            setSelectedLogs(selectedLogs.filter((logId) => logId !== id))
        }
    }

    const markAsPaid = () => {
        if (selectedLogs.length === 0) {
            return
        }

        router.post(
            route('time-log.mark-as-paid'),
            {
                time_log_ids: selectedLogs,
            },
            {
                onSuccess: () => {
                    setSelectedLogs([])
                },
            },
        )
    }

    const { data, setData, get, processing } = useForm<Filters>({
        'start-date': filters['start-date'] || '',
        'end-date': filters['end-date'] || '',
        user: filters.user || '',
        'is-paid': filters['is-paid'] || '',
        status: filters.status || '',
    })

    const startDate = data['start-date'] ? new Date(data['start-date']) : null
    const endDate = data['end-date'] ? new Date(data['end-date']) : null

    const handleStartDateChange = (date: Date | null) => {
        if (date) {
            setData('start-date', date.toISOString().split('T')[0])
        } else {
            setData('start-date', '')
        }
    }

    const handleEndDateChange = (date: Date | null) => {
        if (date) {
            setData('end-date', date.toISOString().split('T')[0])
        } else {
            setData('end-date', '')
        }
    }

    const submit: FormEventHandler = (e) => {
        e.preventDefault()
        get(route('project.time-logs', project.id), {
            preserveState: true,
        })
    }

    return (
        <MasterLayout breadcrumbs={breadcrumbs}>
            <Head title={`${project.name} - Time Logs`} />
            <div className="mx-auto flex flex-col gap-6 p-3">
                <section className="mb-2">
                    <div className="flex items-center gap-4">
                        <Link href={route('project.index')}>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                <ArrowLeft className="h-4 w-4" />
                                <span className="sr-only">Back to Projects</span>
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{project.name} - Time Logs</h1>
                            <p className="mt-1 text-gray-500 dark:text-gray-400">Track and manage work hours for this project</p>
                        </div>
                    </div>
                </section>

                {timeLogs.length > 0 && (
                    <section className="mb-4">
                        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Metrics Dashboard</h3>
                        <StatsCards
                            teamStats={{
                                count: -1,
                                totalHours: totalDuration,
                                unpaidHours: unpaidHours,
                                unpaidAmount: Object.values(unpaidAmountsByCurrency).reduce((sum, amount) => sum + amount, 0),
                                unpaidAmountsByCurrency: unpaidAmountsByCurrency,
                                paidAmount: Object.values(paidAmountsByCurrency).reduce((sum, amount) => sum + amount, 0),
                                paidAmountsByCurrency: paidAmountsByCurrency,
                                currency: Object.keys(unpaidAmountsByCurrency)[0] || Object.keys(paidAmountsByCurrency)[0] || 'USD',
                                weeklyAverage: weeklyAverage,
                                clientCount: -1,
                            }}
                        />
                    </section>
                )}

                {/* Time Logs Card with Filters */}
                <Card className="transition-all hover:shadow-md">
                    <CardHeader className="">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl">{project.name} - Time Logs</CardTitle>
                                <CardDescription>
                                    {timeLogs.length > 0
                                        ? `Showing ${timeLogs.length} time ${timeLogs.length === 1 ? 'entry' : 'entries'}`
                                        : 'No time logs found for the selected period'}
                                </CardDescription>

                                {(data['start-date'] || data['end-date'] || data.user || data['is-paid'] || data.status) && (
                                    <CardDescription className="mt-1">
                                        {(() => {
                                            let description = ''

                                            // Date range description
                                            if (data['start-date'] && data['end-date']) {
                                                description = `Showing logs from ${data['start-date']} to ${data['end-date']}`
                                            } else if (data['start-date']) {
                                                description = `Showing logs from ${data['start-date']}`
                                            } else if (data['end-date']) {
                                                description = `Showing logs until ${data['end-date']}`
                                            }

                                            // Team member description
                                            if (data.user) {
                                                const selectedMember = teamMembers.find((member) => member.id.toString() === data.user)
                                                const memberName = selectedMember ? selectedMember.name : ''

                                                if (description) {
                                                    description += ` for ${memberName}`
                                                } else {
                                                    description = `Showing logs for ${memberName}`
                                                }
                                            }

                                            // Payment status description
                                            if (data['is-paid']) {
                                                const paymentStatus = data['is-paid'] === 'true' ? 'paid' : 'unpaid'

                                                if (description) {
                                                    description += ` (${paymentStatus})`
                                                } else {
                                                    description = `Showing ${paymentStatus} logs`
                                                }
                                            }

                                            // Approval status description
                                            if (data.status) {
                                                const statusText =
                                                    data.status === 'pending' ? 'pending' : data.status === 'approved' ? 'approved' : 'rejected'

                                                if (description) {
                                                    description += ` with ${statusText} status`
                                                } else {
                                                    description = `Showing logs with ${statusText} status`
                                                }
                                            }

                                            return description
                                        })()}
                                    </CardDescription>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <ExportButton
                                    href={`${route('project.export-time-logs')}?project=${project.id}${window.location.search.replace('?', '&')}`}
                                    label="Export"
                                />
                                {isCreator && selectedLogs.length > 0 && (
                                    <Button onClick={markAsPaid} variant="secondary" className="flex items-center gap-2">
                                        <CheckCircle className="h-3 w-3" />
                                        <span>Mark as Paid ({selectedLogs.length})</span>
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 border-t pt-4">
                            <form onSubmit={submit} className="flex w-full flex-row flex-wrap gap-4">
                                <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-1">
                                    <Label htmlFor="start-date" className="text-xs font-medium">
                                        Start Date
                                    </Label>
                                    <DatePicker
                                        selected={startDate}
                                        onChange={handleStartDateChange}
                                        dateFormat="yyyy-MM-dd"
                                        isClearable
                                        disabled={processing}
                                        customInput={
                                            <CustomInput
                                                id="start-date"
                                                icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                                                disabled={processing}
                                                placeholder="Select start date"
                                            />
                                        }
                                    />
                                </div>

                                <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-1">
                                    <Label htmlFor="end-date" className="text-xs font-medium">
                                        End Date
                                    </Label>
                                    <DatePicker
                                        selected={endDate}
                                        onChange={handleEndDateChange}
                                        dateFormat="yyyy-MM-dd"
                                        isClearable
                                        disabled={processing}
                                        customInput={
                                            <CustomInput
                                                id="end-date"
                                                icon={<CalendarRange className="h-4 w-4 text-muted-foreground" />}
                                                disabled={processing}
                                                placeholder="Select end date"
                                            />
                                        }
                                    />
                                </div>

                                <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-1">
                                    <Label htmlFor="user" className="text-xs font-medium">
                                        Team Member
                                    </Label>
                                    <SearchableSelect
                                        id="user"
                                        value={data.user}
                                        onChange={(value) => setData('user', value)}
                                        options={[{ id: '', name: 'Team' }, ...teamMembers]}
                                        placeholder="Select team member"
                                        disabled={processing}
                                        icon={<User className="h-4 w-4 text-muted-foreground" />}
                                    />
                                </div>

                                <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-1">
                                    <Label htmlFor="is-paid" className="text-xs font-medium">
                                        Payment Status
                                    </Label>
                                    <SearchableSelect
                                        id="is-paid"
                                        value={data['is-paid']}
                                        onChange={(value) => setData('is-paid', value)}
                                        options={[
                                            { id: '', name: 'All Statuses' },
                                            { id: 'true', name: 'Paid' },
                                            { id: 'false', name: 'Unpaid' },
                                        ]}
                                        placeholder="Select status"
                                        disabled={processing}
                                        icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
                                    />
                                </div>
                                <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-1">
                                    <Label htmlFor="status" className="text-xs font-medium">
                                        Approval Status
                                    </Label>
                                    <SearchableSelect
                                        id="status"
                                        value={data.status}
                                        onChange={(value) => setData('status', value)}
                                        options={[
                                            { id: '', name: 'All Statuses' },
                                            { id: 'pending', name: 'Pending' },
                                            { id: 'approved', name: 'Approved' },
                                            { id: 'rejected', name: 'Rejected' },
                                        ]}
                                        placeholder="Select approval status"
                                        disabled={processing}
                                        icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
                                    />
                                </div>
                                <div className="flex items-end gap-2">
                                    <Button
                                        type="submit"
                                        className="flex h-9 w-9 items-center justify-center p-0"
                                        title="Apply filters"
                                        disabled={processing}
                                    >
                                        <Search className="h-4 w-4" />
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={
                                            processing || (!data['start-date'] && !data['end-date'] && !data.user && !data['is-paid'] && !data.status)
                                        }
                                        onClick={() => {
                                            setData({
                                                'start-date': '',
                                                'end-date': '',
                                                user: '',
                                                'is-paid': '',
                                                status: '',
                                            })
                                            get(route('project.time-logs', project.id), {
                                                preserveState: true,
                                            })
                                        }}
                                        className="flex h-9 w-9 items-center justify-center p-0"
                                        title="Clear filters"
                                    >
                                        <TimerReset className="h-4 w-4" />
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {timeLogs.length > 0 ? (
                            <TimeLogTable
                                timeLogs={timeLogs as TimeLogEntry[]}
                                showCheckboxes={isCreator}
                                showTeamMember={true}
                                showProject={false}
                                showActions={true}
                                showEditDelete={false}
                                selectedLogs={selectedLogs}
                                onSelectLog={handleSelectLog}
                            />
                        ) : (
                            <div className="rounded-md border bg-muted/5 p-6">
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <ClockIcon className="mb-4 h-12 w-12 text-muted-foreground/50" />
                                    <h3 className="mb-1 text-lg font-medium">No Time Logs</h3>
                                    <p className="mb-4 text-muted-foreground">No time logs have been added to this project yet.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Tasks Card */}
                <Card className="overflow-hidden transition-all hover:shadow-md">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl">{project.name} - Tasks</CardTitle>
                                <CardDescription>
                                    {tasks.length > 0
                                        ? `Showing ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`
                                        : 'No tasks found for this project'}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link href={`/task/create?project_id=${project.id}`}>
                                    <Button className="flex items-center gap-2">
                                        <Plus className="h-4 w-4" />
                                        <span>Add Task</span>
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {tasks.length > 0 ? (
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
                                            <TableCell className="font-medium">{task.title}</TableCell>
                                            <TableCell>
                                                {task.status === 'completed' && (
                                                    <Badge variant="success" className="capitalize">
                                                        {task.status.replace('_', ' ')}
                                                    </Badge>
                                                )}
                                                {task.status === 'in_progress' && (
                                                    <Badge variant="warning" className="capitalize">
                                                        {task.status.replace('_', ' ')}
                                                    </Badge>
                                                )}
                                                {task.status === 'pending' && (
                                                    <Badge variant="secondary" className="capitalize">
                                                        {task.status.replace('_', ' ')}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {task.priority === 'high' && (
                                                    <Badge variant="destructive" className="capitalize">
                                                        {task.priority}
                                                    </Badge>
                                                )}
                                                {task.priority === 'medium' && (
                                                    <Badge variant="default" className="capitalize">
                                                        {task.priority}
                                                    </Badge>
                                                )}
                                                {task.priority === 'low' && (
                                                    <Badge variant="outline" className="capitalize">
                                                        {task.priority}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {task.due_date ? (
                                                    new Date(task.due_date).toLocaleDateString()
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
                                                    <Link href={route('task.edit', task.id)}>
                                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                                            <Edit className="h-3.5 w-3.5" />
                                                            <span className="sr-only">Edit</span>
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="rounded-md border bg-muted/5 p-6">
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground/50" />
                                    <h3 className="mb-1 text-lg font-medium">No Tasks</h3>
                                    <p className="mb-4 text-muted-foreground">No tasks have been added to this project yet.</p>
                                    <Link href={`/task/create?project_id=${project.id}`}>
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
            </div>
        </MasterLayout>
    )
}
