import { Calendar as CalendarIcon, X, ChevronRight, ChevronLeft, CalendarDays } from 'lucide-react'
import clsx from 'clsx'
import { useState, useRef, useEffect, useMemo, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'

interface DateRangePickerProps {
    startDate: string
    endDate: string
    onChange: (dates: { start: string; end: string }) => void
    className?: string
}

export default function DateRangePicker({ startDate, endDate, onChange, className }: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState<'start' | 'end' | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, placement: 'bottom' as 'top' | 'bottom' })

    // Calendar state
    const [viewDate, setViewDate] = useState(new Date())

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                const calendar = document.getElementById('floating-calendar')
                if (calendar && calendar.contains(event.target as Node)) return
                setIsOpen(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const updateCoords = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            const calendarHeight = 320 // Compact height
            const spaceBelow = window.innerHeight - rect.bottom
            const placement = spaceBelow < calendarHeight ? 'top' : 'bottom'
            
            setCoords({
                top: placement === 'bottom' ? rect.bottom + window.scrollY : rect.top + window.scrollY - calendarHeight - 8,
                left: rect.left + window.scrollX,
                width: rect.width,
                placement
            })
        }
    }

    useLayoutEffect(() => {
        if (isOpen) {
            updateCoords()
            window.addEventListener('scroll', updateCoords, true)
            window.addEventListener('resize', updateCoords)
        }
        return () => {
            window.removeEventListener('scroll', updateCoords, true)
            window.removeEventListener('resize', updateCoords)
        }
    }, [isOpen])

    const handleClear = () => {
        onChange({ start: '', end: '' })
    }

    const setQuickRange = (days: number) => {
        const end = new Date()
        const start = new Date()
        if (days > 0) {
            start.setDate(end.getDate() - days)
        }
        
        onChange({ 
            start: start.toISOString().split('T')[0], 
            end: end.toISOString().split('T')[0] 
        })
        setIsOpen(null)
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'dd/mm/aaaa'
        const [y, m, d] = dateStr.split('-')
        return `${d}/${m}/${y}`
    }

    const ranges = [
        { label: 'HOY', days: 0 },
        { label: '7D', days: 7 },
        { label: '30D', days: 30 },
    ]

    return (
        <div className={clsx("flex flex-col gap-3", className)} ref={containerRef}>
            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Rango de Registro</label>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 p-1 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm transition-all hover:border-gray-200">
                        {ranges.map((r) => (
                            <button
                                key={r.label}
                                onClick={() => setQuickRange(r.days)}
                                className="px-3 py-1 text-[9px] font-black uppercase tracking-wider text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                    {(startDate || endDate) && (
                        <button 
                            onClick={handleClear}
                            className="p-1 px-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            title="Limpiar"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 relative">
                {/* START DATE */}
                <div className="relative flex-1 group">
                    <button
                        onClick={() => setIsOpen(isOpen === 'start' ? null : 'start')}
                        className={clsx(
                            "w-full flex items-center justify-between px-3 h-12 bg-gray-50/50 border rounded-xl transition-all font-medium text-gray-700 shadow-sm hover:border-primary-300",
                            isOpen === 'start' ? "border-primary-500 ring-4 ring-primary-500/10 bg-white" : "border-gray-100"
                        )}
                    >
                        <div className="flex items-center gap-2.5">
                            <CalendarDays className={clsx("h-4.5 w-4.5", isOpen === 'start' ? "text-primary-500" : "text-gray-400")} />
                            <span className={clsx("text-xs", !startDate && "text-gray-400")}>{formatDate(startDate)}</span>
                        </div>
                        <CalendarIcon className="h-3.5 w-3.5 text-gray-300" />
                    </button>
                    <label className="absolute -top-2 left-3 px-1.5 bg-white text-[9px] font-black text-gray-400 uppercase tracking-widest origin-left group-hover:text-primary-500 transition-all">Desde</label>
                </div>

                <div className="text-gray-300">
                    <ChevronRight className="h-4 w-4" />
                </div>

                {/* END DATE */}
                <div className="relative flex-1 group">
                    <button
                        onClick={() => setIsOpen(isOpen === 'end' ? null : 'end')}
                        className={clsx(
                            "w-full flex items-center justify-between px-3 h-12 bg-gray-50/50 border rounded-xl transition-all font-medium text-gray-700 shadow-sm hover:border-primary-300",
                            isOpen === 'end' ? "border-primary-500 ring-4 ring-primary-500/10 bg-white" : "border-gray-100"
                        )}
                    >
                        <div className="flex items-center gap-2.5">
                            <CalendarDays className={clsx("h-4.5 w-4.5", isOpen === 'end' ? "text-primary-500" : "text-gray-400")} />
                            <span className={clsx("text-xs", !endDate && "text-gray-400")}>{formatDate(endDate)}</span>
                        </div>
                        <CalendarIcon className="h-3.5 w-3.5 text-gray-300" />
                    </button>
                    <label className="absolute -top-2 left-3 px-1.5 bg-white text-[9px] font-black text-gray-400 uppercase tracking-widest origin-left group-hover:text-primary-500 transition-all">Hasta</label>
                </div>

                {/* PORTAL CALENDAR */}
                {isOpen && createPortal(
                    <div 
                        id="floating-calendar"
                        className={clsx(
                            "fixed z-[9999] animate-in fade-in duration-200",
                            coords.placement === 'bottom' ? "slide-in-from-top-2" : "slide-in-from-bottom-2"
                        )}
                        style={{ 
                            top: `${coords.top + 8}px`,
                            left: `${Math.min(coords.left, window.innerWidth - 300)}px`,
                            width: `${coords.width}px`,
                            minWidth: '280px'
                        }}
                    >
                        <CalendarDropdown 
                            value={isOpen === 'start' ? startDate : endDate} 
                            onChange={(date) => {
                                if (isOpen === 'start') {
                                    onChange({ start: date, end: endDate })
                                    if (!endDate) setIsOpen('end')
                                    else setIsOpen(null)
                                } else {
                                    onChange({ start: startDate, end: date })
                                    setIsOpen(null)
                                }
                            }}
                            viewDate={viewDate}
                            setViewDate={setViewDate}
                        />
                    </div>,
                    document.body
                )}
            </div>
        </div>
    )
}

function CalendarDropdown({ 
    value, 
    onChange, 
    viewDate, 
    setViewDate 
}: { 
    value: string; 
    onChange: (date: string) => void;
    viewDate: Date;
    setViewDate: (date: Date) => void;
}) {
    const [viewMode, setViewMode] = useState<'calendar' | 'month' | 'year'>('calendar')
    const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']
    const weekdays = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']

    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()

    const days = useMemo(() => {
        const firstDay = new Date(year, month, 1).getDay()
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const result = []

        for (let i = 0; i < firstDay; i++) {
            result.push(null)
        }
        for (let i = 1; i <= daysInMonth; i++) {
            result.push(i)
        }
        return result
    }, [year, month])

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear()
        const result = []
        for (let i = currentYear - 10; i <= currentYear + 10; i++) {
            result.push(i)
        }
        return result
    }, [])

    const handleMonthChange = (offset: number) => {
        const newDate = new Date(viewDate)
        newDate.setMonth(newDate.getMonth() + offset)
        setViewDate(newDate)
    }

    const isSelected = (day: number) => {
        if (!value) return false
        const date = new Date(year, month, day)
        const selected = new Date(value + 'T00:00:00')
        return date.toDateString() === selected.toDateString()
    }

    const isToday = (day: number) => {
        const date = new Date(year, month, day)
        return date.toDateString() === new Date().toDateString()
    }

    return (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4">
            <div className="flex flex-col items-center gap-4">
                <button 
                    onClick={() => setViewMode(viewMode === 'year' ? 'calendar' : 'year')}
                    className="text-xl font-black text-gray-900 tracking-tighter hover:text-primary-600 transition-colors"
                >
                    {year}
                </button>
                
                {viewMode === 'calendar' && (
                    <>
                        <div className="flex items-center justify-between w-full">
                            <button onClick={() => handleMonthChange(-1)} className="p-1.5 hover:bg-gray-50 rounded-full transition-colors">
                                <ChevronLeft className="h-4 w-4 text-gray-400" />
                            </button>
                            <button 
                                onClick={() => setViewMode('month')}
                                className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-600 hover:text-primary-600 transition-colors"
                            >
                                {months[month]}
                            </button>
                            <button onClick={() => handleMonthChange(1)} className="p-1.5 hover:bg-gray-50 rounded-full transition-colors">
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-y-1 w-full">
                            {weekdays.map(day => (
                                <div key={day} className="text-[9px] font-black text-gray-400 text-center py-1">{day}</div>
                            ))}
                            {days.map((day, idx) => (
                                <div key={idx} className="flex items-center justify-center h-8">
                                    {day && (
                                        <button
                                            onClick={() => {
                                                const d = String(day).padStart(2, '0')
                                                const m = String(month + 1).padStart(2, '0')
                                                onChange(`${year}-${m}-${d}`)
                                            }}
                                            className={clsx(
                                                "h-7 w-7 rounded-xl text-[11px] font-bold transition-all relative overflow-hidden",
                                                isSelected(day) 
                                                    ? "bg-primary-500 text-white shadow-lg shadow-primary-200 scale-105" 
                                                    : isToday(day)
                                                        ? "bg-primary-50 text-primary-600"
                                                        : "text-gray-600 hover:bg-gray-50"
                                            )}
                                        >
                                            {day}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {viewMode === 'month' && (
                    <div className="grid grid-cols-3 gap-2 w-full">
                        {months.map((m, idx) => (
                            <button
                                key={m}
                                onClick={() => {
                                    const newDate = new Date(viewDate)
                                    newDate.setMonth(idx)
                                    setViewDate(newDate)
                                    setViewMode('calendar')
                                }}
                                className={clsx(
                                    "py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                    month === idx ? "bg-primary-500 text-white" : "hover:bg-gray-50 text-gray-500"
                                )}
                            >
                                {m.slice(0, 3)}
                            </button>
                        ))}
                    </div>
                )}

                {viewMode === 'year' && (
                    <div className="grid grid-cols-3 gap-2 w-full max-h-[200px] overflow-y-auto pr-1 no-scrollbar">
                        {years.map((y) => (
                            <button
                                key={y}
                                onClick={() => {
                                    const newDate = new Date(viewDate)
                                    newDate.setFullYear(y)
                                    setViewDate(newDate)
                                    setViewMode('calendar')
                                }}
                                className={clsx(
                                    "py-3 rounded-xl text-xs font-black transition-all",
                                    year === y ? "bg-primary-500 text-white" : "hover:bg-gray-50 text-gray-500"
                                )}
                            >
                                {y}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
