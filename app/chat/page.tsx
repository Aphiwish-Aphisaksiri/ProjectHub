import ChatBox from "./components/chatBox";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  const userId = user?.id || "demo-user";
  const userName = user?.name || "What's on your mind today";
  return (
    <div className="bg-primary text-offwhite flex flex-col items-center justify-center h-full max-h-full p-8">
      <h1 className="text-3xl font-bold mb-4">Hi, {userName}</h1>
      <div className="w-full max-w-3xl rounded-lg shadow-lg">
        <ChatBox userId={userId} />
      </div>
    </div>
  );
}