import { prisma } from '@/lib/prisma';

export default async function GetProjectsDemo() {
	const projects = await prisma.project.findMany();

	return (
		<div>
			<h2>All Projects Demo</h2>
			<ul>
				{projects.map(project => (
					<li key={project.id}>
						<strong>{project.title}</strong> <br />
						<span>{project.description}</span>
					</li>
				))}
			</ul>
		</div>
	);
}
