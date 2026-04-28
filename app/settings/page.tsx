"use client";

import { FiSettings, FiUser, FiShield, FiBell, FiSun } from "react-icons/fi";

const SETTINGS_SECTIONS = [
    { icon: FiSettings, label: "General" },
    { icon: FiUser,     label: "Profile" },
    { icon: FiShield,   label: "Security" },
    { icon: FiBell,     label: "Notifications" },
    { icon: FiSun,      label: "Appearance" },
];

export default function SettingsPage() {
    return (
        <div className="flex h-full bg-primary text-offwhite">
            {/* Sidebar */}
            <aside className="w-56 shrink-0 border-r border-white/10 bg-white/3 backdrop-blur-xl flex flex-col gap-1 p-3">
                <p className="text-xs text-lightgrey/40 font-bold uppercase tracking-widest px-2 mb-1 mt-2">
                    Settings
                </p>
                {SETTINGS_SECTIONS.map(({ icon: Icon, label }, i) => (
                    <div
                        key={label}
                        className={`flex items-center gap-2.5 py-2 px-2 rounded-xl text-sm font-bold cursor-default transition-all border-l-2 ${
                            i === 0
                                ? "border-tertiary bg-tertiary/10 text-tertiary"
                                : "border-transparent text-lightgrey hover:bg-white/5 hover:text-offwhite"
                        }`}
                    >
                        <Icon size={15} className="shrink-0" />
                        {label}
                    </div>
                ))}
            </aside>

            {/* Main content */}
            <main className="flex-1 flex items-center justify-center relative overflow-hidden">
                {/* Decorative blur circles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-tertiary/10 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />
                </div>

                {/* Coming-soon card */}
                <div className="relative z-10 bg-secondary/20 backdrop-blur-md border border-white/10 rounded-4xl px-12 py-14 max-w-md w-full mx-6 flex flex-col items-center text-center gap-5 shadow-2xl shadow-black/20">
                    <div className="w-20 h-20 rounded-3xl bg-tertiary/10 border border-tertiary/30 flex items-center justify-center shadow-inner">
                        <FiSettings size={36} className="text-tertiary" />
                    </div>

                    <div className="flex flex-col gap-2">
                        <h1 className="text-4xl font-black tracking-tight text-offwhite">
                            Settings
                        </h1>
                        <p className="text-lightgrey text-base font-medium leading-relaxed max-w-sm">
                            Settings are on their way. Check back soon to customise your
                            profile, security, and more.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                        {SETTINGS_SECTIONS.map(({ icon: Icon, label }) => (
                            <div
                                key={label}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-lightgrey font-medium"
                            >
                                <Icon size={13} className="text-tertiary shrink-0" />
                                <span className="flex-1">{label}</span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-tertiary/15 text-tertiary border border-tertiary/20 rounded-md font-black tracking-wider uppercase">
                                    Soon
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}