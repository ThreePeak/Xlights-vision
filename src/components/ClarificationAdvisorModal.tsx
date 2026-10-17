import React from 'react';
import { HelpCircle, AlertCircle, Check, ArrowRight } from 'lucide-react';
import { ClarificationQuestion, UserContextConfig } from '../types/xlights';

interface ClarificationAdvisorModalProps {
  question: ClarificationQuestion | null;
  onSelectOption: (action: (cfg: UserContextConfig) => UserContextConfig) => void;
  onDismiss: () => void;
}

export const ClarificationAdvisorModal: React.FC<ClarificationAdvisorModalProps> = ({
  question,
  onSelectOption,
  onDismiss,
}) => {
  if (!question) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-neutral-100">{question.title}</h3>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-4 text-xs">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200 leading-relaxed flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{question.explanation}</span>
          </div>

          <span className="font-semibold text-neutral-200">
            Please select the configuration that matches your display:
          </span>

          <div className="flex flex-col gap-2">
            {question.options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectOption(opt.action)}
                className="p-3 rounded-xl bg-neutral-950 hover:bg-neutral-800/90 border border-neutral-800 hover:border-amber-500/50 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-neutral-100 group-hover:text-amber-300">
                    {opt.label}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">{opt.description}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-amber-400 transition" />
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950 flex justify-end">
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded"
          >
            Use Standard Default
          </button>
        </div>
      </div>
    </div>
  );
};
