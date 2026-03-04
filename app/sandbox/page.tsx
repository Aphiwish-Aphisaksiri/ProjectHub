import { prisma } from '../../lib/prisma';
import HashPassword from './components/hash';

export default async function SandboxPage() {
  const projects = await prisma.project.findMany();

  return (
    <div>
      <h1>Projects</h1>
      <HashPassword />
      <ul>
        {projects.map(project => (
          <li key={project.id}>{project.title}</li>
        ))}
      </ul>
    </div>
  );
}