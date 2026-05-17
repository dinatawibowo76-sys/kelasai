'use client';

import { useState, useRef } from 'react';
import { ArrowLeft, Upload, FileText, Loader2, Check, Type, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import TeacherLayout from '@/components/shared/TeacherLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function UploadMaterialPage() {
  const { teacher, selectedSessionId, navigate } = useAppStore();
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [chunkCount, setChunkCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    const validTypes = ['pdf', 'docx', 'pptx', 'txt', 'doc', 'md'];
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';
    if (!validTypes.includes(ext)) {
      toast.error('Format file tidak didukung. Gunakan PDF, DOCX, PPTX, TXT, atau MD.');
      return;
    }
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleUpload = async () => {
    if (!teacher || !selectedSessionId) {
      toast.error('Data tidak lengkap');
      return;
    }
    if (!file && !textContent.trim()) {
      toast.error('Pilih file atau ketik materi');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create the file to upload
      let fileToUpload: File;
      const textToProcess = textContent.trim();

      if (file) {
        fileToUpload = file;
      } else {
        // No file, create a text file from the text content
        const blob = new Blob([textToProcess], { type: 'text/plain' });
        fileToUpload = new File([blob], 'materi-manual.txt', { type: 'text/plain' });
      }

      // Step 2: Upload with text included for processing
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('sessionId', selectedSessionId);
      formData.append('teacherId', teacher.id);
      // Send text content so backend can process it regardless of file type
      if (textToProcess) {
        formData.append('text', textToProcess);
      }

      const res = await fetch('/api/materials', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengunggah materi');

      const chunks = data.chunkCount || 0;
      setChunkCount(chunks);
      setUploadSuccess(true);

      if (chunks > 0) {
        toast.success(`Materi berhasil diunggah & diproses! ${chunks} bagian terbentuk.`);
      } else if (textToProcess) {
        toast.success('Materi berhasil diunggah!');
      } else {
        toast.success('File berhasil diunggah! Tambahkan teks materi agar bisa diproses oleh AI.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengunggah materi');
    } finally {
      setLoading(false);
    }
  };

  const isNonTextFile = file && !['txt', 'md'].includes(file.name.split('.').pop()?.toLowerCase() || '');

  return (
    <TeacherLayout title="Upload Materi">
      <Button
        variant="ghost"
        size="sm"
        className="text-gray-500 hover:text-gray-700 -ml-2 mb-4"
        onClick={() => navigate('session-detail')}
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
      </Button>

      <Card className="border-blue-100 shadow-md max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="w-5 h-5 text-blue-600" />
            Upload Materi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {uploadSuccess ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Materi Berhasil Diunggah!</h3>
              {chunkCount > 0 ? (
                <p className="text-sm text-gray-500 mb-4">
                  Materi sudah diproses menjadi {chunkCount} bagian dan siap digunakan untuk AI Chat & Quiz
                </p>
              ) : (
                <p className="text-sm text-amber-600 mb-4">
                  File terupload tapi belum ada teks yang diproses. AI Chat & Quiz membutuhkan teks materi.
                </p>
              )}
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  className="border-gray-200"
                  onClick={() => { setUploadSuccess(false); setTextContent(''); setFile(null); }}
                >
                  Upload Lagi
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => navigate('session-detail')}
                >
                  Kembali ke Sesi
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                  dragOver
                    ? 'border-blue-400 bg-blue-50'
                    : file
                    ? 'border-green-300 bg-green-50/50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.doc,.pptx,.txt,.md"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-6 h-6 text-green-600" />
                    <span className="text-sm font-medium text-green-700">{file.name}</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                      {(file.size / 1024).toFixed(1)} KB
                    </Badge>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Seret file ke sini atau klik untuk memilih</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOCX, PPTX, TXT, MD</p>
                  </>
                )}
              </div>

              {/* Info for non-text files */}
              {isNonTextFile && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    File {file.name.split('.').pop()?.toUpperCase()} tidak bisa dibaca otomatis. 
                    Silakan <strong>salin/tempel teks materi</strong> di kolom bawah agar AI bisa memproses.
                  </p>
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">atau ketik/tempel teks materi</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Text Content Area */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Type className="w-4 h-4" />
                  Teks Materi
                  <span className="text-xs text-red-500 font-normal">*wajib untuk AI Chat & Quiz</span>
                </Label>
                <Textarea
                  placeholder="Ketik atau tempelkan teks materi di sini... Ini akan diproses oleh AI untuk chat dan quiz. Contoh: Persamaan kuadrat adalah persamaan polinomial berderajat dua..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    Teks akan dibagi menjadi bagian-bagian kecil untuk AI
                  </p>
                  <p className="text-xs text-gray-400">
                    {textContent.length > 0 ? `${textContent.length} karakter` : ''}
                  </p>
                </div>
              </div>

              {/* Upload Button */}
              <Button
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl"
                onClick={handleUpload}
                disabled={loading || (!file && !textContent.trim())}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Mengunggah & Memproses...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & Proses
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </TeacherLayout>
  );
}
