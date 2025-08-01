import { Head, Link, useForm } from '@inertiajs/react'
import { ArrowLeft, LoaderCircle, Lock, Mail, User, UserPlus } from 'lucide-react'
import { FormEventHandler } from 'react'
import { toast } from 'sonner'

import InputError from '@/components/input-error'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import MasterLayout from '@/layouts/master-layout'
import { type BreadcrumbItem } from '@/types'

type TeamMemberForm = {
    name: string
    email: string
    password: string
    hourly_rate: number | string
    currency: string
    non_monetary: boolean
}

type Currency = {
    id: number
    user_id: number
    code: string
    created_at: string
    updated_at: string
}

type Props = {
    currencies: Currency[]
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Team',
        href: '/team',
    },
    {
        title: 'Create',
        href: '/team/create',
    },
]

export default function CreateTeamMember({ currencies }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm<Required<TeamMemberForm>>({
        name: '',
        email: '',
        password: '',
        hourly_rate: 0,
        currency: currencies.length > 0 ? currencies[0].code : 'USD',
        non_monetary: false,
    })

    const submit: FormEventHandler = (e) => {
        e.preventDefault()
        post(route('team.store'), {
            onSuccess: () => {
                toast.success('Team member created successfully')
                reset()
            },
            onError: () => {
                toast.error('Failed to create team member')
            },
        })
    }

    return (
        <MasterLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Team Member" />
            <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
                {/* Header section */}
                <section className="mb-2">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Add Team Member</h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Create a new member for your team</p>
                </section>

                <Card className="overflow-hidden transition-all hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="text-xl">Team Member Details</CardTitle>
                        <CardDescription>Enter the information for the new team member</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="flex flex-col gap-6" onSubmit={submit}>
                            <div className="grid gap-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name" className="text-sm font-medium">
                                            Full Name
                                        </Label>
                                        <div className="relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <Input
                                                id="name"
                                                type="text"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                disabled={processing}
                                                placeholder="John Doe"
                                                className="pl-10"
                                            />
                                        </div>
                                        <InputError message={errors.name} className="mt-1" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email" className="text-sm font-medium">
                                            Email Address
                                        </Label>
                                        <div className="relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <Input
                                                id="email"
                                                type="email"
                                                required
                                                tabIndex={2}
                                                autoComplete="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                disabled={processing}
                                                placeholder="john@example.com"
                                                className="pl-10"
                                            />
                                        </div>
                                        <InputError message={errors.email} />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password" className="text-sm font-medium">
                                        Password
                                    </Label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                            <Lock className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            required
                                            tabIndex={3}
                                            autoComplete="new-password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            disabled={processing}
                                            placeholder="••••••••"
                                            className="pl-10"
                                        />
                                    </div>
                                    <InputError message={errors.password} />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="non_monetary"
                                        checked={data.non_monetary}
                                        onChange={(e) => setData('non_monetary', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="non_monetary" className="text-sm font-medium">
                                        Non-monetary (no hourly rate)
                                    </Label>
                                </div>

                                {!data.non_monetary && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="hourly_rate" className="text-sm font-medium">
                                                Hourly Rate
                                            </Label>
                                            <div className="relative">
                                                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                                    <span className="h-4 w-4 text-muted-foreground">$</span>
                                                </div>
                                                <Input
                                                    id="hourly_rate"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    tabIndex={4}
                                                    value={data.hourly_rate}
                                                    onChange={(e) => setData('hourly_rate', e.target.value)}
                                                    disabled={processing}
                                                    placeholder="0.00"
                                                    className="pl-10"
                                                />
                                            </div>
                                            <InputError message={errors.hourly_rate} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="currency" className="text-sm font-medium">
                                                Currency{' '}
                                                <Link href={route('currency.edit')} className="text-xs text-blue-500 hover:underline">
                                                    (create new currency)
                                                </Link>
                                            </Label>
                                            <Select
                                                value={data.currency}
                                                onValueChange={(value) => setData('currency', value)}
                                                disabled={processing || currencies.length === 0}
                                            >
                                                <SelectTrigger id="currency" className="w-full">
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
                                                <p className="text-xs text-muted-foreground">
                                                    No currencies available. Please add currencies in the settings.
                                                </p>
                                            )}
                                            <InputError message={errors.currency} />
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => window.history.back()}
                                        tabIndex={7}
                                        disabled={processing}
                                        className="flex items-center gap-2"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Back
                                    </Button>
                                    <Button type="submit" tabIndex={6} disabled={processing} className="flex items-center gap-2">
                                        {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                                        {processing ? 'Creating...' : 'Create Team Member'}
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
