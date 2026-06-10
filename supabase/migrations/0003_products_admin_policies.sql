-- Allow authenticated (admin) users to manage products
create policy "Authenticated insert access to products" on products
  for insert
  to authenticated
  with check (true);

create policy "Authenticated update access to products" on products
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated delete access to products" on products
  for delete
  to authenticated
  using (true);
