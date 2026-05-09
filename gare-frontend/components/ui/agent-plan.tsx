// components/ui/agent-plan.tsx
"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  CircleAlert,
  CircleDotDashed,
  CircleX,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

// Type definitions
export interface Subtask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  tools?: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  level: number;
  dependencies: string[];
  subtasks: Subtask[];
}

export interface PlanProps {
  tasks: Task[];
  title?: string;
  description?: string;
}

export default function Plan({ tasks: initialTasks, title, description }: PlanProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [expandedTasks, setExpandedTasks] = useState<string[]>([initialTasks[0]?.id]);
  const [expandedSubtasks, setExpandedSubtasks] = useState<{
    [key: string]: boolean;
  }>({});

  const prefersReducedMotion = 
    typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
      : false;

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId],
    );
  };

  const toggleSubtaskExpansion = (taskId: string, subtaskId: string) => {
    const key = `${taskId}-${subtaskId}`;
    setExpandedSubtasks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const taskVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : -5 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: prefersReducedMotion ? "tween" : "spring", 
        stiffness: 500, 
        damping: 30
      }
    }
  };

  const subtaskListVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { 
      height: "auto", 
      opacity: 1,
      transition: { 
        duration: 0.25, 
        staggerChildren: 0.05,
        ease: [0.2, 0.65, 0.3, 0.9]
      }
    }
  };

  return (
    <div className="bg-transparent text-foreground h-full overflow-auto">
      <motion.div 
        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-3xl border shadow-2xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">{title || "Plan d'Action"}</h2>
            <p className="text-slate-400 text-sm font-medium">{description}</p>
        </div>

        <LayoutGroup>
          <div className="p-6">
            <ul className="space-y-4">
              {tasks.map((task, index) => {
                const isExpanded = expandedTasks.includes(task.id);
                return (
                  <motion.li
                    key={task.id}
                    className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden"
                    variants={taskVariants}
                  >
                    <motion.div 
                      className={`flex items-center px-5 py-4 cursor-pointer transition-colors ${isExpanded ? 'bg-orange-50/50 dark:bg-orange-500/5' : 'hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                      onClick={() => toggleTaskExpansion(task.id)}
                    >
                      <div className="mr-4 text-orange-500">
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </div>

                      <div className="flex-grow">
                        <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">{task.title}</h3>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          task.status === "completed" ? "bg-orange-100 text-orange-600 dark:bg-orange-500/20" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    </motion.div>

                    <AnimatePresence>
                      {isExpanded && task.subtasks.length > 0 && (
                        <motion.div 
                          variants={subtaskListVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          className="bg-white dark:bg-slate-950 border-t border-slate-50 dark:border-slate-900"
                        >
                          <ul className="p-4 space-y-2">
                            {task.subtasks.map((subtask) => {
                              const subtaskKey = `${task.id}-${subtask.id}`;
                              const isSubExpanded = expandedSubtasks[subtaskKey];
                              return (
                                <li key={subtask.id} className="rounded-xl border border-transparent hover:border-orange-100 dark:hover:border-orange-500/20 transition-all overflow-hidden">
                                  <div 
                                    className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                                    onClick={() => toggleSubtaskExpansion(task.id, subtask.id)}
                                  >
                                    <div className={`w-2 h-2 rounded-full ${subtask.status === "completed" ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                                    <span className={`text-sm font-bold flex-grow ${subtask.status === "completed" ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                      {subtask.title}
                                    </span>
                                    <div className="text-slate-300">
                                      {isSubExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </div>
                                  </div>
                                  
                                  <AnimatePresence>
                                    {isSubExpanded && (
                                      <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="px-9 pb-4"
                                      >
                                        <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                          {subtask.description}
                                        </p>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </li>
                              );
                            })}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </LayoutGroup>
      </motion.div>
    </div>
  );
}
