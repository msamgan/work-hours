import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DatePicker from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableHeaderRow, TableRow } from '@/components/ui/table'
import MasterLayout from '@/layouts/master-layout'
import { type BreadcrumbItem } from '@/types'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { objectToQueryString, queryStringToObject } from '@/lib/utils'
import { invoices as _invoices } from '@actions/InvoiceController'
import { Head, Link, router, usePage } from '@inertiajs/react'
import { Calendar, CalendarRange, Download, Edit, FileText, Loader2, Mail, Plus, Search, X } from 'lucide-react'
import { ChangeEvent, forwardRef, ReactNode, useEffect, useState } from 'react'
import { toast } from 'sonner'

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
        title: 'Invoices',
        href: '/invoice',
    },
]

type Invoice = {
    id: number
    invoice_number: string
    client: {
        id: number
        name: string
    }
    issue_date: string
    due_date: string
    total_amount: number
    paid_amount: number
    status: string
    discount_type: string | null
    discount_value: number
    discount_amount: number
    created_at: string
}

type InvoiceFilters = {
    search: string
    client_id: string
    status: string
    created_date_from: string | Date | null
    created_date_to: string | Date | null
}

type Props = {
    invoices: Invoice[]
    filters: InvoiceFilters
}

export function Invoices() {
    const { filters: pageFilters } = usePage<Props>().props
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<boolean>(false)
    const [processing, setProcessing] = useState(false)
    const [emailDialogOpen, setEmailDialogOpen] = useState(false)
    const [statusDialogOpen, setStatusDialogOpen] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
    const [sendingEmail, setSendingEmail] = useState(false)
    const [updatingStatus, setUpdatingStatus] = useState(false)
    const [newStatus, setNewStatus] = useState<string>('')
    const [newPaidAmount, setNewPaidAmount] = useState<string>('')

    // Filter states
    const [filters, setFilters] = useState<InvoiceFilters>({
        search: pageFilters?.search || '',
        client_id: pageFilters?.client_id || 'all',
        status: pageFilters?.status || 'all',
        created_date_from: pageFilters?.created_date_from || null,
        created_date_to: pageFilters?.created_date_to || null,
    })

    const handleFilterChange = (key: keyof InvoiceFilters, value: string | Date | null): void => {
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    const clearFilters = (): void => {
        setFilters({
            search: '',
            client_id: 'all',
            status: 'all',
            created_date_from: null,
            created_date_to: null,
        })
    }

    const getInvoices = async (filters?: InvoiceFilters): Promise<void> => {
        setLoading(true)
        setError(false)
        setProcessing(true)
        try {
            // Create a copy of filters to avoid modifying the original
            const apiFilters = filters ? { ...filters } : undefined

            // Convert "all" values to empty strings for API
            if (apiFilters) {
                if (apiFilters.client_id === 'all') {
                    apiFilters.client_id = ''
                }

                if (apiFilters.status === 'all') {
                    apiFilters.status = ''
                }
            }

            setInvoices(
                await _invoices.data({
                    params: apiFilters,
                }),
            )
        } catch (error) {
            console.error('Error fetching invoices:', error)
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

        // Convert "all" values to empty strings for API
        if (formattedFilters.client_id === 'all') {
            formattedFilters.client_id = ''
        }

        if (formattedFilters.status === 'all') {
            formattedFilters.status = ''
        }

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

        getInvoices(formattedFilters).then(() => {
            window.history.pushState({}, '', `?${filtersString}`)
        })
    }

    useEffect(() => {
        const queryParams = queryStringToObject()

        const initialFilters: InvoiceFilters = {
            search: queryParams.search || '',
            client_id: queryParams.client_id || 'all',
            status: queryParams.status || 'all',
            created_date_from: queryParams.created_date_from || null,
            created_date_to: queryParams.created_date_to || null,
        }

        setFilters(initialFilters)
        getInvoices(initialFilters).then()
    }, [])

    // Format currency
    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount)
    }

    // Get status badge class
    const getStatusBadgeClass = (status: string): string => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            case 'sent':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            case 'paid':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            case 'partially_paid':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            case 'overdue':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            case 'cancelled':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }
    }

    // Format status label
    const formatStatusLabel = (status: string): string => {
        return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    }

    // Handle opening the email confirmation dialog
    const handleEmailClick = (invoice: Invoice): void => {
        setSelectedInvoice(invoice)
        setEmailDialogOpen(true)
    }

    // Handle opening the status update dialog
    const handleStatusClick = (invoice: Invoice): void => {
        setSelectedInvoice(invoice)
        setNewStatus(invoice.status)
        setNewPaidAmount(invoice.paid_amount.toString())
        setStatusDialogOpen(true)
    }

    // Handle sending the email
    const handleSendEmail = async (): void => {
        if (!selectedInvoice) return

        setSendingEmail(true)
        try {
            await router.post(route('invoice.sendEmail', selectedInvoice.id))

            // Update the invoice status in the local state
            setInvoices(
                invoices.map((invoice) => {
                    if (invoice.id === selectedInvoice.id) {
                        return { ...invoice, status: 'sent' }
                    }
                    return invoice
                }),
            )

            // Close the dialog
            setEmailDialogOpen(false)
            setSelectedInvoice(null)
        } catch (error) {
            console.error('Error sending invoice email:', error)
        } finally {
            setSendingEmail(false)
        }
    }

    // Handle updating the invoice status
    const handleStatusUpdate = async (): void => {
        if (!selectedInvoice) return

        setUpdatingStatus(true)
        try {
            // Make API call to update the invoice status
            await router.post(route('invoice.updateStatus', selectedInvoice.id), {
                status: newStatus,
                paid_amount: newPaidAmount,
            })

            // Update the invoice status in the local state
            setInvoices(
                invoices.map((invoice) => {
                    if (invoice.id === selectedInvoice.id) {
                        return {
                            ...invoice,
                            status: newStatus,
                            paid_amount: parseFloat(newPaidAmount),
                        }
                    }
                    return invoice
                }),
            )

            // Show success message
            toast.success(`Invoice status updated to ${formatStatusLabel(newStatus)}`)

            // Close the dialog
            setStatusDialogOpen(false)
            setSelectedInvoice(null)
        } catch (error) {
            console.error('Error updating invoice status:', error)
            toast.error('Failed to update invoice status')
        } finally {
            setUpdatingStatus(false)
        }
    }

    return (
        <MasterLayout breadcrumbs={breadcrumbs}>
            <Head title="Invoices" />
            <div className="mx-auto flex flex-col gap-6 p-6">
                <section className="mb-2">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Invoice
                        Management</h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Manage your invoices</p>
                </section>

                {/* Filters card */}
                <Card className="transition-all hover:shadow-md">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-6">
                            <div className="grid gap-1">
                                <Label htmlFor="search" className="text-xs font-medium">
                                    Search
                                </Label>
                                <div className="relative">
                                    <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="search"
                                        placeholder="Search invoice #"
                                        className="pl-10"
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="client_id" className="text-xs font-medium">
                                    Client
                                </Label>
                                <Select value={filters.client_id}
                                        onValueChange={(value) => handleFilterChange('client_id', value)}>
                                    <SelectTrigger id="client_id">
                                        <SelectValue placeholder="All Clients" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Clients</SelectItem>
                                        {/* Client options would be populated here */}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="status" className="text-xs font-medium">
                                    Status
                                </Label>
                                <Select value={filters.status}
                                        onValueChange={(value) => handleFilterChange('status', value)}>
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="sent">Sent</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="partially_paid">Partially Paid</SelectItem>
                                        <SelectItem value="overdue">Overdue</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="created-date-from" className="text-xs font-medium">
                                    Date From
                                </Label>
                                <DatePicker
                                    selected={filters.created_date_from}
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
                            <div className="grid gap-1">
                                <Label htmlFor="created-date-to" className="text-xs font-medium">
                                    Date To
                                </Label>
                                <DatePicker
                                    selected={filters.created_date_to}
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
                            <div className="grid gap-1">
                                <Label className="text-xs font-medium opacity-0">Actions</Label>
                                <div className="flex items-end gap-2">
                                    <Button type="submit" className="flex h-9 items-center gap-1 px-3">
                                        <Search className="h-3.5 w-3.5" />
                                        <span>Filter</span>
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={
                                            !filters.search &&
                                            !filters.client_id &&
                                            !filters.status &&
                                            !filters.created_date_from &&
                                            !filters.created_date_to
                                        }
                                        onClick={clearFilters}
                                        className="flex h-9 items-center gap-1 px-3"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        <span>Clear</span>
                                    </Button>
                                </div>
                            </div>
                        </form>

                        <div className={'mt-4 text-sm text-muted-foreground'}>
                            {(filters.search || filters.client_id || filters.status || filters.created_date_from || filters.created_date_to) && (
                                <CardDescription>
                                    {(() => {
                                        let description = ''

                                        if (filters.created_date_from && filters.created_date_to) {
                                            description = `Showing invoices from ${formatDateValue(filters.created_date_from)} to ${formatDateValue(filters.created_date_to)}`
                                        } else if (filters.created_date_from) {
                                            description = `Showing invoices from ${formatDateValue(filters.created_date_from)}`
                                        } else if (filters.created_date_to) {
                                            description = `Showing invoices until ${formatDateValue(filters.created_date_to)}`
                                        }

                                        if (filters.status) {
                                            if (description) {
                                                description += ` with status "${formatStatusLabel(filters.status)}"`
                                            } else {
                                                description = `Showing invoices with status "${formatStatusLabel(filters.status)}"`
                                            }
                                        }

                                        if (filters.client_id) {
                                            if (description) {
                                                description += ` for selected client`
                                            } else {
                                                description = `Showing invoices for selected client`
                                            }
                                        }

                                        if (filters.search) {
                                            if (description) {
                                                description += ` matching "${filters.search}"`
                                            } else {
                                                description = `Showing invoices matching "${filters.search}"`
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
                                <CardTitle className="text-xl">Invoices</CardTitle>
                                <CardDescription>
                                    {loading ? 'Loading invoices...' : error ? 'Failed to load invoices' : `You have ${invoices.length} invoices`}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={`${route('invoice.export')}?${objectToQueryString({
                                        search: filters.search || '',
                                        client_id: filters.client_id || '',
                                        status: filters.status || '',
                                        created_date_from: formatDateValue(filters.created_date_from),
                                        created_date_to: formatDateValue(filters.created_date_to),
                                    })}`}
                                    className="inline-block"
                                >
                                    <Button variant="outline" className="flex items-center gap-2">
                                        <Download className="h-4 w-4" />
                                        <span>Export</span>
                                    </Button>
                                </a>
                                <Link href={route('invoice.create')}>
                                    <Button className="flex items-center gap-2">
                                        <Plus className="h-4 w-4" />
                                        <span>Create Invoice</span>
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Loader2 className="mb-4 h-12 w-12 animate-spin text-muted-foreground/50" />
                                <h3 className="mb-1 text-lg font-medium">Loading Invoices</h3>
                                <p className="mb-4 text-muted-foreground">Please wait while we fetch your
                                    invoices...</p>
                            </div>
                        ) : error ? (
                            <div
                                className="rounded-md border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <FileText className="mb-4 h-12 w-12 text-red-500" />
                                    <h3 className="mb-1 text-lg font-medium text-red-700 dark:text-red-400">Failed to
                                        Load Invoices</h3>
                                    <p className="mb-4 text-red-600 dark:text-red-300">There was an error loading your
                                        invoices. Please try again.</p>
                                    <Button onClick={() => getInvoices()} className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4" />
                                        <span>Retry</span>
                                    </Button>
                                </div>
                            </div>
                        ) : invoices.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableHeaderRow>
                                        <TableHead>Invoice #</TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Issue Date</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableHeaderRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                                            <TableCell>{invoice.client.name}</TableCell>
                                            <TableCell>{new Date(invoice.issue_date).toISOString().split('T')[0]}</TableCell>
                                            <TableCell>{new Date(invoice.due_date).toISOString().split('T')[0]}</TableCell>
                                            <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(
                                                        invoice.status,
                                                    )} cursor-pointer hover:opacity-80`}
                                                    onClick={() => handleStatusClick(invoice)}
                                                    title="Click to update status"
                                                >
                                                    {formatStatusLabel(invoice.status)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <a href={route('invoice.downloadPdf', invoice.id)} target="_blank"
                                                       rel="noopener noreferrer">
                                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                                            <Download className="h-3.5 w-3.5" />
                                                            <span className="sr-only">Download PDF</span>
                                                        </Button>
                                                    </a>
                                                    <Link href={route('invoice.edit', invoice.id)}>
                                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                                            <Edit className="h-3.5 w-3.5" />
                                                            <span className="sr-only">Edit</span>
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => handleEmailClick(invoice)}
                                                        title={invoice.status === 'sent' ? 'Invoice already sent' : 'Send invoice email to client'}
                                                        disabled={invoice.status === 'sent' || invoice.status === 'paid'}
                                                    >
                                                        <Mail
                                                            className={`h-3.5 w-3.5 ${invoice.status === 'sent' ? 'text-muted-foreground/50' : ''}`}
                                                        />.
                                                        6+++++++++-+--+++-74
                                                        <span className="sr-only">Send Email</span>
                                                    </Button>
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
                                    <h3 className="mb-1 text-lg font-medium">No Invoices</h3>
                                    <p className="mb-4 text-muted-foreground">You haven't created any invoices yet.</p>
                                    <Link href={route('invoice.create')}>6;.
                                        <Button className="flex items-center gap-2">
                                            <Plus className="h-4 w-4" />
                                            <span>Create Invoice</span>
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Email Confirmation Dialog */}
            <AlertDialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Send Invoice Email</AlertDialogTitle>
                        <AlertDialogDescription>
                            {selectedInvoice && (
                                <>
                                    This will send invoice
                                    #{selectedInvoice.invoice_number} to {selectedInvoice.client.name}.
                                    {selectedInvoice.status !== 'sent' &&
                                        <div className="mt-2">The invoice status will be updated to "Sent".</div>}
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={sendingEmail}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleSendEmail}
                            disabled={sendingEmail}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            {sendingEmail ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                'Send Email'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Status Update Dialog */}
            <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Update Invoice Status</AlertDialogTitle>
                        <AlertDialogDescription>
                            {selectedInvoice && <>Update status for invoice #{selectedInvoice.invoice_number}</>}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="status" className="text-sm font-medium">
                                Status
                            </Label>
                            <div className="relative rounded-md border p-3">
                                <RadioGroup
                                    value={newStatus}
                                    onValueChange={(value) => {
                                        setNewStatus(value)
                                        // If status is changed to paid, set paid_amount to total invoice amount
                                        if (value === 'paid' && selectedInvoice) {
                                            setNewPaidAmount(selectedInvoice.total_amount.toString())
                                        }
                                        // If status is changed to partially_paid, reset paid_amount to zero
                                        else if (value === 'partially_paid') {
                                            setNewPaidAmount('0')
                                        }
                                    }}
                                    className="flex flex-col space-y-2"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="draft" id="status-draft" />
                                        <Label htmlFor="status-draft" className="cursor-pointer">
                                            Draft
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="sent" id="status-sent" />
                                        <Label htmlFor="status-sent" className="cursor-pointer">
                                            Sent
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="paid" id="status-paid" />
                                        <Label htmlFor="status-paid" className="cursor-pointer">
                                            Paid
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="partially_paid" id="status-partially-paid" />
                                        <Label htmlFor="status-partially-paid" className="cursor-pointer">
                                            Partially Paid
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="overdue" id="status-overdue" />
                                        <Label htmlFor="status-overdue" className="cursor-pointer">
                                            Overdue
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="cancelled" id="status-cancelled" />
                                        <Label htmlFor="status-cancelled" className="cursor-pointer">
                                            Cancelled
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>

                        {(newStatus === 'paid' || newStatus === 'partially_paid') && (
                            <div className="grid gap-2">
                                <Label htmlFor="paid_amount" className="text-sm font-medium">
                                    Paid Amount
                                </Label>
                                <Input
                                    id="paid_amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={newPaidAmount}
                                    onChange={(e) => setNewPaidAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                                {selectedInvoice && (
                                    <p className="text-xs text-muted-foreground">
                                        Total invoice amount: {formatCurrency(selectedInvoice.total_amount)}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={updatingStatus}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleStatusUpdate}
                            disabled={updatingStatus}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            {updatingStatus ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Status'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </MasterLayout>
    )
}
