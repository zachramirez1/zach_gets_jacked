export default function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl bg-[#141414] border border-[#262626] p-4 ${className}`}>
      {children}
    </div>
  );
}
