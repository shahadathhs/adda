import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/features/site/components/page-header";
import { DocLayout, type DocSection } from "@/features/site/components/doc-layout";

export const Route = createFileRoute("/_public/privacy")({
  head: () => ({
    title: "Privacy Policy — adda",
    meta: [
      {
        name: "description",
        content: "How adda handles your data on self-hosted instances.",
      },
      { property: "og:title", content: "Privacy Policy — adda" },
      {
        property: "og:description",
        content: "How adda handles your data on self-hosted instances.",
      },
    ],
  }),
  component: PrivacyPage,
});

const SECTIONS: DocSection[] = [
  {
    id: "collect",
    title: "Information we collect",
    body: "We collect information you provide directly — such as your name, email, and username when you create an account, and the content you post or stream. We also collect usage data like your device, browser, and interactions with the service, to keep things running smoothly.",
  },
  {
    id: "use",
    title: "How we use your information",
    body: "We use your information to provide and improve the service, authenticate you, personalize your experience, communicate with you about your account, and keep the platform secure. We never sell your personal information to third parties.",
  },
  {
    id: "cookies",
    title: "Cookies and similar technologies",
    body: "We use essential cookies to keep you signed in and remember your preferences, and analytics to understand how the service is used. You can control cookies through your browser settings.",
  },
  {
    id: "sharing",
    title: "Sharing and disclosure",
    body: "We share information only with service providers who help us operate the platform (under strict confidentiality), when required by law, or to protect the rights and safety of our users and the service.",
  },
  {
    id: "retention",
    title: "Data retention",
    body: "We keep your information for as long as your account is active or as needed to provide the service. Recordings and content are retained according to your plan and our retention schedule, and deleted when no longer needed.",
  },
  {
    id: "rights",
    title: "Your rights",
    body: "Depending on where you live, you may have the right to access, correct, export, or delete your personal information, or to object to certain processing. Contact us any time to exercise these rights.",
  },
  {
    id: "security",
    title: "Security",
    body: "We use industry-standard safeguards to protect your information. No method of transmission over the internet is completely secure, but we work hard to protect your data.",
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: 'We may update this policy from time to time. We\'ll notify you of significant changes and update the "last revised" date above.',
  },
  {
    id: "contact",
    title: "Contact us",
    body: "Questions about this policy? Reach us at privacy@adda.example and we'll be happy to help.",
  },
];

function PrivacyPage() {
  return (
    <>
      <PageHeader
        badge="Legal"
        title="Privacy Policy"
        subtitle="How we collect, use, and protect your information."
      />
      <DocLayout intro="Last updated: August 2026" sections={SECTIONS} />
    </>
  );
}
