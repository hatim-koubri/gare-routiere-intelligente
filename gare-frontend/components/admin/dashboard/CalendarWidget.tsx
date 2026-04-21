'use client';

import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

export function CalendarWidget() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const selectedDate = new Date();

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-emerald-900/5 h-full overflow-hidden flex flex-col shadow-[0_20px_50px_rgba(6,78,59,0.03)]">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black tracking-tighter text-[#064e3b] flex items-center gap-3 italic uppercase">
          <CalendarIcon size={24} className="text-emerald-800" strokeWidth={2.5} /> Schedule
        </h3>
        <div className="flex items-center gap-2 bg-emerald-50/50 p-1.5 rounded-2xl">
          <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-emerald-800"><ChevronLeft size={20} /></button>
          <span className="text-xs font-black w-28 text-center capitalize tracking-tight text-emerald-900">{format(currentMonth, 'MMMM yyyy', { locale: fr })}</span>
          <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-emerald-800"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-7 gap-1">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day) => (
          <div key={day} className="text-center text-[11px] font-black text-emerald-800/30 pb-4 uppercase tracking-widest">{day}</div>
        ))}
        {calendarDays.map((day, idx) => (
          <div 
            key={idx}
            className={`
              aspect-square flex items-center justify-center rounded-[1.25rem] text-sm font-black transition-all cursor-pointer relative group/day
              ${!isSameMonth(day, monthStart) ? 'text-emerald-900/10' : 'text-emerald-950'}
              ${isSameDay(day, selectedDate) 
                ? 'bg-[#064e3b] text-white shadow-[0_10px_20px_rgba(6,78,59,0.2)] scale-110' 
                : 'hover:bg-emerald-50 hover:text-emerald-800'}
            `}
          >
            {format(day, 'd')}
            {isSameDay(day, selectedDate) && (
               <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white opacity-50" />
            )}
          </div>
        ))}
      </div>
      
      {/* Event indicator */}
      <div className="mt-6 pt-6 border-t border-emerald-900/5">
          <div className="flex items-center gap-4 group/event cursor-pointer">
              <div className="w-2.5 h-2.5 rounded-full bg-[#064e3b] shadow-[0_0_10px_rgba(6,78,59,0.3)] group-hover/event:scale-125 transition-transform" />
              <div className="text-[12px] font-bold text-emerald-800/60 group-hover/event:text-[#064e3b] transition-colors">
                <span className="text-emerald-950 font-black mr-2">14:00</span> 
                Maintenance Bus #42
              </div>
          </div>
      </div>
    </div>
  );
}
