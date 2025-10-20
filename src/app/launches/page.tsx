import BaseBanner from "@/components/base-banner";
import { Launch } from "@/types";

export default async function LaunchesPage() {
  const root = process.env.NEXT_PUBLIC_SPACE_X_API_ROOT;
  const path = process.env.NEXT_PUBLIC_SPACE_X_API_LAUNCHES;
  const url = `${root}${path}`;

  const res = await fetch(url);
  if (!res.ok) {
    return <div>Failed to load launches: {res.status}</div>;
  }

  const launches: Launch[] = await res.json();

  return (
    <>
      <BaseBanner title="Launches" />
      <ul className="flex flex-wrap items-center justify-center gap-2 w-full px-14 py-4 ">
        {launches.map((launch) => (
          <li key={launch.id}>
            <a href={"launches/"+launch.id} className="p-4 border-2 rounded-md flex flex-col items-start justify-between gap-2 w-xs">
                <strong>{launch.name}</strong>
            <span>{new Date(launch.date_utc).toLocaleString()}</span>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
