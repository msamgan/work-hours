import { ActionButton, ActionButtonGroup, ExportButton } from '@/components/action-buttons'
import DeleteProject from '@/components/delete-project'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import CustomInput from '@/components/ui/custom-input'
import DatePicker from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableHeaderRow, TableRow } from '@/components/ui/table'
import MasterLayout from '@/layouts/master-layout'
import { objectToQueryString, parseDate, queryStringToObject } from '@/lib/utils'
import { type BreadcrumbItem } from '@/types'
import { syncRepository } from '@actions/GitHubRepositoryController'
import { projects as _projects } from '@actions/ProjectController'
import { syncTrelloProject } from '@actions/TrelloBoardController'
import { Head, Link, usePage } from '@inertiajs/react'
import {
    Briefcase,
    Calendar,
    CalendarRange,
    Clock,
    Edit,
    FolderPlus,
    Folders,
    GithubIcon,
    Loader2,
    Search,
    TimerReset,
    TrelloIcon,
    User,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Projects',
        href: '/project',
    },
]

type TeamMember = {
    id: number
    name: string
    email: string
}

type Project = {
    id: number
    name: string
    description: string | null
    team_members: TeamMember[]
    approvers: TeamMember[]
    user: {
        id: number
        name: string
        email: string
    }
    client: Client | null
    repo_id: string | null
    source: string | null
}

type Client = {
    id: number
    name: string
}

type ProjectFilters = {
    client: string
    'team-member': string
    'created-date-from': string | Date | null
    'created-date-to': string | Date | null
    search: string
}

type Props = {
    projects: Project[]
    auth: {
        user: {
            id: number
        }
    }
    filters: ProjectFilters
    clients: Client[]
    teamMembers: TeamMember[]
}

