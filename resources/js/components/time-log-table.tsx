import { ActionButton, ActionButtonGroup } from '@/components/action-buttons'
import DeleteTimeLog from '@/components/delete-time-log'
import TimeLogDetailsSheet from '@/components/time-log-details-sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableHeaderRow, TableRow } from '@/components/ui/table'
import { formatTimeEntry } from '@/lib/utils'
import { Edit, Glasses, Trash2 } from 'lucide-react'
import { useState } from 'react'

export type TimeLogEntry = {
    id: number
    project_id?: number
    project_name: string | null
    start_timestamp: string
    end_timestamp: string
    duration: number
    user_name?: string
    is_paid?: boolean
    note?: string
    hourly_rate?: number
    paid_amount?: number
    currency?: string
    status?: 'pending' | 'approved' | 'rejected'
    approved_by?: number
    approver_name?: string
    comment?: string
    user_non_monetary: boolean
    task_title?: string
    task_status?: string
    task_priority?: string
    task_due_date?: string | null
    task_description?: string | null
    tags?: Array<{ id: number; name: string; color: string }>
}

type TimeLogTableProps = {
    timeLogs: TimeLogEntry[]
    showTeamMember?: boolean
    showActions?: boolean
    showCheckboxes?: boolean
    showProject?: boolean
    showEditDelete?: boolean
    selectedLogs?: number[]
    onSelectLog?: (id: number, checked: boolean) => void
}

export default function TimeLogTable({
    timeLogs,
    showTeamMember = false,
    showActions = false,
    showCheckboxes = false,
    showProject = true,
    showEditDelete = true,
    selectedLogs = [],
    onSelectLog,
}: TimeLogTableProps) {
    const [selectedTimeLog, setSelectedTimeLog] = useState<TimeLogEntry | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    const handleViewDetails = (log: TimeLogEntry) => {
        setSelectedTimeLog(log)
        setIsDetailsOpen(true)
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableHeaderRow>
                        {showCheckboxes && <TableHead className="w-[50px]">Select</TableHead>}
                        {showTeamMember && <TableHead>Team Member</TableHead>}
                        <TableHead>Entry</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Hourly Rate</TableHead>
                        <TableHead>Paid Amount</TableHead>
                        <TableHead>Status</TableHead>
                        {showActions && <TableHead className="text-right">Actions</TableHead>}
                    </TableHeaderRow>
                </TableHeader>
                <TableBody>
                    {timeLogs.map((log) => (
                        <TableRow key={log.id}>
                            {showCheckboxes && (
                                <TableCell>
                                    <input
                                        type="checkbox"
                                        checked={selectedLogs.includes(log.id)}
                                        onChange={(e) => onSelectLog && onSelectLog(log.id, e.target.checked)}
                                        disabled={
                                            log.is_paid ||
                                            !log.start_timestamp ||
                                            !log.end_timestamp ||
                                            log.status !== 'approved' ||
                                            log.user_non_monetary
                                        }
                                        title={
                                            !log.start_timestamp || !log.end_timestamp
                                                ? 'Time logs without both start and end timestamps cannot be marked as paid'
                                                : log.status !== 'approved'
                                                  ? 'Time logs must be approved before they can be marked as paid'
                                                  : ''
                                        }
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </TableCell>
                            )}
                            {showTeamMember && <TableCell className="font-medium">{log.user_name}</TableCell>}
                            <TableCell className="font-medium">
                                {formatTimeEntry(log.start_timestamp, log.end_timestamp)}
                                <br />
                                <div className="flex flex-wrap items-center gap-1">
                                    {showProject && <small className="mr-1">{log.project_name || 'No Project'}</small>}
                                    {log.tags && log.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {log.tags.map((tag) => (
                                                <Badge key={tag.id} className="text-xs" style={{ backgroundColor: tag.color, color: '#fff' }}>
                                                    {tag.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="inline-flex items-center bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                    {log.duration}
                                </span>
                            </TableCell>
                            <TableCell>
                                {log.hourly_rate !== undefined &&
                                log.hourly_rate !== null &&
                                typeof log.hourly_rate === 'number' &&
                                log.hourly_rate > 0 ? (
                                    <span className="inline-flex items-center bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                                        {log.currency || 'USD'} {log.hourly_rate.toFixed(2)}
                                    </span>
                                ) : (
                                    <span className="text-gray-500">-</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    {/* Always show the amount, calculated if not paid */}
                                    <span
                                        className={`inline-flex items-center ${log.is_paid ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'} px-2 py-0.5 text-xs font-medium`}
                                    >
                                        {log.currency || 'USD'}{' '}
                                        {log.paid_amount !== undefined &&
                                        log.paid_amount !== null &&
                                        typeof log.paid_amount === 'number' &&
                                        log.paid_amount > 0
                                            ? log.paid_amount.toFixed(2)
                                            : log.hourly_rate !== undefined &&
                                                log.hourly_rate !== null &&
                                                typeof log.hourly_rate === 'number' &&
                                                log.hourly_rate > 0 &&
                                                log.duration
                                              ? (log.hourly_rate * log.duration).toFixed(2)
                                              : '0.00'}
                                    </span>

                                    {/* Payment status badge */}
                                    {log.hourly_rate !== undefined &&
                                        log.hourly_rate !== null &&
                                        typeof log.hourly_rate === 'number' &&
                                        log.hourly_rate > 0 &&
                                        (log.is_paid ? (
                                            <span className="inline-flex items-center bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                                                Paid
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                                                Unpaid
                                            </span>
                                        ))}
                                </div>
                            </TableCell>
                            <TableCell>
                                {/* Approval Status Only */}
                                {log.status === 'approved' ? (
                                    <span className="inline-flex items-center bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                                        Approved
                                    </span>
                                ) : log.status === 'rejected' ? (
                                    <span className="inline-flex items-center bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-100">
                                        Rejected
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                        Pending
                                    </span>
                                )}
                            </TableCell>
                            {showActions && (
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {/* View Details Button */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 w-7 border-blue-200 bg-blue-50 p-0 text-blue-700 hover:bg-blue-100"
                                            onClick={() => handleViewDetails(log)}
                                            title="View Details"
                                        >
                                            <Glasses className="h-3.5 w-3.5" />
                                            <span className="sr-only">View Details</span>
                                        </Button>

                                        <ActionButtonGroup>
                                            {showEditDelete && (
                                                <>
                                                    {/* Edit Button */}
                                                    {!log.is_paid ? (
                                                        <ActionButton
                                                            href={route('time-log.edit', log.id)}
                                                            title="Edit Log"
                                                            icon={Edit}
                                                            variant="amber"
                                                            size="icon"
                                                        />
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 w-7 p-0"
                                                            disabled
                                                            title="Paid time logs cannot be edited"
                                                        >
                                                            <Edit className="h-3.5 w-3.5" />
                                                            <span className="sr-only">Edit</span>
                                                        </Button>
                                                    )}

                                                    {/* Delete Button */}
                                                    {!log.is_paid ? (
                                                        <DeleteTimeLog timeLogId={log.id} />
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 w-7 p-0"
                                                            disabled
                                                            title="Paid time logs cannot be deleted"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            <span className="sr-only">Delete</span>
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </ActionButtonGroup>
                                    </div>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Time Log Details Sheet */}
            <TimeLogDetailsSheet timeLog={selectedTimeLog} open={isDetailsOpen} onOpenChange={setIsDetailsOpen} />
        </>
    )
}
