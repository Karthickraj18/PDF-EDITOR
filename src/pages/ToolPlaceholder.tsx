import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, Cpu, CheckCircle } from 'lucide-react';

export default function ToolPlaceholder() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const rawTool = queryParams.get('tool') || 'Feature';

    // Format tool name nicely
    const toolName = rawTool
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[70vh]"
        >
            <div className="glass-card p-10 rounded-3xl max-w-2xl text-center border-secondary/20 shadow-2xl relative overflow-hidden">
                {/* Visual Accent Glow */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-secondary/10 blur-[80px] rounded-full pointer-events-none" />

                <div className="w-16 h-16 bg-secondary/15 border border-secondary/30 rounded-2xl flex items-center justify-center text-secondary mx-auto mb-6">
                    <ShieldAlert size={36} className="animate-pulse" />
                </div>

                <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-white mb-4">
                    {toolName} Integration
                </h1>

                <p className="text-text-muted font-body mb-8 text-sm md:text-base leading-relaxed">
                    We are currently expanding our professional suite to bring you high-fidelity conversions for {toolName}. This premium tool will be available in the next release.
                </p>

                {/* Integration Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-md mx-auto mb-10">
                    <div className="bg-background/40 border border-cardBorder p-4 rounded-xl flex items-start space-x-3">
                        <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary mt-0.5">
                            <Cpu className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-white text-xs font-bold font-heading mb-1">Precision Engine</h4>
                            <p className="text-[10px] text-text-muted font-body">High-fidelity document structure reconstruction.</p>
                        </div>
                    </div>

                    <div className="bg-background/40 border border-cardBorder p-4 rounded-xl flex items-start space-x-3">
                        <div className="p-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 mt-0.5">
                            <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-white text-xs font-bold font-heading mb-1">Format Compliance</h4>
                            <p className="text-[10px] text-text-muted font-body">Perfect margin and alignment preservation.</p>
                        </div>
                    </div>

                    <div className="bg-background/40 border border-cardBorder p-4 rounded-xl flex items-start space-x-3">
                        <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 mt-0.5">
                            <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-white text-xs font-bold font-heading mb-1">Secure Sandboxing</h4>
                            <p className="text-[10px] text-text-muted font-body">Encrypted in-memory processing guarantees.</p>
                        </div>
                    </div>

                    <div className="bg-background/40 border border-cardBorder p-4 rounded-xl flex items-start space-x-3">
                        <div className="p-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 mt-0.5">
                            <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-white text-xs font-bold font-heading mb-1">Status</h4>
                            <p className="text-[10px] text-text-muted font-body">Final performance tuning phase.</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        to="/"
                        className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold px-6 py-3 rounded-full transition-colors text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Dashboard</span>
                    </Link>

                    <Link
                        to="/"
                        className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-primary text-[#0A0A0F] hover:shadow-[0_0_20px_rgba(0,245,255,0.4)] font-bold px-6 py-3 rounded-full transition-all duration-300 text-sm"
                    >
                        <span>Use Active Local Tools</span>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
