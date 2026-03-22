export default function LoadingSpinner({ message = 'กำลังโหลด...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-900/95 z-[9999] gap-5">
      <div className="w-15 h-15 border-4 border-purple-400/20 border-t-purple-400 rounded-full animate-spin" />
      <p className="text-purple-400 text-base font-semibold m-0">
        {message}
      </p>
    </div>
  );
}
