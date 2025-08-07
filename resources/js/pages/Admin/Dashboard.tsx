import AdminLayout from '@/layouts/admin-layout'
import { Head, Link } from '@inertiajs/react'

interface DashboardProps {
    userCount: number;
}

export default function Dashboard({ userCount }: DashboardProps) {
    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />
            <div className="container mx-auto py-6">
                <h1 className="mb-6 text-2xl font-semibold">Admin Dashboard</h1>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="mb-4 text-lg font-medium">Users ({userCount})</h2>
                        <p className="mb-4 text-gray-600 dark:text-gray-300">Manage user accounts and permissions</p>
                        <Link href={route('admin.users.index')} className="text-blue-600 hover:underline dark:text-blue-400">
                            View all users →
                        </Link>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
