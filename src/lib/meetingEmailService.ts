import emailjs from "@emailjs/browser";

const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "service_hatsz1s";
const meetingTemplateId = process.env.NEXT_PUBLIC_EMAILJS_MEETING_TEMPLATE_ID || "template_n7t9z7c";
const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "brdstEaOrNXwU4RoX";

if (typeof window !== "undefined") {
  emailjs.init(publicKey);
}

export async function sendMeetingInvitation(
  participant: { fullName: string; email: string },
  meeting: { topic: string; date: string; time: string; link: string },
  adminName: string
): Promise<void> {
  await emailjs.send(serviceId, meetingTemplateId, {
    to_email: participant.email,
    to_name: participant.fullName,
    topic: meeting.topic,
    date: meeting.date,
    time: meeting.time,
    link: meeting.link,
    admin_name: adminName,
  });
}
