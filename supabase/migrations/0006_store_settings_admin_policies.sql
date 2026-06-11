-- Allow authenticated (admin) users to update store settings
create policy "Authenticated update access to store settings" on store_settings
  for update
  to authenticated
  using (true)
  with check (true);
