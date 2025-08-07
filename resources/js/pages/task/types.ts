/**
 * Type definitions for Task-related components
 */

export type User = {
    id: number
    name: string
    email: string
}

export type Project = {
    id: number
    name: string
    user_id: number
}

export type Tag = {
    id: number
    name: string
    color: string
}

export type Task = {
    id: number
    project_id: number
    title: string
    description: string | null
    status: 'pending' | 'in_progress' | 'completed'
    priority: 'low' | 'medium' | 'high'
    due_date: string | null
    is_imported: boolean
    project: Project
    assignees: User[]
    tags?: Tag[]
    meta?: {
        source?: string
        source_url?: string
        source_number?: string
        source_id?: string
        source_state?: string
    }
}

/**
 * Task filter interface
 */
export interface TaskFilters {
    status: 'all' | 'incomplete' | 'pending' | 'in_progress' | 'completed'
    priority: string
    project: string
    tag: string
    'due-date-from': string | Date | ''
    'due-date-to': string | Date | ''
    search: string
}
