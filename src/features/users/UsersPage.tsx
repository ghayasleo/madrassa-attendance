import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Users as UsersIcon, Pencil, Trash2, KeyRound } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import { useUsers, useDeleteUser, type UserWithMadrassa } from './api';
import { UserFormModal } from './UserFormModal';
import { ResetPasswordModal } from './ResetPasswordModal';

export function UsersPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { data: users, isLoading } = useUsers();
  const deleteUser = useDeleteUser();

  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserWithMadrassa | null>(null);
  const [resetting, setResetting] = useState<UserWithMadrassa | null>(null);
  const [deleting, setDeleting] = useState<UserWithMadrassa | null>(null);

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.madrassa?.name.toLowerCase().includes(q),
    );
  }, [users, query]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(u: UserWithMadrassa) {
    setEditing(u);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteUser.mutateAsync(deleting.id);
      toast.success(t('users.deleted'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('errors.generic'));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <PageHeader
        title={t('users.title')}
        action={
          <Button leftIcon={<Plus className="size-4" />} onClick={openCreate}>
            <span className="hidden sm:inline">{t('users.add')}</span>
          </Button>
        }
      />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute top-1/2 size-5 -translate-y-1/2 text-gray-400 start-3" />
        <Input
          placeholder={t('common.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="ps-10"
        />
      </div>

      {isLoading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="size-10" />}
          title={t('users.empty')}
          action={
            <Button leftIcon={<Plus className="size-4" />} onClick={openCreate}>
              {t('users.add')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((u) => (
            <Card key={u.id} className="flex items-start justify-between gap-2 p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900">{u.full_name}</p>
                <p className="truncate text-sm text-gray-500">{u.email}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone={u.role === 'admin' ? 'green' : 'blue'}>{t(`roles.${u.role}`)}</Badge>
                  {u.madrassa && <Badge tone="gray">{u.madrassa.name}</Badge>}
                  {!u.is_active && <Badge tone="red">{t('users.inactive')}</Badge>}
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  onClick={() => openEdit(u)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  aria-label={t('common.edit')}
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => setResetting(u)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-amber-50 hover:text-amber-600"
                  aria-label={t('users.resetPassword')}
                  title={t('users.resetPassword')}
                >
                  <KeyRound className="size-4" />
                </button>
                <button
                  onClick={() => setDeleting(u)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={t('common.delete')}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <UserFormModal open={formOpen} onClose={() => setFormOpen(false)} user={editing} />
      <ResetPasswordModal open={!!resetting} onClose={() => setResetting(null)} user={resetting} />

      <ConfirmDialog
        open={!!deleting}
        message={t('users.confirmDelete')}
        confirmLabel={t('common.delete')}
        destructive
        loading={deleteUser.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
