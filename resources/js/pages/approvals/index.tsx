import ApprovalTimeLogTable from '@/components/approval-time-log-table'
import StatsCard from '@/components/dashboard/StatsCard'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import CustomInput from '@/components/ui/custom-input'
import DatePicker from '@/components/ui/date-picker'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Textarea } from '@/components/ui/textarea'
import MasterLayout from '@/layouts/master-layout'
import { roundToTwoDecimals } from '@/lib/utils'
import { type BreadcrumbItem } from '@/types'
import { Head, useForm } from '@inertiajs/react'
import axios from 'axios'
import { AlertCircle, Briefcase, Calendar, CalendarRange, CheckCircle, CheckSquare, ClockIcon, Search, TimerReset, User } from 'lucide-react'
import { FormEventHandler, useState } from 'react'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Approvals',
        href: '/approvals',
    },
]

type TimeLog = {
    id: number
    user_id: number
    user_name: string
    project_id: number
    project_name: string | null
    start_timestamp: string
    end_timestamp: string
    duration: number
    status: 'pending' | 'approved' | 'rejected'
}

type Filters = {
    'start-date': string
    'end-date': string
    project: string
    user: string
}

type Project = {
    id: number
    name: string
}

type TeamMember = {
    id: number
    name: string
    email: string
}

type Props = {
    timeLogs: TimeLog[]
    filters: Filters
    projects: Project[]
    teamMembers: TeamMember[]
    totalDuration: number
}

