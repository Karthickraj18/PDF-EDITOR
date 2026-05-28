import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PDFDocument } from 'pdf-lib';
import { Download, Loader2, PenTool, Check, Trash2 } from 'lucide-react';
import FileUploadZone from '../components/ui/FileUploadZone';

export default function SignPDF() {
    const [files, setFiles] = useState<File[]>([]);
    const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    // Signature Modes and Customizations
    const [sigMode, setSigMode] = useState<'draw' | 'type'>('draw');
    const [typedName, setTypedName] = useState('');
    const [sigColor, setSigColor] = useState<'white' | 'black' | 'blue'>('white');
    const [selectedFont, setSelectedFont] = useState<'Dancing Script' | 'Great Vibes' | 'Caveat'>('Dancing Script');

    // Interactive placement states
    const [numPages, setNumPages] = useState(0);
    const [selectedPage, setSelectedPage] = useState(0);
    const [placement, setPlacement] = useState<{ x: number; y: number } | null>(null);
    const [canvasWidth, setCanvasWidth] = useState(0);
    const [canvasHeight, setCanvasHeight] = useState(0);

    const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const pdfPageRef = useRef<any>(null);

    // Dynamically load Google Cursive Fonts for signing
    useEffect(() => {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Dancing+Script:wght@700&family=Great+Vibes&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => {
            document.head.removeChild(link);
        };
    }, []);

    // Drawing Signature Canvas Logic
    useEffect(() => {
        if (sigMode !== 'draw' || !sigCanvasRef.current || signatureUrl) return;
        const canvas = sigCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Setup canvas high-dpi resolution or standard resolution
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Set stroke color
            if (sigColor === 'white') {
                ctx.strokeStyle = '#FFFFFF';
            } else if (sigColor === 'black') {
                ctx.strokeStyle = '#000000';
            } else {
                ctx.strokeStyle = '#1E40AF'; // Royal Blue
            }
            
            ctx.lineWidth = 3.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    }, [signatureUrl, sigMode, sigColor]);

    // Live Typed Signature Canvas Rendering
    useEffect(() => {
        if (sigMode !== 'type' || !sigCanvasRef.current || signatureUrl) return;
        const canvas = sigCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            let color = '#FFFFFF';
            if (sigColor === 'black') color = '#000000';
            else if (sigColor === 'blue') color = '#1E40AF';
            
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            let font = 'Dancing Script';
            if (selectedFont === 'Great Vibes') font = 'Great Vibes';
            else if (selectedFont === 'Caveat') font = 'Caveat';
            
            ctx.font = `italic 38px '${font}', cursive`;
            ctx.fillText(typedName || 'Your Name', canvas.width / 2, canvas.height / 2);
        }
    }, [typedName, selectedFont, sigColor, sigMode, signatureUrl]);

    // Mouse drawing events
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (sigMode !== 'draw') return;
        const canvas = sigCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            const rect = canvas.getBoundingClientRect();
            ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
            setIsDrawing(true);
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || sigMode !== 'draw') return;
        const canvas = sigCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const rect = canvas.getBoundingClientRect();
            ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
            ctx.stroke();
        }
    };

    // Touch drawing events
    const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (sigMode !== 'draw') return;
        const canvas = sigCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx && e.touches[0]) {
            e.preventDefault();
            ctx.beginPath();
            const rect = canvas.getBoundingClientRect();
            ctx.moveTo(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
            setIsDrawing(true);
        }
    };

    const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing || sigMode !== 'draw') return;
        const canvas = sigCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx && e.touches[0]) {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            ctx.lineTo(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearSignature = () => {
        const canvas = sigCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        setSignatureUrl(null);
        setPlacement(null);
    };

    const saveSignature = () => {
        const canvas = sigCanvasRef.current;
        if (!canvas) return;
        
        // Ensure there's content before saving
        if (sigMode === 'type' && !typedName.trim()) return;

        const dataUrl = canvas.toDataURL('image/png');
        setSignatureUrl(dataUrl);
    };

    // Load PDF Page for Placement Preview
    useEffect(() => {
        if (files.length === 0 || !signatureUrl) {
            setNumPages(0);
            setSelectedPage(0);
            setPlacement(null);
            return;
        }

        const renderPlacementPreview = async () => {
            try {
                // @ts-ignore
                const pdfjs = await import(/* @vite-ignore */ 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.min.mjs');
                pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.mjs';

                const file = files[0];
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
                setNumPages(pdf.numPages);

                const page = await pdf.getPage(selectedPage + 1);
                pdfPageRef.current = page;

                const canvas = pdfCanvasRef.current;
                if (canvas) {
                    const context = canvas.getContext('2d');
                    const viewport = page.getViewport({ scale: 0.8 }); // balanced preview scale
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    setCanvasWidth(viewport.width);
                    setCanvasHeight(viewport.height);

                    if (context) {
                        await page.render({
                            canvasContext: context,
                            viewport: viewport
                        }).promise;
                    }
                }

            } catch (error) {
                console.error("Error loading PDF preview for signature placement:", error);
            }
        };

        renderPlacementPreview();
    }, [files, selectedPage, signatureUrl]);

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = pdfCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        setPlacement({ x: clickX, y: clickY });
    };

    const handleSign = async () => {
        if (files.length === 0 || !signatureUrl || !placement) return;

        setIsProcessing(true);
        setProgress(20);
        setDownloadUrl(null);

        try {
            const file = files[0];
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();
            const page = pages[selectedPage];
            const { width: pageWidth, height: pageHeight } = page.getSize();

            setProgress(40);

            // Fetch signature base64 bytes
            const base64Bytes = signatureUrl.split(',')[1];
            const rawBytes = Uint8Array.from(atob(base64Bytes), c => c.charCodeAt(0));

            // Embed PNG signature
            const embeddedSig = await pdfDoc.embedPng(rawBytes);

            setProgress(70);

            // Translate clicked canvas percentage to PDF coordinates
            // Browser click y goes top-to-bottom, PDF coordinate y goes bottom-to-top
            const percentX = placement.x / canvasWidth;
            const percentY = placement.y / canvasHeight;

            const pdfX = percentX * pageWidth;
            // Place signature origin slightly offset so it is centered on the click
            const sigWidth = 120;
            const sigHeight = 60;
            const pdfY = (1.0 - percentY) * pageHeight - sigHeight / 2;

            page.drawImage(embeddedSig, {
                x: pdfX - sigWidth / 2,
                y: pdfY,
                width: sigWidth,
                height: sigHeight
            });

            setProgress(90);

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            setProgress(100);
            setTimeout(() => {
                setDownloadUrl(url);
                setIsProcessing(false);
            }, 300);

        } catch (error) {
            console.error("Error embedding signature:", error);
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
                <h1 className="text-4xl font-heading font-extrabold text-white mb-3">Sign PDF Document</h1>
                <p className="text-base text-text-muted font-body max-w-2xl mx-auto leading-relaxed">
                    Draw or type your signature and visually position it onto your PDF document.
                </p>
            </div>

            <FileUploadZone
                onFilesSelected={(f) => { setFiles(f); setDownloadUrl(null); }}
                allowMultiple={false}
                maxFiles={1}
                message="Drag & drop a PDF file to sign"
            />

            <AnimatePresence mode="wait">
                {files.length === 1 && !isProcessing && !downloadUrl && (
                    <motion.div
                        key="signature-workspace"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full mt-10 grid grid-cols-1 md:grid-cols-12 gap-8"
                    >
                        {/* Sidebar: Signature Canvas Drawer & Types */}
                        <div className="md:col-span-5 flex flex-col space-y-6">
                            <div className="glass-card p-6 rounded-3xl border border-cardBorder/40 bg-card/25 shadow-xl">
                                <h3 className="text-white font-heading font-bold text-base mb-4 flex items-center space-x-2">
                                    <PenTool className="w-4 h-4 text-primary" />
                                    <span>Signature Creator</span>
                                </h3>

                                {/* Signature Tab Selector */}
                                <div className="flex bg-background/50 p-1 rounded-xl border border-cardBorder/40 mb-6">
                                    <button
                                        onClick={() => { setSigMode('draw'); setSignatureUrl(null); setPlacement(null); }}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${sigMode === 'draw' ? 'bg-primary text-[#0A0A0F]' : 'text-text-muted hover:text-white'}`}
                                    >
                                        Draw
                                    </button>
                                    <button
                                        onClick={() => { setSigMode('type'); setSignatureUrl(null); setPlacement(null); }}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${sigMode === 'type' ? 'bg-primary text-[#0A0A0F]' : 'text-text-muted hover:text-white'}`}
                                    >
                                        Type
                                    </button>
                                </div>

                                {/* Color Palette Selector */}
                                <div className="mb-6">
                                    <label className="text-xs text-text-muted font-bold block mb-2">Signature Stroke Color</label>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => { setSigColor('white'); setSignatureUrl(null); }}
                                            className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${sigColor === 'white' ? 'bg-white/10 border-white text-white font-bold' : 'bg-transparent border-cardBorder text-text-muted hover:text-white'}`}
                                        >
                                            White
                                        </button>
                                        <button
                                            onClick={() => { setSigColor('black'); setSignatureUrl(null); }}
                                            className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${sigColor === 'black' ? 'bg-white text-black border-white font-bold' : 'bg-transparent border-cardBorder text-text-muted hover:text-white'}`}
                                        >
                                            Black
                                        </button>
                                        <button
                                            onClick={() => { setSigColor('blue'); setSignatureUrl(null); }}
                                            className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${sigColor === 'blue' ? 'bg-[#1E40AF] text-white border-[#3B82F6] font-bold' : 'bg-transparent border-cardBorder text-text-muted hover:text-white'}`}
                                        >
                                            Royal Blue
                                        </button>
                                    </div>
                                </div>

                                {/* Active Mode Workspace */}
                                {!signatureUrl ? (
                                    <div className="flex flex-col space-y-4">
                                        {sigMode === 'draw' ? (
                                            /* Draw mode canvas */
                                            <canvas
                                                ref={sigCanvasRef}
                                                width={300}
                                                height={150}
                                                onMouseDown={startDrawing}
                                                onMouseMove={draw}
                                                onMouseUp={stopDrawing}
                                                onMouseLeave={stopDrawing}
                                                onTouchStart={startDrawingTouch}
                                                onTouchMove={drawTouch}
                                                onTouchEnd={stopDrawing}
                                                className={`w-full rounded-2xl cursor-crosshair shadow-inner border transition-colors duration-300 ${sigColor === 'white' ? 'bg-background/60 border-cardBorder' : 'bg-white border-white/20'}`}
                                            />
                                        ) : (
                                            /* Type mode workspace inputs */
                                            <div className="flex flex-col space-y-4">
                                                <div>
                                                    <label className="text-xs text-text-muted font-bold block mb-2">Type Your Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Enter signature name..."
                                                        value={typedName}
                                                        onChange={(e) => { setTypedName(e.target.value); setSignatureUrl(null); }}
                                                        className="w-full bg-background/60 border border-cardBorder focus:border-primary/50 text-white rounded-xl px-4 py-2.5 text-sm placeholder-text-muted/40 focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-text-muted font-bold block mb-2">Choose Font Style</label>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {(['Dancing Script', 'Great Vibes', 'Caveat'] as const).map((font) => (
                                                            <button
                                                                key={font}
                                                                onClick={() => { setSelectedFont(font); setSignatureUrl(null); }}
                                                                className={`w-full p-3 rounded-xl border text-left flex justify-between items-center transition-all ${selectedFont === font ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-background/40 border-cardBorder text-white hover:border-cardBorder/80'}`}
                                                            >
                                                                <span style={{ fontFamily: `'${font}', cursive` }} className="text-lg">
                                                                    {typedName || 'Your Name'}
                                                                </span>
                                                                <span className="text-[10px] text-text-muted font-mono font-bold uppercase">{font.split(' ')[0]}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                {/* Hidden signature creation canvas for Type mode */}
                                                <canvas
                                                    ref={sigCanvasRef}
                                                    width={300}
                                                    height={150}
                                                    className="hidden"
                                                />
                                            </div>
                                        )}

                                        <div className="flex space-x-3 mt-4">
                                            {sigMode === 'draw' ? (
                                                <>
                                                    <button
                                                        onClick={clearSignature}
                                                        className="flex-1 bg-white/5 border border-cardBorder hover:bg-white/10 text-white py-2 rounded-xl text-xs font-bold transition-all"
                                                    >
                                                        Clear
                                                    </button>
                                                    <button
                                                        onClick={saveSignature}
                                                        className="flex-1 bg-primary text-[#0A0A0F] hover:shadow-[0_0_15px_rgba(0,245,255,0.3)] py-2 rounded-xl text-xs font-extrabold transition-all"
                                                    >
                                                        Use Signature
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={saveSignature}
                                                    disabled={!typedName.trim()}
                                                    className="w-full bg-primary text-[#0A0A0F] hover:shadow-[0_0_15px_rgba(0,245,255,0.3)] py-2.5 rounded-xl text-xs font-extrabold transition-all disabled:opacity-30 disabled:pointer-events-none"
                                                >
                                                    Confirm Signature
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    /* Signature preview once confirmed */
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className={`w-full border p-4 rounded-2xl flex items-center justify-center transition-colors duration-300 ${sigColor === 'white' ? 'bg-background/40 border-cardBorder' : 'bg-white border-white/20'}`}>
                                            <img src={signatureUrl} alt="signature" className="max-h-20 object-contain" />
                                        </div>
                                        <button
                                            onClick={clearSignature}
                                            className="inline-flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors text-xs font-bold"
                                        >
                                            <Trash2 className="w-4.5 h-4.5" />
                                            <span>Create New Signature</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Sign Action Container */}
                            {signatureUrl && (
                                <div className="glass-card p-6 rounded-3xl border border-cardBorder/40 bg-card/25 shadow-xl flex flex-col space-y-4">
                                    <h3 className="text-white font-heading font-bold text-sm">Placement Instructions</h3>
                                    <p className="text-xs text-text-muted leading-relaxed">
                                        Select the page from the preview, then click anywhere on the page to position your signature.
                                    </p>
                                    <button
                                        onClick={handleSign}
                                        disabled={!placement}
                                        className="group relative flex items-center justify-center space-x-3 bg-primary text-[#0A0A0F] font-extrabold text-sm py-3.5 rounded-full shadow-[0_0_20px_rgba(0,245,255,0.4)] hover:shadow-[0_0_35px_rgba(0,245,255,0.6)] disabled:opacity-30 disabled:pointer-events-none transition-all duration-300"
                                    >
                                        <PenTool className="w-4 h-4" />
                                        <span>Sign Document</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Main Preview: Interactive Visual PDF Canvas */}
                        <div className="md:col-span-7 flex flex-col items-center">
                            {signatureUrl ? (
                                <div className="w-full flex flex-col items-center">
                                    {/* Page Toggle Navigation */}
                                    <div className="flex items-center space-x-4 mb-4">
                                        <button
                                            onClick={() => { setSelectedPage(p => Math.max(0, p - 1)); setPlacement(null); }}
                                            disabled={selectedPage === 0}
                                            className="px-3 py-1.5 rounded-lg bg-card border border-cardBorder text-xs text-text-muted hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-opacity"
                                        >
                                            Prev Page
                                        </button>
                                        <span className="text-xs text-white font-semibold">Page {selectedPage + 1} of {numPages}</span>
                                        <button
                                            onClick={() => { setSelectedPage(p => Math.min(numPages - 1, p + 1)); setPlacement(null); }}
                                            disabled={selectedPage === numPages - 1}
                                            className="px-3 py-1.5 rounded-lg bg-card border border-cardBorder text-xs text-text-muted hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-opacity"
                                        >
                                            Next Page
                                        </button>
                                    </div>

                                    {/* Clickable PDF Render Viewport */}
                                    <div className="relative border border-cardBorder bg-background/50 rounded-2xl overflow-hidden shadow-2xl p-2 cursor-pointer">
                                        <canvas
                                            ref={pdfCanvasRef}
                                            onClick={handleCanvasClick}
                                            className="max-w-full rounded-lg"
                                        />

                                        {/* Visual Signature Overlay Box */}
                                        {placement && (
                                            <div
                                                className={`absolute border-2 border-dashed rounded pointer-events-none flex items-center justify-center ${sigColor === 'white' ? 'border-white bg-white/10' : 'border-black bg-black/10'}`}
                                                style={{
                                                    left: placement.x - 60 + 8, // 8px padding adjustment
                                                    top: placement.y - 30 + 8,
                                                    width: 120,
                                                    height: 60,
                                                }}
                                            >
                                                <img src={signatureUrl} alt="sig-overlay" className="max-h-full max-w-full object-contain opacity-70" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full flex items-center justify-center aspect-[4/3] bg-card/10 border border-dashed border-cardBorder rounded-3xl p-12 text-center text-text-muted">
                                    <div className="flex flex-col items-center">
                                        <PenTool className="w-12 h-12 text-text-muted/60 mb-3 stroke-1" />
                                        <p className="text-sm">Create and confirm your signature on the left sidebar to enable placement preview.</p>
                                    </div>
                                </div>
                            )}
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
                        <h3 className="text-white font-heading font-medium mb-4">Embedding signature vector...</h3>

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
                            <h3 className="text-2xl font-heading font-bold text-white mb-2">Signed Successfully!</h3>
                            <p className="text-text-muted mb-6">Your visually signed PDF document is ready.</p>

                            <a
                                href={downloadUrl}
                                download={`${files[0].name.replace('.pdf', '')}-signed.pdf`}
                                className="group relative flex items-center space-x-2 bg-white text-black font-bold px-8 py-4 rounded-full hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] hover:scale-105 transition-all duration-300"
                            >
                                <span>Download PDF</span>
                                <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                            </a>
                        </div>

                        <button
                            onClick={() => { setDownloadUrl(null); setFiles([]); setSignatureUrl(null); setPlacement(null); setProgress(0); }}
                            className="text-text-muted hover:text-white transition-colors underline decoration-text-muted/50 underline-offset-4"
                        >
                            Sign another document
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
