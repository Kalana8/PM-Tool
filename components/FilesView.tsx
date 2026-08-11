'use client';

import React, { useState } from 'react';
import {
  Files,
  UploadCloud,
  Search,
  Filter,
  Image as ImageIcon,
  Video,
  FileText,
  Trash,
  Plus,
  Loader2,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { MediaFile, Department } from '../lib/types';

interface FilesViewProps {
  media: MediaFile[];
  departments: Department[];
  onAddMedia: (file: Omit<MediaFile, 'id' | 'dateAdded'>) => void;
}

export default function FilesView({
  media,
  departments,
  onAddMedia
}: FilesViewProps) {
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'document'>('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Determine type
    let type: 'image' | 'video' | 'document' = 'document';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';

    setIsUploading(true);
    setTimeout(() => {
      onAddMedia({
        name: file.name,
        type,
        url: type === 'video' ? 'https://www.w3schools.com/html/mov_bbb.mp4' : 'https://picsum.photos/seed/doc/800/600',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        extension: file.name.split('.').pop()?.toUpperCase() || 'FILE',
        uploadedBy: 'SARAH CONNOR',
        departmentId: 'dept-webdev'
      });
      setIsUploading(false);
    }, 1500);
  };

  const filteredMedia = media.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || file.type === filterType;
    const matchesDept = selectedDeptFilter === 'all' || file.departmentId === selectedDeptFilter;
    return matchesSearch && matchesType && matchesDept;
  });

  return (
    <div className="space-y-6 animate-fadeIn" id="files-view-container">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Corporate Shared Library
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Review, filter, and archive cross-departmental media assets, videos, and specifications.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left column sidebar filters */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-5 shadow-sm space-y-5 h-fit">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Upload Asset</h3>
            <label className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 p-6 text-center cursor-pointer transition-colors relative">
              {isUploading ? (
                <div className="space-y-2 flex flex-col items-center">
                  <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                  <span className="text-[10px] text-blue-500 font-semibold">Uploading to Department CDN...</span>
                </div>
              ) : (
                <div className="space-y-2 flex flex-col items-center">
                  <UploadCloud className="h-7 w-7 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Choose file or drag</span>
                  <span className="text-[9px] text-gray-400 leading-normal">Image, video, or documents up to 50MB</span>
                </div>
              )}
              <input type="file" className="hidden" onChange={handleSimulateUpload} disabled={isUploading} />
            </label>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-900 pt-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Media Filter</h3>
            <div className="space-y-1">
              {[
                { id: 'all', label: 'All Artifacts', count: media.length },
                { id: 'image', label: 'Graphic Elements', count: media.filter(m => m.type === 'image').length },
                { id: 'video', label: 'Video Renders', count: media.filter(m => m.type === 'video').length },
                { id: 'document', label: 'Documentation', count: media.filter(m => m.type === 'document').length }
              ].map((item) => (
                <button
                  key={item.id}
                  id={`file-type-filter-${item.id}`}
                  onClick={() => setFilterType(item.id as any)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-xs transition-colors ${
                    filterType === item.id
                      ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 font-semibold'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] font-mono text-gray-400">{item.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-900 pt-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Department Classification</h3>
            <select
              id="file-dept-select"
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right column file grid list */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              id="file-search-input"
              type="text"
              placeholder="Search shared library files by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-150 dark:border-gray-850 bg-white dark:bg-gray-950 pl-10 pr-4 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
            />
          </div>

          {filteredMedia.length === 0 ? (
            <div className="py-24 text-center bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-900">
              <Files className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-700 mb-2" />
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">No assets discovered</p>
              <p className="text-[10px] text-gray-400 mt-1">Try relaxing filters or search terms.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMedia.map((file) => {
                const dept = departments.find(d => d.id === file.departmentId);
                return (
                  <div
                    key={file.id}
                    id={`library-file-card-${file.id}`}
                    className="group rounded-2xl border border-gray-150 dark:border-gray-850 bg-white dark:bg-gray-950 p-4 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="flex gap-3 items-start">
                      <div className="rounded-xl bg-gray-50 dark:bg-gray-900 p-2 text-gray-500">
                        {file.type === 'image' ? <ImageIcon className="h-5 w-5 text-emerald-500" /> :
                         file.type === 'video' ? <Video className="h-5 w-5 text-indigo-500" /> :
                         <FileText className="h-5 w-5 text-red-500" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{file.size} • {file.extension}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-900/60 flex items-center justify-between text-[9px] text-gray-400">
                      <span>By {file.uploadedBy.split(' ')[0]} • Department: {dept?.code || 'WEB'}</span>
                      <a
                        href={file.url}
                        download
                        onClick={(e) => {
                          if (file.type === 'document') {
                            e.preventDefault();
                            alert(`Prototype Action: Downloading mock spec file '${file.name}'`);
                          }
                        }}
                        className="font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                      >
                        Source <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
