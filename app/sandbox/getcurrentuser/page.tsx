import { getCurrentUser } from '@/lib/auth';

export default async function GetCurrentUserDemo() {
	const user = await getCurrentUser();

	return (
		<div>
			<h2>Current User Demo</h2>
			<pre>{JSON.stringify(user, null, 2)}</pre>
			{user ? (
				<p className="text-green">You are signed in as {user.email}</p>
			) : (
				<p className="text-red">No user is signed in.</p>
			)}
		</div>
	);
}
