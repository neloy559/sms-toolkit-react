export default function SettingsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand to-brand-hover">
                    Toolkit Settings
                </h1>
                <p className="text-text-muted">
                    Manage your developer preferences, API keys, and account details.
                </p>
            </div>
            <div className="glass-panel p-8 text-center text-text-muted">
                <p>Global Settings Will Load Here</p>
            </div>
        </div>
    );
}
