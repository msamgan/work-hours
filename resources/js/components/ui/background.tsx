export default function Background({ showPunches = true, showMarginLine = true }: {
    showPunches?: boolean;
    showMarginLine?: boolean
}) {
    return (
        <>
            {/* Paper texture overlay */}
            <div
                className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPgogIDxmaWx0ZXIgaWQ9Im5vaXNlIj4KICAgIDxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjY1IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+CiAgICA8ZmVCbGVuZCBtb2RlPSJtdWx0aXBseSIgaW4yPSJCYWNrZ3JvdW5kSW1hZ2UiLz4KICA8L2ZpbHRlcj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2UpIiBvcGFjaXR5PSIwLjA1Ii8+Cjwvc3ZnPg==')] opacity-100 dark:opacity-30"></div>

            {/* Horizontal lines like a timesheet */}
            <div
                className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[length:100%_2rem] dark:bg-[linear-gradient(0deg,rgba(255,255,255,0.03)_1px,transparent_1px)]"
                aria-hidden="true"
            ></div>

            {/* Vertical lines like a timesheet */}
            <div
                className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[length:2rem_100%] dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)]"
                aria-hidden="true"
            ></div>

            {/* Punch card holes */}
            {
                showPunches && (<div
                    className="absolute top-0 bottom-0 left-4 w-4 bg-[radial-gradient(circle,rgba(0,0,0,0.1)_3px,transparent_3px)] bg-[length:8px_24px] bg-[position:center] bg-repeat-y dark:bg-[radial-gradient(circle,rgba(255,255,255,0.1)_3px,transparent_3px)]"
                    aria-hidden="true"
                ></div>)
            }

            {/* Red margin line */}
            {
                showMarginLine &&
                <div className="absolute top-0 bottom-0 left-12 w-[1px] bg-red-400/30 dark:bg-red-500/20"
                     aria-hidden="true"></div>
            }
        </>
    )
}
