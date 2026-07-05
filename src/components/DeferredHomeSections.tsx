"use client";

import dynamic from "next/dynamic";

const CourseGrid = dynamic(() => import("@/components/CourseGrid"), {
  loading: () => <div className="min-h-[24rem]" aria-hidden />,
});
const WhyChooseUs = dynamic(() => import("@/components/WhyChooseUs"), {
  loading: () => <div className="min-h-[24rem]" aria-hidden />,
});
const RoadmapSection = dynamic(() => import("@/components/RoadmapSection"), {
  loading: () => <div className="min-h-[24rem]" aria-hidden />,
});
const PlacementStats = dynamic(() => import("@/components/PlacementStats"), {
  loading: () => <div className="min-h-[24rem]" aria-hidden />,
});
const TrainingShowcase = dynamic(() => import("@/components/TrainingShowcase"), {
  loading: () => <div className="min-h-[24rem]" aria-hidden />,
});
const LeadForm = dynamic(() => import("@/components/LeadForm"), {
  loading: () => <div className="min-h-[16rem]" aria-hidden />,
});

const AwardsGallery = dynamic(() => import("@/components/AwardsGallery"), {
  loading: () => <div className="min-h-[20rem]" aria-hidden />,
});
const FAQSection = dynamic(() => import("@/components/FAQSection"), {
  loading: () => <div className="min-h-[16rem]" aria-hidden />,
});
const GrowthStats = dynamic(() => import("@/components/GrowthStats"), {
  loading: () => <div className="min-h-[12rem]" aria-hidden />,
});
const FinalCTA = dynamic(() => import("@/components/FinalCTA"), {
  loading: () => <div className="min-h-[16rem]" aria-hidden />,
});
const AdmissionAgreement = dynamic(() => import("@/components/AdmissionAgreement"), {
  loading: () => <div className="min-h-[12rem]" aria-hidden />,
});

export default function DeferredHomeSections() {
  return (
    <>
      <CourseGrid />
      <RoadmapSection />
      <WhyChooseUs />
      <PlacementStats />
      <TrainingShowcase />
      <AwardsGallery />
      <FAQSection />
      <AdmissionAgreement />
      <LeadForm />
      <GrowthStats />
      <FinalCTA />
    </>
  );
}
