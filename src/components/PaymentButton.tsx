"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { transitionTap } from "@/lib/motion";
import PaymentModal from "./PaymentModal";

interface PaymentButtonProps {
  courseId: string;
  courseName: string;
  className?: string;
  children?: React.ReactNode;
}

export default function PaymentButton({ courseId, courseName, className, children }: PaymentButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setShowModal(true)}
        whileHover={{ y: -3, scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={transitionTap}
        className={className}
      >
        {children}
      </motion.button>
      <PaymentModal
        courseId={courseId}
        courseName={courseName}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
