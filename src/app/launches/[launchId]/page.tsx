import BaseBanner from "@/components/base-banner";
import { RealtimeChat } from "@/components/realtime-chat";
import type { ChatMessage } from "@/hooks/use-realtime-chat";
import { Launch, type Message } from "@/types";
import { createClient } from "@/lib/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

interface Props {
    params: {
        launchId: string;
    };
}

export default async function LaunchDetailPage({ params }: Props) {
    const { launchId } = params;
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

    const supabase = await createClient();
    const { data: roomMessages, error: roomMessagesError } = await supabase
        .from("message")
        .select("*")
        .eq("room_name", launchId)
        .order("created_at", { ascending: true });

    if (roomMessagesError) {
        console.error("Failed to load room messages", roomMessagesError);
    }

    const existingMessages: ChatMessage[] = (roomMessages ?? []).map(
        (message: Message) => ({
            id: message.id.toString(),
            content: message.content ?? "",
            user: {
                name: message.user_name,
            },
            createdAt: message.created_at,
            roomName: message.room_name,
        })
    );

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
                            <RealtimeChat
                                roomName={launchId}
                                username={username}
                                messages={existingMessages}
                            />
                        </div>
                    </article>
                )}
            </section>
        </div>
    );
}
