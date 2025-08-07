import { Head, Link, useForm } from '@inertiajs/react'
import axios from 'axios'
import { Edit, LoaderCircle, Plus, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import MasterLayout from '@/layouts/master-layout'

type Tag = {
    id: number
    name: string
    color: string
    created_at: string
}

type TagsLinks = {
    active: boolean
    label: string
    url: string | null
}

type TagsPageProps = {
    tags: {
        data: Tag[]
        links: TagsLinks[]
        total: number
        current_page: number
        last_page: number
    }
}

export default function Tags({ tags }: TagsPageProps) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editingTag, setEditingTag] = useState<Tag | null>(null)
    const [deletingTag, setDeletingTag] = useState<Tag | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [tagsList, setTagsList] = useState<Tag[]>(tags.data)

    const { data, setData, reset, errors } = useForm({
        name: '',
    })

    const {
        data: editData,
        setData: setEditData,
        errors: editErrors,
    } = useForm({
        name: '',
        color: '',
    })

    // Open the create tag dialog
    const openCreateDialog = () => {
        reset()
        setIsCreateDialogOpen(true)
    }

    // Open the edit tag dialog
    const openEditDialog = (tag: Tag) => {
        setEditingTag(tag)
        setEditData({ name: tag.name, color: tag.color })
        setIsEditDialogOpen(true)
    }

    // Open the delete tag dialog
    const openDeleteDialog = (tag: Tag) => {
        setDeletingTag(tag)
        setIsDeleteDialogOpen(true)
    }

    // Create a new tag
    const createTag = async () => {
        setIsLoading(true)

        try {
            const response = await axios.post('/tags', data)

            // Add the new tag to the list
            setTagsList([...tagsList, response.data])

            // Close the dialog and reset the form
            setIsCreateDialogOpen(false)
            reset()
            toast.success('Tag created successfully')
        } catch (error) {
            toast.error('Failed to create tag')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    // Update a tag
    const updateTag = async () => {
        if (!editingTag) return

        setIsLoading(true)

        try {
            const response = await axios.put(`/tags/${editingTag.id}`, editData)

            // Update the tag in the list
            setTagsList(tagsList.map((tag) => (tag.id === editingTag.id ? { ...tag, name: response.data.name, color: response.data.color } : tag)))

            // Close the dialog
            setIsEditDialogOpen(false)
            setEditingTag(null)
            toast.success('Tag updated successfully')
        } catch (error) {
            toast.error('Failed to update tag')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    // Delete a tag
    const deleteTag = async () => {
        if (!deletingTag) return

        setIsLoading(true)

        try {
            await axios.delete(`/tags/${deletingTag.id}`)

            // Remove the tag from the list
            setTagsList(tagsList.filter((tag) => tag.id !== deletingTag.id))

            // Close the dialog
            setIsDeleteDialogOpen(false)
            setDeletingTag(null)
            toast.success('Tag deleted successfully')
        } catch (error) {
            toast.error('Failed to delete tag')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const breadcrumbs = [
        {
            title: 'Tags',
            href: '/tags',
        },
    ]

    return (
        <MasterLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Tags" />
            <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
                <section className="mb-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Manage Tags</h1>
                        <p className="mt-1 text-gray-500 dark:text-gray-400">View and manage all your tags in one place</p>
                    </div>
                    <Button onClick={openCreateDialog} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add New Tag
                    </Button>
                </section>

                <Card>
                    <CardHeader>
                        <CardTitle>Your Tags</CardTitle>
                        <CardDescription>
                            You have {tags.total} {(tags.total || 0) === 1 ? 'tag' : 'tags'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {tagsList.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-gray-500 dark:text-gray-400">You don't have any tags yet</p>
                                <Button onClick={openCreateDialog} variant="link" className="mt-2">
                                    Create your first tag
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-xs uppercase dark:bg-gray-800">
                                        <tr>
                                            <th className="px-6 py-3">Tag Name</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tagsList.map((tag) => (
                                            <tr key={tag.id} className="border-b bg-white dark:border-gray-700 dark:bg-gray-900">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: tag.color || '#6366f1' }} />
                                                        {tag.name}
                                                    </div>
                                                </td>
                                                <td className="space-x-2 px-6 py-4 text-right">
                                                    <Button onClick={() => openEditDialog(tag)} variant="ghost" size="icon" className="h-8 w-8">
                                                        <Edit className="h-4 w-4" />
                                                        <span className="sr-only">Edit</span>
                                                    </Button>
                                                    <Button
                                                        onClick={() => openDeleteDialog(tag)}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination if there are multiple pages */}
                        {tags.last_page > 1 && (
                            <div className="mt-4 flex items-center justify-between border-t pt-4">
                                <div className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{tags?.current_page}</span> of{' '}
                                    <span className="font-medium">{tags?.last_page}</span> pages
                                </div>
                                <div className="flex space-x-2">
                                    {tags.links?.map((link: TagsLinks, i: number) => {
                                        // Skip the "prev" and "next" links
                                        if (link.label === '&laquo; Previous' || link.label === 'Next &raquo;') {
                                            return null
                                        }

                                        return (
                                            <Link
                                                key={i}
                                                href={link.url || '#'}
                                                className={`rounded px-3 py-1 ${
                                                    link.active ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                                                } ${!link.url ? 'cursor-not-allowed opacity-50' : ''}`}
                                            >
                                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Create Tag Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Tag</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            createTag()
                        }}
                    >
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Tag Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Enter tag name"
                                    disabled={isLoading}
                                />
                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading || !data.name}>
                                {isLoading ? (
                                    <>
                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Create Tag
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Tag Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Tag</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            updateTag()
                        }}
                    >
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Tag Name</Label>
                                <Input
                                    id="edit-name"
                                    value={editData.name}
                                    onChange={(e) => setEditData('name', e.target.value)}
                                    placeholder="Enter tag name"
                                    disabled={isLoading}
                                />
                                {editErrors.name && <p className="text-sm text-red-500">{editErrors.name}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-color">Tag Color</Label>
                                <Input
                                    id="edit-color"
                                    type="color"
                                    value={editData.color}
                                    onChange={(e) => setEditData('color', e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading || !editData.name}>
                                {isLoading ? (
                                    <>
                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Update Tag
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Tag Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Tag</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p>Are you sure you want to delete the tag "{deletingTag?.name}"?</p>
                        <p className="mt-2 text-sm text-red-500">This action cannot be undone. The tag will be removed from all time logs.</p>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="button" variant="destructive" onClick={deleteTag} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Tag
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MasterLayout>
    )
}
