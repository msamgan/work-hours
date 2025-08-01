import { ActionButton, ActionButtonGroup, ExportButton } from '@/components/action-buttons'
import DeleteClient from '@/components/delete-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import CustomInput from '@/components/ui/custom-input'
import DatePicker from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableHeaderRow, TableRow } from '@/components/ui/table'
import MasterLayout from '@/layouts/master-layout'
import { formatDateValue, objectToQueryString, queryStringToObject } from '@/lib/utils'
import { type BreadcrumbItem } from '@/types'
import { clients as _clients } from '@actions/ClientController'
import { Head, Link, usePage } from '@inertiajs/react'
import { Calendar, CalendarRange, Edit, FileText, Folder, Loader2, Plus, Search, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Clients',
        href: '/client',
    },
]

type Client = {
    id: number
    name: string
    email: string | null
    contact_person: string | null
    phone: string | null
    address: string | null
    notes: string | null
    hourly_rate: number | null
    currency: string | null
}

type ClientFilters = {
    search: string
    created_date_from: Date | string | null
    created_date_to: Date | string | null
}

type Props = {
    clients: Client[]
    filters: ClientFilters
}

export default function Clients() {
    const { filters: pageFilters } = usePage<Props>().props
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<boolean>(false)
    const [processing, setProcessing] = useState(false)

    // Convert string date to Date object if needed
    const parseDate = (dateValue: Date | string | null): Date | null => {
        if (dateValue === null) return null
        if (typeof dateValue === 'string') return new Date(dateValue)
        return dateValue
    }

    // Filter states
    const [filters, setFilters] = useState<ClientFilters>({
        search: pageFilters?.search || '',
        created_date_from: pageFilters?.created_date_from || null,
        created_date_to: pageFilters?.created_date_to || null,
    })

    const handleFilterChange = (key: keyof ClientFilters, value: string | Date | null): void => {
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    const clearFilters = (): void => {
        setFilters({
            search: '',
            created_date_from: null,
            created_date_to: null,
        })
    }

    const getClients = async (filters?: ClientFilters): Promise<void> => {
        setLoading(true)
        setError(false)
        setProcessing(true)
        try {
            setClients(
                await _clients.data({
                    params: filters,
                }),
            )
        } catch (error) {
            console.error('Error fetching clients:', error)
            setError(true)
        } finally {
            setLoading(false)
            setProcessing(false)
        }
    }

    const handleSubmit = (e: { preventDefault: () => void }): void => {
        e.preventDefault()
        const formattedFilters = { ...filters }

        if (formattedFilters.created_date_from instanceof Date) {
            const year = formattedFilters.created_date_from.getFullYear()
            const month = String(formattedFilters.created_date_from.getMonth() + 1).padStart(2, '0')
            const day = String(formattedFilters.created_date_from.getDate()).padStart(2, '0')
            formattedFilters.created_date_from = `${year}-${month}-${day}`
        }

        if (formattedFilters.created_date_to instanceof Date) {
            const year = formattedFilters.created_date_to.getFullYear()
            const month = String(formattedFilters.created_date_to.getMonth() + 1).padStart(2, '0')
            const day = String(formattedFilters.created_date_to.getDate()).padStart(2, '0')
            formattedFilters.created_date_to = `${year}-${month}-${day}`
        }

        const filtersString = objectToQueryString(formattedFilters)

        getClients(formattedFilters).then(() => {
            window.history.pushState({}, '', `?${filtersString}`)
        })
    }

    useEffect(() => {
        const queryParams = queryStringToObject()

        const initialFilters: ClientFilters = {
            search: queryParams.search || '',
            created_date_from: queryParams.created_date_from || null,
            created_date_to: queryParams.created_date_to || null,
        }

        setFilters(initialFilters)
        getClients(initialFilters).then()
    }, [])

    return (
        <MasterLayout breadcrumbs={breadcrumbs}>
            <Head title="Clients" />
            <div className="mx-auto flex flex-col gap-6 p-3">
                <section className="mb-2">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Client Management</h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Manage your clients</p>
                </section>

                {/* Filters card */}
                <Card className="transition-all hover:shadow-md">
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
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

                            {/* Created Date From */}
                            <div className="grid gap-1">
                                <Label htmlFor="created-date-from" className="text-xs font-medium">
                                    Created Date From
                                </Label>
                                <DatePicker
                                    selected={parseDate(filters.created_date_from)}
                                    onChange={(date) => handleFilterChange('created_date_from', date)}
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

                            {/* Created Date To */}
                            <div className="grid gap-1">
                                <Label htmlFor="created-date-to" className="text-xs font-medium">
                                    Created Date To
                                </Label>
                                <DatePicker
                                    selected={parseDate(filters.created_date_to)}
                                    onChange={(date) => handleFilterChange('created_date_to', date)}
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
                                <Button type="submit" className="flex h-9 items-center gap-1 px-3">
                                    <Search className="h-3.5 w-3.5" />
                                    <span>Filter</span>
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={!filters.search && !filters.created_date_from && !filters.created_date_to}
                                    onClick={clearFilters}
                                    className="flex h-9 items-center gap-1 px-3"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    <span>Clear</span>
                                </Button>
                            </div>
                        </form>

                        <div className={'mt-4 text-sm text-muted-foreground'}>
                            {(filters.search || filters.created_date_from || filters.created_date_to) && (
                                <CardDescription>
                                    {(() => {
                                        let description = ''

                                        if (filters.created_date_from && filters.created_date_to) {
                                            description = `Showing clients from ${formatDateValue(filters.created_date_from)} to ${formatDateValue(filters.created_date_to)}`
                                        } else if (filters.created_date_from) {
                                            description = `Showing clients from ${formatDateValue(filters.created_date_from)}`
                                        } else if (filters.created_date_to) {
                                            description = `Showing clients until ${formatDateValue(filters.created_date_to)}`
                                        }

                                        if (filters.search) {
                                            if (description) {
                                                description += ` matching "${filters.search}"`
                                            } else {
                                                description = `Showing clients matching "${filters.search}"`
                                            }
                                        }

                                        return description
                                    })()}
                                </CardDescription>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden transition-all hover:shadow-md">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl">Clients</CardTitle>
                                <CardDescription>
                                    {loading ? 'Loading clients...' : error ? 'Failed to load clients' : `You have ${clients.length} clients`}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <ExportButton
                                    href={`${route('client.export')}?${objectToQueryString({
                                        search: filters.search || '',
                                        created_date_from: formatDateValue(filters.created_date_from),
                                        created_date_to: formatDateValue(filters.created_date_to),
                                    })}`}
                                />
                                <Link href={route('client.create')}>
                                    <Button className="flex items-center gap-2">
                                        <Plus className="h-4 w-4" />
                                        <span>Add Client</span>
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Loader2 className="mb-4 h-12 w-12 animate-spin text-muted-foreground/50" />
                                <h3 className="mb-1 text-lg font-medium">Loading Clients</h3>
                                <p className="mb-4 text-muted-foreground">Please wait while we fetch your clients...</p>
                            </div>
                        ) : error ? (
                            <div className="rounded-md border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Users className="mb-4 h-12 w-12 text-red-500" />
                                    <h3 className="mb-1 text-lg font-medium text-red-700 dark:text-red-400">Failed to Load Clients</h3>
                                    <p className="mb-4 text-red-600 dark:text-red-300">There was an error loading your clients. Please try again.</p>
                                    <Button onClick={() => getClients()} className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4" />
                                        <span>Retry</span>
                                    </Button>
                                </div>
                            </div>
                        ) : clients.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableHeaderRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Contact Person</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Currency</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableHeaderRow>
                                </TableHeader>
                                <TableBody>
                                    {clients.map((client) => (
                                        <TableRow key={client.id}>
                                            <TableCell className="font-medium">{client.name}</TableCell>
                                            <TableCell>
                                                {client.contact_person || <span className="text-muted-foreground/50">Not specified</span>}
                                            </TableCell>
                                            <TableCell>{client.email || <span className="text-muted-foreground/50">Not specified</span>}</TableCell>
                                            <TableCell>{client.phone || <span className="text-muted-foreground/50">Not specified</span>}</TableCell>
                                            <TableCell>{client.currency || 'USD'}</TableCell>
                                            <TableCell className="text-right">
                                                <ActionButtonGroup>
                                                    <ActionButton
                                                        href={route('client.projects', client.id)}
                                                        title="View Projects"
                                                        icon={Folder}
                                                        label="Projects"
                                                        variant="indigo"
                                                    />
                                                    <ActionButton
                                                        href={route('client.invoices', client.id)}
                                                        title="View Invoices"
                                                        icon={FileText}
                                                        label="Invoices"
                                                        variant="violet"
                                                    />
                                                    <ActionButton
                                                        href={route('client.edit', client.id)}
                                                        title="Edit Client"
                                                        icon={Edit}
                                                        variant="amber"
                                                        size="icon"
                                                    />
                                                    <DeleteClient clientId={client.id} getClients={getClients} />
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
                                    <h3 className="mb-1 text-lg font-medium">No Clients</h3>
                                    <p className="mb-4 text-muted-foreground">You haven't added any clients yet.</p>
                                    <Link href={route('client.create')}>
                                        <Button className="flex items-center gap-2">
                                            <Plus className="h-4 w-4" />
                                            <span>Add Client</span>
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
