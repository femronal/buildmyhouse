'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CheckCircle2, User, Package, Building2 } from 'lucide-react';

export default function VerificationPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['verification-queue'],
    queryFn: async () => {
      // Fetch pending verifications - using actual backend endpoints
      const [users, materials, contractors] = await Promise.all([
        api.get('/users?verified=false').catch(() => ({ data: [] })),
        api.get('/marketplace/materials?verified=false').catch(() => ({ data: [] })),
        api.get('/marketplace/contractors?verified=false').catch(() => ({ data: [] })),
      ]);

      return {
        users: users.data || [],
        materials: materials.data || [],
        contractors: contractors.data || [],
      };
    },
  });

  const verifyUser = useMutation({
    mutationFn: (userId: string) => api.patch(`/users/${userId}`, { verified: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-queue'] });
    },
  });

  const verifyMaterial = useMutation({
    mutationFn: (materialId: string) => api.patch(`/marketplace/materials/${materialId}`, { verified: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-queue'] });
    },
  });

  const verifyContractor = useMutation({
    mutationFn: (contractorId: string) => api.patch(`/marketplace/contractors/${contractorId}`, { verified: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-queue'] });
    },
  });

  if (isLoading) {
    return <div className="p-8">Loading verification queue...</div>;
  }

  const queue = data || { users: [], materials: [], contractors: [] };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 font-poppins">Verification Workflow</h1>

      <div className="space-y-8">
        {/* Users Verification */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <User className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-semibold">Pending User Verifications ({queue.users.length})</h2>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {queue.users.map((user: any) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{user.fullName}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{user.role}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => verifyUser.mutate(user.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Verify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Materials Verification */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-semibold">Pending Material Verifications ({queue.materials.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queue.materials.map((material: any) => (
              <div key={material.id} className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold">{material.name}</h3>
                <p className="text-sm text-gray-600">{material.brand}</p>
                <p className="text-lg font-bold mt-2">${material.price}</p>
                <button
                  onClick={() => verifyMaterial.mutate(material.id)}
                  className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Verify
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Contractors Verification */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-6 h-6 text-purple-500" />
            <h2 className="text-2xl font-semibold">Pending Contractor Verifications ({queue.contractors.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {queue.contractors.map((contractor: any) => (
              <div key={contractor.id} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold">{contractor.name}</h3>
                <p className="text-gray-600">{contractor.specialty}</p>
                <p className="text-sm text-gray-500 mt-2">Type: {contractor.type}</p>
                <button
                  onClick={() => verifyContractor.mutate(contractor.id)}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Verify
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}



