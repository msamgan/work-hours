import Background from '@/components/ui/background'
import { Head, Link } from '@inertiajs/react'
import { ChevronRight, LayoutDashboard, Settings, Users } from 'lucide-react'
import { ReactNode, useEffect, useState } from 'react'
import { Toaster } from 'sonner'

interface AdminLayoutProps {
    children: ReactNode
    title?: string
}

export default function AdminLayout({ children, title = 'Admin' }: AdminLayoutProps) {
    const [collapsed, setCollapsed] = useState(() => {
        // Initialize from localStorage if available
        if (typeof window !== 'undefined') {
            const savedState = localStorage.getItem('admin_sidebar_collapsed')
            return savedState === 'true'
        }
        return false
    })

    const [pageLoaded, setPageLoaded] = useState(false)

    // Save collapsed state to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('admin_sidebar_collapsed', String(collapsed))
    }, [collapsed])

    // Add page transition effect
    useEffect(() => {
        setPageLoaded(true)
        return () => setPageLoaded(false)
    }, [])

    return (
        <div className="flex min-h-screen bg-[#f8f6e9] dark:bg-gray-900">
            <Head title={`${title} - Administration`} />
            <Background />

            {/* Left Sidebar - Admin version */}
            <div
                className={`fixed top-0 left-0 z-30 h-screen bg-white transition-all duration-300 ease-in-out dark:bg-gray-800 ${
                    collapsed ? 'w-16' : 'w-64'
                }`}
            >
                <div className="flex h-full flex-col">
                    {/* Sidebar Header */}
                    <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
                        {!collapsed && (
                            <Link href="/administration" className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                                Administration
                            </Link>
                        )}
                        {collapsed && (
                            <Link
                                href="/administration"
                                className="flex w-full items-center justify-center text-xl font-semibold text-gray-800 dark:text-gray-200"
                            >
                                <span className="sr-only">Administration</span>
                                <Settings className="h-6 w-6" />
                            </Link>
                        )}
                    </div>

                    {/* Admin Nav Links */}
                    <nav className="flex-1 overflow-y-auto p-4">
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/administration"
                                    className={`flex items-center rounded-md px-3 py-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100 ${
                                        window.location.pathname === '/administration'
                                            ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                                            : ''
                                    }`}
                                >
                                    <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
                                    {!collapsed && <span className="ml-3">Dashboard</span>}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/administration/users"
                                    className={`flex items-center rounded-md px-3 py-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100 ${
                                        window.location.pathname.startsWith('/administration/users')
                                            ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                                            : ''
                                    }`}
                                >
                                    <Users className="h-5 w-5 flex-shrink-0" />
                                    {!collapsed && <span className="ml-3">Users</span>}
                                </Link>
                            </li>
                            {/* Add more admin menu items here */}
                        </ul>
                    </nav>

                    {/* Back to main app */}
                    <div className="border-t border-gray-200 p-4 dark:border-gray-700">
                        <Link
                            href="/dashboard"
                            className="flex items-center rounded-md px-3 py-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                        >
                            <ChevronRight className="h-5 w-5 flex-shrink-0 rotate-180" />
                            {!collapsed && <span className="ml-3">Back to App</span>}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div
                className={`flex-1 transition-all duration-300 ${pageLoaded ? 'opacity-100' : 'opacity-0'}`}
                style={{ marginLeft: collapsed ? '4rem' : '16rem' }}
            >
                <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/95">
                    <div className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center">
                            <div className="relative flex items-center">
                                <button
                                    onClick={() => setCollapsed(!collapsed)}
                                    className="rounded-md p-1.5 transition-all duration-200 hover:bg-gray-100 hover:shadow-sm dark:hover:bg-gray-700"
                                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                                >
                                    {collapsed ? (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="text-gray-600 dark:text-gray-300"
                                        >
                                            <polyline points="13 17 18 12 13 7"></polyline>
                                            <polyline points="6 17 11 12 6 7"></polyline>
                                        </svg>
                                    ) : (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="text-gray-600 dark:text-gray-300"
                                        >
                                            <polyline points="11 17 6 12 11 7"></polyline>
                                            <polyline points="18 17 13 12 18 7"></polyline>
                                        </svg>
                                    )}
                                </button>
                            </div>

                            <div className="ml-2 flex items-center overflow-x-auto">
                                <ChevronRight className="mx-1 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Administration</span>
                            </div>
                        </div>
                    </div>
                </div>

                <main className="relative z-10 flex-1 overflow-y-auto">
                    <div className="container mx-auto pt-4 pb-16">{children}</div>
                </main>
            </div>

            {/* Enhanced Toaster for notifications */}
            <Toaster
                position="top-right"
                closeButton={true}
                toastOptions={{
                    className: 'border border-gray-100 dark:border-gray-700',
                    style: {
                        background: 'var(--background)',
                        color: 'var(--foreground)',
                    },
                }}
            />
        </div>
    )
}
