import AppearanceToggleDropdown from '@/components/appearance-dropdown'
import { HourlyRateStatusBar } from '@/components/hourly-rate-status-bar'
import Background from '@/components/ui/background'
import { Badge } from '@/components/ui/badge'
import { type BreadcrumbItem } from '@/types'
import { all } from '@actions/NotificationsController'
import { Link } from '@inertiajs/react'
import { Bell, ChevronRight, Home, Settings } from 'lucide-react'
import { type Dispatch, type ReactNode, type SetStateAction, useEffect, useState } from 'react'

interface MasterContentProps {
    children: ReactNode
    breadcrumbs?: BreadcrumbItem[]
    collapsed: boolean
    setCollapsed: Dispatch<SetStateAction<boolean>>
}

export function MasterContent({ children, breadcrumbs = [], collapsed, setCollapsed }: MasterContentProps) {
    const [unreadCount, setUnreadCount] = useState(0)
    const [isAdmin, setIsAdmin] = useState(false)

    // Fetch unread notification count when the component mounts
    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const response = await all.data({ page: 1 })
                setUnreadCount(response.unread_count)

                // Check if user is admin (this data will be passed from the backend)
                if (response.user && response.user.is_admin) {
                    setIsAdmin(true)
                }
            } catch (error) {
                console.error('Failed to fetch unread notifications count', error)
            }
        }

        fetchUnreadCount().then()

        // Set up an interval to refresh the count every minute
        const intervalId = setInterval(fetchUnreadCount, 60000)

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId)
    }, [])

    return (
        <div className="relative flex flex-1 flex-col bg-[#f8f6e9] dark:bg-gray-900">
            <Background showMarginLine={false} showPunches={false} />
            {/* Enhanced header with improved styling */}
            <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/95">
                <div className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center">
                        <div className="relative flex items-center">
                            <Link
                                href="/dashboard"
                                className="rounded-md p-1.5 text-gray-600 transition-all duration-150 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                            >
                                <Home className="h-5 w-5" />
                            </Link>
                            <button
                                onClick={() => setCollapsed(!collapsed)}
                                className="ml-2 rounded-md p-1.5 transition-all duration-200 hover:bg-gray-100 hover:shadow-sm dark:hover:bg-gray-700"
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
                        {breadcrumbs.length > 0 && (
                            <div className="ml-2 flex items-center overflow-x-auto">
                                <ChevronRight className="mx-1 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                {breadcrumbs.map((breadcrumb, index) => (
                                    <div key={breadcrumb.href || index} className="flex items-center whitespace-nowrap">
                                        {breadcrumb.href ? (
                                            <Link
                                                href={breadcrumb.href}
                                                className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                                            >
                                                {breadcrumb.title}
                                            </Link>
                                        ) : (
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{breadcrumb.title}</span>
                                        )}
                                        {index < breadcrumbs.length - 1 && <ChevronRight className="mx-1 h-4 w-4 text-gray-400 dark:text-gray-500" />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Theme Switcher */}
                        <AppearanceToggleDropdown className="rounded-md text-gray-600 dark:text-gray-300" />

                        {/* Calendar Link */}
                        <Link
                            href="/calendar"
                            className="relative flex items-center rounded-md p-1.5 text-gray-600 transition-all duration-150 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                            aria-label="View calendar"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-5 w-5"
                            >
                                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                        </Link>

                        {/* Admin Dashboard Link (Only visible for admins) */}
                        {isAdmin && (
                            <Link
                                href="/administration"
                                className="relative flex items-center rounded-md p-1.5 text-gray-600 transition-all duration-150 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                                aria-label="Admin Dashboard"
                            >
                                <Settings className="h-5 w-5" />
                            </Link>
                        )}

                        {/* Notification Link */}
                        <Link
                            href="/notifications"
                            className="relative flex items-center rounded-md p-1.5 text-gray-600 transition-all duration-150 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                            aria-label="View notifications"
                        >
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <Badge
                                    variant="destructive"
                                    className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center overflow-hidden rounded-full border-0 px-1.5 text-xs font-semibold shadow-sm"
                                >
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </Badge>
                            )}
                        </Link>
                    </div>
                </div>
            </div>
            <main className="relative z-10 flex-1 overflow-y-auto">
                {/* Hourly rate status bar */}
                <HourlyRateStatusBar />

                {/* Enhanced content container with improved padding */}
                <div className="container mx-auto pt-4 pb-16">{children}</div>
            </main>
        </div>
    )
}
