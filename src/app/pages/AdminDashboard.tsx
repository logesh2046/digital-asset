import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
    Users,
    File,
    HardDrive,
    Upload,
    Trash2,
    Shield,
    Activity,
    Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import { toast } from 'sonner';

interface Stats {
    totalUsers: number;
    totalAssets: number;
    totalStorage: number;
    typeDistribution: { _id: string; count: number }[];
    recentUploads: any[];
}

interface UserData {
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

export function AdminDashboard() {
    const { token } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<UserData[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchStats();
            fetchUsers();
        }
    }, [token]);

    const handleDeleteUser = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete user ${name}? This will delete ALL their assets!`)) return;

        try {
            const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('User deleted successfully');
                fetchStats();
                fetchUsers();
            } else {
                toast.error('Failed to delete user');
            }
        } catch (error) {
            toast.error('Error deleting user');
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-500 mt-1">System wide monitoring and management</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="p-6 border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Total Users</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalUsers || 0}</h3>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-xl">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="p-6 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Total Assets</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalAssets || 0}</h3>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <File className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="p-6 border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Storage Used</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-1">{formatBytes(stats?.totalStorage || 0)}</h3>
                            </div>
                            <div className="p-3 bg-green-50 rounded-xl">
                                <HardDrive className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm font-medium">System Role</p>
                                <h3 className="text-2xl font-bold mt-1 text-white flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-yellow-400" />
                                    ADMIN
                                </h3>
                            </div>
                            <Activity className="w-10 h-10 text-gray-600" />
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* User Management */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Users className="w-5 h-5 text-gray-500" />
                            Manage Users
                        </h2>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search users..."
                                className="pl-9 h-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <Card className="overflow-hidden border-0 shadow-lg">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                            No users found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((u) => (
                                        <TableRow key={u._id} className="hover:bg-gray-50/50">
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-gray-900">{u.name}</p>
                                                    <p className="text-xs text-gray-500">{u.email}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={u.role === 'admin' ? 'secondary' : 'outline'} className={u.role === 'admin' ? 'bg-purple-100 text-purple-700' : ''}>
                                                    {u.role.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-gray-500 text-sm">
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {u.email !== 'admin@dams.com' && ( // Prevent deleting main admin (optional)
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDeleteUser(u._id, u.name)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </div>

                {/* System Activity / Chart */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-gray-500" />
                        Asset Distribution
                    </h2>

                    <Card className="p-6">
                        <div className="space-y-4">
                            {stats?.typeDistribution.map((dist) => (
                                <div key={dist._id} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 capitalize">{dist._id || 'Unknown'}</span>
                                        <span className="font-medium text-gray-900">{dist.count}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${dist._id === 'image' ? 'bg-purple-500' :
                                                dist._id === 'video' ? 'bg-blue-500' :
                                                    dist._id === 'audio' ? 'bg-green-500' :
                                                        'bg-orange-500'
                                                }`}
                                            style={{ width: `${(dist.count / (stats?.totalAssets || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {(!stats?.typeDistribution || stats.typeDistribution.length === 0) && (
                                <p className="text-center text-gray-500 text-sm py-4">No assets uploaded yet</p>
                            )}
                        </div>
                    </Card>

                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mt-8">
                        <Upload className="w-5 h-5 text-gray-500" />
                        Recent Uploads
                    </h2>
                    <Card className="overflow-hidden">
                        <div className="divide-y divide-gray-100">
                            {stats?.recentUploads.map((upload) => (
                                <div key={upload._id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                                            <File className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate w-32">{upload.name}</p>
                                            <p className="text-xs text-gray-500">by {upload.userId?.name}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400">{new Date(upload.uploadDate).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

            </div>
        </div>
    );
}
