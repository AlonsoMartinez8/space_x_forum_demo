- (Prerequisitos) Instalar GIT y Node.js

- Crear repositorio en GitHub

- Crear next app en local

> npx create-next-app@latest space_x_forum
√ Would you like to use TypeScript? ... No / Yes
√ Which linter would you like to use? » ESLint
√ Would you like to use Tailwind CSS? ... No / Yes
√ Would you like your code inside a `src/` directory? ... No / Yes
√ Would you like to use App Router? (recommended) ... No / Yes
√ Would you like to use Turbopack? (recommended) ... No / Yes
√ Would you like to customize the import alias (`@/*` by default)? ... No / Yes
√ What import alias would you like configured? ... @/*

- Enlazar repositorio remoto (GitHub)

> git remote add origin https://github.com/AlonsoMartinez8/space_x_forum_demo.git
> git branch -M main
> git push -u origin main

- Crear ramas en GitHub: main (ya creada), develop

- Crear rama local feature/set_up_dependencies a partir de develop y publicar (push)

- Crear cuenta y proyecto en Supabase

- Instalar en local el chat en tiempo real de Supabase UI

- Conectar el proyecto de Supabase con tu proyecto local:
En Supabase; pulsar en Connect -> App Frameworks -> Next JS -> Copiar y pegar NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY en src/.env.local

- Cambiar el client.ts y el server.ts:

Client
```
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createBrowserClient(url, key)
}
```

Server
```
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // <-- usa anon aquí

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {}
      },
    },
  })
}
```

- Instalar Clerk Auth

- Cambiar el middleware.ts y posicionarlo en src/middleware.ts
```
// src/middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// sync de cookies de Supabase, sin redirecciones
async function syncSupabaseSession(request: NextRequest) {
  let res = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          res = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getClaims()
  return res
}

// Solo / y /about públicas; el resto requiere login
export default clerkMiddleware(async (auth, req) => {
  const publicRoutes = ['/', '/about']
  const path = req.nextUrl.pathname
  const {userId, redirectToSignIn} = await auth()

  if (!publicRoutes.includes(path) && !userId) {
    redirectToSignIn()
  }

  return await syncSupabaseSession(req)
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

- Usar <ClerkProvider> en layout.tsx envolviendo el <body>

- Probar dependencias instaladas en page.tsx
```
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
```
- Publicar cambios con el commit "ADD: Supabase, ShadCN & Clerk integrations"

- Crear Pull Request, revisar y mergear a DEVELOP

- Crear rutas y estilar app