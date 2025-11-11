"use server";

import { revalidatePath } from "next/cache";
import { PlannerPayload, generateItinerary } from "@/lib/providers/llm";
import { ItineraryPlan } from "@/types/itinerary";

export async function createItinerary(payload: PlannerPayload): Promise<ItineraryPlan> {
  const aiPlan = await generateItinerary(payload);
  const plan: ItineraryPlan = {
    destination: payload.destination,
    days: payload.days,
    budget: payload.budget,
    personas: payload.personas,
    preferences: payload.preferences,
    summary: aiPlan.summary,
    itinerary: aiPlan.days.map((day) => ({
      day: day.day,
      summary: day.focus,
      activities: day.items.map((item, index) => ({
        title: `活动 ${index + 1}`,
        detail: item,
        time: `Day ${day.day}`,
      })),
    })),
  };

  revalidatePath("/");
  return plan;
}
