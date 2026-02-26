import { prisma } from '../../lib/prisma';

export default async function SandboxPage() {
  const projects = await prisma.project.findMany();

  return (
    <div>
      <h1>Projects</h1>
      <ul>
        {projects.map(project => (
          <li key={project.id}>{project.title}</li>
        ))}
      </ul>
    </div>
  );
}