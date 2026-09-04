const CodeSnippet = () => {
  return (
    <div className="mt-10 rounded-lg border border-border bg-muted/40 overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-muted/60">
        <span className="size-2.5 rounded-full bg-red-400/70" />
        <span className="size-2.5 rounded-full bg-yellow-400/70" />
        <span className="size-2.5 rounded-full bg-green-400/70" />
        <span className="ml-2 text-xs text-muted-foreground font-mono">
          app.ts
        </span>
      </div>
      <pre className="px-5 py-4 text-xs font-mono text-foreground leading-relaxed overflow-x-auto">
        <code>{`import { authRouter }          from "./routes/auth.routes"
import { userRouter }          from "./routes/user.routes"
import { authMiddleware }      from "./middlewares/auth-middleware"
import { authorizeAdmin }      from "./middlewares/auth-middleware"

// mount auth — register, login, logout, OAuth, refresh
app.use("/api/v1/auth", authRouter)

// protected user routes
app.use("/api/v1/users", authMiddleware, userRouter)

// admin-only route
app.get("/api/v1/admin/stats",
  authMiddleware,
  authorizeAdmin,
  (req, res) => res.json({ user: req.user })
)`}</code>
      </pre>
    </div>
  );
};

export default CodeSnippet;
