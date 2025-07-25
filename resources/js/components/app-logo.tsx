import { cn } from '@/lib/utils'
import { type HTMLAttributes } from 'react'
import AppLogoIcon from './app-logo-icon'

const appName = import.meta.env.VITE_APP_NAME || 'Laravel'

export default function AppLogo({ className }: HTMLAttributes<HTMLDivElement>) {
    return (
        <>
            <div className="flex aspect-square size-9 items-center justify-center rounded-md text-sidebar-primary-foreground shadow-sm transition-all duration-200 hover:shadow-md">
                <AppLogoIcon className="size-6 text-sidebar-primary-foreground" />
            </div>
            <div className={cn('ml-2 grid flex-1 text-left', className)}>
                <span className="truncate text-sm leading-tight font-bold tracking-tight">{appName}</span>
                <span className="text-xs">Time Tracking</span>
            </div>
        </>
    )
}
