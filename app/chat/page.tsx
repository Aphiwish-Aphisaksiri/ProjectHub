import ChatBox from "./components/chatBox"

export default function Home() {
  // Replace with actual userId or fetch from context/auth
  const userId = "demo-user";
  return (
    <div className="bg-primary text-offwhite flex flex-col items-center justify-center h-full max-h-full">
      <h1 className="text-3xl font-bold mb-4">Chat Page</h1>
      <div className="w-full max-w-3xl bg-primary-800 rounded-lg shadow-lg">
        <ChatBox userId={userId} />
      </div>
    </div>
  );
}