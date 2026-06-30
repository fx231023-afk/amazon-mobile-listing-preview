import { Upload } from 'lucide-react';
import type { DragEvent } from 'react';

interface UploadDropzoneProps {
  label: string;
  helper: string;
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
}

export function UploadDropzone({
  label,
  helper,
  accept = 'image/*',
  multiple = true,
  onFiles
}: UploadDropzoneProps) {
  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith('image/'));
    if (files.length > 0) {
      onFiles(files);
    }
  };

  return (
    <label
      className="upload-zone"
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) {
            onFiles(files);
          }
          event.currentTarget.value = '';
        }}
      />
      <Upload size={18} />
      <span>{label}</span>
      <small>{helper}</small>
    </label>
  );
}
