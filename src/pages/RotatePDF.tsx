import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PDFDocument, degrees } from 'pdf-lib';
import { Download, Loader2, RotateCw, RefreshCw } from 'lucide-react';
import FileUploadZone from '../components/ui/FileUploadZone';

interface PageRotation {
    pageIndex: number;
    rotation: number; // 0, 90, 180, 270
}

export default function RotatePDF() {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [loadingPages, setLoadingPages] = useState(false);
    const [progress, setProgress] = useState(0);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [pageRotations, setPageRotations] = useState<PageRotation[]>([]);
    
    const canvasContainerRefs = useRef<(HTMLCanvasElement | null)[]>([]);

    // Load PDF page previews using PDF.js
    useEffect(() => {
        if (files.length === 0) {
            setPageRotations([]);
            return;
        }

        const renderPreviews = async () => {
            setLoadingPages(true);
            setPageRotations([]);
            try {
                // @ts-ignore
                const pdfjs = await import(/* @vite-ignore */ 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.min.mjs');
                pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.mjs';

                const file = files[0];
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
                const totalPages = pdf.numPages;

                const rotations: PageRotation[] = [];
                for (let i = 0; i < totalPages; i++) {
                    rotations.push({ pageIndex: i, rotation: 0 });
                }
                setPageRotations(rotations);

                // Render first few pages as thumbnails (async)
                setTimeout(async () => {
                    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                        const page = await pdf.getPage(pageNum);
                        const canvas = canvasContainerRefs.current[pageNum - 1];
                        if (canvas) {
                            const context = canvas.getContext('2d');
                            const viewport = page.getViewport({ scale: 0.3 }); // small scale for thumbnails
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

    const rotatePage = (index: number) => {
        setPageRotations(prev =>
            prev.map(p =>
                p.pageIndex === index
                    ? { ...p, rotation: (p.rotation + 90) % 360 }
                    : p
            )
        );
    };

    const rotateAll = () => {
        setPageRotations(prev =>
            prev.map(p => ({ ...p, rotation: (p.rotation + 90) % 360 }))
        );
    };

    const handleSave = async () => {
        if (files.length === 0) return;

        setIsProcessing(true);
        setProgress(20);
        setDownloadUrl(null);

        try {
            const file = files[0];
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();

            setProgress(50);

            // Apply rotations
            pageRotations.forEach(pr => {
                if (pr.rotation !== 0 && pr.pageIndex < pages.length) {
                    const page = pages[pr.pageIndex];
                    const existingRotation = page.getRotation().angle;
                    page.setRotation(degrees((existingRotation + pr.rotation) % 360));
                }
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
            console.error("Error rotating PDF pages:", error);
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
                <h1 className="text-4xl font-heading font-extrabold text-white mb-3">Rotate PDF Pages</h1>
                <p className="text-base text-text-muted font-body max-w-2xl mx-auto leading-relaxed">
                    Rotate pages clockwise. Visualize and rotate individual pages or the entire document instantly.
                </p>
            </div>

            <FileUploadZone
                onFilesSelected={(f) => { setFiles(f); setDownloadUrl(null); }}
                allowMultiple={false}
                maxFiles={1}
                message="Drag & drop a PDF file to rotate pages"
            />

            <AnimatePresence mode="wait">
                {files.length === 1 && !isProcessing && !downloadUrl && (
                    <motion.div
                        key="pages-grid"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full mt-10 flex flex-col items-center"
                    >
                        {/* Control Bar */}
                        <div className="flex space-x-4 mb-6">
                            <button
                                onClick={rotateAll}
                                disabled={loadingPages}
                                className="inline-flex items-center space-x-2 bg-card/60 hover:bg-white/10 text-white border border-cardBorder px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                            >
                                <RotateCw className="w-3.5 h-3.5" />
                                <span>Rotate All Pages</span>
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={loadingPages}
                                className="inline-flex items-center space-x-2 bg-primary hover:shadow-[0_0_15px_rgba(0,245,255,0.3)] text-[#0A0A0F] px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Save & Download</span>
                            </button>
                        </div>

                        {loadingPages && (
                            <div className="flex flex-col items-center py-12">
                                <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                                <p className="text-xs text-text-muted">Loading PDF pages...</p>
                            </div>
                        )}

                        {/* Page Thumbnails Responsive Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 w-full">
                            {pageRotations.map((pr, idx) => (
                                <div
                                    key={pr.pageIndex}
                                    className="glass-card p-4 rounded-2xl flex flex-col items-center border border-cardBorder relative group"
                                >
                                    {/* Rotate overlay button */}
                                    <button
                                        onClick={() => rotatePage(pr.pageIndex)}
                                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-primary hover:text-black border border-white/15 text-white z-10 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                                    >
                                        <RotateCw className="w-3 h-3" />
                                    </button>

                                    {/* Visual Canvas with CSS Rotate Transform */}
                                    <div className="w-full aspect-[3/4] flex items-center justify-center bg-background/50 rounded-xl overflow-hidden border border-cardBorder/50 p-2">
                                        <canvas
                                            ref={el => { canvasContainerRefs.current[idx] = el; }}
                                            className="max-w-full max-h-full transition-transform duration-300 shadow-md rounded"
                                            style={{ transform: `rotate(${pr.rotation}deg)` }}
                                        />
                                    </div>

                                    {/* Page Info */}
                                    <div className="mt-3 flex items-center justify-between w-full px-1">
                                        <span className="text-[10px] font-bold text-text-muted">Page {pr.pageIndex + 1}</span>
                                        {pr.rotation > 0 && (
                                            <span className="text-[9px] font-extrabold text-primary">{pr.rotation}°</span>
                                        )}
                                    </div>
                                </div>
                            ))}
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
                        <h3 className="text-white font-heading font-medium mb-4">Applying rotations...</h3>

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
                            <h3 className="text-2xl font-heading font-bold text-white mb-2">Rotated Successfully!</h3>
                            <p className="text-text-muted mb-6">Your modified PDF document is ready.</p>

                            <a
                                href={downloadUrl}
                                download={`${files[0].name.replace('.pdf', '')}-rotated.pdf`}
                                className="group relative flex items-center space-x-2 bg-white text-black font-bold px-8 py-4 rounded-full hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] hover:scale-105 transition-all duration-300"
                            >
                                <span>Download PDF</span>
                                <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                            </a>
                        </div>

                        <button
                            onClick={() => { setDownloadUrl(null); setFiles([]); setProgress(0); setPageRotations([]); }}
                            className="text-text-muted hover:text-white transition-colors underline decoration-text-muted/50 underline-offset-4"
                        >
                            Rotate another document
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
