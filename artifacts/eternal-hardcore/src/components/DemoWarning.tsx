import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export function DemoWarning() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="demo-warning"
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9990] flex items-center gap-4 px-5 py-3.5 rounded-2xl border border-yellow-500/30 backdrop-blur-xl max-w-[420px] w-[calc(100vw-2rem)]"
          style={{
            background: "rgba(20, 14, 2, 0.92)",
            boxShadow: "0 0 0 1px rgba(234,179,8,0.12), 0 24px 48px rgba(0,0,0,0.7), 0 0 32px rgba(234,179,8,0.06)",
          }}
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-widest mb-0.5">
              Demo Mode
            </p>
            <p className="text-xs text-muted-foreground font-mono leading-relaxed">
              This website is a work in progress. Some features may not work correctly.
            </p>
          </div>

          <button
            onClick={() => setVisible(false)}
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border border-white/8 bg-white/5 hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
