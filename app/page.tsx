"use client";
import Link from 'next/link';
import { FiFolder, FiMessageSquare } from 'react-icons/fi';

export default function Home() {
  return (
    <main className="min-h-full w-full flex items-center justify-center bg-primary text-offwhite relative overflow-hidden">
      {/* Decorative blur circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-tertiary/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[55%] bg-secondary-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] right-[25%] w-[30%] h-[30%] bg-tertiary/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-12 px-6 max-w-4xl w-full py-24">
        {/* Badge */}
        <span className="inline-flex items-center px-4 py-1.5 bg-tertiary/10 text-tertiary border border-tertiary/20 rounded-xl text-xs font-black tracking-widest uppercase">
          ProjectHub
        </span>

        {/* Text section */}
        <div className="flex flex-col items-center text-center -mt-6">
          <h1 className="text-[48px] leading-tight font-black tracking-tighter text-offwhite/90">
            Start planning your
          </h1>
          <h1 className="text-[56px] leading-tight font-black tracking-tighter text-offwhite mb-5">
            Personal Projects
          </h1>
          <p className="text-xl text-lightgrey font-medium max-w-2xl leading-relaxed">
            An experimental app to help you plan and execute your dream projects
          </p>
        </div>

        {/* Button section */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/projects"
            className="group flex items-center justify-center gap-3 px-8 py-4 bg-tertiary hover:opacity-90 text-offblack font-black rounded-2xl text-base transition-all transform hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-tertiary/20 w-full sm:w-auto"
          >
            <FiFolder size={18} />
            Create Project
          </Link>
          <Link
            href="/chat"
            className="group flex items-center justify-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-offwhite font-black rounded-2xl text-base transition-all hover:scale-[1.03] active:scale-[0.97] backdrop-blur-sm shadow-xl shadow-black/10 w-full sm:w-auto"
          >
            <FiMessageSquare size={18} />
            Ask an AI assistant
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          {[
            { label: 'Plan Projects', desc: 'Organize your ideas into structured projects with goals and milestones', icon: FiFolder, color: 'text-tertiary', bg: 'bg-tertiary/10', border: 'border-tertiary/20' },
            { label: 'Track Tasks', desc: 'Stay on top of every task and keep momentum toward completion', icon: FiFolder, color: 'text-green', bg: 'bg-green/10', border: 'border-green/20' },
            { label: 'AI Assistant', desc: 'Get smart suggestions and contextual guidance for your work', icon: FiMessageSquare, color: 'text-secondary-400', bg: 'bg-secondary-400/10', border: 'border-secondary-400/20' },
          ].map((f, i) => (
            <div key={i} className="bg-secondary/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center gap-4 hover:border-white/15 hover:bg-secondary/60 transition-all duration-300 shadow-xl shadow-black/10">
              <div className={`${f.bg} ${f.color} w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border ${f.border}`}>
                <f.icon size={24} />
              </div>
              <span className="font-black text-offwhite tracking-tight">{f.label}</span>
              <span className="text-sm text-lightgrey font-medium leading-relaxed">{f.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}



//   return (
//     <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
//       <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
//         <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={100}
//           height={20}
//           priority
//         />
//         <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
//           <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
//             To get started, edit the page.tsx file.
//           </h1>
//           <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
//             Looking for a starting point or more instructions? Head over to{" "}
//             <a
//               href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Templates
//             </a>{" "}
//             or the{" "}
//             <a
//               href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Learning
//             </a>{" "}
//             center.
//           </p>
//         </div>
//         <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
//           <a
//             className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={16}
//               height={16}
//             />
//             Deploy Now
//           </a>
//           <a
//             className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Documentation
//           </a>
//         </div>
//       </main>
//     </div>
//   );
// }
