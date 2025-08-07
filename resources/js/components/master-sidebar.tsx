import Background from '@/components/ui/background'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { type NavItem, type SharedData } from '@/types'
import { count } from '@actions/ApprovalController'
import { count as taskCount } from '@actions/TaskController'
import { Link, usePage } from '@inertiajs/react'
import {
    Building,
    CheckSquare,
    ChevronDown,
    ChevronRight,
    ClipboardList,
    FileText,
    Folder,
    Github,
    LayoutGrid,
    LogOut,
    LucideProjector,
    LucideServerCog,
    Settings,
    TimerIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import AppLogo from './app-logo'
import AppLogoIcon from './app-logo-icon'

interface MasterSidebarProps {
    collapsed: boolean
}

// Added NavItemGroup type for grouped navigation items
interface NavItemGroup {
    title: string
    icon?: React.ElementType
    items: NavItem[]
}

// Reorganize navigation items into logical groups
const navGroups: NavItemGroup[] = [
    {
        title: 'Dashboard',
        icon: LayoutGrid,
        items: [
            {
                title: 'Dashboard',
                href: '/dashboard',
                icon: LayoutGrid,
            },
            {
                title: 'Team',
                href: '/team',
                icon: LucideServerCog,
            },
        ],
    },
    {
        title: 'Work Management',
        icon: Building,
        items: [
            {
                title: 'Clients',
                href: '/client',
                icon: Building,
            },
            {
                title: 'Projects',
                href: '/project',
                icon: LucideProjector,
            },
            {
                title: 'Tasks',
                href: '/task',
                icon: ClipboardList,
            },
        ],
    },
    {
        title: 'Time & Billing',
        icon: TimerIcon,
        items: [
            {
                title: 'Time Log',
                href: '/time-log',
                icon: TimerIcon,
            },
            {
                title: 'Tags',
                href: '/tags',
                icon: FileText,
            },
            {
                title: 'Invoices',
                href: '/invoice',
                icon: FileText,
            },
        ],
    },
    {
        title: 'Administration',
        icon: Settings,
        items: [
            {
                title: 'Approvals',
                href: '/approvals',
                icon: CheckSquare,
            },
            {
                title: 'Integration',
                href: '/integration',
                icon: Settings,
            },
        ],
    },
]

const integrationNavItems: NavItem[] = [
    {
        title: 'GitHub',
        href: '/github/repositories',
        icon: Github,
    },
]

const footerNavItems: NavItem[] = [
    {
        title: 'Feedback & Issues',
        href: 'https://github.com/msamgan/work-hours/issues',
        icon: Folder,
    },
]

// Collapsible sidebar group component
function SidebarGroup({
    title,
    icon: Icon,
    items,
    collapsed,
    approvalCount,
    pendingTaskCount,
}: NavItemGroup & {
    collapsed: boolean
    approvalCount: number
    pendingTaskCount: number
}) {
    // Initialize as collapsed by default
    const [isExpanded, setIsExpanded] = useState(false)
    const anyItemActive = items.some(
        (item) => typeof window !== 'undefined' && (window.location.pathname === item.href || window.location.pathname.startsWith(`${item.href}/`)),
    )

    // Calculate total counts for this group
    const hasApprovals = items.some((item) => item.href === '/approvals')
    const hasTasks = items.some((item) => item.href === '/task')
    const groupApprovalCount = hasApprovals ? approvalCount : 0
    const groupTaskCount = hasTasks ? pendingTaskCount : 0
    const totalBadgeCount = groupApprovalCount + groupTaskCount

    // Auto-expand group if any item is active
    useEffect(() => {
        if (anyItemActive) {
            setIsExpanded(true)
        }
    }, [anyItemActive])

    useEffect(() => {
        if (collapsed) {
            setIsExpanded(true)
        }
    }, [collapsed])

    const toggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation()
        console.log('Toggle button clicked, collapsed state:', collapsed)

        if (!collapsed) {
            const newState = !isExpanded
            console.log('Toggle clicked, changing state from', isExpanded, 'to', newState)
            setIsExpanded(newState)
        }
    }

    return (
        <div className="mb-2">
            {/* Group header - Move onClick to only the button element */}
            <button
                type="button"
                onClick={toggleExpand}
                className={`group relative z-30 flex w-full cursor-pointer items-center rounded-md px-2 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-white hover:text-gray-900 hover:shadow-sm dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100 ${anyItemActive ? 'font-semibold' : ''}`}
            >
                <div className="relative">
                    {Icon && (
                        <Icon
                            className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${!collapsed ? 'mr-3' : ''} text-gray-500 dark:text-gray-400`}
                            aria-hidden="true"
                        />
                    )}

                    {/* Show badge on parent menu if any child items have counts */}
                    {totalBadgeCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-0 -right-36 flex h-4 min-w-4 items-center justify-center overflow-hidden rounded-full border-0 px-1 text-xs font-semibold shadow-sm"
                        >
                            {totalBadgeCount > 99 ? '99+' : totalBadgeCount}
                        </Badge>
                    )}
                </div>

                {!collapsed && (
                    <>
                        <span className="flex-1 text-left">{title}</span>
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                        )}
                    </>
                )}
            </button>

            {/* Group items */}
            {(collapsed || isExpanded) && (
                <div className={`mt-1 space-y-1 ${collapsed ? '' : 'ml-4'} overflow-hidden transition-all duration-300`}>
                    <TooltipProvider>
                        {items.map((item) => {
                            const isActive =
                                typeof window !== 'undefined' &&
                                (window.location.pathname === item.href || window.location.pathname.startsWith(`${item.href}/`))

                            return (
                                <div key={item.href} className="relative">
                                    <Link
                                        href={item.href}
                                        className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-all duration-200 ${
                                            isActive
                                                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100'
                                                : 'text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                                        }`}
                                    >
                                        <div className="relative">
                                            {item.icon && (
                                                <item.icon
                                                    className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                                                        !collapsed ? 'mr-3' : ''
                                                    } ${isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}
                                                    aria-hidden="true"
                                                />
                                            )}
                                            {item.href === '/approvals' && approvalCount > 0 && (
                                                <Badge
                                                    variant="destructive"
                                                    className="absolute top-0 -right-24 flex h-4 min-w-4 items-center justify-center overflow-hidden rounded-full border-0 px-1 text-xs font-semibold shadow-sm"
                                                >
                                                    {approvalCount > 99 ? '99+' : approvalCount}
                                                </Badge>
                                            )}
                                            {item.href === '/task' && pendingTaskCount > 0 && (
                                                <Badge
                                                    variant="destructive"
                                                    className="absolute top-0 -right-16 flex h-4 min-w-4 items-center justify-center overflow-hidden rounded-full border-0 px-1 text-xs font-semibold shadow-sm"
                                                >
                                                    {pendingTaskCount > 99 ? '99+' : pendingTaskCount}
                                                </Badge>
                                            )}
                                        </div>
                                        {!collapsed && <span>{item.title}</span>}
                                        {isActive && <div className="absolute inset-y-0 left-0 w-1 rounded-r-md bg-gray-700 dark:bg-gray-400"></div>}
                                    </Link>
                                    {collapsed && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="pointer-events-none absolute inset-0 z-20 cursor-pointer"></div>
                                            </TooltipTrigger>
                                            <TooltipContent side="right" className="shadow-lg">
                                                {item.title}
                                                {item.href === '/approvals' && approvalCount > 0 && ` (${approvalCount})`}
                                                {item.href === '/task' && pendingTaskCount > 0 && ` (${pendingTaskCount})`}
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                </div>
                            )
                        })}
                    </TooltipProvider>
                </div>
            )}
        </div>
    )
}

