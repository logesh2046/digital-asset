import { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    LayoutDashboard,
    Upload,
    LogOut,
    Menu,
    X,
    Database,
    Shield,
    ClipboardPaste
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../ui/dialog';

import { useMediaQuery } from '../../../hooks/use-media-query';

export function DashboardLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 1024px)");

    // Share Asset Paste Dialog State
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [shareInput, setShareInput] = useState('');

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        navigate('/login');
    };

    const navItems = [
        { label: 'My Assets', path: '/home', icon: LayoutDashboard },
        { label: 'Upload', path: '/upload', icon: Upload },
    ];

    if (user?.role === 'admin') {
        navItems.push({ label: 'Admin Panel', path: '/admin', icon: Shield });
    }

    const handlePasteShare = () => {
        const trimmed = shareInput.trim();
        if (!trimmed) {
            toast.error('Please paste a share link or token');
            return;
        }
        // Extract token from full URL or raw token
        const match = trimmed.match(/\/share\/([a-f0-9]+)$/i);
        const token = match ? match[1] : trimmed;
        setShareDialogOpen(false);
        setShareInput('');
        setIsSidebarOpen(false);
        navigate(`/share/${token}`);
    };

    return (
        <>
            <div className="min-h-screen bg-slate-50 flex">
                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <motion.aside
                    initial={false}
                    animate={{
                        x: isDesktop ? 0 : (isSidebarOpen ? 0 : '-100%'),
                        opacity: isDesktop ? 1 : (isSidebarOpen ? 1 : 0)
                    }}
                    className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-xl
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:opacity-100
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
                >
                    <div className="h-full flex flex-col">
                        {/* Logo */}
                        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
                                <Database className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    DAMS
                                </h1>
                                <p className="text-[10px] text-gray-500 font-medium">SECURE VAULT</p>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive
                                                ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 font-medium shadow-sm border border-purple-100'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }
                  `}
                                    >
                                        <item.icon className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                                        {item.label}
                                    </Link>
                                );
                            })}

                            {/* Share Asset - Paste Button */}
                            <button
                                onClick={() => { setShareDialogOpen(true); setIsSidebarOpen(false); }}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full text-left"
                            >
                                <ClipboardPaste className="w-5 h-5 text-gray-400" />
                                Share Asset
                            </button>
                        </nav>

                        {/* User Profile & Logout */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-3 mb-4 px-2">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-purple-700 font-bold border border-purple-200">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </motion.aside>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-h-screen lg:w-[calc(100%-16rem)]">
                    {/* Mobile Header */}
                    <header className="lg:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
                                <Database className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-gray-900">DAMS</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </Button>
                    </header>

                    {/* Page Content */}
                    <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
                        <Outlet />
                    </main>
                </div>
            </div>

            {/* Share Asset Paste Dialog */}
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl">
                    <DialogHeader className="flex flex-col items-center gap-4 py-4">
                        <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center text-purple-500 mb-2">
                            <ClipboardPaste className="w-8 h-8" />
                        </div>
                        <DialogTitle className="text-xl text-center">Paste Share Asset</DialogTitle>
                        <p className="text-center text-gray-500 text-sm">
                            Paste the share link or token you received to access the shared asset.
                        </p>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 py-2 px-4">
                        <Input
                            id="share-paste-input"
                            type="text"
                            placeholder="Paste share link or token here…"
                            value={shareInput}
                            onChange={(e) => setShareInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePasteShare()}
                            className="text-sm h-12 bg-gray-50 border-gray-200 rounded-xl focus-visible:ring-purple-500"
                            autoFocus
                        />
                    </div>

                    <DialogFooter className="sm:justify-center flex-col gap-2 w-full px-4 pb-4">
                        <Button
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl h-12 text-md font-medium"
                            onClick={handlePasteShare}
                            disabled={!shareInput.trim()}
                        >
                            Open Shared Asset
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
