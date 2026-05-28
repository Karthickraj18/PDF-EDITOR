import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Loader2, FileText } from 'lucide-react';
import FileUploadZone from '../components/ui/FileUploadZone';

export default function WordToPDF() {
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

            setProgress(15);

            const file = files[0];
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
            
            const pdf = await loadingTask.promise;
            const numPages = pdf.numPages;
            
            setProgress(25);

            // Import docx libraries
            const { Document, Packer, Paragraph, TextRun, AlignmentType } = await import('docx');

            const sections: any[] = [];

            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                
                // Get page size in points
                const viewport = page.getViewport({ scale: 1.0 });
                const pageWidth = viewport.width;
                const pageHeight = viewport.height;

                const textContent = await page.getTextContent();
                const items = textContent.items as any[];
                
                const validItems = items.filter(item => item.str && item.str.trim() !== '');
                
                // Compute page bounding box to determine margins
                let minX = pageWidth;
                let maxX = 0;
                let minY = pageHeight;
                let maxY = 0;

                for (const item of validItems) {
                    const left = item.transform[4];
                    const right = left + item.width;
                    const bottom = item.transform[5];
                    const top = bottom + (item.height || 10);
                    
                    if (left < minX) minX = left;
                    if (right > maxX) maxX = right;
                    if (bottom < minY) minY = bottom;
                    if (top > maxY) maxY = top;
                }

                // Margins in points (fallback to standard 72 points / 1 inch)
                const marginBuffer = 10;
                let leftMargin = validItems.length > 0 ? Math.max(36, minX - marginBuffer) : 72;
                let rightMargin = validItems.length > 0 ? Math.max(36, pageWidth - maxX - marginBuffer) : 72;
                let topMargin = validItems.length > 0 ? Math.max(36, pageHeight - maxY - marginBuffer) : 72;
                let bottomMargin = validItems.length > 0 ? Math.max(36, minY - marginBuffer) : 72;

                // Cap margins (max 144 points / 2 inches)
                leftMargin = Math.min(144, leftMargin);
                rightMargin = Math.min(144, rightMargin);
                topMargin = Math.min(144, topMargin);
                bottomMargin = Math.min(144, bottomMargin);

                const contentWidth = pageWidth - leftMargin - rightMargin;

                // Sort items by Y descending (top-to-bottom) then X ascending (left-to-right)
                validItems.sort((a, b) => {
                    const yDiff = b.transform[5] - a.transform[5];
                    if (Math.abs(yDiff) < 5) {
                        return a.transform[4] - b.transform[4];
                    }
                    return yDiff;
                });
                
                const lines: any[][] = [];
                let currentLine: any[] = [];
                let currentY = -1;
                
                for (const item of validItems) {
                    const itemY = item.transform[5];
                    if (currentLine.length === 0) {
                        currentLine.push(item);
                        currentY = itemY;
                    } else if (Math.abs(currentY - itemY) < 8) {
                        currentLine.push(item);
                    } else {
                        lines.push(currentLine);
                        currentLine = [item];
                        currentY = itemY;
                    }
                }
                if (currentLine.length > 0) {
                    lines.push(currentLine);
                }
                
                // Group lines into paragraphs based on spacing
                const paragraphGroups: any[][] = [];
                let currentParaGroup: any[] = [];
                let lastLineY = -1;

                for (const lineItems of lines) {
                    const lineY = lineItems[0].transform[5];
                    if (currentParaGroup.length === 0) {
                        currentParaGroup.push(lineItems);
                    } else {
                        const yGap = Math.abs(lastLineY - lineY);
                        const itemHeight = lineItems[0].height || 10;
                        if (yGap > itemHeight * 1.8) {
                            paragraphGroups.push(currentParaGroup);
                            currentParaGroup = [lineItems];
                        } else {
                            currentParaGroup.push(lineItems);
                        }
                    }
                    lastLineY = lineY;
                }
                if (currentParaGroup.length > 0) {
                    paragraphGroups.push(currentParaGroup);
                }

                const pageParagraphsList: any[] = [];

                for (const paraGroup of paragraphGroups) {
                    let paraMinX = pageWidth;
                    let paraMaxX = 0;
                    const paraLinesTexts: string[] = [];

                    for (const lineItems of paraGroup) {
                        lineItems.sort((a: any, b: any) => a.transform[4] - b.transform[4]);
                        
                        let lineText = '';
                        for (let i = 0; i < lineItems.length; i++) {
                            const item = lineItems[i];
                            const itemLeft = item.transform[4];
                            const itemRight = itemLeft + item.width;

                            if (itemLeft < paraMinX) paraMinX = itemLeft;
                            if (itemRight > paraMaxX) paraMaxX = itemRight;

                            if (i > 0) {
                                const prevItem = lineItems[i - 1];
                                const spaceGap = item.transform[4] - (prevItem.transform[4] + prevItem.width);
                                if (spaceGap > 2) {
                                    lineText += ' ';
                                }
                            }
                            lineText += item.str;
                        }
                        paraLinesTexts.push(lineText);
                    }

                    const paraText = paraLinesTexts.join(' ');
                    if (paraText.trim() === '') continue;

                    // Determine alignment & indentation
                    const paraWidth = paraMaxX - paraMinX;
                    let alignment: any = AlignmentType.LEFT;
                    let indentLeft = 0;

                    const contentCenter = leftMargin + contentWidth / 2;
                    const paraCenter = paraMinX + paraWidth / 2;

                    if (Math.abs(paraCenter - contentCenter) < 15 && paraWidth < contentWidth * 0.8) {
                        alignment = AlignmentType.CENTER;
                    } else if (Math.abs(paraMaxX - (pageWidth - rightMargin)) < 15 && paraWidth < contentWidth * 0.8) {
                        alignment = AlignmentType.RIGHT;
                    } else {
                        const leftDiff = paraMinX - leftMargin;
                        if (leftDiff > 10) {
                            indentLeft = Math.round(leftDiff * 20); // twips
                        }
                    }

                    pageParagraphsList.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: paraText,
                                    size: 24, // 12pt
                                    font: "Arial"
                                })
                            ],
                            alignment: alignment,
                            indent: indentLeft > 0 ? { left: indentLeft } : undefined,
                            spacing: {
                                after: 120, // 6pt
                                line: 276, // 1.15
                            }
                        })
                    );
                }

                // If page is empty, add one empty paragraph to prevent docx errors
                if (pageParagraphsList.length === 0) {
                    pageParagraphsList.push(
                        new Paragraph({
                            children: [new TextRun("")]
                        })
                    );
                }

                sections.push({
                    properties: {
                        page: {
                            size: {
                                width: Math.round(pageWidth * 20),
                                height: Math.round(pageHeight * 20),
                            },
                            margin: {
                                top: Math.round(topMargin * 20),
                                right: Math.round(rightMargin * 20),
                                bottom: Math.round(bottomMargin * 20),
                                left: Math.round(leftMargin * 20),
                            }
                        }
                    },
                    children: pageParagraphsList
                });
                
                const progressStep = 25 + Math.floor((pageNum / numPages) * 50);
                setProgress(progressStep);
            }

            setProgress(80);

            const doc = new Document({
                sections: sections
            });

            setProgress(90);

            const docxBlob = await Packer.toBlob(doc);
            const docxUrl = URL.createObjectURL(docxBlob);
            
            setProgress(100);
            setTimeout(() => {
                setDownloadUrl(docxUrl);
                setIsProcessing(false);
            }, 300);

        } catch (error) {
            console.error("Error converting PDF to Word:", error);
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
                <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4 tracking-tight">PDF to Word</h1>
                <p className="text-xl text-text-muted font-body max-w-2xl mx-auto">
                    Convert your PDF files to editable Word documents seamlessly. preserving layout and formatting.
                </p>
            </div>

            <FileUploadZone
                onFilesSelected={(f) => { setFiles(f); setDownloadUrl(null); }}
                allowMultiple={false}
                maxFiles={1}
                message="Drag & drop a PDF to convert"
            />

            <AnimatePresence mode="wait">
                {files.length === 1 && !isProcessing && !downloadUrl && (
                    <motion.div
                        key="convert-button"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="mt-12"
                    >
                        <button
                            onClick={handleConvert}
                            className="group relative flex items-center justify-center space-x-3 bg-secondary text-[#0A0A0F] font-bold text-lg px-8 py-4 rounded-full shadow-[0_0_20px_rgba(255,179,71,0.4)] hover:shadow-[0_0_35px_rgba(255,179,71,0.6)] hover:scale-105 transition-all duration-300"
                        >
                            <FileText className="w-5 h-5" />
                            <span>Convert to Word</span>
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
                        <Loader2 className="w-8 h-8 text-secondary animate-spin mb-4" />
                        <h3 className="text-white font-heading font-medium mb-4">Converting using Neural Engine...</h3>

                        <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-cardBorder relative">
                            <motion.div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-secondary/50 via-secondary to-secondary shadow-[0_0_10px_rgba(255,179,71,0.8)] rounded-full"
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
                        <div className="glass-card p-8 rounded-2xl flex flex-col items-center border-secondary/30 bg-secondary/5 mb-6">
                            <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center text-secondary mb-4 shadow-[0_0_15px_rgba(255,179,71,0.3)]">
                                <Download size={32} />
                            </div>
                            <h3 className="text-2xl font-heading font-bold text-white mb-2">Conversion Complete!</h3>
                            <p className="text-text-muted mb-6">Your Word document is ready to download.</p>

                            <a
                                href={downloadUrl}
                                download={`${files[0].name.replace('.pdf', '')}.docx`}
                                className="group relative flex items-center space-x-2 bg-white text-black font-bold px-8 py-4 rounded-full hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] hover:scale-105 transition-all duration-300"
                            >
                                <span>Download Word Document</span>
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
