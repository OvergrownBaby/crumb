import { SubmitForm } from '@/components/submit-form'
import { SourceBadge } from '@/components/source-badge'

export const metadata = {
  title: 'Drop a link — Crumb',
}

export default function SubmitPage() {
  return (
    <div className="flex-1">
      <section className="mx-auto max-w-3xl px-4 sm:px-6 pt-12 pb-6">
        <p className="fm-label">Contribute</p>
        <h1 className="mt-2 fm-display text-3xl lg:text-4xl">Add a link.</h1>
        <p className="mt-3 text-[var(--muted)] max-w-xl leading-relaxed">
          Paste anything with restaurants in it. Gemini watches the video or Claude reads the
          text, finds the places, and pins them. Every pin keeps the verbatim quote &amp;
          timestamp.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 sm:px-6 pb-20">
        <SubmitForm />

        <div className="mt-10 grid sm:grid-cols-2 gap-4 text-sm">
          <div className="border border-[var(--border)] rounded-lg p-4 bg-[var(--background-elev)]">
            <div className="fm-label mb-2.5">Works on</div>
            <ul className="space-y-1.5 text-[var(--foreground-soft)]">
              <li className="flex items-center gap-2">
                <SourceBadge kind="youtube" size="sm" /> Videos, Shorts, documentaries
              </li>
              <li className="flex items-center gap-2">
                <SourceBadge kind="tiktok" size="sm" /> TikTok &amp; Reels
              </li>
              <li className="flex items-center gap-2">
                <SourceBadge kind="article" size="sm" /> Eater, Infatuation, blogs
              </li>
              <li className="flex items-center gap-2">
                <SourceBadge kind="reddit" size="sm" /> Threads &amp; AMAs
              </li>
              <li className="flex items-center gap-2">
                <SourceBadge kind="maps_list" size="sm" /> Google Maps lists
              </li>
            </ul>
          </div>
          <div className="border border-[var(--border)] rounded-lg p-4 bg-[var(--background-elev)]">
            <div className="fm-label mb-2.5">How it stays honest</div>
            <p className="text-[var(--foreground-soft)] leading-relaxed">
              Every pin keeps the verbatim quote it came from. If a video says
              &ldquo;Yat Lok&rdquo; at 1:13:50, the pin remembers that. No quote → no pin.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
