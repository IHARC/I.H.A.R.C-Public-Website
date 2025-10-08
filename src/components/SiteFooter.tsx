export function SiteFooter() {
  return (
    <footer className="border-t border-outline/40 bg-surface px-4 py-6 text-center text-xs text-on-surface/70">
      <p>
        © {new Date().getFullYear()} IHARC — Integrated Homelessness and Addictions Response Centre.
      </p>
      <p className="mt-1 text-on-surface/60">
        Inclusive, accessible, community-first data platform.
      </p>
    </footer>
  );
}
