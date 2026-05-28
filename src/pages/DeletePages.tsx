import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PDFDocument } from 'pdf-lib';
import { Download, Loader2, Trash2, Check } from 'lucide-react';
import FileUploadZone from '../components/ui/FileUploadZone';

export default function DeletePages() {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [loadingPages, setLoadingPages] = useState(false);
    const [progress, setProgress] = useState(0);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    // List of page indices selected for deletion
    const [selectedPages, setSelectedPages] = useState<number[]>([]);
    const [totalPagesCount, setTotalPagesCount] = useState(0);

    const canvasContainerRefs = useRef<(HTMLCanvasElement | null)[]>([]);

    // Load PDF page previews using PDF.js
    useEffect(() => {
        if (files.length === 0) {
            setSelectedPages([]);
            setTotalPagesCount(0);
            return;
        }

        const renderPreviews = async () => {
            setLoadingPages(true);
            setSelectedPages([]);
            try {
                // @ts-ignore
                const pdfjs = await import(/* @vite-ignore */ 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.min.mjs');
                pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.mjs';

                const file = files[0];
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
                setTotalPagesCount(pdf.numPages);

                // Render page previews asynchronously
                setTimeout(async () => {
                    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                        const page = await pdf.getPage(pageNum);
                        const canvas = canvasContainerRefs.current[pageNum - 1];
                        if (canvas) {
                            const context = canvas.getContext('2d');
                            const viewport = page.getViewport({ scale: 0.3 }); // thumbnail scale
                            canvas.width = viewport.width;
                            canvas.height = viewport.height;
                            
                            if (context) {
                                await page.render({
                                    canvasContext: context,
                                    viewport: viewport
                                }).promise;
                            }
                        }
                    }
                    setLoadingPages(false);
                }, 100);

            } catch (error) {
                console.error("Error loading PDF previews:", error);
                setLoadingPages(false);
            }
        };

        renderPreviews();
    }, [files]);

    const togglePageSelection = (index: number) => {
        setSelectedPages(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const selectAll = () => {
        const allIndices = Array.from({ length: totalPagesCount }, (_, i) => i);
        setSelectedPages(allIndices);
    };

    const clearSelection = () => {
        setSelectedPages([]);
    };

    const invertSelection = () => {
        const allIndices = Array.from({ length: totalPagesCount }, (_, i) => i);
        const inverted = allIndices.filter(i => !selectedPages.includes(i));
        setSelectedPages(inverted);
    };

    const handleDelete = async () => {
        if (files.length === 0 || selectedPages.length === 0) return;
        if (selectedPages.length === totalPagesCount) {
            alert("You cannot delete all pages. At least one page must remain.");
            return;
        }

        setIsProcessing(true);
        setProgress(20);
        setDownloadUrl(null);

        try {
            const file = files[0];
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            setProgress(50);

            // programmatic detail: delete pages in descending order so indices don't shift!
            const sortedIndices = [...selectedPages].sort((a, b) => b - a);
            sortedIndices.forEach(index => {
                pdfDoc.removePage(index);
            });

            setProgress(80);

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            setProgress(100);
            setTimeout(() => {
                setDownloadUrl(url);
                setIsProcessing(false);
            }, 300);

        } catch (error) {
            console.error("Error deleting PDF pages:", error);
            setIsProcessing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col items-center"
        >
            <div className="text-center mb-10">
                <h1 className="text-4xl font-heading font-extrabold text-white mb-3">Delete PDF Pages</h1>
                <p className="text-base text-text-muted font-body max-w-2xl mx-auto leading-relaxed">
                    Select pages visually to delete them and download a restructured PDF instantly.
                </p>
            </div>

            <FileUploadZone
                onFilesSelected={(f) => { setFiles(f); setDownloadUrl(null); }}
                allowMultiple={false}
                maxFiles={1}
                message="Drag & drop a PDF file to manage pages"
            />

            <AnimatePresence mode="wait">
                {files.length === 1 && !isProcessing && !downloadUrl && (
                    <motion.div
                        key="delete-workspace"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full mt-10 flex flex-col items-center"
                    >
                        {/* Control Toolbar */}
                        <div className="w-full flex flex-col sm:flex-row justify-between items-center bg-card/20 border border-cardBorder/30 p-4 rounded-2xl mb-8 gap-4">
                            <div className="flex space-x-3">
                                <button
                                    onClick={selectAll}
                                    className="bg-white/5 border border-cardBorder hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                                >
                                    Select All
                                </button>
                                <button
                                    onClick={clearSelection}
                                    className="bg-white/5 border border-cardBorder hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                                >
                                    Clear Selection
                                </button>
                                <button
                                    onClick={invertSelection}
                                    className="bg-white/5 border border-cardBorder hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                                >
                                    Invert
                                </button>
                            </div>

                            <div className="flex items-center space-x-4">
                                <span className="text-xs text-text-muted font-bold font-mono">
                                    Selected: <span className="text-red-400 font-bold">{selectedPages.length}</span> / {totalPagesCount}
                                </span>
                                <button
                                    onClick={handleDelete}
                                    disabled={selectedPages.length === 0 || selectedPages.length === totalPagesCount}
                                    className="group relative flex items-center space-x-2 bg-red-500 text-white font-extrabold text-xs px-6 py-3 rounded-full hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] disabled:opacity-30 disabled:pointer-events-none transition-all duration-300"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete Pages</span>
                                </button>
                            </div>
                        </div>

                        {loadingPages ? (
                            <div className="flex flex-col items-center py-20">
                                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                                <p className="text-text-muted text-sm font-body">Generating visual page thumbnails...</p>
                            </div>
                        ) : (
                            /* Visual Page Grid */
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 w-full">
                                {Array.from({ length: totalPagesCount }).map((_, index) => {
                                    const isPageSelected = selectedPages.includes(index);
                                    return (
                                        <div
                                            key={index}
                                            onClick={() => togglePageSelection(index)}
                                            className={`group relative flex flex-col items-center bg-card/10 border p-3 rounded-2xl cursor-pointer select-none transition-all duration-300 ${
                                                isPageSelected
                                                    ? 'border-red-500/60 bg-red-950/10 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                                                    : 'border-cardBorder hover:border-primary/40 hover:bg-card/25'
                                            }`}
                                        >
                                            {/* Thumbnail Canvas */}
                                            <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-background/50 border border-cardBorder/30">
                                                <canvas
                                                    ref={(el) => {
                                                        canvasContainerRefs.current[index] = el;
                                                    }}
                                                    className="w-full h-full object-contain"
                                                />

                                                {/* Selected overlay */}
                                                <AnimatePresence>
                                                    {isPageSelected && (
                                                        <motion.div
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            className="absolute inset-0 bg-red-950/65 flex flex-col items-center justify-center border-2 border-red-500/80 rounded-lg pointer-events-none"
                                                        >
                                                            <div className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg mb-2">
                                                                <Trash2 className="w-5 h-5 animate-pulse" />
                                                            </div>
                                                            <span className="text-[10px] text-white font-extrabold tracking-wider uppercase">To Delete</span>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Page Label */}
                                            <div className="mt-3 w-full flex justify-between items-center px-1">
                                                <span className="text-xs font-bold text-white">Page {index + 1}</span>
                                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                                    isPageSelected
                                                        ? 'bg-red-500 border-red-500 text-white'
                                                        : 'border-cardBorder text-transparent group-hover:border-primary/50'
                                                }`}>
                                                    <Check size={10} strokeWidth={4} />
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
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
                        <h3 className="text-white font-heading font-medium mb-4">Removing selected pages...</h3>

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
                            <h3 className="text-2xl font-heading font-bold text-white mb-2">Restructured Successfully!</h3>
                            <p className="text-text-muted mb-6">Selected pages have been permanently removed.</p>

                            <a
                                href={downloadUrl}
                                download={`${files[0].name.replace('.pdf', '')}-restructured.pdf`}
                                className="group relative flex items-center space-x-2 bg-white text-black font-bold px-8 py-4 rounded-full hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] hover:scale-105 transition-all duration-300"
                            >
                                <span>Download PDF</span>
                                <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                            </a>
                        </div>

                        <button
                            onClick={() => { setDownloadUrl(null); setFiles([]); setSelectedPages([]); setTotalPagesCount(0); setProgress(0); }}
                            className="text-text-muted hover:text-white transition-colors underline decoration-text-muted/50 underline-offset-4"
                        >
                            Process another document
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
