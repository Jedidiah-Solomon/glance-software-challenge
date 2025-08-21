"use client";

export default function Footer() {
  return (
    <footer className="w-full border-t py-4 text-center text-xs text-muted-foreground bg-card/50 mt-8">
      &copy; {new Date().getFullYear()} Developed by{" "}
      <a
        href="https://www.jedidiahsolomon.name.ng/"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-primary hover:text-primary/80"
      >
        Jedidiah Solomon
      </a>
    </footer>
  );
}
