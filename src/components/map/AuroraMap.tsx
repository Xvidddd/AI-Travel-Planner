"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePlannerStore } from "@/lib/store/planner";
import { useAmapLoader } from "@/lib/hooks/useAmap";
import { cn } from "@/components/ui/cn";
import { extractLocationQueries } from "@/lib/utils/location";

interface AuroraMapProps {
  className?: string;
}

type LatLngTuple = [number, number];

type MarkerSeed = {
  label: string;
  day: number;
  coord?: LatLngTuple;
  queries: string[];
};

const DEFAULT_CENTER: LatLngTuple = [116.397428, 39.90923];
const MAX_GEOCODE_BATCH = 8;

export function AuroraMap({ className }: AuroraMapProps) {
  const { isReady, error } = useAmapLoader();
  const itinerary = usePlannerStore((state) => state.itinerary);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [center, setCenter] = useState<LatLngTuple>(DEFAULT_CENTER);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<Record<string, LatLngTuple>>({});
  const [lastFocusedSeedIndex, setLastFocusedSeedIndex] = useState<number | null>(null);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  const markerSeeds = useMemo(() => {
    if (!itinerary) return [] as MarkerSeed[];

    const seeds: MarkerSeed[] = itinerary.itinerary.flatMap((day) =>
      day.activities.map((activity) => {
        const coord =
          typeof activity.lng === "number" && typeof activity.lat === "number"
            ? ([activity.lng, activity.lat] as LatLngTuple)
            : undefined;
        const rawQueries = coord
          ? []
          : extractLocationQueries(
              itinerary.destination,
              activity.poi,
              activity.address,
              activity.detail,
              activity.title,
            );
        const queries = rawQueries.map((query) => query.trim()).filter(Boolean);
        return {
          label: activity.poi ?? activity.title,
          day: day.day,
          coord,
          queries: (queries.length ? queries : [itinerary.destination]).map((query) =>
            query.trim(),
          ),
        };
      }),
    );

    if (!seeds.length && itinerary.destination) {
      seeds.push({
        label: itinerary.destination,
        day: 1,
        coord: undefined,
        queries: [itinerary.destination],
      });
    }

    if (process.env.NODE_ENV !== "production") {
      console.debug("AuroraMap marker seeds", seeds);
    }

    return seeds;
  }, [itinerary]);

  useEffect(() => {
    if (!isReady || !mapRef.current || typeof window === "undefined") {
      return;
    }

    if (!mapInstance.current) {
      const mapStyle = process.env.NEXT_PUBLIC_MAP_STYLE;
      mapInstance.current = new window.AMap.Map(mapRef.current, {
        viewMode: "3D",
        zoom: 9,
        center,
        mapStyle: mapStyle ? `amap://styles/${mapStyle}` : undefined,
      });

      window.AMap.plugin(["AMap.ToolBar", "AMap.Scale"], () => {
        mapInstance.current?.addControl(new window.AMap.ToolBar());
        mapInstance.current?.addControl(new window.AMap.Scale());
      });
    }
  }, [center, isReady]);

  useEffect(() => {
    if (!isReady || !mapInstance.current || typeof window === "undefined") {
      return;
    }
    mapInstance.current.setCenter(center);
  }, [center, isReady]);

  const destination = itinerary?.destination ?? "";

  useEffect(() => {
    if (!markerSeeds.length) {
      setCoordinates({});
      return;
    }

    const querySet = new Set<string>();
    markerSeeds
      .filter((seed) => !seed.coord)
      .forEach((seed) => {
        seed.queries.forEach((query) => {
          if (query) {
            querySet.add(query);
          }
        });
      });

    const uniqueQueries = Array.from(querySet).slice(0, MAX_GEOCODE_BATCH);

    if (!uniqueQueries.length) {
      setGeocodeError(null);
      return;
    }

    fetch("/api/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queries: uniqueQueries }),
    })
      .then((res) => res.json())
      .then((data: { coordinates?: Record<string, LatLngTuple>; error?: string }) => {
        if (data.error) {
          setGeocodeError(data.error);
          return;
        }
        setGeocodeError(null);
        if (process.env.NODE_ENV !== "production") {
          console.debug("Amap geocode coordinates", data.coordinates);
        }
        setCoordinates(data.coordinates ?? {});
      })
      .catch(() => {
        setGeocodeError("地点地理编码失败，展示示意位置");
        setCoordinates({});
      });
  }, [markerSeeds]);

  useEffect(() => {
    if (!isReady || !destination || typeof window === "undefined") {
      return;
    }

    window.AMap.plugin("AMap.Geocoder", () => {
      const geocoder = new window.AMap.Geocoder();
      geocoder.getLocation(destination, (status: string, result: any) => {
        if (status === "complete" && result.geocodes?.length) {
          const loc = result.geocodes[0].location;
          if (loc) {
            setCenter([loc.lng, loc.lat]);
            setGeoStatus(null);
          }
        } else {
          setGeoStatus("无法定位目的地，使用默认视图");
          setCenter(DEFAULT_CENTER);
        }
      });
    });
  }, [destination, isReady]);

  useEffect(() => {
    if (!isReady || !mapInstance.current || typeof window === "undefined") {
      return;
    }

    markersRef.current.forEach((marker) => {
      mapInstance.current?.remove(marker);
    });
    markersRef.current = [];

    if (!markerSeeds.length) {
      return;
    }

    let firstCoordinate: LatLngTuple | undefined;

    const markers = markerSeeds.map((seed, index) => {
      const coordinate =
        seed.coord ||
        seed.queries
          .map((query) => coordinates[query])
          .find((value): value is LatLngTuple => Array.isArray(value));
      const position = coordinate ?? generateOffsetPosition(center, index);
      if (!firstCoordinate && coordinate) {
        firstCoordinate = coordinate;
      }
      return new window.AMap.Marker({
        position,
        offset: new window.AMap.Pixel(-10, -10),
        title: seed.label,
        label: {
          content: `<div class="text-xs font-semibold">Day ${seed.day}</div>`,
          direction: "top",
        },
      });
    });

    mapInstance.current.add(markers);
    markersRef.current = markers;

    if (firstCoordinate && mapInstance.current && lastFocusedSeedIndex !== markerSeeds.length) {
      mapInstance.current.setZoom(9);
      mapInstance.current.setCenter(firstCoordinate);
      setLastFocusedSeedIndex(markerSeeds.length);
    }
  }, [center, coordinates, isReady, lastFocusedSeedIndex, markerSeeds]);

  return (
    <div className={cn("relative h-full w-full", className)}>
      {!process.env.NEXT_PUBLIC_AMAP_KEY && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 text-sm text-slate-600">
          请在 `.env` 中配置 NEXT_PUBLIC_AMAP_KEY 以加载地图
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 text-sm text-red-500">
          {error}
        </div>
      )}
      <div ref={mapRef} className="h-full w-full rounded-2xl bg-gradient-to-br from-[#bfe6ff] to-[#ecf4ff]" />
      {geoStatus && !error && (
        <div className="absolute bottom-4 left-4 rounded-2xl bg-white/80 px-4 py-2 text-xs text-slate-600 shadow">
          {geoStatus}
        </div>
      )}
      {geocodeError && (
        <div className="absolute bottom-4 right-4 rounded-2xl bg-white/80 px-4 py-2 text-xs text-slate-600 shadow">
          {geocodeError}
        </div>
      )}
    </div>
  );
}

function generateOffsetPosition(center: LatLngTuple, index: number): LatLngTuple {
  const angle = (index / Math.max(1, 10)) * Math.PI * 2;
  const radius = 0.02 + (index % 4) * 0.005;
  const [lng, lat] = center;
  const offsetLng = lng + Math.cos(angle) * radius;
  const offsetLat = lat + Math.sin(angle) * radius;
  return [offsetLng, offsetLat];
}
