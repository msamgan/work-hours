import Background from '@/components/ui/background'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { type NavItem, type SharedData } from '@/types'
import { count } from '@actions/ApprovalController'
import { Link, usePage } from '@inertiajs/react'
import {
    Building,
    CheckSquare,
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

const mainNavItems: NavItem[] = [
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
    {
        title: 'Time Log',
        href: '/time-log',
        icon: TimerIcon,
    },
    {
        title: 'Invoices',
        href: '/invoice',
        icon: FileText,
    },
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

export function MasterSidebar({ collapsed }: MasterSidebarProps) {
    const { isGitHubIntegrated, auth } = usePage<SharedData>().props
    const [approvalCount, setApprovalCount] = useState(0)

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

    return (
        <div
            className={`sticky top-0 flex h-screen flex-col border-r border-gray-300 bg-[#f8f6e9] shadow-sm transition-all duration-300 ease-in-out dark:border-gray-700 dark:bg-gray-900 ${collapsed ? 'w-20' : 'w-68'}`}
        >
            <Background showMarginLine={false} />

            {/* Header with improved styling */}
            <div
                className={`relative z-20 p-4 pt-2 pb-2 transition-all duration-300 ease-in-out ${collapsed ? 'flex flex-col items-center' : 'ml-8'}`}
            >
                <div className={`flex w-full items-center ${collapsed ? 'flex-col' : ''}`}>
                    <Link href={route('dashboard')} className={`${collapsed ? 'mb-2 flex items-center justify-center p-1' : 'flex items-center'}`}>
                        {collapsed ? <AppLogoIcon className="h-12 w-24 text-gray-700 dark:text-gray-300" /> : <AppLogo />}
                    </Link>
                </div>
            </div>

            {/* Navigation - scrollable content */}
            <div className={`flex flex-1 flex-col overflow-y-auto pt-3 ${collapsed ? '' : 'ml-8'}`}>
                {/* Platform Navigation */}
                <div className="mb-6 px-4">
                    <div className="mb-3 border-b border-gray-400 pb-2 dark:border-gray-600">
                        <h3
                            className={`text-sm font-bold tracking-wider text-gray-900 uppercase dark:text-gray-200 ${collapsed ? 'text-center' : ''}`}
                        >
                            {collapsed ? 'Menu' : 'Platform'}
                        </h3>
                    </div>
                    <TooltipProvider>
                        <nav className="relative z-10 space-y-1">
                            {mainNavItems.map((item) => (
                                <div key={item.href} className="relative">
                                    <Link
                                        href={item.href}
                                        className={`flex items-center rounded-md px-2 py-2 text-sm font-medium transition-all duration-200 hover:bg-white hover:text-gray-900 hover:shadow-sm dark:hover:bg-gray-700 dark:hover:text-gray-100 ${
                                            typeof window !== 'undefined' &&
                                            (window.location.pathname === item.href || window.location.pathname.startsWith(item.href))
                                                ? 'border-l-4 border-gray-700 bg-white text-gray-900 shadow-sm dark:border-gray-400 dark:bg-gray-700 dark:text-gray-100'
                                                : 'text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        <div className="relative">
                                            {item.icon && <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />}
                                            {item.href === '/approvals' && approvalCount > 0 && (
                                                <Badge
                                                    variant="destructive"
                                                    className="absolute top-0 -right-25 flex h-5 min-w-5 items-center justify-center overflow-hidden rounded-full border-0 px-1.5 text-xs font-semibold"
                                                >
                                                    {approvalCount > 99 ? '99+' : approvalCount}
                                                </Badge>
                                            )}
                                        </div>
                                        {!collapsed && <span>{item.title}</span>}
                                    </Link>
                                    {collapsed && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="pointer-events-none absolute inset-0 z-20 cursor-pointer"></div>
                                            </TooltipTrigger>
                                            <TooltipContent side="right">
                                                {item.title}
                                                {item.href === '/approvals' && approvalCount > 0 && ` (${approvalCount})`}
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </TooltipProvider>
                </div>

                {/* Integration Navigation */}
                {isGitHubIntegrated && (
                    <div className="mb-6 px-4">
                        <div className="mb-3 border-b border-gray-400 pb-2 dark:border-gray-600">
                            <h3
                                className={`text-sm font-bold tracking-wider text-gray-900 uppercase dark:text-gray-200 ${collapsed ? 'text-center' : ''}`}
                            >
                                {collapsed ? 'Int.' : 'Integration'}
                            </h3>
                        </div>
                        <TooltipProvider>
                            <nav className="relative z-10 space-y-1">
                                {integrationNavItems.map((item) => (
                                    <div key={item.href} className="relative">
                                        <Link
                                            href={item.href}
                                            className={`flex items-center rounded-md px-2 py-2 text-sm font-medium transition-all duration-200 hover:bg-white hover:text-gray-900 hover:shadow-sm dark:hover:bg-gray-700 dark:hover:text-gray-100 ${
                                                typeof window !== 'undefined' && window.location.pathname === item.href
                                                    ? 'border-l-4 border-gray-700 bg-white text-gray-900 shadow-sm dark:border-gray-400 dark:bg-gray-700 dark:text-gray-100'
                                                    : 'text-gray-700 dark:text-gray-300'
                                            }`}
                                        >
                                            {item.icon && <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />}
                                            {!collapsed && <span>{item.title}</span>}
                                        </Link>
                                        {collapsed && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="pointer-events-none absolute inset-0 z-20 cursor-pointer"></div>
                                                </TooltipTrigger>
                                                <TooltipContent side="right">{item.title}</TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                ))}
                            </nav>
                        </TooltipProvider>
                    </div>
                )}
            </div>

            {/* Footer with enhanced styling */}
            <div className={`border-t border-gray-400 pt-4 pb-4 dark:border-gray-600 ${collapsed ? '' : 'ml-8'}`}>
                <div className="mb-4 px-4">
                    <h3
                        className={`mb-2 text-xs font-bold tracking-wider text-gray-900 uppercase dark:text-gray-200 ${collapsed ? 'text-center' : ''}`}
                    >
                        {collapsed ? 'Links' : 'Links'}
                    </h3>
                    <TooltipProvider>
                        <nav className="relative z-10 space-y-1">
                            {footerNavItems.map((item) => (
                                <div key={item.href} className="relative">
                                    <a
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-white hover:text-gray-900 hover:shadow-sm dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                                    >
                                        {item.icon && <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />}
                                        {!collapsed && <span>{item.title}</span>}
                                    </a>
                                    {collapsed && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="pointer-events-none absolute inset-0 z-20 cursor-pointer"></div>
                                            </TooltipTrigger>
                                            <TooltipContent side="right">{item.title}</TooltipContent>
                                        </Tooltip>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </TooltipProvider>
                </div>

                {/* User section with enhanced styling */}
                <div className="mb-3 px-4">
                    <div className={`flex items-center ${collapsed ? 'justify-center' : ''} relative z-10`}>
                        <div className="flex-shrink-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 font-bold text-gray-700 shadow-sm dark:bg-gray-600 dark:text-gray-200">
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
                <div className="mt-auto border-t border-gray-400 px-4 pt-4 dark:border-gray-600">
                    <TooltipProvider>
                        <div className="relative">
                            <Link
                                href={route('logout')}
                                method="post"
                                className="flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-white hover:text-gray-900 hover:shadow-sm dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                            >
                                <LogOut className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                                {!collapsed && <span>Logout</span>}
                            </Link>
                            {collapsed && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="pointer-events-none absolute inset-0 z-20 cursor-pointer"></div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">Logout</TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                    </TooltipProvider>
                </div>
            </div>
        </div>
    )
}
