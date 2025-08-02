import { SearchableSelect } from '@/components/ui/searchable-select'
import { Head, useForm } from '@inertiajs/react'
import { ArrowLeft, Building, FileText, LoaderCircle, Save, Text, Users } from 'lucide-react'
import { FormEventHandler } from 'react'
import { toast } from 'sonner'

import InputError from '@/components/input-error'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import MasterLayout from '@/layouts/master-layout'
import { type BreadcrumbItem } from '@/types'

type TeamMember = {
    id: number
    name: string
    email: string
}

type Client = {
    id: number
    name: string
}

type ProjectForm = {
    name: string
    description: string
    client_id: string
    team_members: number[]
    approvers: number[]
}

type Props = {
    project: {
        id: number
        name: string
        description: string | null
        client_id: number | null
        source?: string
        is_imported?: boolean
    }
    teamMembers: TeamMember[]
    assignedTeamMembers: number[]
    assignedApprovers: number[]
    clients: Client[]
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Projects',
        href: '/project',
    },
    {
        title: 'Edit',
        href: '/project/edit',
    },
]

export default function EditProject({ project, teamMembers, assignedTeamMembers, assignedApprovers, clients }: Props) {
    const { data, setData, put, processing, errors } = useForm<ProjectForm>({
        name: project.name,
        description: project.description || '',
        client_id: project.client_id ? project.client_id.toString() : '',
        team_members: assignedTeamMembers || [],
        approvers: assignedApprovers || [],
    })

    const submit: FormEventHandler = (e) => {
        e.preventDefault()
        put(route('project.update', project.id), {
            onSuccess: () => {
                toast.success('Project updated successfully')
            },
            onError: () => {
                toast.error('Failed to update project')
            },
        })
    }

    const handleTeamMemberToggle = (memberId: number) => {
        const currentMembers = [...data.team_members]
        const index = currentMembers.indexOf(memberId)

        if (index === -1) {
            // Add member if not already selected
            currentMembers.push(memberId)
        } else {
            // Remove member if already selected
            currentMembers.splice(index, 1)
        }

        setData('team_members', currentMembers)

        // If a team member is removed, also remove them from approvers
        if (index !== -1 && data.approvers.includes(memberId)) {
            handleApproverToggle(memberId)
        }
    }

    const handleApproverToggle = (memberId: number) => {
        // Only allow approvers who are also team members
        if (!data.team_members.includes(memberId)) {
            return
        }

        const currentApprovers = [...data.approvers]
        const index = currentApprovers.indexOf(memberId)

        if (index === -1) {
            // Add approver if not already selected
            currentApprovers.push(memberId)
        } else {
            // Remove approver if already selected
            currentApprovers.splice(index, 1)
        }

        setData('approvers', currentApprovers)
    }

    return (
        <MasterLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Project" />
            <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
                {/* Header section */}
                <section className="mb-2">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Edit Project</h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Update information for {project.name}</p>
                </section>

                <Card className="overflow-hidden transition-all hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="text-xl">Project Information</CardTitle>
                        <CardDescription>Update the project's details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="flex flex-col gap-6" onSubmit={submit}>
                            <div className="grid gap-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name" className="text-sm font-medium">
                                            Project Name
                                        </Label>
                                        <div className="relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <Input
                                                id="name"
                                                type="text"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                disabled={processing || project.is_imported}
                                                placeholder="Project name"
                                                className="pl-10"
                                            />
                                        </div>
                                        <InputError message={errors.name} className="mt-1" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="client_id" className="text-sm font-medium">
                                            Client <span className="text-xs text-muted-foreground">(optional)</span>
                                        </Label>
                                        <SearchableSelect
                                            id="client_id"
                                            value={data.client_id}
                                            onChange={(value) => setData('client_id', value)}
                                            options={clients}
                                            placeholder="Select a client"
                                            disabled={processing}
                                            icon={<Building className="h-4 w-4 text-muted-foreground" />}
                                        />
                                        <InputError message={errors.client_id} />
                                    </div>
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
                                            placeholder="Project description"
                                            className="min-h-[100px] pl-10"
                                        />
                                    </div>
                                    <InputError message={errors.description} />
                                </div>

                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">
                                        Team Members <span className="text-xs text-muted-foreground">(optional)</span>
                                    </Label>
                                    <div className="relative rounded-md border p-3">
                                        <div className="pointer-events-none absolute top-3 left-3">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="space-y-2 pl-7">
                                            {teamMembers && teamMembers.length > 0 ? (
                                                teamMembers.map((member) => (
                                                    <div key={member.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`member-${member.id}`}
                                                            checked={data.team_members.includes(member.id)}
                                                            onCheckedChange={() => handleTeamMemberToggle(member.id)}
                                                            disabled={processing}
                                                        />
                                                        <Label htmlFor={`member-${member.id}`} className="cursor-pointer text-sm">
                                                            {member.name} ({member.email})
                                                        </Label>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground">No team members available</p>
                                            )}
                                        </div>
                                    </div>
                                    <InputError message={errors.team_members} />
                                </div>

                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">
                                        Project Approvers <span className="text-xs text-muted-foreground">(optional)</span>
                                    </Label>
                                    <div className="relative rounded-md border p-3">
                                        <div className="pointer-events-none absolute top-3 left-3">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="space-y-2 pl-7">
                                            {data.team_members.length > 0 ? (
                                                teamMembers
                                                    .filter((member) => data.team_members.includes(member.id))
                                                    .map((member) => (
                                                        <div key={`approver-${member.id}`} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`approver-${member.id}`}
                                                                checked={data.approvers.includes(member.id)}
                                                                onCheckedChange={() => handleApproverToggle(member.id)}
                                                                disabled={processing}
                                                            />
                                                            <Label htmlFor={`approver-${member.id}`} className="cursor-pointer text-sm">
                                                                {member.name} ({member.email})
                                                            </Label>
                                                        </div>
                                                    ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground">Select team members first</p>
                                            )}
                                        </div>
                                    </div>
                                    <InputError message={errors.approvers} />
                                </div>

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
                                        {processing ? 'Updating...' : 'Update Project'}
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
