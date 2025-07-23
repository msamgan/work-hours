import { type SharedData } from '@/types'
import { usePage } from '@inertiajs/react'
import { BarChart2, Briefcase, CheckSquare, Clock, DollarSign, Github, Upload, Users } from 'lucide-react'

export default function Features() {
    const { auth } = usePage<SharedData>().props
    const isLoggedIn = auth && auth.user
    return (
        <>
            <section id="features" className="container mx-auto mb-24 px-6 lg:px-8" aria-label="Product features">
                <div className="mb-16 text-center">
                    {/* Typewriter-style header with decorative elements */}
                    <div className="relative mx-auto mb-8 w-fit">
                        <div className="border-2 border-gray-800/70 px-10 py-3 dark:border-gray-200/70">
                            <span className="font-bold tracking-widest text-gray-800 uppercase dark:text-gray-200">Features</span>
                        </div>
                        <div className="absolute -top-3 -right-3 flex h-10 w-10 rotate-12 items-center justify-center border-2 border-blue-900/60 bg-blue-100/30 dark:border-blue-400/60 dark:bg-blue-900/30">
                            <span className="text-sm font-bold text-blue-900 dark:text-blue-400">F</span>
                        </div>
                        <div className="absolute -bottom-3 -left-3 flex h-10 w-10 -rotate-12 items-center justify-center border-2 border-blue-900/60 bg-blue-100/30 dark:border-blue-400/60 dark:bg-blue-900/30">
                            <span className="text-sm font-bold text-blue-900 dark:text-blue-400">9</span>
                        </div>
                    </div>

                    <h2 className="mt-4 mb-6 text-3xl font-bold tracking-tight text-gray-800 uppercase md:text-5xl dark:text-gray-200">
                        Powerful Features
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg text-gray-700 dark:text-gray-300">
                        Everything you need to track, analyze, and optimize your work hours.
                    </p>

                    {/* Decorative typewriter keys */}
                    <div className="mt-8 flex justify-center gap-2">
                        {['T', 'I', 'M', 'E', '-', 'T', 'R', 'A', 'C', 'K'].map((letter, index) => (
                            <div
                                key={index}
                                className="flex h-8 w-8 items-center justify-center border border-gray-400 bg-gray-100 shadow-sm dark:border-gray-600 dark:bg-gray-700"
                            >
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{letter}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main features grid with typewriter-inspired design */}
                <div className="mb-16 grid gap-8 md:grid-cols-3">
                    {/* Feature 1: GitHub Integration */}
                    <div className="group relative overflow-hidden border-2 border-gray-300 bg-white transition-all dark:border-gray-700 dark:bg-gray-800">
                        {/* Feature header with typewriter styling */}
                        <div className="border-b-2 border-gray-400 bg-gray-100 px-4 py-3 dark:border-gray-600 dark:bg-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-800 uppercase dark:text-gray-200">GitHub Integration</h3>
                                <div className="flex h-8 w-8 items-center justify-center border border-gray-500 bg-gray-200 dark:border-gray-500 dark:bg-gray-600">
                                    <Github className="h-5 w-5 text-gray-700 dark:text-gray-300" aria-hidden="true" />
                                </div>
                            </div>
                        </div>

                        {/* Feature content */}
                        <div className="p-5">
                            <div className="mb-3 flex">
                                <span className="mr-2 inline-flex items-center rounded-none border border-red-800/40 px-2 py-0.5 text-xs font-bold text-red-800/70 uppercase dark:border-red-400/40 dark:text-red-400/90">
                                    Popular
                                </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                Connect GitHub to import repositories as projects and track development time efficiently.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <div className="inline-flex items-center border border-gray-400 bg-gray-50 px-2 py-1 dark:border-gray-600 dark:bg-gray-700">
                                    <span className="mr-1 font-bold text-gray-700 dark:text-gray-300">✓</span>
                                    <span className="text-xs text-gray-700 uppercase dark:text-gray-300">Repository sync</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 2: Time Tracking */}
                    <div className="group relative overflow-hidden border-2 border-gray-300 bg-white transition-all dark:border-gray-700 dark:bg-gray-800">
                        {/* Feature header with typewriter styling */}
                        <div className="border-b-2 border-gray-400 bg-gray-100 px-4 py-3 dark:border-gray-600 dark:bg-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-800 uppercase dark:text-gray-200">Time Tracking</h3>
                                <div className="flex h-8 w-8 items-center justify-center border border-gray-500 bg-gray-200 dark:border-gray-500 dark:bg-gray-600">
                                    <Clock className="h-5 w-5 text-gray-700 dark:text-gray-300" aria-hidden="true" />
                                </div>
                            </div>
                        </div>

                        {/* Feature content */}
                        <div className="p-5">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                Track time with a single click. Add notes and categorize your activities for better insights.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <div className="inline-flex items-center border border-gray-400 bg-gray-50 px-2 py-1 dark:border-gray-600 dark:bg-gray-700">
                                    <span className="mr-1 font-bold text-gray-700 dark:text-gray-300">✓</span>
                                    <span className="text-xs text-gray-700 uppercase dark:text-gray-300">One-click tracking</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 3: Detailed Reports */}
                    <div className="group relative overflow-hidden border-2 border-gray-300 bg-white transition-all dark:border-gray-700 dark:bg-gray-800">
                        {/* Feature header with typewriter styling */}
                        <div className="border-b-2 border-gray-400 bg-gray-100 px-4 py-3 dark:border-gray-600 dark:bg-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-800 uppercase dark:text-gray-200">Detailed Reports</h3>
                                <div className="flex h-8 w-8 items-center justify-center border border-gray-500 bg-gray-200 dark:border-gray-500 dark:bg-gray-600">
                                    <BarChart2 className="h-5 w-5 text-gray-700 dark:text-gray-300" aria-hidden="true" />
                                </div>
                            </div>
                        </div>

                        {/* Feature content */}
                        <div className="p-5">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                Generate comprehensive reports to analyze your productivity and identify improvement areas.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <div className="inline-flex items-center border border-gray-400 bg-gray-50 px-2 py-1 dark:border-gray-600 dark:bg-gray-700">
                                    <span className="mr-1 font-bold text-gray-700 dark:text-gray-300">✓</span>
                                    <span className="text-xs text-gray-700 uppercase dark:text-gray-300">Export options</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 4: Team Collaboration */}
                    <div className="group relative overflow-hidden border-2 border-gray-300 bg-white transition-all dark:border-gray-700 dark:bg-gray-800">
                        {/* Feature header with typewriter styling */}
                        <div className="border-b-2 border-gray-400 bg-gray-100 px-4 py-3 dark:border-gray-600 dark:bg-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-800 uppercase dark:text-gray-200">Team Collaboration</h3>
                                <div className="flex h-8 w-8 items-center justify-center border border-gray-500 bg-gray-200 dark:border-gray-500 dark:bg-gray-600">
                                    <Users className="h-5 w-5 text-gray-700 dark:text-gray-300" aria-hidden="true" />
                                </div>
                            </div>
                        </div>

                        {/* Feature content */}
                        <div className="p-5">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                Manage your team's time, assign projects, and track progress all in one place.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <div className="inline-flex items-center border border-gray-400 bg-gray-50 px-2 py-1 dark:border-gray-600 dark:bg-gray-700">
                                    <span className="mr-1 font-bold text-gray-700 dark:text-gray-300">✓</span>
                                    <span className="text-xs text-gray-700 uppercase dark:text-gray-300">Real-time updates</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 5: Client Management */}
                    <div className="group relative overflow-hidden border-2 border-gray-300 bg-white transition-all dark:border-gray-700 dark:bg-gray-800">
                        {/* Feature header with typewriter styling */}
                        <div className="border-b-2 border-gray-400 bg-gray-100 px-4 py-3 dark:border-gray-600 dark:bg-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-800 uppercase dark:text-gray-200">Client Management</h3>
                                <div className="flex h-8 w-8 items-center justify-center border border-gray-500 bg-gray-200 dark:border-gray-500 dark:bg-gray-600">
                                    <Briefcase className="h-5 w-5 text-gray-700 dark:text-gray-300" aria-hidden="true" />
                                </div>
                            </div>
                        </div>

                        {/* Feature content */}
                        <div className="p-5">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                Organize and manage your clients effortlessly. Track client projects and maintain detailed records.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <div className="inline-flex items-center border border-gray-400 bg-gray-50 px-2 py-1 dark:border-gray-600 dark:bg-gray-700">
                                    <span className="mr-1 font-bold text-gray-700 dark:text-gray-300">✓</span>
                                    <span className="text-xs text-gray-700 uppercase dark:text-gray-300">Client records</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 6: Bulk Upload */}
                    <div className="group relative overflow-hidden border-2 border-gray-300 bg-white transition-all dark:border-gray-700 dark:bg-gray-800">
                        {/* Feature header with typewriter styling */}
                        <div className="border-b-2 border-gray-400 bg-gray-100 px-4 py-3 dark:border-gray-600 dark:bg-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-800 uppercase dark:text-gray-200">Bulk Upload</h3>
                                <div className="flex h-8 w-8 items-center justify-center border border-gray-500 bg-gray-200 dark:border-gray-500 dark:bg-gray-600">
                                    <Upload className="h-5 w-5 text-gray-700 dark:text-gray-300" aria-hidden="true" />
                                </div>
                            </div>
                        </div>

                        {/* Feature content */}
                        <div className="p-5">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                Save time by importing multiple time logs at once. Download a template and upload your data.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <div className="inline-flex items-center border border-gray-400 bg-gray-50 px-2 py-1 dark:border-gray-600 dark:bg-gray-700">
                                    <span className="mr-1 font-bold text-gray-700 dark:text-gray-300">✓</span>
                                    <span className="text-xs text-gray-700 uppercase dark:text-gray-300">Template download</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 7: Approval Management */}
                    <div className="group relative overflow-hidden border-2 border-gray-300 bg-white transition-all dark:border-gray-700 dark:bg-gray-800">
                        {/* Feature header with typewriter styling */}
                        <div className="border-b-2 border-gray-400 bg-gray-100 px-4 py-3 dark:border-gray-600 dark:bg-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-800 uppercase dark:text-gray-200">Approval Management</h3>
                                <div className="flex h-8 w-8 items-center justify-center border border-gray-500 bg-gray-200 dark:border-gray-500 dark:bg-gray-600">
                                    <CheckSquare className="h-5 w-5 text-gray-700 dark:text-gray-300" aria-hidden="true" />
                                </div>
                            </div>
                        </div>

                        {/* Feature content */}
                        <div className="p-5">
                            <div className="mb-3 flex">
                                <span className="mr-2 inline-flex items-center rounded-none border border-red-800/40 px-2 py-0.5 text-xs font-bold text-red-800/70 uppercase dark:border-red-400/40 dark:text-red-400/90">
                                    New
                                </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                Streamline your workflow with our robust approval system. Managers can review and approve time logs.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <div className="inline-flex items-center border border-gray-400 bg-gray-50 px-2 py-1 dark:border-gray-600 dark:bg-gray-700">
                                    <span className="mr-1 font-bold text-gray-700 dark:text-gray-300">✓</span>
                                    <span className="text-xs text-gray-700 uppercase dark:text-gray-300">Approval workflow</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 8: Multiple Currency Management */}
                    <div className="group relative overflow-hidden border-2 border-gray-300 bg-white transition-all dark:border-gray-700 dark:bg-gray-800">
                        {/* Feature header with typewriter styling */}
                        <div className="border-b-2 border-gray-400 bg-gray-100 px-4 py-3 dark:border-gray-600 dark:bg-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-800 uppercase dark:text-gray-200">Currency Management</h3>
                                <div className="flex h-8 w-8 items-center justify-center border border-gray-500 bg-gray-200 dark:border-gray-500 dark:bg-gray-600">
                                    <DollarSign className="h-5 w-5 text-gray-700 dark:text-gray-300" aria-hidden="true" />
                                </div>
                            </div>
                        </div>

                        {/* Feature content */}
                        <div className="p-5">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                Work with multiple currencies across projects and clients. Track earnings in various currencies.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <div className="inline-flex items-center border border-gray-400 bg-gray-50 px-2 py-1 dark:border-gray-600 dark:bg-gray-700">
                                    <span className="mr-1 font-bold text-gray-700 dark:text-gray-300">✓</span>
                                    <span className="text-xs text-gray-700 uppercase dark:text-gray-300">Currency conversion</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 10: Task Management */}
                    <div className="group relative overflow-hidden border-2 border-gray-300 bg-white transition-all dark:border-gray-700 dark:bg-gray-800">
                        {/* Feature header with typewriter styling */}
                        <div className="border-b-2 border-gray-400 bg-gray-100 px-4 py-3 dark:border-gray-600 dark:bg-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-800 uppercase dark:text-gray-200">Task Management</h3>
                                <div className="flex h-8 w-8 items-center justify-center border border-gray-500 bg-gray-200 dark:border-gray-500 dark:bg-gray-600">
                                    <CheckSquare className="h-5 w-5 text-gray-700 dark:text-gray-300" aria-hidden="true" />
                                </div>
                            </div>
                        </div>

                        {/* Feature content */}
                        <div className="p-5">
                            <div className="mb-3 flex">
                                <span className="mr-2 inline-flex items-center rounded-none border border-red-800/40 px-2 py-0.5 text-xs font-bold text-red-800/70 uppercase dark:border-red-400/40 dark:text-red-400/90">
                                    New
                                </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                Create, assign, and track tasks efficiently. Organize your work with priorities and due dates.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <div className="inline-flex items-center border border-gray-400 bg-gray-50 px-2 py-1 dark:border-gray-600 dark:bg-gray-700">
                                    <span className="mr-1 font-bold text-gray-700 dark:text-gray-300">✓</span>
                                    <span className="text-xs text-gray-700 uppercase dark:text-gray-300">Task tracking</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Integration - Typewriter-inspired design */}
            <section id="featured-integration" className="container mx-auto mb-24 px-6 lg:px-8" aria-label="Featured integration">
                <div className="relative border-2 border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800">
                    {/* Decorative elements */}
                    <div className="absolute -top-3 -right-3 h-6 w-6 border-2 border-blue-900/60 bg-blue-100/30 dark:border-blue-400/60 dark:bg-blue-900/30"></div>
                    <div className="absolute -bottom-3 -left-3 h-6 w-6 border-2 border-blue-900/60 bg-blue-100/30 dark:border-blue-400/60 dark:bg-blue-900/30"></div>

                    {/* Header with typewriter styling */}
                    <div className="border-b-2 border-gray-400 bg-gray-100 px-6 py-4 dark:border-gray-600 dark:bg-gray-700">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center">
                                <div className="mr-4 flex h-14 w-14 items-center justify-center border-2 border-gray-500 bg-gray-200 dark:border-gray-500 dark:bg-gray-600">
                                    <Github className="h-8 w-8 text-gray-700 dark:text-gray-300" aria-label="GitHub logo" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold tracking-wide text-gray-800 uppercase dark:text-gray-200">
                                        GitHub Integration
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Connect your repositories and track development time</p>
                                </div>
                            </div>
                            <div className="rotate-3 border-2 border-red-800/40 px-3 py-1 dark:border-red-400/40">
                                <span className="text-sm font-bold tracking-wider text-red-800/70 uppercase dark:text-red-400/90">
                                    Featured Integration
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 p-6 md:grid-cols-2">
                        {/* Left column - Feature description */}
                        <div>
                            <div className="mb-6 border-l-2 border-gray-400 pl-4 dark:border-gray-600">
                                <p className="text-gray-700 dark:text-gray-300">
                                    Seamlessly connect your GitHub account to import repositories as projects and track development time efficiently.
                                    Monitor your coding productivity, generate reports based on repositories, and streamline your workflow.
                                </p>
                            </div>

                            <div className="mb-6">
                                <h3 className="mb-3 text-lg font-bold text-gray-800 uppercase dark:text-gray-200">Key Features</h3>
                                <div className="grid gap-1 sm:grid-cols-3">
                                    <div className="flex items-center border border-gray-400 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
                                        <span className="mr-2 font-bold text-gray-700 dark:text-gray-300">✓</span>
                                        <span className="text-sm text-gray-700 uppercase dark:text-gray-300">Repository Sync</span>
                                    </div>
                                    <div className="flex items-center border border-gray-400 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
                                        <span className="mr-2 font-bold text-gray-700 dark:text-gray-300">✓</span>
                                        <span className="text-sm text-gray-700 uppercase dark:text-gray-300">Repository Import</span>
                                    </div>
                                    <div className="flex items-center border border-gray-400 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
                                        <span className="mr-2 font-bold text-gray-700 dark:text-gray-300">✓</span>
                                        <span className="text-sm text-gray-700 uppercase dark:text-gray-300">Productivity Metrics</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <a
                                    href="/integration"
                                    className="inline-flex items-center border-2 border-blue-900 bg-blue-900 px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-800 dark:border-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                                    aria-label={isLoggedIn ? 'Connect your account with GitHub' : 'Get started with Work Hours'}
                                >
                                    <Github className="mr-2 h-4 w-4" />
                                    {isLoggedIn ? 'Connect with GitHub' : 'Get Started'}
                                </a>
                            </div>
                        </div>

                        {/* Right column - Visual representation */}
                        <div className="flex items-center justify-center">
                            <div className="w-full max-w-md border-2 border-gray-400 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700">
                                <div className="mb-4 border-b border-gray-400 pb-2 dark:border-gray-600">
                                    <div className="flex items-center">
                                        <div className="mr-2 h-3 w-3 rounded-full bg-red-500"></div>
                                        <div className="mr-2 h-3 w-3 rounded-full bg-yellow-500"></div>
                                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                        <div className="ml-4 text-xs text-gray-600 dark:text-gray-400">repository-list.txt</div>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                    <div className="mb-2">$ git status</div>
                                    <div className="mb-2 text-green-600 dark:text-green-400">On branch main</div>
                                    <div className="mb-2 text-green-600 dark:text-green-400">Your branch is up to date with 'origin/main'</div>
                                    <div className="mb-2">$ git log --oneline</div>
                                    <div className="mb-1 text-blue-600 dark:text-blue-400">a1b2c3d Update README.md</div>
                                    <div className="mb-1 text-blue-600 dark:text-blue-400">e4f5g6h Fix login bug</div>
                                    <div className="mb-1 text-blue-600 dark:text-blue-400">i7j8k9l Initial commit</div>
                                    <div className="mb-2">$ _</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
