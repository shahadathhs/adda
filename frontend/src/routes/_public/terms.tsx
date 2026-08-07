import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/features/site/components/page-header";
import { DocLayout, type DocSection } from "@/features/site/components/doc-layout";

export const Route = createFileRoute("/_public/terms")({
  component: TermsPage,
});

const SECTIONS: DocSection[] = [
  {
    id: "acceptance",
    title: "Acceptance of these terms",
    body: "By creating an account or using the service, you agree to these terms. If you don't agree, you may not use the service.",
  },
  {
    id: "account",
    title: "Your account",
    body: "You're responsible for keeping your account secure and for all activity under it. Provide accurate information and keep it up to date.",
  },
  {
    id: "use",
    title: "Acceptable use",
    body: "You agree not to misuse the service, including by violating the law, infringing rights, harassing others, distributing harmful content, or attempting to disrupt the service. We may remove content or suspend accounts that violate these rules.",
  },
  {
    id: "content",
    title: "Your content",
    body: "You retain ownership of content you create. You grant us the limited license needed to host, stream, and display it within the service. You're responsible for ensuring you have the rights to everything you post.",
  },
  {
    id: "streaming",
    title: "Streaming and recordings",
    body: "Live streams may be recorded automatically according to your plan and community settings. You're responsible for the content of your streams.",
  },
  {
    id: "billing",
    title: "Plans and billing",
    body: "Paid plans are billed in advance on a recurring basis. Fees aren't refundable except where required by law or stated otherwise in your plan.",
  },
  {
    id: "termination",
    title: "Termination",
    body: "You can close your account at any time. We may suspend or terminate access if you violate these terms or to protect the service.",
  },
  {
    id: "disclaimers",
    title: "Disclaimers and liability",
    body: 'The service is provided "as is." To the fullest extent permitted by law, we aren\'t liable for indirect, incidental, or consequential damages arising from your use of the service.',
  },
  {
    id: "contact",
    title: "Contact us",
    body: "Questions about these terms? Reach us at legal@adda.example and we'll be happy to help.",
  },
];

function TermsPage() {
  return (
    <>
      <PageHeader badge="Legal" title="Terms of Service" subtitle="The rules for using adda." />
      <DocLayout intro="Last updated: August 2026" sections={SECTIONS} />
    </>
  );
}
