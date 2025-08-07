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
    const [activeTab, setActiveTab] = useState('all')

    const fetchBoardLists = async (boardId: string) => {
        try {
            setFetchingLists(true)
            const response = await axios.get(route('trello.board.lists', { boardId }))

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
            const response = await axios.post(route('trello.board.import'), {
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

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const tabParam = urlParams.get('tab')
        if (tabParam) {
            setActiveTab(tabParam)
        }
    }, [])

    const filteredBoards = boards.filter(board => {
        // First apply the search filter
        const matchesSearch = board.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (board.desc && board.desc.toLowerCase().includes(searchTerm.toLowerCase()));

        // Then apply the tab filter
        if (!matchesSearch) return false;

        if (activeTab === 'active') return !board.closed;
        if (activeTab === 'closed') return board.closed;

        // 'all' tab or default
        return true;
    });

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
            <ScrollArea className="h-[450px] pr-2">
                <div className="space-y-4">
                    {filteredBoards.map((board) => (
                        <div
                            key={board.id}
                            className="flex flex-col rounded-lg border bg-card p-4 shadow-sm transition-all hover:bg-accent/10 hover:shadow-md"
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
                                                    Select Lists
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
                        </div>
                    ))}
                </div>
            </ScrollArea>
        )
    }

    if (isCheckingAuth || (error && !isAuthenticated)) {
        return (
            <MasterLayout breadcrumbs={breadcrumbs}>
                <Head title="Trello Boards" />
                <div className="mx-auto flex w-full flex-col gap-6 p-6">
                    {/* Header section */}
                    <section className="mb-2">
                        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                            <Trello className="h-8 w-8 text-primary" />
                            Trello Boards
                        </h1>
                        <p className="mt-1 text-gray-500 dark:text-gray-400">
                            {isCheckingAuth ? 'Loading Trello boards' : 'Connect your Trello account'}
                        </p>
                    </section>

                    <Card className="border-primary/10">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center justify-center py-12">
                                {isCheckingAuth ? (
                                    <>
                                        <div className="mb-6 rounded-full bg-primary/10 p-4">
                                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                        </div>
                                        <h3 className="mb-2 text-xl font-medium">Checking Trello Connection</h3>
                                        <p className="text-muted-foreground">Please wait while we verify your Trello authentication status...</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="mb-6 rounded-full bg-primary/10 p-4">
                                            <Trello className="h-16 w-16 text-primary" />
                                        </div>
                                        <h3 className="mb-2 text-xl font-medium">Connect with Trello</h3>
                                        <p className="mb-6 max-w-md text-center text-muted-foreground">
                                            {error || 'Link your Trello account to access and manage your boards directly from this application.'}
                                        </p>
                                        <Button asChild className="px-6 py-2">
                                            <a href={route('trello.auth')}>
                                                <Trello className="mr-2 h-4 w-4" />
                                                Connect Trello Account
                                            </a>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </MasterLayout>
        );
    }

    return (
        <MasterLayout breadcrumbs={breadcrumbs}>
            <Head title="Trello Boards" />
            <div className="mx-auto flex w-full flex-col gap-6 p-6">
                <section className="mb-2">
                    <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        <Trello className="h-8 w-8" />
                        Trello Boards
                    </h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">View and manage your Trello boards</p>
                </section>

                <div className="mt-6 flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
                    <div className="flex-1 md:max-w-4xl">
                        <Card className="overflow-hidden transition-all hover:shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Trello className="h-5 w-5" />
                                    {activeTab === 'all'
                                        ? 'All Boards'
                                        : activeTab === 'active'
                                            ? 'Active Boards'
                                            : 'Closed Boards'}
                                </CardTitle>
                                <CardDescription>
                                    {activeTab === 'all'
                                        ? 'Browse all your Trello boards'
                                        : activeTab === 'active'
                                            ? 'Browse your active Trello boards'
                                            : 'Browse your closed Trello boards'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {error && <div className="mb-4 rounded-md bg-destructive/15 p-3 text-destructive">{error}</div>}

                                <div className="mb-4">
                                    <div className="relative">
                                        <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="search"
                                            placeholder="Search boards..."
                                            className="pl-8"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {renderBoardsList()}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="hidden flex-1 md:block">
                        {selectedBoard && (
                            <Card className="border-primary/10">
                                <CardHeader>
                                    <CardTitle className="text-xl">
                                        <Trello className="mr-2 h-5 w-5 inline-block align-middle" />
                                        Board Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col">
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-muted-foreground">Board Name</h4>
                                            <p className="text-lg font-semibold">{selectedBoard.name}</p>
                                        </div>

                                        {selectedBoard.desc && (
                                            <div className="mb-4">
                                                <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                                                <p className="text-sm text-muted-foreground">{selectedBoard.desc}</p>
                                            </div>
                                        )}

                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-muted-foreground">Lists</h4>
                                            {fetchingLists ? (
                                                <div className="flex justify-center py-4">
                                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {selectedBoard.lists && selectedBoard.lists.length > 0 ? (
                                                        selectedBoard.lists.map(list => (
                                                            <div
                                                                key={list.id}
                                                                onClick={() => setSelectedListId(list.id)}
                                                                className={cn(
                                                                    "cursor-pointer rounded-md border p-3 text-sm transition-colors hover:bg-muted",
                                                                    selectedListId === list.id && "bg-primary/10 border-primary/50"
                                                                )}
                                                            >
                                                                {list.name}
                                                                {selectedListId === list.id && (
                                                                    <Badge className="ml-2 bg-primary/20 text-primary border-primary/30">Selected</Badge>
                                                                )}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">No lists found for this board.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-end">
                                            <Button
                                                onClick={() => handleImportBoard(selectedBoard)}
                                                disabled={!selectedListId || importingBoard === selectedBoard.id}
                                                className="border-primary p-4 bg-primary text-primary-foreground hover:bg-primary/90"
                                                variant="default"
                                                size="sm"
                                            >
                                                {importingBoard === selectedBoard.id ? (
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
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </MasterLayout>
    );
}
