export const formatDate = (dateStr: string) => {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
};

export const formatTime = (firebaseTimestamp: any) => {
  if (!firebaseTimestamp) return "-";
  const date = firebaseTimestamp.toDate ? firebaseTimestamp.toDate() : new Date(firebaseTimestamp);
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

export const formatDuration = (checkIn: any, checkOut: any) => {
  if (!checkIn || !checkOut) return "-";
  const inTime = checkIn.toDate ? checkIn.toDate() : new Date(checkIn);
  const outTime = checkOut.toDate ? checkOut.toDate() : new Date(checkOut);
  const diffMs = outTime.getTime() - inTime.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${diffHrs}h ${diffMins}m`;
};

export const formatFirebaseDate = (ts: any) => {
  if (!ts) return "-";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const getLocalDateString = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
