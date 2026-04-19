import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/server";

type MeetingProvider = "disabled" | "template" | "zoom";

type CreateMeetingInput = {
  bookingId: string;
  mentorId: string;
  mentorName: string;
  startTime: string;
  endTime: string;
};

type CreatedMeeting = {
  provider: Exclude<MeetingProvider, "disabled">;
  externalMeetingId: string | null;
  joinUrl: string;
  hostUrl: string | null;
  createdAt: string;
};

type BookingMeetingRow = {
  id: string;
  mentor_id: string;
  start_time: string;
  end_time: string;
  meeting_join_url: string | null;
};

type MentorMeetingRow = {
  id: string;
  first_name: string;
  last_name: string;
};

function resolveMeetingProvider(): MeetingProvider {
  const raw = process.env.MEETING_PROVIDER?.trim().toLowerCase();

  if (!raw || raw === "disabled" || raw === "none") {
    return "disabled";
  }

  if (raw === "template" || raw === "zoom") {
    return raw;
  }

  throw new Error(`Unsupported meeting provider: ${raw}`);
}

function parseUtcTimestamp(value: string): Date {
  return new Date(value.endsWith("Z") ? value : `${value}Z`);
}

function formatMeetingSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function applyTemplate(template: string, input: CreateMeetingInput): string {
  const startTime = parseUtcTimestamp(input.startTime).toISOString();
  const endTime = parseUtcTimestamp(input.endTime).toISOString();
  const mentorSlug = formatMeetingSlug(input.mentorName || "mentor");

  const replacements: Record<string, string> = {
    bookingId: input.bookingId,
    mentorId: input.mentorId,
    mentorName: input.mentorName,
    mentorSlug,
    startTime,
    endTime,
  };

  const resolved = template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const nextValue = replacements[key];
    return nextValue ? encodeURIComponent(nextValue) : match;
  });

  return new URL(resolved).toString();
}

async function createTemplateMeeting(
  input: CreateMeetingInput
): Promise<CreatedMeeting> {
  const joinTemplate = process.env.MEETING_URL_TEMPLATE;

  if (!joinTemplate) {
    throw new Error(
      "MEETING_URL_TEMPLATE is required when MEETING_PROVIDER=template"
    );
  }

  const hostTemplate = process.env.MEETING_HOST_URL_TEMPLATE;
  const joinUrl = applyTemplate(joinTemplate, input);
  const hostUrl = hostTemplate ? applyTemplate(hostTemplate, input) : joinUrl;

  return {
    provider: "template",
    externalMeetingId: input.bookingId,
    joinUrl,
    hostUrl,
    createdAt: new Date().toISOString(),
  };
}

async function fetchZoomAccessToken(): Promise<string> {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error(
      "ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET are required when MEETING_PROVIDER=zoom"
    );
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenUrl = new URL("https://zoom.us/oauth/token");
  tokenUrl.searchParams.set("grant_type", "account_credentials");
  tokenUrl.searchParams.set("account_id", accountId);

  const response = await fetch(tokenUrl.toString(), {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Zoom token request failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Zoom token response did not include access_token");
  }

  return data.access_token;
}

async function createZoomMeeting(
  input: CreateMeetingInput
): Promise<CreatedMeeting> {
  const hostEmail = process.env.ZOOM_HOST_EMAIL;

  if (!hostEmail) {
    throw new Error(
      "ZOOM_HOST_EMAIL is required when MEETING_PROVIDER=zoom"
    );
  }

  const accessToken = await fetchZoomAccessToken();
  const start = parseUtcTimestamp(input.startTime);
  const end = parseUtcTimestamp(input.endTime);
  const durationMinutes = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60))
  );

  const response = await fetch(
    `https://api.zoom.us/v2/users/${encodeURIComponent(hostEmail)}/meetings`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: `Bridgeee lesson: ${input.mentorName}`,
        type: 2,
        start_time: start.toISOString(),
        duration: durationMinutes,
        timezone: "UTC",
        agenda: `Booking ${input.bookingId}`,
        settings: {
          join_before_host: true,
          waiting_room: true,
          host_video: true,
          participant_video: true,
          mute_upon_entry: false,
        },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Zoom meeting creation failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as {
    id?: number | string;
    join_url?: string;
    start_url?: string;
  };

  if (!data.join_url) {
    throw new Error("Zoom meeting response did not include join_url");
  }

  return {
    provider: "zoom",
    externalMeetingId: data.id ? String(data.id) : null,
    joinUrl: data.join_url,
    hostUrl: data.start_url ?? data.join_url,
    createdAt: new Date().toISOString(),
  };
}

async function createMeetingForBooking(
  input: CreateMeetingInput
): Promise<CreatedMeeting | null> {
  const provider = resolveMeetingProvider();

  switch (provider) {
    case "disabled":
      return null;
    case "template":
      return createTemplateMeeting(input);
    case "zoom":
      return createZoomMeeting(input);
  }
}

export async function issueMeetingLinksForBooking(
  bookingId: string,
  options?: { force?: boolean }
) {
  const adminDb = createSupabaseServiceClient();

  const { data: booking, error: bookingError } = await adminDb
    .from("bookings")
    .select(
      "id, mentor_id, start_time, end_time, meeting_join_url"
    )
    .eq("id", bookingId)
    .single();

  if (bookingError) {
    console.error("Failed to fetch booking for meeting issuance:", bookingError);
    throw bookingError;
  }

  const bookingRow = booking as BookingMeetingRow | null;

  if (!bookingRow || (bookingRow.meeting_join_url && !options?.force)) {
    return;
  }

  const { data: mentor, error: mentorError } = await adminDb
    .from("mentors")
    .select("id, first_name, last_name")
    .eq("id", bookingRow.mentor_id)
    .single();

  if (mentorError) {
    console.error("Failed to fetch mentor for meeting issuance:", mentorError);
    throw mentorError;
  }

  const mentorRow = mentor as MentorMeetingRow | null;
  const mentorName = mentorRow
    ? `${mentorRow.first_name} ${mentorRow.last_name}`.trim()
    : "Mentor";

  const meeting = await createMeetingForBooking({
    bookingId: bookingRow.id,
    mentorId: bookingRow.mentor_id,
    mentorName,
    startTime: bookingRow.start_time,
    endTime: bookingRow.end_time,
  });

  if (!meeting) {
    return;
  }

  const { error: updateError } = await adminDb
    .from("bookings")
    .update({
      meeting_provider: meeting.provider,
      meeting_join_url: meeting.joinUrl,
      meeting_host_url: meeting.hostUrl,
      external_meeting_id: meeting.externalMeetingId,
      meeting_created_at: meeting.createdAt,
    })
    .eq("id", bookingRow.id)
    .is("meeting_join_url", null);

  if (updateError) {
    console.error("Failed to persist meeting links:", updateError);
    throw updateError;
  }
}

export function __testOnly__applyMeetingTemplate(
  template: string,
  input: CreateMeetingInput
) {
  return applyTemplate(template, input);
}
