
  # ARENA CJU Web System Prototype

  This is a code bundle for ARENA CJU Web System Prototype. The original project is available at https://www.figma.com/design/JzSpajmPb6qmJLl0TelHOm/ARENA-CJU-Web-System-Prototype.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Supabase setup

  1. Create a new Supabase project.
  2. Open the SQL editor and run [supabase/schema.sql](supabase/schema.sql).
  3. Copy [.env.example](.env.example) to a local [.env](.env) or [.env.local](.env.local) file.
  4. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the Supabase project settings.
  5. Start the app again with `npm run dev`.

  ## Notes

  - The current frontend uses a local login screen, but the data layer already reads and writes through Supabase when the environment variables are set.
  - The schema currently allows browser-side access through the Supabase anonymous key so the prototype can work without Supabase Auth. For production, tighten the RLS policies and switch the login flow to Supabase Auth.
  