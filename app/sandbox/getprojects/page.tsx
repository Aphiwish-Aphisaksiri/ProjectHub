"use client";
import { useEffect, useState } from "react";
import { Project } from "@/types";

export default function GetProjectsDemo() {
	const [projects, setProjects] = useState<Project[]>([]);

	useEffect(() => {
		async function fetchProjects() {
			const res = await fetch("/api/projects");
			if (res.ok) {
				const data = await res.json();
				setProjects(data);
			}
		}
		fetchProjects();
	}, []);

	return (
		<div>
			<h2>All Projects Demo</h2>
			<ul>
				{projects.map((project) => (
					<li key={project.id}>
						<strong>{project.title}</strong> <br />
						<span>{project.description}</span>
					</li>
				))}
			</ul>
		</div>
	);
}
