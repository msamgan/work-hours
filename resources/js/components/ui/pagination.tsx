import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { Link } from '@inertiajs/react'
import React from 'react'

interface PaginationLink {
  url: string | null
  label: string
  active: boolean
}

export interface PaginationProps {
  links: PaginationLink[]
}

export function Pagination({ links }: PaginationProps) {
  // Don't render pagination if there are no links or only one page
  if (!links || links.length <= 3) {
    return null
  }

  // Filter out the "Previous" and "Next" links from the beginning and end
  const pageLinks = links.slice(1, -1)

  return (
    <nav
      role="navigation"
      aria-label="Pagination Navigation"
      className="flex items-center justify-between"
    >
      <div className="flex w-full flex-1 items-center justify-center gap-1 md:hidden">
        {/* Previous Button for Mobile */}
        {links[0].url ? (
          <Link
            href={links[0].url as string}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background p-2 text-sm font-medium text-muted-foreground ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            <span className="sr-only">Previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background p-2 text-sm font-medium text-muted-foreground opacity-50">
            <span className="sr-only">Previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </span>
        )}

        {/* Mobile current page indicator */}
        <span className="text-sm font-medium">
          {pageLinks.findIndex(link => link.active) + 1} / {pageLinks.length}
        </span>

        {/* Next Button for Mobile */}
        {links[links.length - 1].url ? (
          <Link
            href={links[links.length - 1].url as string}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background p-2 text-sm font-medium text-muted-foreground ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            <span className="sr-only">Next page</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background p-2 text-sm font-medium text-muted-foreground opacity-50">
            <span className="sr-only">Next page</span>
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="hidden md:flex md:flex-1 md:items-center md:justify-center">
        {/* Previous Button */}
        {links[0].url ? (
          <Link
            href={links[0].url as string}
            className="mr-2 inline-flex h-9 items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-muted-foreground ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Link>
        ) : (
          <span className="mr-2 inline-flex h-9 items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-muted-foreground opacity-50">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </span>
        )}

        {/* Page Links */}
        <div className="flex items-center space-x-1">
          {pageLinks.map((link, i) => {
            // For page numbers
            if (!link.label.includes('...')) {
              return link.url ? (
                <Link
                  key={i}
                  href={link.url as string}
                  aria-current={link.active ? 'page' : undefined}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    link.active
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ) : (
                <span
                  key={i}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-sm font-medium text-muted-foreground"
                >
                  {link.label}
                </span>
              )
            }

            // For ellipses
            return (
              <span
                key={i}
                className="inline-flex h-9 w-9 items-center justify-center"
              >
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
              </span>
            )
          })}
        </div>

        {/* Next Button */}
        {links[links.length - 1].url ? (
          <Link
            href={links[links.length - 1].url as string}
            className="ml-2 inline-flex h-9 items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-muted-foreground ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        ) : (
          <span className="ml-2 inline-flex h-9 items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-muted-foreground opacity-50">
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </span>
        )}
      </div>
    </nav>
  )
}
