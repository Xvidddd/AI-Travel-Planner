"use client";

import { useEffect, useState } from "react";

let amapPromise: Promise<typeof window.AMap> | null = null;

function loadAmapScript(key: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("window is undefined"));
  }

  if (window.AMap) {
    return Promise.resolve(window.AMap);
  }

  if (!amapPromise) {
    amapPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.Geocoder,AMap.ToolBar,AMap.Scale`;
      script.async = true;
      script.onload = () => {
        if (window.AMap) {
          resolve(window.AMap);
        } else {
          reject(new Error("AMap 未正确加载"));
        }
      };
      script.onerror = () => reject(new Error("AMap 脚本加载失败"));
      document.head.appendChild(script);
    });
  }

  return amapPromise;
}

export function useAmapLoader() {
  const key = process.env.NEXT_PUBLIC_AMAP_KEY;
  const [isReady, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!key) {
      setError("缺少 NEXT_PUBLIC_AMAP_KEY");
      return;
    }

    loadAmapScript(key)
      .then(() => {
        if (isMounted) {
          setReady(true);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "AMap 加载失败");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [key]);

  return { isReady, error };
}
