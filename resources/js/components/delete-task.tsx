import { useForm } from '@inertiajs/react'
import { FormEventHandler } from 'react'

import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface DeleteTaskProps {
    taskId: number
    onDelete?: () => void
}

export default function DeleteTask({ taskId, onDelete }: DeleteTaskProps) {
    const { delete: destroy, processing, reset, clearErrors } = useForm({})

    const deleteTask: FormEventHandler = (e) => {
        e.preventDefault()

        destroy(route('task.destroy', taskId), {
            preserveScroll: true,
            onSuccess: () => {
                closeModal()
                if (onDelete) {
                    onDelete()
                }
            },
            onFinish: () => reset(),
        })
    }

    const closeModal = () => {
        clearErrors()
        reset()
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Are you sure you want to delete this task?</DialogTitle>
                <DialogDescription>
                    Once the task is deleted, all of its data will be permanently removed. This action cannot be undone.
                </DialogDescription>
                <form className="space-y-6" onSubmit={deleteTask}>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="secondary" onClick={closeModal}>
                                Cancel
                            </Button>
                        </DialogClose>

                        <Button variant="destructive" disabled={processing} asChild>
                            <button type="submit">Delete Task</button>
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
