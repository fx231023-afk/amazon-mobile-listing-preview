import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import type { UploadedImage } from '../types';
import { getImageMetaLabel } from '../lib/listingUtils';

interface ImageSortableListProps {
  title: string;
  images: UploadedImage[];
  activeId?: string;
  onSelect?: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onDelete: (id: string) => void;
}

export function ImageSortableList({
  title,
  images,
  activeId,
  onSelect,
  onMove,
  onDelete
}: ImageSortableListProps) {
  return (
    <section className="side-section">
      <div className="section-heading">
        <h2>{title}</h2>
        <span>{images.length}</span>
      </div>

      {images.length === 0 ? (
        <div className="empty-list">暂无图片</div>
      ) : (
        <div className="image-list">
          {images.map((image, index) => (
            <article
              className={`image-row ${activeId === image.id ? 'is-active' : ''}`}
              key={image.id}
              onClick={() => onSelect?.(index)}
            >
              <img src={image.url} alt={image.name} />
              <div className="image-row-meta">
                <strong>{index + 1}. {image.name}</strong>
                <small>{getImageMetaLabel(image)}</small>
              </div>
              <div className="row-actions" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  aria-label="上移"
                  onClick={() => onMove(index, -1)}
                  disabled={index === 0}
                >
                  <ChevronUp size={15} />
                </button>
                <button
                  type="button"
                  aria-label="下移"
                  onClick={() => onMove(index, 1)}
                  disabled={index === images.length - 1}
                >
                  <ChevronDown size={15} />
                </button>
                <button type="button" aria-label="删除" onClick={() => onDelete(image.id)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
