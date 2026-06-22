import { useState } from "react";
import { useSocket } from "@/context/socket-context";
import { User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function UsernamePrompt() {
  const { username, setUsername } = useSocket();
  const [input, setInput] = useState("");
  const [visible, setVisible] = useState(!username);

  if (!visible || username) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = input.trim();
    if (!name) return;
    setUsername(name);
    setVisible(false);
  }

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="bg-background rounded-2xl shadow-2xl p-8 max-w-sm w-full border">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-xl">Welcome to Yatra</h2>
            <p className="text-sm text-muted-foreground">Set a name to receive SOS alerts</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Your display name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="e.g. Priya, Ravi, Sarah…"
                className="pl-9"
                value={input}
                onChange={e => setInput(e.target.value)}
                maxLength={30}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              If anyone nearby triggers SOS, you will see an alert with their location.
            </p>
          </div>
          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={!input.trim()}>
              Save &amp; Connect
            </Button>
            <Button type="button" variant="ghost" onClick={() => setVisible(false)}>
              Skip
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
