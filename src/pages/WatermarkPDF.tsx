import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { Download, Loader2, Sparkles, Check } from 'lucide-react';
import FileUploadZone from '../components/ui/FileUploadZone';

export default function WatermarkPDF() {
    const [files, setFiles] = useState<File[]>([]);
    const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
    const [opacity, setOpacity] = useState(0.3);
    const [angle, setAngle] = useState(-45);
    const [fontSize, setFontSize] = useState(60);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    const handleWatermark = async () => {
        if (files.length === 0 || !watermarkText) return;

        setIsProcessing(true);
        setProgress(15);
        setDownloadUrl(null);

        try {
            const file = files[0];
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();
            
            setProgress(35);

            // Embed font
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const textWidth = helveticaFont.widthOfTextAtSize(watermarkText, fontSize);
            const textHeight = helveticaFont.heightAtSize(fontSize);

            setProgress(60);

            // Overlay watermark on all pages
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const { width, height } = page.getSize();

                // Compute centered position
                const x = width / 2 - textWidth / 2;
                const y = height / 2 - textHeight / 2;

                page.drawText(watermarkText, {
                    x,
                    y,
                    size: fontSize,
                    font: helveticaFont,
                    color: rgb(0.7, 0.7, 0.7), // soft grey
                    opacity: opacity,
                    rotate: degrees(angle),
                });

                setProgress(60 + Math.floor(((i + 1) / pages.length) * 30));
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            setProgress(100);
            setTimeout(() => {
                setDownloadUrl(url);
                setIsProcessing(false);
            }, 300);

        } catch (error) {
            console.error("Error overlaying watermark:", error);
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
                <h1 className="text-4xl font-heading font-extrabold text-white mb-3">Add Watermark to PDF</h1>
                <p className="text-base text-text-muted font-body max-w-2xl mx-auto leading-relaxed">
                    Add clean, professional text overlays on all pages of your PDF document. Customize opacity, angle, and size.
                </p>
            </div>

            <FileUploadZone
                onFilesSelected={(f) => { setFiles(f); setDownloadUrl(null); }}
                allowMultiple={false}
                maxFiles={1}
                message="Drag & drop a PDF file to overlay watermarks"
            />

            <AnimatePresence mode="wait">
                {files.length === 1 && !isProcessing && !downloadUrl && (
                    <motion.div
                        key="watermark-inputs"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mt-10 w-full max-w-md"
                    >
                        <div className="glass-card p-8 rounded-3xl border border-cardBorder/40 bg-card/25 shadow-xl flex flex-col space-y-6">
                            <div className="flex items-center space-x-3 text-white mb-2">
                                <Sparkles className="w-5 h-5 text-primary" />
                                <h3 className="font-heading font-bold text-lg">Watermark Style</h3>
                            </div>

                            {/* Watermark text input */}
                            <div>
                                <label className="text-xs text-text-muted font-bold tracking-wider uppercase mb-2 block">Watermark Text</label>
                                <input
                                    type="text"
                                    placeholder="e.g. CONFIDENTIAL, DRAFT..."
                                    value={watermarkText}
                                    onChange={(e) => setWatermarkText(e.target.value.toUpperCase())}
                                    className="w-full bg-background border border-cardBorder rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-primary transition-colors focus:shadow-[0_0_15px_rgba(0,245,255,0.15)] placeholder-text-muted/40 text-sm font-semibold tracking-wider"
                                />
                            </div>

                            {/* Opacity slider */}
                            <div>
                                <div className="flex justify-between items-center text-xs text-text-muted mb-2 font-bold uppercase tracking-wider">
                                    <span>Opacity</span>
                                    <span className="text-white">{Math.round(opacity * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.05"
                                    max="0.8"
                                    step="0.05"
                                    value={opacity}
                                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-background border border-cardBorder rounded-full appearance-none outline-none accent-primary"
                                />
                            </div>

                            {/* Angle slider */}
                            <div>
                                <div className="flex justify-between items-center text-xs text-text-muted mb-2 font-bold uppercase tracking-wider">
                                    <span>Rotation Angle</span>
                                    <span className="text-white">{angle}°</span>
                                </div>
                                <input
                                    type="range"
                                    min="-90"
                                    max="90"
                                    step="5"
                                    value={angle}
                                    onChange={(e) => setAngle(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-background border border-cardBorder rounded-full appearance-none outline-none accent-primary"
                                />
                            </div>

                            {/* Size input */}
                            <div>
                                <div className="flex justify-between items-center text-xs text-text-muted mb-2 font-bold uppercase tracking-wider">
                                    <span>Font Size</span>
                                    <span className="text-white">{fontSize}pt</span>
                                </div>
                                <input
                                    type="range"
                                    min="20"
                                    max="120"
                                    step="5"
                                    value={fontSize}
                                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-background border border-cardBorder rounded-full appearance-none outline-none accent-primary"
                                />
                            </div>

                            <button
                                onClick={handleWatermark}
                                disabled={!watermarkText}
                                className="group relative flex items-center justify-center space-x-3 bg-[#00F5FF] text-[#0A0A0F] font-extrabold text-base py-4 rounded-full shadow-[0_0_20px_rgba(0,245,255,0.4)] hover:shadow-[0_0_35px_rgba(0,245,255,0.6)] hover:scale-[1.02] disabled:opacity-30 disabled:pointer-events-none transition-all duration-300"
                            >
                                <Sparkles className="w-4.5 h-4.5" />
                                <span>Apply Watermark</span>
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
                        <h3 className="text-white font-heading font-medium mb-4">Overlaying watermark streams...</h3>

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
                            <h3 className="text-2xl font-heading font-bold text-white mb-2">Watermarked Successfully!</h3>
                            <p className="text-text-muted mb-6">Your modified PDF document is ready.</p>

                            <a
                                href={downloadUrl}
                                download={`${files[0].name.replace('.pdf', '')}-watermarked.pdf`}
                                className="group relative flex items-center space-x-2 bg-white text-black font-bold px-8 py-4 rounded-full hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] hover:scale-105 transition-all duration-300"
                            >
                                <span>Download PDF</span>
                                <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                            </a>
                        </div>

                        <button
                            onClick={() => { setDownloadUrl(null); setFiles([]); setProgress(0); }}
                            className="text-text-muted hover:text-white transition-colors underline decoration-text-muted/50 underline-offset-4"
                        >
                            Watermark another file
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
