import BaseBanner from "@/components/base-banner";
import { RealtimeChat } from "@/components/realtime-chat";
import { Launch } from "@/types";
import { auth, clerkClient } from "@clerk/nextjs/server";

interface Props {
    params: {
        launchId: string;
    };
}

export default async function LaunchDetailPage({ params }: Props) {
    const { launchId } = await params;
    const root = process.env.NEXT_PUBLIC_SPACE_X_API_ROOT;
    const path = process.env.NEXT_PUBLIC_SPACE_X_API_LAUNCHES;
    const url = `${root}${path}${launchId}`;

    const res = await fetch(url);
    if (!res.ok) {
        return (
            <div>
                Failed to load launch {launchId}: {res.status}
            </div>
        );
    }

    const launch: Launch = await res.json();

    const { userId } = await auth();
    const username =
        userId && (await (await clerkClient()).users.getUser(userId)).username;

    return (
        <div className="h-screen flex flex-col">
            <BaseBanner title={launch.name} />
            <section className="w-full flex flex-col items-center gap-4 px-14 flex-1">
                <article className="w-full p-4 bg-lime-400/15 border-2 border-foreground/15 border-dashed rounded-md">
                    <ul>
                        <li>
                            <span className="font-extralight">Name:</span>{" "}
                            <span>{launch.name}</span>
                        </li>
                        <li>
                            <span className="font-extralight">Date:</span>{" "}
                            <span>{launch.date_utc}</span>
                        </li>
                    </ul>
                </article>
                {username && (
                    <article className="w-full pb-4 flex-1">
                        <div className="w-full h-full   ">
                            <RealtimeChat roomName={launchId} username={username} />
                        </div>
                    </article>
                )}
            </section>
        </div>
    );
}
