create policy if not exists "Allow public school submission uploads"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'classmate-submissions'
  and (storage.foldername(name))[1] in (
    'acu2031',
    'belmont2031',
    'pepperdine2031',
    'rutgers2031',
    'washu2031'
  )
);
