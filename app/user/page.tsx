'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { getUserProfile } from "@/components/action";
import { FiUser, FiMail, FiCalendar, FiLogOut, FiEdit3, FiFolder, FiCheckSquare, FiFileText, FiShield, FiExternalLink } from "react-icons/fi";

interface UserProfile {
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    role: string;
    createdAt: Date;
    counts: {
        projects: number;
        tasks: number;
        notes: number;
    };
}

export default function UserPage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const data = await getUserProfile();
                if (data) {
                    setProfile(data as UserProfile);
                }
            } catch (error) {
                console.error("Failed to fetch profile:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-primary flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tertiary"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
                <div className="bg-secondary/20 backdrop-blur-md p-10 rounded-4xl border border-white/10 max-w-md w-full text-center">
                    <div className="bg-red/20 text-red-400 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red/10 border border-red/30">
                        <FiUser size={40} />
                    </div>
                    <h1 className="text-3xl font-bold text-offwhite mb-3 tracking-tight">Access Restricted</h1>
                    <p className="text-lightgrey mb-8 text-lg">Your workspace is private. Please sign in to view your profile and manage your projects.</p>
                    <Link href="/user/signin" className="inline-block w-full py-4 px-8 bg-tertiary hover:opacity-90 text-offblack font-bold rounded-2xl transition-all transform hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-tertiary/20">
                        Sign In Now
                    </Link>
                </div>
            </div>
        );
    }

    const initials = profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';

    return (
        <div className="bg-primary text-offwhite pb-20 selection:bg-tertiary/30 overflow-x-hidden h-full">
            {/* Header / Hero Section */}
            <div className="relative min-h-48 bg-linear-to-br from-primary-800 via-secondary-900 to-primary-950 overflow-hidden border-b border-white/5 pt-4">
                {/* Decorative Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-tertiary/10 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150"></div>
                </div>

                <div className="max-w-6xl mx-auto px-6 h-full flex items-end pb-4 relative z-10">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-8 text-center md:text-left w-full">
                        <div className="w-40 h-40 rounded-4xl bg-secondary/30 backdrop-blur-xl border-4 border-white/10 shadow-2xl flex items-center justify-center text-5xl font-black transform -rotate-2 hover:rotate-0 transition-all duration-500 cursor-default group overflow-hidden">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.name || ""} className="w-full h-full object-cover rounded-4xl" />
                            ) : (
                                <span className="text-tertiary drop-shadow-[0_0_15px_rgba(var(--color-tertiary),0.5)] group-hover:scale-110 transition-transform">{initials}</span>
                            )}
                        </div>
                        <div className="flex-1 mb-2">
                            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-3">
                                <h1 className="text-5xl font-black tracking-tighter text-offwhite">{profile.name}</h1>
                                <span className="inline-flex items-center px-3 py-1 bg-tertiary/20 text-tertiary border border-tertiary/30 rounded-lg text-xs font-black tracking-widest uppercase h-fit mt-1 md:mt-0">
                                    {profile.role}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-lightgrey font-medium">
                                <span className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-xl text-sm border border-white/5 hover:border-white/10 transition-colors">
                                    <FiMail className="text-tertiary" /> {profile.email}
                                </span>
                                <span className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-xl text-sm lowercase border border-white/5 hover:border-white/10 transition-colors">
                                    <FiCalendar className="text-secondary-400" /> Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-3 md:mb-2">
                            <button className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all hover:scale-110 active:scale-90 shadow-xl shadow-black/20 group" title="Account Settings">
                                <FiShield className="text-tertiary group-hover:animate-spin" />
                            </button>
                            <button className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all hover:scale-110 active:scale-90 shadow-xl shadow-black/20 group" title="Edit Profile">
                                <FiEdit3 className="text-secondary-400" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 mt-4 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Stats & Dashboard */}
                    <div className="lg:col-span-8 space-y-4">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { label: 'Projects', count: profile.counts.projects, icon: FiFolder, color: 'text-tertiary', bg: 'bg-tertiary/10', border: 'border-tertiary/20' },
                                { label: 'Tasks', count: profile.counts.tasks, icon: FiCheckSquare, color: 'text-green', bg: 'bg-green/10', border: 'border-green/20' },
                                { label: 'Notes', count: profile.counts.notes, icon: FiFileText, color: 'text-secondary-400', bg: 'bg-secondary-400/10', border: 'border-secondary-400/20' }
                            ].map((stat, i) => (
                                <div key={i} className="bg-secondary/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center group hover:border-white/15 hover:bg-secondary/60 transition-all duration-300 shadow-xl shadow-black/10">
                                    <div className={`${stat.bg} ${stat.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-inner border ${stat.border}`}>
                                        <stat.icon size={28} />
                                    </div>
                                    <span className="text-4xl font-black text-offwhite mb-1 group-hover:tracking-wider transition-all">{stat.count}</span>
                                    <span className="text-lightgrey text-sm font-bold tracking-widest uppercase">{stat.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Recent Activity Card */}
                        <div className="bg-secondary/20 backdrop-blur-xl p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/5 blur-3xl rounded-full"></div>

                            <h3 className="text-2xl font-black text-offwhite mb-8 flex items-center gap-4">
                                <span className="w-1.5 h-8 bg-tertiary rounded-full shadow-[0_0_15px_rgba(var(--color-tertiary),0.6)]"></span>
                                Dashboard Overview
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <p className="text-lightgrey text-lg leading-relaxed font-medium">
                                        Your developer environment is optimized and ready. Continue building your next masterpiece or browse through your latest insights.
                                    </p>
                                    <div className="flex flex-col gap-3">
                                        <Link href="/projects" className="group flex items-center justify-between p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all">
                                            <span className="font-bold text-offwhite group-hover:translate-x-1 transition-transform">Active Projects</span>
                                            <FiExternalLink className="text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </Link>
                                        <Link href="/tasks" className="group flex items-center justify-between p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all">
                                            <span className="font-bold text-offwhite group-hover:translate-x-1 transition-transform">Tasks summary</span>
                                            <FiExternalLink className="text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </Link>
                                    </div>
                                </div>
                                <div className="bg-primary-900/50 rounded-4xl p-8 flex flex-col items-center justify-center text-center border border-white/5 relative group-hover:border-tertiary/10 transition-colors">
                                    <div className="text-tertiary/20 mb-4 group-hover:text-tertiary/40 transition-colors">
                                        <FiUser size={64} />
                                    </div>
                                    <p className="text-sm text-lightgrey italic font-medium max-w-50 leading-relaxed">
                                        The future depends on what you do today.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Actions & Info */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-secondary/40 backdrop-blur-xl p-8 rounded-4xl border border-white/5 shadow-2xl">
                            <h3 className="text-xl font-extrabold text-offwhite mb-8 tracking-tight">System Controls</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Edit Profile', icon: FiEdit3, color: 'text-tertiary' },
                                    { label: 'Security & Access', icon: FiShield, color: 'text-secondary-400' },
                                    { label: 'Preferences', icon: FiUser, color: 'text-lightgrey' }
                                ].map((item, i) => (
                                    <button key={i} className="w-full flex items-center gap-4 px-5 py-4 text-lightgrey hover:text-offwhite bg-white/5 hover:bg-white/10 rounded-2xl transition-all font-bold border border-transparent hover:border-white/10 text-left">
                                        <item.icon className={item.color} size={20} />
                                        {item.label}
                                    </button>
                                ))}
                                <div className="pt-6 mt-6 border-t border-white/5">
                                    <button
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red/10 hover:bg-red/20 text-red-400 rounded-2xl transition-all font-black tracking-widest uppercase border border-red/30 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red/5 group"
                                    >
                                        <FiLogOut className="group-hover:-translate-x-1 transition-transform" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Status Card */}
                        <div className="bg-linear-to-br from-tertiary/20 to-primary-950 p-8 rounded-4xl border border-tertiary/10 shadow-lg relative overflow-hidden">
                            <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-tertiary rounded-full blur-[60px] opacity-10"></div>
                            <h4 className="font-black text-offwhite mb-3 flex items-center gap-3 tracking-tighter">
                                <span className="flex h-2 w-2 rounded-full bg-green animate-ping"></span>
                                Workspace Status
                            </h4>
                            <p className="text-sm text-lightgrey leading-relaxed font-medium">
                                All systems operational. Your ProjectHub cloud sync is active.
                            </p>
                            <div className="mt-6 flex gap-2">
                                <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-tertiary w-full animate-pulse"></div>
                                </div>
                                <span className="text-[10px] font-black uppercase text-tertiary">Online</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}