import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Loader from '@/components/ui/loader'
import { roundToTwoDecimals } from '@/lib/utils'
import { recentLogs as _recentLogs } from '@actions/DashboardController'
import { Link } from '@inertiajs/react'
import { ClockIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

interface TimeLogEntry {
    user: string
    date: string
    hours: number
}

interface RecentLogsData {
    entries: TimeLogEntry[]
    allLogsLink: string
}

export default function RecentTimeLogs() {
    const [recentLogs, setRecentLogs] = useState<RecentLogsData>({
        entries: [],
        allLogsLink: '',
    })
    const [loading, setLoading] = useState(true)

    const getRecentLogs = async (): Promise<void> => {
        try {
            setLoading(true)
            const data: RecentLogsData = await _recentLogs.data({})
            setRecentLogs(data)
        } catch (error: unknown) {
            console.error('Failed to fetch recent logs:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getRecentLogs().then()
    }, [])

    return (
        <Card className="overflow-hidden border-l-4 border-l-blue-500 transition-colors dark:border-l-blue-400">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xs font-bold uppercase">Recent Time Logs</CardTitle>
                        <CardDescription className="text-[10px]">Your team's latest activity</CardDescription>
                    </div>
                    {!loading && (
                        <Link
                            href={recentLogs.allLogsLink}
                            className="border-b border-gray-400 pb-0.5 text-xs font-bold text-gray-700 hover:border-gray-700 hover:text-gray-900 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-400 dark:hover:text-gray-100"
                        >
                            View all logs
                        </Link>
                    )}
                </div>
            </CardHeader>
            <CardContent className="py-1">
                <div className="space-y-2">
                    {loading ? (
                        <Loader message="Loading recent logs..." />
                    ) : recentLogs.entries.length > 0 ? (
                        recentLogs.entries.map((log: TimeLogEntry, index: number) => (
                            <div key={index} className="flex items-center justify-between border-b pb-1 last:border-0">
                                <div className="flex items-center gap-2">
                                    <div className="rounded-full bg-primary/10 p-1">
                                        <ClockIcon className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">
                                            {log.user} on{' '}
                                            {new Date(log.date).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-sm font-bold">{roundToTwoDecimals(log.hours)} hours</div>
                            </div>
                        ))
                    ) : (
                        <div className="py-4 text-center text-gray-700 dark:text-gray-300">
                            <p className="">No recent time logs found</p>
                            <Link
                                href={route('time-log.create')}
                                className="mt-2 inline-block border-b border-gray-400 pb-0.5 font-bold text-gray-700 hover:border-gray-700 hover:text-gray-900 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-400 dark:hover:text-gray-100"
                            >
                                Create your first time log
                            </Link>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
