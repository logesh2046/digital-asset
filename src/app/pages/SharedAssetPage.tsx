import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { File, Lock, Download, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';

export function SharedAssetPage() {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [asset, setAsset] = useState<any>(null);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetch(`http://localhost:5000/api/share?token=${token}`)
            .then((res) => {
                if (!res.ok) throw new Error('Invalid or expired link');
                return res.json();
            })
            .then((data) => {
                setAsset(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [token]);

    const handleAccess = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/share/access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, pin }),
            });

            if (res.ok) {
                const data = await res.json();
                // Redirect to actual file URL
                window.location.href = data.url;
            } else {
                toast.error('Incorrect PIN');
                setError('Incorrect PIN');
            }
        } catch (err) {
            toast.error('Failed to access file');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (error && !asset) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="p-8 text-center max-w-md">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-500">{error}</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <Card className="overflow-hidden border-0 shadow-2xl">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-center text-white">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                            <File className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold mb-1">{asset.name}</h1>
                        <p className="text-purple-100 text-sm">Shared by {asset.ownerName}</p>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        <div className="flex justify-between items-center text-sm text-gray-500 mb-8 pb-8 border-b border-gray-100">
                            <span>{asset.size}</span>
                            <span>{new Date(asset.uploadDate).toLocaleDateString()}</span>
                        </div>

                        {asset.isProtected ? (
                            <div className="space-y-6">
                                <div className="text-center space-y-2">
                                    <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
                                        <Lock className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Protected File</h3>
                                    <p className="text-sm text-gray-500">Enter PIN to access this file</p>
                                </div>

                                <div className="space-y-4">
                                    <Input
                                        id="shared-pin-input"
                                        name="shared-pin-input"
                                        autoComplete="new-password"
                                        type="password"
                                        placeholder="Enter PIN"
                                        value={pin}
                                        onChange={(e) => { setPin(e.target.value); setError(''); }}
                                        className="text-center text-lg tracking-widest h-12"
                                        maxLength={6}
                                    />
                                    <Button
                                        className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-lg shadow-lg shadow-purple-200"
                                        onClick={handleAccess}
                                    >
                                        Unlock it
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center space-y-6">
                                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500">
                                    <ShieldCheck className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-lg">Ready to Download</h3>
                                    <p className="text-gray-500">This file is publicly shared</p>
                                </div>
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg shadow-lg shadow-green-200 gap-2"
                                    onClick={() => window.open(asset.url, '_blank')}
                                >
                                    <Download className="w-5 h-5" />
                                    Download File
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-gray-50 text-center text-xs text-gray-400">
                        Secured by DAMS Vault
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
