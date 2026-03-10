import React from 'react';
import { X, LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface DetailField {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}

interface DetailSection {
  title?: string;
  fields: DetailField[];
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColorClass?: string;
  statusBadge?: React.ReactNode;
  sections: DetailSection[];
  footerActions?: React.ReactNode;
}

export default function DetailModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  iconColorClass = "bg-indigo-50 text-indigo-600",
  statusBadge,
  sections,
  footerActions
}: DetailModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-white/90 backdrop-blur-md animate-in fade-in duration-300" 
          onClick={onClose} 
        />
        
        {/* Modal Container */}
        <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="px-8 py-8 border-b border-gray-50 bg-white flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className={clsx("p-3 rounded-2xl shadow-sm", iconColorClass)}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">{title}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {statusBadge}
                  {statusBadge && subtitle && <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">•</span>}
                  {subtitle && (
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {subtitle}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-50 rounded-xl transition-all group"
              aria-label="Cerrar"
            >
              <X className="h-8 w-8 text-gray-200 group-hover:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {sections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-4">
                {section.title && (
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                    {section.title}
                  </label>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.fields.map((field, fIdx) => (
                    <div 
                      key={fIdx} 
                      className={clsx(
                        "p-5 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow",
                        field.fullWidth ? "md:col-span-2" : ""
                      )}
                    >
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                        {field.label}
                      </p>
                      <div className="text-sm font-black text-gray-900 break-words">
                        {field.value || <span className="text-gray-300 italic">No especificado</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 h-14 bg-white border border-gray-200 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-all shadow-sm active:scale-95"
            >
              Cerrar
            </button>
            {footerActions}
          </div>
        </div>
      </div>
    </div>
  );
}
