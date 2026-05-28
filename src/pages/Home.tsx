import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    FilePlus2,
    Scissors,
    FileText,
    Search,
    RotateCw,
    Trash2,
    Image,
    Code,
    FileSpreadsheet,
    Presentation,
    Images,
    Lock,
    Unlock,
    FileDown,
    Hash,
    EyeOff,
    Crop,
    PenTool,
    Shield,
    Sparkles,
    AlignLeft
} from 'lucide-react';

interface Tool {
    path: string;
    name: string;
    description: string;
    icon: React.ComponentType<any>;
    category: 'organize' | 'convert-to' | 'convert-from' | 'edit-secure';
    color: string;
}

const allTools: Tool[] = [
    // Organize Category
    {
        path: '/merge',
        name: 'Merge PDFs',
        description: 'Combine multiple PDF files into one complete document easily.',
        icon: FilePlus2,
        category: 'organize',
        color: 'from-[#00F5FF]/15 to-[#00F5FF]/5 border-[#00F5FF]/20 text-[#00F5FF]'
    },
    {
        path: '/split',
        name: 'Split PDF',
        description: 'Extract specific pages from your PDF file instantly.',
        icon: Scissors,
        category: 'organize',
        color: 'from-pink-500/15 to-pink-500/5 border-pink-500/20 text-pink-400'
    },
    {
        path: '/rotate',
        name: 'Rotate PDF',
        description: 'Rotate individual pages of your PDF 90, 180, or 270 degrees.',
        icon: RotateCw,
        category: 'organize',
        color: 'from-[#FFB347]/15 to-[#FFB347]/5 border-[#FFB347]/20 text-[#FFB347]'
    },
    {
        path: '/delete-pages',
        name: 'Delete Pages',
        description: 'Select pages visually to delete them and restructure your PDF document.',
        icon: Trash2,
        category: 'organize',
        color: 'from-red-500/15 to-red-500/5 border-red-500/20 text-red-400'
    },

    // Convert to PDF
    {
        path: '/jpg-to-pdf',
        name: 'JPG to PDF',
        description: 'Convert JPG, PNG, and standard images into a unified PDF accurately.',
        icon: Image,
        category: 'convert-to',
        color: 'from-[#00F5FF]/15 to-[#00F5FF]/5 border-[#00F5FF]/20 text-[#00F5FF]'
    },
    {
        path: '/tool-placeholder?tool=word-to-pdf',
        name: 'Word to PDF',
        description: 'Transform DOCX and Word documents into crisp PDF format.',
        icon: FileText,
        category: 'convert-to',
        color: 'from-blue-500/15 to-blue-500/5 border-blue-500/20 text-blue-400'
    },
    {
        path: '/tool-placeholder?tool=html-to-pdf',
        name: 'HTML to PDF',
        description: 'Convert web pages, raw HTML inputs, or URLs directly into PDFs.',
        icon: Code,
        category: 'convert-to',
        color: 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/20 text-emerald-400'
    },
    {
        path: '/tool-placeholder?tool=excel-to-pdf',
        name: 'Excel to PDF',
        description: 'Export Excel tables, grids, and sheets to clean PDF layouts.',
        icon: FileSpreadsheet,
        category: 'convert-to',
        color: 'from-green-500/15 to-green-500/5 border-green-500/20 text-green-400'
    },
    {
        path: '/tool-placeholder?tool=ppt-to-pdf',
        name: 'PowerPoint to PDF',
        description: 'Convert slideshows and PPT presentations into structured PDFs.',
        icon: Presentation,
        category: 'convert-to',
        color: 'from-orange-500/15 to-orange-500/5 border-orange-500/20 text-orange-400'
    },
    // Convert from PDF
    {
        path: '/pdf-to-word',
        name: 'PDF to Word',
        description: 'Convert PDF files to editable Word documents, preserving structure.',
        icon: FileText,
        category: 'convert-from',
        color: 'from-[#FFB347]/15 to-[#FFB347]/5 border-[#FFB347]/20 text-[#FFB347]'
    },
    {
        path: '/pdf-to-jpg',
        name: 'PDF to JPG',
        description: 'Extract pages of a PDF and convert them into standard JPEG images.',
        icon: Images,
        category: 'convert-from',
        color: 'from-[#00F5FF]/15 to-[#00F5FF]/5 border-[#00F5FF]/20 text-[#00F5FF]'
    },
    {
        path: '/tool-placeholder?tool=pdf-to-excel',
        name: 'PDF to Excel',
        description: 'Extract tables from PDF into structured editable Excel worksheets.',
        icon: FileSpreadsheet,
        category: 'convert-from',
        color: 'from-green-500/15 to-green-500/5 border-green-500/20 text-green-400'
    },
    {
        path: '/tool-placeholder?tool=pdf-to-ppt',
        name: 'PDF to PowerPoint',
        description: 'Convert your PDF sheets into editable slides.',
        icon: Presentation,
        category: 'convert-from',
        color: 'from-orange-500/15 to-orange-500/5 border-orange-500/20 text-orange-400'
    },
    {
        path: '/tool-placeholder?tool=pdf-to-text',
        name: 'PDF to Text',
        description: 'Extract pure searchable text content from PDF files.',
        icon: AlignLeft,
        category: 'convert-from',
        color: 'from-gray-500/15 to-gray-500/5 border-gray-500/20 text-gray-300'
    },
    // Edit & Secure
    {
        path: '/watermark',
        name: 'Watermark PDF',
        description: 'Overlay customized text watermarks onto all PDF pages securely.',
        icon: Sparkles,
        category: 'edit-secure',
        color: 'from-[#00F5FF]/15 to-[#00F5FF]/5 border-[#00F5FF]/20 text-[#00F5FF]'
    },
    {
        path: '/sign',
        name: 'Sign PDF',
        description: 'Draw your signature and position it visually onto PDF pages.',
        icon: PenTool,
        category: 'edit-secure',
        color: 'from-pink-500/15 to-pink-500/5 border-pink-500/20 text-pink-400'
    },
    {
        path: '/protect',
        name: 'Protect PDF',
        description: 'Encrypt your PDF documents with custom User and Owner passwords.',
        icon: Lock,
        category: 'edit-secure',
        color: 'from-red-500/15 to-red-500/5 border-red-500/20 text-red-400'
    },
    {
        path: '/compress',
        name: 'Compress PDF',
        description: 'Optimize stream resolution and compression to reduce PDF file size.',
        icon: FileDown,
        category: 'edit-secure',
        color: 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/20 text-emerald-400'
    },
    {
        path: '/tool-placeholder?tool=unlock',
        name: 'Unlock PDF',
        description: 'Remove password protection, decryption, or editing restrictions.',
        icon: Unlock,
        category: 'edit-secure',
        color: 'from-green-500/15 to-green-500/5 border-green-500/20 text-green-400'
    },
    {
        path: '/tool-placeholder?tool=page-numbers',
        name: 'Page Numbers',
        description: 'Number your PDF pages with customizable positioning and font layout.',
        icon: Hash,
        category: 'edit-secure',
        color: 'from-indigo-500/15 to-indigo-500/5 border-indigo-500/20 text-indigo-400'
    },
    {
        path: '/tool-placeholder?tool=redact',
        name: 'Redact PDF',
        description: 'Block out private texts, graphics, or metadata permanently.',
        icon: EyeOff,
        category: 'edit-secure',
        color: 'from-zinc-500/15 to-zinc-500/5 border-zinc-500/20 text-zinc-400'
    },
    {
        path: '/tool-placeholder?tool=crop',
        name: 'Crop PDF',
        description: 'Trim margins or select precise canvas regions to crop.',
        icon: Crop,
        category: 'edit-secure',
        color: 'from-teal-500/15 to-teal-500/5 border-teal-500/20 text-teal-400'
    }
];

