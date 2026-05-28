import { Zap } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-[#050508] border-t border-cardBorder py-12 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
                <div className="flex items-center space-x-2 mb-4 group cursor-default">
                    <Zap className="w-6 h-6 text-primary opacity-80 group-hover:opacity-100 transition-opacity" />
                    <span className="font-heading font-bold text-xl text-white tracking-wide opacity-90">
                        PDFcraft
                    </span>
                </div>
                <p className="text-text-muted font-body text-sm mb-6 text-center">
                    Built for speed. Designed for humans.
                </p>
                <p className="text-text-muted/60 text-xs font-body">
                    &copy; {new Date().getFullYear()} PDFcraft. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