export default function Projects() {
    const { auth, filters: pageFilters, clients, teamMembers } = usePage<Props>().props
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<boolean>(false)
    const [processing, setProcessing] = useState(false)

    // Filter states
    const [filters, setFilters] = useState<ProjectFilters>({
        client: pageFilters?.client || '',
        'team-member': pageFilters?.['team-member'] || '',
        'created-date-from': pageFilters?.['created-date-from'] || null,
        'created-date-to': pageFilters?.['created-date-to'] || null,
        search: pageFilters?.search || '',
    })

    const handleFilterChange = (key: keyof ProjectFilters, value: string | number | Date | null): void => {
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    const clearFilters = (): void => {
        setFilters({
            client: '',
            'team-member': '',
            'created-date-from': null,
            'created-date-to': null,
            search: '',
        })
    }

    const getProjects = async (filters?: ProjectFilters): Promise<void> => {
        setLoading(true)
        setError(false)
        setProcessing(true)
        try {
            setProjects(
                await _projects.data({
                    params: filters,
                }),
            )
        } catch (error) {
            console.error('Error fetching projects:', error)
            setError(true)
        } finally {
            setLoading(false)
            setProcessing(false)
        }
    }

    const formatDateValue = (dateValue: Date | string | null): string => {
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

        if (formattedFilters['created-date-from'] instanceof Date) {
            const year = formattedFilters['created-date-from'].getFullYear()
            const month = String(formattedFilters['created-date-from'].getMonth() + 1).padStart(2, '0')
            const day = String(formattedFilters['created-date-from'].getDate()).padStart(2, '0')
            formattedFilters['created-date-from'] = `${year}-${month}-${day}`
        }

        if (formattedFilters['created-date-to'] instanceof Date) {
            const year = formattedFilters['created-date-to'].getFullYear()
            const month = String(formattedFilters['created-date-to'].getMonth() + 1).padStart(2, '0')
            const day = String(formattedFilters['created-date-to'].getDate()).padStart(2, '0')
            formattedFilters['created-date-to'] = `${year}-${month}-${day}`
        }

        const filtersString = objectToQueryString(formattedFilters)

        getProjects(formattedFilters).then(() => {
            window.history.pushState({}, '', `?${filtersString}`)
        })
    }

    useEffect(() => {
        const queryParams = queryStringToObject()

        const initialFilters: ProjectFilters = {
            client: queryParams.client || '',
            'team-member': queryParams['team-member'] || '',
            'created-date-from': queryParams['created-date-from'] || null,
            'created-date-to': queryParams['created-date-to'] || null,
            search: queryParams.search || '',
        }

        setFilters(initialFilters)
        getProjects(initialFilters).then()
    }, [])

    return (
        <MasterLayout breadcrumbs={breadcrumbs}>
            <Head title="Projects" />
            <div className="mx-auto flex flex-col gap-6 p-3">
                {/* Header section */}
                <section className="mb-2">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Project Management</h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Manage your projects</p>
                </section>

                <Card className="overflow-hidden transition-all hover:shadow-md">
                    <CardHeader className="">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl">Projects</CardTitle>
                                <CardDescription>
                                    {loading ? 'Loading projects...' : error ? 'Failed to load projects' : `You have ${projects.length} projects`}
                                </CardDescription>

                                {(filters.client ||
                                    filters['team-member'] ||
                                    filters['created-date-from'] ||
                                    filters['created-date-to'] ||
                                    filters.search) && (
                                    <CardDescription className="mt-1">
                                        {(() => {
                                            let description = ''

                                            if (filters['created-date-from'] && filters['created-date-to']) {
                                                description = `Showing projects from ${formatDateValue(filters['created-date-from'])} to ${formatDateValue(filters['created-date-to'])}`
                                            } else if (filters['created-date-from']) {
                                                description = `Showing projects from ${formatDateValue(filters['created-date-from'])}`
                                            } else if (filters['created-date-to']) {
                                                description = `Showing projects until ${formatDateValue(filters['created-date-to'])}`
                                            }

                                            if (filters.client) {
                                                const client = clients.find((c) => c.id.toString() === filters.client)
                                                if (client) {
                                                    if (description) {
                                                        description += ` for client "${client.name}"`
                                                    } else {
                                                        description = `Showing projects for client "${client.name}"`
                                                    }
                                                }
                                            }

                                            if (filters['team-member']) {
                                                const member = teamMembers.find((m) => m.id.toString() === filters['team-member'])
                                                if (member) {
                                                    if (description) {
                                                        description += ` with team member "${member.name}"`
                                                    } else {
                                                        description = `Showing projects with team member "${member.name}"`
                                                    }
                                                }
                                            }

                                            if (filters.search) {
                                                if (description) {
                                                    description += ` matching "${filters.search}"`
                                                } else {
                                                    description = `Showing projects matching "${filters.search}"`
                                                }
                                            }

                                            return description
                                        })()}
                                    </CardDescription>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <ExportButton
                                    href={`${route('project.export')}?team-member=${filters['team-member'] || ''}&client=${filters.client || ''}&created-date-from=${formatDateValue(filters['created-date-from'])}&created-date-to=${formatDateValue(filters['created-date-to'])}&search=${filters.search || ''}`}
                                    label="Export"
                                />
                                <Link href={route('project.create')}>
                                    <Button className="flex items-center gap-2">
                                        <FolderPlus className="h-4 w-4" />
                                        <span>Add Project</span>
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="mt-4 border-t pt-4">
                            <form onSubmit={handleSubmit} className="flex w-full flex-row flex-wrap gap-4">
                                <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-1">
                                    <Label htmlFor="search" className="text-xs font-medium">
                                        Search
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="search"
                                            placeholder="Search"
                                            className="pl-9"
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                        />
                                        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                            <Search className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-1">
                                    <Label htmlFor="client" className="text-xs font-medium">
                                        Client
                                    </Label>
                                    <SearchableSelect
                                        id="client"
                                        value={filters.client}
                                        onChange={(value) => handleFilterChange('client', value)}
                                        options={[
                                            { id: '', name: 'All Clients' },
                                            ...clients.map((client) => ({
                                                id: client.id.toString(),
                                                name: client.name,
                                            })),
                                        ]}
                                        placeholder="All Clients"
                                        disabled={processing}
                                        icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
                                    />
                                </div>

                                <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-1">
                                    <Label htmlFor="team-member" className="text-xs font-medium">
                                        Team Member
                                    </Label>
                                    <SearchableSelect
                                        id="team-member"
                                        value={filters['team-member']}
                                        onChange={(value) => handleFilterChange('team-member', value)}
                                        options={[
                                            { id: '', name: 'All Team Members' },
                                            ...teamMembers.map((member) => ({
                                                id: member.id.toString(),
                                                name: member.name,
                                            })),
                                        ]}
                                        placeholder="All Team Members"
                                        disabled={processing}
                                        icon={<User className="h-4 w-4 text-muted-foreground" />}
                                    />
                                </div>

                                <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-1">
                                    <Label htmlFor="created-date-from" className="text-xs font-medium">
                                        Created Date From
                                    </Label>
                                    <DatePicker
                                        selected={parseDate(filters['created-date-from'])}
                                        onChange={(date) => handleFilterChange('created-date-from', date)}
                                        dateFormat="yyyy-MM-dd"
                                        isClearable
                                        disabled={processing}
                                        customInput={
                                            <CustomInput
                                                id="created-date-from"
                                                icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                                                disabled={processing}
                                                placeholder="Select start date"
                                            />
                                        }
                                    />
                                </div>

                                <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-1">
                                    <Label htmlFor="created-date-to" className="text-xs font-medium">
                                        Created Date To
                                    </Label>
                                    <DatePicker
                                        selected={parseDate(filters['created-date-to'])}
                                        onChange={(date) => handleFilterChange('created-date-to', date)}
                                        dateFormat="yyyy-MM-dd"
                                        isClearable
                                        disabled={processing}
                                        customInput={
                                            <CustomInput
                                                id="created-date-to"
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
                                            processing ||
                                            (!filters.client &&
                                                !filters['team-member'] &&
                                                !filters['created-date-from'] &&
                                                !filters['created-date-to'] &&
                                                !filters.search)
                                        }
                                        onClick={clearFilters}
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
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Loader2 className="mb-4 h-12 w-12 animate-spin text-muted-foreground/50" />
                                <h3 className="mb-1 text-lg font-medium">Loading Projects</h3>
                                <p className="mb-4 text-muted-foreground">Please wait while we fetch your projects...</p>
                            </div>
                        ) : error ? (
                            <div className="rounded-md border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Folders className="mb-4 h-12 w-12 text-red-500" />
                                    <h3 className="mb-1 text-lg font-medium text-red-700 dark:text-red-400">Failed to Load Projects</h3>
                                    <p className="mb-4 text-red-600 dark:text-red-300">There was an error loading your projects. Please try again.</p>
                                    <Button onClick={() => getProjects()} className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4" />
                                        <span>Retry</span>
                                    </Button>
                                </div>
                            </div>
                        ) : projects.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableHeaderRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Owner</TableHead>
                                        <TableHead>Team Members</TableHead>
                                        <TableHead>Approvers</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableHeaderRow>
                                </TableHeader>
                                <TableBody>
                                    {projects.map((project) => (
                                        <TableRow key={project.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {project.source === 'github' && project.repo_id ? (
                                                        <GithubIcon className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                                                    ) : project.source === 'trello' && project.repo_id ? (
                                                        <TrelloIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                                    ) : null}
                                                    {project.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {project.client ? project.client.name : <span className="text-muted-foreground/50">No client</span>}
                                            </TableCell>
                                            <TableCell className="font-medium">{project.user.name}</TableCell>
                                            <TableCell>
                                                {project.team_members && project.team_members.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {project.team_members.map((member) => (
                                                            <span
                                                                key={member.id}
                                                                className="inline-flex items-center bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30"
                                                                title={member.email}
                                                            >
                                                                {member.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground/50">No team members</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {project.approvers && project.approvers.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {project.approvers.map((approver) => (
                                                            <span
                                                                key={approver.id}
                                                                className="inline-flex items-center bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-700/10 ring-inset dark:bg-green-400/10 dark:text-green-400 dark:ring-green-400/30"
                                                                title={approver.email}
                                                            >
                                                                {approver.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground/50">No approvers</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {project.user.id === auth.user.id && (
                                                        <ActionButtonGroup>
                                                            <ActionButton
                                                                href={route('project.time-logs', project.id)}
                                                                title="View Time Logs"
                                                                icon={Clock}
                                                                label="Logs"
                                                                variant="blue"
                                                            />
                                                            {project.source === 'github' && project.repo_id && (
                                                                <Button
                                                                    onClick={(e) => {
                                                                        e.preventDefault()
                                                                        setLoading(true)

                                                                        syncRepository
                                                                            .call({
                                                                                params: { project: project.id },
                                                                            })
                                                                            .then((response) => response.json())
                                                                            .then((data) => {
                                                                                if (data.success) {
                                                                                    toast.success('Project synced successfully!')
                                                                                    getProjects(filters).then()
                                                                                } else {
                                                                                    console.error('Error syncing project:', data.error)
                                                                                    setLoading(false)
                                                                                }
                                                                            })
                                                                            .catch(() => {
                                                                                setLoading(false)
                                                                            })
                                                                    }}
                                                                    title="Sync with GitHub"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-7 border-purple-200 bg-purple-50 text-xs text-purple-700 shadow-sm transition-all hover:bg-purple-100 dark:border-purple-700 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:bg-purple-900/30"
                                                                >
                                                                    <GithubIcon className="mr-1 h-3 w-3" />
                                                                </Button>
                                                            )}
                                                            {project.source === 'trello' && project.repo_id && (
                                                                <Button
                                                                    onClick={(e) => {
                                                                        e.preventDefault()
                                                                        setLoading(true)

                                                                        syncTrelloProject
                                                                            .call({
                                                                                params: { project: project.id },
                                                                            })
                                                                            .then((response) => response.json())
                                                                            .then((data) => {
                                                                                if (data.success) {
                                                                                    toast.success('Project synced successfully!')
                                                                                    getProjects(filters).then()
                                                                                } else {
                                                                                    console.error('Error syncing project:', data.error)
                                                                                    setLoading(false)
                                                                                }
                                                                            })
                                                                            .catch(() => {
                                                                                setLoading(false)
                                                                            })
                                                                    }}
                                                                    title="Sync with Trello"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-7 border-blue-200 bg-blue-50 text-xs text-blue-700 shadow-sm transition-all hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
                                                                >
                                                                    <TrelloIcon className="mr-1 h-3 w-3" />
                                                                </Button>
                                                            )}
                                                            <ActionButton
                                                                href={route('project.edit', project.id)}
                                                                title="Edit Project"
                                                                icon={Edit}
                                                                variant="amber"
                                                            />
                                                            <DeleteProject projectId={project.id} onDelete={() => getProjects(filters)} />
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
                                    <Folders className="mb-4 h-12 w-12 text-muted-foreground/50" />
                                    <h3 className="mb-1 text-lg font-medium">No Projects</h3>
                                    <p className="mb-4 text-muted-foreground">You haven't added any projects yet.</p>
                                    <Link href={route('project.create')}>
                                        <Button className="flex items-center gap-2">
                                            <FolderPlus className="h-4 w-4" />
                                            <span>Add Project</span>
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
