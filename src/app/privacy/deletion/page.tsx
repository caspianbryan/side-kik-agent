import type { Metadata } from "next";
import Link from "next/link";
import { ZolaLogo } from "@/components/brand";

export const metadata: Metadata = {
  title: "Delete your data",
  description: "How to ask Zola to delete the information it holds about you.",
};

/** Public page (no sign-in): Meta's "data deletion instructions URL". */
export default function DataDeletionPage() {
  const contact = process.env.PUBLIC_CONTACT_EMAIL;
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 md:py-20">
      <ZolaLogo />
      <h1 className="font-display mt-12 text-h1 leading-[1.15]">Delete your data</h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        You can ask Zola to delete everything it holds about you (your number, name and messages) at any time.
      </p>

      <ol className="mt-10 space-y-5 text-base leading-relaxed">
        <li className="flex gap-4">
          <span className="font-display flex size-7 shrink-0 items-center justify-center rounded-full border text-sm text-muted-foreground">1</span>
          <p>
            Message the Zola WhatsApp number with <strong className="font-medium">“Delete my data”</strong>
            {contact ? (
              <>
                , or email{" "}
                <a className="text-primary underline-offset-4 hover:underline" href={`mailto:${contact}`}>{contact}</a>{" "}
                from or mentioning the number you used
              </>
            ) : null}
            .
          </p>
        </li>
        <li className="flex gap-4">
          <span className="font-display flex size-7 shrink-0 items-center justify-center rounded-full border text-sm text-muted-foreground">2</span>
          <p>We confirm your request on WhatsApp.</p>
        </li>
        <li className="flex gap-4">
          <span className="font-display flex size-7 shrink-0 items-center justify-center rounded-full border text-sm text-muted-foreground">3</span>
          <p>Your data is deleted within 30 days, and we message you once it&apos;s done.</p>
        </li>
      </ol>

      <p className="mt-10 text-sm text-muted-foreground">
        Records of paid help may be kept as long as the law requires for business records. See the full{" "}
        <Link href="/privacy" className="text-primary underline-offset-4 hover:underline">privacy policy</Link>.
      </p>
    </main>
  );
}
