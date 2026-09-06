import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export function parseCameraRequest(text: string | null | undefined): { query: string } | null {
  const match = text?.trim().match(/^\/?(?:c[aá]maras?|cameras?|cams?)(?:\s+(.+))?$/i);
  return match ? { query: match[1]?.trim() ?? "" } : null;
}

export function normalizeCameraSearch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export async function getCameraSnapshots(query: string, allowedPropertyIds: string[] | null) {
  if (allowedPropertyIds?.length === 0) return [];
  const db = createAdminClient();
  let request = db.from("property_cameras")
    .select("name, location, snapshot_url, last_snapshot_at, property:properties(name)")
    .eq("is_active", true)
    .not("snapshot_url", "is", null)
    .order("name");
  if (allowedPropertyIds !== null) request = request.in("property_id", allowedPropertyIds);
  const { data, error } = await request;
  if (error) throw error;
  const filter = normalizeCameraSearch(query);
  return (data ?? []).flatMap((camera) => {
    const property = Array.isArray(camera.property) ? camera.property[0] : camera.property;
    const propertyName = property?.name ?? "—";
    if (filter && !normalizeCameraSearch(camera.name).includes(filter) && !normalizeCameraSearch(propertyName).includes(filter)) return [];
    try {
      const url = new URL(camera.snapshot_url);
      if (url.protocol !== "https:" || url.username || url.password) return [];
      url.searchParams.set("v", camera.last_snapshot_at ?? "latest");
      const timestamp = Date.parse(camera.last_snapshot_at ?? "");
      return [{
        name: camera.name as string,
        propertyName,
        location: camera.location as string | null,
        url: url.toString(),
        ageMinutes: Number.isFinite(timestamp) ? Math.max(0, Math.floor((Date.now() - timestamp) / 60000)) : null,
      }];
    } catch {
      return [];
    }
  });
}
