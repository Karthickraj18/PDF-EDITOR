import { Link, useLocation } from 'react-router-dom';
import { Zap } from 'lucide-react';
import clsx from 'clsx';

const navLinks = [
    { name: 'Merge', path: '/merge' },
    { name: 'Split', path: '/split' },
    { name: 'PDF to Word', path: '/pdf-to-word' },
    { name: 'JPG to PDF', path: '/jpg-to-pdf' },
    { name: 'Sign PDF', path: '/sign' },
    { name: 'Protect', path: '/protect' },
];

export default function Navbar() {
    const location = useLocation();

    return (
        <nav className="fixed top-0 w-full z-50 glass-card bg-background/80 border-b border-cardBorder">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <Link to="/" className="flex items-center space-x-2 group">
                        <Zap className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                        <span className="font-heading font-bold text-2xl text-white tracking-wide">
                            PDF<span className="text-gradient">craft</span>
                        </span>
                    </Link>

                    <div className="hidden md:flex space-x-8">
                        {navLinks.map((link) => {
                            const isActive = location.pathname === link.path;
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={clsx(
                                        "relative font-body text-sm font-medium transition-colors hover:text-white",
                                        isActive ? "text-white" : "text-text-muted"
                                    )}
                                >
                                    {link.name}
                                    {isActive && (
                                        <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-primary shadow-[0_0_8px_rgba(0,245,255,0.8)] rounded-full" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="md:hidden flex items-center">
                        {/* Mobile menu could go here, keeping simple for now */}
                    </div>
                </div>
            </div>
        </nav>
    );
}