export function MasterSidebar({ collapsed }: MasterSidebarProps) {
    const { isGitHubIntegrated, auth } = usePage<SharedData>().props
    const [approvalCount, setApprovalCount] = useState(0)
    const [pendingTaskCount, setPendingTaskCount] = useState(0)

    // Fetch approval count when component mounts
    useEffect(() => {
        const fetchApprovalCount = async () => {
            try {
                const response = await count.data({})
                setApprovalCount(response.count)
            } catch (error) {
                console.error('Failed to fetch approval count', error)
            }
        }

        fetchApprovalCount().then()

        // Set up an interval to refresh the count every minute
        const intervalId = setInterval(fetchApprovalCount, 60000)

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId)
    }, [])

    // Fetch pending task count when component mounts
    useEffect(() => {
        const fetchPendingTaskCount = async () => {
            try {
                const response = await taskCount.data({})
                setPendingTaskCount(response.count)
            } catch (error) {
                console.error('Failed to fetch pending task count', error)
            }
        }

        fetchPendingTaskCount().then()

        // Set up an interval to refresh the count every minute
        const intervalId = setInterval(fetchPendingTaskCount, 60000)

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId)
    }, [])

    return (
        <div
            className={`sticky top-0 flex h-screen flex-col border-r border-gray-200 bg-[#f8f6e9] shadow-md transition-all duration-300 ease-in-out dark:border-gray-700 dark:bg-gray-900 ${
                collapsed ? 'w-20' : 'w-68'
            }`}
        >
            <Background showMarginLine={false} />

            {/* Header with improved styling */}
            <div
                className={`relative z-20 border-b border-gray-200 p-4 pt-3 pb-3 transition-all duration-300 ease-in-out dark:border-gray-700 ${
                    collapsed ? 'flex flex-col items-center' : 'px-6'
                }`}
            >
                <div className={`flex w-full items-center ${collapsed ? 'flex-col justify-center' : ''}`}>
                    <Link href={route('dashboard')} className={`${collapsed ? 'mb-2 flex items-center justify-center p-1' : 'flex items-center'}`}>
                        {collapsed ? <AppLogoIcon className="h-12 w-24 text-gray-700 dark:text-gray-300" /> : <AppLogo />}
                    </Link>
                </div>
            </div>

            {/* Navigation - scrollable content */}
            <div className={`flex flex-1 flex-col overflow-y-auto pt-3 ${collapsed ? 'px-2' : 'px-4'}`}>
                {/* Platform Navigation with grouped items */}
                <div className="mb-6">
                    <div className="mb-3 border-b border-gray-300 pb-2 dark:border-gray-600">
                        <h3
                            className={`text-xs font-bold tracking-wider text-gray-700 uppercase dark:text-gray-300 ${
                                collapsed ? 'text-center' : 'px-2'
                            }`}
                        >
                            {collapsed ? 'Menu' : 'Platform'}
                        </h3>
                    </div>
                    <div className="space-y-2">
                        {navGroups.map((group) => (
                            <SidebarGroup
                                key={group.title}
                                title={group.title}
                                icon={group.icon}
                                items={group.items}
                                collapsed={collapsed}
                                approvalCount={approvalCount}
                                pendingTaskCount={pendingTaskCount}
                            />
                        ))}
                    </div>
                </div>

                {/* Integration Navigation */}
                {isGitHubIntegrated && (
                    <div className="mb-6">
                        <div className="mb-3 border-b border-gray-300 pb-2 dark:border-gray-600">
                            <h3
                                className={`text-xs font-bold tracking-wider text-gray-700 uppercase dark:text-gray-300 ${
                                    collapsed ? 'text-center' : 'px-2'
                                }`}
                            >
                                {collapsed ? 'Int.' : 'Integration'}
                            </h3>
                        </div>
                        <TooltipProvider>
                            <nav className="relative z-10 space-y-1">
                                {integrationNavItems.map((item) => {
                                    const isActive =
                                        typeof window !== 'undefined' &&
                                        (window.location.pathname === item.href || window.location.pathname.startsWith(`${item.href}/`))
                                    return (
                                        <div key={item.href} className="relative">
                                            <Link
                                                href={item.href}
                                                className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-all duration-200 ${
                                                    isActive
                                                        ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100'
                                                        : 'text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                                                }`}
                                            >
                                                {item.icon && (
                                                    <item.icon
                                                        className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                                                            !collapsed ? 'mr-3' : ''
                                                        } ${isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}
                                                        aria-hidden="true"
                                                    />
                                                )}
                                                {!collapsed && <span>{item.title}</span>}
                                                {isActive && (
                                                    <div className="absolute inset-y-0 left-0 w-1 rounded-r-md bg-gray-700 dark:bg-gray-400"></div>
                                                )}
                                            </Link>
                                            {collapsed && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="pointer-events-none absolute inset-0 z-20 cursor-pointer"></div>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="right" className="shadow-lg">
                                                        {item.title}
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    )
                                })}
                            </nav>
                        </TooltipProvider>
                    </div>
                )}
            </div>

            {/* Footer with enhanced styling */}
            <div className={`border-t border-gray-200 pt-3 pb-4 dark:border-gray-700 ${collapsed ? 'px-2' : 'px-4'}`}>
                <div className="mb-4">
                    <h3
                        className={`mb-2 text-xs font-bold tracking-wider text-gray-700 uppercase dark:text-gray-300 ${
                            collapsed ? 'text-center' : 'px-2'
                        }`}
                    >
                        Links
                    </h3>
                    <TooltipProvider>
                        <nav className="relative z-10 space-y-1">
                            {footerNavItems.map((item) => (
                                <div key={item.href} className="relative">
                                    <a
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-white hover:text-gray-900 hover:shadow-sm dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                                    >
                                        {item.icon && (
                                            <item.icon
                                                className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                                                    !collapsed ? 'mr-3' : ''
                                                } text-gray-500 dark:text-gray-400`}
                                                aria-hidden="true"
                                            />
                                        )}
                                        {!collapsed && <span>{item.title}</span>}
                                    </a>
                                    {collapsed && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="pointer-events-none absolute inset-0 z-20 cursor-pointer"></div>
                                            </TooltipTrigger>
                                            <TooltipContent side="right" className="shadow-lg">
                                                {item.title}
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </TooltipProvider>
                </div>

                {/* User section with enhanced styling */}
                <div className="mb-3 px-2">
                    <div className={`flex items-center ${collapsed ? 'justify-center' : ''} relative z-10`}>
                        <div className="flex-shrink-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 font-bold text-gray-700 shadow-sm ring-2 ring-white dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-800">
                                {auth.user && auth.user.name ? auth.user.name.charAt(0) : ''}
                            </div>
                        </div>
                        {!collapsed && (
                            <div className="ml-3">
                                <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {auth.user && auth.user.name ? auth.user.name : ''}
                                </p>
                                <Link
                                    href="/settings/profile"
                                    className="relative z-10 text-xs text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    View profile
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom link with enhanced styling */}
                <div className="mt-auto border-t border-gray-200 px-2 pt-3 dark:border-gray-700">
                    <TooltipProvider>
                        <div className="relative">
                            <Link
                                href={route('logout')}
                                method="post"
                                className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-white hover:text-red-700 hover:shadow-sm dark:text-red-400 dark:hover:bg-gray-800 dark:hover:text-red-300"
                            >
                                <LogOut
                                    className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                                        !collapsed ? 'mr-3' : ''
                                    } text-red-500 dark:text-red-400`}
                                    aria-hidden="true"
                                />
                                {!collapsed && <span>Logout</span>}
                            </Link>
                            {collapsed && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="pointer-events-none absolute inset-0 z-20 cursor-pointer"></div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="shadow-lg">
                                        Logout
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                    </TooltipProvider>
                </div>
            </div>
        </div>
    )
}
