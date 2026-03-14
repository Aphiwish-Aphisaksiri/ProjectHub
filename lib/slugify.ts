export function slugify(title: string): string {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")    // remove special characters like : , . ! ?
        .replace(/\s+/g, "-")        // replace spaces with hyphens
        .replace(/-+/g, "-");        // collapse multiple hyphens into one
}

// Examples:
// "SolarSync: Home Energy Optimizer" → "solarsync-home-energy-optimizer"
// "FitFlow: Virtual Yoga Instructor" → "fitflow-virtual-yoga-instructor"
// "Hello   World!!!" → "hello-world"