export type AdminPermission = {
  key: string
  module: string
  action: string
  label: string
}

export type AdminPermissionModule = {
  key: string
  label: string
  permissions: AdminPermission[]
}

export type AdminRoleItem = {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  usersCount: number
  permissionKeys: string[]
  permissions: AdminPermission[]
  createdAt: string
  updatedAt: string
}

export function useAdminRoles() {
  const { apiFetch } = useApi()
  const { token } = useAuth()

  async function listPermissions() {
    return apiFetch<{ modules: AdminPermissionModule[] }>('/admin/permissions', {
      token: token.value,
    })
  }

  async function listRoles() {
    return apiFetch<AdminRoleItem[]>('/admin/roles', {
      token: token.value,
    })
  }

  async function getRole(id: string) {
    return apiFetch<AdminRoleItem>(`/admin/roles/${id}`, {
      token: token.value,
    })
  }

  async function createRole(body: {
    name: string
    description?: string
    permissionKeys: string[]
  }) {
    return apiFetch<AdminRoleItem>('/admin/roles', {
      method: 'POST',
      token: token.value,
      body,
    })
  }

  async function updateRole(
    id: string,
    body: {
      name?: string
      description?: string | null
      permissionKeys?: string[]
    },
  ) {
    return apiFetch<AdminRoleItem>(`/admin/roles/${id}`, {
      method: 'PATCH',
      token: token.value,
      body,
    })
  }

  async function deleteRole(id: string) {
    return apiFetch<{ message: string }>(`/admin/roles/${id}`, {
      method: 'DELETE',
      token: token.value,
    })
  }

  return {
    listPermissions,
    listRoles,
    getRole,
    createRole,
    updateRole,
    deleteRole,
  }
}
