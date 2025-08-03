import { Head } from '@inertiajs/react'
import axios from 'axios'
import { Download, ExternalLink, Trello, Loader2, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import MasterLayout from '@/layouts/master-layout'
import { cn } from '@/lib/utils'
import { type BreadcrumbItem, type NavItem } from '@/types'
import { toast } from 'sonner'

type Board = {
    id: string
    name: string
    desc?: string
    url?: string
    shortUrl?: string
    closed?: boolean
    is_imported?: boolean
    lists?: BoardList[]
}

type BoardList = {
    id: string
    name: string
    closed?: boolean
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Trello',
        href: '/trello',
    },
    {
        title: 'Boards',
        href: '/trello/boards',
    },
]

export default function TrelloBoards({ boards: initialBoards = [], error: initialError = null }) {
    const [boards, setBoards] = useState<Board[]>(initialBoards)
    const [searchTerm, setSearchTerm] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(initialError)
    const [isAuthenticated, setIsAuthenticated] = useState(boards.length > 0)
    const [isCheckingAuth, setIsCheckingAuth] = useState(false)
    const [importingBoard, setImportingBoard] = useState<string | null>(null)
    const [selectedBoard, setSelectedBoard] = useState<Board | null>(null)
    const [fetchingLists, setFetchingLists] = useState(false)
    const [selectedListId, setSelectedListId] = useState<string | null>(null)

    const fetchBoardLists = async (boardId: string) => {
        try {
            setFetchingLists(true)
            const response = await axios.get(route('trello.boards.lists', { boardId }))

            // Update the selected board with its lists
            const updatedBoards = boards.map(board => {
                if (board.id === boardId) {
                    return { ...board, lists: response.data };
                }
                return board;
            });

            setBoards(updatedBoards);
            const board = updatedBoards.find(b => b.id === boardId);
            setSelectedBoard(board || null);

        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.error) {
                toast.error(error.response.data.error)
            } else {
                toast.error('Failed to fetch board lists. Please try again.')
            }
        } finally {
            setFetchingLists(false)
        }
    };

    const handleImportBoard = async (board: Board) => {
        if (!selectedListId) {
            toast.error('Please select a default list first')
            return
        }

        try {
            setImportingBoard(board.id)
            const response = await axios.post(route('trello.boards.import'), {
                board_id: board.id,
                board_name: board.name,
                default_list_id: selectedListId,
            })

            if (response.data.error) {
                toast.error(response.data.error)
            } else {
                toast.success('Board successfully imported as a project!')
                // Update the board's state to show it as imported
                setBoards(boards.map(b =>
                    b.id === board.id ? { ...b, is_imported: true } : b
                ))
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.error) {
                toast.error(error.response.data.error)
            } else {
                toast.error('Failed to import board. Please try again.')
            }
        } finally {
            setImportingBoard(null)
        }
    }

    const filteredBoards = boards.filter(board =>
        board.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (board.desc && board.desc.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const renderBoardsList = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="mb-6 rounded-full bg-primary/10 p-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                    <h3 className="mb-2 text-lg font-medium">Loading Boards</h3>
                    <p className="text-sm text-muted-foreground">Fetching boards from Trello...</p>
                </div>
            )
        }

        if (filteredBoards.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="mb-6 rounded-full bg-muted p-4">
                        <Trello className="h-12 w-12 text-muted-foreground opacity-80" />
                    </div>
                    <h3 className="mb-2 text-lg font-medium">{searchTerm ? 'No boards match your search' : 'No boards found'}</h3>
                    <p className="max-w-md text-center text-sm text-muted-foreground">
                        {searchTerm
                            ? 'Try a different search term or clear your search to see all boards.'
                            : 'No boards were found for this account. If you expect to see boards, ensure you have granted the necessary permissions.'}
                    </p>
                    {searchTerm && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSearchTerm('')}
                            className="mt-4 border-primary/30 text-primary hover:bg-primary/10"
                        >
                            Clear Search
                        </Button>
                    )}
                </div>
            )
        }

        return (
            <div className="space-y-4 max-w-2xl mx-auto">
                {filteredBoards.map((board) => (
                    <div
                        key={board.id}
                        className={cn(
                            "flex flex-col rounded-lg border bg-card p-4 shadow-sm transition-all hover:bg-accent/10 hover:shadow-md",
                            selectedBoard?.id === board.id && "bg-accent/10 shadow-md"
                        )}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1 cursor-pointer" onClick={() => fetchBoardLists(board.id)}>
                                <div className="flex items-center gap-2 text-lg font-medium">
                                    <Trello className="h-4 w-4 text-primary" />
                                    {board.name}
                                    {board.closed && (
                                        <Badge
                                            variant="outline"
                                            className="ml-1 border-amber-200 bg-amber-100 text-xs font-normal text-amber-700 dark:border-amber-800 dark:bg-amber-900 dark:text-amber-300"
                                        >
                                            Closed
                                        </Badge>
                                    )}
                                </div>
                                {board.desc && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{board.desc}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                                {!board.is_imported ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-primary/30 p-4 text-primary transition-all hover:bg-primary/10 hover:text-primary-foreground"
                                        onClick={() => fetchBoardLists(board.id)}
                                        disabled={importingBoard === board.id}
                                    >
                                        {importingBoard === board.id ? (
                                            <>
                                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                                Importing...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="mr-1 h-4 w-4" />
                                                Import
                                            </>
                                        )}
                                    </Button>
                                ) : (
                                    <Badge
                                        variant="secondary"
                                        className="mr-2 border-green-200 bg-green-100 p-2 text-green-700 dark:border-green-800 dark:bg-green-900 dark:text-green-300"
                                    >
                                        Imported
                                    </Badge>
                                )}
                                {board.url && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        asChild
                                        className="text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                    >
                                        <a href={board.url} target="_blank" rel="noopener noreferrer" title="Open in Trello">
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </div>

                        {selectedBoard?.id === board.id && board.lists && (
                            <>
                                <Separator className="my-3" />
                                <div className="mt-2">
                                    <h4 className="mb-2 text-sm font-medium">Select Default List</h4>
                                    {fetchingLists ? (
                                        <div className="flex justify-center py-4">
                                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            {board.lists.map(list => (
                                                <div
                                                    key={list.id}
                                                    onClick={() => setSelectedListId(list.id)}
                                                    className={cn(
                                                        "cursor-pointer rounded-md border p-2 text-sm transition-colors hover:bg-accent/10",
                                                        selectedListId === list.id && "bg-accent/20 border-primary/50"
                                                    )}
                                                >
                                                    {list.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-3 flex justify-end">
                                        <Button
                                            onClick={() => handleImportBoard(board)}
                                            disabled={!selectedListId || importingBoard === board.id}
                                            className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                                            variant="outline"
                                            size="sm"
                                        >
                                            {importingBoard === board.id ? (
                                                <>
                                                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                                    Importing...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="mr-1 h-4 w-4" />
                                                    Import Board
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}

                        <Separator className="my-3" />
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{board.id}</span>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <MasterLayout
            breadcrumbs={breadcrumbs}
        >
            <Head title="Trello Boards" />

            <div className="container py-6 px-4 flex flex-col gap-6 lg:gap-10">
                {error ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="text-center">
                            <div className="mb-6 rounded-full bg-muted p-4 mx-auto w-fit">
                                <Trello className="h-12 w-12 text-muted-foreground opacity-80" />
                            </div>
                            <h2 className="text-xl font-semibold">Authentication Error</h2>
                            <p className="mt-2 text-muted-foreground">{error}</p>
                            <Button className="mt-4" asChild>
                                <a href={route('trello.auth')}>
                                    Connect to Trello
                                </a>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between max-w-2xl mx-auto">
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">Trello Boards</h1>
                                <p className="text-sm text-muted-foreground">
                                    Select and import your Trello boards as projects
                                </p>
                            </div>

                            <div className="w-full md:w-72">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search boards..."
                                        className="w-full pl-8"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {renderBoardsList()}
                    </div>
                )}
            </div>
        </MasterLayout>
    )
}