const categories = [
    {
        id: 'organize',
        name: 'Organize PDF',
        description: 'Combine, divide, rotate, and manage PDF pages.'
    },
    {
        id: 'convert-to',
        name: 'Convert to PDF',
        description: 'Import images and standard office documents into PDF format.'
    },
    {
        id: 'convert-from',
        name: 'Convert from PDF',
        description: 'Export PDF documents into editable Word sheets and images.'
    },
    {
        id: 'edit-secure',
        name: 'Edit & Security',
        description: 'Add watermarks, draw digital signatures, encrypt, and compress PDFs.'
    }
];

export default function Home() {
    const [searchQuery, setSearchQuery] = useState('');

    const isSearching = searchQuery.trim() !== '';

    // Global filter when searching
    const searchedTools = allTools.filter(tool =>
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center">
            
            {/* Elegant Hero Section */}
            <section className="w-full flex flex-col items-center text-center mt-6 mb-16">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col items-center max-w-3xl"
                >
                    <h1 className="text-4xl md:text-6xl font-extrabold font-heading text-white mb-6 leading-tight tracking-tight">
                        PDF <span className="text-gradient">craft.</span> Simplified.
                    </h1>

                    <p className="text-base md:text-lg text-text-muted font-body max-w-xl mb-8 leading-relaxed">
                        A beautiful, clean, and highly professional toolkit designed to manage and transform PDF files with absolute precision.
                    </p>

                    {/* Integrated Sleek Search Input */}
                    <div className="relative w-full max-w-md bg-card/40 border border-cardBorder focus-within:border-primary/50 focus-within:shadow-[0_0_15px_rgba(0,245,255,0.15)] rounded-full transition-all duration-300">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                            <Search className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search tools (e.g. merge, rotate, sign, protect)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-transparent text-sm text-white rounded-full placeholder-text-muted/60 focus:outline-none font-medium"
                        />
                    </div>
                </motion.div>
            </section>

            {/* Main Content Area */}
            <section className="w-full pb-20 max-w-6xl">
                <AnimatePresence mode="wait">
                    {!isSearching ? (
                        /* Segregated Category Blocks */
                        <motion.div
                            key="segregated-categories"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-16"
                        >
                            {categories.map((cat) => {
                                const catTools = allTools.filter(t => t.category === cat.id);
                                return (
                                    <div key={cat.id} className="flex flex-col space-y-6">
                                        
                                        {/* Section Title & Subheading */}
                                        <div className="border-b border-cardBorder/40 pb-4">
                                            <h2 className="text-2xl font-bold font-heading text-white tracking-wide">
                                                {cat.name}
                                            </h2>
                                            <p className="text-xs text-text-muted font-body mt-1">
                                                {cat.description}
                                            </p>
                                        </div>

                                        {/* Grid belonging only to this category */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {catTools.map((tool) => (
                                                <Link
                                                    key={tool.name}
                                                    to={tool.path}
                                                    className="group relative flex flex-col justify-between glass-card rounded-2xl p-6 min-h-[195px] h-full border border-cardBorder hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,245,255,0.08)] cursor-pointer pb-6"
                                                >
                                                    <div>
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${tool.color} border shadow-inner`}>
                                                                <tool.icon className="w-5 h-5" />
                                                            </div>
                                                        </div>

                                                        <h3 className="text-base font-bold text-white mb-2 font-heading tracking-wide group-hover:text-primary transition-colors">
                                                            {tool.name}
                                                        </h3>
                                                        <p className="text-xs text-text-muted font-body leading-relaxed line-clamp-2">
                                                            {tool.description}
                                                        </p>
                                                    </div>

                                                    <div className="mt-4 flex justify-end">
                                                        <div
                                                            className="inline-flex items-center text-[11px] font-semibold text-white group-hover:text-primary transition-colors space-x-1"
                                                        >
                                                            <span>Open Tool</span>
                                                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    ) : (
                        /* Flat Search Results Grid */
                        <motion.div
                            key="search-results"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="flex flex-col space-y-6"
                        >
                            <div className="border-b border-cardBorder/40 pb-4">
                                <h2 className="text-2xl font-bold font-heading text-white tracking-wide">
                                    Search Results
                                </h2>
                                <p className="text-xs text-text-muted font-body mt-1">
                                    Found {searchedTools.length} tool{searchedTools.length !== 1 ? 's' : ''} matching "{searchQuery}"
                                </p>
                            </div>

                            {searchedTools.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {searchedTools.map((tool) => (
                                        <Link
                                            key={tool.name}
                                            to={tool.path}
                                            className="group relative flex flex-col justify-between glass-card rounded-2xl p-6 min-h-[195px] h-full border border-cardBorder hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,245,255,0.08)] cursor-pointer pb-6"
                                        >
                                            <div>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${tool.color} border shadow-inner`}>
                                                        <tool.icon className="w-5 h-5" />
                                                    </div>
                                                </div>

                                                <h3 className="text-base font-bold text-white mb-2 font-heading tracking-wide group-hover:text-primary transition-colors">
                                                    {tool.name}
                                                </h3>
                                                <p className="text-xs text-text-muted font-body leading-relaxed line-clamp-2">
                                                    {tool.description}
                                                </p>
                                            </div>

                                            <div className="mt-4 flex justify-end">
                                                <div
                                                    className="inline-flex items-center text-[11px] font-semibold text-white group-hover:text-primary transition-colors space-x-1"
                                                >
                                                    <span>Open Tool</span>
                                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 flex flex-col items-center">
                                    <Shield className="w-12 h-12 text-text-muted mb-4 stroke-1" />
                                    <p className="text-text-muted text-sm font-body">No matching tools found. Try searching for other terms.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

        </div>
    );
}
