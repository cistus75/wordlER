import type { RefObject } from 'react';
import patchNotes from './patchNotes.json';

export default function PatchNotesDialog({ dialogRef }: { dialogRef: RefObject<HTMLDialogElement | null> }) {
  return (
    <dialog className="stats-dialog patch-notes-dialog" ref={dialogRef} onCancel={() => dialogRef.current?.close()}>
      <div className="stats-content patch-notes-content">
        <button className="dialog-close" aria-label="닫기" onClick={() => dialogRef.current?.close()}>×</button>
        <h2>패치노트</h2>
        <p>wordlER의 최근 업데이트 내역입니다.</p>
        {patchNotes.map(note => (
          <article className="patch-release" key={`${note.date}-${note.title}`}>
            <time dateTime={note.date}>{note.date.replaceAll('-', '. ')}.</time>
            <h3>{note.title}</h3>
            <ul>{note.changes.map(change => <li key={change}>{change}</li>)}</ul>
          </article>
        ))}
      </div>
    </dialog>
  );
}
