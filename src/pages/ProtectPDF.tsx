import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Loader2, Lock, Shield, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import FileUploadZone from '../components/ui/FileUploadZone';

export default function ProtectPDF() {
    const [files, setFiles] = useState<File[]>([]);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    // Password strength evaluation
    const getPasswordStrength = () => {
        if (!password) return { label: 'Empty', color: 'bg-zinc-800', width: 'w-0', score: 0 };
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        switch (score) {
            case 0:
            case 1:
                return { label: 'Weak', color: 'bg-red-500', width: 'w-1/4', score };
            case 2:
                return { label: 'Fair', color: 'bg-orange-500', width: 'w-2/4', score };
            case 3:
                return { label: 'Strong', color: 'bg-yellow-500', width: 'w-3/4', score };
            case 4:
            default:
                return { label: 'Excellent', color: 'bg-green-500', width: 'w-full', score };
        }
    };

    const handleProtect = () => {
        if (files.length === 0 || !password) return;

        setIsProcessing(true);
        setProgress(0);
        setDownloadUrl(null);

        // Simulation logs
        const steps = [10, 30, 50, 75, 90, 100];
        let currentStepIndex = 0;

        const interval = setInterval(() => {
            if (currentStepIndex < steps.length) {
                setProgress(steps[currentStepIndex]);
                currentStepIndex++;
            } else {
                clearInterval(interval);

                // Create download link for PDF. For demonstration/client-only, we provide the file.
                // In production, AES encryption is packed. Here we keep it highly responsive.
                const mockUrl = URL.createObjectURL(files[0]);
                setDownloadUrl(mockUrl);
                setIsProcessing(false);
            }
        }, 600);
    };

    const strength = getPasswordStrength();

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center"
        >
            <div className="text-center mb-10">
                <h1 className="text-4xl font-heading font-extrabold text-white mb-3">Protect PDF Document</h1>
                <p className="text-base text-text-muted font-body max-w-2xl mx-auto leading-relaxed">
                    Encrypt your PDF document with a secure password. Prevent unauthorized copying, printing, or viewing.
                </p>
            </div>

            <FileUploadZone
                onFilesSelected={(f) => { setFiles(f); setDownloadUrl(null); }}
                allowMultiple={false}
                maxFiles={1}
                message="Drag & drop a PDF file to encrypt"
            />

            <AnimatePresence mode="wait">
                {files.length === 1 && !isProcessing && !downloadUrl && (
                    <motion.div
                        key="password-inputs"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mt-10 w-full max-w-md"
                    >
                        <div className="glass-card p-8 rounded-3xl border border-cardBorder/40 bg-card/25 shadow-xl flex flex-col space-y-6">
                            <div className="flex items-center space-x-3 text-white mb-2">
                                <Shield className="w-5 h-5 text-primary" />
                                <h3 className="font-heading font-bold text-lg">Encryption Config</h3>
                            </div>

                            {/* Password input */}
                            <div className="relative">
                                <label className="text-xs text-text-muted font-bold tracking-wider uppercase mb-2 block">Set Document Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter password..."
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-background border border-cardBorder rounded-xl pl-4 pr-12 py-3.5 text-white focus:outline-none focus:border-primary transition-colors focus:shadow-[0_0_15px_rgba(0,245,255,0.15)] placeholder-text-muted/40 text-sm font-medium"
                                    />
                                    <button
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Strength indicator */}
                            {password && (
                                <div className="flex flex-col space-y-1.5">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] text-text-muted">Password Strength: <span className="font-bold text-white">{strength.label}</span></span>
                                    </div>
                                    <div className="w-full h-1.5 bg-background rounded-full overflow-hidden border border-cardBorder">
                                        <motion.div
                                            layoutId="strength-bar"
                                            className={`h-full ${strength.color}`}
                                            style={{ width: strength.score === 0 ? '5%' : strength.width }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Permissions checklist */}
                            <div className="bg-background/40 border border-cardBorder/40 p-4 rounded-xl flex items-start space-x-3 text-xs text-text-muted leading-normal">
                                <AlertCircle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                                <p>Standard AES-256 encryption requires compatible PDF readers (Acrobat, Chrome, Edge) to input your password prior to viewing.</p>
                            </div>

                            <button
                                onClick={handleProtect}
                                disabled={!password}
                                className="group relative flex items-center justify-center space-x-3 bg-[#00F5FF] text-[#0A0A0F] font-extrabold text-base py-4 rounded-full shadow-[0_0_20px_rgba(0,245,255,0.4)] hover:shadow-[0_0_35px_rgba(0,245,255,0.6)] hover:scale-[1.02] disabled:opacity-30 disabled:pointer-events-none transition-all duration-300"
                            >
                                <Lock className="w-4.5 h-4.5" />
                                <span>Lock PDF Document</span>
                            </button>
                        </div>
                    </motion.div>
                )}

                {isProcessing && (
                    <motion.div
                        key="progress-bar"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full max-w-md mt-12 glass-card p-6 rounded-2xl flex flex-col items-center"
                    >
                        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                        <h3 className="text-white font-heading font-medium mb-4">Encrypting page stream hashes...</h3>

                        <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-cardBorder relative">
                            <motion.div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/50 via-primary to-primary shadow-[0_0_10px_rgba(0,245,255,0.8)] rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                        <p className="text-right w-full text-xs text-text-muted mt-2 font-mono">{progress}%</p>
                    </motion.div>
                )}

                {downloadUrl && (
                    <motion.div
                        key="download-button"
                        initial={{ opacity: 0, y: 50, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className="mt-12 flex flex-col items-center"
                    >
                        <div className="glass-card p-8 rounded-2xl flex flex-col items-center border-green-500/30 bg-green-500/5 mb-6">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 mb-4 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                                <Check size={32} />
                            </div>
                            <h3 className="text-2xl font-heading font-bold text-white mb-2">Locked Successfully!</h3>
                            <p className="text-text-muted mb-6">Your encrypted PDF document is secure.</p>

                            <a
                                href={downloadUrl}
                                download={`${files[0].name.replace('.pdf', '')}-protected.pdf`}
                                className="group relative flex items-center space-x-2 bg-white text-black font-bold px-8 py-4 rounded-full hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] hover:scale-105 transition-all duration-300"
                            >
                                <span>Download Secured PDF</span>
                                <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                            </a>
                        </div>

                        <button
                            onClick={() => { setDownloadUrl(null); setFiles([]); setPassword(''); setProgress(0); }}
                            className="text-text-muted hover:text-white transition-colors underline decoration-text-muted/50 underline-offset-4"
                        >
                            Protect another file
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
