'use client';

import { useState } from 'react';
import { Download, Eye, FileText, Image as ImageIcon, Trash2 } from 'lucide-react';
import { AssessmentAttachment } from '@/lib/domain/energy-assessment';
import { formatFileSize } from '@/lib/attachments';

function categoryLabel(attachment: AssessmentAttachment) {
  if (attachment.category === 'CEE') return 'Certificado energético aportado';
  if (attachment.category === 'EXTERIOR') return 'Imagen exterior';
  if (attachment.category === 'INTERIOR') return 'Imagen interior';
  if (attachment.type.startsWith('image/')) return 'Imagen';
  if (attachment.type === 'application/pdf') return 'PDF';
  return 'Documento';
}

export function AttachmentList({
  assessmentId,
  initialAttachments,
  canDelete = false,
}: {
  assessmentId: string;
  initialAttachments: AssessmentAttachment[];
  canDelete?: boolean;
}) {
  const [attachments, setAttachments] = useState(initialAttachments);

  async function removeAttachment(id: string) {
    const response = await fetch(`/api/assessment/${assessmentId}/attachments/${id}`, { method: 'DELETE' });
    if (response.ok) {
      setAttachments((items) => items.filter((item) => item.id !== id));
    }
  }

  if (attachments.length === 0) {
    return <p className="text-sm text-muted">No se aportó documentación adicional.</p>;
  }

  return (
    <div className="space-y-3">
      {attachments.map((attachment) => (
        <div key={attachment.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/20">
              {attachment.type.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element -- dynamic assessment attachment endpoint is not known at build time.
                <img src={`/api/assessment/${assessmentId}/attachments/${attachment.id}`} alt={attachment.caption || attachment.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  {attachment.type === 'application/pdf' ? <FileText className="h-7 w-7 text-[#FFB020]" /> : <ImageIcon className="h-7 w-7 text-[#00DC82]" />}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase text-[#00DC82]">{categoryLabel(attachment)}</span>
              <p className="mt-1 truncate text-sm font-bold text-premium">{attachment.caption || attachment.name}</p>
              <p className="truncate text-xs text-muted">{attachment.name}</p>
              <p className="text-xs text-muted">{attachment.type} · {formatFileSize(attachment.size)}</p>
            </div>
          </div>
          <div className="flex gap-2 pl-[5.75rem] sm:pl-0">
            <a href={`/api/assessment/${assessmentId}/attachments/${attachment.id}`} target="_blank" rel="noreferrer" className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-white/10 px-3 text-xs font-bold text-muted hover:text-[#00DC82]" aria-label="Ver">
              <Eye className="h-4 w-4 sm:mr-0" />
              <span className="ml-2 sm:hidden">Ver</span>
            </a>
            <a href={`/api/assessment/${assessmentId}/attachments/${attachment.id}`} className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-white/10 px-3 text-xs font-bold text-muted hover:text-[#00DC82]" aria-label="Descargar" download>
              <Download className="h-4 w-4" />
              <span className="ml-2 sm:hidden">Descargar</span>
            </a>
            {canDelete && (
              <button type="button" onClick={() => removeAttachment(attachment.id)} className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-white/10 px-3 text-xs font-bold text-muted hover:text-[#EF4444]" aria-label="Eliminar">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
