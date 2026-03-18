import ChatBox from "./components/chatBox";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/user/signin");
  }

  return (
    <div className="bg-primary text-offwhite flex flex-col items-center justify-center h-full max-h-full p-8">
      <h1 className="text-3xl font-bold mb-4">Hi, {user.name}</h1>
      <div className="w-full max-w-3xl rounded-lg shadow-lg">
        <ChatBox userId={user.id} />
      </div>
    </div>
  );
}