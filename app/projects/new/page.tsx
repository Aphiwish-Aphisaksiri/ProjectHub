import NewProjectForm from "../_components/newProjectForm";

export const metadata = {
    title: "New Project — ProjectHub",
};

export default function NewProjectPage() {
    return (
        <div className="min-h-full text-offwhite flex items-start justify-center p-8 pt-16">
            <div className="bg-secondary/20 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 shadow-2xl shadow-black/20 w-full max-w-4xl relative overflow-hidden">
                {/* Decorative blur */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-tertiary/5 blur-3xl rounded-full pointer-events-none" />
                <div className="relative z-10">
                    <NewProjectForm />
                </div>
            </div>
        </div>
    );
}
