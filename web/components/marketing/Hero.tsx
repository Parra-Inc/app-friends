import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/display";
import { PhoneMock } from "./PhoneMock";

export function Hero() {
  return (
    <section className="brand-gradient relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        <div>
          <Badge tone="brand">For app developers</Badge>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Trade installs with apps that aren&apos;t your competition.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            App Friends is a cross-promotion network and SDK. Show another app
            inside yours; they show yours inside theirs. Free when you pair up,
            paid when you want to reach further. Three lines of code.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button href="/auth/signin" size="lg">
              Start for free
            </Button>
            <Button href="/docs/quickstart" variant="secondary" size="lg">
              Read the docs
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted">
            No credit card. iOS &amp; React Native SDKs. Connect App Store Connect
            in a minute.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <PhoneMock
            hostName="Habit Garden"
            hostColor="#16A34A"
            promoName="Nimbus Weather"
            promoColor="#6D4AFF"
            promoTagline="The forecast, finally calm"
          />
          <div className="flex flex-col items-center text-muted" aria-hidden>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7 7h10M7 7l3-3M7 7l3 3" />
              <path d="M17 17H7m10 0-3 3m3-3-3-3" />
            </svg>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-wide">
              view for view
            </span>
          </div>
          <PhoneMock
            hostName="Nimbus Weather"
            hostColor="#6D4AFF"
            promoName="Habit Garden"
            promoColor="#16A34A"
            promoTagline="Grow one good habit"
          />
        </div>
      </div>
    </section>
  );
}
