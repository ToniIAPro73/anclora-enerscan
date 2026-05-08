'use client';

import { useState } from 'react';
import { Download, Trash2, FileText } from 'lucide-react';
import { AssessmentAttachment } from '@/lib/domain/energy-assessment';
import { formatFileSize } from '@/lib/attachments';

export function AttachmentList({ assessmentId, initialAttachments }: { assessmentId: string; initialAttachments: AssessmentAttachment[] }) {
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
        <div key={attachment.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 text-[#00DC82]" />
            <div>
              <p className="text-sm font-bold text-premium">{attachment.name}</p>
              <p className="text-xs text-muted">{attachment.type} · {formatFileSize(attachment.size)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a href={`/api/assessment/${assessmentId}/attachments/${attachment.id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-muted hover:text-[#00DC82]" aria-label="Descargar">
              <Download className="h-4 w-4" />
            </a>
            <button type="button" onClick={() => removeAttachment(attachment.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-muted hover:text-[#EF4444]" aria-label="Eliminar">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
