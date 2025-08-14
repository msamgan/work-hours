import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { formatTimeEntry } from '@/lib/utils'
import { Info } from 'lucide-react'
import { TimeLogEntry } from './time-log-table'

type TimeLogDetailsSheetProps = {
    timeLog: TimeLogEntry | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function TimeLogDetailsSheet({ timeLog, open, onOpenChange }: TimeLogDetailsSheetProps) {
    if (!timeLog) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="overflow-y-auto sm:max-w-md md:max-w-lg">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                        <Info className="h-5 w-5 text-primary" />
                        Time Log Details
                    </SheetTitle>
                    <SheetDescription className="text-sm text-gray-500 dark:text-gray-400">
                        Viewing complete information for this time log entry
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 py-4">
                    {/* Basic Information */}
                    <div className="space-y-2">
                        <h3 className="ml-4 text-lg font-medium text-gray-800 dark:text-gray-100">Basic Information</h3>
                        <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                            <div>
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Project</p>
                                <p className="text-sm text-gray-800 dark:text-gray-200">{timeLog.project_name || 'No Project'}</p>
                            </div>

                            {timeLog.user_name && (
                                <div>
                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Team Member</p>
                                    <p className="text-sm text-gray-800 dark:text-gray-200">{timeLog.user_name}</p>
                                </div>
                            )}

                            <div>
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Duration</p>
                                <p className="text-sm text-gray-800 dark:text-gray-200">{timeLog.duration} hours</p>
                            </div>
                        </div>
                    </div>

                    {/* Tags Information - Only shown if tags exist */}
                    {timeLog.tags && timeLog.tags.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="ml-4 flex items-center gap-2 text-lg font-medium text-gray-800 dark:text-gray-100">
                                <Info className="h-5 w-5 text-primary" /> Tags
                            </h3>
                            <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                                <div className="flex flex-wrap gap-2">
                                    {timeLog.tags.map((tag) => (
                                        <Badge key={tag.id} style={{ backgroundColor: tag.color, color: '#fff' }}>
                                            {tag.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Task Information */}
                    {timeLog.task_title && (
                        <div className="space-y-2">
                            <h3 className="ml-4 text-lg font-medium text-gray-800 dark:text-gray-100">Task Information</h3>
                            <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                                <div>
                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Task Title</p>
                                    <p className="text-sm text-gray-800 dark:text-gray-200">{timeLog.task_title}</p>
                                </div>

                                {timeLog.task_status && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Task Status</p>
                                        <p className="text-sm text-gray-800 dark:text-gray-200">{timeLog.task_status}</p>
                                    </div>
                                )}

                                {timeLog.task_priority && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Task Priority</p>
                                        <p className="text-sm text-gray-800 dark:text-gray-200">{timeLog.task_priority}</p>
                                    </div>
                                )}

                                {timeLog.task_due_date && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Task Due Date</p>
                                        <p className="text-sm text-gray-800 dark:text-gray-200">{timeLog.task_due_date}</p>
                                    </div>
                                )}

                                {timeLog.task_description && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Task Description</p>
                                        <p className="text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200">{timeLog.task_description}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Time Information */}
                    <div className="space-y-2">
                        <h3 className="ml-4 text-lg font-medium text-gray-800 dark:text-gray-100">Time Information</h3>
                        <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                            <div>
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Entry</p>
                                <p className="text-sm text-gray-800 dark:text-gray-200">
                                    {formatTimeEntry(timeLog.start_timestamp, timeLog.end_timestamp)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Information - Only shown for monetary users */}
                    {timeLog.hourly_rate !== undefined &&
                        timeLog.hourly_rate !== null &&
                        typeof timeLog.hourly_rate === 'number' &&
                        timeLog.hourly_rate > 0 && (
                            <div className="space-y-2">
                                <h3 className="ml-4 text-lg font-medium text-gray-800 dark:text-gray-100">Payment Information</h3>
                                <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                                    <div>
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Hourly Rate</p>
                                        <p className="text-sm text-gray-800 dark:text-gray-200">{`${timeLog.currency || 'USD'} ${timeLog.hourly_rate.toFixed(2)}`}</p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                            {timeLog.is_paid ? 'Paid Amount' : 'To Pay Amount'}
                                        </p>
                                        <p className="text-sm text-gray-800 dark:text-gray-200">
                                            <span
                                                className={`inline-flex items-center rounded-full ${timeLog.is_paid ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'} px-2 py-0.5 text-xs font-medium`}
                                            >
                                                {timeLog.currency || 'USD'}{' '}
                                                {timeLog.paid_amount !== undefined &&
                                                timeLog.paid_amount !== null &&
                                                typeof timeLog.paid_amount === 'number' &&
                                                timeLog.paid_amount > 0
                                                    ? timeLog.paid_amount.toFixed(2)
                                                    : timeLog.hourly_rate !== undefined &&
                                                        timeLog.hourly_rate !== null &&
                                                        typeof timeLog.hourly_rate === 'number' &&
                                                        timeLog.hourly_rate > 0 &&
                                                        timeLog.duration
                                                      ? (timeLog.hourly_rate * timeLog.duration).toFixed(2)
                                                      : '0.00'}
                                            </span>
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Payment Status</p>
                                        <p className="text-sm text-gray-800 dark:text-gray-200">
                                            {timeLog.is_paid ? (
                                                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                                                    Paid
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                                                    Unpaid
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                    {/* Approval Information */}
                    <div className="space-y-2">
                        <h3 className="ml-4 text-lg font-medium text-gray-800 dark:text-gray-100">Approval Information</h3>
                        <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                            <div>
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Status</p>
                                <p className="text-sm text-gray-800 dark:text-gray-200">
                                    {timeLog.status === 'approved' ? (
                                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                                            Approved
                                        </span>
                                    ) : timeLog.status === 'rejected' ? (
                                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-100">
                                            Rejected
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                            Pending
                                        </span>
                                    )}
                                </p>
                            </div>

                            {timeLog.approver_name && (
                                <div>
                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Approved By</p>
                                    <p className="text-sm text-gray-800 dark:text-gray-200">{timeLog.approver_name}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="space-y-2">
                        <h3 className="ml-4 text-lg font-medium text-gray-800 dark:text-gray-100">Additional Information</h3>
                        <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                            {timeLog.note && (
                                <div>
                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Note</p>
                                    <p className="text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200">{timeLog.note}</p>
                                </div>
                            )}

                            {timeLog.comment && (
                                <div>
                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Comment</p>
                                    <p className="text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200">{timeLog.comment}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
