-- Allow authenticated (admin) users to read orders
create policy "Authenticated read access to orders" on orders
  for select
  to authenticated
  using (true);
