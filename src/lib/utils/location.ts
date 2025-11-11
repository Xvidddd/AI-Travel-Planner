const PLACE_KEYWORDS = [
  "公园",
  "公園",
  "古城",
  "古镇",
  "寺",
  "神社",
  "神宮",
  "寺庙",
  "博物馆",
  "美术馆",
  "美術館",
  "塔",
  "馆",
  "館",
  "酒店",
  "旅馆",
  "旅店",
  "温泉",
  "温泉乡",
  "海滩",
  "乐园",
  "乐園",
  "迪士尼",
  "商场",
  "百货",
  "百貨",
  "车站",
  "車站",
  "机场",
  "機場",
  "港",
  "湾",
  "灣",
  "桥",
  "橋",
  "街",
];

const DELIMITERS = /[\s、，,。.!；;\/\\]+/;

function looksLikePlace(text: string) {
  if (text.length < 2) return false;
  return PLACE_KEYWORDS.some((keyword) => text.includes(keyword));
}

export function extractLocationQueries(
  destination: string,
  ...segments: Array<string | undefined>
): string[] {
  const queries = new Set<string>();
  const normalizedDestination = destination.trim();

  const candidates: string[] = [];
  segments
    .filter(Boolean)
    .forEach((text) => {
      const trimmed = text!.trim();
      if (!trimmed) return;
      candidates.push(trimmed);
      trimmed
        .split(DELIMITERS)
        .map((segment) => segment.trim())
        .filter((segment) => segment.length > 1)
        .forEach((segment) => {
          candidates.push(segment);
          if (normalizedDestination && !segment.includes(normalizedDestination)) {
            candidates.push(`${normalizedDestination} ${segment}`);
          }
        });
    });

  if (normalizedDestination) {
    candidates.unshift(normalizedDestination);
  }

  candidates
    .filter((candidate) => looksLikePlace(candidate) || candidate.length >= 3)
    .slice(0, 8)
    .forEach((candidate) => queries.add(candidate));

  return Array.from(queries).slice(0, 3);
}
