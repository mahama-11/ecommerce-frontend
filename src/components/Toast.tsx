import { useToastStore } from '@/store/toastStore';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { message, type, visible, hideToast } = useToastStore();

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-400 shrink-0" />
  };

  const bgs = {
    success: 'border-green-500/30 bg-green-500/10 shadow-green-500/20',
    error: 'border-red-500/30 bg-red-500/10 shadow-red-500/20',
    info: 'border-blue-500/30 bg-blue-500/10 shadow-blue-500/20'
  };

  return (
    <div 
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 pointer-events-none ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}
    >
      <div className={`glass-strong border ${bgs[type]} px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[300px] transition-all duration-300 ${visible ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {icons[type]}
        <p className="text-sm font-medium text-white flex-1">{message}</p>
        <button onClick={hideToast} className="text-gray-400 hover:text-white transition p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
