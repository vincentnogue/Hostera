import React, { useState } from "react";
import { User, Building2, Sparkles, Globe2, ShieldCheck } from "lucide-react";

export const ACCOUNT_TYPES = [
  { id: "business", label: "Business", icon: Building2, hint: "Manage hotels & properties" },
  { id: "individual", label: "Individual", icon: User, hint: "Book your stays" },
];

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  const [accountType, setAccountType] = useState(
    () => localStorage.getItem("hostera_account_type") || "business"
  );

  const selectType = (id) => {
    setAccountType(id);
    localStorage.setItem("hostera_account_type", id);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Form column */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
              <Icon className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
          </div>

          <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
            {/* Account type switch — Individual vs Business */}
            <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-muted rounded-full mb-6" role="tablist" aria-label="Account type">
              {ACCOUNT_TYPES.map((t) => {
                const TIcon = t.icon;
                const active = accountType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => selectType(t.id)}
                    className={`flex flex-col items-center gap-0.5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <TIcon className="w-4 h-4" aria-hidden="true" /> {t.label}
                    </span>
                    <span className={`text-[10px] font-normal ${active ? "text-primary-foreground/70" : "text-muted-foreground/70"}`}>
                      {t.hint}
                    </span>
                  </button>
                );
              })}
            </div>
            {children}
          </div>
          {footer && <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>}
        </div>
      </div>

      {/* Hotel imagery column */}
      <div className="relative hidden lg:block overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a960c26752e?q=80&w=1600&auto=format&fit=crop"
          alt="Luxury hotel suite"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E243F] via-[#0E243F]/40 to-[#0E243F]/10" />
        <div className="relative h-full flex flex-col justify-between p-12">
          <span className="inline-flex items-center gap-2 self-start px-4 py-1.5 bg-white/10 border border-white/15 backdrop-blur-sm rounded-full text-white text-xs font-semibold tracking-widest">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> HOSTERA · HOSPITALITY OS
          </span>
          <div>
            <h2 className="text-white text-3xl font-bold leading-tight max-w-md">
              Where the world's hospitality comes to run — and to stay
            </h2>
            <p className="text-white/70 mt-3 max-w-md leading-relaxed">
              Business accounts manage hotels, motels, inns and resorts worldwide. Individual accounts search
              and book their stays in seconds.
            </p>
            <div className="flex flex-wrap gap-2.5 mt-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/15 rounded-full text-xs text-white/80 backdrop-blur-sm">
                <Globe2 className="w-3.5 h-3.5 text-green-300" aria-hidden="true" /> 190+ countries
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/15 rounded-full text-xs text-white/80 backdrop-blur-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-green-300" aria-hidden="true" /> Secure by design
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}