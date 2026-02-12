import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Upload,
  ArrowLeft,
  File,
  Image,
  Video,
  Music,
  FileText,
  X,
  Check,
  Database,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

interface FilePreview {
  file: File;
  type: 'image' | 'video' | 'audio' | 'document';
  preview?: string;
}

export function UploadPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const getFileType = (file: File): 'image' | 'video' | 'audio' | 'document' => {
    const type = file.type;
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const processFiles = (files: File[]) => {
    const newFiles = files.map((file) => {
      const type = getFileType(file);
      const preview = type === 'image' ? URL.createObjectURL(file) : undefined;
      return { file, type, preview };
    });
    setSelectedFiles([...selectedFiles, ...newFiles]);
    if (!fileName && newFiles.length > 0) {
      setFileName(newFiles[0].file.name);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (newFiles.length === 0) {
      setFileName('');
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFiles[0].file);
      formData.append('name', fileName || selectedFiles[0].file.name);
      formData.append('type', selectedFiles[0].type);
      formData.append('size', `${(selectedFiles[0].file.size / (1024 * 1024)).toFixed(2)} MB`);
      formData.append('tags', JSON.stringify(tags));

      const res = await fetch('http://localhost:5000/api/assets/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      toast.success('Asset uploaded successfully!');
      navigate('/home');
    } catch (error) {
      toast.error('Failed to upload asset');
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-6 h-6" />;
      case 'video':
        return <Video className="w-6 h-6" />;
      case 'audio':
        return <Music className="w-6 h-6" />;
      case 'document':
        return <FileText className="w-6 h-6" />;
      default:
        return <File className="w-6 h-6" />;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/80 backdrop-blur-lg border-b border-gray-200"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/home')}
                className="rounded-xl"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Upload Assets
                </h1>
                <p className="text-sm text-gray-600">Add new files to your digital library</p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Drop Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-8 border-2 border-dashed hover:border-solid transition-all">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative ${
                  isDragging ? 'bg-gradient-to-br from-indigo-50 to-purple-50' : ''
                } rounded-2xl transition-colors`}
              >
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                />
                <div className="text-center py-12">
                  <motion.div
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="inline-block"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                      <Upload className="w-10 h-10 text-white" />
                    </div>
                  </motion.div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Drop files here or click to browse
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Support for images, videos, audio files, and documents
                  </p>
                  <div className="flex justify-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="rounded-full">
                      <Image className="w-3 h-3 mr-1" />
                      Images
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">
                      <Video className="w-3 h-3 mr-1" />
                      Videos
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">
                      <Music className="w-3 h-3 mr-1" />
                      Audio
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">
                      <FileText className="w-3 h-3 mr-1" />
                      Documents
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Selected Files</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedFiles.map((filePreview, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative"
                    >
                      <Card className="p-4 border-2 hover:border-purple-300 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 bg-gradient-to-br ${getTypeColor(filePreview.type)} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <div className="text-white">
                              {getFileIcon(filePreview.type)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">
                              {filePreview.file.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {(filePreview.file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeFile(index)}
                            className="rounded-full h-8 w-8 flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Asset Details Form */}
          {selectedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">Asset Details</h3>
                <div className="space-y-6">
                  {/* File Name */}
                  <div>
                    <Label htmlFor="fileName" className="text-gray-700">Asset Name</Label>
                    <Input
                      id="fileName"
                      type="text"
                      placeholder="Enter asset name"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      className="mt-2 h-12 rounded-xl border-2"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description" className="text-gray-700">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Add a description for this asset..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-2 rounded-xl border-2 min-h-[100px]"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <Label htmlFor="tags" className="text-gray-700">Tags</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="tags"
                        type="text"
                        placeholder="Add a tag..."
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        className="h-12 rounded-xl border-2"
                      />
                      <Button
                        type="button"
                        onClick={addTag}
                        variant="outline"
                        className="rounded-xl px-6"
                      >
                        Add
                      </Button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="rounded-full px-3 py-1 cursor-pointer hover:bg-red-100"
                            onClick={() => removeTag(tag)}
                          >
                            {tag}
                            <X className="w-3 h-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Submit Buttons */}
          {selectedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex gap-4"
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/home')}
                className="flex-1 h-12 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUploading}
                className="flex-1 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg"
              >
                {isUploading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-2"
                    >
                      <Upload className="w-5 h-5" />
                    </motion.div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Upload Asset
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </form>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">Upload Tips</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Maximum file size: 50MB per file</li>
                  <li>• Add relevant tags to make your assets easy to find</li>
                  <li>• Use descriptive names for better organization</li>
                  <li>• Supported formats: Images (JPG, PNG, GIF), Videos (MP4, AVI), Audio (MP3, WAV), Documents (PDF, DOC, TXT)</li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
