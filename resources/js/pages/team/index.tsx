import { ActionButton, ActionButtonGroup, ExportButton } from '@/components/action-buttons'
import DeleteTeamMember from '@/components/delete-team-member'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import CustomInput from '@/components/ui/custom-input'
import DatePicker from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableHeaderRow, TableRow } from '@/components/ui/table'
import MasterLayout from '@/layouts/master-layout'
import { roundToTwoDecimals } from '@/lib/utils'
import { type BreadcrumbItem } from '@/types'
import { Head, Link, useForm } from '@inertiajs/react'
import { Calendar, CalendarRange, Clock, Edit, Search, TimerReset, UserPlus, Users } from 'lucide-react'
import { FormEventHandler } from 'react'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Team',
        href: '/team',
    },
]

type TeamMember = {
    id: number
    name: string
    email: string
    hourly_rate: number
    currency: string
    non_monetary: boolean
    totalHours: number
    weeklyAverage: number
    unpaidHours: number
    unpaidAmount: number
}

type Filters = {
    'start-date': string
    'end-date': string
    search: string
}

type Props = {
    teamMembers: TeamMember[]
    filters: Filters
}

export default function Team({ teamMembers, filters }: Props) {
    const { data, setData, get, processing } = useForm<Filters>({
        'start-date': filters['start-date'] || '',
        'end-date': filters['end-date'] || '',
        search: filters.search || '',
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
        get(route('team.index'), {
            preserveState: true,
        })
    }

    return (
        <MasterLayout breadcrumbs={breadcrumbs}>
            <Head title="Team" />
            <div className="mx-auto flex flex-col gap-6 p-3">
                <section className="mb-2">
                    <div className="mb-2 flex items-center justify-between">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Team Management</h1>
                        <Link href={route('team.all-time-logs')}>
                            <Button
                                variant="outline"
                                className="flex items-center gap-2 border-blue-200 bg-blue-50 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
                            >
                                <Clock className="h-4 w-4" />
                                <span>All Time Logs</span>
                            </Button>
                        </Link>
                    </div>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Manage your team members and their time logs</p>
                </section>

                <Card className="transition-all hover:shadow-md">
                    <CardHeader className="">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl">Team Members</CardTitle>
                                <CardDescription>You have {teamMembers.length} team members</CardDescription>

                                {(data['start-date'] || data['end-date'] || data.search) && (
                                    <CardDescription className="mt-1">
                                        {(() => {
                                            let description = ''

                                            if (data['start-date'] && data['end-date']) {
                                                description = `Showing team data from ${data['start-date']} to ${data['end-date']}`
                                            } else if (data['start-date']) {
                                                description = `Showing team data from ${data['start-date']}`
                                            } else if (data['end-date']) {
                                                description = `Showing team data until ${data['end-date']}`
                                            }

                                            if (data.search) {
                                                if (description) {
                                                    description += ` matching "${data.search}"`
                                                } else {
                                                    description = `Showing team members matching "${data.search}"`
                                                }
                                            }

                                            return description
                                        })()}
                                    </CardDescription>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <ExportButton href={route('team.export') + window.location.search} label="Export" />
                                <Link href={route('team.create')}>
                                    <Button className="flex items-center gap-2">
                                        <UserPlus className="h-4 w-4" />
                                        <span>Add Member</span>
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="mt-4 border-t pt-4">
                            <form onSubmit={submit} className="flex w-full flex-row gap-4">
                                <div className="flex w-full flex-col gap-1">
                                    <Label htmlFor="search" className="text-xs font-medium">
                                        Search
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="search"
                                            type="text"
                                            value={data.search}
                                            onChange={(e) => setData('search', e.target.value)}
                                            placeholder="Search by name or email"
                                            className="pl-9"
                                        />
                                        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                            <Search className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex w-full flex-col gap-1">
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
                                <div className="flex w-full flex-col gap-1">
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
                                <div className="flex items-end gap-2">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="flex h-9 w-9 items-center justify-center p-0"
                                        title="Apply filters"
                                    >
                                        <Search className="h-4 w-4" />
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={processing || (!data['start-date'] && !data['end-date'] && !data.search)}
                                        onClick={() => {
                                            setData({
                                                'start-date': '',
                                                'end-date': '',
                                                search: '',
                                            })
                                            get(route('team.index'), {
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
                        {teamMembers.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableHeaderRow>
                                        <TableHead>Name / Email</TableHead>
                                        <TableHead>Hourly Rate</TableHead>
                                        <TableHead>Currency</TableHead>
                                        <TableHead>Total Hours</TableHead>
                                        <TableHead>Unpaid Hours</TableHead>
                                        <TableHead>Unpaid Amount</TableHead>
                                        <TableHead>Weekly Average</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableHeaderRow>
                                </TableHeader>
                                <TableBody>
                                    {teamMembers.map((member) => (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                <div className="font-medium">{member.name}</div>
                                                <div className="text-xs text-muted-foreground">{member.email}</div>
                                            </TableCell>
                                            <TableCell>{member.non_monetary ? '-' : member.hourly_rate}</TableCell>
                                            <TableCell>{member.non_monetary ? '-' : member.currency}</TableCell>
                                            <TableCell>{roundToTwoDecimals(member.totalHours)}</TableCell>
                                            <TableCell>{roundToTwoDecimals(member.unpaidHours)}</TableCell>
                                            <TableCell>
                                                {member.non_monetary ? '-' : `${member.currency} ${roundToTwoDecimals(member.unpaidAmount)}`}
                                            </TableCell>
                                            <TableCell>{roundToTwoDecimals(member.weeklyAverage)}</TableCell>
                                            <TableCell className="text-right">
                                                <ActionButtonGroup>
                                                    <ActionButton
                                                        href={route('team.time-logs', member.id)}
                                                        title="View Time Logs"
                                                        icon={Clock}
                                                        label="Logs"
                                                        variant="blue"
                                                    />
                                                    <ActionButton
                                                        href={route('team.edit', member.id)}
                                                        title="Edit Member"
                                                        icon={Edit}
                                                        variant="amber"
                                                        size="icon"
                                                    />
                                                    <DeleteTeamMember userId={member.id} />
                                                </ActionButtonGroup>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="rounded-md border bg-muted/5 p-6">
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
                                    <h3 className="mb-1 text-lg font-medium">No Team Members</h3>
                                    <p className="mb-4 text-muted-foreground">You haven't added any team members yet.</p>
                                    <Link href={route('team.create')}>
                                        <Button className="flex items-center gap-2">
                                            <UserPlus className="h-4 w-4" />
                                            <span>Add Team Member</span>
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
