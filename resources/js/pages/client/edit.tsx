import { Head, useForm } from '@inertiajs/react'
import { ArrowLeft, Building, LoaderCircle, Mail, Phone, Save, Text, User } from 'lucide-react'
import { FormEventHandler } from 'react'
import { toast } from 'sonner'

import InputError from '@/components/input-error'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import MasterLayout from '@/layouts/master-layout'
import { type BreadcrumbItem } from '@/types'

type ClientForm = {
    name: string
    email: string
    contact_person: string
    phone: string
    address: string
    notes: string
    hourly_rate: string
    currency: string
}

type Currency = {
    id: number
    user_id: number
    code: string
    created_at: string
    updated_at: string
}

type Props = {
    client: {
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
    currencies: Currency[]
}

export default function EditClient({ client, currencies }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Clients',
            href: '/client',
        },
        {
            title: client.name,
            href: `/client/${client.id}/edit`,
        },
    ]

    const { data, setData, put, processing, errors } = useForm<ClientForm>({
        name: client.name,
        email: client.email || '',
        contact_person: client.contact_person || '',
        phone: client.phone || '',
        address: client.address || '',
        notes: client.notes || '',
        hourly_rate: client.hourly_rate ? client.hourly_rate.toString() : '',
        currency: client.currency || 'USD',
    })

    const submit: FormEventHandler = (e) => {
        e.preventDefault()
        put(route('client.update', client.id), {
            onSuccess: () => {
                toast.success('Client updated successfully')
            },
            onError: () => {
                toast.error('Failed to update client')
            },
        })
    }

    return (
        <MasterLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Client - ${client.name}`} />
            <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
                {/* Header section */}
                <section className="mb-2">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Edit Client</h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Update information for {client.name}</p>
                </section>

                <Card className="overflow-hidden transition-all hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="text-xl">Client Information</CardTitle>
                        <CardDescription>Update the client's details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="flex flex-col gap-6" onSubmit={submit}>
                            <div className="grid gap-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name" className="text-sm font-medium">
                                            Client Name
                                        </Label>
                                        <div className="relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                                <Building className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <Input
                                                id="name"
                                                type="text"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                disabled={processing}
                                                placeholder="Client name"
                                                className="pl-10"
                                            />
                                        </div>
                                        <InputError message={errors.name} className="mt-1" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="contact_person" className="text-sm font-medium">
                                            Contact Person <span className="text-xs text-muted-foreground">(optional)</span>
                                        </Label>
                                        <div className="relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <Input
                                                id="contact_person"
                                                type="text"
                                                tabIndex={2}
                                                value={data.contact_person}
                                                onChange={(e) => setData('contact_person', e.target.value)}
                                                disabled={processing}
                                                placeholder="Contact person name"
                                                className="pl-10"
                                            />
                                        </div>
                                        <InputError message={errors.contact_person} className="mt-1" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email" className="text-sm font-medium">
                                            Email <span className="text-xs text-muted-foreground">(optional)</span>
                                        </Label>
                                        <div className="relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <Input
                                                id="email"
                                                type="email"
                                                tabIndex={3}
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                disabled={processing}
                                                placeholder="Email address"
                                                className="pl-10"
                                            />
                                        </div>
                                        <InputError message={errors.email} className="mt-1" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone" className="text-sm font-medium">
                                            Phone <span className="text-xs text-muted-foreground">(optional)</span>
                                        </Label>
                                        <div className="relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <Input
                                                id="phone"
                                                type="text"
                                                tabIndex={4}
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                disabled={processing}
                                                placeholder="Phone number"
                                                className="pl-10"
                                            />
                                        </div>
                                        <InputError message={errors.phone} className="mt-1" />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="address" className="text-sm font-medium">
                                        Address <span className="text-xs text-muted-foreground">(optional)</span>
                                    </Label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 top-0 left-3 flex items-center pt-2">
                                            <Text className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <Textarea
                                            id="address"
                                            tabIndex={5}
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            disabled={processing}
                                            placeholder="Client address"
                                            className="min-h-[80px] pl-10"
                                        />
                                    </div>
                                    <InputError message={errors.address} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="hourly_rate" className="text-sm font-medium">
                                            Hourly Rate <span className="text-xs text-muted-foreground">(optional)</span>
                                        </Label>
                                        <div className="relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                                <span className="text-muted-foreground">$</span>
                                            </div>
                                            <Input
                                                id="hourly_rate"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                tabIndex={6}
                                                value={data.hourly_rate}
                                                onChange={(e) => setData('hourly_rate', e.target.value)}
                                                disabled={processing}
                                                placeholder="0.00"
                                                className="pl-10"
                                            />
                                        </div>
                                        <InputError message={errors.hourly_rate} className="mt-1" />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="currency" className="text-sm font-medium">
                                            Currency <span className="text-xs text-muted-foreground">(optional)</span>
                                        </Label>
                                        <Select
                                            value={data.currency}
                                            onValueChange={(value) => setData('currency', value)}
                                            disabled={processing || currencies.length === 0}
                                        >
                                            <SelectTrigger id="currency" className="w-full" tabIndex={7}>
                                                <SelectValue placeholder="Select a currency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {currencies.map((currency) => (
                                                    <SelectItem key={currency.id} value={currency.code}>
                                                        {currency.code}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {currencies.length === 0 && (
                                            <p className="text-xs text-muted-foreground">No currencies available. Default USD will be used.</p>
                                        )}
                                        <InputError message={errors.currency} className="mt-1" />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="notes" className="text-sm font-medium">
                                        Notes <span className="text-xs text-muted-foreground">(optional)</span>
                                    </Label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 top-0 left-3 flex items-center pt-2">
                                            <Text className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <Textarea
                                            id="notes"
                                            tabIndex={8}
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            disabled={processing}
                                            placeholder="Additional notes"
                                            className="min-h-[80px] pl-10"
                                        />
                                    </div>
                                    <InputError message={errors.notes} />
                                </div>

                                <div className="mt-4 flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => window.history.back()}
                                        tabIndex={10}
                                        disabled={processing}
                                        className="flex items-center gap-2"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Back
                                    </Button>
                                    <Button type="submit" tabIndex={9} disabled={processing} className="flex items-center gap-2">
                                        {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        {processing ? 'Updating...' : 'Update Client'}
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
