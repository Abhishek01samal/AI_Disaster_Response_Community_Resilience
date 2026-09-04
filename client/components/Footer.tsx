import { GITHUB_URL } from "@/lib/constants";

const Footer = () => {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
      <p className="text-xs text-muted-foreground">
        © {new Date().getFullYear()} Auth-Simplified. Built for developers.
      </p>
      <div className="flex items-center gap-5">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          GitHub
        </a>
        <a
          href={`${GITHUB_URL}/blob/main/LICENSE`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          MIT License
        </a>
        <a
          href={`${GITHUB_URL}/issues`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Issues
        </a>
      </div>
    </div>
  );
};

export default Footer;
