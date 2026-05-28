import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Loader2, Images } from 'lucide-react';
import FileUploadZone from '../components/ui/FileUploadZone';

export default function PDFToJPG() {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    const handleConvert = async () => {
        if (files.length === 0) return;

        setIsProcessing(true);
        setProgress(5);
        setDownloadUrl(null);

        try {
            // @ts-ignore
            const pdfjs = await import(/* @vite-ignore */ 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.min.mjs');
            pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.mjs';

            // Import jszip dynamically
            // @ts-ignore
            const JSZipModule = await import('jszip');
            const JSZip = JSZipModule.default || JSZipModule;
            const zip = new JSZip();

            setProgress(15);

            const file = files[0];
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
            
            const pdf = await loadingTask.promise;
            const numPages = pdf.numPages;
            
            setProgress(25);

            // Create offscreen canvas for rendering high resolution images (scale: 2.0 for premium quality!)
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                
                // High scale = 2.0 to make text crisp and high-quality in extracted images
                const viewport = page.getViewport({ scale: 2.0 });
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                if (context) {
                    await page.render({
                        canvasContext: context,
                        viewport: viewport
                    }).promise;

                    // Convert canvas to image data
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                    const base64Data = dataUrl.split(',')[1];
                    
                    // Add to ZIP
                    zip.file(`page-${pageNum}.jpg`, base64Data, { base64: true });
                }

                const progressStep = 25 + Math.floor((pageNum / numPages) * 55);
                setProgress(progressStep);
            }

            setProgress(85);

            // Package ZIP
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const zipUrl = URL.createObjectURL(zipBlob);

            setProgress(100);
            setTimeout(() => {
                setDownloadUrl(zipUrl);
                setIsProcessing(false);
            }, 300);

        } catch (error) {
            console.error("Error converting PDF to images:", error);
            setIsProcessing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center"
        >
            <div className="text-center mb-10">
                <h1 className="text-4xl font-heading font-extrabold text-white mb-3">Convert PDF to JPG</h1>
                <p className="text-base text-text-muted font-body max-w-2xl mx-auto leading-relaxed">
                    Extract all pages from your PDF document and compile them into high-resolution JPG images packaged inside a neat ZIP file.
                </p>
            </div>

            <FileUploadZone
                onFilesSelected={(f) => { setFiles(f); setDownloadUrl(null); }}
                allowMultiple={false}
                maxFiles={1}
                message="Drag & drop a PDF to extract pages as JPGs"
            />

            <AnimatePresence mode="wait">
                {files.length === 1 && !isProcessing && !downloadUrl && (
                    <motion.div
                        key="convert-button"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mt-10"
                    >
                        <button
                            onClick={handleConvert}
                            className="group relative flex items-center justify-center space-x-3 bg-[#00F5FF] text-[#0A0A0F] font-extrabold text-lg px-8 py-4 rounded-full shadow-[0_0_20px_rgba(0,245,255,0.4)] hover:shadow-[0_0_35px_rgba(0,245,255,0.6)] hover:scale-105 transition-all duration-300"
                        >
                            <Images className="w-5 h-5" />
                            <span>Extract Page Images</span>
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
                        <h3 className="text-white font-heading font-medium mb-4">Rendering crisp page frames...</h3>

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
                            <h3 className="text-2xl font-heading font-bold text-white mb-2">Extraction Complete!</h3>
                            <p className="text-text-muted mb-6">Your page images are bundled in a ZIP package.</p>

                            <a
                                href={downloadUrl}
                                download={`${files[0].name.replace('.pdf', '')}-images.zip`}
                                className="group relative flex items-center space-x-2 bg-white text-black font-bold px-8 py-4 rounded-full hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] hover:scale-105 transition-all duration-300"
                            >
                                <span>Download ZIP Archive</span>
                                <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                            </a>
                        </div>

                        <button
                            onClick={() => { setDownloadUrl(null); setFiles([]); setProgress(0); }}
                            className="text-text-muted hover:text-white transition-colors underline decoration-text-muted/50 underline-offset-4"
                        >
                            Convert another file
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
