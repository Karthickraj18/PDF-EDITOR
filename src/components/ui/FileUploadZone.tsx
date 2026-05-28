import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, File, X } from 'lucide-react';

interface FileUploadZoneProps {
    onFilesSelected: (files: File[]) => void;
    maxFiles?: number;
    accept?: Record<string, string[]>;
    message?: string;
    allowMultiple?: boolean;
}

export default function FileUploadZone({
    onFilesSelected,
    maxFiles = 0, // 0 means unlimited
    accept = { 'application/pdf': ['.pdf'] },
    message = "Click or drag PDFs to upload",
    allowMultiple = true
}: FileUploadZoneProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        let newFiles = [...selectedFiles, ...acceptedFiles];
        if (!allowMultiple) {
            newFiles = [acceptedFiles[0]];
        } else if (maxFiles > 0 && newFiles.length > maxFiles) {
            newFiles = newFiles.slice(0, maxFiles);
        }

        setSelectedFiles(newFiles);
        onFilesSelected(newFiles);
    }, [selectedFiles, maxFiles, onFilesSelected, allowMultiple]);

    const removeFile = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        const newFiles = [...selectedFiles];
        newFiles.splice(index, 1);
        setSelectedFiles(newFiles);
        onFilesSelected(newFiles);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        multiple: allowMultiple,
        maxFiles: maxFiles > 0 ? maxFiles : undefined
    });

    return (
        <div className="w-full flex flex-col items-center">
            <div
                {...getRootProps()}
                className={`w-full relative overflow-hidden rounded-2xl glass-card transition-all duration-300 cursor-pointer min-h-[300px] flex flex-col items-center justify-center p-8
          ${isDragActive
                        ? 'border-solid border-2 border-primary bg-primary/10 scale-[1.02] shadow-[0_0_30px_rgba(0,245,255,0.2)]'
                        : 'border-dashed border-2 border-primary/40 hover:border-primary animate-pulse-glow hover:animate-none'
                    }
        `}
            >
                <input {...getInputProps()} />

                {/* Soft Flash Animation on Drag */}
                <AnimatePresence>
                    {isDragActive && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-primary/20 pointer-events-none"
                        />
                    )}
                </AnimatePresence>

                <motion.div
                    className="flex flex-col items-center justify-center z-10"
                    animate={{ y: isDragActive ? -10 : 0 }}
                >
                    <div className={`p-4 rounded-full mb-4 transition-colors duration-300 ${isDragActive ? 'bg-primary text-black' : 'bg-card border border-cardBorder text-primary'}`}>
                        <UploadCloud size={40} />
                    </div>
                    <p className="text-xl font-heading font-medium text-white mb-2">
                        {isDragActive ? "Drop files here..." : message}
                    </p>
                    <p className="text-text-muted text-sm font-body">
                        {maxFiles > 0 ? `Up to ${maxFiles} file${maxFiles > 1 ? 's' : ''}` : 'Any number of files'}
                    </p>
                </motion.div>
            </div>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="w-full mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
                >
                    <AnimatePresence>
                        {selectedFiles.map((file, i) => (
                            <motion.div
                                key={`${file.name}-${i}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="relative glass-card p-4 rounded-xl flex items-center space-x-3 group"
                            >
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <File size={24} />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-white text-sm font-medium truncate">{file.name}</p>
                                    <p className="text-text-muted text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <button
                                    onClick={(e) => removeFile(e, i)}
                                    className="p-1 rounded-full hover:bg-red-500/20 text-text-muted hover:text-red-500 transition-colors"
                                    aria-label="Remove file"
                                >
                                    <X size={16} />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}
