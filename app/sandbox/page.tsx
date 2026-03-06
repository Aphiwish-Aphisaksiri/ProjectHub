import fs from "fs";
import path from "path";
import Link from "next/link";

export default async function SandboxIndex() {
  const sandboxDir = path.join(process.cwd(), "app/sandbox");
  const entries = fs.readdirSync(sandboxDir, { withFileTypes: true });
  const routes = entries
    .filter(entry => entry.isDirectory())
    .filter(entry => fs.existsSync(path.join(sandboxDir, entry.name, "page.tsx")))
    .map(entry => entry.name);

  return (
    <div>
      <h2>Sandbox Routes</h2>
      {routes.map(route => (
        <Link key={route} href={`/sandbox/${route}`}>
          <button className="m-2 px-4 py-2 bg-blue-600 text-white rounded">{route}</button>
        </Link>
      ))}
    </div>
  );
}