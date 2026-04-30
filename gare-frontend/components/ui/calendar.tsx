// components/ui/calendar.tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface CalendarProps {
  travelDates?: Date[];
  onDateSelect?: (date: Date) => void;
  className?: string;
}

export function Calendar({ travelDates = [], onDateSelect, className }: CalendarProps) {
  const currentDate = new Date();
  const [currentMonth, setCurrentMonth] = React.useState(currentDate.getMonth());
  const [currentYear, setCurrentYear] = React.useState(currentDate.getFullYear());

  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const firstDayOfWeek = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const hasTravelOnDate = (day: number): boolean => {
    const date = new Date(currentYear, currentMonth, day);
    return travelDates.some(travelDate => 
      travelDate.getDate() === date.getDate() &&
      travelDate.getMonth() === date.getMonth() &&
      travelDate.getFullYear() === date.getFullYear()
    );
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === currentMonth && 
           today.getFullYear() === currentYear;
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (day: number) => {
    if (onDateSelect && hasTravelOnDate(day)) {
      const selectedDate = new Date(currentYear, currentMonth, day);
      onDateSelect(selectedDate);
    }
  };

  const renderCalendarDays = () => {
    let days: React.ReactNode[] = [];
    
    // Empty cells for days before first day of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="col-span-1 h-10 w-10" />);
    }
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const hasTravel = hasTravelOnDate(day);
      const today = isToday(day);
      
      days.push(
        <button
          key={`day-${day}`}
          onClick={() => handleDateClick(day)}
          disabled={!hasTravel}
          className={cn(
            "col-span-1 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200",
            hasTravel && "bg-orange-500 text-white hover:bg-orange-600 hover:scale-110 cursor-pointer shadow-md",
            hasTravel && "bg-gradient-to-r from-orange-500 to-orange-600",
            !hasTravel && "text-gray-400 hover:bg-gray-100",
            today && !hasTravel && "ring-2 ring-blue-500 ring-offset-2",
            today && hasTravel && "ring-2 ring-white ring-offset-2 ring-offset-orange-500"
          )}
        >
          <span className={cn(
            "text-sm font-medium",
            hasTravel && "font-bold"
          )}>
            {day}
          </span>
        </button>
      );
    }
    
    return days;
  };

  const travelDatesCount = travelDates.length;

  return (
    <div className={cn("bg-white rounded-xl shadow-sm border border-gray-100 p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span>📅</span> Calendrier des voyages
        </h3>
        {travelDatesCount > 0 && (
          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
            {travelDatesCount} voyage{travelDatesCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
      
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          ←
        </button>
        <span className="font-semibold text-gray-800">
          {monthNames[currentMonth]} {currentYear}
        </span>
        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          →
        </button>
      </div>
      
      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>
      
      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-gray-600">Jour de voyage</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full ring-2 ring-blue-500"></div>
          <span className="text-gray-600">Aujourd'hui</span>
        </div>
      </div>
      
      {/* Message when no travels */}
      {travelDatesCount === 0 && (
        <div className="mt-4 text-center text-xs text-gray-400">
          Aucun voyage planifié. Réservez votre premier voyage !
        </div>
      )}
    </div>
  );
}