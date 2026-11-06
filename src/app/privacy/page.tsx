import type { Metadata } from "next";
import { ZolaLogo } from "@/components/brand";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Zola handles the WhatsApp messages people send to it.",
};

const UPDATED = "6 November 2026";

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8 space-y-3">
      <h2 className="font-display text-h3 leading-tight">{title}</h2>
      <div className="space-y-3 text-base leading-relaxed text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}

/** Public page (no sign-in) — Meta needs this URL to publish the WhatsApp app. */
export default function PrivacyPage() {
  const contact = process.env.PUBLIC_CONTACT_EMAIL;
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 md:py-20">
      <ZolaLogo />
      <h1 className="font-display mt-12 text-h1 leading-[1.15]">Privacy policy</h1>
      <p className="mt-3 text-sm text-muted-foreground">Last updated {UPDATED}</p>

      <div className="mt-12 space-y-10">
        <Section title="Who we are">
          <p>
            Zola is an independent WhatsApp guide that helps people in Kenya apply for services such as a KRA PIN,
            Certificate of Good Conduct, SHA registration, HELB and passports. <strong>We are not a government office</strong>{" "}
            and are not affiliated with KRA, DCI, SHA, HELB or the Department of Immigration.
          </p>
        </Section>

        <Section title="What we collect">
          <p>When you message Zola on WhatsApp we receive and store:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>your WhatsApp number and the profile name you chose;</li>
            <li>the messages you send us and our replies;</li>
            <li>which service you asked about, and whether you asked a person to help you.</li>
          </ul>
          <p>
            <strong>We never ask for your passwords</strong> (eCitizen, iTax or any other) and you should never send them to us.
            If you choose done-for-you help, a person may ask for the documents that application needs; we use them only
            for that application.
          </p>
        </Section>

        <Section title="How we use it">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>to reply to you with the right checklist;</li>
            <li>to follow up when you ask for a person to help;</li>
            <li>to see which services people need most, so we can improve the guides.</li>
          </ul>
          <p>We do not sell your information or use it for advertising.</p>
        </Section>

        <Section title="Who else handles it">
          <p>
            Messages travel through <strong>WhatsApp (Meta)</strong>, under WhatsApp&apos;s own terms and privacy policy.
            Our records are stored with our hosting and database providers (Vercel and Neon), who process them only to run
            this service. We share information with no one else unless the law requires it.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            We keep conversations for up to 12 months after your last message, then delete them. Records of paid help are
            kept as long as the law requires for business records.
          </p>
        </Section>

        <Section id="deletion" title="Deleting your data">
          <p>
            You can ask us to delete everything we hold about you at any time. Message the same WhatsApp number with{" "}
            <strong>“Delete my data”</strong>
            {contact ? (
              <>
                {" "}or email <a className="text-primary underline-offset-4 hover:underline" href={`mailto:${contact}`}>{contact}</a>
              </>
            ) : null}
            . We will confirm and delete it within 30 days.
          </p>
          <p>You can also stop messages at any time by blocking the number in WhatsApp.</p>
        </Section>

        <Section title="Your rights">
          <p>
            Under Kenya&apos;s Data Protection Act, 2019 you can ask to see, correct or delete your personal data, and you can
            object to how it is used. To do any of these, contact us as described above.
          </p>
        </Section>
      </div>
    </main>
  );
}
