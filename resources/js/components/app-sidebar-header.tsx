import { Breadcrumbs } from '@/components/breadcrumbs'
import AppearanceToggleDropdown from '@/components/appearance-dropdown'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types'

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    return (
        <header className="mx-auto mt-6 flex h-12 w-9/12 shrink-0 items-center gap-3 rounded-md border-b border-sidebar-border/30 bg-background/50 px-6 shadow-sm backdrop-blur-sm transition-all duration-300 ease-in-out group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-1 transition-colors duration-200 hover:bg-sidebar-accent/10 hover:text-sidebar-accent" />
                <div className="mx-1 h-4 w-px bg-sidebar-border/30" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="ml-auto">
                <AppearanceToggleDropdown />
            </div>
        </header>
    )
}
