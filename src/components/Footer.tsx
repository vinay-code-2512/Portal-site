"use client";

import { useState } from "react";
import { MapPin, Globe, Mail, Phone, Clock, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useScrollLock } from "@/lib/useScrollLock";

const menuLink = "text-[15px] text-gray-400 hover:text-[var(--neon-blue)] transition-colors";

const linkHover = "hover:text-[var(--neon-blue)] transition-colors";

const policies: Record<string, { title: string; content: string[] }> = {
  refund: {
    title: "Refund Policy – Robot Genie",
    content: [
      "At Robot Genie, we strive to provide high-quality digital learning experiences and practical skill-based education.",
      "Eligibility for Refund",
      "Refund requests are accepted only under the following conditions:",
      "• Duplicate payment made accidentally",
      "• Technical issue from our side preventing course access",
      "• Course cancellation initiated by Robot Genie",
      "Non-Refundable Cases",
      "Refunds will not be provided for:",
      "• Change of mind after purchase",
      "• Lack of participation in sessions",
      "• Failure to attend live classes",
      "• Dissatisfaction without valid reason",
      "• Downloaded or accessed digital materials",
      "Refund Processing Time",
      "Approved refunds will be processed within 7–10 business days to the original payment method.",
      "Contact for Refund Queries",
      "Email: support@robotgenie.in",
    ],
  },
  privacy: {
    title: "Privacy Policy – Robot Genie",
    content: [
      "Robot Genie respects your privacy and is committed to protecting your personal information.",
      "Information We Collect",
      "We may collect:",
      "• Name",
      "• Email Address",
      "• Phone Number",
      "• Payment Details",
      "• Course Preferences",
      "• Device & Browser Information",
      "How We Use Your Information",
      "We use your information to:",
      "• Provide course access",
      "• Improve our services",
      "• Send updates and support messages",
      "• Process payments",
      "• Share webinar and training information",
      "Data Protection",
      "We do not sell or share your personal information with unauthorized third parties.",
      "Your information is protected using secure systems and industry-standard practices.",
      "Cookies",
      "Our website may use cookies to improve user experience and website performance.",
      "Contact",
      "For privacy-related concerns: info@robotgenie.in",
    ],
  },
  terms: {
    title: "Terms & Conditions – Robot Genie",
    content: [
      "By accessing or using our website, services, or courses, you agree to comply with the following terms and conditions.",
      "Use of Services",
      "Users agree to use Robot Genie services only for lawful educational purposes.",
      "Intellectual Property",
      "All course content, designs, videos, materials, and branding are the intellectual property of Robot Genie.",
      "Unauthorized copying, resale, or redistribution is prohibited.",
      "Payments",
      "All payments must be completed before accessing premium courses or services.",
      "Account Responsibility",
      "Users are responsible for maintaining the confidentiality of their account credentials.",
      "Limitation of Liability",
      "Robot Genie is not responsible for:",
      "• Internet interruptions",
      "• Device compatibility issues",
      "• Third-party platform errors",
      "• User misuse of learning materials",
      "Changes to Terms",
      "Robot Genie reserves the right to update or modify these terms at any time.",
    ],
  },
};

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/employee") || pathname?.startsWith("/admin") || pathname?.startsWith("/paid-user")) return null;

  const [activePolicy, setActivePolicy] = useState<string | null>(null);
  const policy = activePolicy ? policies[activePolicy] : null;
  useScrollLock(!!activePolicy);

  return (
    <footer className="border-t border-white/[0.06] bg-black/40 pt-6 pb-2 shadow-[0_-30px_80px_rgba(0,240,255,0.04)]">
      <div className="w-full px-3 sm:px-4 md:px-6 flex flex-col md:flex-row justify-between items-start gap-4 md:gap-6">
        <div className="flex flex-col space-y-2 max-w-xs">
          <p id="get-in-touch" className="text-base md:text-lg font-bold text-white uppercase tracking-wider mb-1">Get In Touch</p>
          <p className="text-[14px] text-gray-400 leading-relaxed mb-1">
            We&rsquo;re here to help you with course details, admissions, technical support, webinar registration, and career guidance.
          </p>
          <p className="text-[15px] text-gray-300 font-semibold mt-0 mb-0">Contact Us</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <a href="https://www.robotgenie.in/" target="_blank" rel="noopener noreferrer" aria-label="Website" className={`text-[15px] text-gray-400 flex items-center gap-2 ${linkHover}`}>
              <Globe className="w-4 h-4 shrink-0" />
              www.robotgenie.in
            </a>
            <a href="mailto:contact@robotgenie.in" className={`text-[15px] text-gray-400 flex items-center gap-2 ${linkHover}`}>
              <Mail className="w-4 h-4 shrink-0" />
              contact@robotgenie.in
            </a>
            <a href="tel:+919891707129" className={`text-[15px] text-gray-400 flex items-center gap-2 ${linkHover}`}>
              <Phone className="w-4 h-4 shrink-0" />
              +91-9891707129
            </a>
          </div>
          <p className="text-[15px] text-gray-400 flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0" />
            Mon - Sat 10:00 AM - 7:00 PM
          </p>
          <p className="text-[15px] text-gray-400 flex items-center gap-2 mt-1">
            <MapPin className="w-4 h-4 shrink-0" />
            Laxmi Nagar, Delhi, 110092
          </p>
          <div className="flex items-center gap-3 mt-3">
            <a href="https://www.instagram.com/robot.genie?igsh=am5nN3ZiZzEwNjN3" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={`text-gray-400 ${linkHover}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a href="https://www.facebook.com/share/1CzjVPsH9A/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={`text-gray-400 ${linkHover}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a href="https://www.linkedin.com/posts/robotgenie_get-more-traffic-using-smart-backlinks-learn-activity-7460636025690910721-3Bt0?utm_source=share&utm_medium=member_desktop&rcm=ACoAADeArKEBCx09X-TpDlXrfFQ_BXVH82h8jh4" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className={`text-gray-400 ${linkHover}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
            <a href="https://youtube.com/@robotgenie?si=NmNTYV0GLHTh19QJ" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className={`text-gray-400 ${linkHover}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
                <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a href="https://medium.com/@robotgenieai/the-real-truth-about-digital-marketing-in-2026-and-why-it-still-matters-7e508b7696f9" target="_blank" rel="noopener noreferrer" aria-label="Medium" className={`text-gray-400 ${linkHover}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 4v16h24V4H0zm2 2h20v12H2V6zm2 2v8h2.5l3-4v4h2V8h-2.5l-3 4V8H4zm8.5 0v8h2v-4l3 4h2.5V8h-2v4l-3-4h-2.5z" />
              </svg>
            </a>
            <a href="https://x.com/robotgenieai" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className={`text-gray-400 ${linkHover}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="https://www.quora.com/profile/Robot-Genie-1" target="_blank" rel="noopener noreferrer" aria-label="Quora" className={`text-gray-400 ${linkHover}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.555 17.025c-.27.78-1.02 2.355-2.355 2.355-1.23 0-1.68-1.11-1.68-1.95 0-1.995 1.47-4.065 3.495-5.415.72.945 1.53 2.13 1.71 3.51l.93-.18c.24-.045.495-.075.735-.075 1.05 0 1.95.525 2.625 1.125.69.63 1.17 1.47 1.17 2.37 0 1.5-1.2 2.715-2.7 2.715-1.275 0-2.37-.87-2.73-2.085l-.6-.75c-.315.165-.645.27-1.005.27-.075 0-.165 0-.24-.015zm1.335-5.805c-2.55-1.395-4.515-3.99-4.515-6.975 0-1.35.39-2.67 1.095-3.75C8.505 1.17 6.78 1.995 5.55 3.24 3.9 4.935 3 7.17 3 9.465c0 1.845.54 3.645 1.53 5.205 1.095 1.695 2.655 3.045 4.41 3.885v-.015c0 .42.345.765.765.765h.09c.21 0 .42-.075.57-.225.15-.135.24-.33.24-.54 0-.27-.135-.51-.345-.645-.33-.27-.78-.69-.78-1.35 0-1.125 1.035-2.25 2.07-2.25.09 0 .195.015.285.03l.555.105c.015-.18.045-.36.09-.54l.93-2.34zm-1.74 4.935c.57.465 1.32.96 2.145.96.645 0 1.17-.525 1.17-1.17 0-.48-.3-.915-.72-1.11-.255-.12-.54-.195-.84-.195-.42 0-.84.12-1.23.33-.45.225-.825.555-1.125.945.21.12.39.255.6.405v-.165z" />
              </svg>
            </a>
          </div>

<div className="mt-4 pt-4 border-t border-white/[0.06]">
  <div className="flex flex-wrap items-center  gap-1 text-[13px] text-gray-400">

    <a
      href="/MSME%20CERTIFICATE.pdf"
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0"
    >
      <Image
        src="/msme.webp"
        alt="MSME Certificate"
        width={45}
        height={45}
        sizes="45px"
        className="rounded-md cursor-pointer"
        loading="lazy"
      />
    </a>

    <div className="w-[55px] h-[55px] rounded-full overflow-hidden shrink-0">
      <Image
        src="/certified.webp"
        alt="Certified"
        width={45}
        height={45}
        sizes="45px"
        className="w-full h-full object-cover object-top scale-150"
        loading="lazy"
      />
    </div>

    <a
      href="/GST%20CERTIFICATE.pdf"
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0"
    >
      <Image
        src="/gst.webp"
        alt="GST Logo"
        width={55}
        height={55}
        sizes="55px"
        className="rounded-md cursor-pointer"
        style={{ backgroundColor: "var(--neon-blue)" }}
        loading="lazy"
      />
    </a>

    <div className="hidden sm:block h-10 w-px bg-white/[0.08]" />

    <p>
      <span className="text-gray-300 font-medium">GST:</span>{" "}
      07BZAPA2918M1ZH
    </p>

    <p>
      <span className="text-gray-300 font-medium">UDYAM:</span>{" "}
      UDYAM-DL-02-0061089
    </p>

    <p>
      <span className="text-gray-300 font-medium">ISO Certificate:</span>{" "}
      QMS/RB/9001/90076
    </p>

  </div>
</div>
        </div>

        <div className="text-center md:text-left">
          <p className="text-base md:text-lg font-bold text-white uppercase tracking-wider mb-1">Menu</p>
          <nav className="flex flex-col space-y-2">
            <a href="/" className={menuLink}>Home</a>
            <a href="/about/" className={menuLink}>About Us</a>
            <a href="/blog/" className={menuLink}>Blog</a>
            <a href="/#why-choose-us" className={menuLink}>Why Choose Us</a>
            <a href="/placements/" className={menuLink}>Placements</a>
            <a href="/#contact" className={menuLink}>Reserve Your Seat</a>
          </nav>
        </div>

        <div className="text-center md:text-left">
          <p className="text-base md:text-lg font-bold text-white uppercase tracking-wider mb-1">Our Courses</p>
          <nav className="flex flex-col space-y-2">
            <span className={menuLink}>Digital Marketing Course (3 Month)</span>
            <span className={menuLink}>Digital Marketing Diploma (9 Month)</span>
            <span className={menuLink}>Digital Marketing Course After 12th</span>
            <span className={menuLink}>Website Designing Course</span>
            <span className={menuLink}>Graphic Designing Course</span>
            <span className={menuLink}>PPC Training in Delhi</span>
          </nav>
        </div>

        <div className="text-center md:text-right">
          <p className="mt-3 text-[15px] text-gray-500">Career training aligned to how enterprise teams hire, review, and promote.</p>
          <div className="mt-3 flex flex-wrap justify-center md:justify-end gap-x-4 gap-y-1 text-[14px] text-gray-500">
            <button onClick={() => setActivePolicy("refund")} className="hover:text-[var(--neon-blue)] transition-colors cursor-pointer">Refund Policy</button>
            <span className="hidden md:inline text-gray-600">|</span>
            <Link href="/privacy" className="hover:text-[var(--neon-blue)] transition-colors">Privacy Policy</Link>
            <span className="hidden md:inline text-gray-600">|</span>
            <Link href="/terms" className="hover:text-[var(--neon-blue)] transition-colors">Terms &amp; Conditions</Link>
          </div>

          <div className="mt-4 pt-4 border-t border-white/[0.06]" />
        </div>
      </div>

      {policy && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          onClick={() => setActivePolicy(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0a0a1a]/95 backdrop-blur-xl p-6 md:p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent rounded-2xl pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full opacity-50" />
            <button
              onClick={() => setActivePolicy(null)}
              aria-label="Close policy modal"
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08] hover:border-[var(--neon-blue)]/30 transition-all duration-200"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
            <div className="relative z-10">
              <h2 className="text-xl font-bold text-white mb-5">{policy.title}</h2>
              <div className="space-y-3 text-[15px] text-gray-300 leading-relaxed">
                {policy.content.map((line, i) => {
                  if (line.startsWith("•")) {
                    return <p key={i} className="flex items-start gap-2.5 ml-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--neon-blue)]/60 shrink-0 mt-2 shadow-[0_0_6px_rgba(0,240,255,0.3)]" /><span>{line.slice(2)}</span></p>;
                  }
                  if (line.endsWith(":") || line.endsWith("?") || line === "Use of Services" || line === "Intellectual Property" || line === "Payments" || line === "Account Responsibility" || line === "Limitation of Liability" || line === "Changes to Terms" || line.startsWith("Contact") || line.startsWith("Eligibility") || line.startsWith("Non-Refundable") || line.startsWith("Refund Processing") || line.startsWith("Information") || line.startsWith("How We Use") || line.startsWith("Data Protection") || line.startsWith("Cookies")) {
                    return <p key={i} className="text-[var(--neon-blue)] font-semibold pt-3">{line}</p>;
                  }
                  const emailParts = line.split(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
                  if (emailParts.length > 1) {
                    return (
                      <p key={i}>
                        {emailParts.map((part, j) =>
                          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(part)
                            ? <a key={j} href={`mailto:${part}`} className="text-[var(--neon-blue)] hover:underline">{part}</a>
                            : part
                        )}
                      </p>
                    );
                  }
                  return <p key={i}>{line}</p>;
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
