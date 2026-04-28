"use client";

import { useRouter } from "next/navigation";
import { FiHelpCircle, FiBookOpen, FiShield } from "react-icons/fi";

const PLANNED_SECTIONS = [
    { icon: FiBookOpen, label: "Getting Started" },
    { icon: FiShield,   label: "Account & Security" },
];

export default function HelpPage() {
    const router = useRouter();

    return (
        <div className="min-h-full bg-primary text-offwhite flex items-center justify-center relative overflow-hidden">
            {/* Decorative blur circles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-tertiary/10 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />
            </div>

            {/* Card */}
            <div className="relative z-10 bg-secondary/20 backdrop-blur-md border border-white/10 rounded-4xl px-12 py-14 max-w-lg w-full mx-6 flex flex-col items-center text-center gap-6 shadow-2xl shadow-black/20">
                {/* Icon */}
                <div className="w-20 h-20 rounded-3xl bg-tertiary/10 border border-tertiary/30 flex items-center justify-center shadow-inner">
                    <FiHelpCircle size={36} className="text-tertiary" />
                </div>

                {/* Heading */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tight text-offwhite">
                        Help &amp; Support
                    </h1>
                    <p className="text-lightgrey text-base font-medium leading-relaxed max-w-sm">
                        Our help centre is coming soon. In the meantime, explore the sections
                        we&apos;re planning to cover below.
                    </p>
                </div>

                {/* Planned sections */}
                <div className="flex flex-wrap justify-center gap-3 w-full">
                    {PLANNED_SECTIONS.map(({ icon: Icon, label }) => (
                        <div
                            key={label}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-lightgrey font-medium"
                        >
                            <Icon size={14} className="text-tertiary shrink-0" />
                            {label}
                            <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-tertiary/15 text-tertiary border border-tertiary/20 rounded-md font-black tracking-wider uppercase">
                                Soon
                            </span>
                        </div>
                    ))}
                </div>

                {/* Go back */}
                <button
                    onClick={() => router.back()}
                    className="mt-2 px-6 py-3 bg-tertiary hover:opacity-90 text-offblack font-bold rounded-2xl transition-all transform hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-tertiary/20 text-sm"
                >
                    Go Back
                </button>
            </div>
        </div>
    );
}
