import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PDFDocument } from 'pdf-lib';
import { Download, Loader2, Image as ImageIcon, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import FileUploadZone from '../components/ui/FileUploadZone';

interface ImageFile {
    id: string;
    file: File;
    previewUrl: string;
}

export default function JPGToPDF() {
    const [images, setImages] = useState<ImageFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    const handleFilesSelected = (selectedFiles: File[]) => {
        const newImages = selectedFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            previewUrl: URL.createObjectURL(file)
        }));
        setImages(prev => [...prev, ...newImages]);
        setDownloadUrl(null);
    };

    const removeImage = (id: string) => {
        setImages(prev => {
            const target = prev.find(img => img.id === id);
            if (target) {
                URL.revokeObjectURL(target.previewUrl);
            }
            return prev.filter(img => img.id !== id);
        });
    };

    const moveImage = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === images.length - 1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        const updatedImages = [...images];
        const temp = updatedImages[index];
        updatedImages[index] = updatedImages[newIndex];
        updatedImages[newIndex] = temp;
        setImages(updatedImages);
    };

    const handleConvert = async () => {
        if (images.length === 0) return;

        setIsProcessing(true);
        setProgress(10);
        setDownloadUrl(null);

        try {
            const pdfDoc = await PDFDocument.create();

            for (let i = 0; i < images.length; i++) {
                const imgObj = images[i];
                const fileBytes = await imgObj.file.arrayBuffer();
                let embeddedImage;

                const fileType = imgObj.file.type;
                if (fileType === 'image/png') {
                    embeddedImage = await pdfDoc.embedPng(fileBytes);
                } else {
                    // Fallback to JPG for standard jpg/jpeg
                    embeddedImage = await pdfDoc.embedJpg(fileBytes);
                }

                // Get dimensions of embedded image
                const { width, height } = embeddedImage.scale(1.0);

                // Create a page matching the image dimensions perfectly (100% accurate!)
                const page = pdfDoc.addPage([width, height]);
                page.drawImage(embeddedImage, {
                    x: 0,
                    y: 0,
                    width,
                    height
                });

                setProgress(10 + Math.floor(((i + 1) / images.length) * 80));
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
            console.error("Error converting images to PDF:", error);
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
                <h1 className="text-4xl font-heading font-extrabold text-white mb-3">Convert JPG/PNG to PDF</h1>
                <p className="text-base text-text-muted font-body max-w-2xl mx-auto leading-relaxed">
                    Accurately convert and merge your images into a single professional PDF document. Reorder pages instantly.
                </p>
            </div>

            <FileUploadZone
                onFilesSelected={handleFilesSelected}
                allowMultiple={true}
                maxFiles={20}
                accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }}
                message="Drag & drop images (JPG, PNG) to convert"
            />

            <AnimatePresence mode="wait">
                {images.length > 0 && !isProcessing && !downloadUrl && (
                    <motion.div
                        key="images-list"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full mt-10 flex flex-col items-center"
                    >
                        {/* Action Header */}
                        <div className="flex justify-between items-center w-full max-w-2xl mb-6">
                            <span className="text-sm font-semibold text-text-muted">{images.length} images selected</span>
                            <button
                                onClick={handleConvert}
                                className="inline-flex items-center space-x-2 bg-primary hover:shadow-[0_0_15px_rgba(0,245,255,0.3)] text-[#0A0A0F] px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all"
                            >
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>Convert to PDF</span>
                            </button>
                        </div>

                        {/* Drag and Reorder List */}
                        <div className="w-full max-w-2xl flex flex-col space-y-4">
                            {images.map((img, idx) => (
                                <div
                                    key={img.id}
                                    className="glass-card p-4 rounded-2xl flex items-center justify-between border border-cardBorder/40 bg-card/25"
                                >
                                    <div className="flex items-center space-x-4">
                                        {/* Image Preview */}
                                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-cardBorder bg-background/50 flex items-center justify-center p-1">
                                            <img src={img.previewUrl} alt="preview" className="max-w-full max-h-full object-cover rounded-lg" />
                                        </div>
                                        <div>
                                            <h4 className="text-white text-sm font-semibold truncate max-w-[200px] sm:max-w-xs">{img.file.name}</h4>
                                            <p className="text-[10px] text-text-muted mt-0.5">{(img.file.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => moveImage(idx, 'up')}
                                            disabled={idx === 0}
                                            className="p-2 rounded-lg bg-white/5 border border-cardBorder text-text-muted hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                        >
                                            <ArrowUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => moveImage(idx, 'down')}
                                            disabled={idx === images.length - 1}
                                            className="p-2 rounded-lg bg-white/5 border border-cardBorder text-text-muted hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                        >
                                            <ArrowDown className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => removeImage(img.id)}
                                            className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
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
                        <h3 className="text-white font-heading font-medium mb-4">Converting images...</h3>

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
                            <h3 className="text-2xl font-heading font-bold text-white mb-2">PDF Created Successfully!</h3>
                            <p className="text-text-muted mb-6">Your image compilation is ready for download.</p>

                            <a
                                href={downloadUrl}
                                download="images-compilation.pdf"
                                className="group relative flex items-center space-x-2 bg-white text-black font-bold px-8 py-4 rounded-full hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] hover:scale-105 transition-all duration-300"
                            >
                                <span>Download PDF</span>
                                <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                            </a>
                        </div>

                        <button
                            onClick={() => { setDownloadUrl(null); setImages([]); setProgress(0); }}
                            className="text-text-muted hover:text-white transition-colors underline decoration-text-muted/50 underline-offset-4"
                        >
                            Compile more images
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
