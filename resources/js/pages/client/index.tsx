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
import { Calendar, CalendarRange, Edit, FileText, Folder, Loader2, Plus, Search, TimerReset, Users } from 'lucide-react'
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
    'created-date-from': Date | string | null
    'created-date-to': Date | string | null
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

    const parseDate = (dateValue: Date | string | null): Date | null => {
        if (dateValue === null) return null
        if (typeof dateValue === 'string') return new Date(dateValue)
        return dateValue
    }

    const [filters, setFilters] = useState<ClientFilters>({
        search: pageFilters?.search || '',
        'created-date-from': pageFilters?.['created-date-from'] || null,
        'created-date-to': pageFilters?.['created-date-to'] || null,
    })

    const handleFilterChange = (key: keyof ClientFilters, value: string | Date | null): void => {
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    const clearFilters = (): void => {
        setFilters({
            search: '',
            'created-date-from': null,
            'created-date-to': null,
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

        getClients(formattedFilters).then(() => {
            window.history.pushState({}, '', `?${filtersString}`)
        })
    }

    useEffect(() => {
        const queryParams = queryStringToObject()

        const initialFilters: ClientFilters = {
            search: queryParams.search || '',
            'created-date-from': queryParams['created-date-from'] || null,
            'created-date-to': queryParams['created-date-to'] || null,
        }

        setFilters(initialFilters)
        getClients(initialFilters).then()
    }, [])

    return (
        <MasterLayout breadcrumbs={breadcrumbs}>
            <Head title="Clients" />
            <div className="mx-auto flex flex-col gap-6 p-4 max-w-7xl">
                <section className="mb-4">
                    <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Clients</h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Manage your client relationships</p>
                </section>

                <Card className="border-none shadow-sm bg-white dark:bg-gray-800/50 overflow-hidden">
                    <CardHeader className="border-b border-gray-100 dark:border-gray-700/40 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-medium">Client List</CardTitle>
                                <CardDescription>
                                    {loading ? 'Loading clients...' : error ? 'Failed to load clients' : `You have ${clients.length} clients`}
                                </CardDescription>

                                {(filters.search || filters['created-date-from'] || filters['created-date-to']) && (
                                    <CardDescription className="mt-1 text-xs opacity-80">
                                        {(() => {
                                            let description = ''

                                            if (filters['created-date-from'] && filters['created-date-to']) {
                                                description = `Showing clients from ${formatDateValue(filters['created-date-from'])} to ${formatDateValue(filters['created-date-to'])}`
                                            } else if (filters['created-date-from']) {
                                                description = `Showing clients from ${formatDateValue(filters['created-date-from'])}`
                                            } else if (filters['created-date-to']) {
                                                description = `Showing clients until ${formatDateValue(filters['created-date-to'])}`
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
                            <div className="flex items-center gap-3">
                                <ExportButton
                                    href={`${route('client.export')}?${objectToQueryString({
                                        search: filters.search || '',
                                        'created-date-from': formatDateValue(filters['created-date-from']),
                                        'created-date-to': formatDateValue(filters['created-date-to']),
                                    })}`}
                                    label="Export"
                                    className="text-sm"
                                />
                                <Link href={route('client.create')}>
                                    <Button className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm">
                                        <Plus className="h-4 w-4" />
                                        <span>Add Client</span>
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700/40">
                            <form onSubmit={handleSubmit} className="flex w-full flex-row flex-wrap gap-4">
                                <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-1">
                                    <Label htmlFor="search" className="text-xs font-medium">
                                        Search
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="search"
                                            placeholder="Search clients..."
                                            className="pl-9 h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                        />
                                        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                            <Search className="h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-1">
                                    <Label htmlFor="created-date-from" className="text-xs font-medium">
                                        Created From
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
                                                icon={<Calendar className="h-4 w-4 text-gray-400" />}
                                                disabled={processing}
                                                placeholder="Select start date"
                                                className="h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                            />
                                        }
                                    />
                                </div>

                                <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-1">
                                    <Label htmlFor="created-date-to" className="text-xs font-medium">
                                        Created To
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
                                                icon={<CalendarRange className="h-4 w-4 text-gray-400" />}
                                                disabled={processing}
                                                placeholder="Select end date"
                                                className="h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                            />
                                        }
                                    />
                                </div>

                                <div className="flex items-end gap-2">
                                    <Button
                                        type="submit"
                                        className="flex h-9 w-9 items-center justify-center p-0 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                        title="Apply filters"
                                        variant="outline"
                                    >
                                        <Search className="h-4 w-4" />
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={!filters.search && !filters['created-date-from'] && !filters['created-date-to']}
                                        onClick={clearFilters}
                                        className="flex h-9 w-9 items-center justify-center p-0 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                        title="Clear filters"
                                    >
                                        <TimerReset className="h-4 w-4" />
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <Loader2 className="mb-4 h-10 w-10 animate-spin text-gray-300 dark:text-gray-600" />
                                <h3 className="mb-1 text-base font-medium text-gray-700 dark:text-gray-300">Loading Clients</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Please wait while we fetch your clients...</p>
                            </div>
                        ) : error ? (
                            <div className="rounded-md bg-gray-50 p-6 dark:bg-gray-800/50 m-4 border border-gray-200 dark:border-gray-700">
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Users className="mb-4 h-10 w-10 text-gray-400 dark:text-gray-500" />
                                    <h3 className="mb-1 text-base font-medium text-gray-700 dark:text-gray-300">Failed to Load Clients</h3>
                                    <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">There was an error loading your clients. Please try again.</p>
                                    <Button
                                        onClick={() => getClients()}
                                        className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm"
                                    >
                                        <Loader2 className="h-4 w-4" />
                                        <span>Retry</span>
                                    </Button>
                                </div>
                            </div>
                        ) : clients.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableHeaderRow className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                            <TableHead className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Name</TableHead>
                                            <TableHead className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Contact Person</TableHead>
                                            <TableHead className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Email</TableHead>
                                            <TableHead className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Phone</TableHead>
                                            <TableHead className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Currency</TableHead>
                                            <TableHead className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400 text-right">Actions</TableHead>
                                        </TableHeaderRow>
                                    </TableHeader>
                                    <TableBody>
                                        {clients.map((client) => (
                                            <TableRow key={client.id} className="border-b border-gray-100 dark:border-gray-800/60 hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                                                <TableCell className="py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{client.name}</TableCell>
                                                <TableCell className="py-3 text-sm text-gray-700 dark:text-gray-300">
                                                    {client.contact_person || <span className="text-gray-400 dark:text-gray-500 text-xs">Not specified</span>}
                                                </TableCell>
                                                <TableCell className="py-3 text-sm text-gray-700 dark:text-gray-300">{client.email || <span className="text-gray-400 dark:text-gray-500 text-xs">Not specified</span>}</TableCell>
                                                <TableCell className="py-3 text-sm text-gray-700 dark:text-gray-300">{client.phone || <span className="text-gray-400 dark:text-gray-500 text-xs">Not specified</span>}</TableCell>
                                                <TableCell className="py-3 text-sm text-gray-700 dark:text-gray-300">{client.currency || 'USD'}</TableCell>
                                                <TableCell className="py-3 text-right">
                                                    <ActionButtonGroup>
                                                        <ActionButton
                                                            href={route('client.projects', client.id)}
                                                            title="View Projects"
                                                            icon={Folder}
                                                            label="Projects"
                                                            variant="info"
                                                            className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                                                        />
                                                        <ActionButton
                                                            href={route('client.invoices', client.id)}
                                                            title="View Invoices"
                                                            icon={FileText}
                                                            label="Invoices"
                                                            variant="secondary"
                                                            className="text-xs bg-violet-50 text-violet-600 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:hover:bg-violet-900/30"
                                                        />
                                                        <ActionButton
                                                            href={route('client.edit', client.id)}
                                                            title="Edit Client"
                                                            icon={Edit}
                                                            variant="warning"
                                                            size="icon"
                                                            className="bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30"
                                                        />
                                                        <DeleteClient clientId={client.id} getClients={getClients} />
                                                    </ActionButtonGroup>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="rounded-md bg-gray-50 dark:bg-gray-800/20 p-6 m-4 border border-gray-200 dark:border-gray-700">
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Users className="mb-4 h-10 w-10 text-gray-300 dark:text-gray-600" />
                                    <h3 className="mb-1 text-base font-medium text-gray-700 dark:text-gray-300">No Clients</h3>
                                    <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">You haven't added any clients yet.</p>
                                    <Link href={route('client.create')}>
                                        <Button className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm">
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
