import { Camera, ExternalLink, Plus } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getAllowedPropertyIds } from "@/lib/auth/scope";
import { getActiveCountry, getCountryPropertyIds } from "@/lib/country";
import { createClient } from "@/lib/supabase/server";
import type { PropertyCamera } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteCamera, saveCamera } from "./actions";
import { CameraEditForm } from "./camera-edit-form";

type CameraWithProperty = PropertyCamera & { property: { name: string } | null };

export default async function CamerasPage() {
  const profile = await requireRole(["admin", "gestor"]);
  const allowedIds = await getAllowedPropertyIds(profile);
  const country = await getActiveCountry(allowedIds);
  const propertyIds = await getCountryPropertyIds(country, allowedIds);
  const db = await createClient();
  const [{ data: cameras }, { data: properties }] = await Promise.all([
    db.from("property_cameras").select("*, property:properties(name)").in("property_id", propertyIds).order("sort_order").order("name"),
    db.from("properties").select("id, name").in("id", propertyIds).order("name"),
  ]);
  return <div className="grid gap-8">
    <div><h1 className="text-4xl">Cámaras</h1><p className="mt-2 text-sm text-muted-foreground">Accesos operativos por propiedad. Preparado para video o snapshots cuando una cámara los permita.</p></div>
    <details className="rounded-xl border border-border bg-card p-5"><summary className="flex cursor-pointer list-none items-center gap-2 font-medium"><Plus className="size-4" /> Agregar cámara</summary><form action={saveCamera} className="mt-5 grid gap-4"><CameraFields properties={properties ?? []} /><Button className="w-fit" type="submit">Guardar cámara</Button></form></details>
    {(cameras ?? []).length === 0 ? <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Todavía no hay cámaras cargadas para este país.</CardContent></Card> : <div className="grid gap-4 md:grid-cols-2">{(cameras ?? []).map((camera) => <CameraCard key={camera.id} camera={camera as CameraWithProperty} properties={properties ?? []} />)}</div>}
  </div>;
}

function CameraCard({ camera, properties }: { camera: CameraWithProperty; properties: { id: string; name: string }[] }) {
  return <Card><CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><Camera className="size-5" />{camera.name}</CardTitle><CardDescription>{camera.property?.name}{camera.location ? ` · ${camera.location}` : ""}</CardDescription></div>{camera.access_url && <Button size="sm" variant="outline" render={<a href={camera.access_url} target="_blank" rel="noreferrer" />}><ExternalLink className="size-4" /> Abrir</Button>}</div></CardHeader><CardContent className="grid gap-3 text-sm">{camera.snapshot_url && <div className="overflow-hidden rounded-lg border border-border bg-muted"><img src={`${camera.snapshot_url}?v=${encodeURIComponent(camera.last_snapshot_at ?? "")}`} alt={`Última foto de ${camera.name}`} className="aspect-video w-full object-cover" /></div>}<p className="text-muted-foreground">{camera.provider}{camera.last_snapshot_at ? ` · foto ${relTime(camera.last_snapshot_at)}` : camera.stream_url ? " · stream configurado" : " · acceso por app/link"}</p>{camera.notes && <p>{camera.notes}</p>}<details><summary className="cursor-pointer text-muted-foreground hover:text-foreground">Editar</summary><CameraEditForm><input type="hidden" name="id" value={camera.id} /><CameraFields camera={camera} properties={properties} /></CameraEditForm></details><form action={deleteCamera}><input type="hidden" name="id" value={camera.id} /><input type="hidden" name="property_id" value={camera.property_id} /><Button type="submit" size="sm" variant="ghost" className="w-fit text-destructive hover:text-destructive">Eliminar</Button></form></CardContent></Card>;
}

function CameraFields({ properties, camera }: { properties: { id: string; name: string }[]; camera?: PropertyCamera }) {
  return <><div className="grid gap-2"><Label>Propiedad</Label><select name="property_id" defaultValue={camera?.property_id} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm" required><option value="">Elegir propiedad</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}</select></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Nombre" name="name" defaultValue={camera?.name} required /><Field label="Ubicación" name="location" defaultValue={camera?.location ?? ""} placeholder="Entrada, portón, jardín…" /></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Proveedor" name="provider" defaultValue={camera?.provider ?? "Cloud Plus"} /><Field label="Link de acceso" name="access_url" type="url" defaultValue={camera?.access_url ?? ""} placeholder="https://…" /></div><details className="text-muted-foreground"><summary className="cursor-pointer">Opciones técnicas (para cámaras compatibles)</summary><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="URL de stream" name="stream_url" defaultValue={camera?.stream_url ?? ""} placeholder="rtsp://…" /><Field label="URL de snapshot" name="snapshot_url" type="url" defaultValue={camera?.snapshot_url ?? ""} placeholder="https://…" /></div></details><div className="grid gap-2"><Label>Notas</Label><textarea name="notes" defaultValue={camera?.notes ?? ""} className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm" placeholder="Qué cubre, instrucciones o incidencias." /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={camera?.is_active ?? true} /> Activa</label></>;
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) { return <div className="grid gap-2"><Label>{label}</Label><Input {...props} /></div>; }

function relTime(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "recién";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.round(hours / 24)} d`;
}
