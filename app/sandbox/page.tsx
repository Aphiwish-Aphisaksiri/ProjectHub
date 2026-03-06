import auth, { getCurrentUser } from '@/lib/auth';
import { prisma } from '../../lib/prisma';
import HashPassword from './components/hash';

export default async function SandboxPage() {
  const projects = await prisma.project.findMany();
  const user = await getCurrentUser(); // Await the user

  return (
    <div>
      <h1>Projects</h1>
      <div>
        <strong>Current User:</strong>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>
      {/* <HashPassword /> */}
      <ul>
        {projects.map(project => (
          <li key={project.id}>{project.title}</li>
        ))}
      </ul>
    </div>
  );
}