export default function Approvals({ timeLogs, filters, projects, teamMembers, totalDuration }: Props) {
    const { data, setData, get, processing } = useForm<Filters>({
        'start-date': filters['start-date'] || '',
        'end-date': filters['end-date'] || '',
        project: filters.project || '',
        user: filters.user || '',
    })

    const [selectedLogs, setSelectedLogs] = useState<number[]>([])
    const [approveDialogOpen, setApproveDialogOpen] = useState(false)
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [singleApprovalId, setSingleApprovalId] = useState<number | null>(null)
    const [comment, setComment] = useState('')
    const [approving, setApproving] = useState(false)
    const [approvalSuccess, setApprovalSuccess] = useState<string | null>(null)
    const [approvalError, setApprovalError] = useState<string | null>(null)

    const handleSelectLog = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedLogs([...selectedLogs, id])
        } else {
            setSelectedLogs(selectedLogs.filter((logId) => logId !== id))
        }
    }

    const openSingleApproveDialog = (id: number) => {
        setSingleApprovalId(id)
        setComment('')
        setApprovalSuccess(null)
        setApprovalError(null)
        setApproveDialogOpen(true)
    }

    const openSingleRejectDialog = (id: number) => {
        setSingleApprovalId(id)
        setComment('')
        setApprovalSuccess(null)
        setApprovalError(null)
        setRejectDialogOpen(true)
    }

    const openBulkApproveDialog = () => {
        if (selectedLogs.length === 0) return
        setSingleApprovalId(null)
        setComment('')
        setApprovalSuccess(null)
        setApprovalError(null)
        setApproveDialogOpen(true)
    }

    const openBulkRejectDialog = () => {
        if (selectedLogs.length === 0) return
        setSingleApprovalId(null)
        setComment('')
        setApprovalSuccess(null)
        setApprovalError(null)
        setRejectDialogOpen(true)
    }

    const closeApproveDialog = () => {
        setApproveDialogOpen(false)
        setSingleApprovalId(null)
        setComment('')
    }

    const closeRejectDialog = () => {
        setRejectDialogOpen(false)
        setSingleApprovalId(null)
        setComment('')
    }

    const handleApprove = async () => {
        setApproving(true)
        setApprovalSuccess(null)
        setApprovalError(null)

        try {
            let response
            if (singleApprovalId) {
                // Approve single time log
                response = await axios.post(route('approvals.approve'), {
                    time_log_id: singleApprovalId,
                    comment: comment,
                })
            } else {
                // Approve multiple time logs
                response = await axios.post(route('approvals.approve-multiple'), {
                    time_log_ids: selectedLogs,
                    comment: comment,
                })
            }

            setApprovalSuccess(response.data.message)

            // Refresh the page after a short delay
            setTimeout(() => {
                get(route('approvals.index'), { preserveState: true })
                closeApproveDialog()
                setSelectedLogs([])
            }, 1500)
        } catch (error) {
            const axiosError = error as {
                response?: {
                    data?: {
                        message?: string
                    }
                }
            }

            if (axiosError.response && axiosError.response.data && axiosError.response.data.message) {
                setApprovalError(axiosError.response.data.message)
            } else {
                setApprovalError('An unexpected error occurred. Please try again.')
            }
        } finally {
            setApproving(false)
        }
    }

    const handleReject = async () => {
        setApproving(true)
        setApprovalSuccess(null)
        setApprovalError(null)

        try {
            let response
            if (singleApprovalId) {
                // Reject single time log
                response = await axios.post(route('approvals.reject'), {
                    time_log_id: singleApprovalId,
                    comment: comment,
                })
            } else {
                // Reject multiple time logs
                response = await axios.post(route('approvals.reject-multiple'), {
                    time_log_ids: selectedLogs,
                    comment: comment,
                })
            }

            setApprovalSuccess(response.data.message)

            // Refresh the page after a short delay
            setTimeout(() => {
                get(route('approvals.index'), { preserveState: true })
                closeRejectDialog()
                setSelectedLogs([])
            }, 1500)
        } catch (error) {
            const axiosError = error as {
                response?: {
                    data?: {
                        message?: string
                    }
                }
            }

            if (axiosError.response && axiosError.response.data && axiosError.response.data.message) {
                setApprovalError(axiosError.response.data.message)
            } else {
                setApprovalError('An unexpected error occurred. Please try again.')
            }
        } finally {
            setApproving(false)
        }
    }

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
        get(route('approvals.index'), {
            preserveState: true,
        })
    }

    return (
        <MasterLayout breadcrumbs={breadcrumbs}>
            <Head title="Approvals" />
            <div className="mx-auto flex flex-col gap-6 p-3">
                <section className="mb-2">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Pending Approvals</h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Approve or reject time logs from your team members</p>
                </section>

                {timeLogs.length > 0 && (
                    <section className="mb-4 w-3/12">
                        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Metrics Dashboard</h3>
                        <StatsCard
                            title="Total Hours"
                            icon={<ClockIcon className="h-4 w-4 text-muted-foreground" />}
                            value={roundToTwoDecimals(totalDuration)}
                            description="Total pending hours to be approved"
                            borderColor="blue-500"
                        />
                    </section>
                )}

                <Card className="transition-all hover:shadow-md">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl">Pending Approvals</CardTitle>
                                <CardDescription>
                                    {timeLogs.length > 0
                                        ? `Showing ${timeLogs.length} pending ${timeLogs.length === 1 ? 'entry' : 'entries'}`
                                        : 'No pending approvals found for the selected period'}
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                {selectedLogs.length > 0 && (
                                    <>
                                        <Button onClick={openBulkApproveDialog} variant="default" className="flex items-center gap-2">
                                            <CheckSquare className="h-4 w-4" />
                                            <span>Approve Selected ({selectedLogs.length})</span>
                                        </Button>
                                        <Button onClick={openBulkRejectDialog} variant="destructive" className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            <span>Reject Selected ({selectedLogs.length})</span>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Filter form */}
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
                                    <Label htmlFor="project" className="text-xs font-medium">
                                        Project
                                    </Label>
                                    <SearchableSelect
                                        id="project"
                                        value={data.project}
                                        onChange={(value) => setData('project', value)}
                                        options={[{ id: '', name: 'All Projects' }, ...projects]}
                                        placeholder="Select project"
                                        disabled={processing}
                                        icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
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
                                        options={[{ id: '', name: 'All Members' }, ...teamMembers]}
                                        placeholder="Select member"
                                        disabled={processing}
                                        icon={<User className="h-4 w-4 text-muted-foreground" />}
                                    />
                                </div>

                                <div className="flex items-end gap-2">
                                    <Button type="submit" size="icon" className="h-9 w-9" title="Filter" disabled={processing}>
                                        <Search className="h-4 w-4" />
                                        <span className="sr-only">Filter</span>
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        disabled={processing || (!data['start-date'] && !data['end-date'] && !data.project && !data.user)}
                                        onClick={() => {
                                            setData({
                                                'start-date': '',
                                                'end-date': '',
                                                project: '',
                                                user: '',
                                            })
                                            get(route('approvals.index'), {
                                                preserveState: true,
                                            })
                                        }}
                                        className="h-9 w-9"
                                        title="Clear Filters"
                                    >
                                        <TimerReset className="h-4 w-4" />
                                        <span className="sr-only">Clear</span>
                                    </Button>
                                </div>
                            </form>

                            <div className="mt-4 text-sm text-muted-foreground">
                                {(data['start-date'] || data['end-date'] || data.project || data.user) && (
                                    <CardDescription>
                                        {(() => {
                                            let description = ''

                                            if (data['start-date'] && data['end-date']) {
                                                description = `Showing logs from ${data['start-date']} to ${data['end-date']}`
                                            } else if (data['start-date']) {
                                                description = `Showing logs from ${data['start-date']}`
                                            } else if (data['end-date']) {
                                                description = `Showing logs until ${data['end-date']}`
                                            }

                                            if (data.project) {
                                                const selectedProject = projects.find((project) => project.id.toString() === data.project)
                                                const projectName = selectedProject ? selectedProject.name : ''

                                                if (description) {
                                                    description += ` for ${projectName}`
                                                } else {
                                                    description = `Showing logs for ${projectName}`
                                                }
                                            }

                                            if (data.user) {
                                                const selectedMember = teamMembers.find((member) => member.id.toString() === data.user)
                                                const memberName = selectedMember ? selectedMember.name : ''

                                                if (description) {
                                                    description += ` by ${memberName}`
                                                } else {
                                                    description = `Showing logs by ${memberName}`
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
                        {timeLogs.length > 0 ? (
                            <ApprovalTimeLogTable
                                timeLogs={timeLogs}
                                showCheckboxes={true}
                                selectedLogs={selectedLogs}
                                onSelectLog={handleSelectLog}
                                onApprove={openSingleApproveDialog}
                                onReject={openSingleRejectDialog}
                            />
                        ) : (
                            <div className="rounded-md border bg-muted/5 p-6">
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <ClockIcon className="mb-4 h-12 w-12 text-muted-foreground/50" />
                                    <h3 className="mb-1 text-lg font-medium">No Pending Approvals</h3>
                                    <p className="mb-4 text-muted-foreground">There are no pending time logs that require your approval.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Approve Dialog */}
                <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{singleApprovalId ? 'Approve Time Log' : `Approve ${selectedLogs.length} Time Logs`}</DialogTitle>
                            <DialogDescription>
                                {singleApprovalId
                                    ? 'Add an optional comment and approve this time log.'
                                    : `You are about to approve ${selectedLogs.length} time logs. Add an optional comment.`}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="comment">Comment (Optional)</Label>
                                <Textarea
                                    id="comment"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Add a comment about this approval"
                                    disabled={approving}
                                />
                            </div>

                            {approvalSuccess && (
                                <Alert className="border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/20">
                                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    <AlertTitle className="text-green-800 dark:text-green-400">Success</AlertTitle>
                                    <AlertDescription className="text-green-700 dark:text-green-400">{approvalSuccess}</AlertDescription>
                                </Alert>
                            )}

                            {approvalError && (
                                <Alert className="border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/20">
                                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    <AlertTitle className="text-red-800 dark:text-red-400">Error</AlertTitle>
                                    <AlertDescription className="text-red-700 dark:text-red-400">{approvalError}</AlertDescription>
                                </Alert>
                            )}
                        </div>
                        <DialogFooter className="sm:justify-between">
                            <Button type="button" variant="secondary" onClick={closeApproveDialog} disabled={approving}>
                                Cancel
                            </Button>
                            <Button type="button" onClick={handleApprove} disabled={approving} className="bg-green-600 text-white hover:bg-green-700">
                                {approving ? 'Approving...' : 'Approve'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Reject Dialog */}
                <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{singleApprovalId ? 'Reject Time Log' : `Reject ${selectedLogs.length} Time Logs`}</DialogTitle>
                            <DialogDescription>
                                {singleApprovalId
                                    ? "Add a comment explaining why you're rejecting this time log."
                                    : `You are about to reject ${selectedLogs.length} time logs. Add a comment explaining why.`}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="reject-comment">Comment</Label>
                                <Textarea
                                    id="reject-comment"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={
                                        singleApprovalId
                                            ? "Explain why you're rejecting this time log"
                                            : "Explain why you're rejecting these time logs"
                                    }
                                    disabled={approving}
                                    required
                                />
                            </div>

                            {approvalSuccess && (
                                <Alert className="border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/20">
                                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    <AlertTitle className="text-green-800 dark:text-green-400">Success</AlertTitle>
                                    <AlertDescription className="text-green-700 dark:text-green-400">{approvalSuccess}</AlertDescription>
                                </Alert>
                            )}

                            {approvalError && (
                                <Alert className="border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/20">
                                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    <AlertTitle className="text-red-800 dark:text-red-400">Error</AlertTitle>
                                    <AlertDescription className="text-red-700 dark:text-red-400">{approvalError}</AlertDescription>
                                </Alert>
                            )}
                        </div>
                        <DialogFooter className="sm:justify-between">
                            <Button type="button" variant="secondary" onClick={closeRejectDialog} disabled={approving}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleReject}
                                disabled={approving || !comment.trim()}
                                className="bg-red-600 text-white hover:bg-red-700"
                            >
                                {approving ? 'Rejecting...' : 'Reject'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </MasterLayout>
    )
}
