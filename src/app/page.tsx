import { RealtimeChat } from "@/components/realtime-chat";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { auth, clerkClient } from "@clerk/nextjs/server";

export default async function Home() {
  const { userId } = await auth();
  const username =
    userId && (await (await clerkClient()).users.getUser(userId)).username;
  return (
    <main className="w-full h-screen p-20 flex flex-col items-center justify-center gap-10">
      Space X forum demo
      <SignedIn>
        <div className="flex flex-col items-center justify-center gap-10">
          <UserButton />
          {username && (
            <RealtimeChat roomName="space_x_forum_demo" username={username} />
          )}
        </div>
      </SignedIn>
      <SignedOut>
        <div className="flex items-center justify-center gap-10">
          <SignInButton mode="modal" />
          <SignUpButton mode="modal" />
        </div>
      </SignedOut>
    </main>
  );
}
