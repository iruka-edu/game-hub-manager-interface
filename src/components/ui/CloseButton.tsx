'use client';

interface CloseButtonProps {
  href: string;
  title?: string;
}

export function CloseButton({ href, title = 'Đóng' }: CloseButtonProps) {
  return (
    <button
      onClick={() => (window.location.href = href)}
      className="ml-auto w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
      title={title}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}
