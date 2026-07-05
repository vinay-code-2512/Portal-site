"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "rg_seats";
const MIN_SEATS = 15;
const DECREMENT_PER_VISIT = 1;
const BASE_MIN = 20;
const BASE_RANGE = 16;

function getDailyBase(): number {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (today.getTime() - startOfYear.getTime()) / 86400000
  );
  return ((dayOfYear * 13 + today.getMonth() * 7 + today.getDate() * 3) % BASE_RANGE) + BASE_MIN;
}

interface SeatData {
  seats: number;
  date: string;
  visits: number;
  dailyBase: number;
}

export function useDynamicSeats() {
  const [seats, setSeats] = useState(25);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(STORAGE_KEY);
    let data: SeatData;

    if (stored) {
      try {
        data = JSON.parse(stored);
      } catch {
        data = { seats: getDailyBase(), date: today, visits: 0, dailyBase: getDailyBase() };
      }
    } else {
      data = { seats: getDailyBase(), date: today, visits: 0, dailyBase: getDailyBase() };
    }

    if (data.date !== today) {
      const newDailyBase = getDailyBase();
      data = {
        seats: newDailyBase,
        date: today,
        visits: 1,
        dailyBase: newDailyBase,
      };
    } else {
      data.visits += 1;
      data.seats = Math.max(MIN_SEATS, data.dailyBase - (data.visits - 1) * DECREMENT_PER_VISIT);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSeats(data.seats);
    setLoaded(true);
  }, []);

  return { seats, loaded };
}
