import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Database,
  Upload,
  Search,
  LogOut,
  File,
  Image,
  Video,
  Music,
  FileText,
  Download,
  Trash2,
  Filter,
  Grid,
  List,
  BarChart3,
  Settings,
  User,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';

interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document';
  size: string;
  uploadDate: string;
  tags: string[];
  url: string;
}

export function HomePage() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (token) {
      fetch('http://localhost:5000/api/assets', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setAssets(data))
        .catch((err) => toast.error('Failed to load assets'));
    }
  }, [token]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`http://localhost:5000/api/assets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssets(assets.filter((asset) => asset.id !== id));
      toast.success('Asset deleted successfully');
    } catch (error) {
      toast.error('Failed to delete asset');
    }
  };

  const handleOpen = (url: string) => {
    if (url && url !== '#') {
      window.open(url, '_blank');
    } else {
      toast.info('Asset URL not available');
    }
  };

  const handleDownload = (url: string, fileName: string) => {
    if (url && url !== '#') {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    } else {
      toast.info('Asset URL not available for download');
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-8 h-8" />;
      case 'video':
        return <Video className="w-8 h-8" />;
      case 'audio':
        return <Music className="w-8 h-8" />;
      case 'document':
        return <FileText className="w-8 h-8" />;
      default:
        return <File className="w-8 h-8" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'image':
        return 'from-purple-500 to-pink-500';
      case 'video':
        return 'from-blue-500 to-cyan-500';
      case 'audio':
        return 'from-green-500 to-teal-500';
      case 'document':
        return 'from-orange-500 to-red-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterType === 'all' || asset.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  DAMS
                </h1>
                <p className="text-xs text-gray-600">Digital Asset Management System</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
                <User className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-700">{user?.name}</span>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="gap-2 rounded-xl border-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Assets</p>
                  <p className="text-3xl font-bold mt-1">{assets.length}</p>
                </div>
                <File className="w-12 h-12 text-white/50" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Images</p>
                  <p className="text-3xl font-bold mt-1">
                    {assets.filter(a => a.type === 'image').length}
                  </p>
                </div>
                <Image className="w-12 h-12 text-white/50" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 bg-gradient-to-br from-green-500 to-teal-500 text-white border-0 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Audios</p>
                  <p className="text-3xl font-bold mt-1">
                    {assets.filter(a => a.type === 'audio').length}
                  </p>
                </div>
                <Music className="w-12 h-12 text-white/50" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-6 bg-gradient-to-br from-green-500 to-teal-500 text-white border-0 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Videos</p>
                  <p className="text-3xl font-bold mt-1">
                    {assets.filter(a => a.type === 'video').length}
                  </p>
                </div>
                <Video className="w-12 h-12 text-white/50" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Documents</p>
                  <p className="text-3xl font-bold mt-1">
                    {assets.filter(a => a.type === 'document').length}
                  </p>
                </div>
                <FileText className="w-12 h-12 text-white/50" />
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Actions Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search assets by name or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-2"
                />
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                className="rounded-xl"
              >
                All
              </Button>
              <Button
                variant={filterType === 'image' ? 'default' : 'outline'}
                onClick={() => setFilterType('image')}
                className="rounded-xl"
              >
                <Image className="w-4 h-4 mr-1" />
                Images
              </Button>
              <Button
                variant={filterType === 'video' ? 'default' : 'outline'}
                onClick={() => setFilterType('video')}
                className="rounded-xl"
              >
                <Video className="w-4 h-4 mr-1" />
                Videos
              </Button>
              <Button
                variant={filterType === 'document' ? 'default' : 'outline'}
                onClick={() => setFilterType('document')}
                className="rounded-xl"
              >
                <FileText className="w-4 h-4 mr-1" />
                Docs
              </Button>
              <Button
                variant={filterType === 'audio' ? 'default' : 'outline'}
                onClick={() => setFilterType('audio')}
                className="rounded-xl"
              >
                <Music className="w-4 h-4 mr-1" />
                Audio
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode('grid')}
                className={`rounded-xl ${viewMode === 'grid' ? 'bg-purple-100 border-purple-500' : ''}`}
              >
                <Grid className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode('list')}
                className={`rounded-xl ${viewMode === 'list' ? 'bg-purple-100 border-purple-500' : ''}`}
              >
                <List className="w-5 h-5" />
              </Button>
            </div>

            <Button
              onClick={() => navigate('/upload')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl shadow-lg w-full md:w-auto"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Asset
            </Button>
          </div>
        </motion.div>

        {/* Assets Grid/List */}
        {filteredAssets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <File className="w-12 h-12 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No assets found</h3>
            <p className="text-gray-600 mb-6">Upload your first asset to get started!</p>
            <Button
              onClick={() => navigate('/upload')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl shadow-lg"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Asset
            </Button>
          </motion.div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredAssets.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 hover:border-purple-300">
                  <div className={`h-40 bg-gradient-to-br ${getTypeColor(asset.type)} flex items-center justify-center`}>
                    <div className="text-white">
                      {getFileIcon(asset.type)}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-800 mb-2 truncate">
                      {asset.name}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <span>{asset.size}</span>
                      <span>{asset.uploadDate}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {asset.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="rounded-full">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-xl"
                        onClick={() => handleOpen(asset.url)}

                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Open
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-xl"
                        onClick={() => handleDownload(asset.url, asset.name)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(asset.id)}
                        className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
