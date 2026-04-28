import ChatBox from "./components/chatBox";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="relative bg-primary text-offwhite flex flex-col items-center h-full max-h-full overflow-hidden">
      {/* Decorative blur circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-tertiary/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-secondary-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 w-full max-w-3xl px-6 pt-8 pb-4 flex items-center gap-4">
        <div>
          <span className="inline-flex items-center px-3 py-1 bg-tertiary/10 text-tertiary border border-tertiary/20 rounded-xl text-xs font-black tracking-widest uppercase mb-2">
            AI Assistant
          </span>
          <h1 className="text-3xl font-black tracking-tighter text-offwhite">
            Hi, {user?.name ?? "there"}
          </h1>
          <p className="text-sm text-lightgrey font-medium mt-1">Ask me anything about your projects</p>
        </div>
      </div>

      {/* ChatBox */}
      <div className="relative z-10 w-full max-w-3xl flex-1 min-h-0">
        <ChatBox userId={user?.id ?? null} />
      </div>
    </div>
  );
}