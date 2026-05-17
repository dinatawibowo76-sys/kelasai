'use client';

import { useState, useRef } from 'react';
import { ArrowLeft, Upload, FileText, Loader2, Check, Type } from 'lucide-react';
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
  const [processing, setProcessing] = useState(false);
  const [materialId, setMaterialId] = useState<string | null>(null);
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
      let matId: string | null = null;

      // Upload file if selected
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('sessionId', selectedSessionId);
        formData.append('teacherId', teacher.id);

        const res = await fetch('/api/materials', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal mengunggah materi');

        matId = data.material.id;

        // For text files, auto-process
        if (file.name.endsWith('.txt') && data.material.extractedText) {
          // Already extracted
          setMaterialId(matId);
          setUploadSuccess(true);
          toast.success('Materi berhasil diunggah dan diproses!');
          setLoading(false);
          return;
        }
      }

      // Process the material text
      const textToProcess = textContent.trim();
      if (textToProcess) {
        setProcessing(true);
        // If we uploaded a file, process it with the typed text
        // If no file, create a virtual material entry by using the text
        if (!matId) {
          // No file uploaded, just use the text - we need a materialId
          // Create a simple text file
          const blob = new Blob([textToProcess], { type: 'text/plain' });
          const virtualFile = new File([blob], 'materi-manual.txt', { type: 'text/plain' });
          const formData = new FormData();
          formData.append('file', virtualFile);
          formData.append('sessionId', selectedSessionId);
          formData.append('teacherId', teacher.id);

          const res = await fetch('/api/materials', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Gagal mengunggah materi');
          matId = data.material.id;
        }

        // Process material
        const processRes = await fetch('/api/materials/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ materialId: matId, text: textToProcess }),
        });
        const processData = await processRes.json();
        if (!processRes.ok) throw new Error(processData.error || 'Gagal memproses materi');

        setMaterialId(matId);
        setUploadSuccess(true);
        toast.success(`Materi berhasil diproses! ${processData.chunkCount} bagian terbentuk.`);
      } else if (matId) {
        // File uploaded but no text - need to process the file
        setProcessing(true);
        // For non-text files, we can't extract text client-side easily
        // Just mark as uploaded, teacher can add text later
        setMaterialId(matId);
        setUploadSuccess(true);
        toast.success('Materi berhasil diunggah! Tambahkan teks materi untuk memproses.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengunggah materi');
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  };

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
              <p className="text-sm text-gray-500 mb-4">Materi sudah diproses dan siap digunakan siswa</p>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate('session-detail')}
              >
                Kembali ke Sesi
              </Button>
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
                    <p className="text-xs text-gray-400 mt-1">PDF, DOCX, PPTX, TXT</p>
                  </>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">atau ketik langsung</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Text Content Area */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Type className="w-4 h-4" />
                  Teks Materi
                </Label>
                <Textarea
                  placeholder="Ketik atau tempelkan teks materi di sini... Ini akan diproses oleh AI untuk chat dan quiz."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                <p className="text-xs text-gray-400">
                  Teks ini akan dibagi menjadi bagian-bagian kecil untuk AI memahami materi
                </p>
              </div>

              {/* Upload Button */}
              <Button
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl"
                onClick={handleUpload}
                disabled={loading || (!file && !textContent.trim())}
              >
                {loading || processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {processing ? 'Memproses...' : 'Mengunggah...'}
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
