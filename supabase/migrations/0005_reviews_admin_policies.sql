-- Allow authenticated (admin) users to read and moderate reviews
create policy "Authenticated read access to reviews" on reviews
  for select
  to authenticated
  using (true);

create policy "Authenticated update access to reviews" on reviews
  for update
  to authenticated
  using (true)
  with check (true);
