import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PDFDocument } from 'pdf-lib';
import { Download, Loader2, Scissors } from 'lucide-react';
import FileUploadZone from '../components/ui/FileUploadZone';

export default function SplitPDF() {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    // Simple state for range extraction
    const [startPage, setStartPage] = useState<number | ''>('');
    const [endPage, setEndPage] = useState<number | ''>('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSplit = async () => {
        if (files.length === 0) return;
        setErrorMsg('');

        setIsProcessing(true);
        setProgress(10);
        setDownloadUrl(null);

        try {
            const file = files[0];
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const totalPages = pdfDoc.getPageCount();

            let start = parseInt(startPage as string, 10);
            let end = parseInt(endPage as string, 10);

            // Validation
            if (isNaN(start) || start < 1) start = 1;
            if (isNaN(end) || end > totalPages) end = totalPages;
            if (start > end) {
                setIsProcessing(false);
                setErrorMsg('Start page cannot be greater than end page.');
                return;
            }

            setProgress(30);

            const splitPdf = await PDFDocument.create();

            // pdf-lib uses 0-indexed page numbers
            const pageIndices = [];
            for (let i = start - 1; i < end; i++) {
                pageIndices.push(i);
            }

            const copiedPages = await splitPdf.copyPages(pdfDoc, pageIndices);
            copiedPages.forEach((page) => splitPdf.addPage(page));

            setProgress(80);

            const splitPdfBytes = await splitPdf.save();
            const blob = new Blob([splitPdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            setProgress(100);
            setTimeout(() => {
                setDownloadUrl(url);
                setIsProcessing(false);
            }, 500);

        } catch (error) {
            console.error("Error splitting PDF:", error);
            setErrorMsg('Failed to process the PDF. Ensure it is not encrypted or corrupted.');
            setIsProcessing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-4xl mx-auto px-4 py-12 flex flex-col items-center"
        >
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4 tracking-tight">Split PDF</h1>
                <p className="text-xl text-text-muted font-body max-w-2xl mx-auto">
                    Extract specific pages from your PDF file into a new document instantly.
                </p>
            </div>

            <FileUploadZone
                onFilesSelected={(f) => { setFiles(f); setDownloadUrl(null); setErrorMsg(''); }}
                allowMultiple={false}
                maxFiles={1}
                message="Drag & drop a PDF to split"
            />

            <AnimatePresence mode="wait">
                {files.length === 1 && !isProcessing && !downloadUrl && (
                    <motion.div
                        key="split-options"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="mt-8 w-full max-w-md flex flex-col items-center"
                    >
                        <div className="glass-card p-6 rounded-2xl w-full mb-8 border border-cardBorder">
                            <h3 className="text-white font-heading font-medium mb-4">Select Page Range Context</h3>
                            <div className="flex items-center space-x-4">
                                <div className="flex-1">
                                    <label className="text-xs text-text-muted font-bold tracking-wider uppercase mb-1 block">From Page</label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="1"
                                        value={startPage}
                                        onChange={(e) => setStartPage(e.target.value as unknown as number)}
                                        className="w-full bg-background border border-cardBorder rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors focus:shadow-[0_0_15px_rgba(0,245,255,0.2)] placeholder-text-muted/50"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-text-muted font-bold tracking-wider uppercase mb-1 block">To Page</label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="End"
                                        value={endPage}
                                        onChange={(e) => setEndPage(e.target.value as unknown as number)}
                                        className="w-full bg-background border border-cardBorder rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors focus:shadow-[0_0_15px_rgba(0,245,255,0.2)] placeholder-text-muted/50"
                                    />
                                </div>
                            </div>
                            <p className="text-sm text-text-muted mt-3">Leave empty to extract all pages from start to finish.</p>
                            {errorMsg && <p className="text-sm text-red-500 mt-3">{errorMsg}</p>}
                        </div>

                        <button
                            onClick={handleSplit}
                            className="group relative flex items-center justify-center space-x-3 bg-primary text-[#0A0A0F] font-bold text-lg px-8 py-4 rounded-full shadow-[0_0_20px_rgba(0,245,255,0.4)] hover:shadow-[0_0_35px_rgba(0,245,255,0.6)] hover:scale-105 transition-all duration-300"
                        >
                            <Scissors className="w-5 h-5" />
                            <span>Split PDF</span>
                            <div className="absolute inset-0 rounded-full border border-white/20 scale-105 group-hover:scale-110 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                        </button>
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
                        <h3 className="text-white font-heading font-medium mb-4">Extracting pages...</h3>

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
                                <Download size={32} />
                            </div>
                            <h3 className="text-2xl font-heading font-bold text-white mb-2">Success!</h3>
                            <p className="text-text-muted mb-6">Your PDF pages have been extracted.</p>

                            <a
                                href={downloadUrl}
                                download="split-document.pdf"
                                className="group relative flex items-center space-x-2 bg-white text-black font-bold px-8 py-4 rounded-full hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] hover:scale-105 transition-all duration-300"
                            >
                                <span>Download Extracted PDF</span>
                                <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                            </a>
                        </div>

                        <button
                            onClick={() => { setDownloadUrl(null); setFiles([]); setProgress(0); setStartPage(''); setEndPage(''); }}
                            className="text-text-muted hover:text-white transition-colors underline decoration-text-muted/50 underline-offset-4"
                        >
                            Start over with a new file
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
