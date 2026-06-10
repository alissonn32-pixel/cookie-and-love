-- Allow public (anon) role to insert new orders, but not read/update/delete them
create policy "Public insert access to orders" on orders
  for insert
  with check (true);
