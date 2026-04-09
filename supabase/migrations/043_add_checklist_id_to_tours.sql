-- Add checklist_id to tours table for assigning a checklist to a tour
alter table public.tours
add column if not exists checklist_id uuid references public.checklists(id);

-- Add comment
comment on column public.tours.checklist_id is 'The checklist template assigned to this tour for guides to complete';
